import { api } from '../auth/api';
import type { ApiSuccess } from '../auth/auth.types';
import type { AppNotification, NotificationPage, NotificationType } from './types';

export async function listNotifications(params: {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationType;
}) {
  const response = await api.get<ApiSuccess<NotificationPage>>('/notifications', {
    params,
  });
  return response.data.data;
}

export async function getUnreadCount() {
  const response = await api.get<ApiSuccess<{ count: number }>>(
    '/notifications/unread-count',
  );
  return response.data.data.count;
}

export async function markNotificationAsRead(id: string) {
  const response = await api.patch<ApiSuccess<AppNotification>>(
    `/notifications/${encodeURIComponent(id)}/read`,
  );
  return response.data.data;
}

export async function markAllNotificationsAsRead() {
  const response = await api.patch<
    ApiSuccess<{ updatedCount: number; unreadCount: number }>
  >('/notifications/read-all');
  return response.data.data;
}
