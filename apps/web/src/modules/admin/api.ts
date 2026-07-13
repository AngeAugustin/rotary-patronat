import type {
  ActionAdmin,
  ActivityLogEntry,
  CommissionAdmin,
  CreateActionInput,
  CreateCommissionInput,
  CreateNewsInput,
  CreateUserInput,
  DashboardData,
  GlobalStats,
  MemberDetail,
  MemberSummary,
  NewsAdmin,
  NewsCategory,
  PaginatedResponse,
  UpdateActionInput,
  UpdateNewsInput,
  UserDetail,
  UserSummary,
} from '@rotary/shared-types';
import { apiRequest } from '@/lib/api-client';

export async function fetchDashboard() {
  const res = await apiRequest<{ data: DashboardData }>('/dashboard');
  return res.data;
}

export async function fetchGlobalStats() {
  const res = await apiRequest<{ data: GlobalStats }>('/admin/stats');
  return res.data;
}

export async function fetchUsers(page = 1, q?: string, limit = 20) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) params.set('q', q);
  return apiRequest<PaginatedResponse<UserSummary>>(`/admin/users?${params}`);
}

export async function fetchUser(id: string) {
  const res = await apiRequest<{ data: UserDetail }>(`/admin/users/${id}`);
  return res.data;
}

export async function createUser(input: CreateUserInput) {
  const res = await apiRequest<{ data: UserDetail }>('/admin/users', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

export async function updateUser(
  id: string,
  input: import('@rotary/shared-types').UpdateUserInput,
) {
  const res = await apiRequest<{ data: UserDetail }>(`/admin/users/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return res.data;
}

export async function deleteUser(id: string) {
  const res = await apiRequest<{ data: { success: boolean; hadMember: boolean } }>(
    `/admin/users/${id}`,
    { method: 'DELETE' },
  );
  return res.data;
}

export async function fetchRoles() {
  const res = await apiRequest<{ data: { code: string; label: string }[] }>('/admin/roles');
  return res.data;
}

export async function fetchCommissions(page = 1) {
  return apiRequest<PaginatedResponse<CommissionAdmin>>(
    `/admin/commissions?page=${page}&limit=20`,
  );
}

export async function fetchCommission(id: string) {
  const res = await apiRequest<{ data: CommissionAdmin }>(`/admin/commissions/${id}`);
  return res.data;
}

export async function createCommission(input: CreateCommissionInput) {
  const res = await apiRequest<{ data: CommissionAdmin }>('/admin/commissions', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

export async function updateCommission(id: string, input: Partial<CreateCommissionInput>) {
  const res = await apiRequest<{ data: CommissionAdmin }>(`/admin/commissions/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return res.data;
}

export async function deleteCommission(id: string) {
  const res = await apiRequest<{ data: { id: string } }>(`/admin/commissions/${id}`, {
    method: 'DELETE',
  });
  return res.data;
}

export async function assignCommissionMember(
  commissionId: string,
  userId: string,
  role: string,
) {
  const res = await apiRequest<{ data: CommissionAdmin }>(
    `/admin/commissions/${commissionId}/members`,
    { method: 'POST', body: { userId, role } },
  );
  return res.data;
}

export async function removeCommissionMember(commissionId: string, userId: string) {
  const res = await apiRequest<{ data: CommissionAdmin }>(
    `/admin/commissions/${commissionId}/members/${userId}`,
    { method: 'DELETE' },
  );
  return res.data;
}

export async function fetchLogs(page = 1, action?: string) {
  const params = new URLSearchParams({ page: String(page), limit: '30' });
  if (action) params.set('action', action);
  return apiRequest<PaginatedResponse<ActivityLogEntry>>(`/admin/logs?${params}`);
}

export async function fetchModerationPosts(page = 1) {
  return apiRequest<PaginatedResponse<import('@rotary/shared-types').ModerationPost>>(
    `/moderation/posts?page=${page}&limit=20`,
  );
}

export async function fetchModerationComments(page = 1) {
  return apiRequest<PaginatedResponse<import('@rotary/shared-types').ModerationComment>>(
    `/moderation/comments?page=${page}&limit=20`,
  );
}

export async function fetchModerationReports(page = 1) {
  return apiRequest<PaginatedResponse<import('@rotary/shared-types').ModerationReport>>(
    `/moderation/reports?page=${page}&limit=20`,
  );
}

export async function dismissModerationReport(id: string) {
  return apiRequest<{ data: { success: boolean } }>(`/moderation/reports/${id}`, {
    method: 'DELETE',
  });
}

export async function deleteModerationPost(id: string) {
  return apiRequest<{ data: { success: boolean } }>(`/moderation/posts/${id}`, {
    method: 'DELETE',
  });
}

export async function deleteModerationComment(id: string) {
  return apiRequest<{ data: { success: boolean } }>(`/moderation/comments/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchMembershipApplications(page = 1, status?: string) {
  const params = new URLSearchParams({ page: String(page), limit: '10' });
  if (status) params.set('status', status);
  return apiRequest<PaginatedResponse<import('@rotary/shared-types').MembershipApplicationSummary>>(
    `/membership-applications?${params}`,
  );
}

export async function fetchMembershipApplication(id: string) {
  const res = await apiRequest<{ data: import('@rotary/shared-types').MembershipApplicationSummary }>(
    `/membership-applications/${id}`,
  );
  return res.data;
}

export async function reviewMembershipApplication(
  id: string,
  input: import('@rotary/shared-types').ReviewMembershipApplicationInput,
) {
  const res = await apiRequest<{ data: import('@rotary/shared-types').MembershipApplicationSummary }>(
    `/membership-applications/${id}`,
    { method: 'PATCH', body: input },
  );
  return res.data;
}

export async function deleteMembershipApplication(id: string) {
  const res = await apiRequest<{ data: { success: boolean; hadMember: boolean } }>(
    `/membership-applications/${id}`,
    { method: 'DELETE' },
  );
  return res.data;
}

export async function fetchMembers(
  page = 1,
  q?: string,
  withoutAccount?: boolean,
  limit = 20,
) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) params.set('q', q);
  if (withoutAccount) params.set('withoutAccount', 'true');
  return apiRequest<PaginatedResponse<MemberSummary>>(`/admin/members?${params}`);
}

export async function fetchMember(id: string) {
  const res = await apiRequest<{ data: MemberDetail }>(`/admin/members/${id}`);
  return res.data;
}

export async function fetchAdminActions(params: {
  page?: number;
  status?: string;
  q?: string;
  limit?: number;
}) {
  const search = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });
  if (params.status) search.set('status', params.status);
  if (params.q) search.set('q', params.q);
  return apiRequest<PaginatedResponse<ActionAdmin>>(
    `/admin/actions?${search.toString()}`,
  );
}

export async function fetchAdminAction(id: string) {
  const res = await apiRequest<{ data: ActionAdmin }>(`/admin/actions/${id}`);
  return res.data;
}

export async function createAdminAction(input: CreateActionInput) {
  const res = await apiRequest<{ data: ActionAdmin }>('/admin/actions', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

export async function updateAdminAction(id: string, input: UpdateActionInput) {
  const res = await apiRequest<{ data: ActionAdmin }>(`/admin/actions/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return res.data;
}

export async function deleteAdminAction(id: string) {
  const res = await apiRequest<{ data: { success: boolean } }>(
    `/admin/actions/${id}`,
    { method: 'DELETE' },
  );
  return res.data;
}

export async function fetchAdminNews(params: {
  page?: number;
  status?: string;
  q?: string;
  categoryId?: string;
  limit?: number;
}) {
  const search = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });
  if (params.status) search.set('status', params.status);
  if (params.q) search.set('q', params.q);
  if (params.categoryId) search.set('categoryId', params.categoryId);
  return apiRequest<PaginatedResponse<NewsAdmin>>(
    `/admin/news?${search.toString()}`,
  );
}

export async function fetchAdminNewsArticle(id: string) {
  const res = await apiRequest<{ data: NewsAdmin }>(`/admin/news/${id}`);
  return res.data;
}

export async function createAdminNews(input: CreateNewsInput) {
  const res = await apiRequest<{ data: NewsAdmin }>('/admin/news', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

export async function updateAdminNews(id: string, input: UpdateNewsInput) {
  const res = await apiRequest<{ data: NewsAdmin }>(`/admin/news/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return res.data;
}

export async function deleteAdminNews(id: string) {
  const res = await apiRequest<{ data: { success: boolean } }>(
    `/admin/news/${id}`,
    { method: 'DELETE' },
  );
  return res.data;
}

export async function fetchNewsCategoriesAdmin() {
  const res = await apiRequest<{ data: NewsCategory[] }>(
    '/news/categories/list',
    { skipAuth: true },
  );
  return res.data;
}
