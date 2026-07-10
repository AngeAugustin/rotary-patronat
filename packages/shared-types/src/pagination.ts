import { z } from 'zod';

export const publishStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

export type PublishStatus = z.infer<typeof publishStatusSchema>;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
