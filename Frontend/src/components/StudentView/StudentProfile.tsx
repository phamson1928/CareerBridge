import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Check,
  ChevronDown,
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
import { facultiesApi } from "../../organization/api";
import type { FacultyOption } from "../../organization/types";
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
import type { SkillLevel, StudentSkillRecord } from "../../skills/types";
import { SkillPicker, type SkillOption } from "../Skills/SkillPicker";
import {
  ProfileAvatarPreview,
  ProfileAvatarUpload,
} from "../ProfileAvatarUpload";
import { StudentProfileSkeleton } from "./skeletons";

const emptyForm: StudentProfileInput = {
  studentCode: "",
  fullName: "",
  majorId: "",
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
  const [facultyOptions, setFacultyOptions] = useState<FacultyOption[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [studentSkills, setStudentSkills] = useState<StudentSkillRecord[]>([]);
  const [savingSkills, setSavingSkills] = useState(false);
  const [projects, setProjects] = useState<StudentProjectRecord[]>([]);
  const [projectForm, setProjectForm] =
    useState<StudentProjectInput>(emptyProject);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [savingProject, setSavingProject] = useState(false);

  const applyProfile = (
    nextProfile: StudentProfileRecord,
    nextSkills = studentSkills,
    faculties = facultyOptions,
  ) => {
    setProfile(nextProfile);
    setProjects(nextProfile.projects ?? []);

    let resolvedMajorId = nextProfile.majorId ?? nextProfile.majorRef?.id ?? "";
    let resolvedFacultyId =
      nextProfile.majorRef?.facultyId ?? nextProfile.faculty?.id ?? "";

    if (!resolvedMajorId && nextProfile.major && faculties.length > 0) {
      for (const fac of faculties) {
        const match = fac.majors.find(
          (m) =>
            m.name.toLowerCase() === nextProfile.major.toLowerCase() ||
            m.code.toLowerCase() === nextProfile.major.toLowerCase(),
        );
        if (match) {
          resolvedMajorId = match.id;
          resolvedFacultyId = fac.id;
          break;
        }
      }
    }

    if (!resolvedFacultyId && resolvedMajorId && faculties.length > 0) {
      const parentFac = faculties.find((f) =>
        f.majors.some((m) => m.id === resolvedMajorId),
      );
      if (parentFac) resolvedFacultyId = parentFac.id;
    }

    setSelectedFacultyId(resolvedFacultyId);
    setForm({
      studentCode: nextProfile.studentCode,
      fullName: nextProfile.fullName,
      majorId: resolvedMajorId,
      major: nextProfile.major,
      phone: nextProfile.phone ?? "",
      summary: nextProfile.summary ?? "",
      gpa: nextProfile.gpa,
      cvFileId: nextProfile.cvFileId,
      avatarFileId: nextProfile.avatarFileId,
    });
    onProfileChange?.(nextProfile, nextSkills);
  };

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      const [profileResult, skillsResult, optionsResult] =
        await Promise.allSettled([
          studentsApi.getMine(),
          skillsApi.getStudentMine(),
          facultiesApi.listOptions({ includeInactive: true }),
        ]);

      if (!active) return;

      const loadedFaculties =
        optionsResult.status === "fulfilled" ? optionsResult.value.items : [];
      setFacultyOptions(loadedFaculties);

      if (profileResult.status === "fulfilled") {
        const loadedSkills =
          skillsResult.status === "fulfilled" ? skillsResult.value : [];
        setStudentSkills(loadedSkills);
        applyProfile(profileResult.value, loadedSkills, loadedFaculties);
      } else if (
        axios.isAxiosError(profileResult.reason) &&
        profileResult.reason.response?.status === 404
      ) {
        const firstActiveFaculty = loadedFaculties.find(
          (f) => f.isActive && f.majors.some((m) => m.isActive),
        );
        if (firstActiveFaculty) {
          setSelectedFacultyId(firstActiveFaculty.id);
          const firstMajor = firstActiveFaculty.majors.find((m) => m.isActive);
          if (firstMajor) {
            setForm((prev) => ({
              ...prev,
              majorId: firstMajor.id,
              major: firstMajor.name,
            }));
          }
        }
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

  const selectableFaculties = useMemo(() => {
    const currentFacId =
      profile?.majorRef?.facultyId ?? profile?.faculty?.id ?? selectedFacultyId;
    return facultyOptions.filter(
      (f) =>
        (f.isActive && f.majors.some((m) => m.isActive)) ||
        f.id === currentFacId,
    );
  }, [facultyOptions, profile, selectedFacultyId]);

  const selectableMajors = useMemo(() => {
    const targetFaculty = facultyOptions.find(
      (f) => f.id === selectedFacultyId,
    );
    const currentMajorId = profile?.majorId ?? profile?.majorRef?.id;
    if (targetFaculty) {
      return targetFaculty.majors.filter(
        (m) => m.isActive || m.id === currentMajorId,
      );
    }
    return facultyOptions
      .flatMap((f) => f.majors)
      .filter((m) => (m.isActive && facultyOptions.find((f) => f.id === m.facultyId)?.isActive) || m.id === currentMajorId);
  }, [facultyOptions, selectedFacultyId, profile]);

  const handleFacultyChange = (nextFacultyId: string) => {
    setSelectedFacultyId(nextFacultyId);
    const fac = facultyOptions.find((f) => f.id === nextFacultyId);
    const activeMajors = fac?.majors.filter((m) => m.isActive) ?? [];
    if (
      activeMajors.length > 0 &&
      !activeMajors.some((m) => m.id === form.majorId)
    ) {
      setForm((prev) => ({
        ...prev,
        majorId: activeMajors[0].id,
        major: activeMajors[0].name,
      }));
    } else if (!nextFacultyId) {
      setForm((prev) => ({ ...prev, majorId: "" }));
    }
  };

  const handleMajorChange = (nextMajorId: string) => {
    const foundMajor = facultyOptions
      .flatMap((f) => f.majors)
      .find((m) => m.id === nextMajorId);
    if (foundMajor && foundMajor.facultyId !== selectedFacultyId) {
      setSelectedFacultyId(foundMajor.facultyId);
    }
    setForm((prev) => ({
      ...prev,
      majorId: nextMajorId,
      major: foundMajor?.name ?? prev.major,
    }));
  };

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
    if (!form.majorId && !form.major?.trim()) {
      setError("Vui lòng chọn ngành học của bạn.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const payload: StudentProfileInput = {
        studentCode: form.studentCode,
        fullName: form.fullName,
        ...(form.majorId
          ? { majorId: form.majorId }
          : { major: form.major?.trim() }),
        phone: form.phone?.trim() || null,
        summary: form.summary?.trim() || null,
        gpa:
          form.gpa === null || Number.isNaN(form.gpa) ? null : Number(form.gpa),
        cvFileId: form.cvFileId,
        avatarFileId: form.avatarFileId,
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
    const accepted = await confirm({
      title: "Xóa hồ sơ sinh viên",
      message: "Xóa hồ sơ sinh viên? Thao tác này không thể hoàn tác.",
      confirmLabel: "Xóa hồ sơ",
      tone: "danger",
    });
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
          ? current.map((project) =>
              project.id === saved.id ? saved : project,
            )
          : [saved, ...current],
      );
      const nextProjects = editingProjectId
        ? projects.map((project) =>
            project.id === saved.id ? saved : project,
          )
        : [saved, ...projects];
      if (profile) {
        onProfileChange?.(
          { ...profile, projects: nextProjects },
          studentSkills,
        );
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
      const nextProjects = projects.filter(
        (project) => project.id !== projectId,
      );
      setProjects(nextProjects);
      if (profile) {
        onProfileChange?.(
          { ...profile, projects: nextProjects },
          studentSkills,
        );
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
    return <StudentProfileSkeleton />;
  }

  const facultyDisplay = profile?.majorRef?.faculty
    ? `[${profile.majorRef.faculty.code}] ${profile.majorRef.faculty.name}`
    : profile?.faculty
      ? `[${profile.faculty.code}] ${profile.faculty.name}`
      : "Chưa gán khoa";

  const majorDisplay = profile?.majorRef
    ? `[${profile.majorRef.code}] ${profile.majorRef.name}${
        !profile.majorRef.isActive ? " (Ngành cũ)" : ""
      }`
    : profile?.major || "Chưa cập nhật";

  return (
    <div className="space-y-6 w-full">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="student-profile-cover flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left gap-4 border-b border-slate-100 pb-6">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left gap-4">
            <ProfileAvatarPreview
              fileId={profile?.avatarFileId}
              fallback={profile?.fullName.charAt(0) || "S"}
              className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-tr from-[#008b8f] to-emerald-500 text-xl font-black text-white shadow-md shadow-teal-900/20 shrink-0"
              imageClassName="h-full w-full object-cover"
            />
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                {profile?.fullName || "Hoàn thiện hồ sơ sinh viên"}
              </h2>
              <p className="mt-1 flex items-center justify-center sm:justify-start gap-1 text-xs font-semibold text-teal-600">
                <GraduationCap className="h-4 w-4 shrink-0" />
                <span>
                  {profile
                    ? `${majorDisplay} · ${facultyDisplay}`
                    : "Thông tin hồ sơ được lưu trực tiếp trên hệ thống."}
                </span>
              </p>
            </div>
          </div>
          {profile && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-800 transition cursor-pointer shadow-2xs self-center sm:self-auto shrink-0"
            >
              <Edit3 className="h-4 w-4 text-teal-600" />
              Chỉnh sửa hồ sơ
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

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
            <ProfileAvatarUpload
              fileId={form.avatarFileId}
              fallback={form.fullName.charAt(0) || "S"}
              disabled={isSaving}
              onChange={(avatarFileId) => setForm({ ...form, avatarFileId })}
              onError={setError}
            />
            <Field
              label="Họ và tên"
              required
              value={form.fullName}
              onChange={(value) => setForm({ ...form, fullName: value })}
            />
            <Field
              label="Số điện thoại"
              value={form.phone ?? ""}
              onChange={(value) => setForm({ ...form, phone: value })}
            />

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-800">
                Khoa *
              </label>
              <select
                value={selectedFacultyId}
                onChange={(event) => handleFacultyChange(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm"
              >
                <option value="">-- Tất cả các Khoa --</option>
                {selectableFaculties.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    [{fac.code}] {fac.name}
                    {!fac.isActive ? " (Ngừng sử dụng)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-800">
                Ngành học *
              </label>
              <select
                required
                value={form.majorId ?? ""}
                onChange={(event) => handleMajorChange(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm"
              >
                <option value="">-- Chọn ngành học --</option>
                {selectableMajors.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.code}] {m.name}
                    {!m.isActive ? " (Ngành cũ)" : ""}
                  </option>
                ))}
              </select>
            </div>

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
            <div className="flex gap-2.5 md:col-span-2 pt-2">
              <button
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#00a3a6] to-[#006d72] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all"
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
                  className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-2xs"
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
              <Info label="Khoa" value={facultyDisplay} />
              <Info label="Ngành học" value={majorDisplay} />
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
          <div className="mb-5 flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Dự án cá nhân
              </h3>
              <p className="text-xs text-slate-500">
                Giới thiệu các sản phẩm và dự án nổi bật.
              </p>
            </div>
            {!showProjectForm && (
              <button
                type="button"
                onClick={() => {
                  setProjectForm(emptyProject);
                  setShowProjectForm(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-3.5 py-2 text-xs font-bold text-white transition self-center sm:self-auto cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Thêm dự án
              </button>
            )}
          </div>
          {showProjectForm && (
            <form
              onSubmit={(event) => void saveProject(event)}
              className="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 md:grid-cols-2"
            >
              <Field
                label="Tên dự án"
                required
                value={projectForm.title}
                onChange={(value) =>
                  setProjectForm({ ...projectForm, title: value })
                }
              />
              <Field
                label="Link repository"
                value={projectForm.repositoryUrl ?? ""}
                onChange={(value) =>
                  setProjectForm({ ...projectForm, repositoryUrl: value })
                }
              />
              <Field
                label="Link demo"
                value={projectForm.demoUrl ?? ""}
                onChange={(value) =>
                  setProjectForm({ ...projectForm, demoUrl: value })
                }
              />
              <div className="grid grid-cols-2 gap-2">
                <DateField
                  label="Bắt đầu"
                  value={projectForm.startedAt ?? ""}
                  onChange={(value) =>
                    setProjectForm({ ...projectForm, startedAt: value || null })
                  }
                />
                <DateField
                  label="Kết thúc"
                  value={projectForm.endedAt ?? ""}
                  onChange={(value) =>
                    setProjectForm({ ...projectForm, endedAt: value || null })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-bold text-slate-800">
                  Mô tả
                </label>
                <textarea
                  rows={3}
                  value={projectForm.description ?? ""}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      description: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                />
              </div>
              <div className="flex gap-2 md:col-span-2">
                <button
                  disabled={savingProject}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {editingProjectId ? "Lưu dự án" : "Thêm dự án"}
                </button>
                {showProjectForm && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProjectId(null);
                      setShowProjectForm(false);
                      setProjectForm(emptyProject);
                    }}
                    className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
          )}
          <div className="space-y-3">
            {projects.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                Chưa có dự án nào.
              </p>
            )}
            {projects.map((project) => (
              <article
                key={project.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900">
                      {project.title}
                    </h4>
                    <p className="mt-1 text-sm text-slate-600">
                      {project.description || "Chưa có mô tả."}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      title="Sửa dự án"
                      onClick={() => editProject(project)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Xóa dự án"
                      onClick={() => void deleteProject(project.id)}
                      className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
                  {(project.startedAt || project.endedAt) && (
                    <span className="text-slate-500">
                      {project.startedAt
                        ? new Date(project.startedAt).toLocaleDateString(
                            "vi-VN",
                          )
                        : "?"}
                      {" - "}
                      {project.endedAt
                        ? new Date(project.endedAt).toLocaleDateString("vi-VN")
                        : "nay"}
                    </span>
                  )}
                  {project.repositoryUrl && (
                    <a
                      href={project.repositoryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600"
                    >
                      Repository <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {project.demoUrl && (
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600"
                    >
                      Demo <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {profile && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <div className="mb-4 text-center sm:text-left">
            <h3 className="text-lg font-extrabold text-slate-900">Kỹ năng</h3>
            <p className="text-xs text-slate-500">
              Chọn kỹ năng và cấp độ thực tế của bạn.
            </p>
          </div>
          <SkillPicker
            multiple
            selected={studentSkills.map((skill) => ({
              id: skill.skillId,
              name: skill.name,
            }))}
            onChange={(nextSkills: SkillOption[]) =>
              setStudentSkills((current) =>
                nextSkills.map(
                  (skill) =>
                    current.find((item) => item.skillId === skill.id) ?? {
                      skillId: skill.id,
                      name: skill.name,
                      level: "BEGINNER",
                    },
                ),
              )
            }
            placeholder="Tìm và thêm kỹ năng..."
          />
          <div className="mt-4 space-y-2">
            {studentSkills.map((item) => (
              <div
                key={item.skillId}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
              >
                <span className="text-sm font-semibold">{item.name}</span>
                <SkillLevelDropdown
                  value={item.level}
                  onChange={(level) =>
                    setStudentSkills((prev) =>
                      prev.map((current) =>
                        current.skillId === item.skillId
                          ? { ...current, level }
                          : current,
                      ),
                    )
                  }
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center sm:justify-start">
            <button
              onClick={() => void saveSkills()}
              disabled={savingSkills}
              className="rounded-xl bg-teal-700 hover:bg-teal-800 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer"
            >
              {savingSkills ? "Đang lưu..." : "Lưu kỹ năng"}
            </button>
          </div>
        </section>
      )}

      {profile && (
        <section className="rounded-2xl border border-teal-200/80 bg-teal-50/40 p-5 sm:p-6">
          <div className="mb-4 flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left gap-3">
            <div className="rounded-xl bg-teal-700 p-2.5 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">CV của bạn</h3>
              <p className="text-xs text-teal-800">
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
            <p className="mt-2 text-xs text-slate-500 text-center sm:text-left">
              Đang lưu liên kết CV...
            </p>
          )}
        </section>
      )}

      {profile && (
        <div className="flex justify-center sm:justify-start pt-2">
          <button
            onClick={() => void deleteProfile()}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            Xóa hồ sơ
          </button>
        </div>
      )}
    </div>
  );
};

const SKILL_LEVEL_OPTIONS: Array<{
  value: SkillLevel;
  label: string;
  dotColor: string;
}> = [
  { value: "BEGINNER", label: "Beginner", dotColor: "bg-sky-500" },
  { value: "INTERMEDIATE", label: "Intermediate", dotColor: "bg-teal-500" },
  { value: "ADVANCED", label: "Advanced", dotColor: "bg-indigo-500" },
  { value: "EXPERT", label: "Expert", dotColor: "bg-emerald-500" },
];

function SkillLevelDropdown({
  value,
  onChange,
}: {
  value: SkillLevel;
  onChange: (level: SkillLevel) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    SKILL_LEVEL_OPTIONS.find((opt) => opt.value === value) ??
    SKILL_LEVEL_OPTIONS[0];

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleDocumentClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center justify-between gap-2.5 rounded-full border border-teal-200/90 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:border-teal-400 hover:bg-teal-50/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20 active:scale-95 transition-all cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${selectedOption.dotColor}`} />
          {selectedOption.label}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-teal-600" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-40 w-44 origin-top-right rounded-2xl border border-slate-200 !bg-white p-1.5 shadow-2xl shadow-slate-900/15 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
            Trình độ kỹ năng
          </div>
          {SKILL_LEVEL_OPTIONS.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between !rounded-xl !border-0 px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? "!bg-teal-50 text-teal-900 font-bold"
                    : "text-slate-600 hover:!bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${opt.dotColor}`} />
                  <span>{opt.label}</span>
                </span>
                {isSelected && (
                  <Check className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
      <label className="mb-1 block text-xs font-bold text-slate-800">
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 p-2.5"
      />
    </div>
  );
}
