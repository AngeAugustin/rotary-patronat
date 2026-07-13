import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuthUser,
  ModerationComment,
  ModerationPost,
  ModerationReport,
  RoleCode,
} from '@rotary/shared-types';
import { ContentReportTarget } from '@prisma/client';
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

  async listReports(user: AuthUser, query: { page?: number; limit?: number }) {
    this.assertAdmin(user);
    const { skip, take, page, limit } = resolvePagination(query);

    const [items, total] = await Promise.all([
      this.prisma.contentReport.findMany({
        include: {
          reporter: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.contentReport.count(),
    ]);

    const postIds = items
      .filter((r) => r.targetType === ContentReportTarget.POST)
      .map((r) => r.targetId);
    const commentIds = items
      .filter((r) => r.targetType === ContentReportTarget.COMMENT)
      .map((r) => r.targetId);

    const [posts, comments] = await Promise.all([
      postIds.length
        ? this.prisma.post.findMany({
            where: { id: { in: postIds } },
            select: {
              id: true,
              content: true,
              author: { select: { id: true, firstName: true, lastName: true } },
            },
          })
        : Promise.resolve([]),
      commentIds.length
        ? this.prisma.postComment.findMany({
            where: { id: { in: commentIds } },
            select: {
              id: true,
              content: true,
              author: { select: { id: true, firstName: true, lastName: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    const postsById = new Map(posts.map((p) => [p.id, p]));
    const commentsById = new Map(comments.map((c) => [c.id, c]));

    const data: ModerationReport[] = items.map((report) => {
      const target =
        report.targetType === ContentReportTarget.POST
          ? postsById.get(report.targetId)
          : commentsById.get(report.targetId);

      return {
        id: report.id,
        targetType: report.targetType,
        targetId: report.targetId,
        reason: report.reason,
        createdAt: report.createdAt.toISOString(),
        reporter: {
          id: report.reporter.id,
          firstName: report.reporter.firstName,
          lastName: report.reporter.lastName,
        },
        targetContent: target?.content ?? null,
        targetAuthor: target
          ? {
              id: target.author.id,
              firstName: target.author.firstName,
              lastName: target.author.lastName,
            }
          : null,
        targetExists: Boolean(target),
      };
    });

    return { data, meta: buildMeta(page, limit, total) };
  }

  async dismissReport(user: AuthUser, id: string, ipAddress?: string) {
    this.assertAdmin(user);
    const report = await this.prisma.contentReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Signalement introuvable');

    await this.prisma.contentReport.delete({ where: { id } });

    await this.logsService.logActivity({
      userId: user.id,
      action: 'MODERATION_REPORT_DISMISS',
      resource: 'content_reports',
      resourceId: id,
      ipAddress,
      metadata: {
        targetType: report.targetType,
        targetId: report.targetId,
      },
    });

    return { success: true };
  }

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

    await this.prisma.$transaction([
      this.prisma.contentReport.deleteMany({
        where: { targetType: ContentReportTarget.POST, targetId: id },
      }),
      this.prisma.post.delete({ where: { id } }),
    ]);

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

    await this.prisma.$transaction([
      this.prisma.contentReport.deleteMany({
        where: { targetType: ContentReportTarget.COMMENT, targetId: id },
      }),
      this.prisma.postComment.delete({ where: { id } }),
    ]);

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
