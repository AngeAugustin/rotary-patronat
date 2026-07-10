import { z } from 'zod';

export const SearchResultType = {
  NEWS: 'news',
  ACTION: 'action',
  DOCUMENT: 'document',
  POST: 'post',
  MEMBER: 'member',
  PROJECT: 'project',
  COMMISSION: 'commission',
  MEETING: 'meeting',
  EVENT: 'event',
} as const;

export type SearchResultType =
  (typeof SearchResultType)[keyof typeof SearchResultType];

export const SEARCH_RESULT_TYPE_LABELS: Record<SearchResultType, string> = {
  [SearchResultType.NEWS]: 'Actualité',
  [SearchResultType.ACTION]: 'Action',
  [SearchResultType.DOCUMENT]: 'Document',
  [SearchResultType.POST]: 'Publication',
  [SearchResultType.MEMBER]: 'Membre',
  [SearchResultType.PROJECT]: 'Projet',
  [SearchResultType.COMMISSION]: 'Commission',
  [SearchResultType.MEETING]: 'Réunion',
  [SearchResultType.EVENT]: 'Événement',
};

export const searchResultSchema = z.object({
  id: z.string(),
  type: z.enum([
    'news',
    'action',
    'document',
    'post',
    'member',
    'project',
    'commission',
    'meeting',
    'event',
  ]),
  title: z.string(),
  excerpt: z.string().nullable(),
  url: z.string(),
  date: z.string().datetime().nullable(),
  meta: z.string().nullable(),
});

export type SearchResult = z.infer<typeof searchResultSchema>;

export const searchResponseSchema = z.object({
  query: z.string(),
  results: z.array(searchResultSchema),
  counts: z.record(z.string(), z.number()),
});

export type SearchResponse = z.infer<typeof searchResponseSchema>;
