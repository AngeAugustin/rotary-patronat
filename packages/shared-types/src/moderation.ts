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
