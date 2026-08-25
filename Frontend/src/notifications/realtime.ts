import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from '../auth/token-store';
import type { AppNotification } from './types';

function realtimeOrigin() {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
  return new URL(apiUrl).origin;
}

export function createNotificationSocket() {
  const token = getAccessToken();
  if (!token) return null;

  return io(`${realtimeOrigin()}/realtime`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });
}

export type NotificationSocket = Socket;
export type NotificationCreatedHandler = (notification: AppNotification) => void;
