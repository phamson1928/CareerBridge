import React, { FormEvent, useCallback, useEffect, useState } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  GraduationCap,
  LoaderCircle,
  Plus,
  Power,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { facultiesApi, majorsApi } from "../../organization/api";
import type {
  FacultyOption,
  FacultyRecord,
  MajorRecord,
} from "../../organization/types";
import { useAppFeedback } from "../Feedback/AppFeedbackProvider";

type SubTab = "FACULTIES" | "MAJORS";
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export const OrganizationManagement: React.FC = () => {
  const { confirm, notify } = useAppFeedback();
  const [subTab, setSubTab] = useState<SubTab>("FACULTIES");

  // Faculties state
  const [faculties, setFaculties] = useState<FacultyRecord[]>([]);
  const [facultyPage, setFacultyPage] = useState(1);
  const [facultyTotalPages, setFacultyTotalPages] = useState(1);
  const [facultyTotal, setFacultyTotal] = useState(0);
  const [facultySearch, setFacultySearch] = useState("");
  const [facultyStatus, setFacultyStatus] = useState<StatusFilter>("ALL");

  // Majors state
  const [majors, setMajors] = useState<MajorRecord[]>([]);
  const [majorPage, setMajorPage] = useState(1);
  const [majorTotalPages, setMajorTotalPages] = useState(1);
  const [majorTotal, setMajorTotal] = useState(0);
  const [majorSearch, setMajorSearch] = useState("");
  const [majorFacultyFilter, setMajorFacultyFilter] = useState("");
  const [majorStatus, setMajorStatus] = useState<StatusFilter>("ALL");

  // Faculty options for dropdown
  const [facultyOptions, setFacultyOptions] = useState<FacultyOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Faculty modal
  const [facultyModalOpen, setFacultyModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyRecord | null>(
    null,
  );
  const [facultyCode, setFacultyCode] = useState("");
  const [facultyName, setFacultyName] = useState("");
  const [facultyDescription, setFacultyDescription] = useState("");
  const [facultyIsActive, setFacultyIsActive] = useState(true);

  // Major modal
  const [majorModalOpen, setMajorModalOpen] = useState(false);
  const [editingMajor, setEditingMajor] = useState<MajorRecord | null>(null);
  const [majorFacultyId, setMajorFacultyId] = useState("");
  const [majorCode, setMajorCode] = useState("");
  const [majorName, setMajorName] = useState("");
  const [majorDescription, setMajorDescription] = useState("");
  const [majorIsActive, setMajorIsActive] = useState(true);

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadFacultyOptions = useCallback(async () => {
    try {
      const res = await facultiesApi.listOptions({ includeInactive: true });
      setFacultyOptions(res.items);
    } catch {
      // ignore
    }
  }, []);

  const loadFaculties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await facultiesApi.list({
        page: facultyPage,
        limit: 10,
        search: facultySearch.trim() || undefined,
        isActive:
          facultyStatus === "ALL" ? undefined : facultyStatus === "ACTIVE",
      });
      setFaculties(res.items);
      setFacultyTotal(res.pagination.total);
      setFacultyTotalPages(Math.max(res.pagination.totalPages, 1));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [facultyPage, facultySearch, facultyStatus]);

  const loadMajors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await majorsApi.list({
        page: majorPage,
        limit: 10,
        search: majorSearch.trim() || undefined,
        facultyId: majorFacultyFilter || undefined,
        isActive: majorStatus === "ALL" ? undefined : majorStatus === "ACTIVE",
      });
      setMajors(res.items);
      setMajorTotal(res.pagination.total);
      setMajorTotalPages(Math.max(res.pagination.totalPages, 1));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [majorPage, majorSearch, majorFacultyFilter, majorStatus]);

  useEffect(() => {
    void loadFacultyOptions();
  }, [loadFacultyOptions]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (subTab === "FACULTIES") {
        void loadFaculties();
      } else {
        void loadMajors();
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [subTab, loadFaculties, loadMajors]);

  // Faculty modal handlers
  const openCreateFaculty = () => {
    setEditingFaculty(null);
    setFacultyCode("");
    setFacultyName("");
    setFacultyDescription("");
    setFacultyIsActive(true);
    setFormError(null);
    setFacultyModalOpen(true);
  };

  const openEditFaculty = (item: FacultyRecord) => {
    setEditingFaculty(item);
    setFacultyCode(item.code);
    setFacultyName(item.name);
    setFacultyDescription(item.description ?? "");
    setFacultyIsActive(item.isActive);
    setFormError(null);
    setFacultyModalOpen(true);
  };

  const submitFaculty = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = facultyCode.trim().toUpperCase();
    const name = facultyName.trim();
    if (!code || !name) {
      setFormError("Vui lòng nhập đầy đủ mã khoa và tên khoa.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (editingFaculty) {
        await facultiesApi.update(editingFaculty.id, {
          code,
          name,
          description: facultyDescription.trim() || null,
          isActive: facultyIsActive,
        });
        notify({ title: "Đã cập nhật khoa", tone: "success" });
      } else {
        await facultiesApi.create({
          code,
          name,
          description: facultyDescription.trim() || undefined,
          isActive: facultyIsActive,
        });
        setFacultyPage(1);
        notify({ title: "Đã thêm khoa mới", tone: "success" });
      }
      setFacultyModalOpen(false);
      await Promise.all([loadFaculties(), loadFacultyOptions()]);
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleFacultyActive = async (item: FacultyRecord) => {
    const nextState = !item.isActive;
    const accepted = await confirm({
      title: nextState ? "Kích hoạt lại khoa" : "Ngừng sử dụng khoa",
      message: nextState
        ? `Kích hoạt lại "${item.name}" (${item.code})?`
        : `Ngừng sử dụng "${item.name}" (${item.code})? Hồ sơ sinh viên và giảng viên cũ thuộc khoa này vẫn được giữ nguyên lịch sử.`,
      confirmLabel: nextState ? "Kích hoạt" : "Ngừng sử dụng",
      tone: nextState ? "primary" : "danger",
    });
    if (!accepted) return;

    try {
      await facultiesApi.updateActive(item.id, nextState);
      notify({
        title: nextState ? "Đã kích hoạt khoa" : "Đã ngừng sử dụng khoa",
        tone: "success",
      });
      await Promise.all([loadFaculties(), loadFacultyOptions()]);
    } catch (err) {
      notify({
        title: "Không thể đổi trạng thái khoa",
        message: getApiErrorMessage(err),
        tone: "error",
      });
    }
  };

  const removeFaculty = async (item: FacultyRecord) => {
    const accepted = await confirm({
      title: "Xóa khoa",
      message: `Xóa khoa "${item.name}" (${item.code})? Chỉ xóa được khi khoa chưa có ngành hoặc giảng viên nào.`,
      confirmLabel: "Xóa khoa",
      tone: "danger",
    });
    if (!accepted) return;

    try {
      await facultiesApi.remove(item.id);
      notify({ title: "Đã xóa khoa", tone: "success" });
      await Promise.all([loadFaculties(), loadFacultyOptions()]);
    } catch (err) {
      notify({
        title: "Không thể xóa khoa",
        message: getApiErrorMessage(err),
        tone: "error",
      });
    }
  };

  // Major modal handlers
  const openCreateMajor = (defaultFacultyId?: string) => {
    setEditingMajor(null);
    const activeFaculties = facultyOptions.filter((f) => f.isActive);
    setMajorFacultyId(
      defaultFacultyId ||
        majorFacultyFilter ||
        activeFaculties[0]?.id ||
        facultyOptions[0]?.id ||
        "",
    );
    setMajorCode("");
    setMajorName("");
    setMajorDescription("");
    setMajorIsActive(true);
    setFormError(null);
    setMajorModalOpen(true);
  };

  const openEditMajor = (item: MajorRecord) => {
    setEditingMajor(item);
    setMajorFacultyId(item.facultyId);
    setMajorCode(item.code);
    setMajorName(item.name);
    setMajorDescription(item.description ?? "");
    setMajorIsActive(item.isActive);
    setFormError(null);
    setMajorModalOpen(true);
  };

  const submitMajor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = majorCode.trim().toUpperCase();
    const name = majorName.trim();
    if (!majorFacultyId || !code || !name) {
      setFormError("Vui lòng chọn khoa và nhập đầy đủ mã ngành, tên ngành.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (editingMajor) {
        await majorsApi.update(editingMajor.id, {
          facultyId: majorFacultyId,
          code,
          name,
          description: majorDescription.trim() || null,
          isActive: majorIsActive,
        });
        notify({ title: "Đã cập nhật ngành học", tone: "success" });
      } else {
        await majorsApi.create({
          facultyId: majorFacultyId,
          code,
          name,
          description: majorDescription.trim() || undefined,
          isActive: majorIsActive,
        });
        setMajorPage(1);
        notify({ title: "Đã thêm ngành học mới", tone: "success" });
      }
      setMajorModalOpen(false);
      await Promise.all([
        subTab === "MAJORS" ? loadMajors() : loadFaculties(),
        loadFacultyOptions(),
      ]);
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleMajorActive = async (item: MajorRecord) => {
    const nextState = !item.isActive;
    const accepted = await confirm({
      title: nextState ? "Kích hoạt lại ngành" : "Ngừng sử dụng ngành",
      message: nextState
        ? `Kích hoạt lại ngành "${item.name}" (${item.code})?`
        : `Ngừng sử dụng ngành "${item.name}" (${item.code})? Sinh viên và tin tuyển dụng cũ thuộc ngành này vẫn giữ nguyên lịch sử.`,
      confirmLabel: nextState ? "Kích hoạt" : "Ngừng sử dụng",
      tone: nextState ? "primary" : "danger",
    });
    if (!accepted) return;

    try {
      await majorsApi.updateActive(item.id, nextState);
      notify({
        title: nextState ? "Đã kích hoạt ngành" : "Đã ngừng sử dụng ngành",
        tone: "success",
      });
      await Promise.all([loadMajors(), loadFacultyOptions()]);
    } catch (err) {
      notify({
        title: "Không thể đổi trạng thái ngành",
        message: getApiErrorMessage(err),
        tone: "error",
      });
    }
  };

  const removeMajor = async (item: MajorRecord) => {
    const accepted = await confirm({
      title: "Xóa ngành học",
      message: `Xóa ngành "${item.name}" (${item.code})? Chỉ xóa được khi ngành chưa có sinh viên hoặc tin tuyển dụng nào.`,
      confirmLabel: "Xóa ngành",
      tone: "danger",
    });
    if (!accepted) return;

    try {
      await majorsApi.remove(item.id);
      notify({ title: "Đã xóa ngành học", tone: "success" });
      await Promise.all([loadMajors(), loadFacultyOptions()]);
    } catch (err) {
      notify({
        title: "Không thể xóa ngành",
        message: getApiErrorMessage(err),
        tone: "error",
      });
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Quản lý Khoa &amp; Ngành học toàn trường
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Chuẩn hóa danh mục Khoa và Ngành để đồng bộ hồ sơ sinh viên, giảng
            viên, tuyển dụng, phân công và báo cáo. Sử dụng trạng thái hoạt động
            để ngừng dùng khoa/ngành cũ mà không làm mất lịch sử.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreateFaculty}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            Thêm Khoa
          </button>
          <button
            type="button"
            onClick={() => openCreateMajor()}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Thêm Ngành
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setSubTab("FACULTIES")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              subTab === "FACULTIES"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Danh sách Khoa ({facultyOptions.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab("MAJORS")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              subTab === "MAJORS"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            Danh sách Ngành học
          </button>
        </div>

        {subTab === "FACULTIES" ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={facultySearch}
                onChange={(event) => {
                  setFacultySearch(event.target.value);
                  setFacultyPage(1);
                }}
                placeholder="Tìm mã hoặc tên khoa..."
                className="w-60 rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={facultyStatus}
              onChange={(event) => {
                setFacultyStatus(event.target.value as StatusFilter);
                setFacultyPage(1);
              }}
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Ngừng sử dụng</option>
            </select>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={majorSearch}
                onChange={(event) => {
                  setMajorSearch(event.target.value);
                  setMajorPage(1);
                }}
                placeholder="Tìm mã ngành, tên ngành..."
                className="w-60 rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={majorFacultyFilter}
              onChange={(event) => {
                setMajorFacultyFilter(event.target.value);
                setMajorPage(1);
              }}
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="">Tất cả các Khoa</option>
              {facultyOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  [{f.code}] {f.name}
                  {!f.isActive ? " (Ngừng dùng)" : ""}
                </option>
              ))}
            </select>
            <select
              value={majorStatus}
              onChange={(event) => {
                setMajorStatus(event.target.value as StatusFilter);
                setMajorPage(1);
              }}
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Ngừng sử dụng</option>
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-48 items-center justify-center text-sm text-slate-500">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
          Đang tải danh mục...
        </div>
      ) : subTab === "FACULTIES" ? (
        <>
          {faculties.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
              Chưa có khoa nào khớp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Mã khoa</th>
                    <th className="px-4 py-3">Tên khoa</th>
                    <th className="px-4 py-3">Ngành trực thuộc</th>
                    <th className="px-4 py-3 text-center">Giảng viên</th>
                    <th className="px-4 py-3 text-center">Sinh viên</th>
                    <th className="px-4 py-3 text-center">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {faculties.map((faculty) => (
                    <tr key={faculty.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-700">
                        {faculty.code}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">
                          {faculty.name}
                        </div>
                        {faculty.description && (
                          <div className="mt-0.5 text-xs text-slate-500">
                            {faculty.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {faculty.majors.map((m) => (
                            <span
                              key={m.id}
                              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                                m.isActive
                                  ? "border-slate-200 bg-slate-100 text-slate-700"
                                  : "border-amber-200 bg-amber-50 text-amber-700 line-through"
                              }`}
                              title={`${m.name} (${m.studentCount} SV)`}
                            >
                              {m.code}
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={() => openCreateMajor(faculty.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-dashed border-indigo-300 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50"
                          >
                            + Ngành
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">
                        {faculty.lecturerCount}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">
                        {faculty.studentCount}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                            faculty.isActive
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-300 bg-slate-100 text-slate-600"
                          }`}
                        >
                          {faculty.isActive ? "Đang hoạt động" : "Ngừng dùng"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEditFaculty(faculty)}
                          className="mr-1 rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"
                          title="Chỉnh sửa khoa"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleFacultyActive(faculty)}
                          className={`mr-1 rounded-lg p-2 ${
                            faculty.isActive
                              ? "text-amber-600 hover:bg-amber-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={
                            faculty.isActive
                              ? "Ngừng sử dụng khoa"
                              : "Kích hoạt lại khoa"
                          }
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeFaculty(faculty)}
                          disabled={
                            faculty.majorCount > 0 || faculty.lecturerCount > 0
                          }
                          className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30"
                          title={
                            faculty.majorCount > 0 || faculty.lecturerCount > 0
                              ? "Khoa đã có ngành/giảng viên — hãy dùng nút Ngừng sử dụng"
                              : "Xóa khoa"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {facultyTotal > 0 && (
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-600">
              <span>
                Tổng: <strong>{facultyTotal}</strong> khoa
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={facultyPage <= 1}
                  onClick={() => setFacultyPage((p) => p - 1)}
                  className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>
                  Trang {facultyPage}/{facultyTotalPages}
                </span>
                <button
                  disabled={facultyPage >= facultyTotalPages}
                  onClick={() => setFacultyPage((p) => p + 1)}
                  className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {majors.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
              Chưa có ngành học nào khớp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Mã ngành</th>
                    <th className="px-4 py-3">Tên ngành học</th>
                    <th className="px-4 py-3">Thuộc Khoa</th>
                    <th className="px-4 py-3 text-center">Sinh viên</th>
                    <th className="px-4 py-3 text-center">Tin tuyển dụng</th>
                    <th className="px-4 py-3 text-center">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {majors.map((major) => (
                    <tr key={major.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-700">
                        {major.code}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">
                          {major.name}
                        </div>
                        {major.description && (
                          <div className="mt-0.5 text-xs text-slate-500">
                            {major.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] font-bold text-slate-700">
                          {major.faculty.code}
                        </span>{" "}
                        {major.faculty.name}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">
                        {major.studentCount}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">
                        {major.internshipCount}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                            major.isActive
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-300 bg-slate-100 text-slate-600"
                          }`}
                        >
                          {major.isActive ? "Đang hoạt động" : "Ngừng dùng"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEditMajor(major)}
                          className="mr-1 rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"
                          title="Chỉnh sửa ngành"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleMajorActive(major)}
                          className={`mr-1 rounded-lg p-2 ${
                            major.isActive
                              ? "text-amber-600 hover:bg-amber-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={
                            major.isActive
                              ? "Ngừng sử dụng ngành"
                              : "Kích hoạt lại ngành"
                          }
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeMajor(major)}
                          disabled={
                            major.studentCount > 0 || major.internshipCount > 0
                          }
                          className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30"
                          title={
                            major.studentCount > 0 || major.internshipCount > 0
                              ? "Ngành đã có sinh viên/tin tuyển dụng — hãy dùng nút Ngừng sử dụng"
                              : "Xóa ngành"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {majorTotal > 0 && (
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-600">
              <span>
                Tổng: <strong>{majorTotal}</strong> ngành học
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={majorPage <= 1}
                  onClick={() => setMajorPage((p) => p - 1)}
                  className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>
                  Trang {majorPage}/{majorTotalPages}
                </span>
                <button
                  disabled={majorPage >= majorTotalPages}
                  onClick={() => setMajorPage((p) => p + 1)}
                  className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Faculty Modal */}
      {facultyModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => !saving && setFacultyModalOpen(false)}
        >
          <form
            onSubmit={(e) => void submitFaculty(e)}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {editingFaculty ? "Chỉnh sửa Khoa" : "Thêm Khoa mới"}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Quản lý thông tin khoa và trạng thái sử dụng toàn trường.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !saving && setFacultyModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-800">
                    Mã khoa *
                  </label>
                  <input
                    required
                    maxLength={20}
                    value={facultyCode}
                    onChange={(e) =>
                      setFacultyCode(e.target.value.toUpperCase())
                    }
                    placeholder="VD: CNTT"
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-mono text-sm uppercase outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-bold text-slate-800">
                    Tên khoa *
                  </label>
                  <input
                    required
                    maxLength={150}
                    value={facultyName}
                    onChange={(e) => setFacultyName(e.target.value)}
                    placeholder="VD: Khoa Công nghệ thông tin"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-800">
                  Mô tả
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={facultyDescription}
                  onChange={(e) => setFacultyDescription(e.target.value)}
                  placeholder="Ghi chú hoặc mô tả ngắn về khoa..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={facultyIsActive}
                  onChange={(e) => setFacultyIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
                Đang hoạt động (hiển thị trong danh sách chọn mới)
              </label>

              {formError && (
                <p className="text-xs font-semibold text-rose-600">
                  {formError}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setFacultyModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white"
              >
                {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {editingFaculty ? "Lưu thay đổi" : "Tạo Khoa"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Major Modal */}
      {majorModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => !saving && setMajorModalOpen(false)}
        >
          <form
            onSubmit={(e) => void submitMajor(e)}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {editingMajor ? "Chỉnh sửa Ngành học" : "Thêm Ngành học mới"}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Mỗi ngành học trực thuộc một Khoa quản lý.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !saving && setMajorModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-800">
                  Thuộc Khoa *
                </label>
                <select
                  required
                  value={majorFacultyId}
                  onChange={(e) => setMajorFacultyId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="">-- Chọn Khoa --</option>
                  {facultyOptions.map((f) => (
                    <option key={f.id} value={f.id}>
                      [{f.code}] {f.name}
                      {!f.isActive ? " (Ngừng sử dụng)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-800">
                    Mã ngành *
                  </label>
                  <input
                    required
                    maxLength={20}
                    value={majorCode}
                    onChange={(e) => setMajorCode(e.target.value.toUpperCase())}
                    placeholder="VD: KTPM"
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-mono text-sm uppercase outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-bold text-slate-800">
                    Tên ngành học *
                  </label>
                  <input
                    required
                    maxLength={150}
                    value={majorName}
                    onChange={(e) => setMajorName(e.target.value)}
                    placeholder="VD: Kỹ thuật phần mềm"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-800">
                  Mô tả
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={majorDescription}
                  onChange={(e) => setMajorDescription(e.target.value)}
                  placeholder="Ghi chú về chuyên ngành..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={majorIsActive}
                  onChange={(e) => setMajorIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
                Đang hoạt động (hiển thị trong danh sách chọn mới)
              </label>

              {formError && (
                <p className="text-xs font-semibold text-rose-600">
                  {formError}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setMajorModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white"
              >
                {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {editingMajor ? "Lưu thay đổi" : "Tạo Ngành"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};
