import React, { FormEvent, useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { useAppFeedback } from "../Feedback/AppFeedbackProvider";
import type { AuthRole } from "../../auth/auth.types";
import { ManagedUser, UserStatus, usersApi } from "../../users/api";

const roles: AuthRole[] = ["STUDENT", "COMPANY", "LECTURER", "ADMIN"];
const statuses: UserStatus[] = ["ACTIVE", "INACTIVE", "BANNED"];

export const UserManagement: React.FC = () => {
  const { confirm } = useAppFeedback();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<AuthRole | "">("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    role: "STUDENT" as AuthRole,
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await usersApi.list({
        page,
        limit: 20,
        search: search || undefined,
        role: role || undefined,
        status: status || undefined,
      });
      setUsers(result.items);
      setTotal(result.pagination.total);
      setTotalPages(Math.max(result.pagination.totalPages, 1));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [page, role, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadUsers(), 250);
    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  const updateUser = async (
    id: string,
    input: { role?: AuthRole; status?: UserStatus },
  ) => {
    setSavingId(id);
    setError(null);
    try {
      const updated = await usersApi.update(id, input);
      setUsers((current) =>
        current.map((item) => (item.id === id ? updated : item)),
      );
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSavingId(null);
    }
  };

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingId("create");
    setError(null);
    try {
      await usersApi.create(newUser);
      setNewUser({ email: "", password: "", role: "STUDENT" });
      setIsCreateOpen(false);
      setPage(1);
      await loadUsers();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSavingId(null);
    }
  };

  const deleteUser = async (user: ManagedUser) => {
    const accepted = await confirm({ title: 'Xóa tài khoản', message: `Xóa tài khoản ${user.email}? Thao tác này không thể hoàn tác.`, confirmLabel: 'Xóa tài khoản', tone: 'danger' });
    if (!accepted) return;
    setSavingId(user.id);
    setError(null);
    try {
      await usersApi.remove(user.id);
      await loadUsers();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Quản lý người dùng
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dữ liệu được lấy trực tiếp từ hệ thống. Chỉ Admin có quyền thao
              tác.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs"
          >
            <Plus className="w-4 h-4" /> Tạo tài khoản
          </button>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex flex-1 items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 text-xs text-slate-700">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm email..."
              className="bg-transparent focus:outline-none w-full"
            />
          </div>
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value as AuthRole | "");
              setPage(1);
            }}
            className="p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold"
          >
            <option value="">Tất cả vai trò</option>
            {roles.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as UserStatus | "");
              setPage(1);
            }}
            className="p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold"
          >
            <option value="">Tất cả trạng thái</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            onClick={() => void loadUsers()}
            className="p-2 border border-slate-200 rounded-xl text-slate-600"
            aria-label="Tải lại danh sách"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>

      {isCreateOpen && (
        <form
          onSubmit={(event) => void createUser(event)}
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-3"
        >
          <input
            required
            type="email"
            value={newUser.email}
            onChange={(event) =>
              setNewUser({ ...newUser, email: event.target.value })
            }
            placeholder="Email"
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
          />
          <input
            required
            minLength={8}
            type="password"
            value={newUser.password}
            onChange={(event) =>
              setNewUser({ ...newUser, password: event.target.value })
            }
            placeholder="Mật khẩu (ít nhất 8 ký tự)"
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
          />
          <select
            value={newUser.role}
            onChange={(event) =>
              setNewUser({ ...newUser, role: event.target.value as AuthRole })
            }
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
          >
            {roles.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              disabled={savingId === "create"}
              className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold disabled:opacity-50"
            >
              Tạo
            </button>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Email</th>
                <th className="p-4">Vai trò</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">Ngày tạo</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    Đang tải...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    Không có tài khoản phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono text-[11px]">{user.email}</td>
                    <td className="p-4">
                      <select
                        disabled={savingId === user.id}
                        value={user.role}
                        onChange={(event) =>
                          void updateUser(user.id, {
                            role: event.target.value as AuthRole,
                          })
                        }
                        className="border border-slate-200 rounded-lg px-2 py-1 bg-white"
                      >
                        {roles.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      <select
                        disabled={savingId === user.id}
                        value={user.status}
                        onChange={(event) =>
                          void updateUser(user.id, {
                            status: event.target.value as UserStatus,
                          })
                        }
                        className="border border-slate-200 rounded-lg px-2 py-1 bg-white"
                      >
                        {statuses.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      {new Intl.DateTimeFormat("vi-VN").format(
                        new Date(user.createdAt),
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        disabled={savingId === user.id}
                        onClick={() => void deleteUser(user)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg font-bold disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-4 border-t text-xs">
          <span>{total} tài khoản</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => value - 1)}
              className="px-3 py-1.5 rounded-lg border disabled:opacity-50"
            >
              Trước
            </button>
            <span className="py-1.5">
              Trang {page}/{totalPages}
            </span>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((value) => value + 1)}
              className="px-3 py-1.5 rounded-lg border disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
