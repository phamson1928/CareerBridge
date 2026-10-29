import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpenCheck,
  Check,
  ClipboardCheck,
  Filter,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { downloadPrivateFile } from "../../files/api";
import { ReportFileDetails } from "../../reports/ReportFileDetails";
import { reportsApi } from "../../reports/api";
import type { ReportRecord, ReportStatus } from "../../reports/types";
import { formatDateTime } from "../../utils/format";

const statusBadge: Record<ReportStatus, { label: string; className: string }> = {
  DRAFT: {
    label: "Bản nháp",
    className: "bg-slate-100 text-slate-700 border border-slate-200",
  },
  SUBMITTED: {
    label: "Chờ giảng viên duyệt",
    className: "bg-amber-50 text-amber-800 border border-amber-200",
  },
  APPROVED: {
    label: "Đã phê duyệt",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  REJECTED: {
    label: "Yêu cầu bổ sung",
    className: "bg-rose-50 text-rose-700 border border-rose-200",
  },
};

export const ReviewReports = () => {
  const [items, setItems] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReportRecord | null>(null);
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("SUBMITTED");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "FINAL" | "WEEKLY">("ALL");
  const [placementFilter, setPlacementFilter] = useState<string>("");
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.supervised({ limit: 100 });
      setItems(res.items.filter((item) => item.status !== "DRAFT"));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const studentOptions = useMemo(() => {
    const map = new Map<string, { placementId: string; label: string }>();
    for (const r of items) {
      if (!map.has(r.placementId)) {
        map.set(r.placementId, {
          placementId: r.placementId,
          label: `${r.placement.student.fullName} (${r.placement.student.studentCode}) — ${r.placement.company.companyName}`,
        });
      }
    }
    return Array.from(map.values());
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (placementFilter && item.placementId !== placementFilter) return false;
      if (typeFilter === "FINAL" && item.week !== 0) return false;
      if (typeFilter === "WEEKLY" && item.week === 0) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const match = [
          item.placement.student.fullName,
          item.placement.student.studentCode,
          item.placement.company.companyName,
          item.title ?? "",
          item.content,
        ].some((val) => val.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [items, placementFilter, search, statusFilter, typeFilter]);

  const metrics = useMemo(
    () => ({
      pending: items.filter((r) => r.status === "SUBMITTED").length,
      pendingFinal: items.filter(
        (r) => r.status === "SUBMITTED" && r.week === 0,
      ).length,
      approved: items.filter((r) => r.status === "APPROVED").length,
      rejected: items.filter((r) => r.status === "REJECTED").length,
    }),
    [items],
  );

  const review = async (status: "APPROVED" | "REJECTED") => {
    if (!selected) return;
    if (status === "REJECTED" && !feedback.trim()) {
      setModalError(
        "Vui lòng nhập nhận xét chi tiết để sinh viên biết cần chỉnh sửa nội dung gì.",
      );
      return;
    }
    setBusy(true);
    setModalError("");
    try {
      await reportsApi.review(selected.id, {
        status,
        feedback: feedback.trim() || undefined,
      });
      setSelected(null);
      setFeedback("");
      await load();
    } catch (requestError) {
      setModalError(getApiErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const download = async (fileId: string) => {
    try {
      await downloadPrivateFile(fileId);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-linear-to-br from-violet-950 via-indigo-900 to-slate-900 p-6 text-white shadow-lg sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-violet-100">
          <ClipboardCheck className="h-3.5 w-3.5" /> Kiểm duyệt tiến độ & Nghiệm thu học vụ
        </div>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
          Duyệt Nhật ký tuần & Báo cáo tổng kết
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-violet-100/85">
          Rà soát nhật ký công việc hàng tuần và phê duyệt Cuốn báo cáo tổng kết thực tập cuối kỳ của sinh viên trước khi chấm điểm kết thúc học phần.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => {
            setStatusFilter("SUBMITTED");
            setTypeFilter("ALL");
          }}
          className={`rounded-2xl border p-4 text-left transition ${statusFilter === "SUBMITTED" && typeFilter === "ALL" ? "border-amber-400 bg-amber-50/70" : "border-slate-200 bg-white"}`}
        >
          <span className="text-xs font-bold text-amber-700">Đang chờ duyệt</span>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {metrics.pending}
          </p>
        </button>
        <button
          type="button"
          onClick={() => {
            setStatusFilter("SUBMITTED");
            setTypeFilter("FINAL");
          }}
          className={`rounded-2xl border p-4 text-left transition ${typeFilter === "FINAL" ? "border-indigo-400 bg-indigo-50/70" : "border-slate-200 bg-white"}`}
        >
          <span className="text-xs font-bold text-indigo-700">
            Báo cáo tổng kết chờ duyệt
          </span>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {metrics.pendingFinal}
          </p>
        </button>
        <button
          type="button"
          onClick={() => {
            setStatusFilter("APPROVED");
            setTypeFilter("ALL");
          }}
          className={`rounded-2xl border p-4 text-left transition ${statusFilter === "APPROVED" ? "border-emerald-400 bg-emerald-50/70" : "border-slate-200 bg-white"}`}
        >
          <span className="text-xs font-bold text-emerald-700">Đã phê duyệt</span>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {metrics.approved}
          </p>
        </button>
        <button
          type="button"
          onClick={() => {
            setStatusFilter("REJECTED");
            setTypeFilter("ALL");
          }}
          className={`rounded-2xl border p-4 text-left transition ${statusFilter === "REJECTED" ? "border-rose-400 bg-rose-50/70" : "border-slate-200 bg-white"}`}
        >
          <span className="text-xs font-bold text-rose-700">Yêu cầu sửa lại</span>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {metrics.rejected}
          </p>
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm sinh viên, MSSV, nội dung..."
            className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={placementFilter}
          onChange={(e) => setPlacementFilter(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
        >
          <option value="">Tất cả sinh viên phụ trách</option>
          {studentOptions.map((opt) => (
            <option key={opt.placementId} value={opt.placementId}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value as "ALL" | "FINAL" | "WEEKLY")
          }
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
        >
          <option value="ALL">Mọi loại báo cáo</option>
          <option value="FINAL">Báo cáo tổng kết cuối kỳ</option>
          <option value="WEEKLY">Nhật ký báo cáo tuần</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="SUBMITTED">Chờ duyệt</option>
          <option value="APPROVED">Đã phê duyệt</option>
          <option value="REJECTED">Yêu cầu bổ sung</option>
        </select>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="mr-1.5 inline h-4 w-4" />
          {error}
        </p>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">
          Đang tải danh sách báo cáo của sinh viên...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Filter className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-800">
            Không có báo cáo nào khớp với bộ lọc hiện tại
          </p>
          {statusFilter !== "" && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("");
                setTypeFilter("ALL");
                setPlacementFilter("");
                setSearch("");
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Xem toàn bộ báo cáo
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((report) => {
            const isFinal = report.week === 0;
            const badge = statusBadge[report.status];
            return (
              <article
                key={report.id}
                className={`rounded-2xl border bg-white p-5 shadow-xs ${isFinal ? "border-indigo-300 ring-1 ring-indigo-100" : "border-slate-200"}`}
              >
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold ${isFinal ? "bg-indigo-600 text-white" : "bg-violet-50 text-violet-700"}`}
                    >
                      {isFinal ? <BookOpenCheck className="h-5 w-5" /> : `T${report.week}`}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${isFinal ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-600"}`}
                        >
                          {isFinal
                            ? "Báo cáo tổng kết cuối kỳ"
                            : `Nhật ký Tuần ${report.week}`}
                        </span>
                        <h3 className="font-bold text-slate-900">
                          {report.placement.student.fullName} (
                          {report.placement.student.studentCode})
                        </h3>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        {report.title ||
                          (isFinal
                            ? "Báo cáo tổng kết thực tập tốt nghiệp"
                            : `Báo cáo thực tập tuần ${report.week}`)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {report.placement.internship.title} ·{" "}
                        {report.placement.company.companyName}
                        {report.submittedAt &&
                          ` · Nộp lúc ${formatDateTime(report.submittedAt)}`}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`self-start rounded-full px-3 py-1 text-xs font-bold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-700">
                  {report.content}
                </p>

                {report.feedback && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                    <b className="text-slate-900">Nhận xét đã gửi:</b>{" "}
                    {report.feedback}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    {report.file && (
                      <ReportFileDetails
                        file={report.file}
                        onDownload={download}
                      />
                    )}
                  </div>
                  {report.status === "SUBMITTED" && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(report);
                        setFeedback(report.feedback ?? "");
                        setModalError("");
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-violet-700"
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      Kiểm duyệt & Nhận xét
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-violet-700">
                  {selected.week === 0
                    ? "Nghiệm thu Báo cáo tổng kết cuối kỳ"
                    : `Duyệt báo cáo tuần ${selected.week}`}
                </span>
                <h3 className="mt-1 text-lg font-extrabold text-slate-900">
                  {selected.placement.student.fullName} (
                  {selected.placement.student.studentCode})
                </h3>
                <p className="text-xs text-slate-500">
                  {selected.placement.company.companyName} ·{" "}
                  {selected.placement.internship.title}
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                onClick={() => setSelected(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 max-h-48 overflow-y-auto rounded-xl bg-slate-50 p-3.5 text-xs leading-5 text-slate-700 whitespace-pre-line">
              {selected.content}
            </div>

            {selected.file && (
              <div className="mt-3">
                <ReportFileDetails
                  file={selected.file}
                  onDownload={download}
                />
              </div>
            )}

            {modalError && (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
                {modalError}
              </p>
            )}

            <label className="mt-4 block text-xs font-bold text-slate-700">
              Nhận xét của giảng viên hướng dẫn{" "}
              <span className="font-normal text-slate-500">
                (bắt buộc nếu yêu cầu sinh viên sửa lại)
              </span>
              <textarea
                rows={4}
                className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="Nhập đánh giá tiến độ hoặc các điểm sinh viên cần bổ sung, chỉnh sửa..."
              />
            </label>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => void review("REJECTED")}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-800 transition hover:bg-rose-100 disabled:opacity-50"
              >
                Yêu cầu chỉnh sửa
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void review("APPROVED")}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" /> Phê duyệt báo cáo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
