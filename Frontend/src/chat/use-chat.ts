import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { subscribeAccessToken } from '../auth/token-store';
import { createNotificationSocket, type NotificationSocket } from '../notifications/realtime';
import { getUnreadMessageCount } from './api';
import type { ChatMessage } from './types';

export function useChat() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestMessage, setLatestMessage] = useState<ChatMessage | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    if (!user || (user.role !== 'STUDENT' && user.role !== 'COMPANY')) {
      setUnreadCount(0);
      return;
    }
    try { setUnreadCount(await getUnreadMessageCount()); } catch { setUnreadCount(0); }
  }, [user]);

  useEffect(() => { void refreshUnreadCount(); }, [refreshUnreadCount]);

  useEffect(() => {
    if (!user || (user.role !== 'STUDENT' && user.role !== 'COMPANY')) return;
    const socket: NotificationSocket | null = createNotificationSocket();
    if (!socket) return;
    const onMessage = (message: ChatMessage) => {
      setLatestMessage(message);
      if (message.senderId !== user.id) setUnreadCount((count) => count + 1);
    };
    const onRead = () => { void refreshUnreadCount(); };
    socket.on('chat.message.created', onMessage);
    socket.on('chat.messages.read', onRead);
    socket.on('connect', refreshUnreadCount);
    return () => {
      socket.off('chat.message.created', onMessage);
      socket.off('chat.messages.read', onRead);
      socket.off('connect', refreshUnreadCount);
      socket.disconnect();
    };
  }, [refreshUnreadCount, user]);

  useEffect(() => subscribeAccessToken((token) => { if (!token) setUnreadCount(0); }), []);
  return { unreadCount, latestMessage, refreshUnreadCount };
}
