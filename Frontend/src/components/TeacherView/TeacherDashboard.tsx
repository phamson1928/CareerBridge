import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  Download,
  GraduationCap,
  LoaderCircle,
  MessageSquare,
  RefreshCw,
  UsersRound,
  Calendar,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { evaluationsApi, type EvaluationRecord } from "../../evaluations/api";
import { lecturersApi, type LecturerProfileRecord } from "../../lecturers/api";
import { reportsApi } from "../../reports/api";
import type { ReportRecord } from "../../reports/types";
import { supervisionsApi } from "../../supervisions/api";
import type { SupervisionRecord } from "../../supervisions/types";
import { downloadExcelWorkbook } from "../../utils/excelExport";
import { semestersApi } from "../../semesters/api";
import type { SemesterRecord } from "../../semesters/types";
import { findDefaultSemester, toSemesterSlug } from "../../semesters/utils";
import { SemesterCampaignBanner } from "../Semesters/SemesterCampaignBanner";

interface TeacherDashboardProps { onNavigateTab: (tab: string) => void; onOpenChat: (placementId: string) => void; }
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
  const totalWeeks = Math.min(10, Math.ceil((end.getTime() - start.getTime() + DAY_MS) / (7 * DAY_MS)));
  // A report only becomes late after its entire monitoring week has ended.
  const expectedWeeks = Math.min(totalWeeks, Math.floor((today.getTime() - start.getTime()) / (7 * DAY_MS)));
  const submitted = new Set(reports.filter((report) => report.placementId === placement.id && report.status !== "DRAFT" && report.week > 0).map((report) => report.week));
  const missingWeeks = Array.from({ length: expectedWeeks }, (_, index) => index + 1).filter((week) => !submitted.has(week));
  const maxDaysLate = missingWeeks.length ? Math.max(...missingWeeks.map((week) => Math.max(1, Math.floor((today.getTime() - (start.getTime() + week * 7 * DAY_MS)) / DAY_MS) + 1))) : 0;
  return { supervision, expectedWeeks, submittedWeeks: Array.from(submitted).filter((week) => week <= expectedWeeks).length, missingWeeks, maxDaysLate };
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigateTab, onOpenChat }) => {
  const [profile, setProfile] = useState<LecturerProfileRecord | null>(null);
  const [supervisions, setSupervisions] = useState<SupervisionRecord[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [semesters, setSemesters] = useState<SemesterRecord[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [lecturer, supervisionPage, reportPage, evaluationPage, semesterPage] = await Promise.all([lecturersApi.getMine(), supervisionsApi.listMine(), reportsApi.supervised({ page: 1, limit: 100 }), evaluationsApi.listMine({ page: 1, limit: 100 }), semestersApi.list({ limit: 100 })]);
      setProfile(lecturer); setSupervisions(supervisionPage.items); setReports(reportPage.items); setEvaluations(evaluationPage.items); setSemesters(semesterPage.items);
      const def = findDefaultSemester(semesterPage.items, "LECTURER");
      if (def) setSelectedSemesterId(def.id);
    } catch (requestError) { setError(getApiErrorMessage(requestError)); } finally { setLoading(false); }
  }, []);
  useEffect(() => void load(), [load]);
  const scopedSupervisions = useMemo(() => {
    return supervisions.filter((item) => {
      if (selectedSemesterId && selectedSemesterId !== "ALL" && item.placement.semester.id !== selectedSemesterId) {
        return false;
      }
      return true;
    });
  }, [supervisions, selectedSemesterId]);
  const activeSupervisions = useMemo(() => scopedSupervisions.filter((item) => item.status === "ACTIVE" && item.placement.status === "ACTIVE"), [scopedSupervisions]);
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
  const exportSupervisionExcel = () => {
    const currentSem = semesters.find((s) => s.id === selectedSemesterId);
    const semLabel = currentSem ? currentSem.name : "Tất cả học kỳ";
    const fileSlug = currentSem ? toSemesterSlug(currentSem.name) : "tat-ca-hoc-ky";
    downloadExcelWorkbook(`bao-cao-huong-dan-${fileSlug}`, [
      {
        name: "Sinh vien huong dan",
        title: `BÁO CÁO TIẾN ĐỘ & KẾT QUẢ HƯỚNG DẪN THỰC TẬP — ${semLabel.toUpperCase()}`,
        subtitle: `GV: ${profile?.fullName ?? ""} — Khoa: ${profile?.faculty?.name ?? profile?.department ?? "—"} · Học kỳ: ${semLabel} · Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`,
        columns: [
          { header: "STT", width: 45, value: (_, i) => i + 1 },
          { header: "MSSV", width: 105, value: (s: SupervisionRecord) => s.placement.student.studentCode },
          { header: "Họ và tên sinh viên", width: 165, value: (s: SupervisionRecord) => s.placement.student.fullName },
          { header: "Ngành đào tạo", width: 170, value: (s: SupervisionRecord) => s.placement.student.major },
          { header: "Khoa sinh viên", width: 165, value: (s: SupervisionRecord) => s.placement.student.faculty?.name ?? "—" },
          { header: "Doanh nghiệp thực tập", width: 185, value: (s: SupervisionRecord) => s.placement.company.companyName },
          { header: "Vị trí thực tập", width: 165, value: (s: SupervisionRecord) => s.placement.internship.title },
          { header: "Học kỳ", width: 140, value: (s: SupervisionRecord) => s.placement.semester.name },
          { header: "Số báo cáo đã nộp", width: 120, value: (s: SupervisionRecord) => s.placement._count.reports },
          {
            header: "Điểm DN",
            width: 90,
            value: (s: SupervisionRecord) => {
              const comp = evaluations.find((e) => e.placementId === s.placement.id && e.type === "COMPANY");
              return comp ? comp.score : "—";
            },
          },
          {
            header: "Điểm GVHD",
            width: 90,
            value: (s: SupervisionRecord) => {
              const lect = evaluations.find((e) => e.placementId === s.placement.id && e.type === "LECTURER");
              return lect ? lect.score : "—";
            },
          },
          {
            header: "Điểm Tổng kết",
            width: 110,
            value: (s: SupervisionRecord) => {
              const comp = evaluations.find((e) => e.placementId === s.placement.id && e.type === "COMPANY");
              const lect = evaluations.find((e) => e.placementId === s.placement.id && e.type === "LECTURER");
              return comp && lect ? Math.round(((comp.score + lect.score) / 2) * 100) / 100 : "—";
            },
          },
          {
            header: "Trạng thái",
            width: 125,
            value: (s: SupervisionRecord) =>
              s.placement.status === "COMPLETED"
                ? "Đã hoàn tất"
                : s.placement.status === "ACTIVE"
                  ? "Đang thực tập"
                  : s.placement.status,
          },
        ],
        rows: scopedSupervisions,
      },
    ]);
  };
  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center text-sm font-semibold text-slate-500">
        <LoaderCircle className="mr-2 h-5 w-5 animate-spin text-teal-600" />
        Đang tải dữ liệu giảng viên...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-sm">
        <h1 className="text-lg font-bold">Chưa thể tải bảng điều khiển của giảng viên</h1>
        <p className="mt-2 text-sm">{error ?? "Hồ sơ giảng viên chưa sẵn sàng."}</p>
        <button
          onClick={() => void load()}
          className="mt-4 rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800 transition"
        >
          Thử lại
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Header (Modern Clean SaaS Style) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200/60 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-800 mb-2">
            <GraduationCap className="h-3.5 w-3.5 text-teal-600" />
            <span>HƯỚNG DẪN HỌC VỤ & THỰC TẬP</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Trung tâm hướng dẫn thực tập
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Theo dõi tiến độ thực tập, duyệt báo cáo tuần và đồng hành cùng sinh viên trong suốt kỳ học.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            title="Làm mới số liệu"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Làm mới</span>
          </button>

          <select
            value={selectedSemesterId}
            onChange={(e) => setSelectedSemesterId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
          >
            <option value="ALL">Tất cả học kỳ</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status})
              </option>
            ))}
          </select>

          <button
            onClick={exportSupervisionExcel}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-50 border border-teal-200 px-3.5 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 transition shadow-2xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-teal-700" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={() => onNavigateTab("supervised-placements")}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-4 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
          >
            <span>Danh sách phụ trách</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Lecturer Identity Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-teal-200 bg-teal-50 text-teal-800 text-lg font-black shadow-2xs">
            {profile.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">{profile.fullName}</h2>
              {profile.title && (
                <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-teal-800">
                  {profile.title}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {profile.faculty?.name ? `Khoa ${profile.faculty.name}` : profile.department || "Khoa Công nghệ Thông tin"}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab("lecturer-profile")}
          className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline"
        >
          Hồ sơ giảng viên →
        </button>
      </div>

      {/* 3. Tiến trình Đợt thực tập / Campaign Timeline Banner */}
      <SemesterCampaignBanner role="TEACHER" />

      {/* 4. Bento Grid KPI Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 bento-stagger">
        <MetricCard
          label="Sinh viên đang hướng dẫn"
          value={activeSupervisions.length}
          subtext="Đang thực tập thực tế"
          icon={<UsersRound className="h-5 w-5" />}
          iconBg="bg-teal-50"
          iconColor="text-teal-700"
          onClick={() => onNavigateTab("supervised-placements")}
        />
        <MetricCard
          label="Báo cáo chờ duyệt"
          value={pendingReports}
          subtext={pendingReports > 0 ? "Cần giảng viên chấm" : "Đã duyệt đầy đủ"}
          icon={<ClipboardCheck className="h-5 w-5" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-700"
          badge={pendingReports > 0 ? "Cần xử lý" : undefined}
          badgeTone="bg-amber-100 text-amber-800"
          onClick={() => onNavigateTab("review-reports")}
        />
        <MetricCard
          label="Sinh viên nộp trễ"
          value={lateRows.length}
          subtext={lateRows.length > 0 ? "Cần nhắc nhở sinh viên" : "Đúng tiến độ 100%"}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconBg="bg-rose-50"
          iconColor="text-rose-700"
          badge={lateRows.length > 0 ? "Cảnh báo" : undefined}
          badgeTone="bg-rose-100 text-rose-800"
        />
        <MetricCard
          label="Đánh giá đã gửi"
          value={evaluations.length}
          subtext="Điểm quá trình & cuối kỳ"
          icon={<BarChart3 className="h-5 w-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-700"
          onClick={() => onNavigateTab("evaluation-list")}
        />
      </div>

      {/* 5. Cảnh báo nộp báo cáo trễ */}
      <article className="overflow-hidden rounded-3xl border border-rose-200/90 bg-white shadow-xs">
        <div className="flex items-start justify-between border-b border-rose-100 px-6 py-4">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-slate-900 text-base">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              <span>Cảnh báo nộp báo cáo trễ</span>
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Chỉ tính các tuần đã kết thúc của sinh viên đang trong thời gian theo dõi học vụ.
            </p>
          </div>
          <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700">
            {lateRows.length} cần nhắc nhở
          </span>
        </div>

        {lateRows.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-bold">Sinh viên</th>
                  <th className="px-5 py-3 font-bold">Vị trí thực tập</th>
                  <th className="px-5 py-3 font-bold">Tuần chưa nộp</th>
                  <th className="px-5 py-3 font-bold">Trễ lâu nhất</th>
                  <th className="px-5 py-3 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lateRows.slice(0, 8).map((row) => (
                  <tr key={row.supervision.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-3.5">
                      <p className="font-bold text-slate-900 text-xs">
                        {row.supervision.placement.student.fullName}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {row.supervision.placement.student.studentCode} · {row.supervision.placement.student.major}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      <p className="font-semibold text-xs text-slate-800">
                        {row.supervision.placement.internship.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {row.supervision.placement.company.companyName}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-rose-700">
                      Tuần {row.missingWeeks.join(", ")}
                    </td>
                    <td className="px-5 py-3.5 font-extrabold text-rose-700">
                      {row.maxDaysLate} ngày
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => onOpenChat(row.supervision.placement.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 border border-teal-200 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition shadow-2xs cursor-pointer"
                        title={`Nhắn tin với ${row.supervision.placement.student.fullName}`}
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-teal-700" />
                        <span>Nhắn tin</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-10 text-center text-xs font-bold text-emerald-700 flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Tất cả sinh viên đều nộp báo cáo đúng tiến độ!</span>
          </div>
        )}
      </article>

      {/* 6. Tiến độ sinh viên đang phụ trách */}
      <article className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Tiến độ sinh viên đang phụ trách</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Số báo cáo đã nộp trên tổng số tuần yêu cầu trong thời gian theo dõi học vụ.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab("supervised-placements")}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline"
          >
            Xem tất cả →
          </button>
        </div>

        {progressRows.length ? (
          <div className="divide-y divide-slate-100">
            {progressRows.slice(0, 8).map((row) => {
              const student = row.supervision.placement.student;
              const percent = row.expectedWeeks
                ? Math.min(100, Math.round((row.submittedWeeks / row.expectedWeeks) * 100))
                : 0;
              const isLate = row.missingWeeks.length > 0;

              return (
                <div key={row.supervision.id} className="px-6 py-4 hover:bg-slate-50/60 transition">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-xs">
                        {student.fullName}{" "}
                        <span className="font-normal text-slate-500">
                          · {student.studentCode} · {student.major}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {row.supervision.placement.internship.title} · {row.supervision.placement.company.companyName}
                      </p>
                    </div>
                    <span
                      className={`w-fit rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isLate
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {isLate ? `Trễ ${row.missingWeeks.length} tuần` : "✓ Đúng tiến độ"}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 p-0.5 border border-slate-200/60">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isLate ? "bg-rose-500" : "bg-gradient-to-r from-emerald-500 to-teal-500"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-24 text-right text-xs font-bold text-slate-600">
                      {row.submittedWeeks}/{row.expectedWeeks} tuần
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-xs text-slate-500">
            Chưa có sinh viên nào đang trong thời gian theo dõi học vụ.
          </div>
        )}
      </article>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: number;
  subtext: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  badge?: string;
  badgeTone?: string;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon,
  iconBg,
  iconColor,
  badge,
  badgeTone,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className={`flex items-start justify-between rounded-2xl border border-slate-200/90 bg-white p-5 text-left shadow-xs transition-all ${
      onClick
        ? "hover:-translate-y-1 hover:shadow-md hover:border-teal-300 cursor-pointer"
        : "cursor-default"
    }`}
  >
    <div>
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 tracking-tight">
        {value}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <p className="text-xs text-slate-500 font-normal">{subtext}</p>
        {badge && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeTone}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
    <div
      className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}
    >
      {icon}
    </div>
  </button>
);
