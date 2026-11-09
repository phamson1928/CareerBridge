import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Award,
  Ban,
  BookOpen,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  FileText,
  Globe,
  GraduationCap,
  Key,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Shield,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { useAuth } from "../../auth/AuthContext";
import { useAppFeedback } from "../Feedback/AppFeedbackProvider";
import type { AuthRole } from "../../auth/auth.types";
import {
  ADMIN_PERMISSION_OPTIONS,
  ManagedUser,
  UserStatus,
  usersApi,
} from "../../users/api";

const roles: AuthRole[] = ["STUDENT", "COMPANY", "LECTURER", "ADMIN"];
const statuses: UserStatus[] = ["ACTIVE", "INACTIVE", "BANNED"];

const roleBadge: Record<AuthRole, { label: string; style: string }> = {
  STUDENT: { label: "Sinh viên", style: "border-sky-200 bg-sky-50 text-sky-700" },
  COMPANY: { label: "Doanh nghiệp", style: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  LECTURER: { label: "Giảng viên", style: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  ADMIN: { label: "Quản trị viên", style: "border-amber-200 bg-amber-50 text-amber-700" },
};

const statusBadge: Record<UserStatus, { label: string; style: string }> = {
  ACTIVE: { label: "Hoạt động", style: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  INACTIVE: { label: "Chưa kích hoạt", style: "border-slate-200 bg-slate-100 text-slate-600" },
  BANNED: { label: "Đã khóa", style: "border-rose-200 bg-rose-50 text-rose-700" },
};

interface DropdownOption {
  value: string;
  label: string;
}

function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  className = "",
  disabled = false,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  return (
    <div
      className={`relative ${compact ? "inline-block" : ""} ${
        isOpen ? "z-40" : "z-auto"
      } ${className}`}
      ref={containerRef}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        className={`group flex items-center justify-between gap-1.5 transition outline-none shadow-2xs ${
          compact
            ? "h-8 px-2.5 text-xs font-semibold rounded-lg border bg-white min-w-[110px]"
            : "h-10 w-full px-3.5 text-xs font-semibold rounded-xl border bg-white text-left"
        } ${
          isOpen
            ? "border-[#00878a] ring-2 ring-[#00878a]/20"
            : "border-slate-200 hover:border-slate-300"
        } ${disabled ? "cursor-not-allowed opacity-50 bg-slate-50" : "cursor-pointer"}`}
      >
        <span className={`truncate ${value ? "text-slate-800" : "text-slate-600"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${
            compact ? "h-3.5 w-3.5" : "h-4 w-4"
          } ${isOpen ? "rotate-180 text-[#00878a]" : "group-hover:text-slate-600"}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full left-0 mt-1 z-50 rounded-xl border border-slate-100 bg-white p-1 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-slate-800 ${
            compact ? "min-w-[135px]" : "min-w-full sm:min-w-[190px]"
          }`}
        >
          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg ${
                  compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-xs"
                } text-left transition-colors cursor-pointer ${
                  opt.value === value
                    ? "bg-[#e6f6f6] font-semibold text-[#00878a]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {opt.value === value && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-[#00878a]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const roleOptions: DropdownOption[] = [
  { value: "", label: "Tất cả vai trò" },
  ...roles.map((r) => ({ value: r, label: r })),
];

const statusOptions: DropdownOption[] = [
  { value: "", label: "Tất cả trạng thái" },
  ...statuses.map((s) => ({ value: s, label: s })),
];

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
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
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [newUser, setNewUser] = useState<{
    email: string;
    password: string;
    role: AuthRole;
    isSuperAdmin: boolean;
    permissions: string[];
  }>({
    email: "",
    password: "",
    role: "STUDENT",
    isSuperAdmin: false,
    permissions: [],
  });

  const toggleNewUserPerm = (permId: string) => {
    setNewUser((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

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
    input: {
      role?: AuthRole;
      status?: UserStatus;
      isSuperAdmin?: boolean;
      permissions?: string[];
    },
  ) => {
    setSavingId(id);
    setError(null);
    try {
      const updated = await usersApi.update(id, input);
      setUsers((current) =>
        current.map((item) => (item.id === id ? updated : item)),
      );
      setSelectedUser((curr) => (curr?.id === id ? updated : curr));
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
      await usersApi.create({
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        ...(newUser.role === "ADMIN"
          ? {
              isSuperAdmin: newUser.isSuperAdmin,
              permissions: newUser.isSuperAdmin ? [] : newUser.permissions,
            }
          : {}),
      });
      setNewUser({
        email: "",
        password: "",
        role: "STUDENT",
        isSuperAdmin: false,
        permissions: [],
      });
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
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#00878a] bg-[#00878a] hover:bg-[#007477] px-3.5 py-2 text-xs font-bold text-white transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> Tạo tài khoản
          </button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-2xs transition focus-within:border-[#00878a] focus-within:ring-2 focus-within:ring-[#00878a]/20">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm email..."
              className="w-full text-xs text-slate-800 outline-none placeholder:text-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="cursor-pointer text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <CustomDropdown
            value={role}
            onChange={(val) => {
              setRole(val as AuthRole | "");
              setPage(1);
            }}
            options={roleOptions}
            className="w-full shrink-0 sm:w-[160px]"
          />
          <CustomDropdown
            value={status}
            onChange={(val) => {
              setStatus(val as UserStatus | "");
              setPage(1);
            }}
            options={statusOptions}
            className="w-full shrink-0 sm:w-[170px]"
          />
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setRole("");
              setStatus("");
              setPage(1);
              void loadUsers();
            }}
            disabled={loading}
            className="inline-flex h-10 cursor-pointer shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#cbebeb] bg-[#e6f6f6] px-3.5 text-xs font-semibold text-[#00878a] shadow-2xs transition hover:bg-[#d5eeee] active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
            title="Đặt lại bộ lọc và làm mới dữ liệu"
          >
            <RotateCcw className={`h-4 w-4 shrink-0 ${loading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
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

              {newUser.role === "ADMIN" && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 space-y-3">
                  <label className="block text-xs font-bold text-slate-800">
                    Phân quyền Quản trị viên
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label
                      className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        newUser.isSuperAdmin
                          ? "border-amber-400 bg-amber-50/80 text-amber-950 shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="createAdminType"
                        checked={newUser.isSuperAdmin}
                        onChange={() =>
                          setNewUser({
                            ...newUser,
                            isSuperAdmin: true,
                            permissions: [],
                          })
                        }
                        className="mt-0.5 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="font-bold flex items-center gap-1 text-slate-900">
                          <Crown className="w-3.5 h-3.5 text-amber-500" /> Super Admin
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Toàn quyền & quản lý user
                        </span>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        !newUser.isSuperAdmin
                          ? "border-indigo-400 bg-indigo-50/80 text-indigo-950 shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="createAdminType"
                        checked={!newUser.isSuperAdmin}
                        onChange={() =>
                          setNewUser({ ...newUser, isSuperAdmin: false })
                        }
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="font-bold flex items-center gap-1 text-slate-900">
                          <Shield className="w-3.5 h-3.5 text-indigo-500" /> Admin phụ
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Giới hạn theo phân hệ
                        </span>
                      </div>
                    </label>
                  </div>

                  {!newUser.isSuperAdmin && (
                    <div className="space-y-2 pt-2 border-t border-indigo-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700">
                          Phân hệ được cấp quyền ({newUser.permissions.length}/
                          {ADMIN_PERMISSION_OPTIONS.length}):
                        </span>
                        <div className="flex gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() =>
                              setNewUser({
                                ...newUser,
                                permissions: ADMIN_PERMISSION_OPTIONS.map(
                                  (p) => p.id,
                                ),
                              })
                            }
                            className="text-indigo-600 hover:underline font-semibold"
                          >
                            Chọn tất cả
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() =>
                              setNewUser({ ...newUser, permissions: [] })
                            }
                            className="text-slate-500 hover:underline font-semibold"
                          >
                            Bỏ chọn
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {ADMIN_PERMISSION_OPTIONS.map((opt) => {
                          const checked = newUser.permissions.includes(opt.id);
                          return (
                            <label
                              key={opt.id}
                              className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                checked
                                  ? "border-indigo-300 bg-white text-indigo-950 font-semibold shadow-xs"
                                  : "border-slate-200 bg-white/70 text-slate-600 hover:bg-white"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleNewUserPerm(opt.id)}
                                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <div>
                                <div className="text-xs font-semibold text-slate-800">
                                  {opt.label}
                                </div>
                                <div className="text-[10px] text-slate-500 line-clamp-1">
                                  {opt.description}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-visible">
        <div className="overflow-x-auto min-h-[220px]">
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
                  <tr
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="hover:bg-slate-50/90 cursor-pointer transition-colors group"
                  >
                    <td className="p-4 font-mono text-xs font-semibold text-[#00878a]">
                      {user.email}
                    </td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <CustomDropdown
                        disabled={savingId === user.id || user.id === currentUser?.id}
                        value={user.role}
                        onChange={(val) =>
                          void updateUser(user.id, {
                            role: val as AuthRole,
                          })
                        }
                        options={roleOptions.filter((item) => item.value !== "")}
                        compact
                      />
                    </td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <CustomDropdown
                        disabled={savingId === user.id}
                        value={user.status}
                        onChange={(val) =>
                          void updateUser(user.id, {
                            status: val as UserStatus,
                          })
                        }
                        options={statusOptions.filter((item) => item.value !== "")}
                        compact
                      />
                    </td>
                    <td className="p-4 text-slate-600">
                      {new Intl.DateTimeFormat("vi-VN").format(
                        new Date(user.createdAt),
                      )}
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center justify-end gap-1">
                        {user.id !== currentUser?.id && (
                          <button
                            disabled={savingId === user.id}
                            onClick={() => void deleteUser(user)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg font-bold text-xs disabled:opacity-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Xóa
                          </button>
                        )}
                      </div>
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

      {/* Modal Chi tiết tài khoản người dùng */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-xs transition-opacity"
          onClick={() => setSelectedUser(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="flex max-h-[calc(100vh-2.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-5">
              <div className="flex items-center gap-3.5">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-2xs ${
                    selectedUser.role === "STUDENT"
                      ? "bg-[#e6f6f6] text-[#00878a]"
                      : selectedUser.role === "COMPANY"
                      ? "bg-indigo-50 text-indigo-700"
                      : selectedUser.role === "LECTURER"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {selectedUser.role === "STUDENT" ? (
                    <GraduationCap className="h-6 w-6" />
                  ) : selectedUser.role === "COMPANY" ? (
                    <Building2 className="h-6 w-6" />
                  ) : selectedUser.role === "LECTURER" ? (
                    <BookOpen className="h-6 w-6" />
                  ) : (
                    <Crown className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                      {selectedUser.role === "STUDENT"
                        ? selectedUser.studentProfile?.fullName || selectedUser.email
                        : selectedUser.role === "COMPANY"
                        ? selectedUser.companyProfile?.companyName || selectedUser.email
                        : selectedUser.role === "LECTURER"
                        ? selectedUser.lecturerProfile?.fullName || selectedUser.email
                        : selectedUser.email}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                        roleBadge[selectedUser.role].style
                      }`}
                    >
                      {roleBadge[selectedUser.role].label}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                        statusBadge[selectedUser.status].style
                      }`}
                    >
                      {statusBadge[selectedUser.status].label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 font-mono flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                    {selectedUser.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition cursor-pointer"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 text-xs [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {/* 1. Thông tin hệ thống chung */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Thông tin hệ thống
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Trạng thái tài khoản</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {statusBadge[selectedUser.status].label}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Ngày tạo</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {new Date(selectedUser.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Cập nhật lần cuối</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {new Date(selectedUser.updatedAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Thông tin hồ sơ chi tiết theo Vai trò */}
              {selectedUser.role === "STUDENT" && (
                <div className="rounded-xl border border-[#cbebeb] bg-[#f2fafb] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#00878a] flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4" /> Hồ sơ sinh viên
                    </p>
                    {selectedUser.studentProfile?.studentCode && (
                      <span className="rounded-lg bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-[#00878a] border border-[#cbebeb]">
                        MSSV: {selectedUser.studentProfile.studentCode}
                      </span>
                    )}
                  </div>

                  {selectedUser.studentProfile ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-[#cbebeb]/70">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Họ và tên</span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">
                          {selectedUser.studentProfile.fullName}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Chuyên ngành đào tạo</span>
                        <p className="font-semibold text-slate-800 mt-0.5">
                          {selectedUser.studentProfile.major || "Chưa cập nhật"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Số điện thoại</span>
                        <p className="font-medium text-slate-800 mt-0.5 flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {selectedUser.studentProfile.phone || "Chưa cập nhật"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Điểm GPA tích lũy</span>
                        <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                          <Award className="h-3.5 w-3.5 text-amber-500" />
                          {selectedUser.studentProfile.gpa !== null && selectedUser.studentProfile.gpa !== undefined
                            ? selectedUser.studentProfile.gpa.toFixed(2)
                            : "Chưa cập nhật"}
                        </p>
                      </div>
                      {selectedUser.studentProfile.summary && (
                        <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                          <span className="text-slate-400 block text-[11px]">Mục tiêu nghề nghiệp &amp; Giới thiệu</span>
                          <p className="text-xs text-slate-700 leading-relaxed mt-1 whitespace-pre-line bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            {selectedUser.studentProfile.summary}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic bg-white p-3 rounded-lg border border-[#cbebeb]/60">
                      Tài khoản này chưa hoàn tất biểu mẫu hồ sơ sinh viên ban đầu.
                    </p>
                  )}
                </div>
              )}

              {selectedUser.role === "COMPANY" && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                      <Building2 className="h-4 w-4" /> Hồ sơ doanh nghiệp
                    </p>
                    {selectedUser.companyProfile?.status && (
                      <span className="rounded-lg bg-white px-2 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200">
                        {selectedUser.companyProfile.status}
                      </span>
                    )}
                  </div>

                  {selectedUser.companyProfile ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-indigo-100">
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block text-[11px]">Tên doanh nghiệp</span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">
                          {selectedUser.companyProfile.companyName}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Mã số thuế / GPKD</span>
                        <p className="font-mono font-semibold text-slate-800 mt-0.5">
                          {selectedUser.companyProfile.businessRegistrationNumber || "Chưa cập nhật"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Lĩnh vực hoạt động</span>
                        <p className="font-semibold text-slate-800 mt-0.5">
                          {selectedUser.companyProfile.industry || "Chưa cập nhật"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Người đại diện liên hệ</span>
                        <p className="font-medium text-slate-800 mt-0.5">
                          {selectedUser.companyProfile.contactPersonName || "Chưa cập nhật"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Số điện thoại liên hệ</span>
                        <p className="font-medium text-slate-800 mt-0.5 flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {selectedUser.companyProfile.contactPhone || "Chưa cập nhật"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Email liên hệ</span>
                        <p className="font-medium text-slate-800 mt-0.5 flex items-center gap-1.5 break-all">
                          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {selectedUser.companyProfile.contactEmail || "Chưa cập nhật"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Website</span>
                        <p className="font-medium text-[#00878a] mt-0.5 flex items-center gap-1.5 break-all">
                          <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {selectedUser.companyProfile.website ? (
                            <a
                              href={selectedUser.companyProfile.website.startsWith("http") ? selectedUser.companyProfile.website : `https://${selectedUser.companyProfile.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline"
                            >
                              {selectedUser.companyProfile.website}
                            </a>
                          ) : (
                            "Chưa cập nhật"
                          )}
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block text-[11px]">Địa chỉ trụ sở</span>
                        <p className="font-medium text-slate-800 mt-0.5 flex items-start gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                          {selectedUser.companyProfile.address || "Chưa cập nhật"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic bg-white p-3 rounded-lg border border-indigo-100">
                      Tài khoản này chưa hoàn tất thiết lập hồ sơ doanh nghiệp.
                    </p>
                  )}
                </div>
              )}

              {selectedUser.role === "LECTURER" && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" /> Hồ sơ giảng viên
                  </p>

                  {selectedUser.lecturerProfile ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-emerald-100">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Họ và tên giảng viên</span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">
                          {selectedUser.lecturerProfile.fullName}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Khoa / Đơn vị công tác</span>
                        <p className="font-semibold text-slate-800 mt-0.5">
                          {selectedUser.lecturerProfile.department || "Chưa cập nhật"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Học hàm / Học vị</span>
                        <p className="font-medium text-slate-800 mt-0.5">
                          {selectedUser.lecturerProfile.title || "Giảng viên"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic bg-white p-3 rounded-lg border border-emerald-100">
                      Tài khoản này chưa hoàn tất thiết lập hồ sơ giảng viên.
                    </p>
                  )}
                </div>
              )}

              {selectedUser.role === "ADMIN" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <Shield className="h-4 w-4" /> Quyền hạn quản trị viên
                  </p>
                  <div className="bg-white p-3.5 rounded-xl border border-amber-200/70 space-y-2.5">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Cấp độ quản trị</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">
                        {selectedUser.isSuperAdmin
                          ? "Quản trị viên tối cao (Super Admin)"
                          : "Quản trị viên phân hệ"}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {selectedUser.isSuperAdmin
                          ? "Tài khoản có toàn quyền truy cập và thao tác tại tất cả các phân hệ của hệ thống."
                          : "Tài khoản chỉ được thao tác tại các phân hệ được chỉ định cụ thể bên dưới."}
                      </p>
                    </div>

                    {!selectedUser.isSuperAdmin && (
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-slate-400 block text-[11px] mb-1.5">Danh sách quyền được cấp:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedUser.permissions && selectedUser.permissions.length > 0 ? (
                            selectedUser.permissions.map((p) => {
                              const found = ADMIN_PERMISSION_OPTIONS.find((opt) => opt.id === p);
                              return (
                                <span
                                  key={p}
                                  className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800"
                                >
                                  {found ? found.label : p}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-xs text-slate-400 italic">Chưa được cấp quyền phân hệ nào</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-3">
              <span className="text-[11px] text-slate-400">
                Nhấn vào các ô chọn trong bảng ngoài để thay đổi nhanh vai trò hoặc trạng thái.
              </span>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
  );
};
