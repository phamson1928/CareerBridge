import { ModalPortal } from "../ModalPortal";
import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Award,
  BookOpenCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Clock3,
  Edit3,
  Eye,
  FileCheck2,
  FileText,
  GraduationCap,
  MessageSquareReply,
  Plus,
  Save,
  Send,
  Upload,
  X,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { downloadPrivateFile, uploadPrivateFile } from "../../files/api";
import { placementsApi } from "../../placements/api";
import type { PlacementRecord } from "../../placements/types";
import { ReportFileDetails } from "../../reports/ReportFileDetails";
import { reportsApi } from "../../reports/api";
import type { ReportRecord } from "../../reports/types";
import { formatDate, formatDateTime, formatFileSize } from "../../utils/format";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_INTERNSHIP_WEEKS = 10;

const elapsedWeeks = (placement: PlacementRecord, now = new Date()) => {
  if (!placement.startDate || !placement.endDate) return 0;
  const start = new Date(placement.startDate).getTime();
  const end = new Date(placement.endDate).getTime();
  const current = now.getTime();
  if (current < start || end <= start) return 0;
  const totalWeeks = Math.min(
    MAX_INTERNSHIP_WEEKS,
    Math.ceil((end - start + 1) / WEEK_MS),
  );
  const currentWeek =
    Math.floor((Math.min(current, end) - start) / WEEK_MS) + 1;
  return Math.min(totalWeeks, currentWeek);
};

const totalMonitoringWeeks = (placement: PlacementRecord) => {
  if (!placement.startDate || !placement.endDate) return 0;
  const start = new Date(placement.startDate).getTime();
  const end = new Date(placement.endDate).getTime();
  if (end <= start) return 0;
  return Math.min(MAX_INTERNSHIP_WEEKS, Math.ceil((end - start + 1) / WEEK_MS));
};

const statusStyle: Record<ReportRecord["status"], string> = {
  DRAFT: "bg-slate-100 text-slate-700 border border-slate-200",
  SUBMITTED: "bg-blue-50 text-blue-700 border border-blue-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 border border-rose-200",
};

const statusLabel: Record<ReportRecord["status"], string> = {
  DRAFT: "Bản nháp (Chưa nộp)",
  SUBMITTED: "Đang chờ GVHD duyệt",
  APPROVED: "Đã được phê duyệt",
  REJECTED: "Cần chỉnh sửa & nộp lại",
};

export const StudentReports: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({ onNavigateTab }) => {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [placements, setPlacements] = useState<PlacementRecord[]>([]);
  const [selectedPlacementFilter, setSelectedPlacementFilter] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<ReportRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selectedDetailReport, setSelectedDetailReport] = useState<ReportRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    placementId: "",
    week: 1,
    title: "",
    content: "",
    file: null as File | null,
  });

  const canModifyPlacementReports = (placement: {
    status: string;
    academicStatus: string;
  }) =>
    placement.status === "ACTIVE" &&
    (placement.academicStatus === "ACTIVE" ||
      placement.academicStatus === "CLOSED");

  const availableWeeks = (placement: PlacementRecord) => {
    if (!canModifyPlacementReports(placement)) return [];
    const usedWeeks = new Set(
      reports
        .filter((report) => report.placementId === placement.id && report.week > 0)
        .map((report) => report.week),
    );
    return Array.from(
      { length: elapsedWeeks(placement) },
      (_, index) => index + 1,
    ).filter((week) => !usedWeeks.has(week));
  };

  const load = async () => {
    setLoading(true);
    try {
      const [reportsPage, placementsPage] = await Promise.all([
        reportsApi.mine({ limit: 100 }),
        placementsApi.listMine(),
      ]);
      setReports(reportsPage.items);
      const activeOrCompleted = placementsPage.items.filter(
        (item) =>
          item.academicStatus === "ACTIVE" ||
          item.academicStatus === "CLOSED" ||
          item.status === "COMPLETED",
      );
      setPlacements(activeOrCompleted);
      if (!selectedPlacementFilter && activeOrCompleted[0]) {
        setSelectedPlacementFilter(activeOrCompleted[0].id);
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const currentPlacement =
    placements.find((item) => item.id === selectedPlacementFilter) ??
    placements[0] ??
    null;

  const placementReports = reports.filter((r) =>
    currentPlacement ? r.placementId === currentPlacement.id : true,
  );
  const finalReport = placementReports.find((r) => r.week === 0) ?? null;
  const weeklyReports = placementReports
    .filter((r) => r.week > 0)
    .sort((a, b) => b.week - a.week);

  const reportablePlacements = placements.filter(
    (placement) => availableWeeks(placement).length > 0,
  );
  const selectedFormPlacement = placements.find(
    (placement) => placement.id === form.placementId,
  );
  const selectedWeeks = selectedFormPlacement
    ? availableWeeks(selectedFormPlacement)
    : [];

  const openCreateWeekly = (targetPlacement?: PlacementRecord) => {
    const placement =
      targetPlacement && availableWeeks(targetPlacement).length > 0
        ? targetPlacement
        : reportablePlacements[0];
    const weeks = placement ? availableWeeks(placement) : [];
    const nextWeek = weeks.at(-1) ?? 1;
    setEditing(null);
    setError("");
    setForm({
      placementId: placement?.id ?? "",
      week: nextWeek,
      title: `Báo cáo công việc thực tập tuần ${nextWeek}`,
      content: "",
      file: null,
    });
    setIsOpen(true);
  };

  const openCreateFinalReport = (placement: PlacementRecord) => {
    setEditing(null);
    setError("");
    setForm({
      placementId: placement.id,
      week: 0,
      title: "Báo cáo tổng kết thực tập tốt nghiệp",
      content: "",
      file: null,
    });
    setIsOpen(true);
  };

  const openEdit = (report: ReportRecord) => {
    setEditing(report);
    setError("");
    setForm({
      placementId: report.placementId,
      week: report.week,
      title:
        report.title ??
        (report.week === 0
          ? "Báo cáo tổng kết thực tập tốt nghiệp"
          : `Báo cáo thực tập tuần ${report.week}`),
      content: report.content,
      file: null,
    });
    setIsOpen(true);
  };

  const close = () => {
    if (saving) return;
    setIsOpen(false);
    setEditing(null);
    setError("");
  };

  const saveReport = async (mode: "DRAFT" | "SUBMIT") => {
    if (!form.content.trim()) {
      setError("Vui lòng nhập nội dung báo cáo.");
      return;
    }
    const isFinal = form.week === 0;
    const hasFile = Boolean(form.file || editing?.file);
    if (isFinal && mode === "SUBMIT" && !hasFile) {
      setError(
        "Báo cáo tổng kết thực tập cuối kỳ bắt buộc phải đính kèm tệp báo cáo hoàn chỉnh (PDF/DOC/DOCX) khi gửi duyệt.",
      );
      return;
    }

    setSaving(true);
    setError("");
    try {
      const fileId = form.file
        ? (await uploadPrivateFile(form.file, "REPORT")).id
        : undefined;
      const report = editing
        ? await reportsApi.update(editing.id, {
            title: form.title || undefined,
            content: form.content,
            ...(fileId ? { fileId } : {}),
          })
        : await reportsApi.create({
            placementId: form.placementId,
            week: form.week,
            title: form.title || undefined,
            content: form.content,
            fileId,
          });
      if (mode === "SUBMIT") {
        await reportsApi.submit(report.id);
      }
      close();
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleQuickSubmit = async (report: ReportRecord) => {
    if (report.week === 0 && !report.file) {
      openEdit(report);
      setError(
        "Vui lòng đính kèm tệp Báo cáo tổng kết (PDF/DOCX) trước khi gửi giảng viên duyệt.",
      );
      return;
    }
    setSubmittingId(report.id);
    setError("");
    try {
      await reportsApi.submit(report.id);
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSubmittingId(null);
    }
  };

  const download = async (fileId: string) => {
    try {
      await downloadPrivateFile(fileId);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  const totalWeeksCount = currentPlacement
    ? totalMonitoringWeeks(currentPlacement)
    : 0;
  const elapsedWeeksCount = currentPlacement
    ? elapsedWeeks(currentPlacement)
    : 0;
  const approvedWeeklyCount = weeklyReports.filter(
    (r) => r.status === "APPROVED",
  ).length;
  const submittedWeeklyCount = weeklyReports.filter(
    (r) => r.status !== "DRAFT",
  ).length;

  const allReportsList: ReportRecord[] = [
    ...(finalReport ? [finalReport] : []),
    ...weeklyReports,
  ];

  const PAGE_SIZE = 10;
  const totalReports = allReportsList.length;
  const totalPages = Math.max(1, Math.ceil(totalReports / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = Math.min(totalReports, startIndex + PAGE_SIZE);
  const currentReports = allReportsList.slice(startIndex, endIndex);

  function formatReportTimestamp(dateString: string | null | undefined) {
    if (!dateString) return { date: "—", time: "" };
    const d = new Date(dateString);
    const date = d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    return { date, time };
  }

  return (
    <div className="space-y-6 w-full">
      {/* Centered Open Typography Header */}
      <div className="text-center max-w-2xl mx-auto pt-2 pb-5 sm:pt-4 sm:pb-7 space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
          Báo Cáo Thực Tập
        </h1>
        <p className="text-sm sm:text-base text-slate-500 font-normal leading-relaxed">
          Ghi lại tiến độ công việc hàng tuần và nộp báo cáo tổng kết cho giảng viên hướng dẫn.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bento Grid Metrics Summary */}
      {currentPlacement && (
        <div className="grid gap-4 sm:grid-cols-3 bento-stagger">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 card-interactive text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Tiến độ Nhật ký tuần</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">
                  {submittedWeeklyCount}/{elapsedWeeksCount || totalWeeksCount}{" "}
                  <span className="text-xs font-semibold text-slate-500">tuần đã mở</span>
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-emerald-700 font-bold border-t border-slate-100 pt-2 flex items-center justify-center sm:justify-start gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã duyệt: {approvedWeeklyCount} tuần
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 card-interactive text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                <BookOpenCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">Báo cáo tổng kết cuối kỳ</p>
                <p className="text-sm font-black text-slate-900 truncate mt-0.5">
                  {finalReport ? statusLabel[finalReport.status] : "Chưa nộp báo cáo tổng kết"}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500 border-t border-slate-100 pt-2">
              Hồ sơ bắt buộc để GVHD chấm điểm học phần
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 card-interactive text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Giảng viên hướng dẫn</p>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {currentPlacement.supervision?.lecturer.fullName ?? "Đang chờ phân công"}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500 border-t border-slate-100 pt-2">
              Lịch: {formatDate(currentPlacement.startDate)} – {formatDate(currentPlacement.endDate)}
            </p>
          </div>
        </div>
      )}

      {/* FINAL REPORT APPROVED CELEBRATION BANNER */}
      {finalReport && finalReport.status === "APPROVED" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 sm:p-5 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Award className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-sm font-black text-emerald-950">
                Báo cáo tổng kết đã được Giảng viên hướng dẫn phê duyệt!
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Bạn đã hoàn thành phần báo cáo. Có thể chuyển sang tab Đánh giá để xem điểm số và chứng nhận thực tập.
              </p>
            </div>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab("evaluations")}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer self-center sm:self-auto"
            >
              <Award className="h-4 w-4" />
              Xem Kết quả Đánh giá
            </button>
          )}
        </div>
      )}

      {/* MAIN REPORTS TABLE CARD */}
      <div className="rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        {/* Table Top Header: Title & Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-7 border-b border-slate-100 text-center lg:text-left">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Danh sách báo cáo thực tập
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Quản lý tiến độ báo cáo tuần và cuốn báo cáo tổng kết cuối kỳ
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2.5 shrink-0 self-center lg:self-auto">
            {placements.length > 1 && (
              <select
                value={currentPlacement?.id ?? ""}
                onChange={(e) => setSelectedPlacementFilter(e.target.value)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 outline-none transition-all hover:border-teal-300 shadow-2xs cursor-pointer"
              >
                {placements.map((p) => (
                  <option key={p.id} value={p.id} className="text-slate-800 bg-white">
                    {p.internship.title} — {p.company.companyName}
                  </option>
                ))}
              </select>
            )}

            {!finalReport && currentPlacement && canModifyPlacementReports(currentPlacement) && (
              <button
                type="button"
                onClick={() => openCreateFinalReport(currentPlacement)}
                className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50/60 px-4 py-2.5 text-xs font-bold text-teal-800 hover:bg-teal-100/70 transition-all cursor-pointer shadow-2xs"
              >
                <Award className="h-4 w-4 text-teal-700" />
                Nộp Báo cáo tổng kết
              </button>
            )}

            <button
              type="button"
              disabled={
                !currentPlacement ||
                availableWeeks(currentPlacement).length === 0
              }
              onClick={() =>
                currentPlacement && openCreateWeekly(currentPlacement)
              }
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#00a3a6] to-[#006d72] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:brightness-105 active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Viết báo cáo tuần mới
            </button>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-16 text-center text-sm text-slate-500">
            <Clock3 className="h-6 w-6 animate-spin mx-auto text-teal-600 mb-2" />
            Đang tải danh sách báo cáo...
          </div>
        ) : allReportsList.length === 0 ? (
          <div className="p-16 text-center">
            <CheckSquare className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-base font-bold text-slate-700">
              Chưa có báo cáo nào được ghi lại
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Nhấn nút "Viết báo cáo tuần mới" ở trên để bắt đầu ghi lại tiến độ công việc hàng tuần cho giảng viên hướng dẫn.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View: Clean card list to avoid horizontal squeeze */}
            <div className="block sm:hidden divide-y divide-slate-100 p-3.5 space-y-3">
              {currentReports.map((report) => {
                const { date, time } = formatReportTimestamp(
                  report.submittedAt || report.updatedAt || report.createdAt,
                );

                return (
                  <div
                    key={report.id}
                    onClick={() => setSelectedDetailReport(report)}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-2.5 active:scale-[0.99] transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      {report.week === 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[11px] font-extrabold text-teal-800">
                          <Award className="h-3 w-3 text-teal-700" />
                          Tổng kết cuối kỳ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                          <CalendarDays className="h-3 w-3 text-slate-500" />
                          Tuần {report.week}
                        </span>
                      )}

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusStyle[report.status]}`}
                      >
                        {statusLabel[report.status]}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {report.title ||
                          (report.week === 0
                            ? "Báo cáo tổng kết thực tập tốt nghiệp"
                            : `Báo cáo thực tập tuần ${report.week}`)}
                      </h4>
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                        {report.content}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
                        {report.file && (
                          <span className="flex items-center gap-1 text-teal-700 font-semibold truncate max-w-[200px]">
                            <FileText className="h-3 w-3 shrink-0" />
                            {report.file.originalName}
                          </span>
                        )}
                        {report.feedback && (
                          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                            <MessageSquareReply className="h-3 w-3 shrink-0" />
                            Có nhận xét GVHD
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] text-slate-400">
                      <span>{date} · {time}</span>
                      <span className="text-teal-700 font-bold flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> Xem chi tiết
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th scope="col" className="px-6 py-4 w-[42%] max-w-sm">
                      Kỳ báo cáo &amp; Nội dung
                    </th>
                    <th scope="col" className="px-6 py-4 text-center w-36 whitespace-nowrap">
                      Trạng thái
                    </th>
                    <th scope="col" className="px-6 py-4 w-40 whitespace-nowrap">
                      Cập nhật lúc
                    </th>
                    <th scope="col" className="px-6 py-4 text-center w-28 whitespace-nowrap">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {currentReports.map((report) => {
                    const { date, time } = formatReportTimestamp(
                      report.submittedAt || report.updatedAt || report.createdAt,
                    );

                    return (
                      <tr
                        key={report.id}
                        onClick={() => setSelectedDetailReport(report)}
                        className="hover:bg-teal-50/20 transition-colors cursor-pointer group"
                      >
                        {/* Cột 1: Kỳ báo cáo & Nội dung */}
                        <td className="px-6 py-4 max-w-sm">
                          <div className="flex items-center gap-2">
                            {report.week === 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[11px] font-extrabold text-teal-800">
                                <Award className="h-3 w-3 text-teal-700" />
                                Tổng kết cuối kỳ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                                <CalendarDays className="h-3 w-3 text-slate-500" />
                                Tuần {report.week}
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors line-clamp-1 mt-1.5">
                            {report.title ||
                              (report.week === 0
                                ? "Báo cáo tổng kết thực tập tốt nghiệp"
                                : `Báo cáo thực tập tuần ${report.week}`)}
                          </h4>
                          <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                            {report.content}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px]">
                            {report.file && (
                              <span className="flex items-center gap-1 text-teal-700 font-semibold">
                                <FileText className="h-3 w-3" />
                                {report.file.originalName}
                              </span>
                            )}
                            {report.feedback && (
                              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                                <MessageSquareReply className="h-3 w-3" />
                                Đã có nhận xét của GVHD
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Cột 2: Trạng thái */}
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusStyle[report.status]}`}
                          >
                            {report.status === "APPROVED" ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : report.status === "SUBMITTED" ? (
                              <Clock className="h-3.5 w-3.5" />
                            ) : report.status === "REJECTED" ? (
                              <AlertCircle className="h-3.5 w-3.5" />
                            ) : (
                              <Clock3 className="h-3.5 w-3.5" />
                            )}
                            {statusLabel[report.status]}
                          </span>
                        </td>

                        {/* Cột 3: Cập nhật lúc */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-xs font-bold text-slate-700">{date}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{time}</p>
                        </td>

                        {/* Cột 4: Thao tác */}
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDetailReport(report);
                            }}
                            className="inline-flex flex-col items-center justify-center gap-0.5 rounded-xl px-2.5 py-1 text-teal-700 hover:bg-teal-50 hover:text-teal-900 transition-colors cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="text-[11px] font-bold">Chi tiết</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Table Footer: Result Count & Pagination */}
        {totalReports > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500 text-center sm:text-left">
            <div className="font-medium text-slate-600">
              Tổng: <span className="font-bold text-slate-900">{totalReports} báo cáo</span>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 self-center sm:self-auto">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Trước
                </button>

                {Array.from({ length: totalPages }, (_, index) => {
                  const pageNumber = index + 1;
                  const isActive = pageNumber === safePage;

                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`min-w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-teal-700 text-white shadow-2xs"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-teal-50 hover:text-teal-800 shadow-2xs"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                >
                  Sau
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DETAIL MODAL (Xem chi tiết nội dung, nhận xét GVHD & tệp đính kèm) */}
      {selectedDetailReport && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs modal-backdrop-appear"
            onClick={() => setSelectedDetailReport(null)}
          >
            <div
              className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl modal-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Accent Gradient Line */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#00a3a6] via-teal-500 to-[#006d72]" />

              <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-5 sm:px-8">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {selectedDetailReport.week === 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[11px] font-extrabold text-teal-800">
                        <Award className="h-3.5 w-3.5 text-teal-700" />
                        Báo cáo tổng kết cuối kỳ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                        Báo cáo tuần {selectedDetailReport.week}
                      </span>
                    )}

                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusStyle[selectedDetailReport.status]}`}
                    >
                      {statusLabel[selectedDetailReport.status]}
                    </span>
                  </div>

                  <h3 className="mt-2 text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    {selectedDetailReport.title ||
                      (selectedDetailReport.week === 0
                        ? "Báo cáo tổng kết thực tập tốt nghiệp"
                        : `Báo cáo thực tập tuần ${selectedDetailReport.week}`)}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {selectedDetailReport.placement.internship.title} · {selectedDetailReport.placement.company.companyName}
                    {selectedDetailReport.submittedAt &&
                      ` · Nộp lúc ${formatDateTime(selectedDetailReport.submittedAt)}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDetailReport(null)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Đóng cửa sổ"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto no-scrollbar p-6 sm:p-8">
                {/* Nội dung báo cáo */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Nội dung báo cáo
                  </p>
                  <div className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-800">
                    {selectedDetailReport.content}
                  </div>
                </div>

                {/* Tệp đính kèm */}
                {selectedDetailReport.file ? (
                  <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-teal-800 mb-2">
                      Tệp báo cáo đính kèm
                    </p>
                    <ReportFileDetails
                      file={selectedDetailReport.file}
                      onDownload={download}
                    />
                  </div>
                ) : selectedDetailReport.week === 0 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-semibold text-amber-800">
                    Chưa đính kèm tệp Cuốn báo cáo tổng kết (bắt buộc khi gửi giảng viên duyệt).
                  </div>
                ) : null}

                {/* Nhận xét của Giảng viên hướng dẫn */}
                {selectedDetailReport.feedback ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-2xs">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800">
                      <MessageSquareReply className="h-4 w-4" />
                      Nhận xét của Giảng viên hướng dẫn
                    </span>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-emerald-950 font-medium">
                      {selectedDetailReport.feedback}
                    </p>
                  </div>
                ) : selectedDetailReport.status === "SUBMITTED" ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs font-semibold text-amber-800 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>
                      Báo cáo đã được gửi tới Giảng viên hướng dẫn và đang chờ xét duyệt.
                    </span>
                  </div>
                ) : null}
              </div>

              <footer className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setSelectedDetailReport(null)}
                  className="rounded-full bg-slate-200 px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
                >
                  Đóng
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  {(selectedDetailReport.status === "DRAFT" ||
                    selectedDetailReport.status === "REJECTED") &&
                    canModifyPlacementReports(selectedDetailReport.placement) && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const rep = selectedDetailReport;
                            setSelectedDetailReport(null);
                            openEdit(rep);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          {selectedDetailReport.status === "REJECTED"
                            ? "Chỉnh sửa & Nộp lại"
                            : "Chỉnh sửa nháp"}
                        </button>

                        {selectedDetailReport.status === "DRAFT" && (
                          <button
                            type="button"
                            disabled={submittingId === selectedDetailReport.id}
                            onClick={async () => {
                              const rep = selectedDetailReport;
                              await handleQuickSubmit(rep);
                              setSelectedDetailReport(null);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-[#00a3a6] to-[#006d72] px-5 py-2 text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                          >
                            <Send className="h-3.5 w-3.5" />
                            {submittingId === selectedDetailReport.id
                              ? "Đang gửi..."
                              : "Gửi GVHD duyệt"}
                          </button>
                        )}
                      </>
                    )}
                </div>
              </footer>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* CREATE / EDIT MODAL */}
      {isOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs modal-backdrop-appear">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto no-scrollbar rounded-3xl bg-white shadow-2xl modal-scale-in border border-slate-100">
              {/* Top Accent Gradient Line */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#00a3a6] via-teal-500 to-[#006d72]" />

              <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5 sm:px-8 bg-slate-50/50">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-teal-800">
                    {form.week === 0 ? (
                      <>
                        <Award className="h-3.5 w-3.5 text-teal-700" />
                        Báo cáo tổng kết cuối kỳ
                      </>
                    ) : (
                      <>
                        <FileText className="h-3.5 w-3.5 text-teal-700" />
                        Nhật ký tiến độ tuần
                      </>
                    )}
                  </div>
                  <h3 className="mt-2 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {editing
                      ? form.week === 0
                        ? "Cập nhật Báo cáo tổng kết thực tập"
                        : `Chỉnh sửa báo cáo tuần ${editing.week}`
                      : form.week === 0
                        ? "Nộp Báo cáo tổng kết thực tập cuối kỳ"
                        : `Viết báo cáo thực tập tuần ${form.week}`}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
                    {form.week === 0
                      ? "Đính kèm cuốn báo cáo tổng kết thực tập hoàn chỉnh và tóm tắt kết quả đạt được."
                      : "Ghi lại nội dung công việc và kết quả đạt được trong tuần để gửi giảng viên hướng dẫn theo dõi."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Đóng cửa sổ"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>
              <div className="space-y-5 px-6 py-6 sm:px-8">
                {error && (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                    {error}
                  </p>
                )}

                {/* Placement & Report Period Context Card (Clean UI - No useless disabled dropdowns) */}
                {(() => {
                  const activePlacement =
                    placements.find((p) => p.id === form.placementId) ??
                    selectedFormPlacement ??
                    currentPlacement ??
                    placements[0];

                  return (
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50/70 via-white to-slate-50/50 p-4 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-800 border border-teal-200">
                              <Building2 className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-100/70 border border-teal-200 px-2 py-0.5 rounded-full">
                                  {activePlacement?.semester?.name ?? "Kỳ thực tập"}
                                </span>
                              </div>
                              <h4 className="text-sm font-black text-slate-900 truncate mt-1">
                                {activePlacement?.internship.title ?? "Hồ sơ thực tập"}
                              </h4>
                              <p className="text-xs font-semibold text-teal-700 truncate">
                                {activePlacement?.company.companyName}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 sm:border-l sm:border-slate-200/80 sm:pl-4">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Kỳ báo cáo
                              </p>
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100/80 border border-teal-200 px-3 py-1 text-xs font-black text-teal-900 mt-0.5">
                                {form.week === 0 ? (
                                  <>
                                    <Award className="h-3.5 w-3.5 text-teal-700" />
                                    Tổng kết cuối kỳ
                                  </>
                                ) : (
                                  <>
                                    <CalendarDays className="h-3.5 w-3.5 text-teal-700" />
                                    Tuần {form.week}
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Week Selector when creating new weekly reports */}
                      {!editing && form.week !== 0 && selectedWeeks.length > 1 && (
                        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 p-2.5">
                          <span className="text-xs font-bold text-slate-600 pl-1">
                            Chọn tuần báo cáo:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedWeeks.map((week) => (
                              <button
                                key={week}
                                type="button"
                                onClick={() =>
                                  setForm({
                                    ...form,
                                    week,
                                    title: `Báo cáo công việc thực tập tuần ${week}`,
                                  })
                                }
                                className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                                  form.week === week
                                    ? "bg-teal-700 text-white shadow-2xs"
                                    : "bg-white text-slate-700 hover:bg-teal-50 hover:text-teal-800 border border-slate-200"
                                }`}
                              >
                                Tuần {week}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Tiêu đề báo cáo
                  </span>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm({ ...form, title: event.target.value })
                    }
                    placeholder={
                      form.week === 0
                        ? "Ví dụ: Báo cáo tổng kết thực tập tốt nghiệp tại Công ty..."
                        : "Ví dụ: Hoàn thiện module xác thực và kiểm thử API"
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-2xs outline-none transition-all placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  />
                </label>

                <label className="block">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      {form.week === 0
                        ? "Tóm tắt kết quả đạt được trong toàn kỳ thực tập"
                        : "Nội dung công việc trong tuần"}{" "}
                      <span className="text-rose-500">*</span>
                    </span>
                  </div>
                  <textarea
                    required
                    rows={6}
                    value={form.content}
                    onChange={(event) =>
                      setForm({ ...form, content: event.target.value })
                    }
                    placeholder={
                      form.week === 0
                        ? "• Tổng quan nhiệm vụ được giao tại doanh nghiệp\n• Các sản phẩm / module đã hoàn thành\n• Kiến thức & kỹ năng chuyên môn tích lũy được\n• Tự đánh giá mức độ hoàn thành mục tiêu thực tập"
                        : "• Công việc đã thực hiện trong tuần\n• Kết quả đạt được / Sản phẩm bàn giao\n• Khó khăn gặp phải và hướng xử lý\n• Kế hoạch công việc tuần tiếp theo"
                    }
                    className="w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-800 shadow-2xs outline-none transition-all placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  />
                </label>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      {form.week === 0 ? "Cuốn báo cáo tổng kết" : "Tệp minh chứng đính kèm"}{" "}
                      {form.week === 0 ? (
                        <span className="text-rose-500">*</span>
                      ) : (
                        <span className="font-normal text-slate-400 normal-case">(không bắt buộc)</span>
                      )}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      PDF, DOC, DOCX · Tối đa 10 MB
                    </span>
                  </div>

                  <input
                    ref={inputRef}
                    accept=".pdf,.doc,.docx"
                    type="file"
                    className="hidden"
                    onChange={(event) =>
                      setForm({ ...form, file: event.target.files?.[0] ?? null })
                    }
                  />

                  {/* File preview or upload trigger */}
                  {form.file || editing?.file ? (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-teal-50/50 p-4 transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-teal-200 text-teal-700 shadow-xs">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {form.file?.name || editing?.file?.originalName}
                          </p>
                          <p className="text-xs font-semibold text-teal-700 mt-0.5">
                            {form.file
                              ? formatFileSize(form.file.size)
                              : editing?.file
                                ? `Tệp hiện tại (${formatFileSize(editing.file.sizeBytes)})`
                                : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => inputRef.current?.click()}
                          className="rounded-full border border-teal-200 bg-white px-3.5 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-50 transition-colors cursor-pointer shadow-2xs"
                        >
                          Thay đổi tệp
                        </button>
                        {form.file && (
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, file: null })}
                            className="rounded-full p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Gỡ tệp vừa chọn"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="group flex w-full flex-col sm:flex-row items-center gap-3.5 rounded-2xl border-2 border-dashed border-teal-200/90 bg-teal-50/30 p-5 text-left transition-all hover:border-teal-400 hover:bg-teal-50/70 cursor-pointer"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-teal-200 text-teal-700 shadow-xs group-hover:scale-105 transition-transform">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <b className="block text-sm font-bold text-slate-800">
                          {form.week === 0
                            ? "Tải lên cuốn Báo cáo tổng kết thực tập (PDF/DOCX)"
                            : "Tải lên tệp minh chứng đính kèm"}
                        </b>
                        <span className="text-xs text-slate-500 mt-0.5 block">
                          {form.week === 0
                            ? "Bắt buộc đính kèm khi gửi giảng viên duyệt · Nhấn để chọn tệp từ máy tính"
                            : "Nhấn để chọn tệp từ máy tính (không bắt buộc đối với báo cáo tuần)"}
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-full px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  {(!editing || editing.status === "DRAFT") && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void saveReport("DRAFT")}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-60 cursor-pointer shadow-2xs"
                    >
                      <Save className="h-4 w-4" />
                      Lưu bản nháp
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void saveReport("SUBMIT")}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#00a3a6] to-[#006d72] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    {saving
                      ? "Đang gửi báo cáo..."
                      : editing?.status === "REJECTED"
                        ? "Cập nhật & Nộp lại cho GVHD"
                        : "Gửi giảng viên duyệt"}
                  </button>
                </div>
              </footer>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
};
