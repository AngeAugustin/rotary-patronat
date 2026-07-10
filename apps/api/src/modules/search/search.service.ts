import { Injectable } from '@nestjs/common';
import { PublishStatus } from '@prisma/client';
import { AuthUser, RoleCode, SearchResponse, SearchResult } from '@rotary/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

const DEFAULT_LIMIT = 5;

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(
    user: AuthUser,
    query: string,
    types?: string[],
  ): Promise<SearchResponse> {
    const q = query.trim();
    if (q.length < 2) {
      return { query: q, results: [], counts: {} };
    }

    const enabled = new Set(
      types?.length
        ? types
        : ['news', 'action', 'document', 'post', 'project', 'commission', 'meeting', 'event'],
    );

    const isAdmin = user.roles.includes(RoleCode.ADMIN);
    const results: SearchResult[] = [];
    const counts: Record<string, number> = {};

    const textFilter = { contains: q, mode: 'insensitive' as const };

    if (enabled.has('news')) {
      const items = await this.prisma.newsArticle.findMany({
        where: {
          status: PublishStatus.PUBLISHED,
          OR: [{ title: textFilter }, { excerpt: textFilter }, { content: textFilter }],
        },
        take: DEFAULT_LIMIT,
        orderBy: { publishedAt: 'desc' },
      });
      counts.news = items.length;
      results.push(
        ...items.map((item) => ({
          id: item.id,
          type: 'news' as const,
          title: item.title,
          excerpt: item.excerpt,
          url: `/nos-actualites/${item.slug}`,
          date: item.publishedAt?.toISOString() ?? null,
          meta: 'Actualité publique',
        })),
      );
    }

    if (enabled.has('action')) {
      const items = await this.prisma.action.findMany({
        where: {
          status: PublishStatus.PUBLISHED,
          OR: [{ title: textFilter }, { description: textFilter }, { summary: textFilter }],
        },
        take: DEFAULT_LIMIT,
        orderBy: { publishedAt: 'desc' },
      });
      counts.action = items.length;
      results.push(
        ...items.map((item) => ({
          id: item.id,
          type: 'action' as const,
          title: item.title,
          excerpt: item.summary ?? item.description.slice(0, 120),
          url: `/nos-actions/${item.slug}`,
          date: item.publishedAt?.toISOString() ?? null,
          meta: 'Action publique',
        })),
      );
    }

    if (enabled.has('document')) {
      const items = await this.prisma.document.findMany({
        where: {
          OR: [{ title: textFilter }, { description: textFilter }],
        },
        include: { category: true },
        take: DEFAULT_LIMIT,
        orderBy: { createdAt: 'desc' },
      });
      counts.document = items.length;
      results.push(
        ...items.map((item) => ({
          id: item.id,
          type: 'document' as const,
          title: item.title,
          excerpt: item.description,
          url: `/dashboard/bibliotheque?doc=${item.id}`,
          date: item.createdAt.toISOString(),
          meta: item.category.name,
        })),
      );
    }

    if (enabled.has('post')) {
      const items = await this.prisma.post.findMany({
        where: { content: textFilter },
        include: { author: true },
        take: DEFAULT_LIMIT,
        orderBy: { createdAt: 'desc' },
      });
      counts.post = items.length;
      results.push(
        ...items.map((item) => ({
          id: item.id,
          type: 'post' as const,
          title: `${item.author.firstName} ${item.author.lastName}`,
          excerpt: item.content.slice(0, 120),
          url: '/dashboard/fil',
          date: item.createdAt.toISOString(),
          meta: 'Fil interne',
        })),
      );
    }

    if (enabled.has('member') && isAdmin) {
      const items = await this.prisma.user.findMany({
        where: {
          isActive: true,
          OR: [
            { firstName: textFilter },
            { lastName: textFilter },
            { email: textFilter },
          ],
        },
        take: DEFAULT_LIMIT,
      });
      counts.member = items.length;
      results.push(
        ...items.map((item) => ({
          id: item.id,
          type: 'member' as const,
          title: `${item.firstName} ${item.lastName}`,
          excerpt: item.email,
          url: '/dashboard/admin/utilisateurs',
          date: null,
          meta: 'Membre',
        })),
      );
    }

    if (enabled.has('project')) {
      const items = await this.prisma.project.findMany({
        where: {
          OR: [{ title: textFilter }, { description: textFilter }],
        },
        include: { commission: true },
        take: DEFAULT_LIMIT,
        orderBy: { updatedAt: 'desc' },
      });
      counts.project = items.length;
      results.push(
        ...items.map((item) => ({
          id: item.id,
          type: 'project' as const,
          title: item.title,
          excerpt: item.description.slice(0, 120),
          url: `/dashboard/projets/${item.id}`,
          date: item.updatedAt.toISOString(),
          meta: item.commission.name,
        })),
      );
    }

    if (enabled.has('commission')) {
      const items = await this.prisma.commission.findMany({
        where: {
          OR: [{ name: textFilter }, { description: textFilter }],
        },
        take: DEFAULT_LIMIT,
      });
      counts.commission = items.length;
      results.push(
        ...items.map((item) => ({
          id: item.id,
          type: 'commission' as const,
          title: item.name,
          excerpt: item.description.slice(0, 120),
          url: isAdmin
            ? `/dashboard/admin/commissions/${item.id}`
            : '/dashboard',
          date: null,
          meta: 'Commission',
        })),
      );
    }

    if (enabled.has('meeting')) {
      const items = await this.prisma.meeting.findMany({
        where: {
          status: PublishStatus.PUBLISHED,
          OR: [{ title: textFilter }, { description: textFilter }],
        },
        take: DEFAULT_LIMIT,
        orderBy: { date: 'asc' },
      });
      counts.meeting = items.length;
      results.push(
        ...items.map((item) => ({
          id: item.id,
          type: 'meeting' as const,
          title: item.title,
          excerpt: item.description?.slice(0, 120) ?? null,
          url: '/dashboard/calendrier',
          date: item.date.toISOString(),
          meta: 'Réunion',
        })),
      );
    }

    if (enabled.has('event')) {
      const items = await this.prisma.calendarEvent.findMany({
        where: {
          OR: [{ title: textFilter }, { description: textFilter }],
        },
        take: DEFAULT_LIMIT,
        orderBy: { startAt: 'asc' },
      });
      counts.event = items.length;
      results.push(
        ...items.map((item) => ({
          id: item.id,
          type: 'event' as const,
          title: item.title,
          excerpt: item.description?.slice(0, 120) ?? null,
          url: '/dashboard/calendrier',
          date: item.startAt.toISOString(),
          meta: 'Événement',
        })),
      );
    }

    return {
      query: q,
      results: results.slice(0, 30),
      counts,
    };
  }
}
