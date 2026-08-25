import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getApiErrorMessage } from '../auth/api';
import { subscribeAccessToken } from '../auth/token-store';
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from './api';
import { createNotificationSocket, type NotificationSocket } from './realtime';
import type { AppNotification, NotificationFilter } from './types';

const PAGE_SIZE = 20;

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<NotificationFilter>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socketStatus, setSocketStatus] = useState<'offline' | 'connecting' | 'online'>(
    'offline',
  );
  const socketRef = useRef<NotificationSocket | null>(null);
  const refreshRef = useRef<() => Promise<void>>(async () => undefined);
  const mountedRef = useRef(true);

  const mergeNotifications = useCallback((incoming: AppNotification[]) => {
    setNotifications((previous) => {
      const byId = new Map(incoming.map((item) => [item.id, item]));
      for (const item of previous) byId.set(item.id, item);
      return [...byId.values()].sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
      );
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const [pageData, count] = await Promise.all([
        listNotifications({ page: 1, limit: PAGE_SIZE, isRead: filter === 'UNREAD' ? false : undefined }),
        getUnreadCount(),
      ]);
      if (!mountedRef.current) return;
      setNotifications(pageData.items);
      setPage(1);
      setTotalPages(pageData.pagination.totalPages);
      setUnreadCount(count);
    } catch (requestError) {
      if (mountedRef.current) setError(getApiErrorMessage(requestError));
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [filter, user]);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  const loadMore = useCallback(async () => {
    if (!user || isLoadingMore || page >= totalPages) return;
    setIsLoadingMore(true);
    try {
      const pageData = await listNotifications({
        page: page + 1,
        limit: PAGE_SIZE,
        isRead: filter === 'UNREAD' ? false : undefined,
      });
      if (!mountedRef.current) return;
      mergeNotifications(pageData.items);
      setPage(page + 1);
      setTotalPages(pageData.pagination.totalPages);
    } catch (requestError) {
      if (mountedRef.current) setError(getApiErrorMessage(requestError));
    } finally {
      if (mountedRef.current) setIsLoadingMore(false);
    }
  }, [filter, isLoadingMore, mergeNotifications, page, totalPages, user]);

  const markAsRead = useCallback(async (id: string) => {
    const current = notifications.find((item) => item.id === id);
    if (!current || current.isRead) return;
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item));
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await markNotificationAsRead(id);
    } catch (requestError) {
      setNotifications((items) => items.map((item) => item.id === id ? current : item));
      setUnreadCount((count) => count + 1);
      setError(getApiErrorMessage(requestError));
    }
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    if (!unreadCount || isMarkingAll) return;
    setIsMarkingAll(true);
    const previous = notifications;
    setNotifications((items) => items.map((item) => ({ ...item, isRead: true, readAt: item.readAt ?? new Date().toISOString() })));
    setUnreadCount(0);
    try {
      await markAllNotificationsAsRead();
    } catch (requestError) {
      setNotifications(previous);
      setUnreadCount(previous.filter((item) => !item.isRead).length);
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsMarkingAll(false);
    }
  }, [isMarkingAll, notifications, unreadCount]);

  useEffect(() => {
    mountedRef.current = true;
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setPage(0);
      setTotalPages(0);
      return () => { mountedRef.current = false; };
    }
    void refresh();
    return () => { mountedRef.current = false; };
  }, [refresh, user]);

  useEffect(() => {
    if (!user) return;
    const socket = createNotificationSocket();
    socketRef.current = socket;
    if (!socket) return;
    setSocketStatus('connecting');
    const onConnect = () => { setSocketStatus('online'); void refreshRef.current(); };
    const onDisconnect = () => setSocketStatus('offline');
    const onCreated = (notification: AppNotification) => {
      mergeNotifications([notification]);
      if (!notification.isRead) setUnreadCount((count) => count + 1);
    };
    const onRead = (payload: { id: string; isRead: boolean; readAt: string | null }) => {
      setNotifications((items) => items.map((item) => item.id === payload.id ? { ...item, isRead: payload.isRead, readAt: payload.readAt } : item));
      void getUnreadCount().then((count) => setUnreadCount(count)).catch(() => undefined);
    };
    const onReadAll = () => { setNotifications((items) => items.map((item) => ({ ...item, isRead: true }))); setUnreadCount(0); };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('notification.created', onCreated);
    socket.on('notification.read', onRead);
    socket.on('notification.read-all', onReadAll);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('notification.created', onCreated);
      socket.off('notification.read', onRead);
      socket.off('notification.read-all', onReadAll);
      socket.disconnect();
      socketRef.current = null;
      setSocketStatus('offline');
    };
  }, [mergeNotifications, user]);

  useEffect(() => subscribeAccessToken((token) => {
    if (!token) socketRef.current?.disconnect();
  }), []);

  const visibleNotifications = useMemo(() => filter === 'UNREAD'
    ? notifications.filter((item) => !item.isRead)
    : notifications, [filter, notifications]);

  return {
    notifications: visibleNotifications,
    unreadCount,
    filter,
    setFilter,
    isLoading,
    isLoadingMore,
    isMarkingAll,
    hasMore: page < totalPages,
    error,
    socketStatus,
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
  };
}
