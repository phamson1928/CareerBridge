import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { AuthRole } from './auth.types';

export function roleHomePath(role: AuthRole): string {
  switch (role) {
    case 'STUDENT':
      return '/student';
    case 'COMPANY':
      return '/company';
    case 'LECTURER':
      return '/lecturer';
    case 'ADMIN':
      return '/admin';
  }
}

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      <div className="text-center">
        <div className="w-11 h-11 border-4 border-indigo-300/30 border-t-indigo-400 rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-sm font-semibold text-slate-300">
          Đang khôi phục phiên đăng nhập...
        </p>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export function RoleRoute({
  role,
  children,
}: {
  role: AuthRole;
  children: ReactNode;
}) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return <Navigate to={roleHomePath(user.role)} replace />;
  }

  return children;
}

export function AuthenticatedHome() {
  const { user, isInitializing } = useAuth();

  if (isInitializing) {
    return <LoadingScreen />;
  }

  return <Navigate to={user ? roleHomePath(user.role) : '/login'} replace />;
}
