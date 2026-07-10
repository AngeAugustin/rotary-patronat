import type { NotificationCounts, NotificationItem, PaginatedResponse } from '@rotary/shared-types';
import { apiRequest } from '@/lib/api-client';

export async function fetchNotifications(page = 1, limit = 20) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return apiRequest<PaginatedResponse<NotificationItem>>(
    `/notifications?${params.toString()}`,
  );
}

export async function fetchNotificationCounts() {
  const res = await apiRequest<{ data: NotificationCounts }>('/notifications/counts');
  return res.data;
}

export async function markNotificationRead(id: string) {
  const res = await apiRequest<{ data: NotificationItem | null }>(
    `/notifications/${id}/read`,
    { method: 'PATCH' },
  );
  return res.data;
}

export async function markAllNotificationsRead() {
  return apiRequest<{ data: { success: boolean } }>('/notifications/read-all', {
    method: 'PATCH',
  });
}
