import { z } from 'zod';

export const PostKind = {
  MEMBER_POST: 'MEMBER_POST',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  EVENT: 'EVENT',
  COMMUNIQUE: 'COMMUNIQUE',
} as const;

export type PostKind = (typeof PostKind)[keyof typeof PostKind];

export const POST_KIND_LABELS: Record<PostKind, string> = {
  [PostKind.MEMBER_POST]: 'Publication',
  [PostKind.ANNOUNCEMENT]: 'Annonce',
  [PostKind.EVENT]: 'Événement',
  [PostKind.COMMUNIQUE]: 'Communiqué',
};

export const PostVisibility = {
  ALL_MEMBERS: 'ALL_MEMBERS',
  COMMISSION: 'COMMISSION',
} as const;

export type PostVisibility = (typeof PostVisibility)[keyof typeof PostVisibility];

export const POST_VISIBILITY_LABELS: Record<PostVisibility, string> = {
  [PostVisibility.ALL_MEMBERS]: 'Tous les membres',
  [PostVisibility.COMMISSION]: 'Ma commission',
};

export const postAttachmentSchema = z.object({
  type: z.enum(['image', 'video', 'document', 'link']),
  url: z.string().url(),
  name: z.string().optional(),
});

export type PostAttachment = z.infer<typeof postAttachmentSchema>;

export const postAuthorSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
});

export type PostAuthor = z.infer<typeof postAuthorSchema>;

export const postSummarySchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(['MEMBER_POST', 'ANNOUNCEMENT', 'EVENT', 'COMMUNIQUE']),
  content: z.string(),
  attachments: z.array(postAttachmentSchema).nullable(),
  linkUrl: z.string().url().nullable(),
  visibility: z.enum(['ALL_MEMBERS', 'COMMISSION']),
  commissionId: z.string().uuid().nullable(),
  commissionName: z.string().nullable(),
  author: postAuthorSchema,
  likeCount: z.number().int(),
  commentCount: z.number().int(),
  likedByMe: z.boolean(),
  repostOfId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
});

export type PostSummary = z.infer<typeof postSummarySchema>;

export const postCommentSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  author: postAuthorSchema,
  parentId: z.string().uuid().nullable(),
  replyCount: z.number().int(),
  createdAt: z.string().datetime(),
  replies: z
    .array(
      z.object({
        id: z.string().uuid(),
        content: z.string(),
        author: postAuthorSchema,
        parentId: z.string().uuid().nullable(),
        replyCount: z.number().int(),
        createdAt: z.string().datetime(),
      }),
    )
    .optional(),
});

export type PostComment = z.infer<typeof postCommentSchema>;

export const postDetailSchema = postSummarySchema.extend({
  comments: z.array(postCommentSchema),
});

export type PostDetail = z.infer<typeof postDetailSchema>;

export const createPostSchema = z.object({
  kind: z.enum(['MEMBER_POST', 'ANNOUNCEMENT', 'EVENT', 'COMMUNIQUE']).optional(),
  content: z.string().min(1, 'Le contenu est requis'),
  attachments: z.array(postAttachmentSchema).optional(),
  linkUrl: z.union([z.string().url('URL invalide'), z.literal('')]).optional(),
  visibility: z.enum(['ALL_MEMBERS', 'COMMISSION']).optional(),
  commissionId: z.union([z.string().uuid(), z.literal('')]).optional(),
  repostOfId: z.string().uuid().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const updatePostSchema = z.object({
  kind: z.enum(['MEMBER_POST', 'ANNOUNCEMENT', 'EVENT', 'COMMUNIQUE']).optional(),
  content: z.string().min(1, 'Le contenu est requis').optional(),
  attachments: z.array(postAttachmentSchema).optional(),
  linkUrl: z
    .union([z.string().url('URL invalide'), z.literal(''), z.null()])
    .optional(),
  visibility: z.enum(['ALL_MEMBERS', 'COMMISSION']).optional(),
  commissionId: z.union([z.string().uuid(), z.literal(''), z.null()]).optional(),
});

export type UpdatePostInput = z.infer<typeof updatePostSchema>;

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Le commentaire est requis'),
  parentId: z.string().uuid().optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const createContentReportSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT']),
  targetId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export type CreateContentReportInput = z.infer<typeof createContentReportSchema>;
