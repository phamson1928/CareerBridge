import { api } from '../auth/api';
import type { ApiSuccess } from '../auth/auth.types';
import type { ChatMessage, Conversation, ConversationPage, MessagePage } from './types';

export async function listConversations(params: { page?: number; limit?: number } = {}) {
  const response = await api.get<ApiSuccess<ConversationPage>>('/conversations', { params });
  return response.data.data;
}

export async function getConversation(id: string) {
  const response = await api.get<ApiSuccess<Conversation>>(`/conversations/${encodeURIComponent(id)}`);
  return response.data.data;
}

export async function listMessages(conversationId: string, params: { page?: number; limit?: number } = {}) {
  const response = await api.get<ApiSuccess<MessagePage>>(`/conversations/${encodeURIComponent(conversationId)}/messages`, { params });
  return response.data.data;
}

export async function sendMessage(conversationId: string, content: string) {
  const response = await api.post<ApiSuccess<ChatMessage>>(`/conversations/${encodeURIComponent(conversationId)}/messages`, { content });
  return response.data.data;
}

export async function markConversationMessagesRead(conversationId: string) {
  const response = await api.patch<ApiSuccess<{ conversationId: string; readAt: string; updatedCount: number }>>(`/conversations/${encodeURIComponent(conversationId)}/messages/read`);
  return response.data.data;
}

export async function getUnreadMessageCount() {
  const response = await api.get<ApiSuccess<{ count: number }>>('/conversations/unread-count');
  return response.data.data.count;
}
