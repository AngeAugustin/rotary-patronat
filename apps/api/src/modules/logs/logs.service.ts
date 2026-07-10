import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogEntry } from '@rotary/shared-types';
import { buildMeta, resolvePagination } from '../../common/utils/pagination';

interface LogQuery {
  page?: number;
  limit?: number;
  action?: string;
  userId?: string;
}

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  async logActivity(input: {
    userId?: string;
    action: string;
    resource?: string;
    resourceId?: string;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string;
  }) {
    await this.prisma.activityLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        metadata: input.metadata,
        ipAddress: input.ipAddress,
      },
    });
  }

  async findAll(query: LogQuery) {
    const { skip, take, page, limit } = resolvePagination(query);
    const where: Prisma.ActivityLogWhereInput = {
      ...(query.action ? { action: query.action } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      data: items.map((log) => this.toEntry(log)),
      meta: buildMeta(page, limit, total),
    };
  }

  async findRecent(limit = 10) {
    const items = await this.prisma.activityLog.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return items.map((log) => this.toEntry(log));
  }

  private toEntry(
    log: Prisma.ActivityLogGetPayload<{ include: { user: true } }>,
  ): ActivityLogEntry {
    return {
      id: log.id,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
      user: log.user
        ? {
            id: log.user.id,
            firstName: log.user.firstName,
            lastName: log.user.lastName,
            email: log.user.email,
          }
        : null,
    };
  }
}
