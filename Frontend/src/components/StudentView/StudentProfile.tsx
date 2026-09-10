import React, { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import {
  Edit3,
  ExternalLink,
  FileText,
  GraduationCap,
  LoaderCircle,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { useAppFeedback } from "../Feedback/AppFeedbackProvider";
import {
  studentsApi,
  StudentProjectInput,
  StudentProjectRecord,
  StudentProfileInput,
  StudentProfileRecord,
} from "../../students/api";
import { CvUpload } from "./CvUpload";
import { skillsApi } from "../../skills/api";
import type { SkillLevel, StudentSkillRecord } from '../../skills/types';
import { SkillPicker, type SkillOption } from '../Skills/SkillPicker';

const emptyForm: StudentProfileInput = {
  studentCode: "",
  fullName: "",
  major: "",
  phone: "",
  summary: "",
  gpa: null,
};

const emptyProject: StudentProjectInput = {
  title: "",
  description: "",
  repositoryUrl: "",
  demoUrl: "",
  startedAt: null,
  endedAt: null,
};

interface StudentProfileViewProps {
  onProfileChange?: (
    profile: StudentProfileRecord | null,
    skills: StudentSkillRecord[],
  ) => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  onProfileChange,
}) => {
  const { confirm } = useAppFeedback();
  const [profile, setProfile] = useState<StudentProfileRecord | null>(null);
  const [form, setForm] = useState<StudentProfileInput>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [studentSkills, setStudentSkills] = useState<StudentSkillRecord[]>([]);
  const [savingSkills, setSavingSkills] = useState(false);
  const [projects, setProjects] = useState<StudentProjectRecord[]>([]);
  const [projectForm, setProjectForm] = useState<StudentProjectInput>(emptyProject);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [savingProject, setSavingProject] = useState(false);

  const applyProfile = (
    nextProfile: StudentProfileRecord,
    nextSkills = studentSkills,
  ) => {
    setProfile(nextProfile);
    setProjects(nextProfile.projects ?? []);
    setForm({
      studentCode: nextProfile.studentCode,
      fullName: nextProfile.fullName,
      major: nextProfile.major,
      phone: nextProfile.phone ?? "",
      summary: nextProfile.summary ?? "",
      gpa: nextProfile.gpa,
      cvFileId: nextProfile.cvFileId,
    });
    onProfileChange?.(nextProfile, nextSkills);
  };

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      const [profileResult, skillsResult] = await Promise.allSettled([
        studentsApi.getMine(),
        skillsApi.getStudentMine(),
      ]);

      if (!active) return;

      if (profileResult.status === "fulfilled") {
        const loadedSkills =
          skillsResult.status === "fulfilled" ? skillsResult.value : [];
        setStudentSkills(loadedSkills);
        applyProfile(profileResult.value, loadedSkills);
      } else if (
        axios.isAxiosError(profileResult.reason) &&
        profileResult.reason.response?.status === 404
      ) {
        setIsEditing(true);
      } else {
        setError(getApiErrorMessage(profileResult.reason));
      }

      if (skillsResult.status === "fulfilled") {
        setStudentSkills(skillsResult.value);
      } else if (profileResult.status === "fulfilled") {
        setError(getApiErrorMessage(skillsResult.reason));
      }

      setIsLoading(false);
    };
    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const saveSkills = async () => {
    setSavingSkills(true);
    setError(null);
    try {
      const nextSkills = await skillsApi.syncStudentMine(
        studentSkills.map(({ skillId, level }) => ({ skillId, level })),
      );
      setStudentSkills(nextSkills);
      if (profile) onProfileChange?.(profile, nextSkills);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSavingSkills(false);
    }
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
    const accepted = await confirm({ title: "Xóa hồ sơ sinh viên", message: "Xóa hồ sơ sinh viên? Thao tác này không thể hoàn tác.", confirmLabel: "Xóa hồ sơ", tone: "danger" });
    if (!accepted) return;
    setIsSaving(true);
    setError(null);
    try {
      await studentsApi.removeMine();
      setProfile(null);
      setForm(emptyForm);
      setIsEditing(true);
      onProfileChange?.(null, []);
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

  const removeCv = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await studentsApi.updateMine({ cvFileId: null });
      applyProfile(result);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const saveProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProject(true);
    setError(null);
    try {
      const payload = {
        ...projectForm,
        description: projectForm.description?.trim() || null,
        repositoryUrl: projectForm.repositoryUrl?.trim() || null,
        demoUrl: projectForm.demoUrl?.trim() || null,
        startedAt: projectForm.startedAt || null,
        endedAt: projectForm.endedAt || null,
      };
      const saved = editingProjectId
        ? await studentsApi.updateProject(editingProjectId, payload)
        : await studentsApi.createProject(payload);
      setProjects((current) =>
        editingProjectId
          ? current.map((project) => (project.id === saved.id ? saved : project))
          : [saved, ...current],
      );
      const nextProjects = editingProjectId
        ? projects.map((project) => (project.id === saved.id ? saved : project))
        : [saved, ...projects];
      if (profile) {
        onProfileChange?.({ ...profile, projects: nextProjects }, studentSkills);
      }
      setProjectForm(emptyProject);
      setEditingProjectId(null);
      setShowProjectForm(false);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSavingProject(false);
    }
  };

  const editProject = (project: StudentProjectRecord) => {
    setEditingProjectId(project.id);
    setShowProjectForm(true);
    setProjectForm({
      title: project.title,
      description: project.description ?? "",
      repositoryUrl: project.repositoryUrl ?? "",
      demoUrl: project.demoUrl ?? "",
      startedAt: project.startedAt?.slice(0, 10) ?? null,
      endedAt: project.endedAt?.slice(0, 10) ?? null,
    });
  };

  const deleteProject = async (projectId: string) => {
    setSavingProject(true);
    setError(null);
    try {
      await studentsApi.removeProject(projectId);
      const nextProjects = projects.filter((project) => project.id !== projectId);
      setProjects(nextProjects);
      if (profile) {
        onProfileChange?.({ ...profile, projects: nextProjects }, studentSkills);
      }
      if (editingProjectId === projectId) {
        setEditingProjectId(null);
        setProjectForm(emptyProject);
        setShowProjectForm(false);
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSavingProject(false);
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
              <Info label="Email" value={profile.user.email} />
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
              <Info
                label="Cập nhật lần cuối"
                value={new Date(profile.updatedAt).toLocaleDateString("vi-VN")}
              />
            </div>
          )
        )}
      </section>

      {profile && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Dự án cá nhân</h3>
              <p className="text-xs text-slate-500">Giới thiệu các sản phẩm và dự án nổi bật.</p>
            </div>
            {!showProjectForm && (
              <button type="button" onClick={() => { setProjectForm(emptyProject); setShowProjectForm(true); }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white">
                <Plus className="h-4 w-4" /> Thêm dự án
              </button>
            )}
          </div>
          {showProjectForm && (
            <form onSubmit={(event) => void saveProject(event)} className="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 md:grid-cols-2">
              <Field label="Tên dự án" required value={projectForm.title} onChange={(value) => setProjectForm({ ...projectForm, title: value })} />
              <Field label="Link repository" value={projectForm.repositoryUrl ?? ""} onChange={(value) => setProjectForm({ ...projectForm, repositoryUrl: value })} />
              <Field label="Link demo" value={projectForm.demoUrl ?? ""} onChange={(value) => setProjectForm({ ...projectForm, demoUrl: value })} />
              <div className="grid grid-cols-2 gap-2">
                <DateField label="Bắt đầu" value={projectForm.startedAt ?? ""} onChange={(value) => setProjectForm({ ...projectForm, startedAt: value || null })} />
                <DateField label="Kết thúc" value={projectForm.endedAt ?? ""} onChange={(value) => setProjectForm({ ...projectForm, endedAt: value || null })} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-bold text-slate-800">Mô tả</label>
                <textarea rows={3} value={projectForm.description ?? ""} onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })} className="w-full rounded-xl border border-slate-300 p-2.5" />
              </div>
              <div className="flex gap-2 md:col-span-2">
                <button disabled={savingProject} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />{editingProjectId ? "Lưu dự án" : "Thêm dự án"}</button>
                {showProjectForm && <button type="button" onClick={() => { setEditingProjectId(null); setShowProjectForm(false); setProjectForm(emptyProject); }} className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold">Hủy</button>}
              </div>
            </form>
          )}
          <div className="space-y-3">
            {projects.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Chưa có dự án nào.</p>}
            {projects.map((project) => (
              <article key={project.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><h4 className="font-bold text-slate-900">{project.title}</h4><p className="mt-1 text-sm text-slate-600">{project.description || "Chưa có mô tả."}</p></div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" title="Sửa dự án" onClick={() => editProject(project)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>
                    <button type="button" title="Xóa dự án" onClick={() => void deleteProject(project.id)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
                  {(project.startedAt || project.endedAt) && (
                    <span className="text-slate-500">
                      {project.startedAt
                        ? new Date(project.startedAt).toLocaleDateString("vi-VN")
                        : "?"}
                      {" - "}
                      {project.endedAt
                        ? new Date(project.endedAt).toLocaleDateString("vi-VN")
                        : "nay"}
                    </span>
                  )}
                  {project.repositoryUrl && <a href={project.repositoryUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600">Repository <ExternalLink className="h-3 w-3" /></a>}
                  {project.demoUrl && <a href={project.demoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600">Demo <ExternalLink className="h-3 w-3" /></a>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {profile && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="mb-4"><h3 className="text-lg font-extrabold text-slate-900">Kỹ năng</h3><p className="text-xs text-slate-500">Chọn kỹ năng và cấp độ thực tế của bạn.</p></div>
          <SkillPicker
            multiple
            selected={studentSkills.map((skill) => ({ id: skill.skillId, name: skill.name }))}
            onChange={(nextSkills: SkillOption[]) => setStudentSkills((current) => nextSkills.map((skill) => current.find((item) => item.skillId === skill.id) ?? { skillId: skill.id, name: skill.name, level: 'BEGINNER' }))}
            placeholder="Tìm và thêm kỹ năng..."
          />
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
            onRemove={() => void removeCv()}
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

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-slate-800">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 p-2.5"
      />
    </div>
  );
}
