import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser, ModerationComment, ModerationPost, RoleCode } from '@rotary/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { buildMeta, resolvePagination } from '../../common/utils/pagination';
import { LogsService } from '../logs/logs.service';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logsService: LogsService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async listPosts(user: AuthUser, query: { page?: number; limit?: number }) {
    this.assertAdmin(user);
    const { skip, take, page, limit } = resolvePagination(query);

    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        include: {
          author: true,
          commission: true,
          likes: true,
          _count: { select: { comments: true, likes: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.post.count(),
    ]);

    const data: ModerationPost[] = items.map((post) => ({
      id: post.id,
      kind: post.kind,
      content: post.content,
      attachments: (post.attachments as ModerationPost['attachments']) ?? null,
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
      likedByMe: false,
      repostOfId: post.repostOfId,
      createdAt: post.createdAt.toISOString(),
    }));

    return { data, meta: buildMeta(page, limit, total) };
  }

  async listComments(user: AuthUser, query: { page?: number; limit?: number }) {
    this.assertAdmin(user);
    const { skip, take, page, limit } = resolvePagination(query);

    const [items, total] = await Promise.all([
      this.prisma.postComment.findMany({
        include: {
          author: true,
          post: true,
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.postComment.count(),
    ]);

    const data: ModerationComment[] = items.map((comment) => ({
      id: comment.id,
      postId: comment.postId,
      postPreview: comment.post.content.slice(0, 80),
      content: comment.content,
      author: {
        id: comment.author.id,
        firstName: comment.author.firstName,
        lastName: comment.author.lastName,
      },
      parentId: comment.parentId,
      replyCount: comment._count.replies,
      createdAt: comment.createdAt.toISOString(),
    }));

    return { data, meta: buildMeta(page, limit, total) };
  }

  async deletePost(user: AuthUser, id: string, ipAddress?: string) {
    this.assertAdmin(user);
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Publication introuvable');

    await this.prisma.post.delete({ where: { id } });

    await this.logsService.logActivity({
      userId: user.id,
      action: 'MODERATION_POST_DELETE',
      resource: 'posts',
      resourceId: id,
      ipAddress,
    });

    this.realtimeService.emitFeedUpdate();
    return { success: true };
  }

  async deleteComment(user: AuthUser, id: string, ipAddress?: string) {
    this.assertAdmin(user);
    const comment = await this.prisma.postComment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Commentaire introuvable');

    await this.prisma.postComment.delete({ where: { id } });

    await this.logsService.logActivity({
      userId: user.id,
      action: 'MODERATION_COMMENT_DELETE',
      resource: 'post_comments',
      resourceId: id,
      ipAddress,
    });

    this.realtimeService.emitFeedUpdate();
    return { success: true };
  }

  private assertAdmin(user: AuthUser) {
    if (!user.roles.includes(RoleCode.ADMIN)) {
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }
  }
}
