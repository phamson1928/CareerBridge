import { Notification } from '../generated/prisma/client';
import { NotificationPublic } from './notification.types';

export function toPublicNotification(
  notification: Notification,
): NotificationPublic {
  return {
    id: notification.id,
    type: notification.type,
    action: notification.action,
    title: notification.title,
    content: notification.content,
    resourceId: notification.resourceId,
    metadata: notification.metadata,
    isRead: notification.isRead,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
  };
}
