import type {
  ConversationDetail,
  ConversationSummary,
  CreateConversationInput,
  MessagingRecipient,
  PaginatedResponse,
  SendMessageInput,
} from '@rotary/shared-types';
import { apiRequest } from '@/lib/api-client';

export async function fetchConversations(page = 1) {
  return apiRequest<PaginatedResponse<ConversationSummary>>(
    `/conversations?page=${page}`,
  );
}

export async function fetchConversation(id: string) {
  const res = await apiRequest<{ data: ConversationDetail }>(`/conversations/${id}`);
  return res.data;
}

export async function fetchMessagingRecipients(q?: string) {
  const params = new URLSearchParams();
  if (q?.trim()) params.set('q', q.trim());
  const qs = params.toString();
  const res = await apiRequest<{ data: MessagingRecipient[] }>(
    `/conversations/recipients${qs ? `?${qs}` : ''}`,
  );
  return res.data;
}

export async function createConversation(input: CreateConversationInput) {
  const res = await apiRequest<{ data: ConversationSummary }>('/conversations', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

export async function sendMessage(conversationId: string, input: SendMessageInput) {
  const res = await apiRequest<{ data: ConversationDetail['messages'][number] }>(
    `/conversations/${conversationId}/messages`,
    { method: 'POST', body: input },
  );
  return res.data;
}

export async function markConversationRead(conversationId: string) {
  return apiRequest<{ data: { success: boolean } }>(
    `/conversations/${conversationId}/read`,
    { method: 'PATCH' },
  );
}

export async function markConversationDelivered(conversationId: string) {
  return apiRequest<{ data: { success: boolean; updated: boolean } }>(
    `/conversations/${conversationId}/delivered`,
    { method: 'PATCH' },
  );
}
