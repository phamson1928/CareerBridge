import React, { useEffect, useMemo, useRef, useState } from "react";
import { ModalPortal } from "../ModalPortal";
import {
  AlertCircle,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LoaderCircle,
  RotateCcw,
  Search,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { useAppFeedback } from "../Feedback/AppFeedbackProvider";
import { ProfileAvatarPreview } from "../ProfileAvatarUpload";
import { placementsApi } from "../../placements/api";
import type {
  PlacementRecord,
  PlacementStatus,
} from "../../placements/types";
import { supervisionsApi } from "../../supervisions/api";
import type { LecturerOption } from "../../supervisions/types";
import { facultiesApi } from "../../organization/api";
import type { FacultyOption } from "../../organization/types";
import { formatDate } from "../../utils/format";

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
  if (placement.status === "ACTIVE" && !hasInternshipStartedOrProgress(placement)) {
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
  dropUp = false,
  className = "",
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  searchable?: boolean;
  align?: "left" | "right";
  dropUp?: boolean;
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
    <div className={`relative ${className} ${isOpen ? "z-40" : ""}`} ref={containerRef}>
      {label && (
        <label className="mb-1 block text-xs font-semibold text-slate-600">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full cursor-pointer items-center justify-between rounded-xl border bg-white px-3 py-2 text-xs font-medium text-slate-800 transition ${
          isOpen
            ? "border-[#00878a] ring-1 ring-[#00878a]/20"
            : "border-slate-200 hover:border-[#00878a]"
        } sm:text-sm`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`ml-1.5 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#00878a]" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 ${
            dropUp ? "bottom-full mb-1.5" : "mt-1"
          } max-h-60 min-w-[200px] w-full overflow-auto rounded-xl border border-slate-100 bg-white p-1 shadow-2xl ring-1 ring-black/5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {searchable && (
            <div className="sticky top-0 z-10 bg-white p-1">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm nhanh..."
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#00878a]"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div className="py-0.5">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-center text-xs text-slate-400">
                Không tìm thấy
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value + (opt.group || "")}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                      isSelected
                        ? "bg-[#e6f6f6] font-bold text-[#00878a]"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate">{opt.label}</p>
                      {opt.group && (
                        <p className="truncate text-[10px] text-slate-400">
                          {opt.group}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-[#00878a]" />
                    )}
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

function LecturerPicker({
  value,
  onChange,
  lecturers,
  studentFacultyId,
  dropUp = false,
}: {
  value: string;
  onChange: (id: string) => void;
  lecturers: LecturerOption[];
  studentFacultyId: string | null;
  dropUp?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const selected = useMemo(
    () => lecturers.find((l) => l.id === value),
    [lecturers, value],
  );

  const sortedLecturers = useMemo(() => {
    return [...lecturers].sort((a, b) => {
      const aSame = studentFacultyId && a.facultyId === studentFacultyId ? 1 : 0;
      const bSame = studentFacultyId && b.facultyId === studentFacultyId ? 1 : 0;
      if (aSame !== bSame) return bSame - aSame;
      return a.activeSupervisionCount - b.activeSupervisionCount;
    });
  }, [lecturers, studentFacultyId]);

  const filteredLecturers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return sortedLecturers;
    return sortedLecturers.filter((l) => {
      const facultyName = l.faculty?.name || l.department || "";
      return (
        l.fullName.toLowerCase().includes(q) ||
        facultyName.toLowerCase().includes(q)
      );
    });
  }, [sortedLecturers, search]);

  return (
    <div className={`relative ${isOpen ? "z-40" : ""}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full cursor-pointer items-center justify-between rounded-xl border bg-white px-3.5 py-2.5 text-xs text-slate-800 transition ${
          isOpen
            ? "border-[#00878a] ring-2 ring-[#00878a]/20"
            : "border-slate-300 hover:border-[#00878a]"
        } sm:text-sm`}
      >
        {selected ? (
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-slate-900">{selected.fullName}</span>
            <span className="text-xs text-slate-500 truncate">
              ({formatFacultyName(selected.faculty?.name) || selected.department})
            </span>
            <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
              {selected.activeSupervisionCount} SV
            </span>
          </div>
        ) : (
          <span className="text-slate-400">Chọn giảng viên hướng dẫn...</span>
        )}
        <ChevronDown
          className={`ml-1.5 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#00878a]" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 ${
            dropUp ? "bottom-full mb-1.5" : "mt-1"
          } max-h-56 w-full flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xl ring-1 ring-black/5`}
        >
          <div className="shrink-0 border-b border-slate-100 bg-slate-50/70 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên giảng viên, khoa hoặc bộ môn..."
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#00878a]"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="max-h-[162px] overflow-y-auto p-1 divide-y divide-slate-50 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {filteredLecturers.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Không tìm thấy giảng viên phù hợp
              </div>
            ) : (
              filteredLecturers.map((lecturer) => {
                const isSelected = lecturer.id === value;
                const isSameFaculty = studentFacultyId && lecturer.facultyId === studentFacultyId;
                return (
                  <button
                    key={lecturer.id}
                    type="button"
                    onClick={() => {
                      onChange(lecturer.id);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left transition ${
                      isSelected
                        ? "bg-[#e6f6f6] text-[#00878a]"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-xs ${isSelected ? "font-bold text-[#00878a]" : "font-semibold text-slate-800"}`}>
                          {lecturer.fullName}
                        </p>
                        {isSameFaculty ? (
                          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                            Cùng Khoa
                          </span>
                        ) : (
                          <span className="rounded-md border border-[#cbebeb] bg-[#e6f6f6] px-1.5 py-0.5 text-[9px] font-bold text-[#00878a]">
                            Liên khoa
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {formatFacultyName(lecturer.faculty?.name) || lecturer.department}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                        {lecturer.activeSupervisionCount} SV
                      </span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-[#00878a]" />
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

export const SupervisionManagement: React.FC = () => {
  const { confirm } = useAppFeedback();
  const [items, setItems] = useState<PlacementRecord[]>([]);
  const [lecturers, setLecturers] = useState<LecturerOption[]>([]);
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PlacementStatus | "">("");
  const [assignment, setAssignment] = useState<
    "ALL" | "ASSIGNED" | "UNASSIGNED"
  >("ALL");
  const [facultyId, setFacultyId] = useState("");
  const [majorId, setMajorId] = useState("");
  const [modalLecturerFacultyFilter, setModalLecturerFacultyFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalPlacement, setModalPlacement] = useState<PlacementRecord | null>(
    null,
  );
  const [selectedLecturer, setSelectedLecturer] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [placementPage, lecturerOptions] = await Promise.all([
        placementsApi.list({
          page,
          limit: 10,
          search: search.trim() || undefined,
          status: status || undefined,
          assignmentStatus: assignment === "ALL" ? undefined : assignment,
          facultyId: facultyId || undefined,
          majorId: majorId || undefined,
        }),
        supervisionsApi.lecturerOptions(),
      ]);
      setItems(placementPage.items);
      setTotal(placementPage.pagination.total);
      setTotalPages(Math.max(placementPage.pagination.totalPages, 1));
      setLecturers(lecturerOptions);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    facultiesApi
      .listOptions({ includeInactive: true })
      .then((res) => setFaculties(res.items))
      .catch(() => setFaculties([]));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [page, search, status, assignment, facultyId, majorId]);

  const metrics = useMemo(
    () => ({
      pending: items.filter((item) => item.status === "PENDING").length,
      active: items.filter(
        (item) =>
          item.status === "ACTIVE" && hasInternshipStartedOrProgress(item),
      ).length,
    }),
    [items],
  );

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setAssignment("ALL");
    setFacultyId("");
    setMajorId("");
    setPage(1);
  };

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

  const assignmentOptions: DropdownOption[] = useMemo(
    () => [
      { value: "ALL", label: "Tất cả phân công" },
      { value: "ASSIGNED", label: "Đã phân công" },
      { value: "UNASSIGNED", label: "Chưa phân công" },
    ],
    [],
  );

  const facultyOptions: DropdownOption[] = useMemo(
    () => [
      { value: "", label: "Tất cả Khoa sinh viên" },
      ...faculties.map((f) => ({
        value: f.id,
        label: formatFacultyName(f.name) || `${f.code} — ${f.name}`,
      })),
    ],
    [faculties],
  );

  const majorOptions: DropdownOption[] = useMemo(() => {
    const relevantFaculties = facultyId
      ? faculties.filter((f) => f.id === facultyId)
      : faculties;
    const list: DropdownOption[] = [{ value: "", label: "Tất cả Ngành đào tạo" }];
    relevantFaculties.forEach((f) => {
      f.majors.forEach((m) => {
        list.push({
          value: m.id,
          label: m.name,
          group: formatFacultyName(f.name) || f.name,
        });
      });
    });
    return list;
  }, [faculties, facultyId]);

  const openAssign = (placement: PlacementRecord) => {
    setModalPlacement(placement);
    setSelectedLecturer(placement.supervision?.lecturerId ?? "");
    setModalLecturerFacultyFilter("");
  };

  const closeModal = () => {
    if (!saving) {
      setModalPlacement(null);
      setSelectedLecturer("");
      setModalLecturerFacultyFilter("");
    }
  };

  const modalFacultyOptions: DropdownOption[] = useMemo(
    () => [
      { value: "", label: "Tất cả giảng viên toàn trường (Hỗ trợ liên khoa)" },
      ...faculties.map((f) => ({
        value: f.id,
        label: `${formatFacultyName(f.name)} (${f.code})`,
      })),
    ],
    [faculties],
  );

  const visibleLecturers = useMemo(() => {
    if (modalLecturerFacultyFilter) {
      return lecturers.filter((l) => l.facultyId === modalLecturerFacultyFilter);
    }
    return lecturers;
  }, [lecturers, modalLecturerFacultyFilter]);

  const saveAssignment = async () => {
    if (!modalPlacement || !selectedLecturer) return;
    setSaving(true);
    try {
      if (modalPlacement.supervision)
        await supervisionsApi.reassign(
          modalPlacement.supervision.id,
          selectedLecturer,
        );
      else await supervisionsApi.assign(modalPlacement.id, selectedLecturer);
      closeModal();
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const cancelSupervision = async (placement: PlacementRecord) => {
    if (!placement.supervision) return;
    const accepted = await confirm({
      title: "Bỏ phân công",
      message: `Bỏ phân công cho ${placement.student.fullName}?`,
      confirmLabel: "Bỏ phân công",
      tone: "danger",
    });
    if (!accepted) return;
    try {
      await supervisionsApi.cancel(placement.supervision.id);
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  return (
    <section className="admin-page space-y-4">
      {/* Header */}
      <header className="relative rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cbebeb] bg-[#e6f6f6] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#00878a]">
                <ShieldCheck className="h-3 w-3" /> Quản lý phân công hướng dẫn
              </span>
              {loading && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#00878a]">
                  <LoaderCircle className="h-3 w-3 animate-spin" /> Đang tải...
                </span>
              )}
            </div>
            <h1 className="mt-1.5 text-2xl font-black tracking-tight text-[#006f72] sm:text-[26px]">
              Phân công giảng viên
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Quản lý hồ sơ thực tập đã được xác nhận, phân công người hướng dẫn và theo dõi lịch sử phân công.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700">
            <UsersRound className="h-4 w-4 text-[#00878a]" />
            <span>{lecturers.length} giảng viên đang hoạt động</span>
          </div>
        </div>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

      {/* Filter Toolbar: Gọn gàng, liền mạch không chia hộp */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)] sm:p-5 space-y-3">
        {/* Row 1: Search + Reset */}
        <div className="flex items-center gap-2.5">
          <div className="relative min-w-0 flex-1">
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

        {/* Row 2: 4 Filter Dropdowns side by side */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
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
            value={status}
            onChange={(val) => {
              setStatus(val as PlacementStatus | "");
              setPage(1);
            }}
            options={statusOptions}
          />

          <CustomDropdown
            value={assignment}
            onChange={(val) => {
              setAssignment(val as typeof assignment);
              setPage(1);
            }}
            options={assignmentOptions}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed min-w-[1180px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="w-[20%] px-3.5 py-3">Sinh viên</th>
                  <th className="w-[25%] px-3.5 py-3">Vị trí &amp; Doanh nghiệp</th>
                  <th className="w-[15%] px-3.5 py-3">Học kỳ &amp; Lịch</th>
                  <th className="w-[18%] px-3.5 py-3">Giảng viên hướng dẫn</th>
                  <th className="w-[10%] px-2 py-3 text-center">Trạng thái</th>
                  <th className="w-[12%] px-3.5 py-3 text-right">Thao tác</th>
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
                    <td className="px-3.5 py-3 text-center">
                      <div className="mx-auto h-6 w-20 animate-pulse rounded-full bg-slate-200"></div>
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <div className="ml-auto inline-block h-6 w-16 animate-pulse rounded-lg bg-slate-200"></div>
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
              Thử điều chỉnh bộ lọc để xem các hồ sơ khác.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed min-w-[1180px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="w-[20%] px-3.5 py-3">Sinh viên</th>
                  <th className="w-[25%] px-3.5 py-3">Vị trí &amp; Doanh nghiệp</th>
                  <th className="w-[15%] px-3.5 py-3">Học kỳ &amp; Lịch</th>
                  <th className="w-[18%] px-3.5 py-3">Giảng viên hướng dẫn</th>
                  <th className="w-[10%] px-2 py-3 text-center">Trạng thái</th>
                  <th className="w-[12%] px-3.5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((placement) => {
                  const supervision = placement.supervision;
                  const badge = getPlacementBadge(placement);
                  const isLocked = hasInternshipStartedOrProgress(placement);
                  const canModifySupervision =
                    Boolean(placement.startDate && placement.endDate) &&
                    placement.status !== "COMPLETED" &&
                    placement.status !== "CANCELLED" &&
                    placement.academicStatus !== "CLOSED" &&
                    placement.academicStatus !== "CANCELLED" &&
                    !isLocked;

                  return (
                    <tr
                      key={placement.id}
                      className="group transition hover:bg-slate-50/80 min-h-[70px]"
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
                            <p
                              className="truncate text-xs font-bold text-slate-900 group-hover:text-[#00878a] transition-colors"
                              title={placement.student.fullName}
                            >
                              {placement.student.fullName}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-slate-500">
                              <span className="font-mono font-semibold text-slate-700">
                                {placement.student.studentCode}
                              </span>
                              {" "}•{" "}
                              <span>{placement.student.major}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Vị trí & Doanh nghiệp */}
                      <td className="px-3.5 py-2.5 align-middle">
                        <div className="min-w-0">
                          <p
                            className="line-clamp-2 text-xs font-bold text-slate-800 leading-snug break-words"
                            title={placement.internship.title}
                          >
                            {placement.internship.title}
                          </p>
                          <p
                            className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 truncate"
                            title={placement.company.companyName}
                          >
                            <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
                            <span className="truncate">{placement.company.companyName}</span>
                          </p>
                        </div>
                      </td>

                      {/* Học kỳ & Lịch */}
                      <td className="px-3.5 py-2.5 align-middle whitespace-nowrap">
                        <p
                          className="truncate text-xs font-semibold text-slate-700"
                          title={placement.semester.name}
                        >
                          {cleanSemesterName(placement.semester.name)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {formatDate(placement.startDate)} — {formatDate(placement.endDate)}
                        </p>
                      </td>

                      {/* Giảng viên hướng dẫn (Cố định vị trí đồng bộ với trang Quản lý thực tập) */}
                      <td className="px-3.5 py-2.5 align-middle whitespace-nowrap">
                        {supervision ? (
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-xs font-bold text-slate-800">
                                {supervision.lecturer.fullName}
                              </p>
                              {placement.student.faculty?.id &&
                                supervision.lecturer.facultyId &&
                                placement.student.faculty.id !==
                                  supervision.lecturer.facultyId && (
                                  <span
                                    title="Giảng viên hướng dẫn thuộc Khoa khác với Khoa của sinh viên (Hướng dẫn liên khoa)"
                                    className="shrink-0 rounded-md border border-[#cbebeb] bg-[#e6f6f6] px-1 py-0.5 text-[9px] font-bold text-[#00878a]"
                                  >
                                    Liên khoa
                                  </span>
                                )}
                            </div>
                            <p className="mt-0.5 truncate text-[11px] text-slate-500">
                              {formatFacultyName(supervision.lecturer.faculty?.name) ||
                                supervision.lecturer.department}
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            Chưa phân công
                          </span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="px-2 py-2.5 align-middle text-center whitespace-nowrap">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="px-3.5 py-2.5 text-right align-middle whitespace-nowrap min-w-[110px]">
                        <div className="flex items-center justify-end gap-1.5 min-h-[30px]">
                          {canModifySupervision && (
                            <button
                              type="button"
                              onClick={() => openAssign(placement)}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#00878a] px-2.5 py-1 text-xs font-bold text-white shadow-2xs transition hover:bg-[#007477] active:scale-[0.98] shrink-0"
                            >
                              <GraduationCap className="h-3.5 w-3.5" />
                              <span>{supervision ? "Đổi GV" : "Phân công"}</span>
                            </button>
                          )}
                          {!placement.startDate || !placement.endDate ? (
                            <span className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 shrink-0">
                              Cần đặt lịch trước
                            </span>
                          ) : null}
                          {supervision?.status === "ACTIVE" && isLocked && (
                            <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                              Đã khóa
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && total > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-600">
            <span className="font-medium text-slate-500">
              Tổng: <strong className="text-slate-700">{total}</strong> hồ sơ thực tập
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => current - 1)}
                className="cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>
                Trang {page}/{totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((current) => current + 1)}
                className="cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Phân công: 2 ô tùy chỉnh, không dùng select mặc định, dropdown lồi ra ngoài không bị che */}
      {modalPlacement && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            onClick={closeModal}
          >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-100 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between rounded-t-2xl border-b border-slate-100 bg-slate-50/70 p-5">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#cbebeb] bg-[#e6f6f6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#00878a]">
                  {modalPlacement.supervision ? "Cập nhật phân công" : "Phân công mới"}
                </span>
                <h2 className="mt-1.5 text-lg font-black text-slate-900">
                  {modalPlacement.student.fullName}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{modalPlacement.internship.title}</span>
                  {" "}·{" "}
                  <span>{modalPlacement.company.companyName}</span>
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-[#006f72]">
                  {modalPlacement.student.studentCode} • {modalPlacement.student.major}
                  {modalPlacement.student.faculty?.name
                    ? ` • ${formatFacultyName(modalPlacement.student.faculty.name)}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="cursor-pointer rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content: 2 ô chọn CustomDropdown */}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2.5 rounded-xl border border-[#cbebeb] bg-[#e6f6f6]/60 p-3 text-xs text-[#006f72]">
                <GraduationCap className="h-4 w-4 text-[#00878a] shrink-0" />
                <span>Ưu tiên chọn giảng viên cùng Khoa hoặc liên khoa để cân bằng khối lượng hướng dẫn.</span>
              </div>

              {/* Ô 1: Lọc danh sách theo Khoa */}
              <div>
                <CustomDropdown
                  label="Lọc danh sách theo Khoa"
                  value={modalLecturerFacultyFilter}
                  onChange={(val) => setModalLecturerFacultyFilter(val)}
                  options={modalFacultyOptions}
                  searchable
                />
              </div>

              {/* Ô 2: Chọn giảng viên hướng dẫn (Mở xuống, ẩn thanh cuộn) */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Chọn giảng viên hướng dẫn
                </label>
                <LecturerPicker
                  value={selectedLecturer}
                  onChange={(val) => setSelectedLecturer(val)}
                  lecturers={visibleLecturers}
                  studentFacultyId={
                    modalPlacement.student.faculty?.id ??
                    modalPlacement.student.majorRef?.facultyId ??
                    null
                  }
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 rounded-b-2xl border-t border-slate-100 bg-slate-50/60 px-5 py-3">
              <div>
                {modalPlacement.supervision?.status === "ACTIVE" && (
                  <button
                    type="button"
                    onClick={async () => {
                      const target = modalPlacement;
                      closeModal();
                      await cancelSupervision(target);
                    }}
                    disabled={saving}
                    className="cursor-pointer rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <span>Bỏ phân công</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={!selectedLecturer || saving}
                  onClick={() => void saveAssignment()}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#00878a] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-[#00878a]/20 transition hover:bg-[#007477] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
                  Lưu phân công
                </button>
              </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </section>
  );
};
