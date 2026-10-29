import { useMemo } from "react";
import {
  Award,
  Building2,
  Download,
  FileBadge2,
  GraduationCap,
  Printer,
  UserRound,
} from "lucide-react";
import type { EvaluationRecord } from "../../evaluations/api";
import { downloadPrivateFile } from "../../files/api";
import { formatDateTime } from "../../utils/format";

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
    <div className="space-y-6">
      <header className="rounded-3xl bg-linear-to-br from-indigo-950 via-blue-900 to-slate-900 p-6 text-white shadow-lg sm:p-8 print:hidden">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-100">
              <Award className="h-3.5 w-3.5" /> Tổng hợp kết quả thực tập
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
              Kết quả Đánh giá & Chứng nhận Thực tập
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-blue-100/85">
              Xem điểm đánh giá từ Doanh nghiệp, Giảng viên hướng dẫn, điểm tổng kết hệ 10 và tải tệp Chứng nhận thực tập từ doanh nghiệp.
            </p>
          </div>
          {groups.length > 0 && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
            >
              <Printer className="h-4 w-4" />
              In trang kết quả
            </button>
          )}
        </div>
      </header>

      {groups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
          Chưa có đánh giá nào cho kỳ thực tập của bạn.
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const { placement, companyEval, lecturerEval, finalScore } = group;

            return (
              <section
                key={group.placementId}
                className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8"
              >
                {/* PLACEMENT HEADER & SCORE SUMMARY */}
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center">
                  <div>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-extrabold text-indigo-700">
                      {placement.semester?.name ?? "Kỳ thực tập"}
                    </span>
                    <h3 className="mt-2 text-xl font-black text-slate-900">
                      {placement.internship.title} — {placement.company.companyName}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Sinh viên: <b>{placement.student.fullName}</b> (
                      {placement.student.studentCode}) · Ngành:{" "}
                      {placement.student.major}
                    </p>
                  </div>

                  {/* 3 SCORES IN SCALE 10 */}
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-2.5 text-center">
                      <span className="block text-[10px] font-bold uppercase text-emerald-700">
                        Điểm DN (50%)
                      </span>
                      <b className="mt-0.5 block text-lg font-black text-emerald-900">
                        {companyEval ? `${companyEval.score}/10` : "—"}
                      </b>
                    </div>
                    <div className="rounded-2xl border border-violet-100 bg-violet-50/60 px-3.5 py-2.5 text-center">
                      <span className="block text-[10px] font-bold uppercase text-violet-700">
                        Điểm GVHD (50%)
                      </span>
                      <b className="mt-0.5 block text-lg font-black text-violet-900">
                        {lecturerEval ? `${lecturerEval.score}/10` : "—"}
                      </b>
                    </div>
                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-center">
                      <span className="block text-[10px] font-bold uppercase text-indigo-700">
                        Tổng kết (Hệ 10)
                      </span>
                      <b className="mt-0.5 block text-lg font-black text-indigo-950">
                        {finalScore !== null ? `${finalScore.toFixed(2)}/10` : "—"}
                      </b>
                    </div>
                  </div>
                </div>

                {/* COMPANY CERTIFICATE FILE DOWNLOAD IF AVAILABLE */}
                {companyEval?.certificateFile && (
                  <div className="flex flex-col justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 sm:flex-row sm:items-center print:hidden">
                    <div className="flex items-center gap-3">
                      <span className="rounded-xl bg-emerald-600 p-2.5 text-white">
                        <FileBadge2 className="h-5 w-5" />
                      </span>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">
                          Chứng nhận Thực tập Doanh nghiệp
                        </h4>
                        <p className="text-xs text-slate-600">
                          Tệp đính kèm từ {placement.company.companyName}:{" "}
                          <b>{companyEval.certificateFile.originalName}</b>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void downloadPrivateFile(companyEval.certificateFile!.id)
                      }
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700"
                    >
                      <Download className="h-4 w-4" />
                      Tải Chứng nhận Thực tập
                    </button>
                  </div>
                )}

                {/* COMPANY & LECTURER EVALUATIONS */}
                <div className="grid gap-4 lg:grid-cols-2">
                  <article className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                          <Building2 className="h-5 w-5" />
                        </span>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900">
                            Đánh giá từ Doanh nghiệp
                          </h4>
                          <p className="text-xs text-slate-500">
                            {placement.company.companyName}
                          </p>
                        </div>
                      </div>
                      {companyEval ? (
                        <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-700">
                          {companyEval.score}/10
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">
                          Chưa có điểm
                        </span>
                      )}
                    </div>

                    {companyEval ? (
                      <div className="mt-4 space-y-3">
                        <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-sm leading-6 text-slate-700">
                          {companyEval.comment || "Chưa có nhận xét chi tiết."}
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <UserRound className="h-3.5 w-3.5 text-emerald-600" />
                            Người đánh giá: {companyEval.evaluator.email}
                          </span>
                          <span>{formatDateTime(companyEval.updatedAt)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-xs text-slate-500">
                        Doanh nghiệp tiếp nhận chưa cập nhật đánh giá.
                      </p>
                    )}
                  </article>

                  <article className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="rounded-xl bg-violet-100 p-2.5 text-violet-700">
                          <GraduationCap className="h-5 w-5" />
                        </span>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900">
                            Đánh giá từ Giảng viên hướng dẫn
                          </h4>
                          <p className="text-xs text-slate-500">
                            {placement.supervision?.lecturer.fullName ??
                              "Giảng viên hướng dẫn"}
                          </p>
                        </div>
                      </div>
                      {lecturerEval ? (
                        <span className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-black text-violet-700">
                          {lecturerEval.score}/10
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">
                          Chưa có điểm
                        </span>
                      )}
                    </div>

                    {lecturerEval ? (
                      <div className="mt-4 space-y-3">
                        <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-sm leading-6 text-slate-700">
                          {lecturerEval.comment || "Chưa có nhận xét chi tiết."}
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <UserRound className="h-3.5 w-3.5 text-violet-600" />
                            GVHD: {lecturerEval.evaluator.email}
                          </span>
                          <span>{formatDateTime(lecturerEval.updatedAt)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-xs text-slate-500">
                        Giảng viên hướng dẫn chưa cập nhật đánh giá.
                      </p>
                    )}
                  </article>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
