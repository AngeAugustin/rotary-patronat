import { Injectable } from '@nestjs/common';
import { Prisma, RoleCode as PrismaRoleCode } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleCode, ROLE_LABELS } from '@rotary/shared-types';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureDefaultRoles() {
    const roles = Object.values(RoleCode) as PrismaRoleCode[];

    for (const code of roles) {
      await this.prisma.role.upsert({
        where: { code },
        update: { label: ROLE_LABELS[code] },
        create: { code, label: ROLE_LABELS[code] },
      });
    }
  }

  async findAll() {
    const roles = await this.prisma.role.findMany({ orderBy: { code: 'asc' } });
    return roles.map((r) => ({ code: r.code as RoleCode, label: r.label }));
  }

  async getRoleIdsByCodes(codes: RoleCode[]) {
    const roles = await this.prisma.role.findMany({
      where: { code: { in: codes as PrismaRoleCode[] } },
    });
    return roles.map((role) => role.id);
  }
}

export type UserWithRoles = Prisma.UserGetPayload<{
  include: { roles: { include: { role: true } } };
}>;
