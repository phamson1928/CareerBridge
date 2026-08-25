import { api } from '../auth/api';
import type { ApiSuccess } from '../auth/auth.types';
import type { Conversation, ConversationPage } from './types';

export async function listConversations(params: { page?: number; limit?: number } = {}) {
  const response = await api.get<ApiSuccess<ConversationPage>>('/conversations', { params });
  return response.data.data;
}

export async function getConversation(id: string) {
  const response = await api.get<ApiSuccess<Conversation>>(`/conversations/${encodeURIComponent(id)}`);
  return response.data.data;
}
