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
import { ProfileAvatarPreview } from "../ProfileAvatarUpload";
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
const formatDateTime = (value: string | null, fallback = "Chưa cập nhật") =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : fallback;
const isoDay = (value: string | null) => (value ? value.slice(0, 10) : "");

function hasInternshipStartedOrProgress(placement: PlacementRecord): boolean {
  return (
    placement.academicStatus === "ACTIVE" ||
    placement.academicStatus === "CLOSED" ||
    (placement.progress?.reportCount ?? 0) > 0 ||
    (placement.progress?.evaluationCount ?? 0) > 0
  );
}

function getPlacementBadge(placement: PlacementRecord): {
  label: string;
  className: string;
} {
  if (
    placement.status === "ACTIVE" &&
    !hasInternshipStartedOrProgress(placement)
  ) {
    return {
      label: "Đã phân công · Chờ bắt đầu",
      className: "border-blue-200 bg-blue-50 text-blue-700",
    };
  }
  return {
    label: statusLabel[placement.status],
    className: statusClass[placement.status],
  };
}

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
    if (!startDate || !endDate) {
      setError("Hãy nhập đủ ngày bắt đầu và ngày kết thúc theo dõi.");
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
        `Lịch phải nằm trong khung theo dõi ${formatDate(selected.semester.startDate)} – ${formatDate(selected.semester.endDate)}.`,
      );
      return;
    }
    setSaving(true);
    try {
      const updated = await placementsApi.update(selected.id, {
        startDate: new Date(`${startDate}T00:00:00.000Z`).toISOString(),
        endDate: new Date(`${endDate}T23:59:59.999Z`).toISOString(),
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
      setError("Cần nhập lý do hủy hồ sơ thực tập.");
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
    <section className="admin-page admin-page--feature space-y-5">
      <header className="rounded-3xl bg-gradient-to-br from-[#004f52] via-[#00878a] to-[#006f72] p-6 text-white shadow-xl shadow-[#00878a]/25 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/90">
              <BriefcaseBusiness className="h-3.5 w-3.5" /> Theo dõi hồ sơ thực
              tập
            </div>
            <h1 className="admin-page-title mt-4 text-3xl font-black tracking-tight">
              Quản lý hồ sơ thực tập
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
              Theo dõi lịch học vụ, tiến độ báo cáo và vòng đời của từng hồ sơ
              thực tập.
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
            label: "Tổng hồ sơ thực tập",
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
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-bold text-rose-700 transition"
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Sinh viên</th>
                  <th className="px-5 py-3.5">Vị trí / Doanh nghiệp</th>
                  <th className="px-5 py-3.5">Học kỳ &amp; Lịch</th>
                  <th className="px-5 py-3.5">Giảng viên hướng dẫn</th>
                  <th className="px-5 py-3.5">Tiến độ</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((skeletonId) => (
                  <tr key={skeletonId} className="border-b border-slate-100">
                    <td className="px-5 py-4">
                      <div className="mb-2 h-4 w-32 animate-pulse rounded bg-slate-200"></div>
                      <div className="h-3 w-24 animate-pulse rounded bg-slate-100"></div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="mb-2 h-4 w-40 animate-pulse rounded bg-slate-200"></div>
                      <div className="h-3 w-32 animate-pulse rounded bg-slate-100"></div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="mb-2 h-4 w-24 animate-pulse rounded bg-slate-200"></div>
                      <div className="h-3 w-32 animate-pulse rounded bg-slate-100"></div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="mb-2 h-4 w-32 animate-pulse rounded bg-slate-200"></div>
                      <div className="h-3 w-24 animate-pulse rounded bg-slate-100"></div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <div className="h-6 w-12 animate-pulse rounded-lg bg-slate-200"></div>
                        <div className="h-6 w-12 animate-pulse rounded-lg bg-slate-200"></div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200"></div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-block h-8 w-20 animate-pulse rounded-lg bg-slate-200"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <BriefcaseBusiness className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-800">
              Không có hồ sơ thực tập phù hợp
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Thử điều chỉnh bộ lọc hoặc chờ ứng viên được chấp nhận.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Sinh viên</th>
                  <th className="px-5 py-3.5">Vị trí / Doanh nghiệp</th>
                  <th className="px-5 py-3.5">Học kỳ &amp; Lịch</th>
                  <th className="px-5 py-3.5">Giảng viên hướng dẫn</th>
                  <th className="px-5 py-3.5">Tiến độ</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((placement) => (
                  <tr
                    key={placement.id}
                    onClick={() => void openDetail(placement)}
                    className="cursor-pointer transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <ProfileAvatarPreview
                          fileId={placement.student.avatarFileId}
                          fallback={placement.student.fullName.charAt(0)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-100 font-black text-indigo-700"
                          imageClassName="h-full w-full object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {placement.student.fullName}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500">
                            <span className="font-mono font-semibold text-slate-600">
                              {placement.student.studentCode}
                            </span>{" "}
                            · {placement.student.major}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <p className="font-bold text-slate-800">
                        {placement.internship.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {placement.company.companyName}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 align-middle">
                      <p className="font-semibold text-slate-700">
                        {placement.semester.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {formatDate(placement.startDate)} —{" "}
                        {formatDate(placement.endDate)}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 align-middle">
                      {placement.supervision?.status === "ACTIVE" ? (
                        <div>
                          <p className="font-bold text-slate-800">
                            {placement.supervision.lecturer.fullName}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {placement.supervision.lecturer.department}
                          </p>
                        </div>
                      ) : (
                        <span className="inline-flex whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                          Chưa phân công
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 align-middle">
                      <div className="flex items-center gap-1.5">
                        <span
                          title="Số báo cáo đã nộp"
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600"
                        >
                          <FileText className="h-3.5 w-3.5" />{" "}
                          {placement.progress.reportCount}
                        </span>
                        <span
                          title="Số bản đánh giá"
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />{" "}
                          {placement.progress.evaluationCount}
                        </span>
                        {placement.progress.reportsAwaitingReview > 0 && (
                          <span className="whitespace-nowrap rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">
                            {placement.progress.reportsAwaitingReview} chờ duyệt
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 align-middle">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${getPlacementBadge(placement).className}`}
                      >
                        {getPlacementBadge(placement).label}
                      </span>
                    </td>
                    <td
                      className="whitespace-nowrap px-5 py-4 text-right align-middle"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => void openDetail(placement)}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50"
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
        {!loading && total > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-600">
            <span className="font-medium text-slate-500">
              Tổng: <strong className="text-slate-700">{total}</strong> hồ sơ
              thực tập
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
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onClick={closeDetail}
        >
          <div
            className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
              <div className="flex min-w-0 items-center gap-3.5">
                <ProfileAvatarPreview
                  fileId={selected.student.avatarFileId}
                  fallback={selected.student.fullName.charAt(0)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-indigo-100 text-sm font-black text-indigo-700"
                  imageClassName="h-full w-full object-cover"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${getPlacementBadge(selected).className}`}
                    >
                      {getPlacementBadge(selected).label}
                    </span>
                  </div>
                  <h2 className="mt-1 truncate text-lg font-bold text-slate-900">
                    {selected.student.fullName}
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    <span className="font-mono font-semibold text-slate-600">
                      {selected.student.studentCode}
                    </span>{" "}
                    · {selected.student.major}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {/* Position, Company & Supervisor */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Vị trí &amp; Doanh nghiệp
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {selected.internship.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {selected.company.companyName}
                    {selected.internship.location
                      ? ` · ${selected.internship.location}`
                      : ""}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Giảng viên hướng dẫn
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {selected.supervision?.lecturer.fullName ??
                      "Chưa phân công"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {selected.supervision?.lecturer.department ??
                      "Mở trang Phân công giảng viên để chỉ định"}
                  </p>
                </div>
              </div>

              {/* Schedule Section */}
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Lịch thực tập thực tế
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {selected.semester.name} (Khung học kỳ:{" "}
                      {formatDate(selected.semester.startDate)} —{" "}
                      {formatDate(selected.semester.endDate)})
                    </p>
                  </div>
                  {selected.academicStatus === "PENDING" && !editingSchedule ? (
                    <button
                      type="button"
                      onClick={startScheduleEdit}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Chỉnh lịch
                    </button>
                  ) : null}
                </div>
                {editingSchedule ? (
                  <div className="mt-3.5 grid gap-3 border-t border-slate-100 pt-3.5 sm:grid-cols-2">
                    <label className="text-xs font-bold text-slate-600">
                      Ngày bắt đầu
                      <input
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                        min={isoDay(selected.semester.startDate)}
                        max={isoDay(selected.semester.endDate)}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                      />
                    </label>
                    <label className="text-xs font-bold text-slate-600">
                      Ngày kết thúc
                      <input
                        type="date"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        min={isoDay(selected.semester.startDate)}
                        max={isoDay(selected.semester.endDate)}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                      />
                    </label>
                    <div className="flex justify-end gap-2 sm:col-span-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => setEditingSchedule(false)}
                        className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void saveSchedule()}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                      >
                        {saving && (
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                        )}
                        Lưu lịch
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`mt-3 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold ${
                      selected.startDate && selected.endDate
                        ? "bg-slate-50 text-slate-800"
                        : "border border-amber-200 bg-amber-50 text-amber-800"
                    }`}
                  >
                    <CalendarDays className="h-4 w-4 shrink-0 text-indigo-600" />
                    {selected.startDate && selected.endDate ? (
                      <span>
                        Từ <strong>{formatDate(selected.startDate)}</strong> đến{" "}
                        <strong>{formatDate(selected.endDate)}</strong>
                      </span>
                    ) : (
                      <span>
                        Chưa có lịch thực tập. Hãy đặt ngày bắt đầu và kết thúc
                        trước khi phân công giảng viên.
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Progress & Evaluation Section */}
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900">
                    Tiến độ báo cáo &amp; Điểm đánh giá
                  </p>
                  {selected.progress.lastReportAt && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock3 className="h-3 w-3" /> Cập nhật:{" "}
                      {formatDate(selected.progress.lastReportAt)}
                    </span>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Báo cáo đã duyệt
                    </p>
                    <p className="mt-1.5 text-base font-bold text-slate-900">
                      {selected.progress.approvedReports ?? 0}
                      <span className="text-xs font-semibold text-slate-400">
                        /{selected.progress.reportCount}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Báo cáo tổng kết
                    </p>
                    <p
                      className={`mt-1.5 text-sm font-bold ${
                        selected.progress.finalReportStatus
                          ? "text-slate-900"
                          : "text-slate-400"
                      }`}
                    >
                      {selected.progress.finalReportStatus
                        ? reportLabel[selected.progress.finalReportStatus]
                        : "Chưa nộp"}
                    </p>
                  </div>

                  <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Điểm Doanh nghiệp
                    </p>
                    <p
                      className={`mt-1.5 ${
                        selected.progress.companyScore !== null &&
                        selected.progress.companyScore !== undefined
                          ? "text-base font-bold text-indigo-700"
                          : "text-sm font-bold text-slate-400"
                      }`}
                    >
                      {selected.progress.companyScore !== null &&
                      selected.progress.companyScore !== undefined
                        ? `${selected.progress.companyScore}/10`
                        : "Chưa chấm"}
                    </p>
                  </div>

                  <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Điểm Giảng viên
                    </p>
                    <p
                      className={`mt-1.5 ${
                        selected.progress.lecturerScore !== null &&
                        selected.progress.lecturerScore !== undefined
                          ? "text-base font-bold text-indigo-700"
                          : "text-sm font-bold text-slate-400"
                      }`}
                    >
                      {selected.progress.lecturerScore !== null &&
                      selected.progress.lecturerScore !== undefined
                        ? `${selected.progress.lecturerScore}/10`
                        : "Chưa chấm"}
                    </p>
                  </div>
                </div>

                {selected.progress.finalScore !== null &&
                selected.progress.finalScore !== undefined ? (
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/70 px-3.5 py-2.5 text-xs">
                    <span className="font-bold text-indigo-900">
                      Điểm tổng kết (50% DN + 50% GVHD):
                    </span>
                    <span className="font-black text-indigo-700">
                      {selected.progress.finalScore.toFixed(2)}/10{" "}
                      {selected.progress.hasCompanyCertificate
                        ? "· Đã có Chứng nhận DN"
                        : ""}
                    </span>
                  </div>
                ) : (
                  selected.status === "ACTIVE" && (
                    <p className="mt-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs leading-relaxed text-slate-500">
                      Để nghiệm thu hoàn tất hồ sơ, sinh viên cần có báo cáo
                      được duyệt và đủ 2 bản chấm điểm từ Doanh nghiệp &amp;
                      Giảng viên hướng dẫn.
                    </p>
                  )
                )}
              </div>

              {/* Action Confirmation Form */}
              {action && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-900">
                    {action === "COMPLETED"
                      ? "Xác nhận nghiệm thu & hoàn tất thực tập"
                      : "Xác nhận hủy hồ sơ thực tập"}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {action === "COMPLETED"
                      ? "Xác nhận sinh viên đã hoàn thành kỳ thực tập tại doanh nghiệp và đủ điều kiện nghiệm thu."
                      : "Lịch sử ứng tuyển, báo cáo và đánh giá vẫn được lưu trữ. Suất tuyển dụng sẽ được hoàn lại cho vị trí thực tập."}
                  </p>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder={
                      action === "CANCELLED"
                        ? "Nhập lý do hủy hồ sơ thực tập (bắt buộc)..."
                        : "Ghi chú nghiệm thu (không bắt buộc)..."
                    }
                    className="mt-3 w-full rounded-xl border border-slate-300 bg-white p-3 text-xs outline-none focus:border-indigo-500"
                  />
                  <div className="mt-1 text-right text-[11px] text-slate-400">
                    {note.length}/500
                  </div>
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setAction(null)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700"
                    >
                      Quay lại
                    </button>
                    <button
                      type="button"
                      disabled={
                        saving || (action === "CANCELLED" && !note.trim())
                      }
                      onClick={() => void submitStatus()}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white disabled:opacity-50 ${
                        action === "COMPLETED"
                          ? "bg-emerald-600"
                          : "bg-rose-600"
                      }`}
                    >
                      {saving && (
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                      )}
                      {action === "COMPLETED"
                        ? "Xác nhận hoàn tất"
                        : "Xác nhận hủy hồ sơ"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-6 py-3.5">
              <div>
                {!action &&
                  (selected.status === "PENDING" ||
                    selected.status === "ACTIVE") && (
                    <button
                      type="button"
                      onClick={() => {
                        setAction("CANCELLED");
                        setNote("");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                    >
                      <XCircle className="h-4 w-4" /> Hủy hồ sơ thực tập
                    </button>
                  )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeDetail}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                >
                  Đóng
                </button>
                {!action &&
                  selected.status === "ACTIVE" &&
                  (selected.academicStatus === "CLOSED" ||
                    Boolean(
                      selected.progress.hasCompanyEvaluation &&
                        selected.progress.hasLecturerEvaluation &&
                        (selected.progress.approvedReports ?? 0) > 0 &&
                        selected.progress.reportsAwaitingReview === 0,
                    )) && (
                    <button
                      type="button"
                      onClick={() => {
                        setAction("COMPLETED");
                        setNote("");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Nghiệm thu &amp; Hoàn
                      tất
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
