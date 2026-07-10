import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, VolunteeringStatus } from '@prisma/client';
import {
  MemberVolunteeringStats,
  RoleCode,
  UserProfile,
  VolunteeringSummary,
} from '@rotary/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

type VolunteeringRow = Prisma.VolunteeringDeclarationGetPayload<{
  include: { user: true; validatedBy: true };
}>;

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        member: true,
        commissions: { include: { commission: true } },
      },
    });

    if (!user) {
      throw new NotFoundException({
        error: { code: 'USER_NOT_FOUND', message: 'Utilisateur introuvable' },
      });
    }

    const declarations = await this.prisma.volunteeringDeclaration.findMany({
      where: { userId },
      include: { user: true, validatedBy: true },
      orderBy: { date: 'desc' },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      roles: user.roles.map((ur) => ur.role.code as RoleCode),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      memberId: user.member?.id ?? null,
      phone: user.member?.phone ?? null,
      profession: user.member?.profession ?? null,
      motivation: user.member?.motivation ?? null,
      sponsorFirstName: user.member?.sponsorFirstName ?? null,
      sponsorLastName: user.member?.sponsorLastName ?? null,
      memberStatus: user.member?.status ?? null,
      joinedAt: user.member?.joinedAt.toISOString() ?? null,
      commissions: user.commissions.map((cm) => ({
        commissionId: cm.commissionId,
        commissionName: cm.commission.name,
        role: cm.role,
      })),
      volunteering: this.toVolunteeringStats(declarations),
      volunteeringDeclarations: declarations.map((d) => this.toVolunteeringSummary(d)),
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
}
