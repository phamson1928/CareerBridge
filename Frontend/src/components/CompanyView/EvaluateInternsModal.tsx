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
import { semestersApi } from "../../semesters/api";
import type { SemesterRecord } from "../../semesters/types";
import { findDefaultSemester, toSemesterSlug } from "../../semesters/utils";
import { downloadExcelWorkbook } from "../../utils/excelExport";

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
  const [semesters, setSemesters] = useState<SemesterRecord[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  const [placementId, setPlacementId] = useState("");
  const [score, setScore] = useState(8.0);
  const [comment, setComment] = useState("");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [studentReports, setStudentReports] = useState<ReportRecord[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    semestersApi
      .list({ limit: 100 })
      .then((res) => {
        setSemesters(res.items);
        const def = findDefaultSemester(res.items, "COMPANY");
        if (def) setSelectedSemesterId(def.id);
      })
      .catch(() => {});
  }, []);

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

  const exportCompanyEvaluationsExcel = () => {
    const currentSem = semesters.find((s) => s.id === selectedSemesterId);
    const semLabel = currentSem ? currentSem.name : "Tất cả học kỳ";
    const fileSlug = currentSem ? toSemesterSlug(currentSem.name) : "tat-ca-hoc-ky";
    downloadExcelWorkbook(`danh-gia-thuc-tap-sinh-${fileSlug}`, [
      {
        name: "Danh gia thuc tap",
        title: `BẢNG ĐÁNH GIÁ THỰC TẬP SINH DOANH NGHIỆP — ${semLabel.toUpperCase()}`,
        subtitle: `Học kỳ: ${semLabel} — Ngày xuất: ${new Date().toLocaleDateString("vi-VN")} — Tổng số: ${filteredEvaluable.length} thực tập sinh`,
        columns: [
          { header: "STT", width: 45, value: (_: any, i: number) => i + 1 },
          { header: "MSSV", width: 105, value: (p: any) => p.student.studentCode },
          { header: "Họ và tên", width: 165, value: (p: any) => p.student.fullName },
          { header: "Ngành đào tạo", width: 165, value: (p: any) => p.student.major },
          { header: "Vị trí thực tập", width: 170, value: (p: any) => p.internship.title },
          { header: "Học kỳ", width: 140, value: (p: any) => p.semester.name },
          {
            header: "Điểm DN",
            width: 90,
            value: (p: any) => {
              const ev = evaluations.find((e) => e.placementId === p.id && e.type === "COMPANY");
              return ev ? ev.score : "Chưa chấm";
            },
          },
          {
            header: "Nhận xét",
            width: 200,
            value: (p: any) => {
              const ev = evaluations.find((e) => e.placementId === p.id && e.type === "COMPANY");
              return ev ? ev.comment : "—";
            },
          },
          {
            header: "Trạng thái",
            width: 120,
            value: (p: any) => (p.status === "COMPLETED" ? "Đã hoàn tất" : "Đang thực tập"),
          },
        ],
        rows: filteredEvaluable,
      },
    ]);
  };

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
      {/* Page Header (Modern Clean SaaS Style) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200/60 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-800 mb-2">
            <Building2 className="h-3.5 w-3.5 text-teal-600" />
            <span>ĐÁNH GIÁ & CHỨNG NHẬN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Đánh giá Thực tập sinh
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Chấm điểm tổng kết, nhận xét quá trình làm việc và đính kèm tệp Chứng nhận thực tập (nếu có) cho sinh viên.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedSemesterId}
            onChange={(e) => setSelectedSemesterId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition shadow-2xs cursor-pointer"
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
              onClick={exportCompanyEvaluationsExcel}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-teal-50 border border-teal-200 px-4 py-2.5 text-xs font-bold text-teal-800 transition hover:bg-teal-100 shadow-2xs cursor-pointer"
            >
              <Download className="h-4 w-4 text-teal-700" /> Xuất bảng điểm Excel
            </button>
          )}
        </div>
      </div>

      {filteredEvaluable.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Không có thực tập sinh nào trong học kỳ này để đánh giá.
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
                {filteredEvaluable.map((placement) => (
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-teal-800 disabled:bg-slate-400 cursor-pointer"
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
