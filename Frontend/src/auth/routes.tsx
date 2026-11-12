import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
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
    <div
      className="min-h-screen flex items-center justify-center bg-[#f2f6f7] relative overflow-hidden select-none"
      role="status"
      aria-live="polite"
    >
      {/* Aurora glow background */}
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(36rem_22rem_at_50%_40%,rgba(0,163,166,0.14),transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Brand Icon */}
        <div className="h-15 w-15 rounded-2xl bg-white/95 border border-teal-900/15 shadow-[0_10px_30px_-10px_rgba(0,80,84,0.2)] flex items-center justify-center text-[#008b8f] mb-3">
          <GraduationCap className="h-7 w-7" />
        </div>

        {/* Brand Text */}
        <span className="text-sm font-black tracking-tight text-slate-800">
          Career<span className="text-[#008b8f]">Bridge</span>
        </span>

        {/* Smooth Indeterminate Progress Bar */}
        <div
          className="h-1 w-40 rounded-full splash-loading-bar mt-3.5"
          aria-hidden="true"
        />

        <span className="text-xs font-medium text-slate-500 mt-2.5">
          Đang khởi tạo hệ thống...
        </span>
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
