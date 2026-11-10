import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ModalPortal } from "../ModalPortal";
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  MapPin,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  LoaderCircle,
  Pencil,
  ChevronDown,
  RotateCcw,
  Search,
  SlidersHorizontal,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { ProfileAvatarPreview } from "../ProfileAvatarUpload";
import { placementsApi } from "../../placements/api";
import type {
  PlacementRecord,
  PlacementStatus,
  ReportStatus,
} from "../../placements/types";
import { semestersApi } from "../../semesters/api";
import type { SemesterRecord } from "../../semesters/types";
import { supervisionsApi } from "../../supervisions/api";
import type { LecturerOption } from "../../supervisions/types";
import { facultiesApi } from "../../organization/api";
import type { FacultyOption } from "../../organization/types";
import { downloadExcelWorkbook } from "../../utils/excelExport";

const statusLabel: Record<PlacementStatus, string> = {
  PENDING: "Chờ phân công",
  ACTIVE: "Đang thực tập",
  COMPLETED: "Đã hoàn tất",
  CANCELLED: "Đã hủy",
};
const statusClass: Record<PlacementStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  ACTIVE: "border-[#cbebeb] bg-[#e6f6f6] text-[#00878a]",
  COMPLETED: "border-slate-200 bg-slate-100 text-slate-700",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
};
const reportLabel: Record<ReportStatus, string> = {
  DRAFT: "Nháp",
  SUBMITTED: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Cần chỉnh sửa",
};
const date = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const formatDate = (value: string | null) =>
  value ? date.format(new Date(value)) : "Chưa cập nhật";
const formatDateTime = (value: string | null, fallback = "Chưa cập nhật") =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value))
    : fallback;
const isoDay = (value: string | null) => (value ? value.slice(0, 10) : "");

function cleanSemesterName(name?: string | null): string {
  if (!name) return "";
  const match = name.match(/^(Học kỳ\s*\d+\s*\([^)]+\))/i);
  if (match) return match[1];
  return name.replace(/\s*\[.*?\]/g, "").split(" - Kỳ")[0].trim();
}

function formatFacultyName(name?: string | null): string {
  if (!name) return "";
  const trimmed = name.trim();
  if (/^khoa\s+khoa\s*học/i.test(trimmed)) {
    return trimmed.replace(/^khoa\s+khoa\s*học/i, "Khoa KH");
  }
  if (/^khoa\s+/i.test(trimmed)) {
    return trimmed;
  }
  return `Khoa ${trimmed}`;
}

function hasInternshipStartedOrProgress(placement: PlacementRecord): boolean {
  return (
    placement.academicStatus === "ACTIVE" ||
    placement.academicStatus === "CLOSED" ||
    (placement.progress?.reportCount ?? 0) > 0 ||
    (placement.progress?.evaluationCount ?? 0) > 0
  );
}

function getPlacementBadge(placement: PlacementRecord): {
  label: string;
  className: string;
} {
  if (
    placement.status === "ACTIVE" &&
    !hasInternshipStartedOrProgress(placement)
  ) {
    return {
      label: "Chờ bắt đầu",
      className: "border-[#cbebeb] bg-[#e6f6f6] text-[#00878a]",
    };
  }
  return {
    label: statusLabel[placement.status],
    className: statusClass[placement.status],
  };
}

function isMidInternship(placement: PlacementRecord): boolean {
  return (
    placement.status === "ACTIVE" && hasInternshipStartedOrProgress(placement)
  );
}

function hasFinalReportOrEvaluations(placement: PlacementRecord): boolean {
  return (
    (placement.progress?.evaluationCount ?? 0) > 0 ||
    Boolean(
      placement.progress?.finalReportStatus &&
      placement.progress.finalReportStatus !== "DRAFT",
    )
  );
}

const PRE_START_CANCEL_REASONS = [
  "Sinh viên xin đổi đơn vị thực tập trước ngày bắt đầu",
  "Doanh nghiệp ngừng tiếp nhận / điều chỉnh kế hoạch tuyển dụng",
  "Thông tin tiếp nhận chưa hợp lệ",
  "Lý do sức khỏe / cá nhân của sinh viên",
];

const MID_INTERNSHIP_STOP_REASONS = [
  "Doanh nghiệp bị tạm dừng hoạt động / không đảm bảo hướng dẫn",
  "Sinh viên tự ý nghỉ thực tập / vi phạm kỷ luật",
  "Sinh viên xin dừng thực tập vì lý do sức khỏe / bất khả kháng",
  "Thỏa thuận chấm dứt thực tập sớm giữa Sinh viên và Doanh nghiệp",
];

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
  align = "left",
  className = "",
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  searchable?: boolean;
  align?: "left" | "right";
  className?: string;
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
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="mb-1 block text-xs font-semibold text-slate-600">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs sm:text-sm text-slate-700 transition-all outline-none ${isOpen
          ? "border-[#00878a] ring-2 ring-[#00878a]/20 bg-white shadow-xs"
          : "hover:border-[#00878a]/40"
          }`}
      >
        <span
          className={`truncate ${value ? "font-semibold text-slate-900" : "text-slate-600"
            }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#00878a]" : "group-hover:text-slate-600"
            }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 z-50 min-w-full sm:min-w-[240px] max-w-[340px] max-h-72 overflow-hidden rounded-xl border border-slate-100 bg-white p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-slate-800 ${align === "right" ? "right-0 left-auto" : "left-0"
            }`}
        >
          {searchable && (
            <div className="mb-1 border-b border-slate-100 p-1">
              <div className="flex items-center gap-1.5 rounded-lg bg-[#f3f4f6] px-2.5 py-1.5 text-xs text-slate-700">
                <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
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
                    <React.Fragment key={opt.value + "-" + opt.label}>
                      {showGroup && (
                        <div className="mb-0.5 mt-1.5 rounded-md bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                        className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-left transition ${isSelected
                          ? "bg-teal-50 font-bold text-[#00878a]"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                      >
                        <span className="leading-snug">{opt.label}</span>
                        {isSelected && (
                          <Check className="ml-2 h-3.5 w-3.5 shrink-0 stroke-[2.5] text-[#00878a]" />
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

export const PlacementManagement: React.FC<{
  onOpenAssignment?: () => void;
}> = ({ onOpenAssignment }) => {
  const [items, setItems] = useState<PlacementRecord[]>([]);
  const [semesters, setSemesters] = useState<SemesterRecord[]>([]);
  const [lecturers, setLecturers] = useState<LecturerOption[]>([]);
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PlacementStatus | "">("");
  const [semesterId, setSemesterId] = useState("");
  const [lecturerId, setLecturerId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [majorId, setMajorId] = useState("");
  const [assignmentStatus, setAssignmentStatus] = useState<
    "" | "ASSIGNED" | "UNASSIGNED"
  >("");
  const [reportStatus, setReportStatus] = useState<ReportStatus | "">("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PlacementRecord | null>(null);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [action, setAction] = useState<"COMPLETED" | "CANCELLED" | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [placementPage, semesterPage, lecturerOptions] = await Promise.all([
        placementsApi.list({
          page,
          limit: 10,
          search: search.trim() || undefined,
          status: status || undefined,
          semesterId: semesterId || undefined,
          lecturerId: lecturerId || undefined,
          facultyId: facultyId || undefined,
          majorId: majorId || undefined,
          assignmentStatus: assignmentStatus || undefined,
          reportStatus: reportStatus || undefined,
        }),
        semestersApi.list({ page: 1, limit: 100 }),
        supervisionsApi.lecturerOptions(),
      ]);
      setItems(placementPage.items);
      setTotal(placementPage.pagination.total);
      setTotalPages(Math.max(placementPage.pagination.totalPages, 1));
      setSemesters(semesterPage.items);
      setLecturers(lecturerOptions);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [
    assignmentStatus,
    facultyId,
    lecturerId,
    majorId,
    page,
    reportStatus,
    search,
    semesterId,
    status,
  ]);

  useEffect(() => {
    facultiesApi
      .listOptions({ includeInactive: true })
      .then((res) => setFaculties(res.items))
      .catch(() => setFaculties([]));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 220);
    return () => window.clearTimeout(timer);
  }, [load]);
  const metrics = useMemo(
    () => ({
      pending: items.filter((item) => item.status === "PENDING").length,
      active: items.filter((item) => item.status === "ACTIVE").length,
      completed: items.filter((item) => item.status === "COMPLETED").length,
      cancelled: items.filter((item) => item.status === "CANCELLED").length,
    }),
    [items],
  );
  const openDetail = async (placement: PlacementRecord) => {
    setSelected(placement);
    setEditingSchedule(false);
    setAction(null);
    setNote("");
    try {
      setSelected(await placementsApi.findById(placement.id));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };
  const closeDetail = () => {
    if (!saving) {
      setSelected(null);
      setEditingSchedule(false);
      setAction(null);
    }
  };
  const startScheduleEdit = () => {
    if (!selected) return;
    setStartDate(isoDay(selected.startDate));
    setEndDate(isoDay(selected.endDate));
    setEditingSchedule(true);
  };
  const saveSchedule = async () => {
    if (!selected) return;
    if (!startDate || !endDate) {
      setError("Hãy nhập đủ ngày bắt đầu và ngày kết thúc theo dõi.");
      return;
    }
    if (startDate && endDate && startDate >= endDate) {
      setError("Ngày bắt đầu phải trước ngày kết thúc.");
      return;
    }
    const min = isoDay(selected.semester.startDate);
    const max = isoDay(selected.semester.endDate);
    if (
      (startDate && (startDate < min || startDate > max)) ||
      (endDate && (endDate < min || endDate > max))
    ) {
      setError(
        `Lịch phải nằm trong khung theo dõi ${formatDate(selected.semester.startDate)} – ${formatDate(selected.semester.endDate)}.`,
      );
      return;
    }
    setSaving(true);
    try {
      const updated = await placementsApi.update(selected.id, {
        startDate: new Date(`${startDate}T00:00:00.000Z`).toISOString(),
        endDate: new Date(`${endDate}T23:59:59.999Z`).toISOString(),
      });
      setSelected(updated);
      setEditingSchedule(false);
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };
  const submitStatus = async () => {
    if (!selected || !action) return;
    if (action === "CANCELLED" && !note.trim()) {
      setError("Cần nhập lý do hủy hồ sơ thực tập.");
      return;
    }
    setSaving(true);
    try {
      const updated = await placementsApi.updateStatus(
        selected.id,
        action,
        note.trim() || undefined,
      );
      setSelected(updated);
      setAction(null);
      setNote("");
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };
  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setSemesterId("");
    setLecturerId("");
    setFacultyId("");
    setMajorId("");
    setAssignmentStatus("");
    setReportStatus("");
    setPage(1);
  };

  const exportPlacementsExcel = async () => {
    try {
      const allPage = await placementsApi.list({
        page: 1,
        limit: 100,
        search: search.trim() || undefined,
        status: status || undefined,
        semesterId: semesterId || undefined,
        lecturerId: lecturerId || undefined,
        facultyId: facultyId || undefined,
        majorId: majorId || undefined,
        assignmentStatus: assignmentStatus || undefined,
        reportStatus: reportStatus || undefined,
      });
      downloadExcelWorkbook("danh-sach-ho-so-thuc-tap", [
        {
          name: "Ho so thuc tap",
          title: "DANH SÁCH HỒ SƠ THỰC TẬP TỐT NGHIỆP",
          subtitle: `Ngày xuất: ${new Date().toLocaleDateString("vi-VN")} — Tổng số bản ghi: ${allPage.items.length}`,
          columns: [
            { header: "STT", width: 45, value: (_, i) => i + 1 },
            { header: "MSSV", width: 105, value: (p: PlacementRecord) => p.student.studentCode },
            { header: "Họ và tên sinh viên", width: 165, value: (p: PlacementRecord) => p.student.fullName },
            { header: "Ngành đào tạo", width: 175, value: (p: PlacementRecord) => p.student.major },
            { header: "Khoa sinh viên", width: 170, value: (p: PlacementRecord) => p.student.faculty?.name ?? "—" },
            { header: "Doanh nghiệp thực tập", width: 190, value: (p: PlacementRecord) => p.company.companyName },
            { header: "Vị trí thực tập", width: 170, value: (p: PlacementRecord) => p.internship.title },
            { header: "Học kỳ", width: 140, value: (p: PlacementRecord) => p.semester.name },
            {
              header: "Giảng viên hướng dẫn",
              width: 165,
              value: (p: PlacementRecord) =>
                p.supervision?.status === "ACTIVE"
                  ? p.supervision.lecturer.fullName
                  : "Chưa phân công",
            },
            {
              header: "Khoa GVHD",
              width: 165,
              value: (p: PlacementRecord) =>
                p.supervision?.status === "ACTIVE"
                  ? (p.supervision.lecturer.faculty?.name ?? p.supervision.lecturer.department)
                  : "—",
            },
            { header: "Báo cáo đã nộp", width: 110, value: (p: PlacementRecord) => p.progress.reportCount },
            { header: "Số bản đánh giá", width: 110, value: (p: PlacementRecord) => p.progress.evaluationCount },
            { header: "Trạng thái", width: 135, value: (p: PlacementRecord) => getPlacementBadge(p).label },
          ],
          rows: allPage.items,
        },
      ]);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  const semesterOptions: DropdownOption[] = useMemo(
    () => [
      { value: "", label: "Tất cả kỳ thực tập" },
      ...semesters.map((s) => ({ value: s.id, label: s.name })),
    ],
    [semesters],
  );

  const statusOptions: DropdownOption[] = useMemo(
    () => [
      { value: "", label: "Tất cả trạng thái" },
      ...Object.entries(statusLabel).map(([key, label]) => ({
        value: key,
        label,
      })),
    ],
    [],
  );

  const facultyOptions: DropdownOption[] = useMemo(
    () => [
      { value: "", label: "Tất cả Khoa sinh viên" },
      ...faculties.map((f) => {
        const cleanName = formatFacultyName(f.name);
        return {
          value: f.id,
          label: `${f.code} — ${cleanName}`,
        };
      }),
    ],
    [faculties],
  );

  const majorOptions: DropdownOption[] = useMemo(() => {
    const result: DropdownOption[] = [
      { value: "", label: "Tất cả Ngành đào tạo" },
    ];
    const targetFaculties = facultyId
      ? faculties.filter((f) => f.id === facultyId)
      : faculties;

    targetFaculties.forEach((f) => {
      const cleanFacultyName = formatFacultyName(f.name);

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

  const lecturerOptions: DropdownOption[] = useMemo(
    () => [
      { value: "", label: "Tất cả giảng viên" },
      ...lecturers.map((l) => ({
        value: l.id,
        label: l.fullName,
        group: l.faculty
          ? l.faculty.name.trim().toLowerCase().startsWith("khoa")
            ? l.faculty.name.trim()
            : `Khoa ${l.faculty.name.trim()}`
          : l.department || undefined,
      })),
    ],
    [lecturers],
  );

  const assignmentStatusOptions: DropdownOption[] = useMemo(
    () => [
      { value: "", label: "Mọi trạng thái phân công" },
      { value: "ASSIGNED", label: "Đã phân công" },
      { value: "UNASSIGNED", label: "Chưa phân công" },
    ],
    [],
  );

  const reportStatusOptions: DropdownOption[] = useMemo(
    () => [
      { value: "", label: "Mọi trạng thái báo cáo" },
      ...Object.entries(reportLabel).map(([key, label]) => ({
        value: key,
        label,
      })),
    ],
    [],
  );

  return (
    <section className="admin-page space-y-4">
      <header className="relative rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cbebeb] bg-[#e6f6f6] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#00878a]">
                <BriefcaseBusiness className="h-3 w-3" /> Theo dõi hồ sơ thực tập
              </span>
              {loading && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#00878a]">
                  <LoaderCircle className="h-3 w-3 animate-spin" /> Đang đồng bộ...
                </span>
              )}
            </div>
            <h1 className="mt-1.5 text-2xl font-black tracking-tight text-[#006f72] sm:text-[26px]">
              Quản lý hồ sơ thực tập
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Theo dõi lịch học vụ, tiến độ báo cáo và vòng đời của từng hồ sơ thực tập.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void exportPlacementsExcel()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-[#00878a]/40 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" /> Xuất danh sách Excel
            </button>
            <button
              type="button"
              onClick={onOpenAssignment}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#00878a] px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-[#00878a]/20 transition hover:bg-[#007477] active:scale-[0.98]"
            >
              <UsersRound className="h-3.5 w-3.5" /> Mở phân công giảng viên{" "}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          {
            label: "Tổng hồ sơ thực tập",
            value: total,
            tone: "bg-[#e6f6f6] text-[#00878a]",
          },
          {
            label: "Chờ phân công",
            value: metrics.pending,
            tone: "bg-amber-50 text-amber-700",
          },
          {
            label: "Đang thực tập",
            value: metrics.active,
            tone: "bg-[#e6f6f6] text-[#00878a]",
          },
          {
            label: "Hoàn tất",
            value: metrics.completed,
            tone: "bg-slate-100 text-slate-700",
          },
          {
            label: "Đã hủy",
            value: metrics.cancelled,
            tone: "bg-[#fff0f2] text-[#da1c2d]",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-200"
          >
            <span
              className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-bold ${item.tone}`}
            >
              {item.label}
            </span>
            <p className="mt-3 text-2xl font-bold tracking-tight text-slate-800">
              {item.value}
            </p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)] sm:p-5 space-y-3">
        {/* Row 1: Search + Semester + Status + Reset Button */}
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm sinh viên, mã số, công ty hoặc vị trí..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#00878a] focus:ring-1 focus:ring-[#00878a]/20 sm:text-sm"
            />
          </div>

          <CustomDropdown
            value={semesterId}
            onChange={(val) => {
              setSemesterId(val);
              setPage(1);
            }}
            options={semesterOptions}
            className="w-full shrink-0 sm:w-[200px] lg:w-[220px]"
          />

          <CustomDropdown
            value={status}
            onChange={(val) => {
              setStatus(val as PlacementStatus | "");
              setPage(1);
            }}
            options={statusOptions}
            className="w-full shrink-0 sm:w-[160px] lg:w-[180px]"
          />

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex cursor-pointer shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#cbebeb] bg-[#e6f6f6] px-4 py-2 text-xs font-semibold text-[#00878a] transition hover:bg-[#d5eeee] active:scale-[0.98] sm:text-sm"
            title="Đặt lại tất cả bộ lọc"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Row 2: 5 Filter Dropdowns flat & neat */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          <CustomDropdown
            value={facultyId}
            onChange={(val) => {
              setFacultyId(val);
              setMajorId("");
              setPage(1);
            }}
            options={facultyOptions}
            searchable
          />

          <CustomDropdown
            value={majorId}
            onChange={(val) => {
              setMajorId(val);
              setPage(1);
            }}
            options={majorOptions}
            searchable
          />

          <CustomDropdown
            value={lecturerId}
            onChange={(val) => {
              setLecturerId(val);
              setPage(1);
            }}
            options={lecturerOptions}
            searchable
          />

          <CustomDropdown
            value={assignmentStatus}
            onChange={(val) => {
              setAssignmentStatus(val as typeof assignmentStatus);
              setPage(1);
            }}
            options={assignmentStatusOptions}
          />

          <CustomDropdown
            value={reportStatus}
            onChange={(val) => {
              setReportStatus(val as ReportStatus | "");
              setPage(1);
            }}
            options={reportStatusOptions}
            align="right"
          />
        </div>
      </div>
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed min-w-[1150px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="w-[22%] px-3.5 py-3">Sinh viên</th>
                  <th className="w-[28%] px-3.5 py-3">Vị trí &amp; Doanh nghiệp</th>
                  <th className="w-[16%] px-3.5 py-3">Học kỳ &amp; Lịch</th>
                  <th className="w-[16%] px-3.5 py-3">Giảng viên hướng dẫn</th>
                  <th className="w-[8%] px-2 py-3 text-center">Tiến độ</th>
                  <th className="w-[10%] px-3.5 py-3 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((skeletonId) => (
                  <tr key={skeletonId} className="border-b border-slate-100">
                    <td className="px-3.5 py-3">
                      <div className="mb-1.5 h-3.5 w-32 animate-pulse rounded bg-slate-200"></div>
                      <div className="h-3 w-24 animate-pulse rounded bg-slate-100"></div>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="mb-1.5 h-3.5 w-36 animate-pulse rounded bg-slate-200"></div>
                      <div className="h-3 w-28 animate-pulse rounded bg-slate-100"></div>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="mb-1.5 h-3.5 w-24 animate-pulse rounded bg-slate-200"></div>
                      <div className="h-3 w-28 animate-pulse rounded bg-slate-100"></div>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="h-5 w-24 animate-pulse rounded-full bg-slate-200"></div>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <div className="mx-auto h-5 w-14 animate-pulse rounded-md bg-slate-200"></div>
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <div className="ml-auto inline-block h-6 w-20 animate-pulse rounded-full bg-slate-200"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <BriefcaseBusiness className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-800">
              Không có hồ sơ thực tập phù hợp
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Thử điều chỉnh bộ lọc hoặc chờ ứng viên được chấp nhận.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed min-w-[1150px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="w-[22%] px-3.5 py-3">Sinh viên</th>
                  <th className="w-[28%] px-3.5 py-3">Vị trí &amp; Doanh nghiệp</th>
                  <th className="w-[16%] px-3.5 py-3">Học kỳ &amp; Lịch</th>
                  <th className="w-[16%] px-3.5 py-3">Giảng viên hướng dẫn</th>
                  <th className="w-[8%] px-2 py-3 text-center">Tiến độ</th>
                  <th className="w-[10%] px-3.5 py-3 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((placement) => (
                  <tr
                    key={placement.id}
                    onClick={() => void openDetail(placement)}
                    className="group cursor-pointer transition hover:bg-slate-50/80 min-h-[70px]"
                  >
                    {/* Sinh viên */}
                    <td className="px-3.5 py-2.5 align-middle">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ProfileAvatarPreview
                          fileId={placement.student.avatarFileId}
                          fallback={placement.student.fullName.charAt(0)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#e6f6f6] text-xs font-bold text-[#00878a]"
                          imageClassName="h-full w-full object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-slate-900 group-hover:text-[#00878a] transition-colors" title={placement.student.fullName}>
                            {placement.student.fullName}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500">
                            <span className="font-mono font-semibold text-slate-700">{placement.student.studentCode}</span>
                            {" "}•{" "}
                            <span>{placement.student.major}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Vị trí & Doanh nghiệp */}
                    <td className="px-3.5 py-2.5 align-middle">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-xs font-bold text-slate-800 leading-snug break-words" title={placement.internship.title}>
                          {placement.internship.title}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 truncate" title={placement.company.companyName}>
                          <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
                          <span className="truncate">{placement.company.companyName}</span>
                        </p>
                      </div>
                    </td>

                    {/* Học kỳ & Lịch */}
                    <td className="px-3.5 py-2.5 align-middle whitespace-nowrap">
                      <p className="truncate text-xs font-semibold text-slate-700" title={placement.semester.name}>
                        {cleanSemesterName(placement.semester.name)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {formatDate(placement.startDate)} — {formatDate(placement.endDate)}
                      </p>
                    </td>

                    {/* Giảng viên hướng dẫn */}
                    <td className="px-3.5 py-2.5 align-middle whitespace-nowrap">
                      {placement.supervision && placement.supervision.status !== "CANCELLED" ? (
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-xs font-bold text-slate-800">
                              {placement.supervision.lecturer.fullName}
                            </p>
                            {placement.student.faculty?.id &&
                              placement.supervision.lecturer.facultyId &&
                              placement.student.faculty.id !== placement.supervision.lecturer.facultyId && (
                                <span className="shrink-0 rounded-md border border-[#cbebeb] bg-[#e6f6f6] px-1 py-0.5 text-[9px] font-bold text-[#00878a]">
                                  Liên khoa
                                </span>
                              )}
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500">
                            {formatFacultyName(placement.supervision.lecturer.faculty?.name) || placement.supervision.lecturer.department}
                          </p>
                        </div>
                      ) : onOpenAssignment ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenAssignment();
                          }}
                          className="inline-flex cursor-pointer items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 transition hover:bg-amber-100"
                          title="Nhấp để chuyển đến trang Phân công giảng viên"
                        >
                          Chưa phân công
                        </button>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          Chưa phân công
                        </span>
                      )}
                    </td>

                    {/* Tiến độ */}
                    <td className="px-2 py-2.5 align-middle text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center">
                        <span
                          title="Báo cáo đã duyệt / tổng báo cáo đã nộp"
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700"
                        >
                          <FileText className="h-3 w-3 text-slate-400" />
                          <span>{placement.progress.approvedReports ?? 0}/{placement.progress.reportCount}</span>
                        </span>
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="px-3.5 py-2.5 text-right align-middle whitespace-nowrap">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getPlacementBadge(placement).className}`}
                      >
                        {getPlacementBadge(placement).label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-600">
            <span className="font-medium text-slate-500">
              Tổng: <strong className="text-slate-700">{total}</strong> hồ sơ
              thực tập
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((value) => value - 1)}
                className="rounded-lg border border-slate-200 p-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>
                Trang {page}/{totalPages}
              </span>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((value) => value + 1)}
                className="rounded-lg border border-slate-200 p-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      {selected && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            onClick={closeDetail}
          >
          <div
            className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl sm:max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
              <div className="flex min-w-0 items-center gap-3.5">
                <ProfileAvatarPreview
                  fileId={selected.student.avatarFileId}
                  fallback={selected.student.fullName.charAt(0)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#e6f6f6] text-base font-bold text-[#00878a] shadow-2xs"
                  imageClassName="h-full w-full object-cover"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-base font-black text-slate-900 sm:text-lg">
                      {selected.student.fullName}
                    </h2>
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${getPlacementBadge(selected).className}`}
                    >
                      {getPlacementBadge(selected).label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-slate-700">{selected.student.studentCode}</span>
                    {" "}•{" "}
                    <span>{selected.student.major}</span>
                    {selected.student.faculty?.name ? (
                      <>
                        {" "}•{" "}
                        <span>{formatFacultyName(selected.student.faculty.name)}</span>
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="cursor-pointer rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {/* Notice if cancelled or completed with note */}
              {selected.status === "CANCELLED" && (
                <div className="mb-3.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-900">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-rose-800">Hồ sơ thực tập đã bị hủy</p>
                    <span className="text-[11px] font-medium text-rose-600">
                      {formatDateTime(selected.progress.statusChangedAt ?? selected.academicClosedAt ?? selected.updatedAt)}
                    </span>
                  </div>
                  <p className="mt-1 leading-relaxed text-rose-700">
                    <span className="font-semibold">Lý do:</span> {selected.progress.statusNote || "Không có ghi chú lý do hủy."}
                  </p>
                </div>
              )}

              {selected.status === "COMPLETED" && selected.progress.statusNote && (
                <div className="mb-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-emerald-800">Đã hoàn tất thực tập</p>
                    {selected.progress.statusChangedAt && (
                      <span className="text-[11px] font-medium text-emerald-600">
                        {formatDateTime(selected.progress.statusChangedAt)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 leading-relaxed text-emerald-700">
                    <span className="font-semibold">Ghi chú:</span> {selected.progress.statusNote}
                  </p>
                </div>
              )}

              {/* 2 Symmetrical Columns: Left (Internship details) | Right (Progress & Scores) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Column 1: Thông tin thực tập */}
                <div className="space-y-3">
                  {/* Vị trí & Doanh nghiệp */}
                  <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#00878a]">
                      Vị trí &amp; Doanh nghiệp
                    </span>
                    <h3 className="mt-1 text-sm font-bold text-slate-900">
                      {selected.internship.title}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Building2 className="h-3.5 w-3.5 text-[#00878a] shrink-0" />
                      {selected.company.companyName}
                    </p>
                    {selected.internship.location && (
                      <p className="mt-1 flex items-start gap-1 text-[11px] text-slate-500 leading-relaxed">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                        <span>{selected.internship.location}</span>
                      </p>
                    )}
                  </div>

                  {/* Khung thời gian thực tập */}
                  <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#00878a]">
                        Khung thời gian thực tập
                      </span>
                      {selected.academicStatus === "PENDING" && !editingSchedule ? (
                        <button
                          type="button"
                          onClick={startScheduleEdit}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#cbebeb] bg-[#e6f6f6] px-2 py-0.5 text-[11px] font-bold text-[#00878a] transition hover:bg-[#d5eeee]"
                        >
                          <Pencil className="h-3 w-3" /> Chỉnh lịch
                        </button>
                      ) : null}
                    </div>

                    {editingSchedule ? (
                      <div className="mt-2.5 space-y-2 border-t border-slate-100 pt-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <label className="text-[11px] font-semibold text-slate-600">
                            Bắt đầu
                            <input
                              type="date"
                              value={startDate}
                              onChange={(event) => setStartDate(event.target.value)}
                              min={isoDay(selected.semester.startDate)}
                              max={isoDay(selected.semester.endDate)}
                              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none focus:border-[#00878a]"
                            />
                          </label>
                          <label className="text-[11px] font-semibold text-slate-600">
                            Kết thúc
                            <input
                              type="date"
                              value={endDate}
                              onChange={(event) => setEndDate(event.target.value)}
                              min={isoDay(selected.semester.startDate)}
                              max={isoDay(selected.semester.endDate)}
                              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none focus:border-[#00878a]"
                            />
                          </label>
                        </div>
                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => setEditingSchedule(false)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 cursor-pointer"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void saveSchedule()}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#00878a] px-3 py-1 text-xs font-bold text-white shadow-2xs transition hover:bg-[#007477] disabled:opacity-50"
                          >
                            {saving && <LoaderCircle className="h-3 w-3 animate-spin" />} Lưu
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 space-y-1">
                        <p className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <CalendarDays className="h-3.5 w-3.5 text-[#00878a] shrink-0" />
                          {selected.startDate && selected.endDate
                            ? `${formatDate(selected.startDate)} — ${formatDate(selected.endDate)}`
                            : "Chưa đặt lịch thực tập"}
                        </p>
                        <p className="text-[11px] text-slate-500 pl-5">
                          {cleanSemesterName(selected.semester.name)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Giảng viên hướng dẫn: Nhấp trực tiếp để chuyển sang phân công, không rườm rà */}
                  <div
                    onClick={onOpenAssignment ? () => { closeDetail(); onOpenAssignment(); } : undefined}
                    className={`rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs transition ${
                      onOpenAssignment ? "cursor-pointer hover:border-[#00878a]/50 hover:bg-[#e6f6f6]/20" : ""
                    }`}
                    title={onOpenAssignment ? "Nhấp để chuyển đến trang Phân công giảng viên" : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#00878a]">
                        Giảng viên hướng dẫn
                      </span>
                      {selected.supervision && selected.supervision.status !== "CANCELLED" ? (
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          {selected.supervision.status === "COMPLETED" ? "Đã hoàn tất" : "Đã phân công"}
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          Chưa phân công
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {selected.supervision && selected.supervision.status !== "CANCELLED"
                        ? selected.supervision.lecturer.fullName
                        : "Chưa chỉ định giảng viên"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {selected.supervision && selected.supervision.status !== "CANCELLED"
                        ? (formatFacultyName(selected.supervision.lecturer.faculty?.name) || selected.supervision.lecturer.department)
                        : "Chưa có người hướng dẫn"}
                    </p>
                  </div>
                </div>

                {/* Column 2: Tiến độ & Điểm số */}
                <div className="space-y-3">
                  {/* Tiến độ báo cáo */}
                  <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#00878a]">
                        Tiến độ báo cáo
                      </span>
                      {selected.progress.lastReportAt && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock3 className="h-3 w-3" /> Cập nhật {formatDate(selected.progress.lastReportAt)}
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-slate-50 p-2.5 text-center">
                        <p className="text-[10px] font-medium text-slate-500">Báo cáo định kỳ</p>
                        <p className="mt-0.5 text-base font-bold text-slate-900">
                          {selected.progress.approvedReports ?? 0}
                          <span className="text-xs font-normal text-slate-400">/{selected.progress.reportCount}</span>
                        </p>
                        <p className="text-[10px] text-slate-400">Đã duyệt</p>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-2.5 text-center">
                        <p className="text-[10px] font-medium text-slate-500">Báo cáo tổng kết</p>
                        <p className={`mt-0.5 text-xs font-bold leading-6 ${selected.progress.finalReportStatus ? "text-emerald-700" : "text-slate-400"}`}>
                          {selected.progress.finalReportStatus ? reportLabel[selected.progress.finalReportStatus] : "Chưa nộp"}
                        </p>
                        <p className="text-[10px] text-slate-400">Trạng thái</p>
                      </div>
                    </div>

                    {selected.progress.reportsAwaitingReview > 0 && (
                      <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <span>Có <strong>{selected.progress.reportsAwaitingReview}</strong> báo cáo đang chờ GVHD duyệt</span>
                      </div>
                    )}
                  </div>

                  {/* Điểm đánh giá thực tập */}
                  <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#00878a]">
                      Điểm đánh giá thực tập
                    </span>

                    <div className="mt-2.5 grid grid-cols-2 gap-2 text-center">
                      <div className="rounded-lg bg-slate-50 p-2.5">
                        <p className="text-[10px] font-medium text-slate-500">Doanh nghiệp (50%)</p>
                        <p className={`mt-0.5 text-sm font-bold ${selected.progress.companyScore !== null && selected.progress.companyScore !== undefined ? "text-[#00878a]" : "text-slate-400 text-xs"}`}>
                          {selected.progress.companyScore !== null && selected.progress.companyScore !== undefined ? `${selected.progress.companyScore} / 10` : "Chưa chấm"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2.5">
                        <p className="text-[10px] font-medium text-slate-500">Giảng viên (50%)</p>
                        <p className={`mt-0.5 text-sm font-bold ${selected.progress.lecturerScore !== null && selected.progress.lecturerScore !== undefined ? "text-[#00878a]" : "text-slate-400 text-xs"}`}>
                          {selected.progress.lecturerScore !== null && selected.progress.lecturerScore !== undefined ? `${selected.progress.lecturerScore} / 10` : "Chưa chấm"}
                        </p>
                      </div>
                    </div>

                    {selected.progress.finalScore !== null && selected.progress.finalScore !== undefined ? (
                      <div className="mt-2 flex items-center justify-between rounded-lg border border-[#cbebeb] bg-[#e6f6f6] px-3 py-1.5 text-xs">
                        <span className="font-bold text-[#006f72]">Điểm tổng kết:</span>
                        <span className="text-sm font-black text-[#00878a]">
                          {selected.progress.finalScore.toFixed(2)} / 10
                        </span>
                      </div>
                    ) : (
                      <p className="mt-2 text-center text-[10px] text-slate-400">
                        Tự động tổng hợp khi cả 2 bên hoàn tất chấm điểm
                      </p>
                    )}
                  </div>

                  {/* Hướng dẫn hoàn tất */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-[11px] text-slate-500 leading-relaxed">
                    Hồ sơ sẽ tự động chuyển sang <strong className="text-slate-700">Đã hoàn tất</strong> khi có báo cáo được giảng viên duyệt và đủ điểm từ Doanh nghiệp &amp; Giảng viên.
                  </div>
                </div>
              </div>
            </div>

            {/* Action Confirmation Panel */}
            {action && (
              <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
                <p className="text-sm font-bold text-slate-900">
                  {action === "COMPLETED"
                    ? "Xác nhận nghiệm thu & hoàn tất thực tập"
                    : isMidInternship(selected)
                      ? "Xác nhận dừng thực tập giữa kỳ"
                      : "Xác nhận hủy hồ sơ thực tập"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {action === "COMPLETED"
                    ? "Xác nhận sinh viên đã hoàn thành kỳ thực tập tại doanh nghiệp và đủ điều kiện nghiệm thu."
                    : isMidInternship(selected)
                      ? "Sinh viên đang trong kỳ thực tập. Việc dừng hồ sơ chỉ áp dụng khi doanh nghiệp bị tạm dừng, sinh viên tự ý bỏ thực tập hoặc sự cố bất khả kháng."
                      : "Hồ sơ chưa bắt đầu kỳ thực tập. Sau khi hủy, suất tuyển dụng sẽ được hoàn lại cho doanh nghiệp."}
                </p>

                {action === "CANCELLED" && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {(isMidInternship(selected)
                      ? MID_INTERNSHIP_STOP_REASONS
                      : PRE_START_CANCEL_REASONS
                    ).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setNote(preset)}
                        className={`rounded-lg border px-2 py-0.5 text-[10px] font-medium transition cursor-pointer ${
                          note === preset
                            ? "border-rose-300 bg-rose-100 text-rose-800"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder={
                    action === "CANCELLED"
                      ? isMidInternship(selected)
                        ? "Nhập hoặc chọn lý do dừng thực tập giữa kỳ (bắt buộc)..."
                        : "Nhập hoặc chọn lý do hủy hồ sơ thực tập (bắt buộc)..."
                      : "Ghi chú nghiệm thu (không bắt buộc)..."
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs outline-none focus:border-[#00878a]"
                />
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {note.length}/500
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setAction(null)}
                      className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Quay lại
                    </button>
                    <button
                      type="button"
                      disabled={saving || (action === "CANCELLED" && !note.trim())}
                      onClick={() => void submitStatus()}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-50 ${
                        action === "COMPLETED"
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "bg-rose-600 hover:bg-rose-700"
                      }`}
                    >
                      {saving && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
                      {action === "COMPLETED"
                        ? "Xác nhận hoàn tất"
                        : isMidInternship(selected)
                          ? "Xác nhận dừng thực tập"
                          : "Xác nhận hủy hồ sơ"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            {!action && (
              <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-3">
                <div>
                  {(selected.status === "PENDING" || selected.status === "ACTIVE") && (
                    hasFinalReportOrEvaluations(selected) ? (
                      <span className="text-xs text-slate-400">
                        Đã có báo cáo tổng kết / điểm (Không thể hủy)
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAction("CANCELLED");
                          setNote("");
                        }}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        {isMidInternship(selected) ? "Dừng thực tập giữa kỳ" : "Hủy hồ sơ"}
                      </button>
                    )
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeDetail}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </ModalPortal>
      )}
    </section>
  );
};
