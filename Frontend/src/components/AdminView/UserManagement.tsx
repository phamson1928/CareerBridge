import React, { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
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
    const accepted = await confirm({
      title: "Xóa tài khoản",
      message: `Xóa tài khoản ${user.email}? Thao tác này không thể hoàn tác.`,
      confirmLabel: "Xóa tài khoản",
      tone: "danger",
    });
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
    <div className="admin-page admin-page--standard space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="admin-page-title text-xl font-bold text-slate-900">
              Quản lý người dùng
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dữ liệu được lấy trực tiếp từ hệ thống. Chỉ quản trị viên có quyền
              thao tác.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-600 bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white"
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => {
            if (savingId !== "create") setIsCreateOpen(false);
          }}
        >
          <form
            onSubmit={(event) => void createUser(event)}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Tạo tài khoản mới
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Tạo tài khoản trực tiếp cho sinh viên, doanh nghiệp, giảng
                  viên hoặc quản trị viên.
                </p>
              </div>
              <button
                type="button"
                disabled={savingId === "create"}
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-800">
                  Email *
                </label>
                <input
                  required
                  type="email"
                  value={newUser.email}
                  onChange={(event) =>
                    setNewUser({ ...newUser, email: event.target.value })
                  }
                  placeholder="Ví dụ: user@careerbridge.vn"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-800">
                    Mật khẩu *
                  </label>
                  <input
                    required
                    minLength={8}
                    type="password"
                    value={newUser.password}
                    onChange={(event) =>
                      setNewUser({ ...newUser, password: event.target.value })
                    }
                    placeholder="Ít nhất 8 ký tự"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-800">
                    Vai trò *
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(event) =>
                      setNewUser({
                        ...newUser,
                        role: event.target.value as AuthRole,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    {roles.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {error && <p className="text-xs text-rose-600">{error}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={savingId === "create"}
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={savingId === "create"}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {savingId === "create" && (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                )}
                Tạo tài khoản
              </button>
            </div>
          </form>
        </div>
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
        {!loading && total > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-600">
            <span className="font-medium text-slate-500">
              Tổng: <strong className="text-slate-700">{total}</strong> tài khoản
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((value) => value - 1)}
                className="rounded-lg border border-slate-200 p-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>
                Trang {page}/{totalPages}
              </span>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((value) => value + 1)}
                className="rounded-lg border border-slate-200 p-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
