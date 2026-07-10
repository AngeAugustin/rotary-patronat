import type {
  CreateDocumentInput,
  DocumentCategory,
  DocumentSummary,
  PaginatedResponse,
} from '@rotary/shared-types';
import { apiRequest } from '@/lib/api-client';

export async function fetchDocumentCategories() {
  const res = await apiRequest<{ data: DocumentCategory[] }>('/documents/categories');
  return res.data;
}

export async function fetchDocuments(params?: {
  page?: number;
  limit?: number;
  q?: string;
  categoryId?: string;
  visibility?: string;
}) {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.q) search.set('q', params.q);
  if (params?.categoryId) search.set('categoryId', params.categoryId);
  if (params?.visibility) search.set('visibility', params.visibility);
  const qs = search.toString();
  return apiRequest<PaginatedResponse<DocumentSummary>>(
    `/documents${qs ? `?${qs}` : ''}`,
  );
}

export async function createDocument(input: CreateDocumentInput) {
  const res = await apiRequest<{ data: DocumentSummary }>('/documents', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

export async function recordDocumentDownload(id: string) {
  const res = await apiRequest<{ data: DocumentSummary }>(
    `/documents/${id}/download`,
    { method: 'POST' },
  );
  return res.data;
}
