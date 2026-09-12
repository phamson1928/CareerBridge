export const NOTIFICATION_EVENTS = {
  CREATED: 'notification.created',
  READ: 'notification.read',
  READ_ALL: 'notification.read-all',
  DELETED: 'notification.deleted',
} as const;

export const notificationRoom = (userId: string) => `user:${userId}`;
