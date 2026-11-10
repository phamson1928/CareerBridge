import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ModalPortal } from "../ModalPortal";
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  FilterX,
  Layers,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { useAppFeedback } from "../Feedback/AppFeedbackProvider";
import {
  internshipsApi,
  InternshipRecord,
  InternshipReportRecord,
  InternshipModerationReasonCode,
  InternshipReportReasonCode,
  InternshipReportStatus,
  ModerateInternshipInput,
  ReviewInternshipReportInput,
  MODERATION_REASON_LABELS,
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
} from "../../internships/api";
import { semestersApi } from "../../semesters/api";
import type { SemesterRecord } from "../../semesters/types";

function cleanSemesterName(name?: string | null): string {
  if (!name) return "";
  return name.replace(/\s*\[.*?\]/g, "").trim();
}

// ==========================================
// 1. CUSTOM POP-OVER SELECT COMPONENT (NO NATIVE <select>)
// ==========================================

export interface CustomSelectOption<T extends string = string> {
  value: T;
  label: string;
  sublabel?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
}

interface CustomSelectProps<T extends string> {
  value: T;
  onChange: (val: T) => void;
  options: CustomSelectOption<T>[];
  placeholder?: string;
  label?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  searchable?: boolean;
  disabled?: boolean;
}

export function CustomSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder = "Chọn một mục...",
  label,
  icon: TriggerIcon,
  className = "",
  searchable = false,
  disabled = false,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFilterText("");
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchable) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, searchable]);

  const filteredOptions = useMemo(() => {
    if (!filterText.trim()) return options;
    const lower = filterText.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(lower) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(lower))
    );
  }, [options, filterText]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <span className="mb-1 block text-xs font-semibold text-slate-700">
          {label}
        </span>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        className={`group flex h-10 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 text-left text-xs font-medium transition outline-none cursor-pointer ${
          isOpen
            ? "border-[#00878a] ring-2 ring-[#00878a]/20 shadow-xs"
            : "border-slate-200 hover:border-slate-300 shadow-2xs"
        } ${disabled ? "cursor-not-allowed opacity-60 bg-slate-50" : ""}`}
      >
        <div className="flex items-center gap-2 truncate">
          {TriggerIcon && (
            <TriggerIcon className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-600 transition" />
          )}
          {selectedOption?.icon && (
            <span className="shrink-0">{selectedOption.icon}</span>
          )}
          <span className="truncate text-slate-800">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="shrink-0">{selectedOption.badge}</span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#00878a]" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 min-w-[200px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl transition-all animate-in fade-in zoom-in-95">
          {searchable && (
            <div className="mb-1.5 border-b border-slate-100 px-2 pb-1.5">
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1.5 text-xs text-slate-600 focus-within:ring-1 focus-within:ring-[#00878a]/30">
                <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <input
                  ref={inputRef}
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="w-full bg-transparent outline-none placeholder:text-slate-400 text-xs"
                />
                {filterText && (
                  <button
                    type="button"
                    onClick={() => setFilterText("")}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                Không tìm thấy kết quả phù hợp
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setFilterText("");
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition cursor-pointer ${
                      isSelected
                        ? "bg-[#e6f6f6] font-bold text-[#00878a]"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <div className="truncate">
                        <div className="truncate">{opt.label}</div>
                        {opt.sublabel && (
                          <div className="text-[10px] font-normal text-slate-400 truncate">
                            {opt.sublabel}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {opt.badge}
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-[#00878a] stroke-[2.5]" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. CONSTANTS & STATUS HELPERS
// ==========================================

const internshipStatusBadgeConfig: Record<
  InternshipRecord["status"],
  { label: string; className: string }
> = {
  OPEN: {
    label: "Đang mở tuyển",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  DRAFT: {
    label: "Bản nháp",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  CLOSED: {
    label: "Đã đóng",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  CANCELLED: {
    label: "Đã hủy",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  REJECTED: {
    label: "Bị gỡ vi phạm",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

const reportStatusBadgeConfig: Record<
  InternshipReportStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Chờ xử lý",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  INVESTIGATING: {
    label: "Đang xác minh",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  RESOLVED: {
    label: "Đã xử lý (Vi phạm)",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  DISMISSED: {
    label: "Đã bác bỏ",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

const workTypeLabels: Record<string, string> = {
  ONSITE: "Tại công ty (Onsite)",
  REMOTE: "Từ xa (Remote)",
  HYBRID: "Kết hợp (Hybrid)",
};

const REASON_EXPLANATIONS: Record<InternshipModerationReasonCode, string> = {
  POLICY_VIOLATION:
    "Doanh nghiệp thu phí thực tập của sinh viên, yêu cầu đóng cọc, hoặc vi phạm quy chế.",
  MISLEADING_INFO:
    "Mức phụ cấp, địa điểm, chế độ đãi ngộ hoặc vị trí công việc không đúng với cam kết thực tế.",
  UNAUTHORIZED_FEE:
    "Yêu cầu ứng viên nộp tiền cọc / thu phí tuyển dụng trái quy định.",
  INAPPROPRIATE_CONTENT:
    "Nội dung mô tả công việc phân biệt đối xử, phản cảm hoặc không đúng chuẩn mực học đường.",
  OUTSIDE_MAJOR_SCOPE:
    "Vị trí tuyển dụng không phù hợp hoặc nằm ngoài phạm vi chuyên ngành đào tạo.",
  OTHER: "Lý do khác do Quản trị viên chỉ định.",
};

// ==========================================
// 3. MAIN COMPONENT: InternshipManagement
// ==========================================

export function InternshipManagement() {
  const { notify } = useAppFeedback();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<"INTERNSHIPS" | "REPORTS">(
    "INTERNSHIPS"
  );

  // Semesters & Options
  const [semesters, setSemesters] = useState<SemesterRecord[]>([]);

  // Tab 1: Internships list state
  const [internships, setInternships] = useState<InternshipRecord[]>([]);
  const [loadingInternships, setLoadingInternships] = useState(true);
  const [jobSearch, setJobSearch] = useState("");
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedReasonCode, setSelectedReasonCode] = useState<string>("ALL");
  const [onlyHasReports, setOnlyHasReports] = useState(false);
  const [jobPage, setJobPage] = useState(1);
  const [jobTotalPages, setJobTotalPages] = useState(1);
  const [jobTotalCount, setJobTotalCount] = useState(0);

  // Tab 2: Reports list state
  const [reports, setReports] = useState<InternshipReportRecord[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportSearch, setReportSearch] = useState("");
  const [selectedReportStatus, setSelectedReportStatus] = useState<string>("ALL");
  const [selectedReportReason, setSelectedReportReason] = useState<string>("ALL");
  const [reportPage, setReportPage] = useState(1);
  const [reportTotalPages, setReportTotalPages] = useState(1);
  const [reportTotalCount, setReportTotalCount] = useState(0);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);

  // Modal & Drawer states
  const [detailInternship, setDetailInternship] =
    useState<InternshipRecord | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [moderatingJob, setModeratingJob] = useState<InternshipRecord | null>(
    null
  );
  const [reviewingReport, setReviewingReport] =
    useState<InternshipReportRecord | null>(null);

  // Stats Counters
  const [stats, setStats] = useState({
    totalJobs: 0,
    openJobs: 0,
    rejectedJobs: 0,
    pendingReports: 0,
  });

  // Load Semesters
  useEffect(() => {
    async function fetchSemesters() {
      try {
        const res = await semestersApi.list({ limit: 100 });
        setSemesters(res.items);
      } catch (err) {
        console.error("Failed to load semesters:", err);
      }
    }
    void fetchSemesters();
  }, []);

  // Fetch Internships
  const loadInternships = useCallback(async () => {
    setLoadingInternships(true);
    try {
      const res = await internshipsApi.list({
        page: jobPage,
        limit: 10,
        search: jobSearch.trim() || undefined,
        semesterId:
          selectedSemesterId === "ALL" ? undefined : selectedSemesterId,
        status:
          selectedStatus === "ALL"
            ? undefined
            : (selectedStatus as InternshipRecord["status"]),
        moderationReasonCode:
          selectedReasonCode === "ALL" ? undefined : selectedReasonCode,
        hasReports: onlyHasReports ? true : undefined,
      });
      setInternships(res.items);
      setJobTotalCount(res.pagination.total);
      setJobTotalPages(res.pagination.totalPages || 1);

      // Compute stats overview
      setStats((prev) => ({
        ...prev,
        totalJobs: res.pagination.total,
      }));
    } catch (err) {
      notify({
        title: "Lỗi tải danh sách",
        message: getApiErrorMessage(err),
        tone: "error",
      });
    } finally {
      setLoadingInternships(false);
    }
  }, [
    jobPage,
    jobSearch,
    selectedSemesterId,
    selectedStatus,
    selectedReasonCode,
    onlyHasReports,
    notify,
  ]);

  // Fetch Reports
  const loadReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const res = await internshipsApi.listReports({
        page: reportPage,
        limit: 10,
        status:
          selectedReportStatus === "ALL"
            ? undefined
            : (selectedReportStatus as InternshipReportStatus),
        reasonCode:
          selectedReportReason === "ALL"
            ? undefined
            : (selectedReportReason as InternshipReportReasonCode),
        semesterId:
          selectedSemesterId === "ALL" ? undefined : selectedSemesterId,
      });

      // Filter locally by search if student/job keywords typed
      let items = res.items;
      if (reportSearch.trim()) {
        const term = reportSearch.toLowerCase();
        items = items.filter(
          (r) =>
            r.student?.fullName?.toLowerCase().includes(term) ||
            r.student?.studentCode?.toLowerCase().includes(term) ||
            r.internship?.title?.toLowerCase().includes(term) ||
            r.internship?.company?.companyName?.toLowerCase().includes(term) ||
            r.reasonDetail?.toLowerCase().includes(term)
        );
      }

      setReports(items);
      setReportTotalCount(res.pagination.total);
      setReportTotalPages(res.pagination.totalPages || 1);

      // Count pending reports
      const pendingRes = await internshipsApi.listReports({
        status: "PENDING",
        limit: 1,
      });
      setPendingReportsCount(pendingRes.pagination.total);
      setStats((prev) => ({
        ...prev,
        pendingReports: pendingRes.pagination.total,
      }));
    } catch (err) {
      notify({
        title: "Lỗi tải báo cáo",
        message: getApiErrorMessage(err),
        tone: "error",
      });
    } finally {
      setLoadingReports(false);
    }
  }, [
    reportPage,
    selectedReportStatus,
    selectedReportReason,
    selectedSemesterId,
    reportSearch,
    notify,
  ]);

  // Re-fetch on filter changes
  useEffect(() => {
    void loadInternships();
  }, [loadInternships]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  // Open Full Job Detail Drawer
  const handleOpenDetail = (jobOrId: InternshipRecord | string) => {
    if (typeof jobOrId !== "string") {
      setDetailInternship(jobOrId);
      return;
    }
    const found = internships.find((j) => j.id === jobOrId);
    if (found) {
      setDetailInternship(found);
      return;
    }
    setLoadingDetail(true);
    internshipsApi
      .get(jobOrId)
      .then((fullJob) => {
        setDetailInternship(fullJob);
      })
      .catch((err) => {
        notify({
          title: "Không thể tải chi tiết",
          message: getApiErrorMessage(err),
          tone: "error",
        });
      })
      .finally(() => {
        setLoadingDetail(false);
      });
  };

  // Semester dropdown options
  const semesterOptions: CustomSelectOption[] = useMemo(() => {
    return [
      { value: "ALL", label: "Tất cả kỳ thực tập", sublabel: "Toàn bộ hệ thống" },
      ...semesters.map((s) => ({
        value: s.id,
        label: s.name,
        sublabel: `${new Date(s.startDate).toLocaleDateString("vi-VN")} – ${new Date(
          s.endDate
        ).toLocaleDateString("vi-VN")}`,
        badge: s.status === "ACTIVE" ? (
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
            Hiện tại
          </span>
        ) : undefined,
      })),
    ];
  }, [semesters]);

  // Status dropdown options
  const statusOptions: CustomSelectOption[] = [
    { value: "ALL", label: "Tất cả trạng thái" },
    {
      value: "OPEN",
      label: "Đang mở tuyển",
      badge: (
        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
      ),
    },
    {
      value: "DRAFT",
      label: "Bản nháp",
      badge: <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />,
    },
    {
      value: "REJECTED",
      label: "Bị gỡ vi phạm",
      badge: <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />,
    },
    {
      value: "CLOSED",
      label: "Đã đóng",
      badge: <span className="h-2 w-2 rounded-full bg-slate-400 inline-block" />,
    },
  ];

  // Moderation reason filter options
  const moderationReasonOptions: CustomSelectOption[] = [
    { value: "ALL", label: "Tất cả lý do vi phạm" },
    ...(
      Object.keys(MODERATION_REASON_LABELS) as InternshipModerationReasonCode[]
    ).map((code) => ({
      value: code,
      label: MODERATION_REASON_LABELS[code],
      sublabel: REASON_EXPLANATIONS[code],
    })),
  ];

  // Report status dropdown options
  const reportStatusOptions: CustomSelectOption[] = [
    { value: "ALL", label: "Tất cả trạng thái báo cáo" },
    {
      value: "PENDING",
      label: "Chờ xử lý",
      badge: (
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
          Mới
        </span>
      ),
    },
    { value: "INVESTIGATING", label: "Đang xác minh" },
    { value: "RESOLVED", label: "Đã xử lý (Xác nhận vi phạm)" },
    { value: "DISMISSED", label: "Đã bác bỏ (Không vi phạm)" },
  ];

  // Report reason dropdown options
  const reportReasonOptions: CustomSelectOption[] = [
    { value: "ALL", label: "Tất cả loại vi phạm phản ánh" },
    ...(
      Object.keys(REPORT_REASON_LABELS) as InternshipReportReasonCode[]
    ).map((code) => ({
      value: code,
      label: REPORT_REASON_LABELS[code],
    })),
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#cbebeb] bg-[#e6f6f6] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#00878a]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Kiểm soát chất lượng tuyển dụng
        </div>
        <h1 className="mt-2 text-2xl sm:text-[26px] font-black tracking-tight text-[#006f72]">
          Quản lý &amp; Hậu kiểm Tin tuyển dụng
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Theo dõi toàn diện các vị trí thực tập trong hệ thống, tiếp nhận phản
          hồi phản ánh từ sinh viên và chủ động gỡ bỏ các tin vi phạm để bảo
          vệ quyền lợi người học.
        </p>
      </section>

      {/* 2. KPI Metrics Bar */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Tổng số bài đăng
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e6f6f6] text-[#00878a]">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {jobTotalCount}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Trải rộng trên tất cả kỳ thực tập
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Đang mở tuyển (OPEN)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            {internships.filter((j) => j.status === "OPEN").length}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Hiển thị công khai cho sinh viên
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Bị gỡ vi phạm
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <Ban className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600">
            {internships.filter((j) => j.status === "REJECTED").length}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Đã thu hồi &amp; khóa bài đăng
          </p>
        </article>

        <article
          onClick={() => setActiveTab("REPORTS")}
          className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs cursor-pointer hover:border-amber-300 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Báo cáo chờ duyệt
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">
              {pendingReportsCount}
            </span>
            {pendingReportsCount > 0 && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 animate-pulse">
                Cần xử lý
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Từ phản ánh của sinh viên
          </p>
        </article>
      </section>

      {/* 3. Unified Workspace Container (Tabs + Filter Toolbar + Table) */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        {/* Unified Card Header: Underline Tabs Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/75 px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("INTERNSHIPS")}
              className={`group relative flex items-center gap-2 border-b-2 px-3 sm:px-4 py-3.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "INTERNSHIPS"
                  ? "border-[#00878a] text-[#00878a]"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
              }`}
            >
              <Briefcase
                className={`h-4 w-4 ${
                  activeTab === "INTERNSHIPS"
                    ? "text-[#00878a]"
                    : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              <span>Danh sách tin tuyển dụng</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === "INTERNSHIPS"
                    ? "bg-[#e6f6f6] text-[#00878a]"
                    : "bg-slate-200/80 text-slate-600"
                }`}
              >
                {jobTotalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("REPORTS")}
              className={`group relative flex items-center gap-2 border-b-2 px-3 sm:px-4 py-3.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "REPORTS"
                  ? "border-amber-600 text-amber-700"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
              }`}
            >
              <ShieldAlert
                className={`h-4 w-4 ${
                  activeTab === "REPORTS"
                    ? "text-amber-600"
                    : "text-slate-400 group-hover:text-amber-500"
                }`}
              />
              <span>Báo cáo vi phạm từ sinh viên</span>
              {pendingReportsCount > 0 ? (
                <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white animate-pulse">
                  {pendingReportsCount}
                </span>
              ) : (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    activeTab === "REPORTS"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-200/80 text-slate-600"
                  }`}
                >
                  {reportTotalCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === "INTERNSHIPS" ? (
          <>
            {/* Toolbar Filters Bar */}
            <div className="border-b border-slate-100 bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
                {/* Search Input */}
                <div className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-2xs transition focus-within:border-[#00878a] focus-within:ring-2 focus-within:ring-[#00878a]/20">
                  <Search className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    value={jobSearch}
                    onChange={(e) => {
                      setJobSearch(e.target.value);
                      setJobPage(1);
                    }}
                    placeholder="Tìm kiếm tin tuyển dụng, công ty, vị trí..."
                    className="w-full text-xs text-slate-800 outline-none placeholder:text-slate-400"
                  />
                  {jobSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setJobSearch("");
                        setJobPage(1);
                      }}
                      className="cursor-pointer text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Semester Custom Dropdown */}
                <div className="w-full shrink-0 sm:w-[200px] lg:w-[220px]">
                  <CustomSelect
                    value={selectedSemesterId}
                    onChange={(val) => {
                      setSelectedSemesterId(val);
                      setJobPage(1);
                    }}
                    options={semesterOptions}
                    searchable
                  />
                </div>

                {/* Status Custom Dropdown */}
                <div className="w-full shrink-0 sm:w-[150px] lg:w-[165px]">
                  <CustomSelect
                    value={selectedStatus}
                    onChange={(val) => {
                      setSelectedStatus(val);
                      setJobPage(1);
                    }}
                    options={statusOptions}
                  />
                </div>

                {/* Moderation Reason Code Dropdown */}
                <div className="w-full shrink-0 sm:w-[160px] lg:w-[180px]">
                  <CustomSelect
                    value={selectedReasonCode}
                    onChange={(val) => {
                      setSelectedReasonCode(val);
                      setJobPage(1);
                    }}
                    options={moderationReasonOptions}
                  />
                </div>

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={() => {
                    setJobSearch("");
                    setSelectedSemesterId("ALL");
                    setSelectedStatus("ALL");
                    setSelectedReasonCode("ALL");
                    setOnlyHasReports(false);
                    setJobPage(1);
                    void loadInternships();
                    void loadReports();
                  }}
                  disabled={loadingInternships || loadingReports}
                  className="inline-flex h-10 cursor-pointer shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#cbebeb] bg-[#e6f6f6] px-3.5 text-xs font-semibold text-[#00878a] shadow-2xs transition hover:bg-[#d5eeee] active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
                  title="Đặt lại bộ lọc và làm mới dữ liệu"
                >
                  <RotateCcw
                    className={`h-4 w-4 shrink-0 ${
                      loadingInternships || loadingReports ? "animate-spin" : ""
                    }`}
                  />
                  <span>Làm mới</span>
                </button>
              </div>
            </div>

            {/* Internships Table */}
            {loadingInternships ? (
              <div className="p-16 text-center text-xs text-slate-500">
                <LoaderCircle className="mx-auto mb-3 h-6 w-6 animate-spin text-[#00878a]" />
                Đang tải danh sách tin tuyển dụng...
              </div>
            ) : internships.length === 0 ? (
              <div className="p-16 text-center text-xs text-slate-500 space-y-2">
                <Briefcase className="mx-auto h-8 w-8 text-slate-300" />
                <p className="font-bold text-slate-700">
                  Không tìm thấy tin tuyển dụng nào
                </p>
                <p className="text-slate-400">
                  Thử thay đổi từ khóa hoặc bộ lọc để xem các tin khác.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs table-fixed min-w-[1050px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="w-[38%] px-4 py-3">Vị trí &amp; Doanh nghiệp</th>
                      <th className="w-[26%] px-4 py-3">Kỳ tuyển &amp; Hạn chót</th>
                      <th className="w-[20%] px-4 py-3">Chỉ tiêu &amp; Ứng tuyển</th>
                      <th className="w-[16%] px-4 py-3 text-right whitespace-nowrap min-w-[120px]">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {internships.map((job) => {
                      const statusConf =
                        internshipStatusBadgeConfig[job.status] || {
                          label: job.status,
                          className: "bg-slate-100 text-slate-600 border-slate-200",
                        };
                      const reportsCount = job._count?.reports || 0;
                      const appsCount = job._count?.applications || 0;
                      const occupancyRate =
                        job.slots > 0
                          ? Math.min(
                              100,
                              Math.round((job.filledSlots / job.slots) * 100)
                            )
                          : 0;

                      return (
                        <tr
                          key={job.id}
                          onClick={() => handleOpenDetail(job)}
                          className="h-[70px] cursor-pointer hover:bg-slate-50/90 transition group"
                        >
                          {/* Col 1: Job & Company */}
                          <td className="px-4 py-2.5 align-middle h-[70px]">
                            <div className="flex items-center gap-3 min-w-0">
                              {job.company.logo ? (
                                <img
                                  src={job.company.logo}
                                  alt={job.company.companyName}
                                  className="h-9 w-9 rounded-xl object-contain border border-slate-200 p-0.5 shrink-0 bg-white"
                                />
                              ) : (
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e6f6f6] border border-[#cbebeb] font-bold text-[#00878a] shrink-0 text-xs">
                                  {job.company.companyName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p
                                  className="truncate text-xs font-bold text-slate-900 leading-snug group-hover:text-[#00878a] transition-colors"
                                  title={job.title}
                                >
                                  {job.title}
                                </p>
                                <p
                                  className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 font-medium truncate"
                                  title={job.company.companyName}
                                >
                                  <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
                                  <span className="truncate">{job.company.companyName}</span>
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Col 2: Semester & Timeline */}
                          <td className="px-4 py-2.5 align-middle h-[70px] whitespace-nowrap">
                            <div className="min-w-0">
                              <p
                                className="truncate font-semibold text-slate-800 text-xs leading-snug"
                                title={job.semester.name}
                              >
                                {cleanSemesterName(job.semester.name)}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1 text-slate-500 text-[11px] truncate">
                                <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="truncate">
                                  Hạn: {job.deadline ? new Date(job.deadline).toLocaleDateString("vi-VN") : "Không thời hạn"}
                                </span>
                              </p>
                            </div>
                          </td>

                          {/* Col 3: Slots & Applicants */}
                          <td className="px-4 py-2.5 align-middle h-[70px] whitespace-nowrap">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-slate-800 leading-snug">
                                <span>{job.filledSlots}/{job.slots} slot</span>
                                {job.slots > 0 && (
                                  <span className="text-slate-400 font-normal ml-1">({occupancyRate}%)</span>
                                )}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 truncate">
                                <Users className="h-3 w-3 text-slate-400 shrink-0" />
                                <span>{appsCount} ứng tuyển</span>
                              </p>
                            </div>
                          </td>

                          {/* Col 4: Status & Warnings */}
                          <td className="px-4 py-2.5 align-middle h-[70px] whitespace-nowrap text-right">
                            <div className="flex flex-col items-end gap-1 min-w-0">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusConf.className}`}
                              >
                                {statusConf.label}
                              </span>
                              {reportsCount > 0 ? (
                                <span
                                  className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 truncate"
                                  title={`${reportsCount} sinh viên phản ánh vi phạm`}
                                >
                                  <ShieldAlert className="h-3 w-3 text-amber-600 shrink-0" />
                                  <span>{reportsCount} phản ánh</span>
                                </span>
                              ) : job.status === "REJECTED" && job.moderationReasonCode ? (
                                <span
                                  className="truncate text-[10px] text-rose-600 font-medium max-w-[130px]"
                                  title={MODERATION_REASON_LABELS[job.moderationReasonCode] || job.moderationReasonCode}
                                >
                                  {MODERATION_REASON_LABELS[job.moderationReasonCode] || job.moderationReasonCode}
                                </span>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination for Internships */}
            {!loadingInternships && internships.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 text-xs text-slate-600">
                <span className="font-medium text-slate-500">
                  Tổng: <strong className="text-slate-700">{jobTotalCount}</strong> bài đăng
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={jobPage <= 1 || loadingInternships}
                    onClick={() => setJobPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-slate-200 p-2 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer hover:bg-slate-50 transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span>
                    Trang {jobPage}/{jobTotalPages}
                  </span>
                  <button
                    type="button"
                    disabled={jobPage >= jobTotalPages || loadingInternships}
                    onClick={() =>
                      setJobPage((p) => Math.min(jobTotalPages, p + 1))
                    }
                    className="rounded-lg border border-slate-200 p-2 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer hover:bg-slate-50 transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Toolbar Filters Bar for Reports */}
            <div className="border-b border-slate-100 bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
                {/* Search Input */}
                <div className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-2xs transition focus-within:border-[#00878a] focus-within:ring-2 focus-within:ring-[#00878a]/20">
                  <Search className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    value={reportSearch}
                    onChange={(e) => {
                      setReportSearch(e.target.value);
                      setReportPage(1);
                    }}
                    placeholder="Tìm sinh viên, MSSV, tên công ty, tiêu đề tin..."
                    className="w-full text-xs text-slate-800 outline-none placeholder:text-slate-400"
                  />
                  {reportSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setReportSearch("");
                        setReportPage(1);
                      }}
                      className="cursor-pointer text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Semester Custom Dropdown */}
                <div className="w-full shrink-0 sm:w-[200px] lg:w-[220px]">
                  <CustomSelect
                    value={selectedSemesterId}
                    onChange={(val) => {
                      setSelectedSemesterId(val);
                      setJobPage(1);
                      setReportPage(1);
                    }}
                    options={semesterOptions}
                    searchable
                  />
                </div>

                {/* Status Custom Dropdown */}
                <div className="w-full shrink-0 sm:w-[150px] lg:w-[165px]">
                  <CustomSelect
                    value={selectedReportStatus}
                    onChange={(val) => {
                      setSelectedReportStatus(val);
                      setReportPage(1);
                    }}
                    options={reportStatusOptions}
                  />
                </div>

                {/* Reason Custom Dropdown */}
                <div className="w-full shrink-0 sm:w-[160px] lg:w-[180px]">
                  <CustomSelect
                    value={selectedReportReason}
                    onChange={(val) => {
                      setSelectedReportReason(val);
                      setReportPage(1);
                    }}
                    options={reportReasonOptions}
                  />
                </div>

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={() => {
                    setReportSearch("");
                    setSelectedReportStatus("ALL");
                    setSelectedReportReason("ALL");
                    setSelectedSemesterId("ALL");
                    setReportPage(1);
                    void loadReports();
                  }}
                  disabled={loadingReports}
                  className="inline-flex h-10 cursor-pointer shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#cbebeb] bg-[#e6f6f6] px-3.5 text-xs font-semibold text-[#00878a] shadow-2xs transition hover:bg-[#d5eeee] active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
                  title="Đặt lại bộ lọc và làm mới dữ liệu"
                >
                  <RotateCcw
                    className={`h-4 w-4 shrink-0 ${loadingReports ? "animate-spin" : ""}`}
                  />
                  <span>Làm mới</span>
                </button>
              </div>
            </div>

            {/* Reports Table */}
            {loadingReports ? (
              <div className="p-16 text-center text-xs text-slate-500">
                <LoaderCircle className="mx-auto mb-3 h-6 w-6 animate-spin text-[#00878a]" />
                Đang tải danh sách báo cáo vi phạm...
              </div>
            ) : reports.length === 0 ? (
              <div className="p-16 text-center text-xs text-slate-500 space-y-2">
                <ShieldCheck className="mx-auto h-8 w-8 text-emerald-400" />
                <p className="font-bold text-slate-700">
                  Không có báo cáo vi phạm nào cần xử lý
                </p>
                <p className="text-slate-400">
                  Các phản ánh từ sinh viên sẽ được hiển thị ngay tại đây.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs table-fixed min-w-[1050px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="w-[26%] px-4 py-3">Sinh viên phản ánh</th>
                      <th className="w-[32%] px-4 py-3">Tin tuyển dụng bị báo cáo</th>
                      <th className="w-[26%] px-4 py-3">Lý do &amp; Nội dung</th>
                      <th className="w-[16%] px-4 py-3 text-right whitespace-nowrap min-w-[120px]">Trạng thái xử lý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.map((report) => {
                      const repConf =
                        reportStatusBadgeConfig[report.status] || {
                          label: report.status,
                          className: "bg-slate-100 text-slate-600 border-slate-200",
                        };

                      return (
                        <tr
                          key={report.id}
                          onClick={() => setReviewingReport(report)}
                          className="h-[70px] cursor-pointer hover:bg-slate-50/90 transition group"
                        >
                          {/* Col 1: Student info */}
                          <td className="px-4 py-2.5 align-middle h-[70px] whitespace-nowrap">
                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-900 group-hover:text-[#00878a] transition-colors" title={report.student?.fullName || "Sinh viên"}>
                                {report.student?.fullName || "Sinh viên"}
                              </p>
                              <p className="mt-0.5 truncate text-[11px] text-slate-500 flex items-center gap-1">
                                <span className="font-mono font-semibold text-slate-700">{report.student?.studentCode || "—"}</span>
                                {report.student?.email && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">{report.student.email}</span>
                                  </>
                                )}
                              </p>
                            </div>
                          </td>

                          {/* Col 2: Job & Company */}
                          <td className="px-4 py-2.5 align-middle h-[70px] whitespace-nowrap">
                            <div className="min-w-0">
                              <p
                                className="truncate font-bold text-slate-800 leading-snug group-hover:text-[#00878a] transition-colors"
                                title={report.internship?.title || "Bài đăng tuyển dụng"}
                              >
                                {report.internship?.title || "Bài đăng tuyển dụng"}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 font-medium truncate" title={report.internship?.company?.companyName}>
                                <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
                                <span className="truncate">
                                  {report.internship?.company?.companyName || "Doanh nghiệp"}
                                </span>
                              </p>
                            </div>
                          </td>

                          {/* Col 3: Reason & Details */}
                          <td className="px-4 py-2.5 align-middle h-[70px] whitespace-nowrap">
                            <div className="min-w-0">
                              <span className="inline-block rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-800 truncate max-w-[200px]">
                                {REPORT_REASON_LABELS[report.reasonCode] ||
                                  report.reasonCode}
                              </span>
                              <p className="truncate text-slate-600 text-[11px] mt-0.5" title={report.reasonDetail || ""}>
                                {report.reasonDetail || "Không có mô tả chi tiết."}
                              </p>
                            </div>
                          </td>

                          {/* Col 4: Status */}
                          <td className="px-4 py-2.5 align-middle h-[70px] whitespace-nowrap text-right">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${repConf.className}`}
                            >
                              {repConf.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination for reports */}
            {!loadingReports && reports.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 text-xs text-slate-600">
                <span className="font-medium text-slate-500">
                  Tổng: <strong className="text-slate-700">{reportTotalCount}</strong> báo cáo
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={reportPage <= 1 || loadingReports}
                    onClick={() => setReportPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-slate-200 p-2 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer hover:bg-slate-50 transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span>
                    Trang {reportPage}/{reportTotalPages}
                  </span>
                  <button
                    type="button"
                    disabled={reportPage >= reportTotalPages || loadingReports}
                    onClick={() => setReportPage((p) => Math.min(reportTotalPages, p + 1))}
                    className="rounded-lg border border-slate-200 p-2 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer hover:bg-slate-50 transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* 6. JOB DETAIL SLIDE-OVER / MODAL */}
      {detailInternship && (
        <JobDetailModal
          job={detailInternship}
          onClose={() => setDetailInternship(null)}
          onModerate={() => {
            setModeratingJob(detailInternship);
            setDetailInternship(null);
          }}
        />
      )}

      {/* 7. MODERATION ACTION MODAL */}
      {moderatingJob && (
        <ModerationModal
          job={moderatingJob}
          onClose={() => setModeratingJob(null)}
          onSuccess={() => {
            setModeratingJob(null);
            void loadInternships();
            void loadReports();
          }}
        />
      )}

      {/* 8. REPORT REVIEW MODAL */}
      {reviewingReport && (
        <ReportReviewModal
          report={reviewingReport}
          onClose={() => setReviewingReport(null)}
          onSuccess={() => {
            setReviewingReport(null);
            void loadReports();
          }}
          onModerateJob={(jobId) => {
            setReviewingReport(null);
            void handleOpenDetail(jobId);
          }}
        />
      )}
    </div>
  );
}

// ==========================================
// 4. COMPONENT: JOB DETAIL DRAWER / MODAL
// ==========================================

function JobDetailModal({
  job,
  onClose,
  onModerate,
}: {
  job: InternshipRecord;
  onClose: () => void;
  onModerate: () => void;
}) {
  const statusConf =
    internshipStatusBadgeConfig[job.status] || {
      label: job.status,
      className: "bg-slate-100 text-slate-600 border-slate-200",
    };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      >
      <div
        className="relative flex flex-col max-h-[90vh] w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {job.company.logo ? (
              <img
                src={job.company.logo}
                alt={job.company.companyName}
                className="h-11 w-11 rounded-2xl object-contain border border-slate-200 p-1 bg-white shrink-0 shadow-2xs"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e6f6f6] border border-[#cbebeb] font-black text-[#00878a] shrink-0 text-base shadow-2xs">
                {job.company.companyName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug truncate" title={job.title}>
                {job.title}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 font-medium truncate flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">{job.company.companyName}</span>
                <span>•</span>
                <span>{cleanSemesterName(job.semester.name)}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Moderation Alert Box if Rejected */}
          {job.status === "REJECTED" && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-rose-900 shadow-2xs space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <span className="font-bold text-sm text-rose-900">
                  Bài đăng này đã bị Quản trị viên gỡ bỏ vi phạm
                </span>
                {job.moderationReasonCode && (
                  <span className="rounded bg-rose-200/80 px-2 py-0.5 text-[11px] font-bold text-rose-900">
                    {MODERATION_REASON_LABELS[job.moderationReasonCode] ||
                      job.moderationReasonCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-rose-800 leading-relaxed pl-7">
                {job.moderationReason || "Không có lý do chi tiết được lưu."}
              </p>
              {job.moderatedBy && (
                <div className="pl-7 text-[11px] text-rose-700 font-medium">
                  Kiểm duyệt bởi: {job.moderatedBy.fullName || job.moderatedBy.email} •{" "}
                  {job.moderatedAt
                    ? new Date(job.moderatedAt).toLocaleString("vi-VN")
                    : ""}
                </div>
              )}
            </div>
          )}

          {/* Key Info Strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 p-4">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Trạng thái bài đăng
              </span>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusConf.className}`}
                >
                  {statusConf.label}
                </span>
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Chỉ tiêu tuyển dụng
              </span>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {job.filledSlots} / {job.slots} slot
                <span className="text-[11px] font-normal text-slate-500 ml-1">
                  ({Math.max(0, job.slots - job.filledSlots)} còn lại)
                </span>
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Hạn nộp hồ sơ
              </span>
              <p className="mt-1 text-xs font-bold text-slate-900 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>
                  {job.deadline
                    ? new Date(job.deadline).toLocaleDateString("vi-VN")
                    : "Không thời hạn"}
                </span>
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Hình thức &amp; Phụ cấp
              </span>
              <p className="mt-1 text-xs font-bold text-slate-900 truncate" title={`${workTypeLabels[job.workType || ""] || "Linh hoạt"}${job.stipend ? ` • ${job.stipend}` : ""}`}>
                <span>{workTypeLabels[job.workType || ""] || "Linh hoạt"}</span>
                <span className="text-emerald-600 font-semibold ml-1">
                  {job.stipend ? `• ${job.stipend}` : "• Không lương"}
                </span>
              </p>
            </div>
          </div>

          {/* Company Details */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Building2 className="h-4 w-4 text-[#00878a]" />
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Thông tin Doanh nghiệp tuyển dụng
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2 text-slate-700">
                <span className="text-slate-400 shrink-0">Tên pháp lý:</span>
                <span className="font-semibold text-slate-900">{job.company.companyName}</span>
              </div>
              {job.company.taxCode && (
                <div className="flex items-start gap-2 text-slate-700">
                  <span className="text-slate-400 shrink-0">Mã số thuế:</span>
                  <span className="font-mono font-semibold text-slate-900">{job.company.taxCode}</span>
                </div>
              )}
              {job.company.contactEmail && (
                <div className="flex items-start gap-2 text-slate-700">
                  <span className="text-slate-400 shrink-0">Email liên hệ:</span>
                  <a href={`mailto:${job.company.contactEmail}`} className="font-medium text-[#00878a] hover:underline">
                    {job.company.contactEmail}
                  </a>
                </div>
              )}
              {job.company.contactPhone && (
                <div className="flex items-start gap-2 text-slate-700">
                  <span className="text-slate-400 shrink-0">Số điện thoại:</span>
                  <span className="font-medium text-slate-900">{job.company.contactPhone}</span>
                </div>
              )}
              {job.company.address && (
                <div className="flex items-start gap-2 text-slate-700 sm:col-span-2">
                  <span className="text-slate-400 shrink-0">Địa chỉ hoạt động:</span>
                  <span className="font-medium text-slate-800">{job.company.address}</span>
                </div>
              )}
              {job.company.website && (
                <div className="flex items-start gap-2 text-slate-700 sm:col-span-2">
                  <span className="text-slate-400 shrink-0">Website:</span>
                  <a
                    href={job.company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-[#00878a] hover:underline"
                  >
                    <span>{job.company.website}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Job Description */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-2.5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText className="h-4 w-4 text-[#00878a]" />
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Mô tả công việc &amp; Nhiệm vụ
              </h3>
            </div>
            <div className="text-xs leading-relaxed text-slate-700 whitespace-pre-line bg-slate-50/50 rounded-xl p-3 border border-slate-100">
              {job.description || "Chưa có mô tả công việc."}
            </div>
          </div>

          {/* Requirements */}
          {job.requirements && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-2.5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <CheckCircle2 className="h-4 w-4 text-[#00878a]" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Yêu cầu ứng viên
                </h3>
              </div>
              <div className="text-xs leading-relaxed text-slate-700 whitespace-pre-line bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                {job.requirements}
              </div>
            </div>
          )}

          {/* Skills Matrix */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sparkles className="h-4 w-4 text-[#00878a]" />
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Kỹ năng &amp; Trọng số đánh giá ({job.skills?.length || 0})
              </h3>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {job.skills && job.skills.length > 0 ? (
                job.skills.map((skill) => (
                  <div
                    key={skill.skillId}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs shadow-2xs"
                  >
                    <span className="font-semibold text-slate-800">{skill.name}</span>
                    <span className="rounded-md bg-[#e6f6f6] border border-[#cbebeb] px-1.5 py-0.5 text-[10px] font-bold text-[#00878a]">
                      Trọng số: {skill.weight}
                    </span>
                    {skill.isRequired && (
                      <span className="rounded-md bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                        Bắt buộc
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <span className="text-slate-400 italic text-xs">
                  Chưa gán kỹ năng đánh giá
                </span>
              )}
            </div>
          </div>

          {/* Reports on this job if any */}
          {job.reports && job.reports.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-amber-200/60 pb-2">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                <h3 className="font-bold text-amber-900 text-xs uppercase tracking-wider">
                  Phản ánh vi phạm từ sinh viên ({job.reports.length})
                </h3>
              </div>
              <div className="space-y-2">
                {job.reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-xs space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {rep.student?.fullName} ({rep.student?.studentCode})
                      </span>
                      <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                        {REPORT_REASON_LABELS[rep.reasonCode] || rep.reasonCode}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[11px]">
                      {rep.reasonDetail || "Không có nội dung mô tả chi tiết."}
                    </p>
                    <div className="text-[10px] text-slate-400">
                      Gửi lúc: {new Date(rep.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={onModerate}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer shadow-xs ${
              job.status === "REJECTED"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-rose-600 text-white hover:bg-rose-700"
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>
              {job.status === "REJECTED"
                ? "Khôi phục tin tuyển dụng"
                : "Kiểm duyệt / Gỡ tin vi phạm"}
            </span>
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}

// ==========================================
// 5. COMPONENT: MODERATION ACTION MODAL
// ==========================================

function ModerationModal({
  job,
  onClose,
  onSuccess,
}: {
  job: InternshipRecord;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { notify } = useAppFeedback();

  const [action, setAction] = useState<"REJECT" | "REQUEST_REVISION" | "RESTORE">(
    job.status === "REJECTED" ? "RESTORE" : "REJECT"
  );
  const [reasonCode, setReasonCode] =
    useState<InternshipModerationReasonCode>("POLICY_VIOLATION");
  const [reason, setReason] = useState("");
  const [notifyApplicants, setNotifyApplicants] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedReason = reason.trim();
    if (action !== "RESTORE" && trimmedReason.length < 10) {
      setError("Vui lòng nhập lý do kiểm duyệt chi tiết (tối thiểu 10 ký tự).");
      return;
    }

    setSubmitting(true);
    try {
      const payload: ModerateInternshipInput = {
        action,
        reasonCode: action === "RESTORE" ? undefined : reasonCode,
        reasonDetail:
          action === "RESTORE"
            ? (trimmedReason || "Khôi phục theo quyết định của Quản trị viên")
            : trimmedReason,
        notifyApplicants: action === "REJECT" ? notifyApplicants : undefined,
      };

      await internshipsApi.moderate(job.id, payload);
      notify({
        title: "Kiểm duyệt thành công",
        message:
          action === "REJECT"
            ? "Đã gỡ bài đăng vi phạm và bảo vệ quyền lợi sinh viên đang ứng tuyển."
            : action === "REQUEST_REVISION"
            ? "Đã chuyển tin về bản nháp và gửi yêu cầu chỉnh sửa cho doanh nghiệp."
            : "Đã khôi phục tin tuyển dụng hoạt động trở lại.",
        tone: "success",
      });
      onSuccess();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative flex flex-col max-h-[90vh] w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="border-b border-slate-200 bg-slate-50/75 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                action === "RESTORE"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Kiểm duyệt tin tuyển dụng
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {job.title} • {job.company.companyName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Choice - Large Segmented Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Lựa chọn hành động xử lý:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setAction("REJECT")}
                className={`flex flex-col text-left p-3 rounded-2xl border transition cursor-pointer ${
                  action === "REJECT"
                    ? "border-rose-500 bg-rose-50/80 ring-2 ring-rose-200 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-rose-900 text-xs">
                    Gỡ bỏ vi phạm
                  </span>
                  <Ban className="h-4 w-4 text-rose-600" />
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Khóa tin ngay lập tức vì vi phạm nghiêm trọng.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setAction("REQUEST_REVISION")}
                className={`flex flex-col text-left p-3 rounded-2xl border transition cursor-pointer ${
                  action === "REQUEST_REVISION"
                    ? "border-amber-500 bg-amber-50/80 ring-2 ring-amber-200 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-amber-900 text-xs">
                    Yêu cầu chỉnh sửa
                  </span>
                  <Edit3 className="h-4 w-4 text-amber-600" />
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Chuyển về Nháp để Doanh nghiệp sửa lại thông tin.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setAction("RESTORE")}
                className={`flex flex-col text-left p-3 rounded-2xl border transition cursor-pointer ${
                  action === "RESTORE"
                    ? "border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-200 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-emerald-900 text-xs">
                    Khôi phục tin
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Mở lại tin cho sinh viên thấy và ứng tuyển bình thường.
                </p>
              </button>
            </div>
          </div>

          {/* Reason Code Selection (for REJECT & REQUEST_REVISION) */}
          {action !== "RESTORE" && (
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Phân loại lý do vi phạm:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  Object.keys(
                    MODERATION_REASON_LABELS
                  ) as InternshipModerationReasonCode[]
                ).map((code) => {
                  const isSelected = reasonCode === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setReasonCode(code)}
                      className={`flex flex-col text-left p-2.5 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/70 font-semibold text-indigo-900 ring-1 ring-indigo-200"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span>{MODERATION_REASON_LABELS[code]}</span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal mt-0.5">
                        {REASON_EXPLANATIONS[code]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detailed Reason Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-800">
                {action === "RESTORE"
                  ? "Ghi chú khôi phục (Tùy chọn):"
                  : "Mô tả vi phạm chi tiết gửi Doanh nghiệp:"}
              </label>
              {action !== "RESTORE" && (
                <span
                  className={`text-[10px] ${
                    reason.trim().length >= 10
                      ? "text-emerald-600 font-bold"
                      : "text-slate-400"
                  }`}
                >
                  {reason.trim().length}/10 ký tự tối thiểu
                </span>
              )}
            </div>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                action === "RESTORE"
                  ? "Nhập lý do hoặc căn cứ đồng ý cho phép tin tuyển dụng hoạt động trở lại..."
                  : "Nêu rõ điểm vi phạm (ví dụ: mô tả không đúng phụ cấp cam kết, yêu cầu đóng phí đào tạo...) để doanh nghiệp biết lý do bị gỡ."
              }
              className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-800 outline-none focus:border-[#00878a] focus:ring-2 focus:ring-[#00878a]/20 transition placeholder:text-slate-400 leading-relaxed"
            />
          </div>

          {/* Student Safeguard Checkbox (for REJECT) */}
          {action === "REJECT" && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-3.5 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyApplicants}
                  onChange={(e) => setNotifyApplicants(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-amber-950 block">
                    Cơ chế bảo vệ sinh viên đang ứng tuyển (Khuyên dùng)
                  </span>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Tự động hủy các đơn ứng tuyển đang ở trạng thái Chờ duyệt / Phỏng
                    vấn và hoàn trả lại hạn mức nộp đơn cho sinh viên, kèm thông báo
                    rõ ràng lý do bài đăng bị gỡ vi phạm.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold text-white transition cursor-pointer shadow-xs disabled:opacity-50 ${
                action === "RESTORE"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : action === "REQUEST_REVISION"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              {submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
              <span>
                {action === "RESTORE"
                  ? "Xác nhận khôi phục tin"
                  : action === "REQUEST_REVISION"
                  ? "Gửi yêu cầu chỉnh sửa"
                  : "Xác nhận gỡ tin vi phạm"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}

// ==========================================
// 6. COMPONENT: REPORT REVIEW MODAL
// ==========================================

function ReportReviewModal({
  report,
  onClose,
  onSuccess,
  onModerateJob,
}: {
  report: InternshipReportRecord;
  onClose: () => void;
  onSuccess: () => void;
  onModerateJob: (jobId: string) => void;
}) {
  const { notify } = useAppFeedback();

  const [status, setStatus] = useState<InternshipReportStatus>(report.status);
  const [adminNote, setAdminNote] = useState(report.adminNotes || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await internshipsApi.reviewReport(report.id, {
        status,
        adminNotes: adminNote.trim() || undefined,
      });
      notify({
        title: "Cập nhật thành công",
        message: "Đã cập nhật trạng thái xử lý báo cáo vi phạm.",
        tone: "success",
      });
      onSuccess();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative flex flex-col max-h-[90vh] w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="border-b border-slate-200 bg-slate-50/75 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Xử lý báo cáo vi phạm
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Mã báo cáo: #{report.id.slice(0, 8)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-700">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Student & Job overview */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">
                  Sinh viên phản ánh:
                </span>
                <span className="font-bold text-slate-900 block">
                  {report.student?.fullName} ({report.student?.studentCode})
                </span>
                <span className="text-[11px] text-slate-500">
                  {report.student?.email}
                </span>
              </div>
              <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                {REPORT_REASON_LABELS[report.reasonCode] || report.reasonCode}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <span className="text-[11px] text-slate-400 block font-medium">
                Tin tuyển dụng bị báo cáo:
              </span>
              <span className="font-bold text-slate-800">
                {report.internship?.title}
              </span>
              <span className="text-slate-500 block">
                {report.internship?.company?.companyName}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <span className="text-[11px] text-slate-400 block font-medium">
                Nội dung mô tả từ sinh viên:
              </span>
              <p className="mt-1 text-slate-800 leading-relaxed bg-white border border-slate-200 p-2.5 rounded-xl">
                {report.reasonDetail || "Không có nội dung mô tả chi tiết."}
              </p>
            </div>
          </div>

          {/* Status Segmented Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Cập nhật trạng thái xử lý:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus("INVESTIGATING")}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  status === "INVESTIGATING"
                    ? "border-blue-500 bg-blue-50 font-bold text-blue-900 ring-1 ring-blue-200"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="font-bold text-xs">Đang xác minh</div>
                <div className="text-[10px] text-slate-500 font-normal">
                  Đang đối chiếu thêm thông tin
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatus("RESOLVED")}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  status === "RESOLVED"
                    ? "border-emerald-500 bg-emerald-50 font-bold text-emerald-900 ring-1 ring-emerald-200"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="font-bold text-xs">Đã xử lý</div>
                <div className="text-[10px] text-slate-500 font-normal">
                  Xác nhận vi phạm &amp; xử phạt
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatus("DISMISSED")}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  status === "DISMISSED"
                    ? "border-slate-500 bg-slate-100 font-bold text-slate-900 ring-1 ring-slate-300"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="font-bold text-xs">Bác bỏ</div>
                <div className="text-[10px] text-slate-500 font-normal">
                  Báo cáo không đúng thực tế
                </div>
              </button>
            </div>
          </div>

          {/* Admin Note */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Ghi chú xử lý của Quản trị viên:
            </label>
            <textarea
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Nhập kết quả xác minh hoặc lưu ý xử lý..."
              className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-800 outline-none focus:border-[#00878a] focus:ring-2 focus:ring-[#00878a]/20 transition"
            />
          </div>

          {/* Direct moderate action */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3 flex items-center justify-between">
            <span className="text-[11px] text-rose-900 font-medium">
              Cần gỡ ngay tin tuyển dụng này?
            </span>
            <button
              type="button"
              onClick={() => onModerateJob(report.internshipId)}
              className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer"
            >
              <Ban className="h-3.5 w-3.5" /> Gỡ tin tuyển dụng
            </button>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#00878a] px-5 py-2 text-xs font-bold text-white hover:bg-[#006f72] transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              {submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
              <span>Lưu trạng thái</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}
