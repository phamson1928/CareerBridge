import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  LoaderCircle,
  Pencil,
  Search,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { placementsApi } from "../../placements/api";
import type {
  PlacementRecord,
  PlacementStatus,
  ReportStatus,
} from "../../placements/types";
import { semestersApi } from "../../semesters/api";
import type { SemesterRecord } from "../../semesters/types";
import { supervisionsApi } from "../../supervisions/api";
import type { LecturerOption } from "../../supervisions/types";

const statusLabel: Record<PlacementStatus, string> = {
  PENDING: "Chờ phân công",
  ACTIVE: "Đang thực tập",
  COMPLETED: "Đã hoàn tất",
  CANCELLED: "Đã hủy",
};
const statusClass: Record<PlacementStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  COMPLETED: "border-slate-200 bg-slate-100 text-slate-700",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
};
const reportLabel: Record<ReportStatus, string> = {
  DRAFT: "Nháp",
  SUBMITTED: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Cần chỉnh sửa",
};
const date = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const formatDate = (value: string | null) =>
  value ? date.format(new Date(value)) : "Chưa cập nhật";
const isoDay = (value: string | null) => (value ? value.slice(0, 10) : "");

export const PlacementManagement: React.FC<{
  onOpenAssignment?: () => void;
}> = ({ onOpenAssignment }) => {
  const [items, setItems] = useState<PlacementRecord[]>([]);
  const [semesters, setSemesters] = useState<SemesterRecord[]>([]);
  const [lecturers, setLecturers] = useState<LecturerOption[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PlacementStatus | "">("");
  const [semesterId, setSemesterId] = useState("");
  const [lecturerId, setLecturerId] = useState("");
  const [assignmentStatus, setAssignmentStatus] = useState<
    "" | "ASSIGNED" | "UNASSIGNED"
  >("");
  const [reportStatus, setReportStatus] = useState<ReportStatus | "">("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PlacementRecord | null>(null);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [action, setAction] = useState<"COMPLETED" | "CANCELLED" | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [placementPage, semesterPage, lecturerOptions] = await Promise.all([
        placementsApi.list({
          page,
          limit: 10,
          search: search.trim() || undefined,
          status: status || undefined,
          semesterId: semesterId || undefined,
          lecturerId: lecturerId || undefined,
          assignmentStatus: assignmentStatus || undefined,
          reportStatus: reportStatus || undefined,
        }),
        semestersApi.list({ page: 1, limit: 100 }),
        supervisionsApi.lecturerOptions(),
      ]);
      setItems(placementPage.items);
      setTotal(placementPage.pagination.total);
      setTotalPages(Math.max(placementPage.pagination.totalPages, 1));
      setSemesters(semesterPage.items);
      setLecturers(lecturerOptions);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [
    assignmentStatus,
    lecturerId,
    page,
    reportStatus,
    search,
    semesterId,
    status,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 220);
    return () => window.clearTimeout(timer);
  }, [load]);
  const metrics = useMemo(
    () => ({
      pending: items.filter((item) => item.status === "PENDING").length,
      active: items.filter((item) => item.status === "ACTIVE").length,
      completed: items.filter((item) => item.status === "COMPLETED").length,
      cancelled: items.filter((item) => item.status === "CANCELLED").length,
    }),
    [items],
  );
  const openDetail = async (placement: PlacementRecord) => {
    setSelected(placement);
    setEditingSchedule(false);
    setAction(null);
    setNote("");
    try {
      setSelected(await placementsApi.findById(placement.id));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };
  const closeDetail = () => {
    if (!saving) {
      setSelected(null);
      setEditingSchedule(false);
      setAction(null);
    }
  };
  const startScheduleEdit = () => {
    if (!selected) return;
    setStartDate(isoDay(selected.startDate));
    setEndDate(isoDay(selected.endDate));
    setEditingSchedule(true);
  };
  const saveSchedule = async () => {
    if (!selected) return;
    if (!startDate && !endDate) {
      setError("Hãy nhập ít nhất một mốc thời gian.");
      return;
    }
    if (startDate && endDate && startDate >= endDate) {
      setError("Ngày bắt đầu phải trước ngày kết thúc.");
      return;
    }
    const min = isoDay(selected.semester.startDate);
    const max = isoDay(selected.semester.endDate);
    if (
      (startDate && (startDate < min || startDate > max)) ||
      (endDate && (endDate < min || endDate > max))
    ) {
      setError(
        `Lịch phải nằm trong kỳ ${formatDate(selected.semester.startDate)} – ${formatDate(selected.semester.endDate)}.`,
      );
      return;
    }
    setSaving(true);
    try {
      const updated = await placementsApi.update(selected.id, {
        startDate: startDate
          ? new Date(`${startDate}T00:00:00.000Z`).toISOString()
          : undefined,
        endDate: endDate
          ? new Date(`${endDate}T00:00:00.000Z`).toISOString()
          : undefined,
      });
      setSelected(updated);
      setEditingSchedule(false);
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };
  const submitStatus = async () => {
    if (!selected || !action) return;
    if (action === "CANCELLED" && !note.trim()) {
      setError("Cần nhập lý do hủy placement.");
      return;
    }
    setSaving(true);
    try {
      const updated = await placementsApi.updateStatus(
        selected.id,
        action,
        note.trim() || undefined,
      );
      setSelected(updated);
      setAction(null);
      setNote("");
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };
  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setSemesterId("");
    setLecturerId("");
    setAssignmentStatus("");
    setReportStatus("");
    setPage(1);
  };

  return (
    <section className="space-y-5">
      <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-100">
              <BriefcaseBusiness className="h-3.5 w-3.5" /> Placement operations
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight">
              Quản lý placement
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100/80">
              Theo dõi lịch thực tập, tiến độ báo cáo và lifecycle của từng
              placement.
            </p>
          </div>
          <button
            onClick={onOpenAssignment}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
          >
            <UsersRound className="h-4 w-4" /> Mở phân công giảng viên{" "}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          {
            label: "Tổng placement",
            value: total,
            tone: "bg-indigo-50 text-indigo-700",
          },
          {
            label: "Chờ phân công",
            value: metrics.pending,
            tone: "bg-amber-50 text-amber-700",
          },
          {
            label: "Đang thực tập",
            value: metrics.active,
            tone: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Hoàn tất",
            value: metrics.completed,
            tone: "bg-slate-100 text-slate-700",
          },
          {
            label: "Đã hủy",
            value: metrics.cancelled,
            tone: "bg-rose-50 text-rose-700",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
          >
            <span
              className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-bold ${item.tone}`}
            >
              {item.label}
            </span>
            <p className="mt-3 text-2xl font-black text-slate-950">
              {item.value}
            </p>
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative xl:col-span-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm sinh viên, mã số, công ty hoặc vị trí..."
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <select
            value={semesterId}
            onChange={(event) => {
              setSemesterId(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">Tất cả kỳ thực tập</option>
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as PlacementStatus | "");
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusLabel).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={lecturerId}
            onChange={(event) => {
              setLecturerId(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">Tất cả giảng viên</option>
            {lecturers.map((lecturer) => (
              <option key={lecturer.id} value={lecturer.id}>
                {lecturer.fullName}
              </option>
            ))}
          </select>
          <select
            value={assignmentStatus}
            onChange={(event) => {
              setAssignmentStatus(
                event.target.value as typeof assignmentStatus,
              );
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">Mọi trạng thái phân công</option>
            <option value="ASSIGNED">Đã phân công</option>
            <option value="UNASSIGNED">Chưa phân công</option>
          </select>
          <select
            value={reportStatus}
            onChange={(event) => {
              setReportStatus(event.target.value as ReportStatus | "");
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">Mọi trạng thái báo cáo</option>
            {Object.entries(reportLabel).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <button
            onClick={resetFilters}
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="flex min-h-72 items-center justify-center text-sm text-slate-500">
            <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
            Đang tải placement...
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <BriefcaseBusiness className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-800">
              Không có placement phù hợp
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Thử điều chỉnh bộ lọc hoặc chờ ứng viên được chấp nhận.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1160px] w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500">
                  <th className="px-5 py-3 font-bold">Sinh viên</th>
                  <th className="px-5 py-3 font-bold">Vị trí / doanh nghiệp</th>
                  <th className="px-5 py-3 font-bold">Lịch thực tế</th>
                  <th className="px-5 py-3 font-bold">Hướng dẫn</th>
                  <th className="px-5 py-3 font-bold">Tiến độ</th>
                  <th className="px-5 py-3 font-bold">Trạng thái</th>
                  <th className="px-5 py-3 text-right font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((placement) => (
                  <tr
                    key={placement.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">
                        {placement.student.fullName}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-slate-500">
                        {placement.student.studentCode} ·{" "}
                        {placement.student.major}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">
                        {placement.internship.title}
                      </p>
                      <p className="mt-1 text-slate-500">
                        {placement.company.companyName}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-700">
                        {placement.semester.name}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {formatDate(placement.startDate)} —{" "}
                        {formatDate(placement.endDate)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      {placement.supervision?.status === "ACTIVE" ? (
                        <>
                          <p className="font-bold text-slate-800">
                            {placement.supervision.lecturer.fullName}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-500">
                            {placement.supervision.lecturer.department}
                          </p>
                        </>
                      ) : (
                        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                          Chưa phân công
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                          <FileText className="h-3 w-3" />{" "}
                          {placement.progress.reportCount}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                          <CheckCircle2 className="h-3 w-3" />{" "}
                          {placement.progress.evaluationCount}
                        </span>
                        {placement.progress.reportsAwaitingReview > 0 && (
                          <span className="rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">
                            {placement.progress.reportsAwaitingReview} chờ duyệt
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass[placement.status]}`}
                      >
                        {statusLabel[placement.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => void openDetail(placement)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-[11px] font-bold text-slate-700 transition hover:bg-slate-100"
                      >
                        <Eye className="h-3.5 w-3.5" /> Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-500">
              {total} placement · Trang {page}/{totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
                className="rounded-lg border border-slate-200 p-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
                className="rounded-lg border border-slate-200 p-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      {selected && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <aside className="h-full w-full overflow-y-auto bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 p-5 backdrop-blur sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                    Placement detail
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    {selected.student.fullName}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {selected.student.studentCode} · {selected.internship.title}
                  </p>
                </div>
                <button
                  onClick={closeDetail}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="space-y-5 p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Doanh nghiệp
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-900">
                    {selected.company.companyName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selected.internship.location ?? "Chưa cập nhật địa điểm"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Giảng viên hướng dẫn
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-900">
                    {selected.supervision?.lecturer.fullName ??
                      "Chưa phân công"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selected.supervision?.lecturer.department ??
                      "Mở trang phân công để chỉ định"}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-900">
                      Lịch thực tập thực tế
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Giới hạn kỳ: {formatDate(selected.semester.startDate)} —{" "}
                      {formatDate(selected.semester.endDate)}
                    </p>
                  </div>
                  {selected.status === "PENDING" ||
                  selected.status === "ACTIVE" ? (
                    <button
                      onClick={startScheduleEdit}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Chỉnh lịch
                    </button>
                  ) : null}
                </div>
                {editingSchedule ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-bold text-slate-600">
                      Bắt đầu
                      <input
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                        min={isoDay(selected.semester.startDate)}
                        max={isoDay(selected.semester.endDate)}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500"
                      />
                    </label>
                    <label className="text-xs font-bold text-slate-600">
                      Kết thúc
                      <input
                        type="date"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        min={isoDay(selected.semester.startDate)}
                        max={isoDay(selected.semester.endDate)}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500"
                      />
                    </label>
                    <div className="sm:col-span-2 flex justify-end gap-2">
                      <button
                        disabled={saving}
                        onClick={() => setEditingSchedule(false)}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600"
                      >
                        Hủy
                      </button>
                      <button
                        disabled={saving}
                        onClick={() => void saveSchedule()}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                      >
                        {saving && (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        )}
                        Lưu lịch
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <CalendarDays className="h-4 w-4 text-indigo-600" />{" "}
                    {formatDate(selected.startDate)}{" "}
                    <span className="text-slate-400">→</span>{" "}
                    {formatDate(selected.endDate)}
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-black text-slate-900">Tiến độ</p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase text-slate-500">
                      Báo cáo
                    </p>
                    <p className="mt-1 text-xl font-black">
                      {selected.progress.reportCount}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase text-slate-500">
                      Chờ duyệt
                    </p>
                    <p className="mt-1 text-xl font-black text-rose-600">
                      {selected.progress.reportsAwaitingReview}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase text-slate-500">
                      Đã duyệt
                    </p>
                    <p className="mt-1 text-xl font-black text-emerald-600">
                      {selected.progress.approvedReports ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase text-slate-500">
                      Đánh giá
                    </p>
                    <p className="mt-1 text-xl font-black">
                      {selected.progress.evaluationCount}
                    </p>
                  </div>
                </div>
                {selected.progress.lastReportAt && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock3 className="h-3.5 w-3.5" /> Báo cáo gần nhất:{" "}
                    {formatDate(selected.progress.lastReportAt)}
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-black text-slate-900">Lifecycle</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selected.status === "ACTIVE" && (
                    <button
                      onClick={() => {
                        setAction("COMPLETED");
                        setNote("");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Hoàn tất placement
                    </button>
                  )}
                  {(selected.status === "PENDING" ||
                    selected.status === "ACTIVE") && (
                    <button
                      onClick={() => {
                        setAction("CANCELLED");
                        setNote("");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                    >
                      <XCircle className="h-4 w-4" /> Hủy placement
                    </button>
                  )}
                  {(selected.status === "COMPLETED" ||
                    selected.status === "CANCELLED") && (
                    <p className="text-xs text-slate-500">
                      Placement đã ở trạng thái cuối, chỉ có thể xem lịch sử.
                    </p>
                  )}
                </div>
              </div>
              {action && (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                  <p className="text-sm font-black text-indigo-950">
                    {action === "COMPLETED"
                      ? "Xác nhận hoàn tất placement"
                      : "Xác nhận hủy placement"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-indigo-800">
                    {action === "COMPLETED"
                      ? "Supervision đang hoạt động cũng sẽ được hoàn tất. Các báo cáo đã gửi phải được review trước."
                      : "Lịch sử application, report và evaluation vẫn được giữ. Slot internship sẽ được trả lại."}
                  </p>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={500}
                    placeholder={
                      action === "CANCELLED"
                        ? "Lý do hủy (bắt buộc)..."
                        : "Ghi chú kết thúc (không bắt buộc)..."
                    }
                    className="mt-3 min-h-24 w-full rounded-xl border border-indigo-200 bg-white p-3 text-sm outline-none focus:border-indigo-500"
                  />
                  <div className="mt-1 text-right text-[10px] text-slate-500">
                    {note.length}/500
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      disabled={saving}
                      onClick={() => setAction(null)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-600"
                    >
                      Quay lại
                    </button>
                    <button
                      disabled={
                        saving || (action === "CANCELLED" && !note.trim())
                      }
                      onClick={() => void submitStatus()}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white disabled:opacity-50 ${action === "COMPLETED" ? "bg-emerald-600" : "bg-rose-600"}`}
                    >
                      {saving && (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      )}
                      Xác nhận
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
};
