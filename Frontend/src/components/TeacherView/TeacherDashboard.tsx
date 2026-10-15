import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, BarChart3, ClipboardCheck, GraduationCap, LoaderCircle, RefreshCw, UsersRound } from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { evaluationsApi, type EvaluationRecord } from "../../evaluations/api";
import { lecturersApi, type LecturerProfileRecord } from "../../lecturers/api";
import { reportsApi } from "../../reports/api";
import type { ReportRecord } from "../../reports/types";
import { supervisionsApi } from "../../supervisions/api";
import type { SupervisionRecord } from "../../supervisions/types";

interface TeacherDashboardProps { onNavigateTab: (tab: string) => void; }
type StudentProgress = { supervision: SupervisionRecord; expectedWeeks: number; submittedWeeks: number; missingWeeks: number[]; maxDaysLate: number; };
const DAY_MS = 24 * 60 * 60 * 1000;
const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate());

function getProgress(supervision: SupervisionRecord, reports: ReportRecord[]): StudentProgress | null {
  const placement = supervision.placement;
  if (supervision.status !== "ACTIVE" || placement.status !== "ACTIVE" || placement.academicStatus !== "ACTIVE" || !placement.startDate || !placement.endDate) return null;
  const today = startOfDay(new Date());
  const start = startOfDay(new Date(placement.startDate));
  const end = startOfDay(new Date(placement.endDate));
  if (today < start || today > end) return null;
  const totalWeeks = Math.ceil((end.getTime() - start.getTime() + DAY_MS) / (7 * DAY_MS));
  // A report only becomes late after its entire monitoring week has ended.
  const expectedWeeks = Math.min(totalWeeks, Math.floor((today.getTime() - start.getTime()) / (7 * DAY_MS)));
  const submitted = new Set(reports.filter((report) => report.placementId === placement.id && report.status !== "DRAFT").map((report) => report.week));
  const missingWeeks = Array.from({ length: expectedWeeks }, (_, index) => index + 1).filter((week) => !submitted.has(week));
  const maxDaysLate = missingWeeks.length ? Math.max(...missingWeeks.map((week) => Math.max(1, Math.floor((today.getTime() - (start.getTime() + week * 7 * DAY_MS)) / DAY_MS) + 1))) : 0;
  return { supervision, expectedWeeks, submittedWeeks: Array.from(submitted).filter((week) => week <= expectedWeeks).length, missingWeeks, maxDaysLate };
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigateTab }) => {
  const [profile, setProfile] = useState<LecturerProfileRecord | null>(null);
  const [supervisions, setSupervisions] = useState<SupervisionRecord[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [lecturer, supervisionPage, reportPage, evaluationPage] = await Promise.all([lecturersApi.getMine(), supervisionsApi.listMine(), reportsApi.supervised({ page: 1, limit: 100 }), evaluationsApi.listMine({ page: 1, limit: 100 })]);
      setProfile(lecturer); setSupervisions(supervisionPage.items); setReports(reportPage.items); setEvaluations(evaluationPage.items);
    } catch (requestError) { setError(getApiErrorMessage(requestError)); } finally { setLoading(false); }
  }, []);
  useEffect(() => void load(), [load]);
  const activeSupervisions = useMemo(() => supervisions.filter((item) => item.status === "ACTIVE" && item.placement.status === "ACTIVE"), [supervisions]);
  const pendingReports = useMemo(() => {
    const activePlacementIds = new Set(
      activeSupervisions.map((item) => item.placement.id),
    );
    return reports.filter(
      (report) =>
        report.status === "SUBMITTED" &&
        activePlacementIds.has(report.placementId),
    ).length;
  }, [activeSupervisions, reports]);
  const progressRows = useMemo(() => activeSupervisions.map((item) => getProgress(item, reports)).filter((item): item is StudentProgress => Boolean(item)), [activeSupervisions, reports]);
  const lateRows = useMemo(() => progressRows.filter((item) => item.missingWeeks.length > 0).sort((a, b) => b.maxDaysLate - a.maxDaysLate), [progressRows]);
  if (loading) return <div className="flex min-h-72 items-center justify-center text-sm text-slate-500"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Đang tải dữ liệu giảng viên...</div>;
  if (error || !profile) return <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800"><h1 className="text-lg font-black">Chưa thể tải bảng điều khiển của giảng viên</h1><p className="mt-2 text-sm">{error ?? "Hồ sơ giảng viên chưa sẵn sàng."}</p><button onClick={() => void load()} className="mt-4 rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800">Thử lại</button></section>;
  return <section className="space-y-5">
    <header className="teacher-hero rounded-3xl bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-900 p-6 text-white shadow-lg sm:p-8"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-violet-100"><GraduationCap className="h-3.5 w-3.5" /> Theo dõi và hướng dẫn học vụ</p><h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">{profile.fullName}</h1><p className="mt-1 text-sm text-violet-100/80">{profile.department} {profile.title ? `· ${profile.title}` : ""}</p></div><div className="flex gap-2"><button onClick={() => void load()} className="rounded-xl bg-white/10 p-2.5 ring-1 ring-white/20 hover:bg-white/20" aria-label="Làm mới dashboard"><RefreshCw className="h-4 w-4" /></button><button onClick={() => onNavigateTab("supervised-placements")} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold ring-1 ring-white/20 hover:bg-white/20">Danh sách phụ trách <ArrowRight className="h-4 w-4" /></button></div></div></header>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Sinh viên đang hướng dẫn" value={activeSupervisions.length} icon={<UsersRound className="h-5 w-5" />} tone="bg-indigo-50 text-indigo-700" onClick={() => onNavigateTab("supervised-placements")} /><Metric label="Báo cáo chờ duyệt" value={pendingReports} icon={<ClipboardCheck className="h-5 w-5" />} tone="bg-amber-50 text-amber-700" onClick={() => onNavigateTab("review-reports")} /><Metric label="Sinh viên nộp trễ" value={lateRows.length} icon={<AlertTriangle className="h-5 w-5" />} tone="bg-rose-50 text-rose-700" /><Metric label="Đánh giá đã gửi" value={evaluations.length} icon={<BarChart3 className="h-5 w-5" />} tone="bg-emerald-50 text-emerald-700" onClick={() => onNavigateTab("evaluation-list")} /></div>
    <article className="overflow-hidden rounded-3xl border border-rose-200 bg-white shadow-xs"><div className="flex items-start justify-between border-b border-rose-100 px-5 py-4 sm:px-6"><div><h2 className="flex items-center gap-2 font-black text-slate-900"><AlertTriangle className="h-5 w-5 text-rose-600" /> Cảnh báo nộp báo cáo trễ</h2><p className="mt-1 text-xs text-slate-500">Chỉ tính tuần đã kết thúc của placement và theo dõi học vụ đang hoạt động.</p></div><span className="rounded-xl bg-rose-50 px-3 py-1.5 text-sm font-black text-rose-700">{lateRows.length} cần nhắc</span></div>{lateRows.length ? <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Sinh viên</th><th className="px-4 py-3">Vị trí thực tập</th><th className="px-4 py-3">Tuần chưa nộp</th><th className="px-4 py-3">Trễ lâu nhất</th></tr></thead><tbody className="divide-y divide-slate-100">{lateRows.slice(0, 8).map((row) => <tr key={row.supervision.id}><td className="px-5 py-3"><p className="font-bold text-slate-900">{row.supervision.placement.student.fullName}</p><p className="text-xs text-slate-500">{row.supervision.placement.student.studentCode}</p></td><td className="px-4 py-3 text-slate-700">{row.supervision.placement.internship.title}<p className="text-xs text-slate-500">{row.supervision.placement.company.companyName}</p></td><td className="px-4 py-3 font-semibold text-rose-700">Tuần {row.missingWeeks.join(", ")}</td><td className="px-4 py-3 font-bold text-rose-700">{row.maxDaysLate} ngày</td></tr>)}</tbody></table></div> : <div className="px-6 py-10 text-center text-sm font-semibold text-emerald-700">Chưa có sinh viên nào trễ hạn nộp báo cáo.</div>}</article>
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 className="font-black text-slate-900">Tiến độ sinh viên đang phụ trách</h2><p className="mt-0.5 text-xs text-slate-500">Số báo cáo đã nộp trên số tuần đã hoàn thành trong thời gian theo dõi.</p></div><button onClick={() => onNavigateTab("supervised-placements")} className="text-xs font-bold text-indigo-700 hover:underline">Xem tất cả</button></div>{progressRows.length ? <div className="divide-y divide-slate-100">{progressRows.slice(0, 8).map((row) => { const student = row.supervision.placement.student; const percent = row.expectedWeeks ? Math.min(100, Math.round((row.submittedWeeks / row.expectedWeeks) * 100)) : 0; return <div key={row.supervision.id} className="px-5 py-4 sm:px-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-slate-900">{student.fullName} <span className="font-normal text-slate-500">· {student.studentCode}</span></p><p className="mt-0.5 text-xs text-slate-500">{row.supervision.placement.internship.title} · {row.supervision.placement.company.companyName}</p></div><span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold ${row.missingWeeks.length ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{row.missingWeeks.length ? `Trễ ${row.missingWeeks.length} tuần` : "Đúng tiến độ"}</span></div><div className="mt-3 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${row.missingWeeks.length ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${percent}%` }} /></div><span className="w-24 text-right text-xs font-bold text-slate-600">{row.submittedWeeks}/{row.expectedWeeks} tuần</span></div></div>; })}</div> : <div className="px-6 py-12 text-center text-sm text-slate-500">Chưa có placement đang trong thời gian theo dõi học vụ.</div>}</article>
  </section>;
};
const Metric: React.FC<{ label: string; value: number; icon: React.ReactNode; tone: string; onClick?: () => void }> = ({ label, value, icon, tone, onClick }) => <button type="button" onClick={onClick} disabled={!onClick} className={`flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xs transition ${onClick ? "hover:-translate-y-0.5 hover:shadow-md" : "cursor-default"}`}><div><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 text-3xl font-black text-slate-900">{value}</p></div><span className={`rounded-xl p-3 ${tone}`}>{icon}</span></button>;
