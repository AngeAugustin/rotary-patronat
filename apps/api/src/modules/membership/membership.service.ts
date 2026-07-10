import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MembershipApplicationStatus } from '@prisma/client';
import {
  AuthUser,
  CreateMembershipApplicationInput,
  MembershipApplicationSummary,
  ReviewMembershipApplicationInput,
  RoleCode,
} from '@rotary/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { buildMeta, resolvePagination } from '../../common/utils/pagination';
import { LogsService } from '../logs/logs.service';
import { MailService } from '../mail/mail.service';
import { MembersService } from '../members/members.service';
import { sanitizePlainText } from '../../common/utils/sanitize';

@Injectable()
export class MembershipService {
  private readonly logger = new Logger(MembershipService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly logsService: LogsService,
    private readonly membersService: MembersService,
    private readonly mailService: MailService,
  ) {}

  async create(input: CreateMembershipApplicationInput, ipAddress?: string) {
    const sponsorFirstName = this.optionalText(input.sponsorFirstName);
    const sponsorLastName = this.optionalText(input.sponsorLastName);

    const application = await this.prisma.membershipApplication.create({
      data: {
        firstName: sanitizePlainText(input.firstName),
        lastName: sanitizePlainText(input.lastName),
        email: input.email.toLowerCase().trim(),
        phone: sanitizePlainText(input.phone),
        profession: sanitizePlainText(input.profession),
        sponsorFirstName: sponsorFirstName ? sanitizePlainText(sponsorFirstName) : null,
        sponsorLastName: sponsorLastName ? sanitizePlainText(sponsorLastName) : null,
        motivation: sanitizePlainText(input.motivation),
        attachmentUrls: input.attachmentUrls ?? [],
      },
    });

    await this.logsService.logActivity({
      action: 'MEMBERSHIP_APPLICATION_CREATE',
      resource: 'membership_applications',
      resourceId: application.id,
      ipAddress,
    });

    void this.mailService
      .sendMembershipApplicationConfirmation({
        to: application.email,
        firstName: application.firstName,
        lastName: application.lastName,
      })
      .catch((error: unknown) => {
        this.logger.error(
          `Impossible d'envoyer l'e-mail de confirmation à ${application.email}`,
          error instanceof Error ? error.stack : String(error),
        );
      });

    return this.toSummary(application);
  }

  async findAll(
    user: AuthUser,
    query: { page?: number; limit?: number; status?: MembershipApplicationStatus },
  ) {
    this.assertAdmin(user);

    const { skip, take, page, limit } = resolvePagination(query);
    const where = query.status ? { status: query.status } : {};

    const [items, total] = await Promise.all([
      this.prisma.membershipApplication.findMany({
        where,
        include: { reviewedBy: true, member: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.membershipApplication.count({ where }),
    ]);

    return {
      data: items.map((item) => this.toSummary(item)),
      meta: buildMeta(page, limit, total),
    };
  }

  async findOne(user: AuthUser, id: string) {
    this.assertAdmin(user);

    const application = await this.prisma.membershipApplication.findUnique({
      where: { id },
      include: { reviewedBy: true, member: true },
    });
    if (!application) throw new NotFoundException('Candidature introuvable');

    return this.toSummary(application);
  }

  async review(
    user: AuthUser,
    id: string,
    input: ReviewMembershipApplicationInput,
    ipAddress?: string,
  ) {
    this.assertAdmin(user);

    const existing = await this.prisma.membershipApplication.findUnique({
      where: { id },
      include: { reviewedBy: true, member: true },
    });
    if (!existing) throw new NotFoundException('Candidature introuvable');

    const application = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.membershipApplication.update({
        where: { id },
        data: {
          status: input.status as MembershipApplicationStatus,
          adminNotes: input.adminNotes ? sanitizePlainText(input.adminNotes) : null,
          reviewedById: user.id,
          reviewedAt: new Date(),
        },
        include: { reviewedBy: true, member: true },
      });

      if (input.status === 'ACCEPTED' && !updated.member) {
        await this.membersService.createFromApplication(
          updated,
          user.id,
          ipAddress,
          tx,
        );
      }

      return tx.membershipApplication.findUnique({
        where: { id },
        include: { reviewedBy: true, member: true },
      });
    });

    if (!application) throw new NotFoundException('Candidature introuvable');

    await this.logsService.logActivity({
      userId: user.id,
      action: `MEMBERSHIP_APPLICATION_${input.status}`,
      resource: 'membership_applications',
      resourceId: id,
      ipAddress,
    });

    if (input.status === 'ACCEPTED' && existing.status !== 'ACCEPTED') {
      void this.mailService
        .sendMembershipApplicationAccepted({
          to: application.email,
          firstName: application.firstName,
          lastName: application.lastName,
        })
        .catch((error: unknown) => {
          this.logger.error(
            `Impossible d'envoyer l'e-mail d'acceptation à ${application.email}`,
            error instanceof Error ? error.stack : String(error),
          );
        });
    }

    return this.toSummary(application);
  }

  async remove(user: AuthUser, id: string, ipAddress?: string) {
    this.assertAdmin(user);

    const existing = await this.prisma.membershipApplication.findUnique({
      where: { id },
      include: { member: true },
    });
    if (!existing) throw new NotFoundException('Candidature introuvable');

    await this.prisma.membershipApplication.delete({ where: { id } });

    await this.logsService.logActivity({
      userId: user.id,
      action: 'MEMBERSHIP_APPLICATION_DELETE',
      resource: 'membership_applications',
      resourceId: id,
      ipAddress,
    });

    return { success: true, hadMember: Boolean(existing.member) };
  }

  private assertAdmin(user: AuthUser) {
    if (!user.roles.includes(RoleCode.ADMIN)) {
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }
  }

  private optionalText(value?: string) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  private toSummary(
    item: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      profession: string;
      sponsorFirstName: string | null;
      sponsorLastName: string | null;
      motivation: string;
      attachmentUrls: unknown;
      status: MembershipApplicationStatus;
      adminNotes: string | null;
      reviewedAt: Date | null;
      createdAt: Date;
      reviewedBy?: { firstName: string; lastName: string } | null;
      member?: { id: string } | null;
    },
  ): MembershipApplicationSummary {
    return {
      id: item.id,
      firstName: item.firstName,
      lastName: item.lastName,
      email: item.email,
      phone: item.phone,
      profession: item.profession,
      sponsorFirstName: item.sponsorFirstName,
      sponsorLastName: item.sponsorLastName,
      motivation: item.motivation,
      attachmentUrls: Array.isArray(item.attachmentUrls)
        ? item.attachmentUrls.filter((v): v is string => typeof v === 'string')
        : null,
      status: item.status,
      adminNotes: item.adminNotes,
      reviewedByName: item.reviewedBy
        ? `${item.reviewedBy.firstName} ${item.reviewedBy.lastName}`
        : null,
      reviewedAt: item.reviewedAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
      memberId: item.member?.id ?? null,
    };
  }
}
