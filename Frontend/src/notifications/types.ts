export type NotificationType =
  | 'APPLICATION'
  | 'REPORT'
  | 'SUPERVISION'
  | 'PLACEMENT'
  | 'COMPANY'
  | 'EVALUATION'
  | 'SYSTEM';

export type NotificationAction =
  | 'NONE'
  | 'OPEN_APPLICATION'
  | 'OPEN_REPORT'
  | 'OPEN_SUPERVISION'
  | 'OPEN_PLACEMENT'
  | 'OPEN_COMPANY_PROFILE'
  | 'OPEN_EVALUATION';

export interface AppNotification {
  id: string;
  type: NotificationType;
  action: NotificationAction;
  title: string;
  content: string;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPage {
  items: AppNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}

export type NotificationFilter = 'ALL' | 'UNREAD';
