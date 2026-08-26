import React, { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import {
  Building2,
  Edit3,
  GraduationCap,
  LoaderCircle,
  Save,
  Trash2,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { useAppFeedback } from "../Feedback/AppFeedbackProvider";
import {
  lecturersApi,
  LecturerProfileInput,
  LecturerProfileRecord,
} from "../../lecturers/api";

const emptyForm: LecturerProfileInput = {
  fullName: "",
  department: "",
  title: "",
};

export const LecturerProfileView: React.FC = () => {
  const { confirm } = useAppFeedback();
  const [profile, setProfile] = useState<LecturerProfileRecord | null>(null);
  const [form, setForm] = useState<LecturerProfileInput>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyProfile = (nextProfile: LecturerProfileRecord) => {
    setProfile(nextProfile);
    setForm({
      fullName: nextProfile.fullName,
      department: nextProfile.department,
      title: nextProfile.title ?? "",
    });
  };

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        const result = await lecturersApi.getMine();
        if (active) applyProfile(result);
      } catch (requestError) {
        if (
          axios.isAxiosError(requestError) &&
          requestError.response?.status === 404
        ) {
          if (active) setIsEditing(true);
        } else if (active) setError(getApiErrorMessage(requestError));
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const payload: LecturerProfileInput = {
        ...form,
        title: form.title?.trim() || null,
      };
      const result = profile
        ? await lecturersApi.updateMine(payload)
        : await lecturersApi.createMine(payload);
      applyProfile(result);
      setIsEditing(false);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProfile = async () => {
    const accepted = await confirm({ title: "Xóa hồ sơ giảng viên", message: "Xóa hồ sơ giảng viên? Thao tác này không thể hoàn tác.", confirmLabel: "Xóa hồ sơ", tone: "danger" });
    if (!accepted) return;
    setIsSaving(true);
    setError(null);
    try {
      await lecturersApi.removeMine();
      setProfile(null);
      setForm(emptyForm);
      setIsEditing(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return (
      <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">
        <LoaderCircle className="mx-auto mb-3 h-5 w-5 animate-spin" />
        Đang tải hồ sơ...
      </div>
    );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-xl font-black text-white">
              {profile?.fullName.charAt(0) || "G"}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                {profile?.fullName || "Hoàn thiện hồ sơ giảng viên"}
              </h2>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-purple-600">
                <GraduationCap className="h-4 w-4" />
                Thông tin hồ sơ được lưu trực tiếp trên hệ thống.
              </p>
            </div>
          </div>
          {profile && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-200"
            >
              <Edit3 className="h-4 w-4" />
              Chỉnh sửa
            </button>
          )}
        </div>
        {error && <p className="mt-4 text-xs text-rose-600">{error}</p>}
        {isEditing ? (
          <form
            onSubmit={(event) => void saveProfile(event)}
            className="mt-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-2"
          >
            <Field
              label="Họ và tên"
              required
              value={form.fullName}
              onChange={(value) => setForm({ ...form, fullName: value })}
            />
            <Field
              label="Khoa/Bộ môn"
              required
              value={form.department}
              onChange={(value) => setForm({ ...form, department: value })}
            />
            <div className="md:col-span-2">
              <Field
                label="Chức danh học thuật"
                value={form.title ?? ""}
                onChange={(value) => setForm({ ...form, title: value })}
              />
            </div>
            <div className="flex gap-2 md:col-span-2">
              <button
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {profile ? "Lưu thay đổi" : "Tạo hồ sơ"}
              </button>
              {profile && (
                <button
                  type="button"
                  onClick={() => {
                    applyProfile(profile);
                    setIsEditing(false);
                  }}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold"
                >
                  Hủy
                </button>
              )}
            </div>
          </form>
        ) : (
          profile && (
            <div className="mt-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <Info label="Khoa/Bộ môn" value={profile.department} />
              <Info
                label="Chức danh"
                value={profile.title || "Chưa cập nhật"}
              />
              <div className="md:col-span-2 rounded-xl border border-purple-100 bg-purple-50 p-4 text-xs text-purple-900">
                <Building2 className="mb-2 h-4 w-4" />
                Thông tin này sẽ được dùng trong các luồng phân công và duyệt
                báo cáo ở các tuần tiếp theo.
              </div>
            </div>
          )
        )}
      </section>
      {profile && (
        <button
          onClick={() => void deleteProfile()}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          Xóa hồ sơ
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-slate-800">
        {label}
        {required ? " *" : ""}
      </label>
      <input
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 p-2.5"
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-800">{label}</p>
      <p className="mt-1 text-slate-600">{value}</p>
    </div>
  );
}
