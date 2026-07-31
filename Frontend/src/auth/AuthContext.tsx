import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, authApi } from './api';
import {
  ApiSuccess,
  AuthSession,
  AuthUser,
  LoginInput,
  RefreshSession,
  RegisterInput,
} from './auth.types';
import { setAccessToken, subscribeAccessToken } from './token-store';

interface AuthContextValue {
  user: AuthUser | null;
  isInitializing: boolean;
  login: (input: LoginInput) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

let restoreSessionPromise: Promise<{
  token: string;
  user: AuthUser;
} | null> | null = null;

async function restoreSessionOnce() {
  restoreSessionPromise ??= (async () => {
    try {
      const refreshResponse = await authApi.post<ApiSuccess<RefreshSession>>(
        '/auth/refresh',
      );
      const token = refreshResponse.data.data.accessToken;
      setAccessToken(token);
      const meResponse = await api.get<ApiSuccess<AuthUser>>('/auth/me');
      return { token, user: meResponse.data.data };
    } catch {
      setAccessToken(null);
      return null;
    }
  })();

  return restoreSessionPromise;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const applySession = useCallback((session: AuthSession) => {
    setAccessToken(session.accessToken);
    setUser(session.user);
    return session.user;
  }, []);

  useEffect(() => {
    return subscribeAccessToken((token) => {
      if (!token) {
        setUser(null);
      }
    });
  }, []);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const restored = await restoreSessionOnce();
      if (active) {
        setUser(restored?.user ?? null);
        setIsInitializing(false);
      }
    };

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      const response = await authApi.post<ApiSuccess<AuthSession>>(
        '/auth/login',
        input,
      );
      return applySession(response.data.data);
    },
    [applySession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const response = await authApi.post<ApiSuccess<AuthSession>>(
        '/auth/register',
        input,
      );
      return applySession(response.data.data);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, isInitializing, login, register, logout }),
    [user, isInitializing, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
