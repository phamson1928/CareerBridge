import { useMemo } from "react";
import {
  Award,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  FileBadge2,
  FileText,
  GraduationCap,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { EvaluationRecord } from "../../evaluations/api";
import { downloadPrivateFile } from "../../files/api";
import { formatDateTime } from "../../utils/format";

function getGradeClassification(score: number) {
  if (score >= 9.0)
    return {
      label: "Xuất sắc",
      badgeClass: "bg-emerald-400/20 text-emerald-100 border-emerald-300/40",
    };
  if (score >= 8.0)
    return {
      label: "Giỏi",
      badgeClass: "bg-teal-400/20 text-teal-100 border-teal-300/40",
    };
  if (score >= 7.0)
    return {
      label: "Khá",
      badgeClass: "bg-blue-400/20 text-blue-100 border-blue-300/40",
    };
  if (score >= 5.0)
    return {
      label: "Trung bình",
      badgeClass: "bg-amber-400/20 text-amber-100 border-amber-300/40",
    };
  return {
    label: "Chưa đạt",
    badgeClass: "bg-rose-400/20 text-rose-100 border-rose-300/40",
  };
}

export function StudentEvaluations({
  evaluations,
}: {
  evaluations: EvaluationRecord[];
}) {
  type PlacementEvalGroup = {
    placementId: string;
    placement: EvaluationRecord["placement"];
    companyEval?: EvaluationRecord;
    lecturerEval?: EvaluationRecord;
    finalScore: number | null;
  };

  const groups = useMemo<PlacementEvalGroup[]>(() => {
    const map = new Map<string, PlacementEvalGroup>();
    for (const ev of evaluations) {
      const existing = map.get(ev.placementId) ?? {
        placementId: ev.placementId,
        placement: ev.placement,
        finalScore: null,
      };
      if (ev.type === "COMPANY") existing.companyEval = ev;
      if (ev.type === "LECTURER") existing.lecturerEval = ev;
      if (existing.companyEval && existing.lecturerEval) {
        existing.finalScore =
          Math.round(
            ((existing.companyEval.score + existing.lecturerEval.score) / 2) *
              100,
          ) / 100;
      }
      map.set(ev.placementId, existing);
    }
    return Array.from(map.values());
  }, [evaluations]);

  return (
    <div className="space-y-6 w-full">
      {/* Centered Open Typography Header (Print button removed) */}
      <header className="text-center max-w-2xl mx-auto pt-2 pb-5 sm:pt-4 sm:pb-7 space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
          Kết Quả Đánh Giá
        </h1>
        <p className="text-sm sm:text-base text-slate-500 font-normal leading-relaxed">
          Xem kết quả chấm điểm từ doanh nghiệp, giảng viên hướng dẫn và chứng nhận thực tập.
        </p>
      </header>

      {groups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center text-slate-500 shadow-xs">
          <Award className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-700">
            Chưa có đánh giá nào cho kỳ thực tập
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Sau khi Doanh nghiệp tiếp nhận hoặc Giảng viên hướng dẫn hoàn tất chấm điểm học phần, bảng điểm chi tiết sẽ được hiển thị tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-8 w-full">
          {groups.map((group) => {
            const { placement, companyEval, lecturerEval, finalScore } = group;
            const classification =
              finalScore !== null ? getGradeClassification(finalScore) : null;

            return (
              <section
                key={group.placementId}
                className="w-full rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md"
              >
                {/* Top Accent Gradient Line */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[#00a3a6] via-teal-500 to-[#006d72]" />

                <div className="p-6 sm:p-8 space-y-7">
                  {/* PLACEMENT HEADER INFO */}
                  <div className="space-y-2 pb-5 border-b border-slate-100 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="rounded-full bg-teal-50 border border-teal-200 px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-teal-800">
                        {placement.semester?.name ?? "Kỳ thực tập"}
                      </span>
                      {finalScore !== null ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-[11px] font-bold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" />
                          Đã hoàn thành đánh giá 2 bên
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-3 py-0.5 text-[11px] font-bold text-amber-800">
                          <Clock className="h-3 w-3" />
                          Đang chờ hoàn tất chấm điểm
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {placement.internship.title}
                    </h2>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-1 gap-x-4 text-xs text-slate-600 pt-0.5">
                      <p className="font-bold text-teal-700 flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 shrink-0 text-teal-600" />
                        {placement.company.companyName}
                      </p>
                      <span className="text-slate-300 hidden sm:inline">·</span>
                      <p className="flex items-center gap-1.5 text-slate-500">
                        <UserRound className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        Sinh viên: <b className="text-slate-800 font-bold">{placement.student.fullName}</b> ({placement.student.studentCode})
                      </p>
                      <span className="text-slate-300 hidden sm:inline">·</span>
                      <p className="text-slate-500">
                        Ngành: {placement.student.major}
                      </p>
                    </div>
                  </div>

                  {/* 3 SCORE CARDS - DEDICATED FULL WIDTH BENTO GRID (Never cut off or squished!) */}
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 text-center sm:text-left">
                      Bảng điểm đánh giá học phần
                    </p>
                    <div className="grid gap-4 sm:grid-cols-3">
                      {/* Cột 1: Điểm Doanh nghiệp */}
                      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 via-white to-slate-50/60 p-5 shadow-2xs flex flex-col items-center sm:items-start text-center sm:text-left">
                        <div className="w-full flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-800">
                            <Building2 className="h-4 w-4 text-emerald-600" />
                            Điểm Doanh nghiệp
                          </span>
                          <span className="rounded-full bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            Tỷ trọng 50%
                          </span>
                        </div>
                        <div className="mt-3 flex items-baseline justify-center sm:justify-start gap-1">
                          <span className="text-3xl sm:text-4xl font-black text-emerald-950 tracking-tight">
                            {companyEval ? companyEval.score.toFixed(1) : "—"}
                          </span>
                          <span className="text-xs font-bold text-slate-400">/ 10</span>
                        </div>
                        <p className="w-full mt-2 text-xs text-slate-500 truncate border-t border-emerald-100/70 pt-2.5">
                          {companyEval
                            ? `Đánh giá bởi: ${companyEval.evaluator.email}`
                            : "Doanh nghiệp chưa chấm điểm"}
                        </p>
                      </div>

                      {/* Cột 2: Điểm Giảng viên hướng dẫn */}
                      <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/60 via-white to-slate-50/60 p-5 shadow-2xs flex flex-col items-center sm:items-start text-center sm:text-left">
                        <div className="w-full flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-teal-800">
                            <GraduationCap className="h-4 w-4 text-teal-600" />
                            Điểm Giảng viên
                          </span>
                          <span className="rounded-full bg-teal-100/70 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                            Tỷ trọng 50%
                          </span>
                        </div>
                        <div className="mt-3 flex items-baseline justify-center sm:justify-start gap-1">
                          <span className="text-3xl sm:text-4xl font-black text-teal-950 tracking-tight">
                            {lecturerEval ? lecturerEval.score.toFixed(1) : "—"}
                          </span>
                          <span className="text-xs font-bold text-slate-400">/ 10</span>
                        </div>
                        <p className="w-full mt-2 text-xs text-slate-500 truncate border-t border-teal-100/70 pt-2.5">
                          {lecturerEval
                            ? `Đánh giá bởi: ${placement.supervision?.lecturer.fullName ?? lecturerEval.evaluator.email}`
                            : "GVHD chưa chấm điểm"}
                        </p>
                      </div>

                      {/* Cột 3: Điểm Tổng Kết Học Phần */}
                      <div className="rounded-2xl border border-teal-300 bg-gradient-to-br from-[#00a3a6] to-[#006d72] p-5 text-white shadow-md relative overflow-hidden flex flex-col items-center sm:items-start text-center sm:text-left">
                        <div className="w-full flex items-center justify-between relative z-10">
                          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-teal-100">
                            <Award className="h-4 w-4 text-amber-300" />
                            Điểm Tổng Kết
                          </span>
                          {classification && (
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${classification.badgeClass}`}
                            >
                              {classification.label}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex items-baseline justify-center sm:justify-start gap-1 relative z-10">
                          <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                            {finalScore !== null ? finalScore.toFixed(2) : "—"}
                          </span>
                          <span className="text-xs font-bold text-teal-200">/ 10</span>
                        </div>
                        <p className="w-full mt-2 text-xs text-teal-100/80 border-t border-white/20 pt-2.5 relative z-10">
                          {finalScore !== null
                            ? "Đã tổng hợp điểm cuối cùng của học phần"
                            : "Đang chờ đủ 2 cột điểm"}
                        </p>

                        {/* Background subtle glow effect */}
                        <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* COMPANY CERTIFICATE DOWNLOAD BANNER */}
                  {companyEval?.certificateFile && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50/80 via-white to-emerald-50/60 p-5 shadow-2xs text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row items-center gap-3.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-xs">
                          <FileBadge2 className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center justify-center sm:justify-start gap-2">
                            <span className="rounded-full bg-teal-100 text-teal-800 border border-teal-200 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                              Chứng nhận thực tập
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-slate-900 mt-1">
                            {companyEval.certificateFile.originalName}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Được cấp và xác nhận bởi {placement.company.companyName}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          void downloadPrivateFile(companyEval.certificateFile!.id)
                        }
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#00a3a6] to-[#006d72] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer self-center sm:self-auto"
                      >
                        <Download className="h-4 w-4" />
                        Tải Chứng nhận Thực tập
                      </button>
                    </div>
                  )}

                  {/* DETAILED FEEDBACK: 2-COLUMN COMPARISON CARDS */}
                  <div className="grid gap-5 lg:grid-cols-2">
                    {/* Thẻ đánh giá từ Doanh nghiệp */}
                    <article className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 flex flex-col justify-between space-y-4 text-center sm:text-left">
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 pb-4 border-b border-slate-200/80">
                          <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-900">
                                Đánh giá từ Doanh nghiệp
                              </h4>
                              <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                                {placement.company.companyName}
                              </p>
                            </div>
                          </div>

                          {companyEval ? (
                            <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-sm font-black text-emerald-800 shadow-2xs">
                              {companyEval.score.toFixed(1)} / 10
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">
                              Chưa có điểm
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 text-center sm:text-left">
                            Nhận xét kết quả thực tập
                          </p>
                          {companyEval ? (
                            <div className="rounded-xl border border-slate-200/80 bg-white p-4 text-sm leading-relaxed text-slate-800 whitespace-pre-line shadow-2xs text-left">
                              {companyEval.comment || "Chưa có nhận xét chi tiết."}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic py-2 text-center sm:text-left">
                              Doanh nghiệp tiếp nhận đang trong quá trình đánh giá sinh viên.
                            </p>
                          )}
                        </div>
                      </div>

                      {companyEval && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 text-center sm:text-left">
                          <span className="flex items-center gap-1.5 text-slate-600 font-medium truncate">
                            <UserRound className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            {companyEval.evaluator.email}
                          </span>
                          <span className="font-semibold text-slate-400">
                            {formatDateTime(companyEval.updatedAt)}
                          </span>
                        </div>
                      )}
                    </article>

                    {/* Thẻ đánh giá từ Giảng viên hướng dẫn */}
                    <article className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 flex flex-col justify-between space-y-4 text-center sm:text-left">
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 pb-4 border-b border-slate-200/80">
                          <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-800 border border-teal-200">
                              <GraduationCap className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-900">
                                Đánh giá từ Giảng viên hướng dẫn
                              </h4>
                              <p className="text-xs font-semibold text-teal-700 mt-0.5">
                                {placement.supervision?.lecturer.fullName ?? "Giảng viên phụ trách"}
                              </p>
                            </div>
                          </div>

                          {lecturerEval ? (
                            <span className="inline-flex items-center gap-1 rounded-xl border border-teal-200 bg-white px-3 py-1.5 text-sm font-black text-teal-800 shadow-2xs">
                              {lecturerEval.score.toFixed(1)} / 10
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">
                              Chưa có điểm
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 text-center sm:text-left">
                            Nhận xét kết quả thực tập
                          </p>
                          {lecturerEval ? (
                            <div className="rounded-xl border border-slate-200/80 bg-white p-4 text-sm leading-relaxed text-slate-800 whitespace-pre-line shadow-2xs text-left">
                              {lecturerEval.comment || "Chưa có nhận xét chi tiết."}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic py-2 text-center sm:text-left">
                              Giảng viên hướng dẫn đang trong quá trình nghiệm thu báo cáo và đánh giá.
                            </p>
                          )}
                        </div>
                      </div>

                      {lecturerEval && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 text-center sm:text-left">
                          <span className="flex items-center gap-1.5 text-slate-600 font-medium truncate">
                            <UserRound className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                            {placement.supervision?.lecturer.fullName ?? lecturerEval.evaluator.email}
                          </span>
                          <span className="font-semibold text-slate-400">
                            {formatDateTime(lecturerEval.updatedAt)}
                          </span>
                        </div>
                      )}
                    </article>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
