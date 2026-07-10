import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationType,
  PostKind,
  PostVisibility,
  Prisma,
} from '@prisma/client';
import {
  AuthUser,
  CreateCommentInput,
  CreatePostInput,
  PostDetail,
  PostSummary,
  RoleCode,
  ROLE_HIERARCHY,
} from '@rotary/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { buildMeta, resolvePagination } from '../../common/utils/pagination';
import { sanitizePlainText } from '../../common/utils/sanitize';
import { LogsService } from '../logs/logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';

interface FeedQuery {
  page?: number;
  limit?: number;
  kind?: PostKind;
  commissionId?: string;
}

type PostWithRelations = Prisma.PostGetPayload<{
  include: {
    author: true;
    commission: true;
    likes: true;
    _count: { select: { comments: true; likes: true } };
  };
}>;

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logsService: LogsService,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async getFeed(user: AuthUser, query: FeedQuery) {
    const { skip, take, page, limit } = resolvePagination(query);
    const where = await this.buildFeedFilter(user, query);

    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: this.summaryInclude(),
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: items.map((post) => this.toSummary(post, user.id)),
      meta: buildMeta(page, limit, total),
    };
  }

  async findById(user: AuthUser, id: string): Promise<PostDetail> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        ...this.summaryInclude(),
        comments: {
          where: { parentId: null },
          include: {
            author: true,
            _count: { select: { replies: true } },
          },
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
      },
    });

    if (!post) throw new NotFoundException('Publication introuvable');
    await this.assertCanView(user, post);

    return {
      ...this.toSummary(post, user.id),
      comments: post.comments.map((c) => ({
        id: c.id,
        content: c.content,
        author: {
          id: c.author.id,
          firstName: c.author.firstName,
          lastName: c.author.lastName,
        },
        parentId: c.parentId,
        replyCount: c._count.replies,
        createdAt: c.createdAt.toISOString(),
      })),
    };
  }

  async create(user: AuthUser, input: CreatePostInput, ipAddress?: string) {
    const kind = (input.kind as PostKind) ?? PostKind.MEMBER_POST;
    this.assertCanCreateKind(user, kind);

    if (input.visibility === PostVisibility.COMMISSION && !input.commissionId) {
      throw new ForbiddenException('Une commission est requise pour cette visibilité');
    }

    if (input.commissionId) {
      await this.assertCommissionMember(user, input.commissionId);
    }

    const post = await this.prisma.post.create({
      data: {
        authorId: user.id,
        kind,
        content: sanitizePlainText(input.content),
        attachments: input.attachments ?? [],
        linkUrl: input.linkUrl,
        visibility: (input.visibility as PostVisibility) ?? PostVisibility.ALL_MEMBERS,
        commissionId: input.commissionId,
        repostOfId: input.repostOfId,
      },
      include: this.summaryInclude(),
    });

    await this.notifyNewPost(post, user);
    await this.logsService.logActivity({
      userId: user.id,
      action: 'POST_CREATE',
      resource: 'posts',
      resourceId: post.id,
      ipAddress,
    });

    this.realtimeService.emitFeedUpdate();
    return this.toSummary(post, user.id);
  }

  async toggleLike(user: AuthUser, postId: string, ipAddress?: string) {
    const post = await this.getPostOrThrow(postId);
    await this.assertCanView(user, post);

    const existing = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId: user.id } },
    });

    if (existing) {
      await this.prisma.postLike.delete({
        where: { postId_userId: { postId, userId: user.id } },
      });
    } else {
      await this.prisma.postLike.create({
        data: { postId, userId: user.id },
      });

      if (post.authorId !== user.id) {
        const notification = await this.notificationsService.create({
          userId: post.authorId,
          type: NotificationType.POST_LIKE,
          title: `${user.firstName} ${user.lastName} a aimé votre publication`,
          resource: 'posts',
          resourceId: postId,
        });
        this.realtimeService.notifyUser(post.authorId, notification);
      }
    }

    await this.logsService.logActivity({
      userId: user.id,
      action: existing ? 'POST_UNLIKE' : 'POST_LIKE',
      resource: 'posts',
      resourceId: postId,
      ipAddress,
    });

    const refreshed = await this.prisma.post.findUniqueOrThrow({
      where: { id: postId },
      include: this.summaryInclude(),
    });

    this.realtimeService.emitFeedUpdate();
    return this.toSummary(refreshed, user.id);
  }

  async addComment(
    user: AuthUser,
    postId: string,
    input: CreateCommentInput,
    ipAddress?: string,
  ) {
    const post = await this.getPostOrThrow(postId);
    await this.assertCanView(user, post);

    const comment = await this.prisma.postComment.create({
      data: {
        postId,
        authorId: user.id,
        content: sanitizePlainText(input.content),
        parentId: input.parentId,
      },
      include: { author: true, _count: { select: { replies: true } } },
    });

    if (post.authorId !== user.id) {
      const notification = await this.notificationsService.create({
        userId: post.authorId,
        type: NotificationType.POST_COMMENT,
        title: `${user.firstName} ${user.lastName} a commenté votre publication`,
        body: input.content.slice(0, 120),
        resource: 'posts',
        resourceId: postId,
      });
      this.realtimeService.notifyUser(post.authorId, notification);
    }

    await this.logsService.logActivity({
      userId: user.id,
      action: 'POST_COMMENT',
      resource: 'posts',
      resourceId: postId,
      ipAddress,
    });

    this.realtimeService.emitFeedUpdate();

    return {
      id: comment.id,
      content: comment.content,
      author: {
        id: comment.author.id,
        firstName: comment.author.firstName,
        lastName: comment.author.lastName,
      },
      parentId: comment.parentId,
      replyCount: comment._count.replies,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  private async buildFeedFilter(user: AuthUser, query: FeedQuery): Promise<Prisma.PostWhereInput> {
    const commissionIds = await this.getUserCommissionIds(user.id);

    const visibilityFilter: Prisma.PostWhereInput = {
      OR: [
        { visibility: PostVisibility.ALL_MEMBERS },
        {
          visibility: PostVisibility.COMMISSION,
          commissionId: { in: commissionIds },
        },
      ],
    };

    const filters: Prisma.PostWhereInput[] = [visibilityFilter];
    if (query.kind) filters.push({ kind: query.kind });
    if (query.commissionId) filters.push({ commissionId: query.commissionId });

    return { AND: filters };
  }

  private async assertCanView(user: AuthUser, post: PostWithRelations) {
    if (post.visibility === PostVisibility.ALL_MEMBERS) return;

    if (!post.commissionId) {
      throw new ForbiddenException('Publication non accessible');
    }

    const membership = await this.prisma.commissionMember.findUnique({
      where: {
        userId_commissionId: {
          userId: user.id,
          commissionId: post.commissionId,
        },
      },
    });

    const isAdmin = user.roles.includes(RoleCode.ADMIN);
    if (!membership && !isAdmin) {
      throw new ForbiddenException('Publication réservée à la commission');
    }
  }

  private assertCanCreateKind(user: AuthUser, kind: PostKind) {
    if (kind === PostKind.MEMBER_POST) return;

    const level = Math.max(...user.roles.map((r) => ROLE_HIERARCHY[r] ?? 0), 0);
    const required = ROLE_HIERARCHY[RoleCode.SECRETARY];
    if (level < required) {
      throw new ForbiddenException(
        'Seuls les responsables et administrateurs peuvent publier des annonces officielles',
      );
    }
  }

  private async assertCommissionMember(user: AuthUser, commissionId: string) {
    if (user.roles.includes(RoleCode.ADMIN)) return;

    const membership = await this.prisma.commissionMember.findUnique({
      where: {
        userId_commissionId: { userId: user.id, commissionId },
      },
    });
    if (!membership) {
      throw new ForbiddenException('Vous n\'appartenez pas à cette commission');
    }
  }

  private async notifyNewPost(post: PostWithRelations, author: AuthUser) {
    const members = await this.prisma.user.findMany({
      where: {
        isActive: true,
        id: { not: author.id },
      },
      select: { id: true },
      take: 100,
    });

    for (const member of members) {
      const notification = await this.notificationsService.create({
        userId: member.id,
        type: NotificationType.NEW_POST,
        title:
          post.kind === PostKind.MEMBER_POST
            ? `Nouvelle publication de ${author.firstName} ${author.lastName}`
            : `Nouvelle ${post.kind === PostKind.ANNOUNCEMENT ? 'annonce' : 'actualité'} du club`,
        body: post.content.slice(0, 120),
        resource: 'posts',
        resourceId: post.id,
      });
      this.realtimeService.notifyUser(member.id, notification);
    }
  }

  private async getUserCommissionIds(userId: string) {
    const memberships = await this.prisma.commissionMember.findMany({
      where: { userId },
      select: { commissionId: true },
    });
    return memberships.map((m) => m.commissionId);
  }

  private async getPostOrThrow(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: this.summaryInclude(),
    });
    if (!post) throw new NotFoundException('Publication introuvable');
    return post;
  }

  private summaryInclude() {
    return {
      author: true,
      commission: true,
      likes: true,
      _count: { select: { comments: true, likes: true } },
    } as const;
  }

  private toSummary(post: PostWithRelations, currentUserId: string): PostSummary {
    return {
      id: post.id,
      kind: post.kind,
      content: post.content,
      attachments: (post.attachments as PostSummary['attachments']) ?? null,
      linkUrl: post.linkUrl,
      visibility: post.visibility,
      commissionId: post.commissionId,
      commissionName: post.commission?.name ?? null,
      author: {
        id: post.author.id,
        firstName: post.author.firstName,
        lastName: post.author.lastName,
      },
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      likedByMe: post.likes.some((l) => l.userId === currentUserId),
      repostOfId: post.repostOfId,
      createdAt: post.createdAt.toISOString(),
    };
  }
}
