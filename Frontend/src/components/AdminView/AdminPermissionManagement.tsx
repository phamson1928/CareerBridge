import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Crown,
  KeyRound,
  LoaderCircle,
  Plus,
  RotateCcw,
  Search,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { useAuth } from "../../auth/AuthContext";
import { useAppFeedback } from "../Feedback/AppFeedbackProvider";
import {
  ADMIN_PERMISSION_OPTIONS,
  ManagedUser,
  UserStatus,
  usersApi,
} from "../../users/api";

const statusLabel: Record<UserStatus, string> = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Chưa kích hoạt",
  BANNED: "Đã khóa",
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
            ? "h-8 px-2.5 text-xs font-semibold rounded-lg border bg-white min-w-[125px]"
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
            compact ? "min-w-[145px]" : "min-w-full sm:min-w-[190px]"
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

const adminStatusOptions: DropdownOption[] = [
  { value: "ACTIVE", label: statusLabel.ACTIVE },
  { value: "INACTIVE", label: statusLabel.INACTIVE },
  { value: "BANNED", label: statusLabel.BANNED },
];

export const AdminPermissionManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const feedback = useAppFeedback();

  const [admins, setAdmins] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "SUPER" | "SUB">("ALL");
  const [savingId, setSavingId] = useState<string | null>(null);

  // Modal Sửa quyền
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Modal Tạo Quản trị viên mới
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createIsSuper, setCreateIsSuper] = useState(false);
  const [createPermissions, setCreatePermissions] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const loadAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.list({ role: "ADMIN", limit: 100 });
      setAdmins(res.items || []);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAdmins();
  }, []);

  const adminList = Array.isArray(admins) ? admins : [];
  const superAdminCount = adminList.filter((a) => a.isSuperAdmin).length;
  const subAdminCount = adminList.filter((a) => !a.isSuperAdmin).length;

  const filteredAdmins = useMemo(() => {
    return adminList.filter((admin) => {
      if (filterType === "SUPER" && !admin.isSuperAdmin) return false;
      if (filterType === "SUB" && admin.isSuperAdmin) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return admin.email.toLowerCase().includes(q);
      }
      return true;
    });
  }, [adminList, filterType, search]);

  const adminFilterOptions = useMemo<DropdownOption[]>(
    () => [
      { value: "ALL", label: `Tất cả quản trị (${adminList.length})` },
      { value: "SUPER", label: `Quản trị tối cao (${superAdminCount})` },
      { value: "SUB", label: `Admin phụ (${subAdminCount})` },
    ],
    [adminList.length, superAdminCount, subAdminCount]
  );

  const openEditModal = (admin: ManagedUser) => {
    setEditingUser(admin);
    setIsSuperAdmin(Boolean(admin.isSuperAdmin));
    setSelectedPermissions(admin.permissions || []);
  };

  const closeEditModal = () => {
    if (!savingPermissions) {
      setEditingUser(null);
    }
  };

  const handleSavePermissions = async () => {
    if (!editingUser) return;

    if (editingUser.isSuperAdmin && !isSuperAdmin) {
      if (editingUser.id === currentUser?.id) {
        feedback.notify({
          title: "Thao tác không được phép",
          message: "Bạn không thể tự hạ cấp tài khoản Quản trị tối cao của chính mình.",
          tone: "error",
        });
        return;
      }
      if (superAdminCount <= 1) {
        feedback.notify({
          title: "Thao tác không được phép",
          message: "Hệ thống phải duy trì ít nhất 1 Quản trị tối cao (Super Admin).",
          tone: "error",
        });
        return;
      }
      const confirmed = window.confirm(
        `CẢNH BÁO BẢO MẬT:\n\nBạn có chắc chắn muốn hạ cấp tài khoản "${editingUser.email}" từ Quản trị tối cao xuống Admin phụ?`,
      );
      if (!confirmed) return;
    }

    setSavingPermissions(true);
    try {
      const updated = await usersApi.update(editingUser.id, {
        isSuperAdmin,
        permissions: isSuperAdmin ? [] : selectedPermissions,
      });
      setAdmins((current) =>
        current.map((item) => (item.id === editingUser.id ? updated : item)),
      );
      feedback.notify({
        title: "Cập nhật thành công",
        message: `Đã lưu quyền cho tài khoản ${editingUser.email}.`,
        tone: "success",
      });
      setEditingUser(null);
    } catch (err) {
      feedback.notify({
        title: "Lỗi cập nhật",
        message: getApiErrorMessage(err),
        tone: "error",
      });
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleStatusChange = async (admin: ManagedUser, nextStatus: UserStatus) => {
    if (admin.id === currentUser?.id) return;
    setSavingId(admin.id);
    try {
      const updated = await usersApi.update(admin.id, { status: nextStatus });
      setAdmins((current) =>
        current.map((item) => (item.id === admin.id ? updated : item)),
      );
    } catch (err) {
      feedback.notify({
        title: "Lỗi cập nhật trạng thái",
        message: getApiErrorMessage(err),
        tone: "error",
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteAdmin = async (admin: ManagedUser) => {
    if (admin.id === currentUser?.id) return;

    if (admin.isSuperAdmin && superAdminCount <= 1) {
      feedback.notify({
        title: "Không thể xóa",
        message: "Hệ thống phải có ít nhất 1 Quản trị tối cao.",
        tone: "error",
      });
      return;
    }

    const accepted = await feedback.confirm({
      title: "Xóa Quản trị viên",
      message: `Bạn có chắc chắn muốn xóa tài khoản "${admin.email}"? Thao tác này không thể hoàn tác.`,
      confirmLabel: "Xóa tài khoản",
      tone: "danger",
    });
    if (!accepted) return;

    setSavingId(admin.id);
    try {
      await usersApi.remove(admin.id);
      setAdmins((current) => current.filter((item) => item.id !== admin.id));
      feedback.notify({
        title: "Đã xóa",
        message: `Đã xóa tài khoản ${admin.email}.`,
        tone: "success",
      });
    } catch (err) {
      feedback.notify({
        title: "Lỗi khi xóa",
        message: getApiErrorMessage(err),
        tone: "error",
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail.trim() || !createPassword.trim()) {
      feedback.notify({
        title: "Thiếu thông tin",
        message: "Vui lòng nhập email và mật khẩu.",
        tone: "info",
      });
      return;
    }

    setCreating(true);
    try {
      const created = await usersApi.create({
        email: createEmail.trim(),
        password: createPassword,
        role: "ADMIN",
        isSuperAdmin: createIsSuper,
        permissions: createIsSuper ? [] : createPermissions,
      });

      setAdmins((current) => [created, ...current]);
      feedback.notify({
        title: "Tạo thành công",
        message: `Đã thêm tài khoản Quản trị viên ${created.email}.`,
        tone: "success",
      });

      setIsCreateOpen(false);
      setCreateEmail("");
      setCreatePassword("");
      setCreateIsSuper(false);
      setCreatePermissions([]);
    } catch (err) {
      feedback.notify({
        title: "Lỗi tạo tài khoản",
        message: getApiErrorMessage(err),
        tone: "error",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="admin-page admin-page--standard space-y-5">
      {/* Khối Header & Bộ lọc chuẩn */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="admin-page-title text-xl font-bold text-slate-900">
              Phân quyền quản trị
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản lý danh sách Quản trị viên và phân chia quyền hạn theo từng phân hệ chức năng.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-600 bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" /> Thêm Quản trị viên
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-2xs transition focus-within:border-[#00878a] focus-within:ring-2 focus-within:ring-[#00878a]/20">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo email quản trị viên..."
              className="w-full text-xs text-slate-800 outline-none placeholder:text-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="cursor-pointer text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <CustomDropdown
            value={filterType}
            onChange={(val) => setFilterType(val as "ALL" | "SUPER" | "SUB")}
            options={adminFilterOptions}
            className="w-full shrink-0 sm:w-[210px]"
          />
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setFilterType("ALL");
              void loadAdmins();
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

      {/* Bảng danh sách Quản trị viên gọn gàng */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-visible">
        <div className="overflow-x-auto min-h-[220px]">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Quản trị viên</th>
                <th className="p-4">Cấp bậc</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">Phân hệ phụ trách</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    <LoaderCircle className="w-5 h-5 animate-spin inline-block mr-2 text-indigo-600" />
                    Đang tải danh sách quản trị viên...
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Không tìm thấy quản trị viên phù hợp.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => {
                  const isCurrent = admin.id === currentUser?.id;
                  const adminPerms = admin.permissions || [];
                  const validPerms = ADMIN_PERMISSION_OPTIONS.filter((opt) =>
                    adminPerms.includes(opt.id),
                  );

                  return (
                    <tr key={admin.id} className="hover:bg-slate-50">
                      {/* Email */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{admin.email}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                              Bạn
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cấp bậc */}
                      <td className="p-4 whitespace-nowrap">
                        {admin.isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Crown className="w-3.5 h-3.5 text-amber-500" /> Super Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Shield className="w-3.5 h-3.5 text-indigo-500" /> Admin phụ ({validPerms.length}/{ADMIN_PERMISSION_OPTIONS.length})
                          </span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="p-4 whitespace-nowrap">
                        <CustomDropdown
                          disabled={isCurrent || savingId === admin.id}
                          value={admin.status}
                          onChange={(val) =>
                            void handleStatusChange(admin, val as UserStatus)
                          }
                          options={adminStatusOptions}
                          compact
                        />
                      </td>

                      {/* Phân hệ phụ trách */}
                      <td className="p-4">
                        {admin.isSuperAdmin ? (
                          <span className="text-xs text-amber-800 font-semibold inline-flex items-center gap-1">
                            Toàn quyền mọi phân hệ
                          </span>
                        ) : validPerms.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">Chưa được cấp quyền</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-w-lg">
                            {validPerms.map((opt) => (
                              <span
                                key={opt.id}
                                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {opt.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          {admin.isSuperAdmin && isCurrent ? (
                            <span className="text-xs text-slate-400 italic px-2">Toàn quyền</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openEditModal(admin)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg font-bold text-xs transition cursor-pointer"
                              title="Cấu hình phân quyền"
                            >
                              <KeyRound className="w-3.5 h-3.5" /> Phân quyền
                            </button>
                          )}

                          {!isCurrent && (
                            <button
                              type="button"
                              disabled={savingId === admin.id}
                              onClick={() => void handleDeleteAdmin(admin)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg font-bold text-xs transition cursor-pointer disabled:opacity-50"
                              title="Xóa tài khoản này"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Xóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: PHÂN QUYỀN GỌN GÀNG ================= */}
      {editingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
          onClick={closeEditModal}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cấu hình phân quyền
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{editingUser.email}</p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={savingPermissions}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chọn Cấp bậc */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Cấp bậc Quản trị viên:</label>
              {(() => {
                const isEditingSelf = editingUser.id === currentUser?.id;
                const isEditingOnlySuperAdmin = Boolean(editingUser.isSuperAdmin) && superAdminCount <= 1;
                const disableSubAdminOption = isEditingSelf || isEditingOnlySuperAdmin;

                return (
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition ${
                        isSuperAdmin
                          ? "border-amber-400 bg-amber-50/60 text-amber-950 shadow-2xs"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="editSuperRadio"
                        checked={isSuperAdmin}
                        onChange={() => setIsSuperAdmin(true)}
                        className="mt-0.5 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="font-bold text-xs flex items-center gap-1 text-slate-900">
                          <Crown className="w-3.5 h-3.5 text-amber-500" /> Super Admin
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Toàn quyền mọi phân hệ
                        </span>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-2 p-3 rounded-xl border transition ${
                        disableSubAdminOption
                          ? "border-slate-200 bg-slate-100/70 text-slate-400 cursor-not-allowed opacity-60"
                          : !isSuperAdmin
                            ? "border-indigo-400 bg-indigo-50/60 text-indigo-950 shadow-2xs cursor-pointer"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                      }`}
                      title={
                        isEditingSelf
                          ? "Bạn không thể tự hạ cấp tài khoản của chính mình"
                          : isEditingOnlySuperAdmin
                            ? "Cần ít nhất 1 Quản trị tối cao"
                            : undefined
                      }
                    >
                      <input
                        type="radio"
                        name="editSuperRadio"
                        checked={!isSuperAdmin}
                        disabled={disableSubAdminOption}
                        onChange={() => setIsSuperAdmin(false)}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                      />
                      <div>
                        <span className="font-bold text-xs flex items-center gap-1 text-slate-900">
                          <Shield className="w-3.5 h-3.5 text-indigo-500" /> Admin phụ
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {isEditingSelf
                            ? "Không thể tự hạ cấp tài khoản"
                            : isEditingOnlySuperAdmin
                              ? "Cần ít nhất 1 Super Admin"
                              : "Giới hạn theo phân hệ"}
                        </span>
                      </div>
                    </label>
                  </div>
                );
              })()}
            </div>

            {/* Chọn các phân hệ (nếu là Admin phụ) */}
            {!isSuperAdmin && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Phân hệ được cấp quyền ({selectedPermissions.length}/{ADMIN_PERMISSION_OPTIONS.length}):
                  </span>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedPermissions(ADMIN_PERMISSION_OPTIONS.map((p) => p.id))}
                      className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                    >
                      Chọn tất cả
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPermissions([])}
                      className="text-slate-500 hover:underline font-semibold cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {ADMIN_PERMISSION_OPTIONS.map((opt) => {
                    const checked = selectedPermissions.includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                          checked
                            ? "border-indigo-300 bg-indigo-50/50 text-indigo-950 font-semibold shadow-2xs"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSelectedPermissions((prev) =>
                              prev.includes(opt.id)
                                ? prev.filter((p) => p !== opt.id)
                                : [...prev, opt.id],
                            );
                          }}
                          className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="font-semibold text-slate-800">{opt.label}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{opt.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={savingPermissions}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleSavePermissions()}
                disabled={savingPermissions}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
              >
                {savingPermissions && <LoaderCircle className="w-4 h-4 animate-spin" />}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: THÊM QUẢN TRỊ VIÊN MỚI ================= */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
          onClick={() => {
            if (!creating) setIsCreateOpen(false);
          }}
        >
          <form
            onSubmit={(e) => void handleCreateAdmin(e)}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Thêm Quản trị viên mới
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tạo tài khoản và cấu hình quyền hạn ban đầu.
                </p>
              </div>
              <button
                type="button"
                disabled={creating}
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="admin.domain@careerbridge.edu.vn"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu *</label>
                <input
                  type="password"
                  required
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cấp bậc ban đầu:</label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition ${
                      createIsSuper
                        ? "border-amber-400 bg-amber-50/60 text-amber-950 shadow-2xs"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="createSuperRadio"
                      checked={createIsSuper}
                      onChange={() => setCreateIsSuper(true)}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold text-xs flex items-center gap-1 text-slate-900">
                        <Crown className="w-3.5 h-3.5 text-amber-500" /> Super Admin
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">Toàn quyền mọi phân hệ</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition ${
                      !createIsSuper
                        ? "border-indigo-400 bg-indigo-50/60 text-indigo-950 shadow-2xs"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="createSuperRadio"
                      checked={!createIsSuper}
                      onChange={() => setCreateIsSuper(false)}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-bold text-xs flex items-center gap-1 text-slate-900">
                        <Shield className="w-3.5 h-3.5 text-indigo-500" /> Admin phụ
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">Giới hạn theo phân hệ</span>
                    </div>
                  </label>
                </div>
              </div>

              {!createIsSuper && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Chọn phân hệ ban đầu ({createPermissions.length}/{ADMIN_PERMISSION_OPTIONS.length}):
                    </span>
                    <div className="flex gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setCreatePermissions(ADMIN_PERMISSION_OPTIONS.map((p) => p.id))}
                        className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                      >
                        Chọn tất cả
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        type="button"
                        onClick={() => setCreatePermissions([])}
                        className="text-slate-500 hover:underline font-semibold cursor-pointer"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {ADMIN_PERMISSION_OPTIONS.map((opt) => {
                      const checked = createPermissions.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                            checked
                              ? "border-indigo-300 bg-indigo-50/50 text-indigo-950 font-semibold shadow-2xs"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setCreatePermissions((prev) =>
                                prev.includes(opt.id)
                                  ? prev.filter((p) => p !== opt.id)
                                  : [...prev, opt.id],
                              );
                            }}
                            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <div className="font-semibold text-slate-800">{opt.label}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{opt.description}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                disabled={creating}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
              >
                {creating && <LoaderCircle className="w-4 h-4 animate-spin" />}
                Tạo tài khoản
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
