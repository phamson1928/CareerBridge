import { Prisma, NotificationAction, NotificationType } from '../generated/prisma/client';

export type CreateNotificationInput = {
  userId: string;
  eventKey: string;
  type: NotificationType;
  action: NotificationAction;
  title: string;
  content: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
};

export type NotificationPublic = {
  id: string;
  type: NotificationType;
  action: NotificationAction;
  title: string;
  content: string;
  resourceId: string | null;
  metadata: Prisma.JsonValue | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
};
