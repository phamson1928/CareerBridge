import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { Users, Search, ShieldCheck, Lock, Unlock, Mail, Filter } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onToggleUserLock: (userId: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, onToggleUserLock }) => {
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter((u) => {
    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản Lý Người Dùng & Phân Quyền RBAC</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý danh sách tài khoản Sinh viên, Doanh nghiệp, Giảng viên và Admin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-1.5 text-xs text-slate-700">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên hoặc email..."
              className="bg-transparent focus:outline-none w-36"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="STUDENT">Sinh viên</option>
            <option value="COMPANY">Doanh nghiệp</option>
            <option value="TEACHER">Giảng viên</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Người dùng</th>
                <th className="p-4">Email / Tài khoản</th>
                <th className="p-4">Vai trò (Role)</th>
                <th className="p-4">Ngày tham gia</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((usr) => (
                <tr key={usr.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <img
                      src={usr.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={usr.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <span className="font-bold text-slate-900">{usr.name}</span>
                  </td>

                  <td className="p-4 text-slate-600 font-mono text-[11px]">{usr.email}</td>

                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                        usr.role === 'STUDENT'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : usr.role === 'COMPANY'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : usr.role === 'TEACHER'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {usr.role}
                    </span>
                  </td>

                  <td className="p-4 text-slate-500">{usr.createdAt}</td>

                  <td className="p-4 text-right">
                    <button
                      onClick={() => onToggleUserLock(usr.id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition-colors"
                    >
                      Đang hoạt động (Khóa)
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
