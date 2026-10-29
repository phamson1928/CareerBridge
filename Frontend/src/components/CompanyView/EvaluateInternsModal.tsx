import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  Download,
  FileBadge2,
  FileText,
  Save,
  Upload,
  UserRound,
} from "lucide-react";
import type {
  CreateEvaluationInput,
  EvaluationRecord,
  UpdateEvaluationInput,
} from "../../evaluations/api";
import { downloadPrivateFile, uploadPrivateFile } from "../../files/api";
import type { PlacementRecord } from "../../placements/types";
import { reportsApi } from "../../reports/api";
import type { ReportRecord } from "../../reports/types";
import { formatDate, formatFileSize } from "../../utils/format";

interface Props {
  placements: PlacementRecord[];
  evaluations: EvaluationRecord[];
  onSubmit: (input: CreateEvaluationInput) => Promise<void>;
  onUpdate: (id: string, input: UpdateEvaluationInput) => Promise<void>;
}

export function EvaluateInternsModal({
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
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [studentReports, setStudentReports] = useState<ReportRecord[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedId = placementId || evaluable[0]?.id || "";
  const selectedPlacement = evaluable.find((p) => p.id === selectedId) ?? null;
  const existing = evaluations.find(
    (item) => item.placementId === selectedId && item.type === "COMPANY",
  );
  const isLocked = selectedPlacement?.status === "COMPLETED";

  useEffect(() => {
    setScore(existing?.score ?? 8.0);
    setComment(existing?.comment ?? "");
    setCertificateFile(null);
  }, [existing?.id, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setStudentReports([]);
      return;
    }
    setLoadingReports(true);
    void reportsApi
      .company({ placementId: selectedId, limit: 100 })
      .then((res) => setStudentReports(res.items))
      .catch(() => setStudentReports([]))
      .finally(() => setLoadingReports(false));
  }, [selectedId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId || isLocked) return;
    setSaving(true);
    try {
      const uploadedCertId = certificateFile
        ? (await uploadPrivateFile(certificateFile, "CERTIFICATE")).id
        : undefined;
      if (existing) {
        await onUpdate(existing.id, {
          score,
          comment,
          ...(uploadedCertId ? { certificateFileId: uploadedCertId } : {}),
        });
      } else {
        await onSubmit({
          placementId: selectedId,
          score,
          comment,
          ...(uploadedCertId ? { certificateFileId: uploadedCertId } : {}),
        });
      }
      setCertificateFile(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-linear-to-br from-emerald-950 via-teal-900 to-slate-900 p-6 text-white shadow-lg sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-100">
          <Building2 className="h-3.5 w-3.5" /> Đánh giá doanh nghiệp & Chứng nhận
        </div>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
          Đánh giá Thực tập sinh
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/85">
          Chấm điểm tổng kết, nhận xét quá trình làm việc và đính kèm tệp Chứng nhận thực tập (nếu có) cho sinh viên.
        </p>
      </header>

      {evaluable.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Hiện chưa có thực tập sinh nào đang trong giai đoạn thực tập hoặc chờ đánh giá tại doanh nghiệp của bạn.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <form
            onSubmit={submit}
            className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs"
          >
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Chọn thực tập sinh
              </label>
              <select
                value={selectedId}
                onChange={(event) => setPlacementId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-600"
              >
                {evaluable.map((placement) => (
                  <option key={placement.id} value={placement.id}>
                    {placement.student.fullName} ({placement.student.studentCode}) —{" "}
                    {placement.internship.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedPlacement && (
              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-600">
                <div>
                  <span className="font-semibold text-slate-500">Chuyên ngành:</span>{" "}
                  <b className="text-slate-800">{selectedPlacement.student.major}</b>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Thời gian:</span>{" "}
                  <b className="text-slate-800">
                    {formatDate(selectedPlacement.startDate)} –{" "}
                    {formatDate(selectedPlacement.endDate)}
                  </b>
                </div>
              </div>
            )}

            <label className="block text-sm font-bold text-slate-800">
              Điểm đánh giá doanh nghiệp (0–10){" "}
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
                className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm font-black text-slate-900 outline-none focus:border-emerald-600"
              />
            </label>

            <label className="block text-sm font-bold text-slate-800">
              Nhận xét của doanh nghiệp{" "}
              <span className="text-rose-500">*</span>
              <textarea
                disabled={isLocked}
                required
                rows={4}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Nhận xét về thái độ làm việc, kỹ năng chuyên môn và kết quả thực tập của sinh viên..."
                className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm font-normal outline-none focus:border-emerald-600"
              />
            </label>

            {/* SIMPLE CERTIFICATE FILE UPLOAD */}
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                <FileBadge2 className="h-4 w-4 text-emerald-600" />
                Tệp Chứng nhận thực tập (PDF, PNG, JPG · không bắt buộc)
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => setCertificateFile(e.target.files?.[0] ?? null)}
              />
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    <Upload className="h-4 w-4" />
                    {certificateFile
                      ? `${certificateFile.name} (${formatFileSize(certificateFile.size)})`
                      : existing?.certificateFile
                        ? "Đổi tệp chứng nhận"
                        : "Chọn tệp chứng nhận"}
                  </button>
                )}

                {existing?.certificateFile && (
                  <button
                    type="button"
                    onClick={() =>
                      void downloadPrivateFile(existing.certificateFile!.id)
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {existing.certificateFile.originalName}
                  </button>
                )}
              </div>
            </div>

            {existing && (
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                <UserRound className="h-4 w-4 text-emerald-600" />
                <span>
                  Người đánh giá: <b>{existing.evaluator.email}</b>
                </span>
              </div>
            )}

            {!isLocked ? (
              <button
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:bg-slate-400"
              >
                <Save className="h-4 w-4" />
                {saving
                  ? "Đang lưu..."
                  : existing
                    ? "Cập nhật đánh giá"
                    : "Lưu đánh giá"}
              </button>
            ) : (
              <p className="rounded-xl bg-slate-100 p-3 text-center text-xs font-semibold text-slate-600">
                Hồ sơ thực tập đã hoàn tất, không thể chỉnh sửa đánh giá.
              </p>
            )}
          </form>

          {/* STUDENT REPORTS OVERVIEW FOR COMPANY */}
          <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Báo cáo của thực tập sinh
                </h3>
                <p className="text-xs text-slate-500">
                  Báo cáo tuần (tối đa 10 tuần) và báo cáo tổng kết cuối kỳ
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                {studentReports.length} báo cáo
              </span>
            </div>

            {loadingReports ? (
              <p className="py-8 text-center text-xs text-slate-500">
                Đang tải báo cáo của thực tập sinh...
              </p>
            ) : studentReports.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                Thực tập sinh chưa nộp báo cáo nào.
              </div>
            ) : (
              <div className="max-h-[480px] space-y-3 overflow-y-auto pr-1">
                {studentReports.map((report) => (
                  <div
                    key={report.id}
                    className={`rounded-2xl border p-4 text-xs ${report.week === 0 ? "border-indigo-200 bg-indigo-50/40" : "border-slate-200 bg-slate-50/60"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-900">
                        {report.week === 0
                          ? "★ Báo cáo tổng kết cuối kỳ"
                          : `Tuần ${report.week}: ${report.title || "Báo cáo tuần"}`}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${report.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : report.status === "REJECTED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}
                      >
                        {report.status === "APPROVED"
                          ? "Đã duyệt"
                          : report.status === "REJECTED"
                            ? "Cần sửa"
                            : "Chờ duyệt"}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-slate-700 leading-5">
                      {report.content}
                    </p>
                    {report.file && (
                      <button
                        type="button"
                        onClick={() => void downloadPrivateFile(report.file!.id)}
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                      >
                        <FileText className="h-3.5 w-3.5 text-blue-600" />
                        Tải tệp: {report.file.originalName}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
