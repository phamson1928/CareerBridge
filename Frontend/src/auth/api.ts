import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import type { ApiErrorBody, ApiSuccess, RefreshSession } from './auth.types';
import { getAccessToken, setAccessToken } from './token-store';

const apiBaseUrl =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const authApi = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryableRequest | undefined;
    const isUnauthorized = error.response?.status === 401;
    const isAuthEndpoint = request?.url?.includes('/auth/') ?? false;

    if (!request || !isUnauthorized || request._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    request._retry = true;

    try {
      refreshPromise ??= authApi
        .post<ApiSuccess<RefreshSession>>('/auth/refresh')
        .then((response) => {
          const token = response.data.data.accessToken;
          setAccessToken(token);
          return token;
        })
        .finally(() => {
          refreshPromise = null;
        });

      const token = await refreshPromise;
      request.headers.Authorization = `Bearer ${token}`;
      return api(request);
    } catch (refreshError) {
      setAccessToken(null);
      return Promise.reject(refreshError);
    }
  },
);

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const messages = error.response?.data?.message;
    if (Array.isArray(messages) && messages.length > 0) {
      return messages.join('. ');
    }
    if (typeof messages === 'string') {
      return messages;
    }
  }

  return 'Không thể kết nối tới hệ thống. Vui lòng thử lại.';
}
