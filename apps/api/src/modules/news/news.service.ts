import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PublishStatus, Prisma } from '@prisma/client';
import {
  CreateNewsInput,
  NewsAdmin,
  NewsDetail,
  NewsSummary,
  UpdateNewsInput,
} from '@rotary/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { LogsService } from '../logs/logs.service';
import { buildMeta, resolvePagination } from '../../common/utils/pagination';

interface NewsQuery {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
}

type ArticleWithCategory = Prisma.NewsArticleGetPayload<{
  include: { category: true };
}>;

@Injectable()
export class NewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logsService: LogsService,
  ) {}

  async findPublished(query: NewsQuery) {
    const { skip, take, page, limit } = resolvePagination(query);
    const where: Prisma.NewsArticleWhereInput = {
      status: PublishStatus.PUBLISHED,
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { excerpt: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.category ? { category: { slug: query.category } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.newsArticle.findMany({
        where,
        include: { category: true },
        orderBy: { publishedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.newsArticle.count({ where }),
    ]);

    return {
      data: items.map((item) => this.toSummary(item)),
      meta: buildMeta(page, limit, total),
    };
  }

  async findRecent(limit = 3) {
    const items = await this.prisma.newsArticle.findMany({
      where: { status: PublishStatus.PUBLISHED },
      include: { category: true },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    return items.map((item) => this.toSummary(item));
  }

  async findCategories() {
    const categories = await this.prisma.newsCategory.findMany({
      orderBy: { name: 'asc' },
    });
    return categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
  }

  async findBySlug(slug: string): Promise<NewsDetail | null> {
    const item = await this.prisma.newsArticle.findFirst({
      where: { slug, status: PublishStatus.PUBLISHED },
      include: { category: true },
    });

    if (!item) return null;
    return this.toDetail(item);
  }

  async findAllAdmin(query: {
    page?: number;
    limit?: number;
    status?: PublishStatus;
    q?: string;
    categoryId?: string;
  }) {
    const { skip, take, page, limit } = resolvePagination(query);
    const where: Prisma.NewsArticleWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { excerpt: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.newsArticle.findMany({
        where,
        include: { category: true },
        orderBy: [{ updatedAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.newsArticle.count({ where }),
    ]);

    return {
      data: items.map((item) => this.toAdmin(item)),
      meta: buildMeta(page, limit, total),
    };
  }

  async findByIdAdmin(id: string): Promise<NewsAdmin> {
    const item = await this.prisma.newsArticle.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!item) {
      throw new NotFoundException({
        error: { code: 'NEWS_NOT_FOUND', message: 'Actualité introuvable' },
      });
    }
    return this.toAdmin(item);
  }

  async createAdmin(
    input: CreateNewsInput,
    actorId: string,
    ipAddress?: string,
  ): Promise<NewsAdmin> {
    await this.ensureUniqueSlug(input.slug);
    await this.ensureCategory(input.categoryId);

    const status = PublishStatus.DRAFT;
    const item = await this.prisma.newsArticle.create({
      data: {
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt,
        content: input.content,
        coverImage: input.coverImage?.trim() || null,
        categoryId: input.categoryId,
        status,
        publishedAt: null,
      },
      include: { category: true },
    });

    await this.logsService.logActivity({
      userId: actorId,
      action: 'NEWS_CREATE',
      resource: 'news',
      resourceId: item.id,
      ipAddress,
    });

    return this.toAdmin(item);
  }

  async updateAdmin(
    id: string,
    input: UpdateNewsInput,
    actorId: string,
    ipAddress?: string,
  ): Promise<NewsAdmin> {
    const existing = await this.prisma.newsArticle.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        error: { code: 'NEWS_NOT_FOUND', message: 'Actualité introuvable' },
      });
    }

    if (input.slug && input.slug !== existing.slug) {
      await this.ensureUniqueSlug(input.slug, id);
    }
    if (input.categoryId) {
      await this.ensureCategory(input.categoryId);
    }

    const nextStatus =
      input.status !== undefined
        ? (input.status as PublishStatus)
        : existing.status;

    let publishedAt = existing.publishedAt;
    if (nextStatus === PublishStatus.PUBLISHED && !publishedAt) {
      publishedAt = new Date();
    }
    if (
      nextStatus === PublishStatus.DRAFT &&
      existing.status !== PublishStatus.PUBLISHED &&
      input.status !== undefined
    ) {
      publishedAt = null;
    }

    const item = await this.prisma.newsArticle.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
        ...(input.content !== undefined ? { content: input.content } : {}),
        ...(input.coverImage !== undefined
          ? { coverImage: input.coverImage.trim() || null }
          : {}),
        ...(input.categoryId !== undefined
          ? { categoryId: input.categoryId }
          : {}),
        ...(input.status !== undefined ? { status: nextStatus, publishedAt } : {}),
      },
      include: { category: true },
    });

    await this.logsService.logActivity({
      userId: actorId,
      action: 'NEWS_UPDATE',
      resource: 'news',
      resourceId: item.id,
      ipAddress,
    });

    return this.toAdmin(item);
  }

  async removeAdmin(id: string, actorId: string, ipAddress?: string) {
    const existing = await this.prisma.newsArticle.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        error: { code: 'NEWS_NOT_FOUND', message: 'Actualité introuvable' },
      });
    }

    await this.prisma.newsArticle.delete({ where: { id } });

    await this.logsService.logActivity({
      userId: actorId,
      action: 'NEWS_DELETE',
      resource: 'news',
      resourceId: id,
      metadata: { title: existing.title },
      ipAddress,
    });

    return { success: true };
  }

  private async ensureUniqueSlug(slug: string, excludeId?: string) {
    const conflict = await this.prisma.newsArticle.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (conflict) {
      throw new ConflictException({
        error: { code: 'NEWS_SLUG_TAKEN', message: 'Ce slug est déjà utilisé' },
      });
    }
  }

  private async ensureCategory(categoryId: string) {
    const category = await this.prisma.newsCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new NotFoundException({
        error: {
          code: 'NEWS_CATEGORY_NOT_FOUND',
          message: 'Catégorie introuvable',
        },
      });
    }
  }

  private toSummary(item: ArticleWithCategory): NewsSummary {
    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt,
      coverImage: item.coverImage,
      category: {
        id: item.category.id,
        name: item.category.name,
        slug: item.category.slug,
      },
      publishedAt: item.publishedAt?.toISOString() ?? null,
    };
  }

  private toDetail(item: ArticleWithCategory): NewsDetail {
    return {
      ...this.toSummary(item),
      content: item.content,
    };
  }

  private toAdmin(item: ArticleWithCategory): NewsAdmin {
    return {
      ...this.toDetail(item),
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
