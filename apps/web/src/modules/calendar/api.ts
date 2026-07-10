import type {
  CalendarEventItem,
  CreateCalendarEventInput,
  UpdateAttendanceInput,
  UpdateCalendarEventInput,
} from '@rotary/shared-types';
import { apiRequest } from '@/lib/api-client';

export async function fetchCalendarEvent(id: string) {
  const res = await apiRequest<{ data: CalendarEventItem }>(
    `/calendar/${encodeURIComponent(id)}`,
  );
  return res.data;
}

export async function fetchCalendarEvents(from: string, to: string) {
  const res = await apiRequest<{ data: CalendarEventItem[] }>(
    `/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  );
  return res.data;
}

export async function createCalendarEvent(input: CreateCalendarEventInput) {
  const res = await apiRequest<{ data: CalendarEventItem }>('/calendar', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

export async function updateCalendarEvent(
  id: string,
  input: UpdateCalendarEventInput,
) {
  const res = await apiRequest<{ data: CalendarEventItem }>(`/calendar/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return res.data;
}

export async function deleteCalendarEvent(id: string) {
  const res = await apiRequest<{ data: { success: boolean } }>(`/calendar/${id}`, {
    method: 'DELETE',
  });
  return res.data;
}

export async function updateEventAttendance(
  eventId: string,
  input: UpdateAttendanceInput,
) {
  const res = await apiRequest<{ data: CalendarEventItem }>(
    `/calendar/${eventId}/attendance`,
    { method: 'PATCH', body: input },
  );
  return res.data;
}
