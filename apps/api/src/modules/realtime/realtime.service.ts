import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { NotificationItem, Message } from '@rotary/shared-types';

@Injectable()
export class RealtimeService {
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to(`user:${userId}`).emit(event, payload);
  }

  emitToConversation(conversationId: string, event: string, payload: unknown) {
    this.server?.to(`conversation:${conversationId}`).emit(event, payload);
  }

  emitFeedUpdate() {
    this.server?.to('feed').emit('feed:updated');
  }

  notifyUser(userId: string, notification: NotificationItem) {
    this.emitToUser(userId, 'notification:new', notification);
  }

  broadcastMessage(conversationId: string, message: Message) {
    this.emitToConversation(conversationId, 'message:new', message);
  }

  broadcastReceiptsUpdated(conversationId: string) {
    this.emitToConversation(conversationId, 'message:receipts', {
      conversationId,
    });
  }
}
