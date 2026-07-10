import { z } from 'zod';

export const NotificationType = {
  NEW_MESSAGE: 'NEW_MESSAGE',
  NEW_POST: 'NEW_POST',
  POST_COMMENT: 'POST_COMMENT',
  POST_LIKE: 'POST_LIKE',
  POST_MENTION: 'POST_MENTION',
  VOLUNTEERING_VALIDATED: 'VOLUNTEERING_VALIDATED',
  VOLUNTEERING_REJECTED: 'VOLUNTEERING_REJECTED',
  CALENDAR_INVITE: 'CALENDAR_INVITE',
  SYSTEM: 'SYSTEM',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const notificationSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([
    'NEW_MESSAGE',
    'NEW_POST',
    'POST_COMMENT',
    'POST_LIKE',
    'POST_MENTION',
    'VOLUNTEERING_VALIDATED',
    'VOLUNTEERING_REJECTED',
    'CALENDAR_INVITE',
    'SYSTEM',
  ]),
  title: z.string(),
  body: z.string().nullable(),
  resource: z.string().nullable(),
  resourceId: z.string().nullable(),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type NotificationItem = z.infer<typeof notificationSchema>;

export const notificationCountsSchema = z.object({
  unread: z.number().int(),
  unreadMessages: z.number().int(),
});

export type NotificationCounts = z.infer<typeof notificationCountsSchema>;
