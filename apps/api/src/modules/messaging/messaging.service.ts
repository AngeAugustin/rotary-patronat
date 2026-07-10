import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConversationType, NotificationType, Prisma } from '@prisma/client';
import {
  AuthUser,
  ConversationDetail,
  ConversationSummary,
  CreateConversationInput,
  Message,
  MessageReceiptStatus,
  MessagingRecipient,
  SendMessageInput,
} from '@rotary/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { buildMeta, resolvePagination } from '../../common/utils/pagination';
import { LogsService } from '../logs/logs.service';
import { sanitizePlainText } from '../../common/utils/sanitize';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';

type ConversationWithRelations = Prisma.ConversationGetPayload<{
  include: {
    members: { include: { user: true } };
    messages: {
      include: { sender: true };
      orderBy: { createdAt: 'desc' };
      take: 1;
    };
  };
}>;

type MessageWithSender = Prisma.MessageGetPayload<{ include: { sender: true } }>;

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logsService: LogsService,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async listRecipients(user: AuthUser, q?: string): Promise<MessagingRecipient[]> {
    const query = q?.trim();
    const users = await this.prisma.user.findMany({
      where: {
        id: { not: user.id },
        isActive: true,
        ...(query
          ? {
              OR: [
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: 30,
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    return users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
    }));
  }

  async listConversations(user: AuthUser, query: { page?: number; limit?: number }) {
    const { skip, take, page, limit } = resolvePagination(query);

    const memberships = await this.prisma.conversationMember.findMany({
      where: { userId: user.id },
      include: {
        conversation: {
          include: {
            members: { include: { user: true } },
            messages: {
              include: { sender: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    const all = memberships.map((m) =>
      this.toSummary(m.conversation, user.id, m.lastReadAt),
    );
    const total = all.length;
    const data = all.slice(skip, skip + take);

    return { data, meta: buildMeta(page, limit, total) };
  }

  async getConversation(user: AuthUser, id: string): Promise<ConversationDetail> {
    await this.assertMember(user.id, id);

    const delivered = await this.markDelivered(user.id, id);

    const conversation = await this.prisma.conversation.findUniqueOrThrow({
      where: { id },
      include: {
        members: { include: { user: true } },
        messages: {
          include: { sender: true },
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
      },
    });

    if (delivered) {
      this.realtimeService.broadcastReceiptsUpdated(id);
    }

    const membership = conversation.members.find((m) => m.userId === user.id);
    const peerReadAt = this.peerReadAt(conversation.members, user.id);

    return {
      ...this.toSummary(conversation, user.id, membership?.lastReadAt ?? null),
      messages: conversation.messages.map((m) =>
        this.toMessage(m, user.id, peerReadAt),
      ),
    };
  }

  async createConversation(
    user: AuthUser,
    input: CreateConversationInput,
    ipAddress?: string,
  ) {
    const participantIds = [...new Set([user.id, ...input.participantIds])];

    if (input.type === ConversationType.DIRECT) {
      if (participantIds.length !== 2) {
        throw new BadRequestException(
          'Une conversation directe requiert exactement 2 participants',
        );
      }

      const otherId = participantIds.find((id) => id !== user.id)!;
      const other = await this.prisma.user.findFirst({
        where: { id: otherId, isActive: true },
        select: { id: true },
      });
      if (!other) {
        throw new BadRequestException({
          error: {
            code: 'RECIPIENT_NOT_FOUND',
            message: 'Destinataire introuvable ou inactif',
          },
        });
      }

      const existing = await this.findDirectConversation(participantIds[0], participantIds[1]);
      if (existing) {
        return this.toSummary(existing, user.id, null);
      }
    } else {
      const others = participantIds.filter((id) => id !== user.id);
      if (others.length === 0) {
        throw new BadRequestException('Ajoutez au moins un participant');
      }
      const activeCount = await this.prisma.user.count({
        where: { id: { in: others }, isActive: true },
      });
      if (activeCount !== others.length) {
        throw new BadRequestException({
          error: {
            code: 'RECIPIENT_NOT_FOUND',
            message: 'Un ou plusieurs destinataires sont introuvables ou inactifs',
          },
        });
      }
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        type: input.type as ConversationType,
        name: input.name,
        createdById: user.id,
        members: {
          create: participantIds.map((userId) => ({ userId })),
        },
      },
      include: {
        members: { include: { user: true } },
        messages: { include: { sender: true }, take: 0 },
      },
    });

    await this.logsService.logActivity({
      userId: user.id,
      action: 'CONVERSATION_CREATE',
      resource: 'conversations',
      resourceId: conversation.id,
      ipAddress,
    });

    return this.toSummary(conversation, user.id, null);
  }

  async sendMessage(
    user: AuthUser,
    conversationId: string,
    input: SendMessageInput,
    ipAddress?: string,
  ): Promise<Message> {
    await this.assertMember(user.id, conversationId);

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        content: sanitizePlainText(input.content),
        attachments: input.attachments ?? [],
      },
      include: { sender: true },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    await this.prisma.conversationMember.update({
      where: {
        conversationId_userId: { conversationId, userId: user.id },
      },
      data: { lastReadAt: new Date() },
    });

    const formatted = this.toMessage(message, user.id, null);

    const members = await this.prisma.conversationMember.findMany({
      where: { conversationId, userId: { not: user.id } },
      select: { userId: true },
    });

    for (const member of members) {
      const notification = await this.notificationsService.create({
        userId: member.userId,
        type: NotificationType.NEW_MESSAGE,
        title: `Nouveau message de ${user.firstName} ${user.lastName}`,
        body: input.content.slice(0, 120),
        resource: 'conversations',
        resourceId: conversationId,
      });
      this.realtimeService.notifyUser(member.userId, notification);
      // Permet l’accusé « reçu » même si le destinataire n’a pas ouvert le fil
      this.realtimeService.emitToUser(member.userId, 'message:new', formatted);
    }

    this.realtimeService.broadcastMessage(conversationId, formatted);

    await this.logsService.logActivity({
      userId: user.id,
      action: 'MESSAGE_SEND',
      resource: 'conversations',
      resourceId: conversationId,
      ipAddress,
    });

    return formatted;
  }

  async markDelivered(userId: string, conversationId: string): Promise<boolean> {
    await this.assertMember(userId, conversationId);

    const result = await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        deliveredAt: null,
      },
      data: { deliveredAt: new Date() },
    });

    return result.count > 0;
  }

  async acknowledgeDelivered(user: AuthUser, conversationId: string) {
    const updated = await this.markDelivered(user.id, conversationId);
    if (updated) {
      this.realtimeService.broadcastReceiptsUpdated(conversationId);
    }
    return { success: true, updated };
  }

  async markRead(user: AuthUser, conversationId: string) {
    await this.assertMember(user.id, conversationId);

    const delivered = await this.markDelivered(user.id, conversationId);

    await this.prisma.conversationMember.update({
      where: {
        conversationId_userId: { conversationId, userId: user.id },
      },
      data: { lastReadAt: new Date() },
    });

    if (delivered) {
      this.realtimeService.broadcastReceiptsUpdated(conversationId);
    } else {
      // Lecture seule : le destinataire a déjà reçu, on notifie quand même le statut READ
      this.realtimeService.broadcastReceiptsUpdated(conversationId);
    }

    return { success: true };
  }

  private async findDirectConversation(userA: string, userB: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        type: ConversationType.DIRECT,
        members: {
          every: { userId: { in: [userA, userB] } },
        },
      },
      include: {
        members: { include: { user: true } },
        messages: {
          include: { sender: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return conversations.find((c) => c.members.length === 2) ?? null;
  }

  private async assertMember(userId: string, conversationId: string) {
    const membership = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!membership) {
      throw new ForbiddenException('Conversation non accessible');
    }
  }

  private peerReadAt(
    members: { userId: string; lastReadAt: Date | null }[],
    currentUserId: string,
  ): Date | null {
    const peers = members.filter((m) => m.userId !== currentUserId);
    if (peers.length === 0) return null;
    // DIRECT : un seul pair. GROUP : lu seulement si tous ont lu (min lastReadAt).
    const reads = peers.map((p) => p.lastReadAt).filter((d): d is Date => Boolean(d));
    if (reads.length !== peers.length) return null;
    return reads.reduce((min, d) => (d < min ? d : min));
  }

  private resolveReceiptStatus(
    message: { senderId: string; createdAt: Date; deliveredAt: Date | null },
    currentUserId: string,
    peerReadAt: Date | null,
  ): MessageReceiptStatus | null {
    if (message.senderId !== currentUserId) return null;
    if (peerReadAt && peerReadAt >= message.createdAt) return 'READ';
    if (message.deliveredAt) return 'DELIVERED';
    return 'SENT';
  }

  private toSummary(
    conversation: ConversationWithRelations,
    currentUserId: string,
    lastReadAt: Date | null | undefined,
  ): ConversationSummary {
    const lastMessage = conversation.messages[0];
    const unreadCount =
      lastMessage &&
      lastMessage.senderId !== currentUserId &&
      (!lastReadAt || lastMessage.createdAt > lastReadAt)
        ? 1
        : 0;

    return {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name,
      participants: conversation.members.map((m) => ({
        id: m.user.id,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
      })),
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            content: lastMessage.content,
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt.toISOString(),
          }
        : null,
      unreadCount,
      updatedAt: conversation.updatedAt.toISOString(),
    };
  }

  private toMessage(
    message: MessageWithSender,
    currentUserId: string,
    peerReadAt: Date | null,
  ): Message {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: `${message.sender.firstName} ${message.sender.lastName}`,
      content: message.content,
      attachments: (message.attachments as Message['attachments']) ?? null,
      createdAt: message.createdAt.toISOString(),
      receiptStatus: this.resolveReceiptStatus(message, currentUserId, peerReadAt),
    };
  }
}
