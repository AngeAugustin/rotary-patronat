import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma, VolunteeringStatus } from '@prisma/client';
import {
  AuthUser,
  CreateVolunteeringInput,
  ReviewVolunteeringInput,
  RoleCode,
  UpdateVolunteeringInput,
  VolunteeringStats,
  VolunteeringSummary,
} from '@rotary/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { buildMeta, resolvePagination } from '../../common/utils/pagination';
import { LogsService } from '../logs/logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';

type VolunteeringWithUser = Prisma.VolunteeringDeclarationGetPayload<{
  include: { user: true; validatedBy: true };
}>;

@Injectable()
export class VolunteeringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logsService: LogsService,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async findAll(
    user: AuthUser,
    query: {
      page?: number;
      limit?: number;
      status?: VolunteeringStatus;
      userId?: string;
      /** Admin only: list all club declarations (moderation). Default = own only. */
      scope?: 'mine' | 'all';
    },
  ) {
    const { skip, take, page, limit } = resolvePagination(query);
    const where = this.buildListFilter(user, query);

    const [items, total] = await Promise.all([
      this.prisma.volunteeringDeclaration.findMany({
        where,
        include: { user: true, validatedBy: true },
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
      this.prisma.volunteeringDeclaration.count({ where }),
    ]);

    return {
      data: items.map((item) => this.toSummary(item)),
      meta: buildMeta(page, limit, total),
    };
  }

  async getStats(user: AuthUser, targetUserId?: string): Promise<VolunteeringStats> {
    const userId = this.resolveTargetUserId(user, targetUserId);
    const declarations = await this.prisma.volunteeringDeclaration.findMany({
      where: { userId },
    });

    const validated = declarations.filter((d) => d.status === VolunteeringStatus.VALIDATED);
    const pending = declarations.filter((d) => d.status === VolunteeringStatus.PENDING);
    const rejected = declarations.filter((d) => d.status === VolunteeringStatus.REJECTED);

    return {
      totalDeclarations: declarations.length,
      validatedCount: validated.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      totalHours: this.sumHours(declarations),
      validatedHours: this.sumHours(validated),
    };
  }

  async create(user: AuthUser, input: CreateVolunteeringInput, ipAddress?: string) {
    const declaration = await this.prisma.volunteeringDeclaration.create({
      data: {
        userId: user.id,
        visitedClub: input.visitedClub,
        city: input.city,
        country: input.country,
        activity: input.activity,
        description: input.description,
        date: new Date(input.date),
        startTime: input.startTime,
        durationMinutes: input.durationMinutes,
        hours: input.hours,
        proofUrl: input.proofUrl,
      },
      include: { user: true, validatedBy: true },
    });

    await this.logsService.logActivity({
      userId: user.id,
      action: 'VOLUNTEERING_CREATE',
      resource: 'volunteering',
      resourceId: declaration.id,
      ipAddress,
    });

    return this.toSummary(declaration);
  }

  async update(
    user: AuthUser,
    id: string,
    input: UpdateVolunteeringInput,
    ipAddress?: string,
  ) {
    const existing = await this.findOwnedPending(user, id);

    const declaration = await this.prisma.volunteeringDeclaration.update({
      where: { id: existing.id },
      data: {
        visitedClub: input.visitedClub,
        city: input.city,
        country: input.country,
        activity: input.activity,
        description: input.description,
        date: new Date(input.date),
        startTime: input.startTime,
        durationMinutes: input.durationMinutes,
        hours: input.hours,
        proofUrl: input.proofUrl ?? null,
      },
      include: { user: true, validatedBy: true },
    });

    await this.logsService.logActivity({
      userId: user.id,
      action: 'VOLUNTEERING_UPDATE',
      resource: 'volunteering',
      resourceId: declaration.id,
      ipAddress,
    });

    return this.toSummary(declaration);
  }

  async remove(user: AuthUser, id: string, ipAddress?: string) {
    const existing = await this.findOwnedPending(user, id);

    await this.prisma.volunteeringDeclaration.delete({ where: { id: existing.id } });

    await this.logsService.logActivity({
      userId: user.id,
      action: 'VOLUNTEERING_DELETE',
      resource: 'volunteering',
      resourceId: id,
      ipAddress,
    });

    return { id };
  }

  async review(
    user: AuthUser,
    id: string,
    input: ReviewVolunteeringInput,
    ipAddress?: string,
  ) {
    if (!user.roles.includes(RoleCode.ADMIN)) {
      throw new ForbiddenException('Seuls les administrateurs peuvent valider les déclarations');
    }

    const existing = await this.prisma.volunteeringDeclaration.findUnique({
      where: { id },
      include: { user: true, validatedBy: true },
    });
    if (!existing) throw new NotFoundException('Déclaration introuvable');

    if (input.status === 'REJECTED' && !input.rejectionReason?.trim()) {
      throw new ForbiddenException('Un motif de refus est requis');
    }

    const declaration = await this.prisma.volunteeringDeclaration.update({
      where: { id },
      data: {
        status: input.status as VolunteeringStatus,
        validatedById: user.id,
        validatedAt: new Date(),
        rejectionReason: input.status === 'REJECTED' ? input.rejectionReason : null,
      },
      include: { user: true, validatedBy: true },
    });

    const notification = await this.notificationsService.create({
      userId: declaration.userId,
      type:
        input.status === 'VALIDATED'
          ? NotificationType.VOLUNTEERING_VALIDATED
          : NotificationType.VOLUNTEERING_REJECTED,
      title:
        input.status === 'VALIDATED'
          ? 'Votre déclaration de bénévolat a été validée'
          : 'Votre déclaration de bénévolat a été refusée',
      body:
        input.status === 'REJECTED'
          ? input.rejectionReason
          : `${declaration.hours} h chez ${declaration.visitedClub}`,
      resource: 'volunteering',
      resourceId: declaration.id,
    });
    this.realtimeService.notifyUser(declaration.userId, notification);

    await this.logsService.logActivity({
      userId: user.id,
      action: `VOLUNTEERING_${input.status}`,
      resource: 'volunteering',
      resourceId: id,
      ipAddress,
    });

    return this.toSummary(declaration);
  }

  private async findOwnedPending(user: AuthUser, id: string) {
    const existing = await this.prisma.volunteeringDeclaration.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Déclaration introuvable');
    }

    if (existing.userId !== user.id) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres déclarations');
    }

    if (existing.status !== VolunteeringStatus.PENDING) {
      throw new BadRequestException(
        'Seules les déclarations en attente peuvent être modifiées ou supprimées',
      );
    }

    return existing;
  }

  private buildListFilter(
    user: AuthUser,
    query: { status?: VolunteeringStatus; userId?: string; scope?: 'mine' | 'all' },
  ): Prisma.VolunteeringDeclarationWhereInput {
    const isAdmin = user.roles.includes(RoleCode.ADMIN);
    const where: Prisma.VolunteeringDeclarationWhereInput = {};

    // Member space always shows own declarations. Club-wide list is admin-only via scope=all.
    if (isAdmin && query.scope === 'all') {
      if (query.userId) where.userId = query.userId;
    } else {
      where.userId = user.id;
    }

    if (query.status) where.status = query.status;
    return where;
  }

  private resolveTargetUserId(user: AuthUser, targetUserId?: string) {
    if (targetUserId && user.roles.includes(RoleCode.ADMIN)) return targetUserId;
    return user.id;
  }

  private sumHours(
    items: { hours: Prisma.Decimal | number }[],
  ) {
    return items.reduce((sum, item) => sum + Number(item.hours), 0);
  }

  private toSummary(item: VolunteeringWithUser): VolunteeringSummary {
    return {
      id: item.id,
      userId: item.userId,
      userName: `${item.user.firstName} ${item.user.lastName}`,
      visitedClub: item.visitedClub,
      city: item.city,
      country: item.country,
      activity: item.activity,
      description: item.description,
      date: item.date.toISOString(),
      startTime: item.startTime,
      durationMinutes: item.durationMinutes,
      hours: Number(item.hours),
      proofUrl: item.proofUrl,
      status: item.status,
      validatedByName: item.validatedBy
        ? `${item.validatedBy.firstName} ${item.validatedBy.lastName}`
        : null,
      validatedAt: item.validatedAt?.toISOString() ?? null,
      rejectionReason: item.rejectionReason,
      createdAt: item.createdAt.toISOString(),
    };
  }
}
