import { LogOut, ShieldCheck } from 'lucide-react';
import { AuthUser } from '../auth/auth.types';

const roleLabels: Record<AuthUser['role'], string> = {
  STUDENT: 'Sinh viên',
  COMPANY: 'Doanh nghiệp',
  LECTURER: 'Giảng viên',
  ADMIN: 'Quản trị viên',
};

export function SessionBanner({
  user,
  onLogout,
}: {
  user: AuthUser;
  onLogout: () => void;
}) {
  return (
    <div className="bg-slate-950 text-white text-xs py-2 px-4 shadow-md sticky top-0 z-50 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1.5 font-bold text-emerald-300 bg-emerald-400/10 px-2.5 py-1 rounded-md border border-emerald-400/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            {roleLabels[user.role]}
          </span>
          <span className="text-slate-300 truncate">{user.email}</span>
        </div>

        <button
          type="button"
          id="btn-logout"
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors font-semibold"
        >
          <LogOut className="w-3.5 h-3.5" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
