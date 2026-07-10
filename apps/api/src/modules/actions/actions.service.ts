import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Action, PublishStatus, Prisma } from '@prisma/client';
import {
  ActionAdmin,
  ActionDetail,
  ActionSummary,
  CreateActionInput,
  UpdateActionInput,
} from '@rotary/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { LogsService } from '../logs/logs.service';
import { buildMeta, resolvePagination } from '../../common/utils/pagination';

@Injectable()
export class ActionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logsService: LogsService,
  ) {}

  async findPublished(page = 1, limit = 12) {
    const { skip, take, page: p, limit: l } = resolvePagination({ page, limit });
    const where = { status: PublishStatus.PUBLISHED };

    const [items, total] = await Promise.all([
      this.prisma.action.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
      this.prisma.action.count({ where }),
    ]);

    return {
      data: items.map((item) => this.toSummary(item)),
      meta: buildMeta(p, l, total),
    };
  }

  async findFeatured(limit = 3) {
    const items = await this.prisma.action.findMany({
      where: { status: PublishStatus.PUBLISHED, featured: true },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return items.map((item) => this.toSummary(item));
  }

  async findBySlug(slug: string): Promise<ActionDetail | null> {
    const item = await this.prisma.action.findFirst({
      where: { slug, status: PublishStatus.PUBLISHED },
    });

    if (!item) return null;
    return this.toDetail(item);
  }

  async findAllAdmin(query: {
    page?: number;
    limit?: number;
    status?: PublishStatus;
    q?: string;
  }) {
    const { skip, take, page, limit } = resolvePagination(query);
    const where: Prisma.ActionWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { location: { contains: query.q, mode: 'insensitive' } },
              { summary: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.action.findMany({
        where,
        orderBy: [{ date: 'desc' }, { updatedAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.action.count({ where }),
    ]);

    return {
      data: items.map((item) => this.toAdmin(item)),
      meta: buildMeta(page, limit, total),
    };
  }

  async findByIdAdmin(id: string): Promise<ActionAdmin> {
    const item = await this.prisma.action.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException({
        error: { code: 'ACTION_NOT_FOUND', message: 'Action introuvable' },
      });
    }
    return this.toAdmin(item);
  }

  async createAdmin(
    input: CreateActionInput,
    actorId: string,
    ipAddress?: string,
  ): Promise<ActionAdmin> {
    await this.ensureUniqueSlug(input.slug);
    const status = PublishStatus.DRAFT;
    const item = await this.prisma.action.create({
      data: {
        title: input.title,
        slug: input.slug,
        summary: input.summary?.trim() || null,
        description: input.description,
        date: new Date(input.date),
        location: input.location,
        coverImage: input.coverImage?.trim() || null,
        gallery: input.gallery ?? [],
        videos: input.videos ?? [],
        partners: input.partners ?? [],
        results: input.results?.trim() || null,
        featured: input.featured ?? false,
        status,
        publishedAt: null,
      },
    });

    await this.logsService.logActivity({
      userId: actorId,
      action: 'ACTION_CREATE',
      resource: 'action',
      resourceId: item.id,
      ipAddress,
    });

    return this.toAdmin(item);
  }

  async updateAdmin(
    id: string,
    input: UpdateActionInput,
    actorId: string,
    ipAddress?: string,
  ): Promise<ActionAdmin> {
    const existing = await this.prisma.action.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        error: { code: 'ACTION_NOT_FOUND', message: 'Action introuvable' },
      });
    }

    if (input.slug && input.slug !== existing.slug) {
      await this.ensureUniqueSlug(input.slug, id);
    }

    const nextStatus =
      input.status !== undefined
        ? (input.status as PublishStatus)
        : existing.status;

    let publishedAt = existing.publishedAt;
    if (nextStatus === PublishStatus.PUBLISHED && !publishedAt) {
      publishedAt = new Date();
    }
    if (nextStatus !== PublishStatus.PUBLISHED && input.status !== undefined) {
      // keep publishedAt history when archiving; clear only if back to draft from never-published is N/A
      if (nextStatus === PublishStatus.DRAFT && existing.status !== PublishStatus.PUBLISHED) {
        publishedAt = null;
      }
    }

    const item = await this.prisma.action.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.summary !== undefined
          ? { summary: input.summary.trim() || null }
          : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.date !== undefined ? { date: new Date(input.date) } : {}),
        ...(input.location !== undefined ? { location: input.location } : {}),
        ...(input.coverImage !== undefined
          ? { coverImage: input.coverImage.trim() || null }
          : {}),
        ...(input.gallery !== undefined ? { gallery: input.gallery } : {}),
        ...(input.videos !== undefined ? { videos: input.videos } : {}),
        ...(input.partners !== undefined ? { partners: input.partners } : {}),
        ...(input.results !== undefined
          ? { results: input.results.trim() || null }
          : {}),
        ...(input.featured !== undefined ? { featured: input.featured } : {}),
        ...(input.status !== undefined ? { status: nextStatus, publishedAt } : {}),
      },
    });

    await this.logsService.logActivity({
      userId: actorId,
      action: 'ACTION_UPDATE',
      resource: 'action',
      resourceId: item.id,
      ipAddress,
    });

    return this.toAdmin(item);
  }

  async removeAdmin(id: string, actorId: string, ipAddress?: string) {
    const existing = await this.prisma.action.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        error: { code: 'ACTION_NOT_FOUND', message: 'Action introuvable' },
      });
    }

    await this.prisma.action.delete({ where: { id } });

    await this.logsService.logActivity({
      userId: actorId,
      action: 'ACTION_DELETE',
      resource: 'action',
      resourceId: id,
      metadata: { title: existing.title },
      ipAddress,
    });

    return { success: true };
  }

  private async ensureUniqueSlug(slug: string, excludeId?: string) {
    const conflict = await this.prisma.action.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (conflict) {
      throw new ConflictException({
        error: { code: 'ACTION_SLUG_TAKEN', message: 'Ce slug est déjà utilisé' },
      });
    }
  }

  private toSummary(item: Action): ActionSummary {
    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      summary: item.summary,
      date: item.date.toISOString(),
      location: item.location,
      coverImage: item.coverImage,
      featured: item.featured,
    };
  }

  private toDetail(item: Action): ActionDetail {
    return {
      ...this.toSummary(item),
      description: item.description,
      gallery: this.parseStringArray(item.gallery),
      videos: this.parseVideos(item.videos),
      partners: this.parseStringArray(item.partners),
      results: item.results,
      publishedAt: item.publishedAt?.toISOString() ?? null,
    };
  }

  private toAdmin(item: Action): ActionAdmin {
    return {
      ...this.toDetail(item),
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private parseStringArray(value: Prisma.JsonValue | null): string[] {
    if (!value || !Array.isArray(value)) return [];
    return value.filter((v): v is string => typeof v === 'string');
  }

  private parseVideos(value: Prisma.JsonValue | null) {
    if (!value || !Array.isArray(value)) return [];
    return value
      .filter(
        (v): v is { url: string; title: string } =>
          typeof v === 'object' &&
          v !== null &&
          'url' in v &&
          'title' in v &&
          typeof (v as { url: unknown }).url === 'string' &&
          typeof (v as { title: unknown }).title === 'string',
      )
      .map((v) => ({ url: v.url, title: v.title }));
  }
}
