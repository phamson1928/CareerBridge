import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  GraduationCap,
  LoaderCircle,
  UsersRound,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { evaluationsApi, type EvaluationRecord } from "../../evaluations/api";
import { lecturersApi, type LecturerProfileRecord } from "../../lecturers/api";
import { reportsApi } from "../../reports/api";
import { supervisionsApi } from "../../supervisions/api";
import type { SupervisionRecord } from "../../supervisions/types";

interface TeacherDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onNavigateTab,
}) => {
  const [profile, setProfile] = useState<LecturerProfileRecord | null>(null);
  const [supervisions, setSupervisions] = useState<SupervisionRecord[]>([]);
  const [pendingReports, setPendingReports] = useState(0);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [lecturer, supervisionPage, reportPage, evaluationPage] =
          await Promise.all([
            lecturersApi.getMine(),
            supervisionsApi.listMine(),
            reportsApi.supervised({ page: 1, limit: 100, status: "SUBMITTED" }),
            evaluationsApi.listMine({ page: 1, limit: 100 }),
          ]);
        if (!active) return;
        setProfile(lecturer);
        setSupervisions(supervisionPage.items);
        setPendingReports(reportPage.pagination.total);
        setEvaluations(evaluationPage.items);
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError));
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center text-sm text-slate-500">
        <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
        Đang tải dữ liệu giảng viên...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
        <h1 className="text-lg font-black">Chưa thể tải dashboard giảng viên</h1>
        <p className="mt-2 text-sm">{error ?? "Hồ sơ giảng viên chưa sẵn sàng."}</p>
        <button
          onClick={() => onNavigateTab("lecturer-profile")}
          className="mt-4 rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800"
        >
          Mở hồ sơ giảng viên
        </button>
      </section>
    );
  }

  const activeSupervisions = supervisions.filter(
    (item) => item.status === "ACTIVE",
  );
  const recentStudents = activeSupervisions.slice(0, 4);

  return (
    <section className="space-y-6">
      <header className="rounded-3xl bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-900 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-violet-100">
              <GraduationCap className="h-3.5 w-3.5" /> Academic supervision
            </p>
            <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
              {profile.fullName}
            </h1>
            <p className="mt-1 text-sm text-violet-100/80">
              {profile.department} {profile.title ? `· ${profile.title}` : ""}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab("supervised-placements")}
            className="inline-flex items-center gap-2 self-start rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white ring-1 ring-white/20 transition hover:bg-white/20 md:self-auto"
          >
            Xem danh sách phụ trách <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Sinh viên đang hướng dẫn" value={activeSupervisions.length} icon={<UsersRound className="h-5 w-5" />} tone="bg-indigo-50 text-indigo-700" />
        <Metric label="Báo cáo chờ duyệt" value={pendingReports} icon={<ClipboardCheck className="h-5 w-5" />} tone="bg-amber-50 text-amber-700" onClick={() => onNavigateTab("review-reports")} />
        <Metric label="Đánh giá đã gửi" value={evaluations.length} icon={<BarChart3 className="h-5 w-5" />} tone="bg-emerald-50 text-emerald-700" onClick={() => onNavigateTab("evaluation-list")} />
      </div>

      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-black text-slate-900">Sinh viên đang phụ trách</h2>
            <p className="mt-0.5 text-xs text-slate-500">Placement được Admin phân công cho tài khoản của bạn.</p>
          </div>
          <button onClick={() => onNavigateTab("supervised-placements")} className="text-xs font-bold text-indigo-700 hover:underline">Xem tất cả</button>
        </div>
        {recentStudents.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-slate-500">Chưa có placement đang hoạt động được phân công cho bạn.</div>
        ) : (
          <div className="grid gap-px bg-slate-100 md:grid-cols-2">
            {recentStudents.map((item) => (
              <div key={item.id} className="bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">{item.placement.student.fullName}</h3>
                    <p className="mt-1 font-mono text-[11px] text-slate-500">{item.placement.student.studentCode} · {item.placement.student.major}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Đang hướng dẫn</span>
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-700">{item.placement.internship.title}</p>
                <p className="mt-1 text-xs text-slate-500">{item.placement.company.companyName} · {item.placement._count.reports} báo cáo</p>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
};

const Metric: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: string;
  onClick?: () => void;
}> = ({ label, value, icon, tone, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className={`flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xs transition ${onClick ? "hover:-translate-y-0.5 hover:shadow-md" : "cursor-default"}`}
  >
    <div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-black text-slate-900">{value}</p>
    </div>
    <span className={`rounded-xl p-3 ${tone}`}>{icon}</span>
  </button>
);