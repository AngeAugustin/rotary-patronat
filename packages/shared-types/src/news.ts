import { z } from 'zod';
import { publishStatusSchema } from './pagination.js';

export const newsCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
});

export type NewsCategory = z.infer<typeof newsCategorySchema>;

export const newsSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  coverImage: z.string().nullable(),
  category: newsCategorySchema,
  publishedAt: z.string().datetime().nullable(),
});

export type NewsSummary = z.infer<typeof newsSummarySchema>;

export const newsDetailSchema = newsSummarySchema.extend({
  content: z.string(),
});

export type NewsDetail = z.infer<typeof newsDetailSchema>;

export const newsAdminSchema = newsDetailSchema.extend({
  status: publishStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type NewsAdmin = z.infer<typeof newsAdminSchema>;

export const newsSearchQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  q: z.string().optional(),
  category: z.string().optional(),
});

export type NewsSearchQuery = z.infer<typeof newsSearchQuerySchema>;

export const createNewsSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  slug: z
    .string()
    .min(1, 'Le slug est requis')
    .regex(/^[a-z0-9-]+$/, 'Slug invalide (a-z, 0-9, tirets)'),
  excerpt: z.string().min(1, 'L’extrait est requis'),
  content: z.string().min(1, 'Le contenu est requis'),
  coverImage: z.string().url('URL d’image invalide').optional().or(z.literal('')),
  categoryId: z.string().uuid('Catégorie requise'),
  status: publishStatusSchema.optional(),
});

export type CreateNewsInput = z.infer<typeof createNewsSchema>;

export const updateNewsSchema = createNewsSchema.partial();

export type UpdateNewsInput = z.infer<typeof updateNewsSchema>;
