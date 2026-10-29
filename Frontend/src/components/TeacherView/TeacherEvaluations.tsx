import React, { useEffect, useMemo, useState } from "react";
import {
  Award,
  BookOpenCheck,
  Download,
  FileBadge2,
  GraduationCap,
  Save,
} from "lucide-react";
import type {
  CreateEvaluationInput,
  EvaluationRecord,
  UpdateEvaluationInput,
} from "../../evaluations/api";
import { downloadPrivateFile } from "../../files/api";
import type { PlacementRecord } from "../../placements/types";
import { reportsApi } from "../../reports/api";
import type { ReportRecord } from "../../reports/types";
import { formatDate } from "../../utils/format";

interface Props {
  placements: PlacementRecord[];
  evaluations: EvaluationRecord[];
  onSubmit: (input: CreateEvaluationInput) => Promise<void>;
  onUpdate: (id: string, input: UpdateEvaluationInput) => Promise<void>;
}

export function TeacherEvaluations({
  placements,
  evaluations,
  onSubmit,
  onUpdate,
}: Props) {
  const evaluable = useMemo(
    () =>
      placements.filter(
        (placement) =>
          (placement.status === "ACTIVE" || placement.status === "COMPLETED") &&
          (placement.academicStatus === "ACTIVE" ||
            placement.academicStatus === "CLOSED"),
      ),
    [placements],
  );
  const [placementId, setPlacementId] = useState("");
  const [score, setScore] = useState(8.0);
  const [comment, setComment] = useState("");
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [saving, setSaving] = useState(false);

  const selectedId = placementId || evaluable[0]?.id || "";
  const selectedPlacement = evaluable.find((p) => p.id === selectedId) ?? null;
  const lecturerEvaluation = evaluations.find(
    (item) => item.placementId === selectedId && item.type === "LECTURER",
  );
  const companyEvaluation = evaluations.find(
    (item) => item.placementId === selectedId && item.type === "COMPANY",
  );
  const isLocked = selectedPlacement?.status === "COMPLETED";

  const combinedFinalScore = useMemo(() => {
    if (!companyEvaluation) return null;
    return Math.round(((companyEvaluation.score + score) / 2) * 100) / 100;
  }, [companyEvaluation, score]);

  useEffect(() => {
    setScore(lecturerEvaluation?.score ?? 8.0);
    setComment(lecturerEvaluation?.comment ?? "");
  }, [lecturerEvaluation?.id, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setReports([]);
      return;
    }
    void reportsApi
      .supervised({ placementId: selectedId, limit: 100 })
      .then((res) => setReports(res.items))
      .catch(() => setReports([]));
  }, [selectedId]);

  const finalReport = reports.find((r) => r.week === 0) ?? null;
  const weeklyReports = reports.filter((r) => r.week > 0);
  const approvedWeeklyCount = weeklyReports.filter(
    (r) => r.status === "APPROVED",
  ).length;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId || isLocked) return;
    setSaving(true);
    try {
      if (lecturerEvaluation) {
        await onUpdate(lecturerEvaluation.id, { score, comment });
      } else {
        await onSubmit({ placementId: selectedId, score, comment });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-linear-to-br from-violet-950 via-indigo-900 to-slate-900 p-6 text-white shadow-lg sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-violet-100">
          <GraduationCap className="h-3.5 w-3.5" /> Đánh giá thực tập
        </div>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
          Chấm điểm & Nhận xét Sinh viên Hướng dẫn
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-violet-100/85">
          Xem tiến độ báo cáo thực tập, kết quả đánh giá từ doanh nghiệp và nhập điểm đánh giá của giảng viên hướng dẫn (thang điểm 10).
        </p>
      </header>

      {evaluable.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Chưa có sinh viên nào trong danh sách hướng dẫn để chấm điểm.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <form
            onSubmit={submit}
            className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs"
          >
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Chọn sinh viên hướng dẫn
              </label>
              <select
                value={selectedId}
                onChange={(event) => setPlacementId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-bold text-slate-900 outline-none focus:border-violet-600"
              >
                {evaluable.map((placement) => (
                  <option key={placement.id} value={placement.id}>
                    {placement.student.fullName} ({placement.student.studentCode}) —{" "}
                    {placement.company.companyName}
                  </option>
                ))}
              </select>
            </div>

            <label className="block text-sm font-bold text-slate-800">
              Điểm của giảng viên hướng dẫn (0–10){" "}
              <span className="text-rose-500">*</span>
              <input
                disabled={isLocked}
                required
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={score}
                onChange={(event) => setScore(Number(event.target.value))}
                className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm font-black text-slate-900 outline-none focus:border-violet-600"
              />
            </label>

            {combinedFinalScore !== null && (
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs">
                <span className="font-semibold text-slate-600">
                  Điểm tổng kết hệ 10 (50% DN + 50% GVHD):
                </span>
                <span className="text-base font-black text-indigo-700">
                  {combinedFinalScore.toFixed(2)}/10
                </span>
              </div>
            )}

            <label className="block text-sm font-bold text-slate-800">
              Nhận xét của giảng viên hướng dẫn{" "}
              <span className="text-rose-500">*</span>
              <textarea
                disabled={isLocked}
                required
                rows={4}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Nhận xét về quá trình báo cáo tuần và chất lượng báo cáo tổng kết thực tập của sinh viên..."
                className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm font-normal outline-none focus:border-violet-600"
              />
            </label>

            {!isLocked ? (
              <button
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:bg-slate-400"
              >
                <Save className="h-4 w-4" />
                {saving
                  ? "Đang lưu..."
                  : lecturerEvaluation
                    ? "Cập nhật đánh giá"
                    : "Lưu đánh giá"}
              </button>
            ) : (
              <p className="rounded-xl bg-slate-100 p-3 text-center text-xs font-semibold text-slate-600">
                Hồ sơ thực tập đã hoàn tất.
              </p>
            )}
          </form>

          {/* RIGHT SIDE: REPORT INFO & COMPANY EVALUATION */}
          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
                1. Thông tin Báo cáo của Sinh viên
              </h3>
              {selectedPlacement && (
                <p className="mt-1 text-xs text-slate-500">
                  Lịch thực tập: {formatDate(selectedPlacement.startDate)} –{" "}
                  {formatDate(selectedPlacement.endDate)}
                </p>
              )}

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3.5">
                  <p className="text-xs font-semibold text-slate-500">
                    Báo cáo tuần (tối đa 10 tuần)
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-900">
                    {approvedWeeklyCount}/{weeklyReports.length} đã duyệt
                  </p>
                </div>
                <div className="rounded-2xl bg-indigo-50/70 p-3.5">
                  <p className="text-xs font-semibold text-indigo-700">
                    Báo cáo tổng kết cuối kỳ
                  </p>
                  <p className="mt-1 text-sm font-black text-indigo-950">
                    {finalReport
                      ? finalReport.status === "APPROVED"
                        ? "Đã phê duyệt"
                        : finalReport.status === "SUBMITTED"
                          ? "Đang chờ duyệt"
                          : "Cần bổ sung"
                      : "Chưa nộp"}
                  </p>
                </div>
              </div>

              {finalReport?.file && (
                <div className="mt-3 flex items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50/40 p-3 text-xs">
                  <span className="flex items-center gap-2 font-bold text-indigo-950 truncate">
                    <BookOpenCheck className="h-4 w-4 shrink-0 text-indigo-600" />
                    <span className="truncate">{finalReport.file.originalName}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => void downloadPrivateFile(finalReport.file!.id)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 font-bold text-white hover:bg-indigo-700"
                  >
                    <Download className="h-3.5 w-3.5" /> Tải tệp
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
                2. Kết quả Đánh giá từ Doanh nghiệp
              </h3>

              {!companyEvaluation ? (
                <div className="mt-3 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                  Doanh nghiệp chưa gửi kết quả đánh giá cho sinh viên này.
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-3.5">
                    <div>
                      <p className="text-xs font-bold text-emerald-900">
                        {companyEvaluation.placement.company.companyName}
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        Người đánh giá: {companyEvaluation.evaluator.email}
                      </p>
                    </div>
                    <span className="rounded-xl bg-white px-3 py-1.5 text-sm font-black text-emerald-700 shadow-2xs">
                      <Award className="mr-1 inline h-4 w-4" />
                      {companyEvaluation.score}/10
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-700">
                    <b className="block text-slate-900">Nhận xét của Doanh nghiệp:</b>
                    {companyEvaluation.comment || "Không có nhận xét chi tiết."}
                  </div>

                  {companyEvaluation.certificateFile && (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs">
                      <span className="flex items-center gap-2 font-bold text-emerald-900">
                        <FileBadge2 className="h-4 w-4 text-emerald-600" />
                        Chứng nhận thực tập doanh nghiệp
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          void downloadPrivateFile(
                            companyEvaluation.certificateFile!.id,
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white hover:bg-emerald-700"
                      >
                        <Download className="h-3.5 w-3.5" /> Tải về
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
