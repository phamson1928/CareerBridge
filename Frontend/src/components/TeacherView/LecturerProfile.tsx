import React, { FormEvent, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Building2,
  CheckCircle2,
  Clock3,
  Edit3,
  GraduationCap,
  LoaderCircle,
  Save,
  Trash2,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { facultiesApi } from "../../organization/api";
import type { FacultyOption } from "../../organization/types";
import { useAppFeedback } from "../Feedback/AppFeedbackProvider";
import {
  lecturersApi,
  LecturerProfileInput,
  LecturerProfileRecord,
} from "../../lecturers/api";
import {
  ProfileAvatarPreview,
  ProfileAvatarUpload,
} from "../ProfileAvatarUpload";
import { CustomSelect } from "../Common/CustomSelect";

const emptyForm: LecturerProfileInput = {
  fullName: "",
  facultyId: "",
  department: "",
  title: "",
};

interface LecturerProfileViewProps {
  onProfileChange?: (profile: LecturerProfileRecord | null) => void;
}

export const LecturerProfileView: React.FC<LecturerProfileViewProps> = ({
  onProfileChange,
}) => {
  const { confirm } = useAppFeedback();
  const [profile, setProfile] = useState<LecturerProfileRecord | null>(null);
  const [form, setForm] = useState<LecturerProfileInput>(emptyForm);
  const [facultyOptions, setFacultyOptions] = useState<FacultyOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const applyProfile = (
    nextProfile: LecturerProfileRecord,
    faculties = facultyOptions,
  ) => {
    setProfile(nextProfile);
    let resolvedFacultyId =
      nextProfile.facultyId ?? nextProfile.faculty?.id ?? "";
    if (!resolvedFacultyId && nextProfile.department && faculties.length > 0) {
      const matched = faculties.find(
        (f) =>
          f.name.toLowerCase() === nextProfile.department.toLowerCase() ||
          f.code.toLowerCase() === nextProfile.department.toLowerCase(),
      );
      if (matched) resolvedFacultyId = matched.id;
    }

    setForm({
      fullName: nextProfile.fullName,
      facultyId: resolvedFacultyId,
      department: nextProfile.department,
      title: nextProfile.title ?? "",
      avatarFileId: nextProfile.avatarFileId,
    });
  };

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      const [profileResult, optionsResult] = await Promise.allSettled([
        lecturersApi.getMine(),
        facultiesApi.listOptions({ includeInactive: true }),
      ]);
      if (!active) return;

      const loadedFaculties =
        optionsResult.status === "fulfilled" ? optionsResult.value.items : [];
      setFacultyOptions(loadedFaculties);

      if (profileResult.status === "fulfilled") {
        applyProfile(profileResult.value, loadedFaculties);
        setIsEditing(false);
      } else if (
        axios.isAxiosError(profileResult.reason) &&
        profileResult.reason.response?.status === 404
      ) {
        const firstActive = loadedFaculties.find((f) => f.isActive);
        if (firstActive) {
          setForm((prev) => ({
            ...prev,
            facultyId: firstActive.id,
            department: firstActive.name,
          }));
        }
        setIsEditing(true);
      } else {
        setError(getApiErrorMessage(profileResult.reason));
      }

      setIsLoading(false);
    };
    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const selectableFaculties = useMemo(() => {
    const currentId = profile?.facultyId ?? profile?.faculty?.id;
    return facultyOptions.filter((f) => f.isActive || f.id === currentId);
  }, [facultyOptions, profile]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.facultyId && !form.department?.trim()) {
      setError("Vui lòng chọn Khoa chủ quản.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const payload: LecturerProfileInput = {
        fullName: form.fullName.trim(),
        ...(form.facultyId
          ? { facultyId: form.facultyId }
          : { department: form.department?.trim() }),
        title: form.title?.trim() || null,
        avatarFileId: form.avatarFileId,
      };
      const result = profile
        ? await lecturersApi.updateMine(payload)
        : await lecturersApi.createMine(payload);
      applyProfile(result);
      onProfileChange?.(result);
      setIsEditing(false);
      setSuccessMessage("Đã lưu thông tin hồ sơ giảng viên hướng dẫn.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProfile = async () => {
    const accepted = await confirm({
      title: "Xóa hồ sơ giảng viên",
      message: "Xóa hồ sơ giảng viên? Thao tác này không thể hoàn tác.",
      confirmLabel: "Xóa hồ sơ",
      tone: "danger",
    });
    if (!accepted) return;
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await lecturersApi.removeMine();
      setProfile(null);
      setForm(emptyForm);
      onProfileChange?.(null);
      setIsEditing(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">
        <LoaderCircle className="mx-auto mb-3 h-5 w-5 animate-spin text-[#038b95]" />
        Đang tải hồ sơ giảng viên...
      </div>
    );
  }

  const facultyDisplay = profile?.faculty
    ? `[${profile.faculty.code}] ${profile.faculty.name}${
        !profile.faculty.isActive ? " (Khoa cũ)" : ""
      }`
    : profile?.department || "Chưa cập nhật";

  return (
    <div className="admin-page admin-page--standard space-y-6">
      <section className="rounded-2xl border border-slate-200/80 bg-[#f8fafd] p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-[#e0f4f6] border border-[#b8e6ea] p-3 text-[#02636a] shrink-0">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Thông tin chi tiết giảng viên hướng dẫn
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Thông tin học vị, Khoa cơ hữu và ảnh đại diện hiển thị với sinh viên thực tập và nhà trường.
              </p>
            </div>
          </div>

          {profile && !isEditing && (
            <button
              type="button"
              onClick={() => {
                setSuccessMessage(null);
                setIsEditing(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#038b95] px-4 py-2 text-xs font-bold text-white hover:bg-[#026f77] transition cursor-pointer shadow-xs"
            >
              <Edit3 className="h-4 w-4" />
              Chỉnh sửa hồ sơ
            </button>
          )}
        </div>

        {/* Status Card (Matches VerificationStatus in CompanyProfile) */}
        {profile ? (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-bold">
                  Hồ sơ giảng viên đã sẵn sàng tiếp nhận phân công
                </p>
                <p className="mt-1 text-xs leading-relaxed">
                  Khoa cơ hữu: <b>{facultyDisplay}</b>
                  {profile.title ? ` • Chức danh / Học vị: ${profile.title}` : ""}
                </p>
              </div>
            </div>
            <ProfileAvatarPreview
              fileId={profile.avatarFileId}
              fallback={profile.fullName.charAt(0) || "G"}
              className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#038b95] to-[#025c63] text-base font-black text-white shadow-xs"
              imageClassName="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-bold">Hồ sơ giảng viên đang soạn</p>
              <p className="mt-1 text-xs leading-relaxed">
                Vui lòng nhập đầy đủ Họ và tên, chọn Khoa cơ hữu và bấm Lưu hồ sơ để kích hoạt thông tin giảng viên.
              </p>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-5 rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        {successMessage && (
          <p className="mt-5 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm font-medium text-emerald-800">
            {successMessage}
          </p>
        )}

        {isEditing ? (
          <form
            onSubmit={(event) => void saveProfile(event)}
            className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <Field
              label="Họ và tên giảng viên"
              required
              placeholder="Ví dụ: Nguyễn Văn A"
              value={form.fullName}
              onChange={(value) => {
                setSuccessMessage(null);
                setForm({ ...form, fullName: value });
              }}
            />

            <Field
              label="Chức danh học thuật / Học vị"
              placeholder="Ví dụ: ThS., TS., PGS.TS., Giảng viên chính..."
              value={form.title ?? ""}
              onChange={(value) => {
                setSuccessMessage(null);
                setForm({ ...form, title: value });
              }}
            />

            <div className="md:col-span-2">
              <CustomSelect
                label="Khoa cơ hữu"
                required
                value={form.facultyId ?? ""}
                placeholder="-- Chọn Khoa cơ hữu --"
                options={[
                  { value: "", label: "-- Chọn Khoa cơ hữu --" },
                  ...selectableFaculties.map((fac) => ({
                    value: fac.id,
                    label: fac.name,
                    code: fac.code,
                    badge: !fac.isActive ? "(Khoa cũ)" : undefined,
                  })),
                ]}
                onChange={(value) => {
                  setSuccessMessage(null);
                  const fac = facultyOptions.find((f) => f.id === value);
                  setForm({
                    ...form,
                    facultyId: value,
                    department: fac?.name ?? form.department,
                  });
                }}
              />
            </div>

            <div className="md:col-span-2 rounded-2xl border border-[#b8e6ea] bg-[#e0f4f6]/50 p-4">
              <ProfileAvatarUpload
                fileId={form.avatarFileId}
                fallback={form.fullName.charAt(0) || "G"}
                accentClassName="from-[#038b95] to-[#025c63]"
                disabled={isSaving}
                onChange={(avatarFileId) => {
                  setSuccessMessage(null);
                  setForm({ ...form, avatarFileId });
                }}
                onError={setError}
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-2.5 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#038b95] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#026f77] disabled:opacity-50 transition cursor-pointer shadow-xs"
              >
                {isSaving ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {profile ? "Lưu hồ sơ" : "Tạo hồ sơ"}
              </button>
              {profile && (
                <button
                  type="button"
                  onClick={() => {
                    applyProfile(profile);
                    setIsEditing(false);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy
                </button>
              )}
            </div>
          </form>
        ) : (
          profile && (
            <div className="mt-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <Info label="Họ và tên giảng viên" value={profile.fullName} />
              <Info
                label="Chức danh / Học vị"
                value={profile.title || "Chưa cập nhật"}
              />
              <Info label="Khoa cơ hữu" value={facultyDisplay} />
              <Info
                label="Cập nhật gần nhất"
                value={new Date(profile.updatedAt).toLocaleDateString("vi-VN")}
              />
              <div className="md:col-span-2 rounded-2xl border border-[#b8e6ea] bg-[#e0f4f6]/50 p-4 text-xs text-teal-950 flex items-start gap-3">
                <Building2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#038b95]" />
                <span className="leading-relaxed">
                  Khoa cơ hữu giúp hệ thống và Ban quản trị ưu tiên phân công sinh viên đúng chuyên môn đào tạo, đồng thời giảng viên vẫn có thể được phân công hướng dẫn sinh viên liên khoa khi cần thiết.
                </span>
              </div>
            </div>
          )
        )}
      </section>

      {profile && (
        <button
          type="button"
          onClick={() => void deleteProfile()}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition cursor-pointer shadow-2xs"
        >
          <Trash2 className="h-4 w-4" />
          Xóa hồ sơ giảng viên
        </button>
      )}
    </div>
  );
};

function Field({
  label,
  value,
  onChange,
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs font-bold text-slate-800">
      {label}
      {required ? " *" : ""}
      <input
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition"
      />
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}
