import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AssignCommissionMemberInput,
  CommissionAdmin,
  CreateCommissionInput,
  UpdateCommissionInput,
} from '@rotary/shared-types';
import { LogsService } from '../logs/logs.service';
import { buildMeta, resolvePagination } from '../../common/utils/pagination';

@Injectable()
export class CommissionsAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logsService: LogsService,
  ) {}

  async findAll(page = 1, limit = 20) {
    const { skip, take, page: p, limit: l } = resolvePagination({ page, limit });

    const [items, total] = await Promise.all([
      this.prisma.commission.findMany({
        include: {
          leadUser: true,
          _count: { select: { members: true } },
        },
        orderBy: { sortOrder: 'asc' },
        skip,
        take,
      }),
      this.prisma.commission.count(),
    ]);

    return {
      data: items.map((c) => this.toAdmin(c)),
      meta: buildMeta(p, l, total),
    };
  }

  async findById(id: string): Promise<CommissionAdmin> {
    const commission = await this.prisma.commission.findUnique({
      where: { id },
      include: {
        leadUser: true,
        members: {
          include: {
            user: {
              include: { roles: { include: { role: true } } },
            },
          },
        },
        _count: { select: { members: true } },
      },
    });

    if (!commission) {
      throw new NotFoundException({
        error: { code: 'COMMISSION_NOT_FOUND', message: 'Commission introuvable' },
      });
    }

    const memberIds = commission.members.map((m) => m.userId);
    const commissionCounts =
      memberIds.length > 0
        ? await this.prisma.commissionMember.groupBy({
            by: ['userId'],
            where: { userId: { in: memberIds } },
            _count: { _all: true },
          })
        : [];
    const countByUserId = new Map(
      commissionCounts.map((row) => [row.userId, row._count._all]),
    );

    return this.toAdmin(commission, true, countByUserId);
  }

  async create(input: CreateCommissionInput, actorId: string, ipAddress?: string) {
    const commission = await this.prisma.commission.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        sortOrder: input.sortOrder ?? 0,
        leadUserId: input.leadUserId,
      },
      include: {
        leadUser: true,
        _count: { select: { members: true } },
      },
    });

    await this.logsService.logActivity({
      userId: actorId,
      action: 'COMMISSION_CREATE',
      resource: 'commissions',
      resourceId: commission.id,
      ipAddress,
    });

    return this.toAdmin(commission);
  }

  async update(
    id: string,
    input: UpdateCommissionInput,
    actorId: string,
    ipAddress?: string,
  ) {
    await this.findById(id);

    const commission = await this.prisma.commission.update({
      where: { id },
      data: input,
      include: {
        leadUser: true,
        _count: { select: { members: true } },
      },
    });

    await this.logsService.logActivity({
      userId: actorId,
      action: 'COMMISSION_UPDATE',
      resource: 'commissions',
      resourceId: id,
      ipAddress,
    });

    return this.toAdmin(commission);
  }

  async remove(id: string, actorId: string, ipAddress?: string) {
    const commission = await this.prisma.commission.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
    });

    if (!commission) {
      throw new NotFoundException({
        error: { code: 'COMMISSION_NOT_FOUND', message: 'Commission introuvable' },
      });
    }

    if (commission._count.members > 0) {
      throw new BadRequestException({
        error: {
          code: 'COMMISSION_HAS_MEMBERS',
          message:
            'Impossible de supprimer une commission associée à des utilisateurs. Retirez d’abord tous les membres.',
        },
      });
    }

    // Projects require a commission (ON DELETE RESTRICT). Posts / documents /
    // calendar events detach automatically (ON DELETE SET NULL).
    if (commission._count.projects > 0) {
      const n = commission._count.projects;
      throw new BadRequestException({
        error: {
          code: 'COMMISSION_HAS_PROJECTS',
          message: `Impossible de supprimer cette commission : ${n} projet${n > 1 ? 's' : ''} y ${n > 1 ? 'sont' : 'est'} encore rattaché${n > 1 ? 's' : ''}. Réaffectez ou supprimez-les d’abord.`,
        },
      });
    }

    await this.prisma.commission.delete({ where: { id } });

    await this.logsService.logActivity({
      userId: actorId,
      action: 'COMMISSION_DELETE',
      resource: 'commissions',
      resourceId: id,
      metadata: { name: commission.name, slug: commission.slug },
      ipAddress,
    });

    return { id };
  }

  async assignMember(
    commissionId: string,
    input: AssignCommissionMemberInput,
    actorId: string,
    ipAddress?: string,
  ) {
    await this.findById(commissionId);

    const user = await this.prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) {
      throw new NotFoundException({
        error: { code: 'USER_NOT_FOUND', message: 'Utilisateur introuvable' },
      });
    }

    await this.prisma.commissionMember.upsert({
      where: {
        userId_commissionId: {
          userId: input.userId,
          commissionId,
        },
      },
      update: { role: input.role },
      create: {
        userId: input.userId,
        commissionId,
        role: input.role,
      },
    });

    await this.logsService.logActivity({
      userId: actorId,
      action: 'COMMISSION_MEMBER_ASSIGN',
      resource: 'commissions',
      resourceId: commissionId,
      metadata: { targetUserId: input.userId, role: input.role },
      ipAddress,
    });

    return this.findById(commissionId);
  }

  async removeMember(
    commissionId: string,
    userId: string,
    actorId: string,
    ipAddress?: string,
  ) {
    const member = await this.prisma.commissionMember.findUnique({
      where: { userId_commissionId: { userId, commissionId } },
    });

    if (!member) {
      throw new NotFoundException({
        error: { code: 'MEMBER_NOT_FOUND', message: 'Membre introuvable dans cette commission' },
      });
    }

    const remaining = await this.prisma.commissionMember.count({
      where: { userId, NOT: { commissionId } },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });

    const isAdmin = user?.roles.some((r) => r.role.code === 'ADMIN');
    if (!isAdmin && remaining < 1 && user?.isActive) {
      throw new BadRequestException({
        error: {
          code: 'COMMISSION_REQUIRED',
          message: 'Un membre actif doit rester rattaché à au moins une commission',
        },
      });
    }

    await this.prisma.commissionMember.delete({
      where: { userId_commissionId: { userId, commissionId } },
    });

    await this.logsService.logActivity({
      userId: actorId,
      action: 'COMMISSION_MEMBER_REMOVE',
      resource: 'commissions',
      resourceId: commissionId,
      metadata: { targetUserId: userId },
      ipAddress,
    });

    return this.findById(commissionId);
  }

  private toAdmin(
    commission: {
      id: string;
      name: string;
      slug: string;
      description: string;
      sortOrder: number;
      leadUserId: string | null;
      leadUser: { firstName: string; lastName: string } | null;
      _count: { members: number };
      members?: Array<{
        userId: string;
        role: string;
        user: {
          firstName: string;
          lastName: string;
          email: string;
          isActive?: boolean;
          roles?: Array<{ role: { code: string } }>;
        };
      }>;
    },
    withMembers = false,
    commissionCountByUserId?: Map<string, number>,
  ): CommissionAdmin {
    return {
      id: commission.id,
      name: commission.name,
      slug: commission.slug,
      description: commission.description,
      sortOrder: commission.sortOrder,
      leadUserId: commission.leadUserId,
      leadUserName: commission.leadUser
        ? `${commission.leadUser.firstName} ${commission.leadUser.lastName}`
        : null,
      memberCount: commission._count.members,
      members: withMembers && commission.members
        ? commission.members.map((m) => {
            const isAdmin = m.user.roles?.some((r) => r.role.code === 'ADMIN') ?? false;
            const totalCommissions = commissionCountByUserId?.get(m.userId) ?? 1;
            const canRemove =
              isAdmin || m.user.isActive === false || totalCommissions > 1;

            return {
              userId: m.userId,
              firstName: m.user.firstName,
              lastName: m.user.lastName,
              email: m.user.email,
              role: m.role,
              canRemove,
            };
          })
        : undefined,
    };
  }
}
