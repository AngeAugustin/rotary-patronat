import type { SearchResponse } from '@rotary/shared-types';
import { apiRequest } from '@/lib/api-client';

export async function globalSearch(q: string, types?: string[]) {
  const search = new URLSearchParams({ q });
  if (types?.length) search.set('types', types.join(','));
  const res = await apiRequest<{ data: SearchResponse }>(`/search?${search}`);
  return res.data;
}
