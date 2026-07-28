import React from 'react';
import { UserRole } from '../types';
import { GraduationCap, Building2, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';

interface RoleBannerProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  activeUserName: string;
}

export const RoleBanner: React.FC<RoleBannerProps> = ({
  currentRole,
  onSelectRole,
  activeUserName,
}) => {
  const roles: { id: UserRole; label: string; name: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'STUDENT',
      label: 'Sinh viên',
      name: 'Phạm Hoàng Sơn',
      icon: <GraduationCap className="w-4 h-4" />,
      color: 'hover:bg-indigo-50 border-indigo-200 text-indigo-700',
    },
    {
      id: 'COMPANY',
      label: 'Doanh nghiệp',
      name: 'FPT Software HR',
      icon: <Building2 className="w-4 h-4" />,
      color: 'hover:bg-emerald-50 border-emerald-200 text-emerald-700',
    },
    {
      id: 'TEACHER',
      label: 'Giảng viên',
      name: 'TS. Nguyễn Văn Anh',
      icon: <UserCheck className="w-4 h-4" />,
      color: 'hover:bg-purple-50 border-purple-200 text-purple-700',
    },
    {
      id: 'ADMIN',
      label: 'Quản trị viên',
      name: 'Admin System',
      icon: <ShieldAlert className="w-4 h-4" />,
      color: 'hover:bg-rose-50 border-rose-200 text-rose-700',
    },
  ];

  return (
    <div className="bg-slate-900 text-white text-xs py-2 px-4 shadow-md sticky top-0 z-50 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
            <Sparkles className="w-3.5 h-3.5" /> Chuyển vai trò thử nghiệm:
          </span>
          <span className="text-slate-300 hidden md:inline">
            Đang đóng vai: <strong className="text-white">{activeUserName}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
          {roles.map((r) => {
            const isActive = currentRole === r.id;
            return (
              <button
                key={r.id}
                id={`role-btn-${r.id.toLowerCase()}`}
                onClick={() => onSelectRole(r.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all text-xs border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm ring-2 ring-indigo-400/30 font-bold'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {r.icon}
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
