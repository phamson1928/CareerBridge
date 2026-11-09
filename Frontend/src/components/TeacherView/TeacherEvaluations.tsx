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
import { downloadExcelWorkbook } from "../../utils/excelExport";
import { semestersApi } from "../../semesters/api";
import type { SemesterRecord } from "../../semesters/types";
import { findDefaultSemester, toSemesterSlug } from "../../semesters/utils";

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
  const [semesters, setSemesters] = useState<SemesterRecord[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  const [placementId, setPlacementId] = useState("");
  const [score, setScore] = useState(8.0);
  const [comment, setComment] = useState("");
  const [reports, setReports] = useState<ReportRecord[]>([]);

  useEffect(() => {
    semestersApi
      .list({ limit: 100 })
      .then((res) => {
        setSemesters(res.items);
        const def = findDefaultSemester(res.items, "LECTURER");
        if (def) setSelectedSemesterId(def.id);
      })
      .catch(() => {});
  }, []);
  const [saving, setSaving] = useState(false);

  const filteredEvaluable = useMemo(
    () =>
      evaluable.filter(
        (placement) =>
          !selectedSemesterId ||
          selectedSemesterId === "ALL" ||
          placement.semester.id === selectedSemesterId,
      ),
    [evaluable, selectedSemesterId],
  );

  const selectedId =
    (filteredEvaluable.some((p) => p.id === placementId) ? placementId : "") ||
    filteredEvaluable[0]?.id ||
    "";
  const selectedPlacement =
    filteredEvaluable.find((p) => p.id === selectedId) ?? null;
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

  const exportGradesExcel = () => {
    const currentSem = semesters.find((s) => s.id === selectedSemesterId);
    const semLabel = currentSem ? currentSem.name : "Tất cả học kỳ";
    const fileSlug = currentSem ? toSemesterSlug(currentSem.name) : "tat-ca-hoc-ky";
    downloadExcelWorkbook(`bang-diem-thuc-tap-${fileSlug}`, [
      {
        name: "Bang diem thuc tap",
        title: `BẢNG ĐIỂM ĐÁNH GIÁ THỰC TẬP — ${semLabel.toUpperCase()}`,
        subtitle: `Học kỳ: ${semLabel} — Ngày xuất: ${new Date().toLocaleDateString("vi-VN")} — Tổng số: ${filteredEvaluable.length} sinh viên`,
        columns: [
          { header: "STT", width: 50, value: (_, i) => i + 1 },
          {
            header: "Mã sinh viên",
            width: 110,
            value: (p) => p.student.studentCode,
          },
          {
            header: "Họ và tên",
            width: 160,
            value: (p) => p.student.fullName,
          },
          {
            header: "Ngành đào tạo",
            width: 170,
            value: (p) => p.student.majorRef?.name ?? p.student.major,
          },
          {
            header: "Khoa",
            width: 170,
            value: (p) =>
              p.student.faculty?.name ??
              p.student.majorRef?.faculty?.name ??
              "—",
          },
          {
            header: "Doanh nghiệp thực tập",
            width: 190,
            value: (p) => p.company.companyName,
          },
          {
            header: "Vị trí thực tập",
            width: 170,
            value: (p) => p.internship.title,
          },
          {
            header: "Điểm Doanh nghiệp (50%)",
            width: 130,
            value: (p) => {
              const comp = evaluations.find(
                (e) => e.placementId === p.id && e.type === "COMPANY",
              );
              return comp ? comp.score : "Chưa chấm";
            },
          },
          {
            header: "Điểm GVHD (50%)",
            width: 120,
            value: (p) => {
              const lect = evaluations.find(
                (e) => e.placementId === p.id && e.type === "LECTURER",
              );
              return lect ? lect.score : "Chưa chấm";
            },
          },
          {
            header: "Điểm Tổng kết (Hệ 10)",
            width: 130,
            value: (p) => {
              const comp = evaluations.find(
                (e) => e.placementId === p.id && e.type === "COMPANY",
              );
              const lect = evaluations.find(
                (e) => e.placementId === p.id && e.type === "LECTURER",
              );
              if (!comp || !lect) return "Chưa đủ điểm";
              return Math.round(((comp.score + lect.score) / 2) * 100) / 100;
            },
          },
          {
            header: "Trạng thái hồ sơ",
            width: 130,
            value: (p) =>
              p.status === "COMPLETED" ? "Đã nghiệm thu" : "Đang thực tập",
          },
        ],
        rows: filteredEvaluable,
      },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Modern Clean SaaS Page Header */}
      <header className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-800 mb-2">
              <GraduationCap className="h-3.5 w-3.5 text-teal-600" /> Đánh giá thực tập
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Chấm Điểm & Nhận Xét Sinh Viên Hướng Dẫn
            </h2>
            <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-500">
              Xem tiến độ báo cáo thực tập, kết quả đánh giá từ doanh nghiệp và nhập điểm đánh giá của giảng viên hướng dẫn (thang điểm 10).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedSemesterId}
              onChange={(e) => setSelectedSemesterId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-teal-600 focus:bg-white transition-all"
            >
              <option value="ALL">Tất cả học kỳ</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
            {filteredEvaluable.length > 0 && (
              <button
                type="button"
                onClick={exportGradesExcel}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-teal-300 hover:text-teal-800 active:scale-95 transition-all"
              >
                <Download className="h-4 w-4" /> Xuất bảng điểm Excel
              </button>
            )}
          </div>
        </div>
      </header>

      {filteredEvaluable.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-10 text-center text-sm text-slate-500">
          Chưa có sinh viên nào trong học kỳ này để chấm điểm.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] bento-stagger">
          <form
            onSubmit={submit}
            className="space-y-5 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs"
          >
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Chọn sinh viên hướng dẫn
              </label>
              <select
                value={selectedId}
                onChange={(event) => setPlacementId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-900 outline-none focus:border-teal-600 focus:bg-white transition-all"
              >
                {filteredEvaluable.map((placement) => (
                  <option key={placement.id} value={placement.id}>
                    {placement.student.fullName} ({placement.student.studentCode})
                    {placement.student.major ? ` · ${placement.student.major}` : ""} —{" "}
                    {placement.company.companyName}
                  </option>
                ))}
              </select>
              {selectedPlacement && (
                <p className="mt-2 text-xs font-semibold text-teal-800">
                  Ngành:{" "}
                  {selectedPlacement.student.majorRef?.name ??
                    selectedPlacement.student.major}
                  {selectedPlacement.student.faculty?.name ||
                  selectedPlacement.student.majorRef?.faculty?.name
                    ? ` · Khoa ${selectedPlacement.student.faculty?.name ?? selectedPlacement.student.majorRef?.faculty?.name}`
                    : ""}
                </p>
              )}
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
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-black text-slate-900 outline-none focus:border-teal-600 focus:bg-white transition-all"
              />
            </label>

            {combinedFinalScore !== null && (
              <div className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-3 text-xs">
                <span className="font-semibold text-slate-700">
                  Điểm tổng kết hệ 10 (50% DN + 50% GVHD):
                </span>
                <span className="text-base font-black text-teal-800">
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
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-normal outline-none focus:border-teal-600 focus:bg-white transition-all"
              />
            </label>

            {!isLocked ? (
              <button
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white shadow-xs transition-all hover:bg-teal-800 active:scale-95 disabled:bg-slate-400"
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
