import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { NotificationItem } from '@rotary/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { buildMeta, resolvePagination } from '../../common/utils/pagination';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  resource?: string;
  resourceId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findForUser(userId: string, query: { page?: number; limit?: number }) {
    const { skip, take, page, limit } = resolvePagination(query);

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      data: items.map((n) => this.toItem(n)),
      meta: buildMeta(page, limit, total),
    };
  }

  async getCounts(userId: string) {
    const [unread, unreadMessages] = await Promise.all([
      this.prisma.notification.count({
        where: { userId, readAt: null },
      }),
      this.countUnreadMessages(userId),
    ]);

    return { unread, unreadMessages };
  }

  async create(input: CreateNotificationInput): Promise<NotificationItem> {
    const notification = await this.prisma.notification.create({
      data: input,
    });
    return this.toItem(notification);
  }

  async createMany(inputs: CreateNotificationInput[]) {
    if (inputs.length === 0) return [];
    await this.prisma.notification.createMany({ data: inputs });
    return inputs;
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) return null;

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    return this.toItem(updated);
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  async countUnreadMessages(userId: string) {
    const memberships = await this.prisma.conversationMember.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    let unread = 0;
    for (const membership of memberships) {
      const lastMessage = membership.conversation.messages[0];
      if (!lastMessage || lastMessage.senderId === userId) continue;
      if (
        !membership.lastReadAt ||
        lastMessage.createdAt > membership.lastReadAt
      ) {
        unread += 1;
      }
    }
    return unread;
  }

  private toItem(
    notification: Prisma.NotificationGetPayload<Record<string, never>>,
  ): NotificationItem {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      resource: notification.resource,
      resourceId: notification.resourceId,
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}
