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
  Check,
  CheckCircle2,
  ClipboardCheck,
  Download,
  GraduationCap,
  Layers3,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Search,
  UsersRound,
  ChevronDown,
  X,
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
      className={`rounded-2xl bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-200 sm:p-5 ${
        onClick
          ? "group cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] active:scale-[0.99]"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-800">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 ${
            onClick ? "group-hover:scale-105" : ""
          } ${tone}`}
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

interface DropdownOption {
  value: string;
  label: string;
  group?: string;
}

function CustomDropdown({
  label,
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  searchable = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  searchable?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.group && opt.group.toLowerCase().includes(q)),
    );
  }, [options, search]);

  return (
    <div className="relative" ref={containerRef}>
      <label className="mb-1 block text-xs font-semibold text-slate-600">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group flex w-full items-center justify-between gap-2 rounded-xl bg-[#f3f4f6] hover:bg-[#eceef1] px-3.5 py-2.5 text-left text-xs sm:text-sm font-semibold text-slate-800 transition-all outline-none cursor-pointer ${
          isOpen
            ? "ring-2 ring-[#00878a]/30 bg-white shadow-xs"
            : ""
        }`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#00878a]" : "group-hover:text-slate-600"
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 min-w-full sm:min-w-[280px] max-h-72 overflow-hidden rounded-xl border border-slate-100 bg-white p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-slate-800">
          {searchable && (
            <div className="p-1 border-b border-slate-100 mb-1">
              <div className="flex items-center gap-1.5 rounded-lg bg-[#f3f4f6] px-2.5 py-1.5 text-xs text-slate-700">
                <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="max-h-52 overflow-y-auto space-y-0.5 pr-0.5 text-xs [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                Không tìm thấy kết quả phù hợp
              </div>
            ) : (
              (() => {
                let currentGroup: string | undefined = undefined;
                return filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  const showGroup = opt.group && opt.group !== currentGroup;
                  if (opt.group) currentGroup = opt.group;

                  return (
                    <React.Fragment key={opt.value}>
                      {showGroup && (
                        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 rounded-md mt-1.5 mb-0.5">
                          {opt.group}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          onChange(opt.value);
                          setIsOpen(false);
                          setSearch("");
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition cursor-pointer ${
                          isSelected
                            ? "bg-teal-50 font-bold text-[#00878a]"
                            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <span className="leading-snug">{opt.label}</span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-[#00878a] stroke-[2.5] shrink-0 ml-2" />
                        )}
                      </button>
                    </React.Fragment>
                  );
                });
              })()
            )}
          </div>
        </div>
      )}
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

  const hasActiveFilters =
    semesterId !== "ALL" || Boolean(facultyId) || Boolean(majorId) || months !== 6;

  const handleResetFilters = () => {
    setSemesterId("ALL");
    setFacultyId("");
    setMajorId("");
    setMonths(6);
  };

  const semesterOptions: DropdownOption[] = useMemo(
    () => [
      { value: "ALL", label: "Toàn hệ thống" },
      ...semesters.map((s) => ({ value: s.id, label: s.name })),
    ],
    [semesters],
  );

  const facultyOptions: DropdownOption[] = useMemo(
    () => [
      { value: "", label: "Tất cả Khoa" },
      ...faculties.map((f) => {
        const cleanName = f.name.trim().toLowerCase().startsWith("khoa")
          ? f.name.trim()
          : `Khoa ${f.name.trim()}`;
        return {
          value: f.id,
          label: cleanName,
        };
      }),
    ],
    [faculties],
  );

  const majorOptions: DropdownOption[] = useMemo(() => {
    const result: DropdownOption[] = [{ value: "", label: "Tất cả Ngành" }];
    const targetFaculties = facultyId
      ? faculties.filter((f) => f.id === facultyId)
      : faculties;

    targetFaculties.forEach((f) => {
      const cleanFacultyName = f.name.trim().toLowerCase().startsWith("khoa")
        ? f.name.trim()
        : `Khoa ${f.name.trim()}`;

      f.majors.forEach((m) => {
        result.push({
          value: m.id,
          label: m.name,
          group: cleanFacultyName,
        });
      });
    });
    return result;
  }, [faculties, facultyId]);

  const monthOptions: DropdownOption[] = useMemo(
    () => [
      { value: "3", label: "3 tháng gần nhất" },
      { value: "6", label: "6 tháng gần nhất" },
      { value: "9", label: "9 tháng gần nhất" },
      { value: "12", label: "12 tháng gần nhất" },
    ],
    [],
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
    <section className="admin-page admin-page--feature space-y-4">
      {/* Light, Airy & Compact Header with Subtle Elevation */}
      <header className="relative rounded-2xl bg-white p-4 sm:p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
        {/* Top row: Title + Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cbebeb] bg-[#e6f6f6] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#00878a]">
                <BarChart3 className="h-3 w-3" /> Tổng quan vận hành
              </span>
              {loading && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#00878a]">
                  <LoaderCircle className="h-3 w-3 animate-spin" /> Đang đồng bộ...
                </span>
              )}
            </div>
            <h1 className="admin-page-title mt-1.5 text-xl font-bold tracking-tight text-[#006f72] sm:text-2xl">
              Trung tâm điều hành thực tập
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Theo dõi tuyển dụng, hồ sơ thực tập và tiến độ báo cáo bằng dữ liệu vận hành thời gian thực.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-[#00878a]/40 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              title="Làm mới số liệu"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-slate-500 ${
                  loading ? "animate-spin text-[#00878a]" : ""
                }`}
              />
              Làm mới
            </button>
            <button
              type="button"
              onClick={exportDashboardExcel}
              className="inline-flex items-center gap-2 rounded-xl bg-[#00878a] px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-[#00878a]/20 transition hover:bg-[#007477] active:scale-[0.98] cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> Xuất báo cáo Excel Khoa/Ngành
            </button>
          </div>
        </div>

        {/* Filter Area - Compact & High-Contrast */}
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <CustomDropdown
            label="Kỳ thực tập"
            value={semesterId}
            onChange={setSemesterId}
            options={semesterOptions}
          />

          <CustomDropdown
            label="Khoa"
            value={facultyId}
            onChange={(val) => {
              setFacultyId(val);
              setMajorId("");
            }}
            options={facultyOptions}
            searchable
          />

          <CustomDropdown
            label="Ngành đào tạo"
            value={majorId}
            onChange={setMajorId}
            options={majorOptions}
            searchable
          />

          <CustomDropdown
            label="Khoảng thời gian"
            value={String(months)}
            onChange={(val) =>
              setMonths(Number(val) as 3 | 6 | 9 | 12)
            }
            options={monthOptions}
          />
        </div>

        {/* Footer Metadata */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 text-slate-400" /> Cập nhật:{" "}
              <span className="font-semibold text-slate-700">
                {dateTime.format(new Date(scope.generatedAt))}
              </span>
            </span>
            <span className="text-slate-300">•</span>
            <span>
              Phạm vi:{" "}
              <span className="font-semibold text-slate-700">
                {scope.semester?.name ?? "Toàn hệ thống"}
              </span>
            </span>
            {hasActiveFilters && (
              <>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 font-bold text-[#00878a] hover:text-[#005c5f] transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" /> Đặt lại mặc định
                </button>
              </>
            )}
          </div>
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
            value: `${kpis.placementCoverageRate}%`,
            detail: `${number.format(kpis.placedStudents)}/${number.format(kpis.applicantStudents)} sinh viên ứng tuyển`,
            textColor: "text-[#00878a]",
            accentBorder: "border-l-4 border-[#00878a]",
          },
          {
            label: "Tỷ lệ lấp đầy slot",
            value: `${kpis.slotOccupancyRate}%`,
            detail: `${number.format(kpis.filledSlots)}/${number.format(kpis.totalSlots)} vị trí đã dùng`,
            textColor: "text-[#00878a]",
            accentBorder: "border-l-4 border-[#00878a]",
          },
          {
            label: "Hồ sơ chưa phân công",
            value: String(kpis.unassignedPlacements),
            detail: "Cần chỉ định giảng viên hướng dẫn",
            textColor: "text-[#da1c2d]",
            accentBorder: "border-l-4 border-[#da1c2d]",
            action: "teacher-assignment",
          },
        ].map((item) => (
          <article
            key={item.label}
            onClick={item.action ? () => onNavigate?.(item.action) : undefined}
            className={`rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-200 ${item.accentBorder} ${
              item.action
                ? "group cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] active:scale-[0.99]"
                : ""
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {item.label}
            </p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <p className={`text-3xl font-bold tracking-tight ${item.textColor}`}>
                {item.value}
              </p>
              {item.action && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate?.(item.action);
                  }}
                  className="admin-shortcut-btn flex h-9 w-9 items-center justify-center rounded-xl cursor-pointer"
                  aria-label="Mở phân công giảng viên"
                  title="Chuyển đến phân công giảng viên"
                >
                  <ArrowRight className="h-4 w-4 transition-transform duration-200" />
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">{item.detail}</p>
          </article>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <article className="xl:col-span-2 rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-800">Nhịp độ tuyển dụng</h2>
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
        <article className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] sm:p-6">
          <h2 className="font-bold text-slate-800">
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
                  <span className="text-2xl font-bold text-slate-800">
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
                <strong className="text-slate-800 font-bold">
                  {number.format(item.count)}
                </strong>
              </div>
            ))}
          </div>
        </article>
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <article className="xl:col-span-2 rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold text-slate-800">
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
        <article className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] sm:p-6">
          <h2 className="font-bold text-slate-800">Cần ưu tiên xử lý</h2>
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
                className={`group flex w-full items-center justify-between rounded-2xl p-3 text-left transition duration-200 ${item.tab ? "hover:scale-[1.01] hover:shadow-sm cursor-pointer" : "cursor-default"} ${item.tone}`}
              >
                <span className="text-xs font-bold">{item.label}</span>
                <span className="inline-flex items-center gap-2 text-lg font-bold">
                  {number.format(item.value)}
                  {item.tab && <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />}
                </span>
              </button>
            ))}
          </div>
        </article>
      </div>
      {facultyBreakdown.length > 0 && (
        <article className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
            <div>
              <h2 className="font-bold text-slate-800">
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
