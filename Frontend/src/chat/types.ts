export type ConversationParticipant = {
  id: string;
  userId: string;
  name: string;
  avatarFileId?: string | null;
  role: 'STUDENT' | 'COMPANY' | 'LECTURER';
};

export type Conversation = {
  id: string;
  applicationId: string | null;
  placementId: string | null;
  internship: { id: string; title: string } | null;
  participant: ConversationParticipant;
  latestMessage: { id: string; content: string; createdAt: string; senderId: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type ConversationPage = {
  items: Conversation[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
};

export type MessagePage = {
  items: ChatMessage[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};
