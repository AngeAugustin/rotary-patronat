import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DocumentVisibility, Prisma } from '@prisma/client';
import {
  AuthUser,
  CreateDocumentInput,
  DocumentCategory,
  DocumentSummary,
  RoleCode,
} from '@rotary/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { buildMeta, resolvePagination } from '../../common/utils/pagination';
import { LogsService } from '../logs/logs.service';

type DocumentWithRelations = Prisma.DocumentGetPayload<{
  include: { category: true; commission: true; uploadedBy: true };
}>;

interface DocumentQuery {
  page?: number;
  limit?: number;
  q?: string;
  categoryId?: string;
  visibility?: DocumentVisibility;
  commissionId?: string;
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logsService: LogsService,
  ) {}

  async findCategories(user: AuthUser | null): Promise<DocumentCategory[]> {
    const visibilityFilter = this.getVisibilityFilter(user);

    const categories = await this.prisma.documentCategory.findMany({
      where: visibilityFilter ? { visibility: visibilityFilter } : undefined,
      include: { _count: { select: { documents: true } } },
      orderBy: { sortOrder: 'asc' },
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      visibility: c.visibility,
      documentCount: c._count.documents,
    }));
  }

  async findAll(user: AuthUser | null, query: DocumentQuery) {
    const { skip, take, page, limit } = resolvePagination(query);
    const where = this.buildListFilter(user, query);

    const [items, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        include: { category: true, commission: true, uploadedBy: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      data: items.map((d) => this.toSummary(d)),
      meta: buildMeta(page, limit, total),
    };
  }

  async findById(user: AuthUser | null, id: string): Promise<DocumentSummary> {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: { category: true, commission: true, uploadedBy: true },
    });
    if (!document) throw new NotFoundException('Document introuvable');
    this.assertCanAccess(user, document);
    return this.toSummary(document);
  }

  async create(user: AuthUser, input: CreateDocumentInput, ipAddress?: string) {
    if (!this.canUpload(user)) {
      throw new ForbiddenException('Droits insuffisants pour ajouter un document');
    }

    const document = await this.prisma.document.create({
      data: {
        title: input.title,
        slug: input.slug,
        description: input.description,
        fileUrl: input.fileUrl,
        fileType: input.fileType ?? 'PDF',
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        visibility: (input.visibility as DocumentVisibility) ?? DocumentVisibility.PRIVATE,
        categoryId: input.categoryId,
        commissionId: input.commissionId,
        uploadedById: user.id,
      },
      include: { category: true, commission: true, uploadedBy: true },
    });

    await this.logsService.logActivity({
      userId: user.id,
      action: 'DOCUMENT_CREATE',
      resource: 'documents',
      resourceId: document.id,
      ipAddress,
    });

    return this.toSummary(document);
  }

  async recordDownload(user: AuthUser, id: string, ipAddress?: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: { category: true, commission: true, uploadedBy: true },
    });
    if (!document) throw new NotFoundException('Document introuvable');
    this.assertCanAccess(user, document);

    const updated = await this.prisma.document.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
      include: { category: true, commission: true, uploadedBy: true },
    });

    await this.logsService.logActivity({
      userId: user.id,
      action: 'DOCUMENT_DOWNLOAD',
      resource: 'documents',
      resourceId: id,
      ipAddress,
    });

    return this.toSummary(updated);
  }

  private buildListFilter(
    user: AuthUser | null,
    query: DocumentQuery,
  ): Prisma.DocumentWhereInput {
    const and: Prisma.DocumentWhereInput[] = [];

    if (user) {
      if (!user.roles.includes(RoleCode.ADMIN)) {
        and.push({
          OR: [
            { visibility: DocumentVisibility.PUBLIC },
            { visibility: DocumentVisibility.PRIVATE },
          ],
        });
      }
    } else {
      and.push({ visibility: DocumentVisibility.PUBLIC });
    }

    if (query.categoryId) and.push({ categoryId: query.categoryId });
    if (query.visibility) and.push({ visibility: query.visibility });
    if (query.commissionId) and.push({ commissionId: query.commissionId });

    if (query.q?.trim()) {
      const q = query.q.trim();
      and.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    return and.length > 0 ? { AND: and } : {};
  }

  private getVisibilityFilter(user: AuthUser | null) {
    if (!user) return DocumentVisibility.PUBLIC;
    return undefined;
  }

  private assertCanAccess(user: AuthUser | null, document: DocumentWithRelations) {
    if (document.visibility === DocumentVisibility.PUBLIC) return;
    if (!user) throw new ForbiddenException('Document privé — connexion requise');
  }

  private canUpload(user: AuthUser) {
    return (
      user.roles.includes(RoleCode.ADMIN) ||
      user.roles.includes(RoleCode.SECRETARY) ||
      user.roles.includes(RoleCode.COMMISSION_LEAD) ||
      user.roles.includes(RoleCode.PRESIDENT)
    );
  }

  private toSummary(document: DocumentWithRelations): DocumentSummary {
    return {
      id: document.id,
      title: document.title,
      slug: document.slug,
      description: document.description,
      fileUrl: document.fileUrl,
      fileType: document.fileType,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      visibility: document.visibility,
      categoryId: document.categoryId,
      categoryName: document.category.name,
      commissionId: document.commissionId,
      commissionName: document.commission?.name ?? null,
      uploadedByName: `${document.uploadedBy.firstName} ${document.uploadedBy.lastName}`,
      downloadCount: document.downloadCount,
      createdAt: document.createdAt.toISOString(),
    };
  }
}
