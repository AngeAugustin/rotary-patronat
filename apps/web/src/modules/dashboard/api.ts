import { apiRequest } from '@/lib/api-client';
import type { UserProfile } from '@rotary/shared-types';

export async function fetchMyProfile() {
  const res = await apiRequest<{ data: UserProfile }>('/profile');
  return res.data;
}
