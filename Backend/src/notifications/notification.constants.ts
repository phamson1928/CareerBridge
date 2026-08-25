export const NOTIFICATION_EVENTS = {
  CREATED: 'notification.created',
  READ: 'notification.read',
  READ_ALL: 'notification.read-all',
} as const;

export const notificationRoom = (userId: string) => `user:${userId}`;
