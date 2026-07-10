import { z } from 'zod';

export const DocumentVisibility = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
} as const;

export type DocumentVisibility =
  (typeof DocumentVisibility)[keyof typeof DocumentVisibility];

export const DocumentFileType = {
  PDF: 'PDF',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  OTHER: 'OTHER',
} as const;

export type DocumentFileType =
  (typeof DocumentFileType)[keyof typeof DocumentFileType];

export const DOCUMENT_FILE_TYPE_LABELS: Record<DocumentFileType, string> = {
  [DocumentFileType.PDF]: 'PDF',
  [DocumentFileType.IMAGE]: 'Image',
  [DocumentFileType.VIDEO]: 'Vidéo',
  [DocumentFileType.OTHER]: 'Autre',
};

export const documentCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']),
  documentCount: z.number().int(),
});

export type DocumentCategory = z.infer<typeof documentCategorySchema>;

export const documentSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  fileUrl: z.string().url(),
  fileType: z.enum(['PDF', 'IMAGE', 'VIDEO', 'OTHER']),
  mimeType: z.string().nullable(),
  fileSize: z.number().int().nullable(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']),
  categoryId: z.string().uuid(),
  categoryName: z.string(),
  commissionId: z.string().uuid().nullable(),
  commissionName: z.string().nullable(),
  uploadedByName: z.string(),
  downloadCount: z.number().int(),
  createdAt: z.string().datetime(),
});

export type DocumentSummary = z.infer<typeof documentSummarySchema>;

export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug invalide'),
  description: z.string().optional(),
  fileUrl: z.string().url('URL de fichier invalide'),
  fileType: z.enum(['PDF', 'IMAGE', 'VIDEO', 'OTHER']).optional(),
  mimeType: z.string().optional(),
  fileSize: z.number().int().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  categoryId: z.string().uuid(),
  commissionId: z.string().uuid().optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
