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
  GraduationCap,
  Layers3,
  LoaderCircle,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { dashboardApi } from "../../dashboard/api";
import type { AdminDashboardData } from "../../dashboard/types";
import { semestersApi } from "../../semesters/api";
import type { SemesterRecord } from "../../semesters/types";

interface AdminDashboardProps {
  onNavigate?: (tab: string) => void;
}

const placementColors: Record<string, string> = {
  PENDING: "#f59e0b",
  ACTIVE: "#10b981",
  COMPLETED: "#64748b",
  CANCELLED: "#f43f5e",
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
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ElementType;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-shadow hover:shadow-md sm:p-5">
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
  const [months, setMonths] = useState<3 | 6 | 9 | 12>(6);
  const [semesters, setSemesters] = useState<SemesterRecord[]>([]);
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const load = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError(null);
    try {
      const [dashboard, semesterPage] = await Promise.all([
        dashboardApi.getAdmin({
          semesterId: semesterId === "ALL" ? undefined : semesterId,
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
  }, [months, semesterId]);

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
          Không thể tải dashboard
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

  return (
    <section className="space-y-5">
      <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-800 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-100">
              <BarChart3 className="h-3.5 w-3.5" /> Operational intelligence
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Trung tâm điều hành thực tập
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100/80">
              Theo dõi tuyển dụng, placement và tiến độ báo cáo bằng dữ liệu vận
              hành thực tế.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold text-indigo-100">
              Kỳ thực tập
              <select
                value={semesterId}
                onChange={(event) => setSemesterId(event.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white outline-none backdrop-blur focus:ring-2 focus:ring-indigo-300"
              >
                <option className="text-slate-900" value="ALL">
                  Toàn hệ thống
                </option>
                {semesters.map((semester) => (
                  <option
                    className="text-slate-900"
                    key={semester.id}
                    value={semester.id}
                  >
                    {semester.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-indigo-100">
              Khoảng thời gian
              <select
                value={months}
                onChange={(event) =>
                  setMonths(Number(event.target.value) as 3 | 6 | 9 | 12)
                }
                className="mt-1.5 block w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white outline-none backdrop-blur focus:ring-2 focus:ring-indigo-300"
              >
                {[3, 6, 9, 12].map((value) => (
                  <option className="text-slate-900" key={value} value={value}>
                    {value} tháng gần nhất
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-xs text-indigo-100/75">
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
          tone="bg-blue-50 text-blue-600"
        />
        <MetricCard
          label="Doanh nghiệp"
          value={number.format(global.approvedCompanies)}
          detail={`${number.format(global.pendingCompanies)} hồ sơ đang chờ duyệt`}
          icon={Building2}
          tone="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          label="Tin thực tập"
          value={number.format(kpis.openInternships)}
          detail={`${number.format(kpis.totalInternships)} tin trong phạm vi`}
          icon={BriefcaseBusiness}
          tone="bg-violet-50 text-violet-600"
        />
        <MetricCard
          label="Ứng tuyển"
          value={number.format(kpis.totalApplications)}
          detail={`${number.format(kpis.acceptedApplications)} đơn được chấp nhận`}
          icon={ClipboardCheck}
          tone="bg-rose-50 text-rose-600"
        />
        <MetricCard
          label="Placement hoạt động"
          value={number.format(kpis.activePlacements)}
          detail={`${number.format(kpis.totalPlacements)} placement trong phạm vi`}
          icon={Layers3}
          tone="bg-amber-50 text-amber-600"
        />
        <MetricCard
          label="Báo cáo chờ duyệt"
          value={number.format(kpis.reportsAwaitingReview)}
          detail="Cần giảng viên xử lý"
          icon={CheckCircle2}
          tone="bg-cyan-50 text-cyan-600"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[
          {
            label: "Tỷ lệ có placement",
            value: kpis.placementCoverageRate,
            detail: `${number.format(kpis.placedStudents)}/${number.format(kpis.applicantStudents)} sinh viên ứng tuyển`,
            color: "from-indigo-600 to-violet-600",
          },
          {
            label: "Tỷ lệ lấp đầy slot",
            value: kpis.slotOccupancyRate,
            detail: `${number.format(kpis.filledSlots)}/${number.format(kpis.totalSlots)} vị trí đã dùng`,
            color: "from-emerald-500 to-teal-600",
          },
          {
            label: "Placement chưa phân công",
            value: kpis.unassignedPlacements,
            detail: "Cần chỉ định giảng viên hướng dẫn",
            color: "from-amber-500 to-orange-500",
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
                Lượt ứng tuyển, placement mới và placement hoàn tất theo tháng.
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
              <ResponsiveContainer width="100%" height="100%">
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
                        stopColor="#4f46e5"
                        stopOpacity={0.35}
                      />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
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
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fill="url(#dashboardApplications)"
                  />
                  <Area
                    type="monotone"
                    dataKey="placements"
                    name="Placement mới"
                    stroke="#10b981"
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
          <h2 className="font-black text-slate-900">Trạng thái placement</h2>
          <p className="mt-1 text-xs text-slate-500">
            Phân bố trong phạm vi đang chọn.
          </p>
          <div className="relative mt-4 h-52">
            {placementTotal > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
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
                    Placement
                  </span>
                </div>
              </>
            ) : (
              <EmptyChart message="Chưa có placement." />
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
              <ResponsiveContainer width="100%" height="100%">
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
                    fill="#4f46e5"
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
                label: "Placement chưa phân công",
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
    </section>
  );
};
