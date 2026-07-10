import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberStatus, Prisma, VolunteeringStatus } from '@prisma/client';
import {
  MemberDetail,
  MemberSummary,
  MemberVolunteeringStats,
  VolunteeringSummary,
} from '@rotary/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { buildMeta, resolvePagination } from '../../common/utils/pagination';
import { LogsService } from '../logs/logs.service';

type MemberWithUser = Prisma.MemberGetPayload<{
  include: {
    user: {
      include: {
        commissions: { include: { commission: true } };
      };
    };
  };
}>;

type VolunteeringRow = Prisma.VolunteeringDeclarationGetPayload<{
  include: {
    user: true;
    validatedBy: true;
  };
}>;

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logsService: LogsService,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    q?: string;
    withoutAccount?: boolean;
  }) {
    const { skip, take, page, limit } = resolvePagination(query);
    const where: Prisma.MemberWhereInput = {};

    if (query.withoutAccount) {
      where.userId = null;
    }

    if (query.q) {
      where.OR = [
        { email: { contains: query.q, mode: 'insensitive' } },
        { firstName: { contains: query.q, mode: 'insensitive' } },
        { lastName: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        orderBy: { joinedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.member.count({ where }),
    ]);

    return {
      data: items.map((item) => this.toSummary(item)),
      meta: buildMeta(page, limit, total),
    };
  }

  async findDetail(id: string): Promise<MemberDetail> {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            commissions: { include: { commission: true } },
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Membre introuvable');
    }

    const declarations = member.userId
      ? await this.prisma.volunteeringDeclaration.findMany({
          where: { userId: member.userId },
          include: { user: true, validatedBy: true },
          orderBy: { date: 'desc' },
        })
      : [];

    return this.toDetail(member, declarations);
  }

  async createFromApplication(
    application: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      profession: string;
      sponsorFirstName: string | null;
      sponsorLastName: string | null;
      motivation: string;
    },
    actorId: string,
    ipAddress?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;

    const existing = await client.member.findUnique({
      where: { email: application.email.toLowerCase() },
    });
    if (existing) {
      if (!existing.membershipApplicationId) {
        await client.member.update({
          where: { id: existing.id },
          data: { membershipApplicationId: application.id },
        });
      }
      return existing;
    }

    const member = await client.member.create({
      data: {
        firstName: application.firstName,
        lastName: application.lastName,
        email: application.email.toLowerCase(),
        phone: application.phone,
        profession: application.profession,
        sponsorFirstName: application.sponsorFirstName,
        sponsorLastName: application.sponsorLastName,
        motivation: application.motivation,
        membershipApplicationId: application.id,
      },
    });

    if (!tx) {
      await this.logsService.logActivity({
        userId: actorId,
        action: 'MEMBER_CREATE',
        resource: 'members',
        resourceId: member.id,
        ipAddress,
      });
    }

    return member;
  }

  async linkToUser(memberId: string, userId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    const member = await client.member.findUnique({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('Membre introuvable');
    }
    if (member.userId) {
      throw new ConflictException('Ce membre possède déjà un compte utilisateur');
    }

    return client.member.update({
      where: { id: memberId },
      data: { userId },
    });
  }

  async findForUserCreation(memberId: string) {
    const member = await this.prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('Membre introuvable');
    }
    if (member.userId) {
      throw new ConflictException('Ce membre possède déjà un compte utilisateur');
    }
    if (member.status !== MemberStatus.ACTIVE) {
      throw new ConflictException('Ce membre n\'est pas actif');
    }
    return member;
  }

  private toSummary(
    member: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      profession: string | null;
      status: MemberStatus;
      joinedAt: Date;
      userId: string | null;
    },
  ): MemberSummary {
    return {
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      profession: member.profession,
      status: member.status,
      joinedAt: member.joinedAt.toISOString(),
      hasAccount: member.userId !== null,
      userId: member.userId,
    };
  }

  private toVolunteeringStats(declarations: VolunteeringRow[]): MemberVolunteeringStats {
    const sum = (items: VolunteeringRow[]) =>
      items.reduce((acc, item) => acc + Number(item.hours), 0);

    const pending = declarations.filter((d) => d.status === VolunteeringStatus.PENDING);
    const validated = declarations.filter((d) => d.status === VolunteeringStatus.VALIDATED);
    const rejected = declarations.filter((d) => d.status === VolunteeringStatus.REJECTED);

    return {
      declarationCount: declarations.length,
      pendingCount: pending.length,
      validatedCount: validated.length,
      rejectedCount: rejected.length,
      validatedHours: sum(validated),
      pendingHours: sum(pending),
      totalDeclaredHours: sum(declarations),
    };
  }

  private toVolunteeringSummary(item: VolunteeringRow): VolunteeringSummary {
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

  private toDetail(
    member: MemberWithUser,
    declarations: VolunteeringRow[],
  ): MemberDetail {
    return {
      ...this.toSummary(member),
      motivation: member.motivation,
      sponsorFirstName: member.sponsorFirstName,
      sponsorLastName: member.sponsorLastName,
      membershipApplicationId: member.membershipApplicationId,
      commissions:
        member.user?.commissions.map((cm) => ({
          commissionId: cm.commissionId,
          commissionName: cm.commission.name,
          role: cm.role,
        })) ?? [],
      volunteering: this.toVolunteeringStats(declarations),
      volunteeringDeclarations: declarations.map((d) => this.toVolunteeringSummary(d)),
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
    };
  }
}
