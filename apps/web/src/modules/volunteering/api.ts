import type {
  CreateVolunteeringInput,
  PaginatedResponse,
  ReviewVolunteeringInput,
  UpdateVolunteeringInput,
  VolunteeringStats,
  VolunteeringSummary,
} from '@rotary/shared-types';
import { apiRequest } from '@/lib/api-client';

export async function fetchVolunteering(params?: {
  page?: number;
  limit?: number;
  status?: string;
  /** Admin moderation only — lists all club declarations. */
  scope?: 'mine' | 'all';
}) {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.status) search.set('status', params.status);
  if (params?.scope) search.set('scope', params.scope);
  const qs = search.toString();
  return apiRequest<PaginatedResponse<VolunteeringSummary>>(
    `/volunteering${qs ? `?${qs}` : ''}`,
  );
}

export async function fetchVolunteeringStats() {
  const res = await apiRequest<{ data: VolunteeringStats }>('/volunteering/stats');
  return res.data;
}

export async function createVolunteering(input: CreateVolunteeringInput) {
  const res = await apiRequest<{ data: VolunteeringSummary }>('/volunteering', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

export async function updateVolunteering(id: string, input: UpdateVolunteeringInput) {
  const res = await apiRequest<{ data: VolunteeringSummary }>(`/volunteering/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return res.data;
}

export async function deleteVolunteering(id: string) {
  const res = await apiRequest<{ data: { id: string } }>(`/volunteering/${id}`, {
    method: 'DELETE',
  });
  return res.data;
}

export async function reviewVolunteering(id: string, input: ReviewVolunteeringInput) {
  const res = await apiRequest<{ data: VolunteeringSummary }>(
    `/volunteering/${id}/review`,
    { method: 'PATCH', body: input },
  );
  return res.data;
}
