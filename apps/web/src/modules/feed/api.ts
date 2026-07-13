import type {
  CreateCommentInput,
  CreateContentReportInput,
  CreatePostInput,
  PaginatedResponse,
  PostDetail,
  PostSummary,
  UpdatePostInput,
} from '@rotary/shared-types';
import { apiRequest } from '@/lib/api-client';

export async function fetchFeed(params?: {
  page?: number;
  kind?: string;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.kind) search.set('kind', params.kind);
  const qs = search.toString();
  return apiRequest<PaginatedResponse<PostSummary>>(`/feed${qs ? `?${qs}` : ''}`);
}

export async function fetchPost(id: string) {
  const res = await apiRequest<{ data: PostDetail }>(`/posts/${id}`);
  return res.data;
}

export async function createPost(input: CreatePostInput) {
  const res = await apiRequest<{ data: PostSummary }>('/posts', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

export async function updatePost(id: string, input: UpdatePostInput) {
  const res = await apiRequest<{ data: PostSummary }>(`/posts/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return res.data;
}

export async function deletePost(id: string) {
  const res = await apiRequest<{ data: { id: string } }>(`/posts/${id}`, {
    method: 'DELETE',
  });
  return res.data;
}

export async function reportContent(input: CreateContentReportInput) {
  const res = await apiRequest<{ data: { id: string } }>('/posts/reports', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

export async function togglePostLike(postId: string) {
  const res = await apiRequest<{ data: PostSummary }>(`/posts/${postId}/like`, {
    method: 'POST',
  });
  return res.data;
}

export async function addPostComment(postId: string, input: CreateCommentInput) {
  const res = await apiRequest<{ data: PostDetail['comments'][number] }>(
    `/posts/${postId}/comments`,
    { method: 'POST', body: input },
  );
  return res.data;
}
