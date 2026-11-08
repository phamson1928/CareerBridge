import React, { FormEvent, useEffect, useState } from "react";
import {
  Building2,
  Crown,
  Edit3,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { ADMIN_PERMISSION_OPTIONS } from "../../users/api";
import { useAppFeedback } from "../Feedback/AppFeedbackProvider";
import {
  ProfileAvatarPreview,
  ProfileAvatarUpload,
} from "../ProfileAvatarUpload";

export interface AdminProfileData {
  fullName: string;
  title: string;
  department: string;
  phone: string;
  office: string;
  bio: string;
  avatarFileId: string | null;
}

export const ADMIN_PROFILE_UPDATED_EVENT = "cb:admin-profile-updated";

function getDefaultAdminProfile(
  email?: string,
  isSuperAdmin?: boolean,
): AdminProfileData {
  const lower = (email || "").toLowerCase();
  if (lower.startsWith("support.")) {
    return {
      fullName: "Chuyên viên Hỗ trợ Sinh viên",
      title: "Phụ trách Hỗ trợ & Giải đáp Thực tập",
      department: "Phòng Công tác Sinh viên",
      phone: "028 3899 1122",
      office: "Phòng A.105 - Khu Hành chính",
      bio: "Tiếp nhận, xử lý các yêu cầu hỗ trợ và thắc mắc của sinh viên trong kỳ thực tập.",
      avatarFileId: null,
    };
  }
  if (lower.startsWith("corporate.")) {
    return {
      fullName: "Chuyên viên Quan hệ Doanh nghiệp",
      title: "Phụ trách Đối tác & Tuyển dụng",
      department: "Trung tâm Hợp tác Doanh nghiệp",
      phone: "028 3899 2233",
      office: "Phòng B.201 - Khu Hành chính",
      bio: "Xét duyệt hồ sơ đối tác doanh nghiệp, kiểm duyệt tin đăng tuyển dụng và danh mục kỹ năng.",
      avatarFileId: null,
    };
  }
  if (lower.startsWith("academic.")) {
    return {
      fullName: "Chuyên viên Quản lý Đào tạo",
      title: "Điều phối Thực tập & Học vụ",
      department: "Phòng Đào tạo Đại học",
      phone: "028 3899 3344",
      office: "Phòng A.202 - Khu Hành chính",
      bio: "Quản lý kỳ thực tập, phân công giảng viên hướng dẫn và theo dõi tiến độ thực tập toàn trường.",
      avatarFileId: null,
    };
  }
  return {
    fullName: isSuperAdmin ? "Ban Quản trị CareerBridge" : "Quản trị viên CareerBridge",
    title: isSuperAdmin ? "Trưởng ban Quản trị Hệ thống" : "Cán bộ Quản trị Phân hệ",
    department: "Trung tâm Quản trị Hệ thống & Hợp tác Doanh nghiệp",
    phone: "028 3899 8899",
    office: "Phòng A.101 - Tòa nhà Trung tâm",
    bio: "Điều hành tổng thể hệ thống quản lý thực tập CareerBridge, phân quyền quản trị và giám sát vận hành.",
    avatarFileId: null,
  };
}

export function loadAdminProfile(
  userId?: string,
  email?: string,
  isSuperAdmin?: boolean,
): AdminProfileData {
  const defaults = getDefaultAdminProfile(email, isSuperAdmin);
  if (!userId) return defaults;
  try {
    const raw = localStorage.getItem(`cb.adminProfile.${userId}`);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<AdminProfileData>;
    return {
      fullName: parsed.fullName?.trim() || defaults.fullName,
      title: parsed.title?.trim() ?? defaults.title,
      department: parsed.department?.trim() ?? defaults.department,
      phone: parsed.phone?.trim() ?? defaults.phone,
      office: parsed.office?.trim() ?? defaults.office,
      bio: parsed.bio?.trim() ?? defaults.bio,
      avatarFileId: parsed.avatarFileId ?? null,
    };
  } catch {
    return defaults;
  }
}

export function saveAdminProfileToStorage(
  userId: string,
  data: AdminProfileData,
): void {
  localStorage.setItem(`cb.adminProfile.${userId}`, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(ADMIN_PROFILE_UPDATED_EVENT));
}

export const AdminProfile: React.FC = () => {
  const { user } = useAuth();
  const feedback = useAppFeedback();

  const [profile, setProfile] = useState<AdminProfileData>(() =>
    loadAdminProfile(user?.id, user?.email, user?.isSuperAdmin),
  );
  const [form, setForm] = useState<AdminProfileData>(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadAdminProfile(user?.id, user?.email, user?.isSuperAdmin);
    setProfile(loaded);
    setForm(loaded);
  }, [user?.id, user?.email, user?.isSuperAdmin]);

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.id) return;
    if (!form.fullName.trim()) {
      setError("Vui lòng nhập Họ và tên hiển thị.");
      return;
    }

    const cleaned: AdminProfileData = {
      fullName: form.fullName.trim(),
      title: form.title.trim(),
      department: form.department.trim(),
      phone: form.phone.trim(),
      office: form.office.trim(),
      bio: form.bio.trim(),
      avatarFileId: form.avatarFileId,
    };

    saveAdminProfileToStorage(user.id, cleaned);
    setProfile(cleaned);
    setIsEditing(false);
    setError(null);
    feedback.notify({
      title: "Đã lưu hồ sơ",
      message: "Thông tin hồ sơ và ảnh đại diện quản trị viên đã được cập nhật.",
      tone: "success",
    });
  };

  const assignedPermissions = ADMIN_PERMISSION_OPTIONS.filter((opt) =>
    (user?.permissions || []).includes(opt.id),
  );
  const avatarInitial = (profile.fullName.charAt(0) || user?.email?.charAt(0) || "A").toUpperCase();

  return (
    <div className="admin-page admin-page--standard space-y-6">
      {/* Thẻ Hồ sơ chính */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <ProfileAvatarPreview
                fileId={profile.avatarFileId}
                fallback={avatarInitial}
                className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-tr from-[#00878a] to-[#005f61] text-2xl font-black text-white shadow-md"
                imageClassName="h-full w-full object-cover"
              />
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                <UserCheck className="h-3 w-3" />
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="admin-page-title text-xl font-extrabold text-slate-900">
                  {profile.fullName}
                </h2>
                {user?.isSuperAdmin ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                    <Crown className="h-3.5 w-3.5 text-amber-500" /> Super Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-[#e6f6f6] px-2.5 py-0.5 text-[11px] font-bold text-[#00777a]">
                    <Shield className="h-3.5 w-3.5" /> Admin phụ ({assignedPermissions.length}/{ADMIN_PERMISSION_OPTIONS.length})
                  </span>
                )}
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#00777a]">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {profile.title || "Quản trị viên"}
                  {profile.department ? ` · ${profile.department}` : ""}
                </span>
              </p>
            </div>
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <Edit3 className="h-4 w-4" />
              Chỉnh sửa hồ sơ
            </button>
          )}
        </div>

        {error && <p className="mt-4 text-xs font-semibold text-rose-600">{error}</p>}

        {isEditing ? (
          <form
            onSubmit={handleSave}
            className="mt-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-2"
          >
            <ProfileAvatarUpload
              fileId={form.avatarFileId}
              fallback={(form.fullName.charAt(0) || "A").toUpperCase()}
              accentClassName="from-[#00878a] to-[#005f61]"
              onChange={(avatarFileId) => {
                const updated = { ...form, avatarFileId };
                setForm(updated);
                if (user?.id) {
                  saveAdminProfileToStorage(user.id, updated);
                  setProfile(updated);
                }
              }}
              onError={setError}
            />

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-800">
                Họ và tên hiển thị *
              </label>
              <input
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="VD: Nguyễn Văn Quản Trị"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:border-[#00878a] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-800">
                Chức vụ / Vai trò công tác
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="VD: Trưởng ban Quản trị Hệ thống"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:border-[#00878a] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-800">
                Đơn vị / Phòng ban
              </label>
              <input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="VD: Trung tâm Hợp tác Doanh nghiệp"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:border-[#00878a] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-800">
                Số điện thoại liên hệ
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="VD: 028 3899 8899"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:border-[#00878a] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-800">
                Văn phòng làm việc
              </label>
              <input
                value={form.office}
                onChange={(e) => setForm({ ...form, office: e.target.value })}
                placeholder="VD: Phòng A.101 - Tòa nhà Hành chính"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:border-[#00878a] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-800">
                Giới thiệu / Nhiệm vụ phụ trách
              </label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Mô tả ngắn gọn nhiệm vụ phụ trách..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:border-[#00878a] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2 md:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                Lưu thay đổi
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(profile);
                  setIsEditing(false);
                  setError(null);
                }}
                className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase">
                  <Mail className="h-3.5 w-3.5 text-[#00878a]" /> Email đăng nhập
                </p>
                <p className="mt-1 truncate text-xs font-bold text-slate-800">
                  {user?.email}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase">
                  <Phone className="h-3.5 w-3.5 text-[#00878a]" /> Số điện thoại
                </p>
                <p className="mt-1 text-xs font-bold text-slate-800">
                  {profile.phone || "Chưa cập nhật"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase">
                  <Building2 className="h-3.5 w-3.5 text-[#00878a]" /> Đơn vị công tác
                </p>
                <p className="mt-1 text-xs font-bold text-slate-800">
                  {profile.department || "Chưa cập nhật"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase">
                  <MapPin className="h-3.5 w-3.5 text-[#00878a]" /> Văn phòng
                </p>
                <p className="mt-1 text-xs font-bold text-slate-800">
                  {profile.office || "Chưa cập nhật"}
                </p>
              </div>
            </div>

            {profile.bio && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-xs font-bold text-slate-700">Nhiệm vụ & Giới thiệu</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{profile.bio}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Khối Phạm vi Phân quyền của Tài khoản */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e6f6f6] text-[#00777a]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Phạm vi quyền hạn trên hệ thống
            </h3>
            <p className="text-xs text-slate-500">
              Các phân hệ chức năng mà tài khoản của bạn được phép truy cập và điều hành.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_PERMISSION_OPTIONS.map((opt) => {
            const hasPerm = Boolean(
              user?.isSuperAdmin || (user?.permissions || []).includes(opt.id),
            );
            return (
              <div
                key={opt.id}
                className={`rounded-xl border p-3.5 transition ${
                  hasPerm
                    ? "border-[#b8e2e3] bg-[#f4fbfb]"
                    : "border-slate-100 bg-slate-50/50 opacity-55"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    {opt.label}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      hasPerm
                        ? "bg-[#00878a] text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {hasPerm ? "Được cấp" : "Không có"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  {opt.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
