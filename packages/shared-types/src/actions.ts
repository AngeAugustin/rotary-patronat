import { z } from 'zod';
import { publishStatusSchema } from './pagination.js';

export const PUBLISH_STATUS_LABELS: Record<
  z.infer<typeof publishStatusSchema>,
  string
> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publié',
  ARCHIVED: 'Archivé',
};

export const actionSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  summary: z.string().nullable(),
  date: z.string().datetime(),
  location: z.string(),
  coverImage: z.string().nullable(),
  featured: z.boolean(),
});

export type ActionSummary = z.infer<typeof actionSummarySchema>;

export const actionDetailSchema = actionSummarySchema.extend({
  description: z.string(),
  gallery: z.array(z.string()).default([]),
  videos: z
    .array(z.object({ url: z.string().url(), title: z.string() }))
    .default([]),
  partners: z.array(z.string()).default([]),
  results: z.string().nullable(),
  publishedAt: z.string().datetime().nullable(),
});

export type ActionDetail = z.infer<typeof actionDetailSchema>;

export const actionAdminSchema = actionDetailSchema.extend({
  status: publishStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ActionAdmin = z.infer<typeof actionAdminSchema>;

export const createActionSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  slug: z
    .string()
    .min(1, 'Le slug est requis')
    .regex(/^[a-z0-9-]+$/, 'Slug invalide (a-z, 0-9, tirets)'),
  summary: z.string().optional(),
  description: z.string().min(1, 'La description est requise'),
  date: z.string().datetime({ message: 'Date invalide' }),
  location: z.string().min(1, 'Le lieu est requis'),
  coverImage: z.string().url('URL d’image invalide').optional().or(z.literal('')),
  gallery: z.array(z.string().url()).optional(),
  videos: z
    .array(z.object({ url: z.string().url(), title: z.string().min(1) }))
    .optional(),
  partners: z.array(z.string().min(1)).optional(),
  results: z.string().optional(),
  featured: z.boolean().optional(),
  status: publishStatusSchema.optional(),
});

export type CreateActionInput = z.infer<typeof createActionSchema>;

export const updateActionSchema = createActionSchema.partial();

export type UpdateActionInput = z.infer<typeof updateActionSchema>;
