import { useQuery } from '@tanstack/react-query';
import { fetchHomepage, fetchClubProfile, fetchActions, fetchAction, fetchNews, fetchNewsCategories, fetchNewsArticle, fetchMeetings, fetchMeeting } from '../api';
import { queryKeys } from '@/lib/query-keys';

export function useHomepage() {
  return useQuery({
    queryKey: queryKeys.public.homepage,
    queryFn: fetchHomepage,
  });
}

export function useClubProfile() {
  return useQuery({
    queryKey: queryKeys.public.club,
    queryFn: fetchClubProfile,
  });
}

export function useActions(page = 1) {
  return useQuery({
    queryKey: queryKeys.public.actions(page),
    queryFn: () => fetchActions(page),
  });
}

export function useAction(slug: string) {
  return useQuery({
    queryKey: queryKeys.public.action(slug),
    queryFn: () => fetchAction(slug),
    enabled: Boolean(slug),
  });
}

export function useNews(params: { page?: number; q?: string; category?: string }) {
  const key = JSON.stringify(params);
  return useQuery({
    queryKey: queryKeys.public.news(key),
    queryFn: () => fetchNews({ page: params.page ?? 1, q: params.q, category: params.category }),
  });
}

export function useNewsCategories() {
  return useQuery({
    queryKey: queryKeys.public.newsCategories,
    queryFn: fetchNewsCategories,
  });
}

export function useNewsArticle(slug: string) {
  return useQuery({
    queryKey: queryKeys.public.newsArticle(slug),
    queryFn: () => fetchNewsArticle(slug),
    enabled: Boolean(slug),
  });
}

export function useMeetings(params: {
  page?: number;
  upcoming?: boolean;
  from?: string;
  to?: string;
  limit?: number;
}) {
  const key = JSON.stringify(params);
  return useQuery({
    queryKey: queryKeys.public.meetings(key),
    queryFn: () =>
      fetchMeetings({
        page: params.page ?? 1,
        upcoming: params.upcoming,
        from: params.from,
        to: params.to,
        limit: params.limit,
      }),
  });
}

export function useMeeting(slug: string) {
  return useQuery({
    queryKey: queryKeys.public.meeting(slug),
    queryFn: () => fetchMeeting(slug),
    enabled: Boolean(slug),
  });
}
