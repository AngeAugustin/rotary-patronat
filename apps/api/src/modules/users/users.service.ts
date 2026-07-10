import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RoleCode as PrismaRoleCode } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateUserInput,
  RoleCode,
  UpdateUserInput,
  UserDetail,
  UserSummary,
} from '@rotary/shared-types';
import { RolesService } from '../roles/roles.service';
import { LogsService } from '../logs/logs.service';
import { MembersService } from '../members/members.service';
import { MailService } from '../mail/mail.service';
import { buildMeta, resolvePagination } from '../../common/utils/pagination';
import { generatePassword } from '../../common/utils/generate-password';

type UserFull = Prisma.UserGetPayload<{
  include: {
    roles: { include: { role: true } };
    commissions: { include: { commission: true } };
    member: { select: { id: true } };
  };
}>;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rolesService: RolesService,
    private readonly logsService: LogsService,
    private readonly membersService: MembersService,
    private readonly mailService: MailService,
  ) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { roles: { include: { role: true } } },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
  }

  async findAll(page = 1, limit = 20, q?: string) {
    const { skip, take, page: p, limit: l } = resolvePagination({ page, limit });
    const where: Prisma.UserWhereInput = q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          roles: { include: { role: true } },
          member: { select: { id: true } },
          _count: { select: { commissions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);

    const usersWithoutMember = users.filter((user) => !user.member);
    const membersByEmail =
      usersWithoutMember.length > 0
        ? await this.prisma.member.findMany({
            where: {
              email: {
                in: usersWithoutMember.map((user) => user.email.toLowerCase()),
              },
            },
            select: { id: true, email: true },
          })
        : [];
    const memberIdByEmail = new Map(
      membersByEmail.map((member) => [member.email.toLowerCase(), member.id]),
    );

    return {
      data: users.map((user) =>
        this.toSummary({
          ...user,
          member:
            user.member ??
            (memberIdByEmail.has(user.email.toLowerCase())
              ? { id: memberIdByEmail.get(user.email.toLowerCase())! }
              : null),
        }),
      ),
      meta: buildMeta(p, l, total),
    };
  }

  async findDetail(id: string): Promise<UserDetail> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: true } },
        commissions: { include: { commission: true } },
        member: { select: { id: true } },
        _count: { select: { commissions: true } },
      },
    });

    if (!user) {
      throw new NotFoundException({
        error: { code: 'USER_NOT_FOUND', message: 'Utilisateur introuvable' },
      });
    }

    return this.toDetail(user);
  }

  async create(input: CreateUserInput, actorId: string, ipAddress?: string) {
    const member = await this.membersService.findForUserCreation(input.memberId);

    const existing = await this.findByEmail(member.email);
    if (existing) {
      throw new ConflictException({
        error: { code: 'EMAIL_EXISTS', message: 'Cet e-mail est déjà utilisé' },
      });
    }

    const plainPassword = generatePassword(12);
    const passwordHash = await argon2.hash(plainPassword);
    const roleIds = await this.rolesService.getRoleIdsByCodes(input.roles);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: member.email.toLowerCase(),
          passwordHash,
          firstName: member.firstName,
          lastName: member.lastName,
          roles: { create: roleIds.map((roleId) => ({ roleId })) },
          commissions: {
            create: input.commissions.map((c) => ({
              commissionId: c.commissionId,
              role: c.role,
            })),
          },
        },
        include: {
          roles: { include: { role: true } },
          commissions: { include: { commission: true } },
          member: { select: { id: true } },
          _count: { select: { commissions: true } },
        },
      });

      await tx.member.update({
        where: { id: member.id },
        data: { userId: created.id },
      });

      return tx.user.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          roles: { include: { role: true } },
          commissions: { include: { commission: true } },
          member: { select: { id: true } },
          _count: { select: { commissions: true } },
        },
      });
    });

    await this.logsService.logActivity({
      userId: actorId,
      action: 'USER_CREATE',
      resource: 'users',
      resourceId: user.id,
      ipAddress,
    });

    void this.mailService
      .sendUserCredentials({
        to: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: plainPassword,
      })
      .catch((error: unknown) => {
        this.logger.error(
          `Impossible d'envoyer l'e-mail d'identifiants à ${user.email}`,
          error instanceof Error ? error.stack : String(error),
        );
      });

    return this.toDetail(user);
  }

  async update(
    id: string,
    input: UpdateUserInput,
    actorId: string,
    ipAddress?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException({
        error: { code: 'USER_NOT_FOUND', message: 'Utilisateur introuvable' },
      });
    }

    if (input.isActive === true || (input.isActive !== false && user.isActive)) {
      const commissionCount =
        input.commissions?.length ??
        (await this.prisma.commissionMember.count({ where: { userId: id } }));
      if (commissionCount < 1) {
        throw new BadRequestException({
          error: {
            code: 'COMMISSION_REQUIRED',
            message: 'Un membre actif doit être rattaché à au moins une commission',
          },
        });
      }
    }

    if (input.email) {
      const dup = await this.findByEmail(input.email);
      if (dup && dup.id !== id) {
        throw new ConflictException({
          error: { code: 'EMAIL_EXISTS', message: 'Cet e-mail est déjà utilisé' },
        });
      }
    }

    await this.prisma.$transaction(async (tx) => {
      if (input.roles) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        const roleIds = await this.rolesService.getRoleIdsByCodes(input.roles);
        await tx.userRole.createMany({
          data: roleIds.map((roleId) => ({ userId: id, roleId })),
        });
      }

      if (input.commissions) {
        await tx.commissionMember.deleteMany({ where: { userId: id } });
        await tx.commissionMember.createMany({
          data: input.commissions.map((c) => ({
            userId: id,
            commissionId: c.commissionId,
            role: c.role,
          })),
        });
      }

      await tx.user.update({
        where: { id },
        data: {
          email: input.email?.toLowerCase(),
          firstName: input.firstName,
          lastName: input.lastName,
          isActive: input.isActive,
        },
      });
    });

    await this.logsService.logActivity({
      userId: actorId,
      action: 'USER_UPDATE',
      resource: 'users',
      resourceId: id,
      ipAddress,
    });

    return this.findDetail(id);
  }

  async remove(id: string, actorId: string, ipAddress?: string) {
    if (id === actorId) {
      throw new ForbiddenException({
        error: {
          code: 'CANNOT_DELETE_SELF',
          message: 'Vous ne pouvez pas supprimer votre propre compte',
        },
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: true } },
        member: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        error: { code: 'USER_NOT_FOUND', message: 'Utilisateur introuvable' },
      });
    }

    const isAdmin = user.roles.some((ur) => ur.role.code === PrismaRoleCode.ADMIN);
    if (isAdmin) {
      const adminCount = await this.prisma.userRole.count({
        where: {
          role: { code: PrismaRoleCode.ADMIN },
          user: { isActive: true },
        },
      });
      if (adminCount <= 1 && user.isActive) {
        throw new BadRequestException({
          error: {
            code: 'LAST_ADMIN',
            message: 'Impossible de supprimer le dernier administrateur actif',
          },
        });
      }
    }

    const hadMember = Boolean(user.member);

    await this.prisma.user.delete({ where: { id } });

    await this.logsService.logActivity({
      userId: actorId,
      action: 'USER_DELETE',
      resource: 'users',
      resourceId: id,
      ipAddress,
      metadata: {
        email: user.email,
        hadMember,
      },
    });

    return { success: true, hadMember };
  }

  mapToAuthUser(user: { id: string; email: string; firstName: string; lastName: string; isActive: boolean; roles: { role: { code: PrismaRoleCode } }[] }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      roles: user.roles.map((ur) => ur.role.code as RoleCode),
    };
  }

  private toSummary(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    createdAt: Date;
    roles: { role: { code: PrismaRoleCode } }[];
    _count: { commissions: number };
    member?: { id: string } | null;
  }): UserSummary {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      roles: user.roles.map((ur) => ur.role.code as RoleCode),
      commissionCount: user._count.commissions,
      memberId: user.member?.id ?? null,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private toDetail(user: UserFull): UserDetail {
    const summary: UserSummary = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      roles: user.roles.map((ur) => ur.role.code as RoleCode),
      commissionCount: user.commissions.length,
      memberId: user.member?.id ?? null,
      createdAt: user.createdAt.toISOString(),
    };

    return {
      ...summary,
      commissions: user.commissions.map((cm) => ({
        commissionId: cm.commissionId,
        commissionName: cm.commission.name,
        role: cm.role,
      })),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
