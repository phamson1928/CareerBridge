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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-600">Đang khởi tạo hệ thống...</span>
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
    return null;
  }

  return <Navigate to={user ? roleHomePath(user.role) : '/login'} replace />;
}
