import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Area,
  AreaChart,
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
  AlertCircle,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Download,
  GraduationCap,
  Layers3,
  LoaderCircle,
  RefreshCw,
  UsersRound,
  ChevronDown,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { dashboardApi } from "../../dashboard/api";
import type { AdminDashboardData } from "../../dashboard/types";
import { facultiesApi } from "../../organization/api";
import type { FacultyOption } from "../../organization/types";
import { semestersApi } from "../../semesters/api";
import type { SemesterRecord } from "../../semesters/types";
import { downloadExcelWorkbook } from "../../utils/excelExport";

interface AdminDashboardProps {
  onNavigate?: (tab: string) => void;
}

const placementColors: Record<string, string> = {
  PENDING: "#f59e0b",
  ACTIVE: "#00878a",
  COMPLETED: "#64748b",
  CANCELLED: "#da1c2d",
};
const placementLabels: Record<string, string> = {
  PENDING: "Chờ phân công",
  ACTIVE: "Đang thực tập",
  COMPLETED: "Đã hoàn tất",
  CANCELLED: "Đã hủy",
};
const number = new Intl.NumberFormat("vi-VN");
const dateTime = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
  onClick,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ElementType;
  tone: string;
  onClick?: () => void;
}) {
  return (
    <article
      onClick={onClick}
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all sm:p-5 ${
        onClick ? "cursor-pointer hover:border-slate-300 hover:shadow-md" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">{detail}</p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
}) => {
  const [semesterId, setSemesterId] = useState("ALL");
  const [facultyId, setFacultyId] = useState("");
  const [majorId, setMajorId] = useState("");
  const [months, setMonths] = useState<3 | 6 | 9 | 12>(6);
  const [semesters, setSemesters] = useState<SemesterRecord[]>([]);
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestSequence = useRef(0);

  useEffect(() => {
    facultiesApi
      .listOptions({ includeInactive: true })
      .then((res) => setFaculties(res.items))
      .catch(() => setFaculties([]));
  }, []);

  const load = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError(null);
    try {
      const [dashboard, semesterPage] = await Promise.all([
        dashboardApi.getAdmin({
          semesterId: semesterId === "ALL" ? undefined : semesterId,
          facultyId: facultyId || undefined,
          majorId: majorId || undefined,
          months,
        }),
        semestersApi.list({ page: 1, limit: 100 }),
      ]);
      if (sequence !== requestSequence.current) return;
      setData(dashboard);
      setSemesters(semesterPage.items);
    } catch (requestError) {
      if (sequence === requestSequence.current)
        setError(getApiErrorMessage(requestError));
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, [facultyId, majorId, months, semesterId]);

  useEffect(() => {
    void load();
  }, [load]);
  const placementPie = useMemo(
    () =>
      data?.distributions.placementStatus.filter((item) => item.count > 0) ??
      [],
    [data],
  );
  const placementTotal = placementPie.reduce(
    (sum, item) => sum + item.count,
    0,
  );

  if (loading && !data)
    return (
      <section className="space-y-5" aria-busy="true">
        <div className="h-44 animate-pulse rounded-3xl bg-slate-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      </section>
    );
  if (error && !data)
    return (
      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-rose-600" />
        <h1 className="mt-4 text-xl font-black text-slate-900">
          Không thể tải bảng điều khiển
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-rose-700">{error}</p>
        <button
          onClick={() => void load()}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700"
        >
          <RefreshCw className="h-4 w-4" /> Thử lại
        </button>
      </section>
    );
  if (!data) return null;
  const { global, kpis, scope } = data;
  const facultyBreakdown = data.facultyBreakdown ?? [];

  const exportDashboardExcel = () => {
    const majorRows = facultyBreakdown.flatMap((f) =>
      f.majors.map((m) => ({
        facultyCode: f.code,
        facultyName: f.name,
        ...m,
      })),
    );
    downloadExcelWorkbook("bao-cao-thong-ke-thuc-tap-toan-truong", [
      {
        name: "Thong ke theo Khoa",
        title: "BÁO CÁO THỐNG KÊ THỰC TẬP THEO KHOA",
        subtitle: `Phạm vi: ${scope.semester?.name ?? "Toàn hệ thống"} — Xuất lúc: ${dateTime.format(new Date())}`,
        columns: [
          { header: "Mã Khoa", width: 95, value: (f) => f.code },
          { header: "Tên Khoa", width: 210, value: (f) => f.name },
          { header: "Số Giảng viên", width: 110, value: (f) => f.totalLecturers },
          { header: "Tổng Sinh viên", width: 115, value: (f) => f.totalStudents },
          { header: "SV Đã có nơi TT", width: 120, value: (f) => f.placedStudents },
          { header: "Tỷ lệ có nơi TT (%)", width: 125, value: (f) => `${f.placementRate}%` },
          { header: "Đang thực tập", width: 115, value: (f) => f.activePlacements },
          { header: "Đã hoàn tất", width: 110, value: (f) => f.completedPlacements },
          { header: "Chờ phân công GVHD", width: 135, value: (f) => f.unassignedPlacements },
        ],
        rows: facultyBreakdown,
      },
      {
        name: "Thong ke theo Nganh",
        title: "BÁO CÁO THỐNG KÊ THỰC TẬP CHI TIẾT THEO NGÀNH ĐÀO TẠO",
        subtitle: `Phạm vi: ${scope.semester?.name ?? "Toàn hệ thống"} — Xuất lúc: ${dateTime.format(new Date())}`,
        columns: [
          { header: "Khoa", width: 185, value: (m) => `${m.facultyCode} — ${m.facultyName}` },
          { header: "Mã Ngành", width: 100, value: (m) => m.code },
          { header: "Tên Ngành đào tạo", width: 210, value: (m) => m.name },
          { header: "Tổng Sinh viên", width: 115, value: (m) => m.totalStudents },
          { header: "SV Đã có nơi TT", width: 120, value: (m) => m.placedStudents },
          { header: "Tỷ lệ có nơi TT (%)", width: 125, value: (m) => `${m.placementRate}%` },
          { header: "Đang thực tập", width: 115, value: (m) => m.activePlacements },
          { header: "Đã hoàn tất", width: 110, value: (m) => m.completedPlacements },
          { header: "Chờ phân công GVHD", width: 135, value: (m) => m.unassignedPlacements },
        ],
        rows: majorRows,
      },
    ]);
  };

  return (
    <section className="admin-page admin-page--feature space-y-5">
      <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#005c5f] via-[#00878a] to-[#006f72] p-6 text-white shadow-xl shadow-[#00878a]/20 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/80">
              <BarChart3 className="h-3.5 w-3.5" /> Tổng quan vận hành
            </div>
            <h1 className="admin-page-title mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Trung tâm điều hành thực tập
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
              Theo dõi tuyển dụng, hồ sơ thực tập và tiến độ báo cáo bằng dữ
              liệu vận hành thực tế.
            </p>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-semibold text-white/80">
              Kỳ thực tập
              <div className="relative mt-1.5">
                <select
                  value={semesterId}
                  onChange={(event) => setSemesterId(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-white/25 bg-[#00686b] px-3.5 py-2.5 pr-9 text-sm font-semibold text-white outline-none backdrop-blur transition hover:border-white/40 focus:border-white focus:ring-2 focus:ring-white/30 cursor-pointer"
                >
                  <option className="bg-slate-900 text-white py-1" value="ALL">
                    Toàn hệ thống
                  </option>
                  {semesters.map((semester) => (
                    <option
                      className="bg-slate-900 text-white py-1"
                      key={semester.id}
                      value={semester.id}
                    >
                      {semester.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
              </div>
            </label>
            <label className="text-xs font-semibold text-white/80">
              Khoa
              <div className="relative mt-1.5">
                <select
                  value={facultyId}
                  onChange={(event) => {
                    setFacultyId(event.target.value);
                    setMajorId("");
                  }}
                  className="w-full appearance-none rounded-xl border border-white/25 bg-[#00686b] px-3.5 py-2.5 pr-9 text-sm font-semibold text-white outline-none backdrop-blur transition hover:border-white/40 focus:border-white focus:ring-2 focus:ring-white/30 cursor-pointer"
                >
                  <option className="bg-slate-900 text-white py-1" value="">
                    Tất cả Khoa
                  </option>
                  {faculties.map((f) => (
                    <option
                      className="bg-slate-900 text-white py-1"
                      key={f.id}
                      value={f.id}
                    >
                      {f.code} — {f.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
              </div>
            </label>
            <label className="text-xs font-semibold text-white/80">
              Ngành đào tạo
              <div className="relative mt-1.5">
                <select
                  value={majorId}
                  onChange={(event) => setMajorId(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-white/25 bg-[#00686b] px-3.5 py-2.5 pr-9 text-sm font-semibold text-white outline-none backdrop-blur transition hover:border-white/40 focus:border-white focus:ring-2 focus:ring-white/30 cursor-pointer"
                >
                  <option className="bg-slate-900 text-white py-1" value="">
                    Tất cả Ngành
                  </option>
                  {(facultyId
                    ? faculties.filter((f) => f.id === facultyId)
                    : faculties
                  ).map((f) => (
                    <optgroup
                      className="bg-slate-900 text-white"
                      key={f.id}
                      label={`Khoa ${f.name}`}
                    >
                      {f.majors.map((m) => (
                        <option
                          className="bg-slate-900 text-white py-1"
                          key={m.id}
                          value={m.id}
                        >
                          {m.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
              </div>
            </label>
            <label className="text-xs font-semibold text-white/80">
              Khoảng thời gian
              <div className="relative mt-1.5">
                <select
                  value={months}
                  onChange={(event) =>
                    setMonths(Number(event.target.value) as 3 | 6 | 9 | 12)
                  }
                  className="w-full appearance-none rounded-xl border border-white/25 bg-[#00686b] px-3.5 py-2.5 pr-9 text-sm font-semibold text-white outline-none backdrop-blur transition hover:border-white/40 focus:border-white focus:ring-2 focus:ring-white/30 cursor-pointer"
                >
                  {[3, 6, 9, 12].map((value) => (
                    <option
                      className="bg-slate-900 text-white py-1"
                      key={value}
                      value={value}
                    >
                      {value} tháng gần nhất
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
              </div>
            </label>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-xs text-white/75">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" /> Cập nhật:{" "}
              {dateTime.format(new Date(scope.generatedAt))}
            </span>
            <span>Phạm vi: {scope.semester?.name ?? "Toàn hệ thống"}</span>
            {loading && (
              <span className="inline-flex items-center gap-1.5 text-white">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Đang đồng bộ
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={exportDashboardExcel}
            className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/25"
          >
            <Download className="h-4 w-4" /> Xuất báo cáo Excel Khoa/Ngành
          </button>
        </div>
      </header>
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="inline-flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </span>
          <button onClick={() => void load()} className="font-bold underline">
            Thử lại
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Sinh viên"
          value={number.format(global.totalStudents)}
          detail={`${number.format(global.activeStudentUsers)} tài khoản đang hoạt động`}
          icon={UsersRound}
          tone="bg-[#e6f6f6] text-[#00878a]"
        />
        <MetricCard
          label="Doanh nghiệp"
          value={number.format(global.approvedCompanies)}
          detail={`${number.format(global.pendingCompanies)} hồ sơ đang chờ duyệt`}
          icon={Building2}
          tone="bg-[#e6f6f6] text-[#00878a]"
          onClick={() => onNavigate?.("company-approval")}
        />
        <MetricCard
          label="Tin thực tập"
          value={number.format(kpis.openInternships)}
          detail={`${number.format(kpis.totalInternships)} tin trong phạm vi`}
          icon={BriefcaseBusiness}
          tone="bg-[#fff0f2] text-[#da1c2d]"
          onClick={() => onNavigate?.("internship-management")}
        />
        <MetricCard
          label="Ứng tuyển"
          value={number.format(kpis.totalApplications)}
          detail={`${number.format(kpis.acceptedApplications)} đơn được chấp nhận`}
          icon={ClipboardCheck}
          tone="bg-[#fff0f2] text-[#da1c2d]"
        />
        <MetricCard
          label="Hồ sơ đang hoạt động"
          value={number.format(kpis.activePlacements)}
          detail={`${number.format(kpis.totalPlacements)} hồ sơ trong phạm vi`}
          icon={Layers3}
          tone="bg-[#e6f6f6] text-[#00878a]"
        />
        <MetricCard
          label="Báo cáo chờ duyệt"
          value={number.format(kpis.reportsAwaitingReview)}
          detail="Cần giảng viên xử lý"
          icon={CheckCircle2}
          tone="bg-[#fff0f2] text-[#da1c2d]"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[
          {
            label: "Tỷ lệ sinh viên đã có nơi thực tập",
            value: kpis.placementCoverageRate,
            detail: `${number.format(kpis.placedStudents)}/${number.format(kpis.applicantStudents)} sinh viên ứng tuyển`,
            color: "from-[#00878a] to-[#006f72]",
          },
          {
            label: "Tỷ lệ lấp đầy slot",
            value: kpis.slotOccupancyRate,
            detail: `${number.format(kpis.filledSlots)}/${number.format(kpis.totalSlots)} vị trí đã dùng`,
            color: "from-[#006f72] to-[#00878a]",
          },
          {
            label: "Hồ sơ chưa phân công",
            value: kpis.unassignedPlacements,
            detail: "Cần chỉ định giảng viên hướng dẫn",
            color: "from-[#da1c2d] to-[#b41425]",
            action: "teacher-assignment",
          },
        ].map((item) => (
          <article
            key={item.label}
            className={`rounded-2xl bg-gradient-to-br ${item.color} p-5 text-white shadow-lg`}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-white/75">
              {item.label}
            </p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <p className="text-4xl font-black">
                {item.value}
                {item.action ? "" : "%"}
              </p>
              {item.action && (
                <button
                  onClick={() => onNavigate?.(item.action)}
                  className="rounded-xl bg-white/15 p-2 text-white transition hover:bg-white/25"
                  aria-label="Mở phân công giảng viên"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-white/80">{item.detail}</p>
          </article>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <article className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-black text-slate-900">Nhịp độ tuyển dụng</h2>
              <p className="mt-1 text-xs text-slate-500">
                Lượt ứng tuyển, hồ sơ thực tập mới và hồ sơ hoàn tất theo tháng.
              </p>
            </div>
            <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700">
              {months} tháng
            </span>
          </div>
          <div className="mt-5 h-72">
            {data.monthlyTrend.some(
              (item) =>
                item.applications ||
                item.placements ||
                item.completedPlacements,
            ) ? (
              <ResponsiveContainer width="100%" height="100%" debounce={300}>
                <AreaChart
                  data={data.monthlyTrend}
                  margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="dashboardApplications"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#00878a"
                        stopOpacity={0.35}
                      />
                      <stop offset="95%" stopColor="#00878a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      borderColor: "#e2e8f0",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="applications"
                    name="Ứng tuyển"
                    stroke="#00878a"
                    strokeWidth={2.5}
                    fill="url(#dashboardApplications)"
                  />
                  <Area
                    type="monotone"
                    dataKey="placements"
                    name="Hồ sơ thực tập mới"
                    stroke="#da1c2d"
                    strokeWidth={2.5}
                    fill="transparent"
                  />
                  <Area
                    type="monotone"
                    dataKey="completedPlacements"
                    name="Hoàn tất"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Chưa có dữ liệu phát sinh trong khoảng thời gian này." />
            )}
          </div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <h2 className="font-black text-slate-900">
            Trạng thái hồ sơ thực tập
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Phân bố trong phạm vi đang chọn.
          </p>
          <div className="relative mt-4 h-52">
            {placementTotal > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%" debounce={300}>
                  <PieChart>
                    <Pie
                      data={placementPie}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={58}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {placementPie.map((item) => (
                        <Cell
                          key={item.status}
                          fill={placementColors[item.status]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, _, item) => [
                        number.format(Number(value)),
                        placementLabels[String(item.payload.status)],
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-slate-950">
                    {number.format(placementTotal)}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Hồ sơ
                  </span>
                </div>
              </>
            ) : (
              <EmptyChart message="Chưa có hồ sơ thực tập." />
            )}
          </div>
          <div className="space-y-2">
            {data.distributions.placementStatus.map((item) => (
              <div
                key={item.status}
                className="flex items-center justify-between text-xs"
              >
                <span className="inline-flex items-center gap-2 text-slate-600">
                  <i
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: placementColors[item.status] }}
                  />
                  {placementLabels[item.status]}
                </span>
                <strong className="text-slate-900">
                  {number.format(item.count)}
                </strong>
              </div>
            ))}
          </div>
        </article>
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <article className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-black text-slate-900">
                Kỹ năng có nhu cầu cao
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Số tin thực tập yêu cầu từng kỹ năng, không gồm tin đã hủy.
              </p>
            </div>
            <GraduationCap className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="mt-5 h-64">
            {data.topSkills.length ? (
              <ResponsiveContainer width="100%" height="100%" debounce={300}>
                <BarChart
                  data={data.topSkills}
                  layout="vertical"
                  margin={{ top: 0, right: 24, left: 20, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={110}
                    tick={{ fontSize: 11, fill: "#334155" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      borderColor: "#e2e8f0",
                      fontSize: 12,
                    }}
                    formatter={(value) => [
                      number.format(Number(value)),
                      "Tin thực tập",
                    ]}
                  />
                  <Bar
                    dataKey="internshipCount"
                    name="Tin thực tập"
                    fill="#00878a"
                    radius={[0, 7, 7, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Chưa có kỹ năng được gắn với tin thực tập." />
            )}
          </div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <h2 className="font-black text-slate-900">Cần ưu tiên xử lý</h2>
          <p className="mt-1 text-xs text-slate-500">
            Các việc có thể làm chậm vận hành.
          </p>
          <div className="mt-5 space-y-3">
            {[
              {
                value: global.pendingCompanies,
                label: "Doanh nghiệp chờ duyệt",
                tab: "company-approval",
                tone: "bg-amber-50 text-amber-700",
              },
              {
                value: kpis.unassignedPlacements,
                label: "Hồ sơ chưa phân công",
                tab: "teacher-assignment",
                tone: "bg-violet-50 text-violet-700",
              },
              {
                value: kpis.reportsAwaitingReview,
                label: "Báo cáo đang chờ review",
                tab: "",
                tone: "bg-rose-50 text-rose-700",
              },
            ].map((item) => (
              <button
                key={item.label}
                disabled={!item.tab}
                onClick={() => item.tab && onNavigate?.(item.tab)}
                className={`flex w-full items-center justify-between rounded-2xl p-3 text-left transition ${item.tab ? "hover:scale-[1.01] hover:shadow-sm" : "cursor-default"} ${item.tone}`}
              >
                <span className="text-xs font-bold">{item.label}</span>
                <span className="inline-flex items-center gap-2 text-lg font-black">
                  {number.format(item.value)}
                  {item.tab && <ArrowRight className="h-4 w-4" />}
                </span>
              </button>
            ))}
          </div>
        </article>
      </div>
      {facultyBreakdown.length > 0 && (
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
            <div>
              <h2 className="font-black text-slate-900">
                Thống kê thực tập theo Khoa &amp; Ngành đào tạo
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Tổng hợp quy mô sinh viên, giảng viên và tiến độ phân bố thực tập trên toàn trường.
              </p>
            </div>
            <button
              type="button"
              onClick={exportDashboardExcel}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
            >
              <Download className="h-4 w-4 text-[#00878a]" /> Xuất Excel Khoa/Ngành
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Khoa / Ngành đào tạo</th>
                  <th className="px-4 py-3.5 text-right">Sinh viên</th>
                  <th className="px-4 py-3.5 text-right">Giảng viên</th>
                  <th className="px-4 py-3.5 text-right">Đã có nơi TT</th>
                  <th className="px-4 py-3.5 text-right">Đang TT</th>
                  <th className="px-4 py-3.5 text-right">Hoàn tất</th>
                  <th className="px-5 py-3.5 text-right">Tỷ lệ có nơi TT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(facultyId
                  ? facultyBreakdown.filter((f) => f.facultyId === facultyId)
                  : facultyBreakdown
                ).map((f) => (
                  <React.Fragment key={f.facultyId}>
                    <tr className="bg-slate-50/70 font-bold text-slate-900">
                      <td className="px-5 py-3">
                        <span className="mr-2 rounded-md bg-[#e6f6f6] px-2 py-0.5 font-mono text-[10px] font-extrabold text-[#00878a]">
                          {f.code}
                        </span>
                        Khoa {f.name}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {number.format(f.totalStudents)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {number.format(f.totalLecturers)}
                      </td>
                      <td className="px-4 py-3 text-right text-[#00878a]">
                        {number.format(f.placedStudents)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {number.format(f.activePlacements)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {number.format(f.completedPlacements)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="rounded-full bg-[#e6f6f6] px-2.5 py-0.5 text-[11px] font-extrabold text-[#00878a]">
                          {f.placementRate}%
                        </span>
                      </td>
                    </tr>
                    {(majorId
                      ? f.majors.filter((m) => m.majorId === majorId)
                      : f.majors
                    ).map((m) => (
                      <tr
                        key={m.majorId}
                        className="text-slate-600 transition hover:bg-slate-50/50"
                      >
                        <td className="py-2.5 pl-10 pr-5">
                          <span className="mr-2 font-mono text-[10px] text-slate-400">
                            {m.code}
                          </span>
                          {m.name}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium">
                          {number.format(m.totalStudents)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-400">
                          —
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                          {number.format(m.placedStudents)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {number.format(m.activePlacements)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {number.format(m.completedPlacements)}
                        </td>
                        <td className="px-5 py-2.5 text-right font-semibold text-slate-700">
                          {m.placementRate}%
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}
    </section>
  );
};
