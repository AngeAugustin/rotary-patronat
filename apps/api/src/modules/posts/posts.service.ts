import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContentReportTarget,
  NotificationType,
  PostKind,
  PostVisibility,
  Prisma,
} from '@prisma/client';
import {
  AuthUser,
  CreateCommentInput,
  CreateContentReportInput,
  CreatePostInput,
  PostComment,
  PostDetail,
  PostSummary,
  RoleCode,
  ROLE_HIERARCHY,
  UpdatePostInput,
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
            replies: {
              include: {
                author: true,
                _count: { select: { replies: true } },
              },
              orderBy: { createdAt: 'asc' },
              take: 30,
            },
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
      comments: post.comments.map((c) => this.toComment(c)),
    };
  }

  async create(user: AuthUser, input: CreatePostInput, ipAddress?: string) {
    const kind = (input.kind as PostKind) ?? PostKind.MEMBER_POST;
    this.assertCanCreateKind(user, kind);

    const visibility =
      (input.visibility as PostVisibility) ?? PostVisibility.ALL_MEMBERS;
    const commissionId =
      visibility === PostVisibility.COMMISSION
        ? input.commissionId || undefined
        : undefined;

    if (visibility === PostVisibility.COMMISSION && !commissionId) {
      throw new BadRequestException('Une commission est requise pour cette visibilité');
    }

    if (commissionId) {
      await this.assertCommissionMember(user, commissionId);
    }

    if (input.repostOfId) {
      const original = await this.getPostOrThrow(input.repostOfId);
      await this.assertCanView(user, original);
    }

    const linkUrl = input.linkUrl?.trim() ? input.linkUrl.trim() : undefined;
    const content = sanitizePlainText(input.content);

    const post = await this.prisma.post.create({
      data: {
        authorId: user.id,
        kind,
        content,
        attachments: input.attachments ?? [],
        linkUrl,
        visibility,
        commissionId,
        repostOfId: input.repostOfId,
      },
      include: this.summaryInclude(),
    });

    await this.notifyNewPost(post, user);
    await this.notifyMentions(content, user, post.id);
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

  async update(
    user: AuthUser,
    postId: string,
    input: UpdatePostInput,
    ipAddress?: string,
  ) {
    const existing = await this.getPostOrThrow(postId);
    if (existing.authorId !== user.id && !user.roles.includes(RoleCode.ADMIN)) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos publications');
    }

    const kind = (input.kind as PostKind | undefined) ?? existing.kind;
    this.assertCanCreateKind(user, kind);

    const visibility =
      (input.visibility as PostVisibility | undefined) ?? existing.visibility;
    let commissionId =
      input.commissionId === ''
        ? null
        : input.commissionId === undefined
          ? existing.commissionId
          : input.commissionId;

    if (visibility === PostVisibility.ALL_MEMBERS) {
      commissionId = null;
    }

    if (visibility === PostVisibility.COMMISSION && !commissionId) {
      throw new BadRequestException('Une commission est requise pour cette visibilité');
    }

    if (commissionId) {
      await this.assertCommissionMember(user, commissionId);
    }

    const linkUrl =
      input.linkUrl === undefined
        ? existing.linkUrl
        : input.linkUrl?.trim()
          ? input.linkUrl.trim()
          : null;

    const content =
      input.content !== undefined
        ? sanitizePlainText(input.content)
        : existing.content;

    const post = await this.prisma.post.update({
      where: { id: postId },
      data: {
        kind,
        content,
        attachments: input.attachments ?? undefined,
        linkUrl,
        visibility,
        commissionId,
      },
      include: this.summaryInclude(),
    });

    await this.logsService.logActivity({
      userId: user.id,
      action: 'POST_UPDATE',
      resource: 'posts',
      resourceId: post.id,
      ipAddress,
    });

    this.realtimeService.emitFeedUpdate();
    return this.toSummary(post, user.id);
  }

  async deleteOwn(user: AuthUser, postId: string, ipAddress?: string) {
    const existing = await this.getPostOrThrow(postId);
    if (existing.authorId !== user.id && !user.roles.includes(RoleCode.ADMIN)) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos publications');
    }

    await this.prisma.post.delete({ where: { id: postId } });
    await this.logsService.logActivity({
      userId: user.id,
      action: 'POST_DELETE',
      resource: 'posts',
      resourceId: postId,
      ipAddress,
    });
    this.realtimeService.emitFeedUpdate();
    return { id: postId };
  }

  async report(
    user: AuthUser,
    input: CreateContentReportInput,
    ipAddress?: string,
  ) {
    if (input.targetType === 'POST') {
      const post = await this.getPostOrThrow(input.targetId);
      await this.assertCanView(user, post);
    } else {
      const comment = await this.prisma.postComment.findUnique({
        where: { id: input.targetId },
        include: { post: { include: this.summaryInclude() } },
      });
      if (!comment) throw new NotFoundException('Commentaire introuvable');
      await this.assertCanView(user, comment.post);
    }

    try {
      const report = await this.prisma.contentReport.create({
        data: {
          reporterId: user.id,
          targetType: input.targetType as ContentReportTarget,
          targetId: input.targetId,
          reason: input.reason ? sanitizePlainText(input.reason) : null,
        },
      });

      await this.logsService.logActivity({
        userId: user.id,
        action: 'CONTENT_REPORT',
        resource: input.targetType === 'POST' ? 'posts' : 'post_comments',
        resourceId: input.targetId,
        ipAddress,
        metadata: { reportId: report.id },
      });

      return { id: report.id };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Vous avez déjà signalé ce contenu');
      }
      throw error;
    }
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

    if (input.parentId) {
      const parent = await this.prisma.postComment.findUnique({
        where: { id: input.parentId },
      });
      if (!parent || parent.postId !== postId) {
        throw new BadRequestException('Commentaire parent invalide');
      }
    }

    const content = sanitizePlainText(input.content);

    const comment = await this.prisma.postComment.create({
      data: {
        postId,
        authorId: user.id,
        content,
        parentId: input.parentId,
      },
      include: {
        author: true,
        _count: { select: { replies: true } },
        replies: {
          include: {
            author: true,
            _count: { select: { replies: true } },
          },
          take: 0,
        },
      },
    });

    if (post.authorId !== user.id) {
      const notification = await this.notificationsService.create({
        userId: post.authorId,
        type: NotificationType.POST_COMMENT,
        title: `${user.firstName} ${user.lastName} a commenté votre publication`,
        body: content.slice(0, 120),
        resource: 'posts',
        resourceId: postId,
      });
      this.realtimeService.notifyUser(post.authorId, notification);
    }

    await this.notifyMentions(content, user, postId);
    await this.logsService.logActivity({
      userId: user.id,
      action: 'POST_COMMENT',
      resource: 'posts',
      resourceId: postId,
      ipAddress,
    });

    this.realtimeService.emitFeedUpdate();
    return this.toComment(comment);
  }

  private async buildFeedFilter(
    user: AuthUser,
    query: FeedQuery,
  ): Promise<Prisma.PostWhereInput> {
    const commissionIds = await this.getUserCommissionIds(user.id);
    const isAdmin = user.roles.includes(RoleCode.ADMIN);

    const visibilityFilter: Prisma.PostWhereInput = isAdmin
      ? {}
      : {
          OR: [
            { visibility: PostVisibility.ALL_MEMBERS },
            {
              visibility: PostVisibility.COMMISSION,
              commissionId: { in: commissionIds },
            },
          ],
        };

    const filters: Prisma.PostWhereInput[] = [];
    if (Object.keys(visibilityFilter).length > 0) filters.push(visibilityFilter);
    if (query.kind) filters.push({ kind: query.kind });
    if (query.commissionId) filters.push({ commissionId: query.commissionId });

    return filters.length > 0 ? { AND: filters } : {};
  }

  private async assertCanView(user: AuthUser, post: PostWithRelations) {
    if (post.visibility === PostVisibility.ALL_MEMBERS) return;
    if (user.roles.includes(RoleCode.ADMIN)) return;

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

    if (!membership) {
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
      throw new ForbiddenException("Vous n'appartenez pas à cette commission");
    }
  }

  private async notifyNewPost(post: PostWithRelations, author: AuthUser) {
    const where: Prisma.UserWhereInput = {
      isActive: true,
      id: { not: author.id },
    };

    if (post.visibility === PostVisibility.COMMISSION && post.commissionId) {
      where.commissions = { some: { commissionId: post.commissionId } };
    }

    const members = await this.prisma.user.findMany({
      where,
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

  private async notifyMentions(
    content: string,
    author: AuthUser,
    postId: string,
  ) {
    const handles = [...content.matchAll(/@([A-Za-zÀ-ÿ'-]+(?:\s+[A-Za-zÀ-ÿ'-]+)?)/g)].map(
      (m) => m[1].trim().toLowerCase(),
    );
    if (handles.length === 0) return;

    const users = await this.prisma.user.findMany({
      where: { isActive: true, id: { not: author.id } },
      select: { id: true, firstName: true, lastName: true },
      take: 500,
    });

    const mentionedIds = new Set<string>();
    for (const handle of handles) {
      const match = users.find((u) => {
        const full = `${u.firstName} ${u.lastName}`.toLowerCase();
        const first = u.firstName.toLowerCase();
        return full === handle || first === handle;
      });
      if (match) mentionedIds.add(match.id);
    }

    for (const userId of mentionedIds) {
      const notification = await this.notificationsService.create({
        userId,
        type: NotificationType.POST_MENTION,
        title: `${author.firstName} ${author.lastName} vous a mentionné`,
        body: content.slice(0, 120),
        resource: 'posts',
        resourceId: postId,
      });
      this.realtimeService.notifyUser(userId, notification);
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

  private toComment(comment: {
    id: string;
    content: string;
    parentId: string | null;
    createdAt: Date;
    author: { id: string; firstName: string; lastName: string };
    _count: { replies: number };
    replies?: Array<{
      id: string;
      content: string;
      parentId: string | null;
      createdAt: Date;
      author: { id: string; firstName: string; lastName: string };
      _count: { replies: number };
    }>;
  }): PostComment {
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
      replies: comment.replies?.map((reply) => ({
        id: reply.id,
        content: reply.content,
        author: {
          id: reply.author.id,
          firstName: reply.author.firstName,
          lastName: reply.author.lastName,
        },
        parentId: reply.parentId,
        replyCount: reply._count.replies,
        createdAt: reply.createdAt.toISOString(),
      })),
    };
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
