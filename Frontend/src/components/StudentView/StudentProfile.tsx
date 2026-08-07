import React, { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import {
  Edit3,
  FileText,
  GraduationCap,
  LoaderCircle,
  Save,
  Trash2,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import {
  studentsApi,
  StudentProfileInput,
  StudentProfileRecord,
} from "../../students/api";
import { CvUpload } from "./CvUpload";
import { skillsApi } from "../../skills/api";
import type { SkillLevel, SkillRecord, StudentSkillRecord } from "../../skills/types";

const emptyForm: StudentProfileInput = {
  studentCode: "",
  fullName: "",
  major: "",
  phone: "",
  summary: "",
  gpa: null,
};

export const StudentProfileView: React.FC = () => {
  const [profile, setProfile] = useState<StudentProfileRecord | null>(null);
  const [form, setForm] = useState<StudentProfileInput>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogue, setCatalogue] = useState<SkillRecord[]>([]);
  const [studentSkills, setStudentSkills] = useState<StudentSkillRecord[]>([]);
  const [savingSkills, setSavingSkills] = useState(false);

  const applyProfile = (nextProfile: StudentProfileRecord) => {
    setProfile(nextProfile);
    setForm({
      studentCode: nextProfile.studentCode,
      fullName: nextProfile.fullName,
      major: nextProfile.major,
      phone: nextProfile.phone ?? "",
      summary: nextProfile.summary ?? "",
      gpa: nextProfile.gpa,
      cvFileId: nextProfile.cvFileId,
    });
  };

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        const result = await studentsApi.getMine();
        if (active) applyProfile(result);
      } catch (requestError) {
        if (
          axios.isAxiosError(requestError) &&
          requestError.response?.status === 404
        ) {
          if (active) setIsEditing(true);
        } else if (active) {
          setError(getApiErrorMessage(requestError));
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    void Promise.all([skillsApi.list({ limit: 100 }), skillsApi.getStudentMine()])
      .then(([catalogueResult, mine]) => { setCatalogue(catalogueResult.items); setStudentSkills(mine); })
      .catch(() => undefined);
  }, []);

  const saveSkills = async () => {
    setSavingSkills(true); setError(null);
    try { setStudentSkills(await skillsApi.syncStudentMine(studentSkills.map(({ skillId, level }) => ({ skillId, level })))); }
    catch (e) { setError(getApiErrorMessage(e)); } finally { setSavingSkills(false); }
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const payload: StudentProfileInput = {
        ...form,
        phone: form.phone?.trim() || null,
        summary: form.summary?.trim() || null,
        gpa:
          form.gpa === null || Number.isNaN(form.gpa) ? null : Number(form.gpa),
      };
      const result = profile
        ? await studentsApi.updateMine(payload)
        : await studentsApi.createMine(payload);
      applyProfile(result);
      setIsEditing(false);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProfile = async () => {
    if (
      !window.confirm("Xóa hồ sơ sinh viên? Thao tác này không thể hoàn tác.")
    )
      return;
    setIsSaving(true);
    setError(null);
    try {
      await studentsApi.removeMine();
      setProfile(null);
      setForm(emptyForm);
      setIsEditing(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const updateCv = async (file: { id: string; originalName: string }) => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await studentsApi.updateMine({ cvFileId: file.id });
      applyProfile(result);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">
        <LoaderCircle className="mx-auto mb-3 h-5 w-5 animate-spin" />
        Đang tải hồ sơ...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-xl font-black text-white">
              {profile?.fullName.charAt(0) || "S"}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                {profile?.fullName || "Hoàn thiện hồ sơ sinh viên"}
              </h2>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-blue-600">
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
              label="Mã số sinh viên"
              required
              value={form.studentCode}
              onChange={(value) => setForm({ ...form, studentCode: value })}
            />
            <Field
              label="Họ và tên"
              required
              value={form.fullName}
              onChange={(value) => setForm({ ...form, fullName: value })}
            />
            <Field
              label="Ngành học"
              required
              value={form.major}
              onChange={(value) => setForm({ ...form, major: value })}
            />
            <Field
              label="Số điện thoại"
              value={form.phone ?? ""}
              onChange={(value) => setForm({ ...form, phone: value })}
            />
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-800">
                GPA (thang 4)
              </label>
              <input
                type="number"
                min="0"
                max="4"
                step="0.01"
                value={form.gpa ?? ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    gpa:
                      event.target.value === ""
                        ? null
                        : Number(event.target.value),
                  })
                }
                className="w-full rounded-xl border border-slate-300 p-2.5"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-800">
                Tóm tắt
              </label>
              <textarea
                rows={4}
                value={form.summary ?? ""}
                onChange={(event) =>
                  setForm({ ...form, summary: event.target.value })
                }
                className="w-full rounded-xl border border-slate-300 p-2.5"
              />
            </div>
            <div className="flex gap-2 md:col-span-2">
              <button
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
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
              <Info label="Mã số sinh viên" value={profile.studentCode} />
              <Info label="Ngành học" value={profile.major} />
              <Info
                label="Số điện thoại"
                value={profile.phone || "Chưa cập nhật"}
              />
              <Info
                label="GPA"
                value={
                  profile.gpa === null ? "Chưa cập nhật" : `${profile.gpa}/4`
                }
              />
              <div className="md:col-span-2">
                <p className="text-xs font-bold text-slate-800">Tóm tắt</p>
                <p className="mt-1 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                  {profile.summary || "Chưa cập nhật"}
                </p>
              </div>
            </div>
          )
        )}
      </section>

      {profile && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="mb-4"><h3 className="text-lg font-extrabold text-slate-900">Kỹ năng</h3><p className="text-xs text-slate-500">Chọn kỹ năng và cấp độ thực tế của bạn.</p></div>
          <div className="flex flex-wrap gap-2">{catalogue.map(skill => { const selected = studentSkills.find(item => item.skillId === skill.id); return <button key={skill.id} type="button" onClick={() => setStudentSkills(prev => selected ? prev.filter(item => item.skillId !== skill.id) : [...prev, { skillId: skill.id, name: skill.name, level: 'BEGINNER' }])} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${selected ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>{skill.name}</button>; })}</div>
          <div className="mt-4 space-y-2">{studentSkills.map(item => <div key={item.skillId} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span className="text-sm font-semibold">{item.name}</span><select value={item.level} onChange={e => setStudentSkills(prev => prev.map(current => current.skillId === item.skillId ? { ...current, level: e.target.value as SkillLevel } : current))} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option><option value="EXPERT">Expert</option></select></div>)}</div>
          <button onClick={() => void saveSkills()} disabled={savingSkills} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{savingSkills ? 'Đang lưu...' : 'Lưu kỹ năng'}</button>
        </section>
      )}

      {profile && (
        <section className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-indigo-600 p-2.5 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">CV của bạn</h3>
              <p className="text-xs text-indigo-900">
                File được lưu riêng tư và truy cập bằng signed URL.
              </p>
            </div>
          </div>
          <CvUpload
            fileId={profile.cvFileId ?? undefined}
            fileName={profile.cvFile?.originalName}
            mimeType={profile.cvFile?.mimeType}
            onUploaded={(file) => void updateCv(file)}
          />
          {isSaving && (
            <p className="mt-2 text-xs text-slate-500">
              Đang lưu liên kết CV...
            </p>
          )}
        </section>
      )}

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
