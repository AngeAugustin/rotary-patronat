import type {
  ActionDetail,
  ActionSummary,
  ClubProfile,
  HomepageData,
  MeetingDetail,
  MeetingSummary,
  NewsCategory,
  NewsDetail,
  NewsSummary,
  PaginatedResponse,
  DocumentCategory,
  DocumentSummary,
} from '@rotary/shared-types';
import { apiRequest } from '@/lib/api-client';

export async function fetchHomepage() {
  const res = await apiRequest<{ data: HomepageData }>('/club/homepage', {
    skipAuth: true,
  });
  return res.data;
}

export async function fetchClubProfile() {
  const res = await apiRequest<{ data: ClubProfile }>('/club', { skipAuth: true });
  return res.data;
}

export async function fetchActions(page = 1, limit = 12) {
  return apiRequest<PaginatedResponse<ActionSummary>>(
    `/actions?page=${page}&limit=${limit}`,
    { skipAuth: true },
  );
}

export async function fetchAction(slug: string) {
  const res = await apiRequest<{ data: ActionDetail }>(`/actions/${slug}`, {
    skipAuth: true,
  });
  return res.data;
}

export async function fetchNews(params: {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
}) {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.q) search.set('q', params.q);
  if (params.category) search.set('category', params.category);

  return apiRequest<PaginatedResponse<NewsSummary>>(
    `/news?${search.toString()}`,
    { skipAuth: true },
  );
}

export async function fetchNewsCategories() {
  const res = await apiRequest<{ data: NewsCategory[] }>('/news/categories/list', {
    skipAuth: true,
  });
  return res.data;
}

export async function fetchNewsArticle(slug: string) {
  const res = await apiRequest<{ data: NewsDetail }>(`/news/${slug}`, {
    skipAuth: true,
  });
  return res.data;
}

export async function fetchMeetings(params: {
  page?: number;
  limit?: number;
  upcoming?: boolean;
  from?: string;
  to?: string;
}) {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.upcoming !== undefined) search.set('upcoming', String(params.upcoming));
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  return apiRequest<PaginatedResponse<MeetingSummary>>(
    `/meetings?${search.toString()}`,
    { skipAuth: true },
  );
}

export async function fetchMeeting(slug: string) {
  const res = await apiRequest<{ data: MeetingDetail }>(`/meetings/${slug}`, {
    skipAuth: true,
  });
  return res.data;
}

export async function fetchPublicDocumentCategories() {
  const res = await apiRequest<{ data: DocumentCategory[] }>(
    '/documents/public/categories',
    { skipAuth: true },
  );
  return res.data;
}

export async function fetchPublicDocuments(params: {
  page?: number;
  q?: string;
  categoryId?: string;
}) {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.q) search.set('q', params.q);
  if (params.categoryId) search.set('categoryId', params.categoryId);
  return apiRequest<PaginatedResponse<DocumentSummary>>(
    `/documents/public?${search.toString()}`,
    { skipAuth: true },
  );
}

export async function submitMembershipApplication(
  input: import('@rotary/shared-types').CreateMembershipApplicationInput,
) {
  const res = await apiRequest<{ data: { id: string } }>('/membership-applications', {
    method: 'POST',
    body: input,
    skipAuth: true,
    skipCsrf: true,
  });
  return res.data;
}
