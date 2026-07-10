import { Injectable } from '@nestjs/common';
import { Meeting, PublishStatus, Prisma } from '@prisma/client';
import { MeetingDetail, MeetingSummary } from '@rotary/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { buildMeta, resolvePagination } from '../../common/utils/pagination';

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublished(query: {
    page?: number;
    limit?: number;
    upcoming?: boolean;
    from?: string;
    to?: string;
  }) {
    const hasRange = Boolean(query.from && query.to);
    const { skip, take, page, limit } = resolvePagination({
      page: query.page,
      limit: hasRange ? (query.limit ?? 100) : query.limit,
    });
    const now = new Date();

    const dateFilter: Prisma.DateTimeFilter = {};
    if (query.from) dateFilter.gte = new Date(query.from);
    if (query.to) dateFilter.lte = new Date(query.to);
    if (!hasRange) {
      if (query.upcoming === true) dateFilter.gte = now;
      if (query.upcoming === false) dateFilter.lt = now;
    }

    const where: Prisma.MeetingWhereInput = {
      status: PublishStatus.PUBLISHED,
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.meeting.findMany({
        where,
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        skip: hasRange ? 0 : skip,
        take: hasRange ? Math.min(limit, 200) : take,
      }),
      this.prisma.meeting.count({ where }),
    ]);

    return {
      data: items.map((item) => this.toSummary(item)),
      meta: buildMeta(
        page,
        hasRange ? items.length || 1 : limit,
        hasRange ? items.length : total,
      ),
    };
  }

  async findBySlug(slug: string): Promise<MeetingDetail | null> {
    const item = await this.prisma.meeting.findFirst({
      where: { slug, status: PublishStatus.PUBLISHED },
    });
    if (!item) return null;
    return this.toDetail(item);
  }

  private toSummary(item: Meeting): MeetingSummary {
    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      description: item.description,
      date: item.date.toISOString(),
      startTime: item.startTime,
      location: item.location,
      speakers: this.parseStringArray(item.speakers),
    };
  }

  private toDetail(item: Meeting): MeetingDetail {
    return {
      ...this.toSummary(item),
      agenda: item.agenda,
      publishedAt: item.publishedAt?.toISOString() ?? null,
    };
  }

  private parseStringArray(value: Prisma.JsonValue | null): string[] {
    if (!value || !Array.isArray(value)) return [];
    return value.filter((v): v is string => typeof v === 'string');
  }
}
