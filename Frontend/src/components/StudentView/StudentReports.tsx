import React, { useEffect, useRef, useState } from "react";
import {
  Award,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  Clock3,
  Edit3,
  FileCheck2,
  FileText,
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

export const StudentReports = () => {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [placements, setPlacements] = useState<PlacementRecord[]>([]);
  const [selectedPlacementFilter, setSelectedPlacementFilter] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<ReportRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState("");
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

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-blue-100 bg-linear-to-br from-blue-50 via-white to-indigo-50 px-6 py-6 shadow-xs sm:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
              <CheckSquare className="h-4 w-4" />
              Sổ theo dõi & Nghiệm thu thực tập
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Nhật ký thực tập tuần & Báo cáo tổng kết
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Cập nhật nhật ký công việc hàng tuần (có thể lưu nháp trước khi nộp) và nộp cuốn Báo cáo tổng kết thực tập cuối kỳ để giảng viên hướng dẫn phê duyệt, chấm điểm học phần.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {placements.length > 1 && (
              <select
                value={currentPlacement?.id ?? ""}
                onChange={(e) => setSelectedPlacementFilter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700"
              >
                {placements.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.internship.title} — {p.company.companyName}
                  </option>
                ))}
              </select>
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Viết báo cáo tuần mới
            </button>
          </div>
        </div>

        {currentPlacement && (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-2xs">
              <p className="text-xs font-semibold text-slate-500">
                Tiến độ Nhật ký tuần
              </p>
              <p className="mt-1 text-xl font-black text-slate-900">
                {submittedWeeklyCount}/{elapsedWeeksCount || totalWeeksCount}{" "}
                <span className="text-xs font-semibold text-slate-500">
                  tuần đã mở
                </span>
              </p>
              <p className="mt-1 text-xs text-emerald-700 font-medium">
                Đã duyệt: {approvedWeeklyCount} tuần
              </p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-2xs">
              <p className="text-xs font-semibold text-slate-500">
                Báo cáo tổng kết cuối kỳ
              </p>
              <p className="mt-1 text-sm font-black text-slate-900">
                {finalReport
                  ? statusLabel[finalReport.status]
                  : "Chưa nộp báo cáo tổng kết"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Hồ sơ bắt buộc để GVHD chấm điểm học phần
              </p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-2xs">
              <p className="text-xs font-semibold text-slate-500">
                Giảng viên hướng dẫn
              </p>
              <p className="mt-1 text-sm font-black text-slate-900">
                {currentPlacement.supervision?.lecturer.fullName ??
                  "Đang chờ phân công"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Lịch thực tập: {formatDate(currentPlacement.startDate)} –{" "}
                {formatDate(currentPlacement.endDate)}
              </p>
            </div>
          </div>
        )}
      </section>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </p>
      )}

      {/* FINAL REPORT SECTION */}
      {currentPlacement && (
        <section className="rounded-3xl border border-indigo-200 bg-linear-to-r from-indigo-50/70 via-white to-violet-50/60 p-6 shadow-xs">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
                <BookOpenCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-indigo-800">
                    Hồ sơ nghiệm thu cuối kỳ
                  </span>
                  {finalReport && (
                    <span
                      className={`rounded-full px-3 py-0.5 text-xs font-bold ${statusStyle[finalReport.status]}`}
                    >
                      {statusLabel[finalReport.status]}
                    </span>
                  )}
                </div>
                <h3 className="mt-1.5 text-lg font-extrabold text-slate-900">
                  {finalReport?.title ||
                    "Cuốn Báo cáo Tổng kết Thực tập Tốt nghiệp (Final Report)"}
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Tổng hợp toàn bộ kết quả công việc, kiến thức tích lũy và đính kèm cuốn báo cáo thực tập tốt nghiệp hoàn chỉnh (PDF/DOCX) để Giảng viên hướng dẫn nghiệm thu và chấm điểm.
                </p>
              </div>
            </div>

            {!finalReport && canModifyPlacementReports(currentPlacement) && (
              <button
                type="button"
                onClick={() => openCreateFinalReport(currentPlacement)}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700"
              >
                <Upload className="h-4 w-4" />
                Nộp Báo cáo tổng kết
              </button>
            )}
          </div>

          {finalReport && (
            <div className="mt-4 border-t border-indigo-100 pt-4">
              <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
                {finalReport.content}
              </p>
              {finalReport.feedback && (
                <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 p-3.5 text-sm text-violet-950">
                  <b className="block text-xs uppercase tracking-wider text-violet-700">
                    Nhận xét của Giảng viên hướng dẫn:
                  </b>
                  <p className="mt-1">{finalReport.feedback}</p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {finalReport.file ? (
                    <ReportFileDetails
                      file={finalReport.file}
                      onDownload={download}
                    />
                  ) : (
                    <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                      Chưa đính kèm tệp báo cáo tổng kết (bắt buộc khi gửi duyệt)
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(finalReport.status === "DRAFT" ||
                    finalReport.status === "REJECTED") &&
                    canModifyPlacementReports(finalReport.placement) && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEdit(finalReport)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Chỉnh sửa
                        </button>
                        {finalReport.status === "DRAFT" && (
                          <button
                            type="button"
                            disabled={submittingId === finalReport.id}
                            onClick={() => void handleQuickSubmit(finalReport)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                          >
                            <Send className="h-3.5 w-3.5" />
                            {submittingId === finalReport.id
                              ? "Đang gửi..."
                              : "Gửi GVHD duyệt"}
                          </button>
                        )}
                      </>
                    )}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* WEEKLY REPORTS LIST */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-extrabold text-slate-900">
          Nhật ký thực tập hàng tuần ({weeklyReports.length})
        </h3>
        {currentPlacement &&
          availableWeeks(currentPlacement).length > 0 && (
            <span className="text-xs font-semibold text-blue-700">
              Tuần có thể nộp tiếp theo:{" "}
              {availableWeeks(currentPlacement)
                .map((w) => `Tuần ${w}`)
                .join(", ")}
            </span>
          )}
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-8 text-sm text-slate-500 shadow-xs">
          Đang tải sổ báo cáo thực tập...
        </div>
      ) : weeklyReports.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <CheckSquare className="mx-auto h-11 w-11 text-slate-300" />
          <h3 className="mt-4 font-bold text-slate-800">
            Chưa có nhật ký báo cáo tuần nào
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Hãy ghi lại các công việc đã thực hiện trong tuần để giảng viên hướng dẫn và doanh nghiệp theo dõi.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {weeklyReports.map((report) => (
            <article
              key={report.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300"
            >
              <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row">
                <div className="flex gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-extrabold text-blue-700">
                    T{report.week}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {report.title || `Báo cáo thực tập tuần ${report.week}`}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {report.placement.internship.title} ·{" "}
                      {report.placement.company.companyName}
                      {report.submittedAt &&
                        ` · Nộp lúc ${formatDateTime(report.submittedAt)}`}
                    </p>
                  </div>
                </div>
                <span
                  className={`self-start rounded-full px-3 py-1 text-xs font-bold ${statusStyle[report.status]}`}
                >
                  {statusLabel[report.status]}
                </span>
              </div>
              <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-700">
                {report.content}
              </p>
              {report.feedback && (
                <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50 p-3.5 text-sm text-violet-900">
                  <b className="text-xs uppercase tracking-wider text-violet-700">
                    Nhận xét của Giảng viên hướng dẫn
                  </b>
                  <p className="mt-1">{report.feedback}</p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  {report.file && (
                    <ReportFileDetails
                      file={report.file}
                      onDownload={download}
                    />
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(report.status === "DRAFT" ||
                    report.status === "REJECTED") &&
                    canModifyPlacementReports(report.placement) && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEdit(report)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          {report.status === "REJECTED"
                            ? "Chỉnh sửa & nộp lại"
                            : "Chỉnh sửa nháp"}
                        </button>
                        {report.status === "DRAFT" && (
                          <button
                            type="button"
                            disabled={submittingId === report.id}
                            onClick={() => void handleQuickSubmit(report)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Send className="h-3.5 w-3.5" />
                            {submittingId === report.id
                              ? "Đang gửi..."
                              : "Gửi duyệt"}
                          </button>
                        )}
                      </>
                    )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5 sm:px-8">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
                  <FileText className="h-4 w-4" />
                  {form.week === 0
                    ? "Hồ sơ nghiệm thu cuối kỳ"
                    : "Nhật ký tiến độ thực tập"}
                </div>
                <h3 className="mt-1 text-xl font-extrabold text-slate-900">
                  {editing
                    ? form.week === 0
                      ? "Cập nhật Báo cáo tổng kết thực tập"
                      : `Chỉnh sửa báo cáo tuần ${editing.week}`
                    : form.week === 0
                      ? "Nộp Báo cáo tổng kết thực tập cuối kỳ"
                      : "Viết báo cáo thực tập tuần"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {form.week === 0
                    ? "Đính kèm cuốn báo cáo tổng kết thực tập hoàn chỉnh và tóm tắt kết quả đạt được."
                    : "Bạn có thể lưu bản nháp để viết tiếp trong tuần hoặc gửi thẳng cho giảng viên duyệt."}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="space-y-5 px-6 py-6 sm:px-8">
              {error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {error}
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-800">
                    Đợt thực tập <span className="text-rose-500">*</span>
                  </span>
                  <select
                    disabled={Boolean(editing) || form.week === 0}
                    required
                    value={form.placementId}
                    onChange={(event) => {
                      const placement = placements.find(
                        (item) => item.id === event.target.value,
                      );
                      const weeks = placement ? availableWeeks(placement) : [];
                      setForm({
                        ...form,
                        placementId: event.target.value,
                        week: weeks.at(-1) ?? 1,
                      });
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                  >
                    <option value="">Chọn đợt thực tập</option>
                    {placements.map((placement) => (
                      <option key={placement.id} value={placement.id}>
                        {placement.internship.title} —{" "}
                        {placement.company.companyName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-800">
                    Kỳ báo cáo <span className="text-rose-500">*</span>
                  </span>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <select
                      disabled={Boolean(editing) || form.week === 0}
                      required
                      value={form.week}
                      onChange={(event) => {
                        const nextWeek = Number(event.target.value);
                        setForm({
                          ...form,
                          week: nextWeek,
                          title: `Báo cáo công việc thực tập tuần ${nextWeek}`,
                        });
                      }}
                      className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                    >
                      {form.week === 0 ? (
                        <option value={0}>Tổng kết cuối kỳ</option>
                      ) : editing ? (
                        <option value={editing.week}>
                          Tuần {editing.week}
                        </option>
                      ) : (
                        selectedWeeks.map((week) => (
                          <option key={week} value={week}>
                            Tuần {week}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-800">
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
                  className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-800">
                  {form.week === 0
                    ? "Tóm tắt kết quả đạt được trong toàn kỳ thực tập"
                    : "Nội dung công việc trong tuần"}{" "}
                  <span className="text-rose-500">*</span>
                </span>
                <textarea
                  required
                  rows={7}
                  value={form.content}
                  onChange={(event) =>
                    setForm({ ...form, content: event.target.value })
                  }
                  placeholder={
                    form.week === 0
                      ? "• Tổng quan nhiệm vụ được giao tại doanh nghiệp\n• Các sản phẩm/module đã hoàn thành\n• Kiến thức & kỹ năng chuyên môn tích lũy được\n• Tự đánh giá mức độ hoàn thành mục tiêu thực tập"
                      : "• Công việc đã thực hiện trong tuần\n• Kết quả đạt được / Sản phẩm bàn giao\n• Khó khăn gặp phải và hướng xử lý\n• Kế hoạch công việc tuần tiếp theo"
                  }
                  className="w-full resize-y rounded-xl border border-slate-300 px-3 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <div>
                <span className="mb-2 block text-sm font-bold text-slate-800">
                  {form.week === 0 ? (
                    <>
                      Tệp Báo cáo tổng kết thực tập{" "}
                      <span className="text-rose-500">*</span>{" "}
                      <span className="font-normal text-slate-500">
                        (Bắt buộc PDF, DOC, DOCX · tối đa 10 MB)
                      </span>
                    </>
                  ) : (
                    <>
                      Tệp minh chứng đính kèm{" "}
                      <span className="font-normal text-slate-400">
                        (PDF, DOC, DOCX · tối đa 10 MB · không bắt buộc)
                      </span>
                    </>
                  )}
                </span>
                <input
                  ref={inputRef}
                  accept=".pdf,.doc,.docx"
                  type="file"
                  className="hidden"
                  onChange={(event) =>
                    setForm({ ...form, file: event.target.files?.[0] ?? null })
                  }
                />
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex w-full items-center gap-3 rounded-xl border border-dashed border-blue-300 bg-blue-50/60 p-4 text-left hover:bg-blue-50"
                >
                  <span className="rounded-lg bg-white p-2 text-blue-600 shadow-xs">
                    <Upload className="h-5 w-5" />
                  </span>
                  <span>
                    <b className="block text-sm text-slate-800">
                      {form.file?.name ||
                        editing?.file?.originalName ||
                        (form.week === 0
                          ? "Chọn tệp Cuốn báo cáo tổng kết thực tập (PDF/DOCX)"
                          : "Chọn tệp minh chứng để đính kèm")}
                    </b>
                    <span className="text-xs text-slate-500">
                      {form.file
                        ? formatFileSize(form.file.size)
                        : editing?.file
                          ? `Tệp hiện tại: ${editing.file.originalName} (${formatFileSize(editing.file.sizeBytes)})`
                          : form.week === 0
                            ? "Bắt buộc đính kèm khi bấm Gửi giảng viên duyệt"
                            : "Tệp minh chứng là không bắt buộc đối với báo cáo tuần"}
                    </span>
                  </span>
                </button>
              </div>
            </div>
            <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-between sm:px-8">
              <button
                type="button"
                onClick={close}
                className="rounded-xl px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200"
              >
                Hủy
              </button>
              <div className="flex flex-col gap-2 sm:flex-row">
                {(!editing || editing.status === "DRAFT") && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void saveReport("DRAFT")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    Lưu bản nháp
                  </button>
                )}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveReport("SUBMIT")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {saving
                    ? "Đang xử lý..."
                    : editing?.status === "REJECTED"
                      ? "Cập nhật & Nộp lại cho GVHD"
                      : "Gửi giảng viên duyệt"}
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};
