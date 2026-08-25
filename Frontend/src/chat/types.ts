export type ConversationParticipant = {
  id: string;
  userId: string;
  name: string;
  role: 'STUDENT' | 'COMPANY';
};

export type Conversation = {
  id: string;
  applicationId: string;
  internship: { id: string; title: string };
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
