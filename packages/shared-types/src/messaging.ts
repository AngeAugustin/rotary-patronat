import { z } from 'zod';

export const ConversationType = {
  DIRECT: 'DIRECT',
  GROUP: 'GROUP',
} as const;

export type ConversationType = (typeof ConversationType)[keyof typeof ConversationType];

export const messageParticipantSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
});

export type MessageParticipant = z.infer<typeof messageParticipantSchema>;

export const messagingRecipientSchema = messageParticipantSchema.extend({
  email: z.string().email().optional(),
});

export type MessagingRecipient = z.infer<typeof messagingRecipientSchema>;

export const conversationSummarySchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['DIRECT', 'GROUP']),
  name: z.string().nullable(),
  participants: z.array(messageParticipantSchema),
  lastMessage: z
    .object({
      id: z.string().uuid(),
      content: z.string(),
      senderId: z.string().uuid(),
      createdAt: z.string().datetime(),
    })
    .nullable(),
  unreadCount: z.number().int(),
  updatedAt: z.string().datetime(),
});

export type ConversationSummary = z.infer<typeof conversationSummarySchema>;

export const MessageReceiptStatus = {
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
} as const;

export type MessageReceiptStatus =
  (typeof MessageReceiptStatus)[keyof typeof MessageReceiptStatus];

export const messageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  senderName: z.string(),
  content: z.string(),
  attachments: z
    .array(
      z.object({ type: z.string(), url: z.string(), name: z.string().optional() }),
    )
    .nullable(),
  createdAt: z.string().datetime(),
  /** Accusé d’envoi/lecture (uniquement pour les messages de l’utilisateur courant). */
  receiptStatus: z.enum(['SENT', 'DELIVERED', 'READ']).nullable(),
});

export type Message = z.infer<typeof messageSchema>;

export const conversationDetailSchema = conversationSummarySchema.extend({
  messages: z.array(messageSchema),
});

export type ConversationDetail = z.infer<typeof conversationDetailSchema>;

export const createConversationSchema = z.object({
  type: z.enum(['DIRECT', 'GROUP']),
  name: z.string().min(1).optional(),
  participantIds: z.array(z.string().uuid()).min(1),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Le message est requis'),
  attachments: z
    .array(z.object({ type: z.string(), url: z.string(), name: z.string().optional() }))
    .optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
