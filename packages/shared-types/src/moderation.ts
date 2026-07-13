import { z } from 'zod';
import { postCommentSchema, postSummarySchema } from './posts.js';

export const moderationPostSchema = postSummarySchema.extend({
  commentCount: z.number().int(),
});

export type ModerationPost = z.infer<typeof moderationPostSchema>;

export const moderationCommentSchema = postCommentSchema.extend({
  postId: z.string().uuid(),
  postPreview: z.string(),
});

export type ModerationComment = z.infer<typeof moderationCommentSchema>;

export const contentReportTargetSchema = z.enum(['POST', 'COMMENT']);

export type ContentReportTarget = z.infer<typeof contentReportTargetSchema>;

export const CONTENT_REPORT_TARGET_LABELS: Record<ContentReportTarget, string> = {
  POST: 'Publication',
  COMMENT: 'Commentaire',
};

const personPreviewSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
});

export const moderationReportSchema = z.object({
  id: z.string().uuid(),
  targetType: contentReportTargetSchema,
  targetId: z.string().uuid(),
  reason: z.string().nullable(),
  createdAt: z.string().datetime(),
  reporter: personPreviewSchema,
  targetContent: z.string().nullable(),
  targetAuthor: personPreviewSchema.nullable(),
  targetExists: z.boolean(),
});

export type ModerationReport = z.infer<typeof moderationReportSchema>;
