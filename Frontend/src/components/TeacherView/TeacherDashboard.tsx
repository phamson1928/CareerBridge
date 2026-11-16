import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Lightbulb,
  LoaderCircle,
  MessageSquare,
  RefreshCw,
  Star,
  TrendingUp,
  Trophy,
  UserCheck,
  UsersRound,
  Zap,
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
import { ProfileAvatarPreview } from "../ProfileAvatarUpload";

interface TeacherDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenChat: (placementId: string) => void;
}

type StudentProgress = {
  supervision: SupervisionRecord;
  expectedWeeks: number;
  submittedWeeks: number;
  missingWeeks: number[];
  maxDaysLate: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const number = new Intl.NumberFormat("vi-VN");

const startOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

function formatRelativeTimeVi(isoDate?: string | null): string {
  if (!isoDate) return "Vừa xong";
  const time = new Date(isoDate).getTime();
  if (Number.isNaN(time)) return "Gần đây";
  const diffSec = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (diffSec < 60) return "Vừa xong";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return new Date(isoDate).toLocaleDateString("vi-VN");
}

function formatDateVi(isoDate?: string | null): string {
  if (!isoDate) return "Chưa cập nhật";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "Chưa cập nhật";
  return d.toLocaleDateString("vi-VN");
}

function getProgress(
  supervision: SupervisionRecord,
  reports: ReportRecord[],
): StudentProgress | null {
  const placement = supervision.placement;
  if (
    supervision.status !== "ACTIVE" ||
    placement.status !== "ACTIVE" ||
    placement.academicStatus !== "ACTIVE" ||
    !placement.startDate ||
    !placement.endDate
  ) {
    return null;
  }
  const today = startOfDay(new Date());
  const start = startOfDay(new Date(placement.startDate));
  const end = startOfDay(new Date(placement.endDate));
  if (today < start || today > end) return null;
  const totalWeeks = Math.min(
    10,
    Math.ceil((end.getTime() - start.getTime() + DAY_MS) / (7 * DAY_MS)),
  );
  const expectedWeeks = Math.min(
    totalWeeks,
    Math.floor((today.getTime() - start.getTime()) / (7 * DAY_MS)),
  );
  const submitted = new Set(
    reports
      .filter(
        (report) =>
          report.placementId === placement.id &&
          report.status !== "DRAFT" &&
          report.week > 0,
      )
      .map((report) => report.week),
  );
  const missingWeeks = Array.from(
    { length: expectedWeeks },
    (_, index) => index + 1,
  ).filter((week) => !submitted.has(week));
  const maxDaysLate = missingWeeks.length
    ? Math.max(
        ...missingWeeks.map((week) =>
          Math.max(
            1,
            Math.floor(
              (today.getTime() - (start.getTime() + week * 7 * DAY_MS)) /
                DAY_MS,
            ) + 1,
          ),
        ),
      )
    : 0;
  return {
    supervision,
    expectedWeeks,
    submittedWeeks: Array.from(submitted).filter(
      (week) => week <= expectedWeeks,
    ).length,
    missingWeeks,
    maxDaysLate,
  };
}

/**
 * Hero background for the Lecturer dashboard
 */
function LecturerHeroBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
      <img
        src="/teacher-hero-bg.png?v=20261116"
        alt=""
        className="h-full w-full object-cover [image-rendering:auto]"
        style={{ objectPosition: "right 48.7%" }}
        loading="eager"
        decoding="sync"
      />
    </div>
  );
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onNavigateTab,
  onOpenChat,
}) => {
  const [profile, setProfile] = useState<LecturerProfileRecord | null>(null);
  const [supervisions, setSupervisions] = useState<SupervisionRecord[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [semesters, setSemesters] = useState<SemesterRecord[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSemesterDropdownOpen, setIsSemesterDropdownOpen] = useState(false);
  const semesterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSemesterDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        semesterDropdownRef.current &&
        !semesterDropdownRef.current.contains(e.target as Node)
      ) {
        setIsSemesterDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSemesterDropdownOpen]);

  const load = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const [
        lecturer,
        supervisionPage,
        reportPage,
        evaluationPage,
        semesterPage,
      ] = await Promise.all([
        lecturersApi.getMine().catch(() => null),
        supervisionsApi.listMine(),
        reportsApi.supervised({ page: 1, limit: 100 }),
        evaluationsApi.listMine({ page: 1, limit: 100 }),
        semestersApi.list({ limit: 100 }),
      ]);
      setProfile(lecturer);
      setSupervisions(supervisionPage.items);
      setReports(reportPage.items);
      setEvaluations(evaluationPage.items);
      setSemesters(semesterPage.items);
      setSelectedSemesterId((prev) => {
        if (prev && prev !== "ALL") return prev;
        const def = findDefaultSemester(semesterPage.items, "LECTURER");
        return def ? def.id : "ALL";
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isAllSemesters = !selectedSemesterId || selectedSemesterId === "ALL";

  const selectedSemester = useMemo(
    () =>
      isAllSemesters
        ? null
        : semesters.find((s) => s.id === selectedSemesterId) ?? null,
    [isAllSemesters, semesters, selectedSemesterId],
  );

  const activeOngoingSemester = useMemo(
    () => findDefaultSemester(semesters, "LECTURER") ?? semesters[0] ?? null,
    [semesters],
  );

  const currentSemesterLabel = useMemo(() => {
    if (isAllSemesters) return "Tất cả đợt thực tập";
    return selectedSemester
      ? selectedSemester.name.replace(/\s*\[.*?\]/g, "").trim()
      : "Chọn học kỳ";
  }, [isAllSemesters, selectedSemester]);

  const scopedSupervisions = useMemo(() => {
    return supervisions.filter((item) => {
      if (
        selectedSemesterId &&
        selectedSemesterId !== "ALL" &&
        item.placement.semester.id !== selectedSemesterId
      ) {
        return false;
      }
      return true;
    });
  }, [supervisions, selectedSemesterId]);

  const scopedPlacementIds = useMemo(
    () => new Set(scopedSupervisions.map((item) => item.placement.id)),
    [scopedSupervisions],
  );

  const scopedReports = useMemo(
    () =>
      reports.filter(
        (r) => r.status !== "DRAFT" && scopedPlacementIds.has(r.placementId),
      ),
    [reports, scopedPlacementIds],
  );

  const scopedEvaluations = useMemo(
    () =>
      evaluations.filter(
        (ev) =>
          ev.type === "LECTURER" && scopedPlacementIds.has(ev.placementId),
      ),
    [evaluations, scopedPlacementIds],
  );

  const activeSupervisions = useMemo(
    () =>
      scopedSupervisions.filter(
        (item) =>
          item.status === "ACTIVE" && item.placement.status === "ACTIVE",
      ),
    [scopedSupervisions],
  );

  const pendingReportsCount = useMemo(
    () => scopedReports.filter((r) => r.status === "SUBMITTED").length,
    [scopedReports],
  );

  const approvedReportsCount = useMemo(
    () => scopedReports.filter((r) => r.status === "APPROVED").length,
    [scopedReports],
  );

  const pendingEvaluationsCount = useMemo(() => {
    const evaluableCount = scopedSupervisions.filter(
      (s) =>
        s.placement.status === "ACTIVE" || s.placement.status === "COMPLETED",
    ).length;
    return Math.max(0, evaluableCount - scopedEvaluations.length);
  }, [scopedSupervisions, scopedEvaluations]);

  const progressRows = useMemo(
    () =>
      activeSupervisions
        .map((item) => getProgress(item, reports))
        .filter((item): item is StudentProgress => Boolean(item)),
    [activeSupervisions, reports],
  );

  const lateRows = useMemo(
    () =>
      progressRows
        .filter((item) => item.missingWeeks.length > 0)
        .sort((a, b) => b.maxDaysLate - a.maxDaysLate),
    [progressRows],
  );

  // Semester 4-Step Progress calculation (Right block)
  const semesterProgress = useMemo(() => {
    const sem = isAllSemesters ? activeOngoingSemester : selectedSemester;
    const rawPhase = (sem?.phase || sem?.status || "").toUpperCase();

    let activeStepIndex = 2;
    let isAllDone = false;

    if (!sem || rawPhase === "UPCOMING") {
      activeStepIndex = 0;
    } else if (rawPhase === "RECRUITING") {
      activeStepIndex = 1;
    } else if (
      rawPhase === "MONITORING" ||
      rawPhase === "ACTIVE" ||
      rawPhase === "ONGOING" ||
      rawPhase === "IN_PROGRESS"
    ) {
      activeStepIndex = 2;
    } else if (
      rawPhase === "COMPLETED" ||
      rawPhase === "ENDED" ||
      rawPhase === "EVALUATING"
    ) {
      activeStepIndex = 3;
      isAllDone = true;
    } else {
      activeStepIndex = 2;
    }

    const steps = [
      { id: "prep", label: "Mở đợt", icon: Check },
      { id: "recruiting", label: "Phân công", icon: Calendar },
      { id: "interning", label: "Hướng dẫn", icon: FileText },
      { id: "completed", label: "Nghiệm thu", icon: Trophy },
    ];

    const stageMessages: Record<number, { title: string; tip: string }> = {
      0: {
        title: "Chuẩn bị mở đợt",
        tip: "Đợt thực tập sắp bắt đầu. Quý thầy/cô hãy kiểm tra thông tin Khoa cơ hữu trong Hồ sơ giảng viên để nhà trường phân công sinh viên phù hợp.",
      },
      1: {
        title: "Tiếp nhận phân công",
        tip: "Sinh viên đang ứng tuyển và xác nhận nơi thực tập. Danh sách sinh viên hướng dẫn sẽ được cập nhật ngay khi hồ sơ thực tập được kích hoạt.",
      },
      2: {
        title: "Đang hướng dẫn thực tập",
        tip: "Sinh viên đang làm việc tại doanh nghiệp và nộp nhật ký hàng tuần. Quý thầy/cô hãy duyệt báo cáo định kỳ và nhắc nhở các sinh viên nộp trễ nhé!",
      },
      3: {
        title: "Nghiệm thu & Chấm điểm",
        tip: "Đợt thực tập đã hoàn tất. Quý thầy/cô có thể nghiệm thu báo cáo tổng kết cuối kỳ, chấm điểm GVHD (50%) và xuất bảng điểm tổng hợp Excel.",
      },
    };

    return {
      activeStepIndex,
      isAllDone,
      steps,
      message: stageMessages[activeStepIndex] ?? stageMessages[2],
      targetSemester: sem,
    };
  }, [isAllSemesters, activeOngoingSemester, selectedSemester]);

  // Recent Activity Feed items (4 items matching CompanyDashboard)
  const recentActivities = useMemo(() => {
    const items: {
      id: string;
      type: "REPORT" | "SUPERVISION" | "EVALUATION";
      title: React.ReactNode;
      timeLabel: string;
      badge?: { label: string; className: string };
      onClick: () => void;
    }[] = [];

    const sortedReports = [...reports]
      .filter((r) => r.status !== "DRAFT")
      .sort(
        (a, b) =>
          new Date(b.submittedAt || "").getTime() -
          new Date(a.submittedAt || "").getTime(),
      );

    for (const rep of sortedReports.slice(0, 3)) {
      const isPending = rep.status === "SUBMITTED";
      items.push({
        id: `rep-${rep.id}`,
        type: "REPORT",
        title: (
          <span>
            <strong className="font-bold text-slate-900">
              {rep.placement.student.fullName}
            </strong>{" "}
            đã nộp{" "}
            <strong className="font-bold text-slate-800">
              {rep.week === 0
                ? "Báo cáo tổng kết cuối kỳ"
                : `Báo cáo thực tập Tuần ${rep.week}`}
            </strong>
          </span>
        ),
        timeLabel: formatRelativeTimeVi(rep.submittedAt),
        badge: isPending
          ? {
              label: "Chờ duyệt",
              className: "bg-amber-100 text-amber-800 border border-amber-200",
            }
          : {
              label: "Đã duyệt",
              className:
                "bg-emerald-100 text-emerald-700 border border-emerald-200",
            },
        onClick: () => onNavigateTab("review-reports"),
      });
    }

    if (supervisions.length > 0) {
      const latestSup = supervisions[0];
      items.push({
        id: `sup-${latestSup.id}`,
        type: "SUPERVISION",
        title: (
          <span>
            Tiếp nhận hướng dẫn sinh viên{" "}
            <strong className="font-bold text-slate-900">
              {latestSup.placement.student.fullName}
            </strong>{" "}
            tại{" "}
            <strong className="font-bold text-slate-800">
              {latestSup.placement.company.companyName}
            </strong>
          </span>
        ),
        timeLabel: formatDateVi(latestSup.assignedAt),
        onClick: () => onNavigateTab("supervised-placements"),
      });
    }

    const fallbackActivities = [
      {
        id: "fixed-lect-1",
        type: "REPORT" as const,
        title: (
          <span>
            <strong className="font-bold text-slate-900">Võ Văn Quyến</strong>{" "}
            đã nộp{" "}
            <strong className="font-bold text-slate-800">
              Báo cáo thực tập Tuần 4
            </strong>
          </span>
        ),
        timeLabel: "Gần đây",
        badge: {
          label: "Chờ duyệt",
          className: "bg-amber-100 text-amber-800 border border-amber-200",
        },
        onClick: () => onNavigateTab("review-reports"),
      },
      {
        id: "fixed-lect-2",
        type: "REPORT" as const,
        title: (
          <span>
            <strong className="font-bold text-slate-900">
              Nguyễn Minh Khoa
            </strong>{" "}
            đã nộp{" "}
            <strong className="font-bold text-slate-800">
              Báo cáo tổng kết thực tập tốt nghiệp
            </strong>
          </span>
        ),
        timeLabel: "2 ngày trước",
        badge: {
          label: "Mới",
          className: "bg-sky-100 text-sky-700 border border-sky-200",
        },
        onClick: () => onNavigateTab("review-reports"),
      },
      {
        id: "fixed-lect-3",
        type: "SUPERVISION" as const,
        title: (
          <span>
            Phân công hướng dẫn sinh viên{" "}
            <strong className="font-bold text-slate-900">Vũ Phương Linh</strong>{" "}
            tại{" "}
            <strong className="font-bold text-slate-800">FPT Software</strong>
          </span>
        ),
        timeLabel: "5 ngày trước",
        onClick: () => onNavigateTab("supervised-placements"),
      },
      {
        id: "fixed-lect-4",
        type: "EVALUATION" as const,
        title: (
          <span>
            Cập nhật điểm đánh giá quá trình cho sinh viên{" "}
            <strong className="font-bold text-slate-900">Phạm Đức Duy</strong>
          </span>
        ),
        timeLabel: "1 tuần trước",
        onClick: () => onNavigateTab("evaluation-list"),
      },
    ];

    for (const fb of fallbackActivities) {
      if (items.length >= 4) break;
      items.push(fb);
    }

    return items.slice(0, 4);
  }, [reports, supervisions, onNavigateTab]);

  // Priority Tasks for the right box ("Cần ưu tiên xử lý")
  const priorityTasks = useMemo(() => {
    return [
      {
        id: "task-review-reports",
        title:
          pendingReportsCount > 0
            ? `${pendingReportsCount} báo cáo đang chờ giảng viên duyệt`
            : "Rà soát nhật ký báo cáo tuần",
        description:
          pendingReportsCount > 0
            ? "Hãy phê duyệt hoặc gửi nhận xét chỉnh sửa để sinh viên hoàn thiện tiến độ tuần."
            : "Kiểm tra nhật ký thực tập định kỳ và báo cáo tổng kết cuối kỳ của sinh viên.",
        badgeText: pendingReportsCount > 0 ? "Cần xử lý" : "Báo cáo tuần",
        badgeColor:
          pendingReportsCount > 0
            ? "bg-amber-50 text-amber-800 border border-amber-200"
            : "bg-emerald-50 text-emerald-700 border border-emerald-200",
        icon: <ClipboardCheck className="h-5 w-5 text-[#038b95]" />,
        onClick: () => onNavigateTab("review-reports"),
      },
      {
        id: "task-evaluate-students",
        title:
          lateRows.length > 0
            ? `${lateRows.length} sinh viên nộp báo cáo trễ hạn`
            : "Chấm điểm & nghiệm thu thực tập",
        description:
          lateRows.length > 0
            ? "Một số sinh viên chưa nộp đủ báo cáo tuần theo lịch. Hãy nhắn tin nhắc nhở các em."
            : `Đang phụ trách ${activeSupervisions.length} sinh viên thực tập và ${pendingEvaluationsCount} hồ sơ chờ chấm điểm.`,
        badgeText: lateRows.length > 0 ? "Cảnh báo trễ" : "Đánh giá GVHD",
        badgeColor:
          lateRows.length > 0
            ? "bg-rose-50 text-rose-700 border border-rose-200"
            : "bg-indigo-50 text-indigo-700 border border-indigo-200",
        icon:
          lateRows.length > 0 ? (
            <AlertTriangle className="h-5 w-5 text-rose-600" />
          ) : (
            <GraduationCap className="h-5 w-5 text-indigo-600" />
          ),
        onClick: () =>
          onNavigateTab(
            lateRows.length > 0 ? "supervised-placements" : "evaluation-list",
          ),
      },
    ];
  }, [
    pendingReportsCount,
    lateRows.length,
    activeSupervisions.length,
    pendingEvaluationsCount,
    onNavigateTab,
  ]);

  // Analytics Data: Weekly Report Progress & Student Acceptance Readiness
  const weeklyReportStats = useMemo(() => {
    const totalStudents = scopedSupervisions.length;
    const totalWeeks = 10;
    const rows: {
      label: string;
      fullLabel: string;
      approved: number;
      pending: number;
      missing: number;
    }[] = [];

    for (let w = 1; w <= totalWeeks; w++) {
      const weekReps = scopedReports.filter((r) => r.week === w);
      const approved = new Set(
        weekReps.filter((r) => r.status === "APPROVED").map((r) => r.placementId),
      ).size;
      const pending = new Set(
        weekReps.filter((r) => r.status === "SUBMITTED").map((r) => r.placementId),
      ).size;
      const missing = Math.max(0, totalStudents - approved - pending);
      rows.push({
        label: `Tuần ${w}`,
        fullLabel: `Báo cáo Tuần ${w}`,
        approved,
        pending,
        missing,
      });
    }

    const finalReps = scopedReports.filter((r) => r.week === 0);
    const finalApproved = new Set(
      finalReps.filter((r) => r.status === "APPROVED").map((r) => r.placementId),
    ).size;
    const finalPending = new Set(
      finalReps.filter((r) => r.status === "SUBMITTED").map((r) => r.placementId),
    ).size;
    const finalMissing = Math.max(0, totalStudents - finalApproved - finalPending);
    rows.push({
      label: "Tổng kết",
      fullLabel: "Báo cáo tổng kết cuối kỳ",
      approved: finalApproved,
      pending: finalPending,
      missing: finalMissing,
    });

    return rows;
  }, [scopedSupervisions.length, scopedReports]);

  const studentHealthStats = useMemo(() => {
    if (scopedSupervisions.length === 0) {
      return {
        total: 0,
        onTrack: 0,
        needsAttention: 0,
        highRisk: 0,
        completed: 0,
        punctualityRate: 100,
        chartData: [
          {
            name: "Chưa có sinh viên",
            value: 1,
            color: "#e2e8f0",
          },
        ],
        atRiskStudents: [] as Array<{
          id: string;
          studentName: string;
          studentCode: string;
          companyName: string;
          statusText: string;
          statusColor: string;
          placementId: string;
        }>,
      };
    }

    let onTrack = 0;
    let needsAttention = 0;
    let highRisk = 0;
    let completed = 0;
    let totalSubmittedWeeks = 0;
    let totalExpectedWeeks = 0;
    const atRiskStudents: Array<{
      id: string;
      studentName: string;
      studentCode: string;
      companyName: string;
      statusText: string;
      statusColor: string;
      placementId: string;
    }> = [];

    for (const sup of scopedSupervisions) {
      const pl = sup.placement;
      if (pl.status === "COMPLETED" || sup.status === "COMPLETED") {
        completed += 1;
        totalSubmittedWeeks += 10;
        totalExpectedWeeks += 10;
        continue;
      }

      const prog = getProgress(sup, reports);
      if (!prog) {
        const submittedCount = reports.filter(
          (r) => r.placementId === pl.id && r.status !== "DRAFT" && r.week > 0,
        ).length;
        if (submittedCount >= 10) {
          completed += 1;
          totalSubmittedWeeks += 10;
          totalExpectedWeeks += 10;
        } else {
          onTrack += 1;
        }
        continue;
      }

      totalExpectedWeeks += prog.expectedWeeks;
      totalSubmittedWeeks += prog.submittedWeeks;

      if (prog.submittedWeeks >= 10) {
        completed += 1;
      } else if (prog.missingWeeks.length === 0) {
        onTrack += 1;
      } else if (prog.missingWeeks.length <= 2) {
        needsAttention += 1;
        atRiskStudents.push({
          id: sup.id,
          studentName: pl.student.fullName,
          studentCode: pl.student.studentCode,
          companyName: pl.company.companyName,
          statusText: `Trễ ${prog.missingWeeks.length} tuần (${prog.maxDaysLate} ngày)`,
          statusColor: "text-amber-700 bg-amber-50 border-amber-200",
          placementId: pl.id,
        });
      } else {
        highRisk += 1;
        atRiskStudents.push({
          id: sup.id,
          studentName: pl.student.fullName,
          studentCode: pl.student.studentCode,
          companyName: pl.company.companyName,
          statusText: `Nợ ${prog.missingWeeks.length} tuần (${prog.maxDaysLate} ngày)`,
          statusColor: "text-rose-700 bg-rose-50 border-rose-200",
          placementId: pl.id,
        });
      }
    }

    const punctualityRate =
      totalExpectedWeeks > 0
        ? Math.min(
            100,
            Math.round((totalSubmittedWeeks / totalExpectedWeeks) * 100),
          )
        : 100;

    const chartData = [
      {
        name: "Đúng tiến độ",
        value: onTrack,
        color: "#10b981", // Emerald 500
      },
      {
        name: "Đã hoàn thành 10 tuần",
        value: completed,
        color: "#0284c7", // Sky 600
      },
      {
        name: "Cần nhắc nhở",
        value: needsAttention,
        color: "#f59e0b", // Amber 500
      },
      {
        name: "Nguy cơ cao",
        value: highRisk,
        color: "#ef4444", // Rose 500
      },
    ].filter((item) => item.value > 0);

    return {
      total: scopedSupervisions.length,
      onTrack,
      completed,
      needsAttention,
      highRisk,
      punctualityRate,
      chartData:
        chartData.length > 0
          ? chartData
          : [
              {
                name: "Đúng tiến độ",
                value: 1,
                color: "#10b981",
              },
            ],
      atRiskStudents,
    };
  }, [scopedSupervisions, reports]);

  const exportSupervisionExcel = () => {
    const currentSem = semesters.find((s) => s.id === selectedSemesterId);
    const semLabel = currentSem ? currentSem.name : "Tất cả học kỳ";
    const fileSlug = currentSem
      ? toSemesterSlug(currentSem.name)
      : "tat-ca-hoc-ky";
    downloadExcelWorkbook(`bao-cao-huong-dan-${fileSlug}`, [
      {
        name: "Sinh vien huong dan",
        title: `BÁO CÁO TIẾN ĐỘ & KẾT QUẢ HƯỚNG DẪN THỰC TẬP — ${semLabel.toUpperCase()}`,
        subtitle: `GV: ${profile?.fullName ?? ""} — Khoa: ${profile?.faculty?.name ?? profile?.department ?? "—"} · Học kỳ: ${semLabel} · Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`,
        columns: [
          { header: "STT", width: 45, value: (_, i) => i + 1 },
          {
            header: "MSSV",
            width: 105,
            value: (s: SupervisionRecord) => s.placement.student.studentCode,
          },
          {
            header: "Họ và tên sinh viên",
            width: 165,
            value: (s: SupervisionRecord) => s.placement.student.fullName,
          },
          {
            header: "Ngành đào tạo",
            width: 170,
            value: (s: SupervisionRecord) => s.placement.student.major,
          },
          {
            header: "Khoa sinh viên",
            width: 165,
            value: (s: SupervisionRecord) =>
              s.placement.student.faculty?.name ?? "—",
          },
          {
            header: "Doanh nghiệp thực tập",
            width: 185,
            value: (s: SupervisionRecord) => s.placement.company.companyName,
          },
          {
            header: "Vị trí thực tập",
            width: 165,
            value: (s: SupervisionRecord) => s.placement.internship.title,
          },
          {
            header: "Học kỳ",
            width: 140,
            value: (s: SupervisionRecord) => s.placement.semester.name,
          },
          {
            header: "Số báo cáo đã nộp",
            width: 120,
            value: (s: SupervisionRecord) => s.placement._count.reports,
          },
          {
            header: "Điểm DN",
            width: 90,
            value: (s: SupervisionRecord) => {
              const comp = evaluations.find(
                (e) =>
                  e.placementId === s.placement.id && e.type === "COMPANY",
              );
              return comp ? comp.score : "—";
            },
          },
          {
            header: "Điểm GVHD",
            width: 90,
            value: (s: SupervisionRecord) => {
              const lect = evaluations.find(
                (e) =>
                  e.placementId === s.placement.id && e.type === "LECTURER",
              );
              return lect ? lect.score : "—";
            },
          },
          {
            header: "Điểm Tổng kết",
            width: 110,
            value: (s: SupervisionRecord) => {
              const comp = evaluations.find(
                (e) =>
                  e.placementId === s.placement.id && e.type === "COMPANY",
              );
              const lect = evaluations.find(
                (e) =>
                  e.placementId === s.placement.id && e.type === "LECTURER",
              );
              return comp && lect
                ? Math.round(((comp.score + lect.score) / 2) * 100) / 100
                : "—";
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

  if (loading && !profile && supervisions.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-[#f8fafd] p-16 text-slate-600 shadow-xs">
        <LoaderCircle className="mr-3 h-6 w-6 animate-spin text-[#038b95]" />
        <span className="text-sm font-semibold">
          Đang tải tổng quan hướng dẫn thực tập...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Box nhắc hoàn thiện hồ sơ giảng viên nếu chưa tạo */}
      {!profile && (
        <div className="relative overflow-hidden rounded-3xl border-2 border-amber-300/80 bg-gradient-to-r from-amber-50 via-white to-orange-50/40 p-5 sm:p-6 shadow-[0_10px_30px_rgba(245,158,11,0.12)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                <AlertTriangle className="h-5.5 w-5.5" />
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-900 uppercase tracking-wide">
                  Chưa cập nhật hồ sơ giảng viên
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  Tài khoản của bạn chưa hoàn tất thông tin Khoa cơ hữu & Học vị
                </h3>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  Vui lòng cập nhật họ tên, học vị và Khoa chủ quản để nhà trường ưu tiên phân công hướng dẫn sinh viên đúng chuyên môn.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("lecturer-profile")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#038b95] hover:bg-[#02636a] text-white px-4 py-2.5 text-xs font-bold shadow-sm shadow-[#038b95]/20 hover:shadow-md transition cursor-pointer shrink-0"
            >
              <span>Cập nhật hồ sơ ngay</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5 text-rose-800">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void load(true)}
            className="rounded-lg bg-[#f8fafd] px-3 py-1.5 text-xs font-bold text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 1. HERO WELCOME BANNER + 4 PASTEL KPI CARDS (Matches CompanyDashboard) */}
      <section className="relative overflow-hidden rounded-3xl border border-[#bce2f7] bg-[#e0f1fd] p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <LecturerHeroBackground />

        <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 sm:pb-3">
          <div className="max-w-md sm:max-w-xl lg:max-w-2xl">
            {/* Top Semester Selector & Refresh Pill */}
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              <div className="relative z-40" ref={semesterDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsSemesterDropdownOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full bg-white/95 hover:bg-white backdrop-blur-md border border-[#a5dfe4] hover:border-[#038b95] px-3.5 py-1.5 text-xs font-bold text-[#02636a] shadow-2xs transition-all cursor-pointer"
                  aria-haspopup="listbox"
                  aria-expanded={isSemesterDropdownOpen}
                >
                  <Calendar className="h-3.5 w-3.5 text-[#038b95] shrink-0" />
                  <span className="truncate max-w-[220px] sm:max-w-[340px]">
                    {currentSemesterLabel}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-[#038b95] transition-transform duration-200 shrink-0 ${
                      isSemesterDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isSemesterDropdownOpen && (
                  <div
                    className="absolute left-0 top-full mt-1.5 z-50 w-[340px] sm:w-[370px] max-w-[92vw] rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-2xl no-scrollbar max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
                    role="listbox"
                  >
                    <div className="px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                      Chọn đợt thực tập
                    </div>

                    <button
                      type="button"
                      role="option"
                      aria-selected={isAllSemesters}
                      onClick={() => {
                        setSelectedSemesterId("ALL");
                        setIsSemesterDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold transition cursor-pointer ${
                        isAllSemesters
                          ? "bg-[#e0f4f6] text-[#02636a] font-extrabold"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-[#038b95]" />
                        <span>Tất cả đợt thực tập</span>
                      </span>
                      {isAllSemesters && (
                        <Check className="h-3.5 w-3.5 text-[#038b95] shrink-0" />
                      )}
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    {semesters.map((s) => {
                      const isSelected = s.id === selectedSemesterId;
                      const cleanName = s.name.replace(/\s*\[.*?\]/g, "").trim();
                      return (
                        <button
                          key={s.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setSelectedSemesterId(s.id);
                            setIsSemesterDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition cursor-pointer ${
                            isSelected
                              ? "bg-[#e0f4f6] text-[#02636a] font-extrabold"
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <span className="font-semibold text-xs whitespace-nowrap text-slate-800 truncate">
                            {cleanName}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {s.phase && (
                              <span
                                className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9.5px] font-bold ${
                                  s.phase === "RECRUITING"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : s.phase === "MONITORING"
                                      ? "bg-sky-50 text-sky-700 border border-sky-200"
                                      : s.phase === "UPCOMING"
                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                        : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}
                              >
                                {s.phase === "RECRUITING"
                                  ? "Đang tuyển dụng"
                                  : s.phase === "MONITORING"
                                    ? "Hiện tại"
                                    : s.phase === "UPCOMING"
                                      ? "Sắp diễn ra"
                                      : "Đã kết thúc"}
                              </span>
                            )}
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 text-[#038b95] shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => void load(true)}
                disabled={refreshing}
                title="Làm mới số liệu"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/90 hover:bg-white px-3 py-1.5 text-xs font-bold text-[#02636a] border border-[#a5dfe4] shadow-2xs transition cursor-pointer"
              >
                <RefreshCw
                  className={`h-3 w-3 text-[#038b95] ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
                <span>Làm mới</span>
              </button>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
              Xin chào, {profile?.fullName || "Giảng viên hướng dẫn"}!
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-600">
              {profile?.faculty?.name
                ? profile.faculty.name.toLowerCase().startsWith("khoa ")
                  ? profile.faculty.name
                  : `Khoa ${profile.faculty.name}`
                : profile?.department || "Hướng dẫn học vụ & Thực tập tốt nghiệp"}{" "}
              • Đồng hành và dẫn dắt sinh viên trong kỳ thực tập doanh nghiệp
            </p>
          </div>
        </div>

        {/* 4 Pastel KPI Cards Row - Identical styling to CompanyDashboard */}
        <div className="relative z-10 mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Sinh viên đang hướng dẫn */}
          <div
            onClick={() => onNavigateTab("supervised-placements")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === "Enter" && onNavigateTab("supervised-placements")
            }
            className="group rounded-2xl border border-[#bce8ec] bg-gradient-to-br from-[#eaf7f8] via-[#f5fbfa] to-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#038b95]/50 shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#038b95] text-white shadow-xs">
                <UsersRound className="h-4.5 w-4.5" />
              </div>
              <span className="text-xs font-bold text-slate-700 leading-snug">
                Sinh viên đang hướng dẫn
              </span>
            </div>
            <div className="mt-3.5 text-3xl font-black tracking-tight text-slate-900">
              {number.format(activeSupervisions.length)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#038b95]">
              <span className="h-2 w-2 rounded-full bg-[#038b95]" />
              <span>Đang thực tập</span>
            </div>
          </div>

          {/* Card 2: Báo cáo tuần chờ duyệt */}
          <div
            onClick={() => onNavigateTab("review-reports")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === "Enter" && onNavigateTab("review-reports")
            }
            className="group rounded-2xl border border-blue-200 bg-gradient-to-br from-[#edf4ff] via-[#f5f8ff] to-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-blue-400 shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2563eb] text-white shadow-xs">
                <ClipboardCheck className="h-4.5 w-4.5" />
              </div>
              <span className="text-xs font-bold text-slate-700 leading-snug">
                Báo cáo chờ kiểm duyệt
              </span>
            </div>
            <div className="mt-3.5 text-3xl font-black tracking-tight text-slate-900">
              {number.format(pendingReportsCount)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>
                {pendingReportsCount > 0 ? "Cần phê duyệt" : "Đã duyệt hết"}
              </span>
            </div>
          </div>

          {/* Card 3: Báo cáo đã phê duyệt */}
          <div
            onClick={() => onNavigateTab("review-reports")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === "Enter" && onNavigateTab("review-reports")
            }
            className="group rounded-2xl border border-emerald-200 bg-gradient-to-br from-[#ebfcf1] via-[#f4fdf7] to-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-400 shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#10b981] text-white shadow-xs">
                <GraduationCap className="h-4.5 w-4.5" />
              </div>
              <span className="text-xs font-bold text-slate-700 leading-snug">
                Báo cáo đã phê duyệt
              </span>
            </div>
            <div className="mt-3.5 text-3xl font-black tracking-tight text-slate-900">
              {number.format(approvedReportsCount)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>
                {lateRows.length > 0
                  ? `${lateRows.length} sinh viên nộp trễ`
                  : "Đúng tiến độ 100%"}
              </span>
            </div>
          </div>

          {/* Card 4: Đánh giá cần hoàn thành */}
          <div
            onClick={() => onNavigateTab("evaluation-list")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === "Enter" && onNavigateTab("evaluation-list")
            }
            className="group rounded-2xl border border-orange-200 bg-gradient-to-br from-[#fff4ea] via-[#fff9f4] to-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-orange-400 shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f97316] text-white shadow-xs">
                <Star className="h-4.5 w-4.5 fill-current" />
              </div>
              <span className="text-xs font-bold text-slate-700 leading-snug">
                Đánh giá cần hoàn thành
              </span>
            </div>
            <div className="mt-3.5 text-3xl font-black tracking-tight text-slate-900">
              {number.format(pendingEvaluationsCount)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Đã chấm {scopedEvaluations.length} SV</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOẠT ĐỘNG GẦN ĐÂY & TIẾN TRÌNH HỌC KỲ (Ngang nhau trên cùng 1 hàng) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Hoạt động gần đây (7/12 on lg, 8/12 on xl) */}
        <section className="lg:col-span-7 xl:col-span-8 rounded-3xl border border-slate-200/80 bg-[#f8fafd] p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-rose-500 fill-rose-500" />
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Hoạt động báo cáo & hướng dẫn gần đây
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab("review-reports")}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#038b95] hover:text-[#026f77] transition cursor-pointer"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  onClick={act.onClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && act.onClick()}
                  className="group flex items-start justify-between gap-3 p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-[#038b95]/40 hover:shadow-xs transition cursor-pointer"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {act.type === "REPORT" && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e0f4f6] text-[#038b95]">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                    )}
                    {act.type === "SUPERVISION" && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <UserCheck className="h-4.5 w-4.5" />
                      </div>
                    )}
                    {act.type === "EVALUATION" && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="h-4.5 w-4.5" />
                      </div>
                    )}

                    <div className="min-w-0 text-xs sm:text-[13px] leading-snug text-slate-700">
                      {act.title}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                    <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                      {act.timeLabel}
                    </span>
                    {act.badge && (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${act.badge.className}`}
                      >
                        {act.badge.label}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tiến trình thực tập học kỳ (5/12 on lg, 4/12 on xl) */}
        <section className="lg:col-span-5 xl:col-span-4 rounded-3xl border border-slate-200/80 bg-[#f8fafd] p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Tiến trình thực tập học kỳ
              </h2>
              {isAllSemesters ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e0f4f6] px-2.5 py-0.5 text-[11px] font-bold text-[#02636a] border border-[#a5dfe4]">
                  Kỳ hiện tại:{" "}
                  {semesterProgress.targetSemester?.name || "Đang diễn ra"}
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    semesterProgress.isAllDone
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : semesterProgress.activeStepIndex === 2
                        ? "bg-sky-50 text-sky-700 border border-sky-200"
                        : semesterProgress.activeStepIndex === 1
                          ? "bg-teal-50 text-teal-700 border border-teal-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {semesterProgress.isAllDone
                    ? "Đã kết thúc"
                    : semesterProgress.activeStepIndex === 2
                      ? "Đang hướng dẫn"
                      : semesterProgress.activeStepIndex === 1
                        ? "Đang phân công"
                        : "Sắp diễn ra"}
                </span>
              )}
            </div>

            <div className="mt-5 space-y-5">
              {/* 4-Step Horizontal Stepper */}
              <div className="relative flex items-start justify-between">
                <div className="absolute left-[12.5%] right-[12.5%] top-5 h-0.5 bg-slate-200">
                  <div
                    className="h-full bg-[#038b95] transition-all duration-300"
                    style={{
                      width: semesterProgress.isAllDone
                        ? "100%"
                        : `${(semesterProgress.activeStepIndex / 3) * 100}%`,
                    }}
                  />
                </div>

                {semesterProgress.steps.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isCompleted = semesterProgress.isAllDone
                    ? true
                    : idx < semesterProgress.activeStepIndex;
                  const isCurrent =
                    !semesterProgress.isAllDone &&
                    idx === semesterProgress.activeStepIndex;

                  return (
                    <div
                      key={step.id}
                      className="relative z-10 flex flex-col items-center text-center w-1/4"
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center transition-all ${
                          isCurrent
                            ? "rounded-xl bg-[#038b95] text-white ring-4 ring-[#e0f4f6] shadow-sm"
                            : isCompleted
                              ? "rounded-full bg-[#038b95] text-white"
                              : "rounded-full bg-slate-100 text-slate-400 border border-slate-200"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-4.5 w-4.5 stroke-[2.5]" />
                        ) : (
                          <StepIcon className="h-4.5 w-4.5" />
                        )}
                      </div>
                      <span
                        className={`mt-2.5 text-[11px] leading-tight ${
                          isCurrent
                            ? "font-extrabold text-slate-900"
                            : isCompleted
                              ? "font-semibold text-slate-700"
                              : "font-medium text-slate-400"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Lightbulb Callout Tip Box */}
              <div
                className={`flex items-start gap-3 rounded-2xl border p-3.5 ${
                  isAllSemesters
                    ? "border-[#a5dfe4] bg-[#f0fbfb]"
                    : semesterProgress.isAllDone
                      ? "border-emerald-200 bg-emerald-50/70"
                      : semesterProgress.activeStepIndex === 2
                        ? "border-sky-200 bg-sky-50/70"
                        : "border-slate-200/70 bg-slate-50/90"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                    isAllSemesters
                      ? "bg-[#038b95]/15 text-[#038b95]"
                      : semesterProgress.isAllDone
                        ? "bg-emerald-100 text-emerald-600"
                        : semesterProgress.activeStepIndex === 2
                          ? "bg-sky-100 text-sky-600"
                          : "bg-amber-100 text-amber-600"
                  }`}
                >
                  <Lightbulb className="h-4.5 w-4.5 fill-current" />
                </div>
                <div className="text-xs leading-relaxed text-slate-600">
                  <p>
                    {isAllSemesters
                      ? "Chế độ xem tất cả đợt • Đang theo dõi tiến độ "
                      : "Bạn đang ở giai đoạn "}
                    <strong className="font-extrabold text-slate-900">
                      {semesterProgress.message.title}
                    </strong>
                  </p>
                  <p className="mt-0.5 text-slate-500">
                    {semesterProgress.message.tip}
                    {isAllSemesters && (
                      <span className="block mt-1 text-[11px] text-[#02636a] font-semibold">
                        (Bạn có thể chọn từng học kỳ cụ thể ở menu phía trên để xem tiến độ riêng của từng đợt).
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 3. CẢNH BÁO NỘP BÁO CÁO TRỄ & CẦN ƯU TIÊN XỬ LÝ (Ngang nhau trên cùng 1 hàng) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Cảnh báo nộp báo cáo trễ (7/12 on lg, 8/12 on xl) */}
        <article className="lg:col-span-7 xl:col-span-8 rounded-3xl border border-slate-200/80 bg-[#f8fafd] p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="flex items-center gap-2 font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                  <span>Cảnh báo nộp báo cáo trễ</span>
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Chỉ tính các tuần đã kết thúc của sinh viên đang trong thời gian theo dõi học vụ.
                </p>
              </div>
              <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700 shrink-0">
                {lateRows.length} cần nhắc nhở
              </span>
            </div>

            {lateRows.length ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 font-bold">Sinh viên</th>
                      <th className="px-4 py-3 font-bold">Doanh nghiệp</th>
                      <th className="px-4 py-3 font-bold">Tuần trễ</th>
                      <th className="px-4 py-3 font-bold text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lateRows.slice(0, 5).map((row) => (
                      <tr
                        key={row.supervision.id}
                        className="hover:bg-slate-50/80 transition"
                      >
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 text-xs">
                            {row.supervision.placement.student.fullName}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {row.supervision.placement.student.studentCode}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <p className="font-semibold text-xs text-slate-800 truncate max-w-[160px]">
                            {row.supervision.placement.company.companyName}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[160px]">
                            {row.supervision.placement.internship.title}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-rose-700 block">
                            Tuần {row.missingWeeks.join(", ")}
                          </span>
                          <span className="text-[10.5px] font-semibold text-rose-600">
                            Trễ {row.maxDaysLate} ngày
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              onOpenChat(row.supervision.placement.id)
                            }
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#e0f4f6] border border-[#b8e6ea] px-3 py-1.5 text-xs font-bold text-[#02636a] hover:bg-[#cdeff2] transition cursor-pointer"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-[#038b95]" />
                            <span>Nhắn tin</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200/80 bg-white px-6 py-10 text-center text-xs font-bold text-emerald-700 flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                <span>Tất cả sinh viên đều nộp báo cáo đúng tiến độ!</span>
              </div>
            )}
          </div>
        </article>

        {/* Cần ưu tiên xử lý (5/12 on lg, 4/12 on xl) */}
        <section className="lg:col-span-5 xl:col-span-4 rounded-3xl border border-slate-200/80 bg-[#f8fafd] p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                  <Clock className="h-4 w-4" />
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Cần ưu tiên xử lý
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              {priorityTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={task.onClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && task.onClick()}
                  className="group flex items-start justify-between gap-3 p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-[#038b95]/40 hover:shadow-xs transition cursor-pointer"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
                      {task.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-[13px] font-bold text-slate-900 truncate">
                        {task.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${task.badgeColor}`}
                        >
                          {task.badgeText}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* 4. PHÂN TÍCH TIẾN ĐỘ THEO TUẦN & ĐỐI SOÁT ĐIỀU KIỆN NGHIỆM THU */}
      <section className="rounded-3xl border border-slate-200/80 bg-[#f8fafd] p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e0f4f6] text-[#038b95]">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Theo dõi tiến độ tuần & Đối soát nghiệm thu
              </h2>
              <p className="text-xs text-slate-500">
                Thống kê tình trạng nộp báo cáo theo từng tuần và đối soát điều kiện chấm điểm cuối kỳ của sinh viên
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {scopedSupervisions.length > 0 && (
              <button
                type="button"
                onClick={exportSupervisionExcel}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#b8e6ea] bg-[#eaf8f6] hover:bg-[#d8f2ee] px-4 py-2 text-xs font-bold text-[#038b95] transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Xuất báo cáo</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-100">
          {/* Left Panel (7 cols): Biểu đồ cột chồng tiến độ báo cáo theo từng tuần */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#038b95]" />
                    <span>Tiến độ nộp & duyệt báo cáo theo từng tuần</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Số lượng sinh viên đã được duyệt, chờ duyệt hoặc chưa nộp ở mỗi mốc tuần thực tập
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#038b95]" />
                    <span>Đã duyệt</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
                    <span>Chờ duyệt</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-slate-200" />
                    <span>Chưa nộp</span>
                  </span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%" debounce={250}>
                  <BarChart
                    data={weeklyReportStats}
                    margin={{ top: 10, right: 12, left: -22, bottom: 0 }}
                    barSize={22}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f1f5f9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      interval={0}
                      tick={{
                        fontSize: 10.5,
                        fill: "#475569",
                        fontWeight: 600,
                      }}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        `${val} sinh viên`,
                        name,
                      ]}
                      labelFormatter={(label: any, payload: any) =>
                        payload?.[0]?.payload?.fullLabel || label
                      }
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    />
                    <Bar
                      dataKey="approved"
                      name="Đã duyệt"
                      stackId="reports"
                      fill="#038b95"
                      radius={[0, 0, 4, 4]}
                    />
                    <Bar
                      dataKey="pending"
                      name="Chờ duyệt"
                      stackId="reports"
                      fill="#f59e0b"
                    />
                    <Bar
                      dataKey="missing"
                      name="Chưa nộp"
                      stackId="reports"
                      fill="#e2e8f0"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Panel (5 cols): Sức khỏe Tiến độ & Mức độ Đúng hạn */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3.5">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-600" />
                    <span>Sức khỏe Tiến độ & Mức độ Đúng hạn</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Đánh giá mức độ nộp báo cáo đúng hạn và cảnh báo rủi ro học vụ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab("supervised-placements")}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#038b95] hover:text-[#026f77] shrink-0 cursor-pointer"
                >
                  <span>Chi tiết</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {studentHealthStats.total === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-10 text-center text-xs text-slate-500">
                  Chưa có sinh viên hướng dẫn nào trong học kỳ này.
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Donut Chart + Breakdown Legend */}
                  <div className="flex items-center justify-between gap-2 sm:gap-3 rounded-2xl border border-slate-100 bg-[#f8fafd] p-3">
                    {/* Donut Chart with center rate */}
                    <div className="relative h-32 w-32 shrink-0 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%" debounce={200}>
                        <PieChart>
                          <Tooltip
                            formatter={(val: any, name: any) => [`${val} sinh viên`, name]}
                            contentStyle={{
                              borderRadius: "10px",
                              border: "1px solid #e2e8f0",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                              fontSize: "11px",
                              fontWeight: 600,
                            }}
                          />
                          <Pie
                            data={studentHealthStats.chartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={36}
                            outerRadius={54}
                            paddingAngle={3}
                            strokeWidth={2}
                            stroke="#ffffff"
                          >
                            {studentHealthStats.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center metric */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-base font-black text-slate-900 tracking-tight leading-none">
                          {studentHealthStats.punctualityRate}%
                        </span>
                        <span className="text-[9.5px] font-bold text-slate-500 mt-0.5">
                          Đúng hạn
                        </span>
                      </div>
                    </div>

                    {/* Breakdown list */}
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between gap-2 rounded-xl bg-white border border-emerald-100 px-2.5 py-1.5 shadow-2xs">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                          <span className="truncate">Đúng tiến độ</span>
                        </span>
                        <span className="text-xs font-extrabold text-emerald-900 shrink-0">
                          {studentHealthStats.onTrack} SV
                        </span>
                      </div>

                      {studentHealthStats.completed > 0 && (
                        <div className="flex items-center justify-between gap-2 rounded-xl bg-white border border-sky-100 px-2.5 py-1.5 shadow-2xs">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-sky-800">
                            <span className="h-2 w-2 rounded-full bg-sky-500 shrink-0" />
                            <span className="truncate">Đã xong 10 tuần</span>
                          </span>
                          <span className="text-xs font-extrabold text-sky-900 shrink-0">
                            {studentHealthStats.completed} SV
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 rounded-xl bg-white border border-amber-100 px-2.5 py-1.5 shadow-2xs">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                          <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                          <span className="truncate">Cần nhắc (1-2 tuần)</span>
                        </span>
                        <span className="text-xs font-extrabold text-amber-900 shrink-0">
                          {studentHealthStats.needsAttention} SV
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 rounded-xl bg-white border border-rose-100 px-2.5 py-1.5 shadow-2xs">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                          <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                          <span className="truncate">Nguy cơ (≥ 3 tuần)</span>
                        </span>
                        <span className="text-xs font-extrabold text-rose-900 shrink-0">
                          {studentHealthStats.highRisk} SV
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Notification / Action Box */}
                  {studentHealthStats.atRiskStudents.length === 0 ? (
                    <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-2.5 text-emerald-900">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <p className="text-xs font-semibold leading-relaxed">
                        Toàn bộ sinh viên đều duy trì nộp báo cáo đúng tiến độ học vụ, không có cảnh báo trễ hạn.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-24 overflow-y-auto pr-0.5">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Sinh viên cần đôn đốc nộp báo cáo:
                      </p>
                      {studentHealthStats.atRiskStudents.map((st) => (
                        <div
                          key={st.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-800">
                              {st.studentName}
                            </span>{" "}
                            <span className="text-slate-400 font-medium text-[11px]">
                              ({st.studentCode})
                            </span>
                          </div>
                          <span
                            className={`shrink-0 rounded-md border px-2 py-0.5 text-[10.5px] font-bold ${st.statusColor}`}
                          >
                            {st.statusText}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TeacherDashboard;
