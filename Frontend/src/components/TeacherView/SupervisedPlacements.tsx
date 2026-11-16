import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Award,
  BriefcaseBusiness,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Download,
  FileText,
  GraduationCap,
  LoaderCircle,
  MapPin,
  MessageSquare,
  Search,
  Star,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { supervisionsApi } from "../../supervisions/api";
import { semestersApi } from "../../semesters/api";
import type { SemesterRecord } from "../../semesters/types";
import { findDefaultSemester, toSemesterSlug } from "../../semesters/utils";
import type { SupervisionRecord } from "../../supervisions/types";
import { formatDate, formatDateTime } from "../../utils/format";
import { downloadExcelWorkbook } from "../../utils/excelExport";
import { ProfileAvatarPreview } from "../ProfileAvatarUpload";

interface SupervisedPlacementsProps {
  onNavigateTab?: (tab: string) => void;
  onOpenChat?: (placementId: string) => void;
}

type StatusFilter = "ALL" | "ACTIVE" | "COMPLETED" | "CROSS_FACULTY";

const supervisionStatusLabel: Record<SupervisionRecord["status"], string> = {
  ACTIVE: "Đang hướng dẫn",
  COMPLETED: "Đã hoàn tất",
  CANCELLED: "Đã hủy",
};

const AVATAR_BG_COLORS = [
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-sky-100 text-sky-800 border-sky-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-amber-100 text-amber-800 border-amber-200",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_BG_COLORS[Math.abs(hash) % AVATAR_BG_COLORS.length];
}

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (fullName.slice(0, 2) || "SV").toUpperCase();
}

export const SupervisedPlacements: React.FC<SupervisedPlacementsProps> = ({
  onNavigateTab,
  onOpenChat,
}) => {
  const [items, setItems] = useState<SupervisionRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [semesters, setSemesters] = useState<SemesterRecord[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dropdown & Expand states
  const [isSemesterDropdownOpen, setIsSemesterDropdownOpen] = useState(false);
  const semesterDropdownRef = useRef<HTMLDivElement>(null);
  const [openDropdown, setOpenDropdown] = useState<"status" | "major" | null>(
    null,
  );
  const filterToolbarRef = useRef<HTMLDivElement>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        semesterDropdownRef.current &&
        !semesterDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSemesterDropdownOpen(false);
      }
      if (
        filterToolbarRef.current &&
        !filterToolbarRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    Promise.all([
      supervisionsApi.listMine(),
      semestersApi.list({ limit: 100 }),
    ])
      .then(([supRes, semRes]) => {
        setItems(supRes.items);
        setSemesters(semRes.items);
        const def = findDefaultSemester(semRes.items, "LECTURER");
        if (def) setSelectedSemesterId(def.id);
      })
      .catch((requestError) => setError(getApiErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, []);

  const semesterScopedItems = useMemo(
    () =>
      items.filter(
        (item) =>
          !selectedSemesterId ||
          selectedSemesterId === "ALL" ||
          item.placement.semester.id === selectedSemesterId,
      ),
    [items, selectedSemesterId],
  );

  const stats = useMemo(() => {
    const total = semesterScopedItems.length;
    const active = semesterScopedItems.filter(
      (i) => i.status === "ACTIVE",
    ).length;
    const completed = semesterScopedItems.filter(
      (i) => i.status === "COMPLETED" || i.placement.status === "COMPLETED",
    ).length;
    const totalReports = semesterScopedItems.reduce(
      (acc, i) => acc + (i.placement._count?.reports ?? 0),
      0,
    );
    return { total, active, completed, totalReports };
  }, [semesterScopedItems]);

  const distinctMajors = useMemo(
    () =>
      Array.from(
        new Set(
          semesterScopedItems
            .map((item) => item.placement.student.major)
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b, "vi")),
    [semesterScopedItems],
  );

  const filtered = useMemo(() => {
    return semesterScopedItems.filter((item) => {
      const keyword = search.trim().toLowerCase();
      const matchesKeyword =
        !keyword ||
        [
          item.placement.student.fullName,
          item.placement.student.studentCode,
          item.placement.student.major,
          item.placement.student.faculty?.name ?? "",
          item.placement.internship.title,
          item.placement.company.companyName,
        ].some((value) => value.toLowerCase().includes(keyword));

      const matchesMajor =
        !selectedMajor || item.placement.student.major === selectedMajor;

      let matchesStatus = true;
      if (statusFilter === "ACTIVE") {
        matchesStatus = item.status === "ACTIVE";
      } else if (statusFilter === "COMPLETED") {
        matchesStatus =
          item.status === "COMPLETED" || item.placement.status === "COMPLETED";
      } else if (statusFilter === "CROSS_FACULTY") {
        matchesStatus = Boolean(
          item.placement.student.faculty?.id &&
            item.lecturer.facultyId &&
            item.placement.student.faculty.id !== item.lecturer.facultyId,
        );
      }

      return matchesKeyword && matchesMajor && matchesStatus;
    });
  }, [semesterScopedItems, search, selectedMajor, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedMajor, statusFilter, selectedSemesterId]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page, itemsPerPage]);

  const exportListExcel = () => {
    const currentSem = semesters.find((s) => s.id === selectedSemesterId);
    const semLabel = currentSem ? currentSem.name : "Tất cả học kỳ";
    const fileSlug = currentSem
      ? toSemesterSlug(currentSem.name)
      : "tat-ca-hoc-ky";
    downloadExcelWorkbook(`danh-sach-sinh-vien-${fileSlug}`, [
      {
        name: "Sinh vien phu trach",
        title: `DANH SÁCH SINH VIÊN THỰC TẬP — ${semLabel.toUpperCase()}`,
        subtitle: `Học kỳ: ${semLabel} — Ngày xuất: ${new Date().toLocaleDateString("vi-VN")} — Tổng số: ${filtered.length} sinh viên`,
        columns: [
          { header: "STT", width: 45, value: (_, i) => i + 1 },
          {
            header: "MSSV",
            width: 105,
            value: (s) => s.placement.student.studentCode,
          },
          {
            header: "Họ và tên",
            width: 165,
            value: (s) => s.placement.student.fullName,
          },
          {
            header: "Ngành đào tạo",
            width: 175,
            value: (s) => s.placement.student.major,
          },
          {
            header: "Khoa",
            width: 165,
            value: (s) => s.placement.student.faculty?.name ?? "—",
          },
          {
            header: "Doanh nghiệp thực tập",
            width: 190,
            value: (s) => s.placement.company.companyName,
          },
          {
            header: "Vị trí thực tập",
            width: 170,
            value: (s) => s.placement.internship.title,
          },
          {
            header: "Học kỳ",
            width: 140,
            value: (s) => s.placement.semester.name,
          },
          {
            header: "Số báo cáo đã nộp",
            width: 120,
            value: (s) => s.placement._count.reports,
          },
          {
            header: "Số đánh giá",
            width: 105,
            value: (s) => s.placement._count.evaluations,
          },
          {
            header: "Trạng thái hướng dẫn",
            width: 130,
            value: (s) => supervisionStatusLabel[s.status],
          },
        ],
        rows: filtered,
      },
    ]);
  };

  const currentSelectedSemester = semesters.find(
    (s) => s.id === selectedSemesterId,
  );
  const semesterDisplayLabel = currentSelectedSemester
    ? currentSelectedSemester.name.replace(/\s*\[.*?\]/g, "").trim()
    : "Tất cả học kỳ";

  const hasActiveFilters =
    search.trim() !== "" || selectedMajor !== "" || statusFilter !== "ALL";

  return (
    <div className="space-y-6">
      {/* 1. HEADER CARD (Đồng bộ chuẩn thiết kế CompanyView) */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-[#f8fafd] p-4 sm:p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="!text-xl sm:!text-2xl font-extrabold text-[#006f72] tracking-tight">
              Sinh viên hướng dẫn & Theo dõi học vụ
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Danh sách sinh viên thực tập được phân công theo dõi, rà soát nhật ký hàng tuần và hướng dẫn học phần.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap sm:flex-nowrap items-center gap-2.5">
            {/* Custom Popover Dropdown Chọn Học Kỳ */}
            <div className="relative" ref={semesterDropdownRef}>
              <button
                type="button"
                onClick={() => setIsSemesterDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
                title="Chọn học kỳ áp dụng"
              >
                <Calendar className="h-3.5 w-3.5 text-[#038b95]" />
                <span className="max-w-[200px] sm:max-w-[260px] truncate text-xs font-bold text-slate-800">
                  {semesterDisplayLabel}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                    isSemesterDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isSemesterDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 w-[320px] sm:w-[350px] max-w-[92vw] rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-2xl max-h-64 overflow-y-auto">
                  <div className="px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                    Chọn học kỳ
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSemesterId("ALL");
                      setIsSemesterDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs transition cursor-pointer ${
                      selectedSemesterId === "ALL" || !selectedSemesterId
                        ? "bg-[#e0f4f6] text-[#02636a] font-extrabold"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-[#038b95]" />
                      <span>Tất cả học kỳ</span>
                    </span>
                    {(selectedSemesterId === "ALL" || !selectedSemesterId) && (
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
                        onClick={() => {
                          setSelectedSemesterId(s.id);
                          setIsSemesterDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs transition cursor-pointer ${
                          isSelected
                            ? "bg-[#e0f4f6] text-[#02636a] font-extrabold"
                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold"
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
                                    ? "Sắp tới"
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

            {/* Nút Xuất Excel */}
            {filtered.length > 0 && (
              <button
                type="button"
                onClick={exportListExcel}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#e0f4f6] border border-[#b8e6ea] px-3.5 py-1.5 text-xs font-bold text-teal-800 transition hover:bg-teal-100 shadow-2xs cursor-pointer"
                title="Xuất danh sách sinh viên phụ trách ra Excel"
              >
                <Download className="h-3.5 w-3.5 text-[#02636a]" />
                <span className="hidden sm:inline">Xuất danh sách</span>
              </button>
            )}
          </div>
        </div>

        {/* Bento KPI Metrics Grid */}
        <div className="mt-5 pt-4 border-t border-slate-200/70 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                TỔNG SINH VIÊN
              </span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tracking-tight">
                {stats.total}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Được phân công hướng dẫn
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#006f72] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                ĐANG HƯỚNG DẪN
              </span>
              <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1 tracking-tight">
                {stats.active}
              </div>
              <p className="text-[11px] text-emerald-600 mt-0.5">
                Đang thực tập tại DN
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                ĐÃ HOÀN TẤT
              </span>
              <div className="text-xl sm:text-2xl font-bold text-sky-700 mt-1 tracking-tight">
                {stats.completed}
              </div>
              <p className="text-[11px] text-sky-600 mt-0.5">
                Đã nghiệm thu học phần
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                BÁO CÁO ĐÃ NỘP
              </span>
              <div className="text-xl sm:text-2xl font-bold text-indigo-700 mt-1 tracking-tight">
                {stats.totalReports}
              </div>
              <p className="text-[11px] text-indigo-600 mt-0.5">
                Nhật ký tuần & cuối kỳ
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. UNIFIED CARD CONTAINER: TOOLBAR + TABLE OF RECORDS + PAGINATION */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {/* ROW 1: TOOLBAR BỘ LỌC & TÌM KIẾM */}
        <div
          ref={filterToolbarRef}
          className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50"
        >
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm sinh viên, MSSV, chuyên ngành, vị trí hoặc doanh nghiệp..."
                className="w-full pl-10 pr-9 py-2 rounded-2xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Lọc Trạng thái */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setOpenDropdown(openDropdown === "status" ? null : "status")
                  }
                  className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition cursor-pointer shadow-2xs ${
                    statusFilter !== "ALL"
                      ? "border-[#038b95] bg-[#e0f4f6] text-[#02636a]"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>
                    {statusFilter === "ALL" && "Tất cả trạng thái"}
                    {statusFilter === "ACTIVE" && "Đang hướng dẫn"}
                    {statusFilter === "COMPLETED" && "Đã hoàn tất"}
                    {statusFilter === "CROSS_FACULTY" && "Hướng dẫn liên khoa"}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                      openDropdown === "status" ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openDropdown === "status" && (
                  <div className="absolute right-0 top-full mt-1.5 z-40 w-52 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    {[
                      { value: "ALL", label: "Tất cả trạng thái" },
                      { value: "ACTIVE", label: "Đang hướng dẫn" },
                      { value: "COMPLETED", label: "Đã hoàn tất" },
                      { value: "CROSS_FACULTY", label: "Hướng dẫn liên khoa" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setStatusFilter(opt.value as StatusFilter);
                          setOpenDropdown(null);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer ${
                          statusFilter === opt.value
                            ? "bg-[#e0f4f6] font-extrabold text-[#02636a]"
                            : "font-medium text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {statusFilter === opt.value && (
                          <Check className="h-3.5 w-3.5 text-[#038b95]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Lọc Chuyên ngành */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setOpenDropdown(openDropdown === "major" ? null : "major")
                  }
                  className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition cursor-pointer shadow-2xs ${
                    selectedMajor !== ""
                      ? "border-[#038b95] bg-[#e0f4f6] text-[#02636a]"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="max-w-[180px] truncate">
                    {selectedMajor || `Tất cả ngành (${distinctMajors.length})`}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                      openDropdown === "major" ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openDropdown === "major" && (
                  <div className="absolute right-0 top-full mt-1.5 z-40 w-60 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMajor("");
                        setOpenDropdown(null);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer ${
                        selectedMajor === ""
                          ? "bg-[#e0f4f6] font-extrabold text-[#02636a]"
                          : "font-medium text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>Tất cả ngành ({distinctMajors.length})</span>
                      {selectedMajor === "" && (
                        <Check className="h-3.5 w-3.5 text-[#038b95]" />
                      )}
                    </button>
                    {distinctMajors.map((major) => (
                      <button
                        key={major}
                        type="button"
                        onClick={() => {
                          setSelectedMajor(major);
                          setOpenDropdown(null);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer ${
                          selectedMajor === major
                            ? "bg-[#e0f4f6] font-extrabold text-[#02636a]"
                            : "font-medium text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">{major}</span>
                        {selectedMajor === major && (
                          <Check className="h-3.5 w-3.5 text-[#038b95] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reset filter */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedMajor("");
                    setStatusFilter("ALL");
                  }}
                  className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                  title="Xóa bộ lọc"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Xóa lọc</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ROW 2: BẢNG BẢN GHI SINH VIÊN HƯỚNG DẪN */}
        {loading ? (
          <div className="flex min-h-64 items-center justify-center p-12 text-xs font-semibold text-slate-500">
            <LoaderCircle className="mr-2 h-5 w-5 animate-spin text-[#038b95]" />
            Đang tải danh sách sinh viên hướng dẫn...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <UsersRound className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">
              Chưa có sinh viên hướng dẫn phù hợp
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Các hồ sơ thực tập được quản trị viên phân công cho bạn sẽ xuất hiện tại đây.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedMajor("");
                  setStatusFilter("ALL");
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#038b95] px-4 py-2 text-xs font-bold text-white hover:bg-[#026f77] transition cursor-pointer shadow-xs"
              >
                <X className="h-4 w-4" /> Xóa bộ lọc tìm kiếm
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 pl-5 pr-3">Sinh viên</th>
                  <th className="py-3.5 px-3">Doanh nghiệp & Vị trí</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">
                    Tiến độ
                  </th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Trạng thái</th>
                  <th className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.map((item) => {
                  const isExpanded = expandedId === item.id;
                  const student = item.placement.student;
                  const avatarColor = getAvatarColor(student.fullName);
                  const initials = getInitials(student.fullName);
                  const isCrossFaculty = Boolean(
                    student.faculty?.id &&
                      item.lecturer.facultyId &&
                      student.faculty.id !== item.lecturer.facultyId,
                  );

                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        onClick={() =>
                          setExpandedId((prev) =>
                            prev === item.id ? null : item.id,
                          )
                        }
                        className={`transition-colors hover:bg-slate-50/80 cursor-pointer ${
                          isExpanded ? "bg-[#f4fafb]" : ""
                        }`}
                      >
                        {/* 1. Sinh viên */}
                        <td className="py-3.5 pl-5 pr-3 max-w-[230px]">
                          <div className="flex items-center gap-3 min-w-0">
                            <ProfileAvatarPreview
                              fileId={student.avatarFileId}
                              fallback={initials}
                              className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border text-xs font-extrabold shadow-2xs ${avatarColor}`}
                              imageClassName="h-full w-full object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-extrabold text-sm text-slate-900 truncate">
                                {student.fullName}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 min-w-0">
                                <span className="font-semibold text-slate-700 shrink-0">
                                  {student.studentCode}
                                </span>
                                <span className="shrink-0">•</span>
                                <span className="truncate">{student.major}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Doanh nghiệp & Vị trí */}
                        <td className="py-3.5 px-3 max-w-[260px]">
                          <div className="font-bold text-slate-800 truncate">
                            {item.placement.internship.title}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1 min-w-0">
                            <Building2 className="w-3.5 h-3.5 text-[#038b95] shrink-0" />
                            <span className="truncate font-semibold text-slate-700">
                              {item.placement.company.companyName}
                            </span>
                          </div>
                        </td>

                        {/* 3. Tiến độ */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                              <FileText className="w-3.5 h-3.5 text-[#038b95] shrink-0" />
                              <span>{item.placement._count.reports} BC</span>
                            </span>
                            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-amber-50 border border-amber-200/70 px-2 py-1 text-xs font-bold text-amber-800">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
                              <span>{item.placement._count.evaluations}/2</span>
                            </span>
                          </div>
                        </td>

                        {/* 4. Trạng thái */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10.5px] font-bold ${
                                item.status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                  item.status === "ACTIVE"
                                    ? "bg-emerald-500 animate-pulse"
                                    : "bg-slate-400"
                                }`}
                              />
                              {supervisionStatusLabel[item.status]}
                            </span>
                            {isCrossFaculty && (
                              <span className="whitespace-nowrap rounded-md border border-[#b8e6ea] bg-[#e0f4f6] px-2 py-0.5 text-[10px] font-bold text-[#02636a]">
                                Liên khoa
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 5. Thao tác */}
                        <td className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {onOpenChat && (
                              <button
                                type="button"
                                onClick={() => onOpenChat(item.placement.id)}
                                title={`Nhắn tin với ${student.fullName}`}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-[#038b95] hover:text-[#038b95] transition cursor-pointer shadow-2xs"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedId((prev) =>
                                  prev === item.id ? null : item.id,
                                )
                              }
                              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer shadow-2xs"
                            >
                              <span>Chi tiết</span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* HÀNG MỞ RỘNG (CHI TIẾT HỒ SƠ THỰC TẬP & PHÂN CÔNG) */}
                      {isExpanded && (
                        <tr className="bg-[#f8fcfe] border-b border-slate-200">
                          <td colSpan={5} className="p-4 sm:p-6">
                            <div className="grid gap-5 lg:grid-cols-12">
                              {/* Cột trái: Thông tin thực tập tại doanh nghiệp */}
                              <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3.5">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    <BriefcaseBusiness className="h-4 w-4 text-[#038b95]" />
                                    <span>Thông tin vị trí & Doanh nghiệp thực tập</span>
                                  </h4>
                                  <span className="rounded-full bg-[#e0f4f6] px-2.5 py-0.5 text-[10.5px] font-bold text-[#02636a]">
                                    {student.faculty?.name || "Khoa đào tạo"}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                                  <div className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                      Vị trí thực tập
                                    </p>
                                    <p className="mt-1 font-bold text-slate-900">
                                      {item.placement.internship.title}
                                    </p>
                                  </div>
                                  <div className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                      Doanh nghiệp tiếp nhận
                                    </p>
                                    <p className="mt-1 font-bold text-slate-900">
                                      {item.placement.company.companyName}
                                    </p>
                                  </div>
                                  <div className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                      Địa điểm làm việc
                                    </p>
                                    <p className="mt-1 font-semibold text-slate-800 flex items-center gap-1.5">
                                      <MapPin className="h-3.5 w-3.5 text-[#038b95] shrink-0" />
                                      <span>
                                        {item.placement.internship.location ??
                                          "Chưa cập nhật địa điểm"}
                                      </span>
                                    </p>
                                  </div>
                                  <div className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                      Học kỳ & Khung thời gian
                                    </p>
                                    <p className="mt-1 font-semibold text-slate-800">
                                      {item.placement.semester.name.replace(/\s*\[.*?\]/g, "").trim()} ({formatDate(
                                        item.placement.semester.startDate,
                                      )}{" "}
                                      —{" "}
                                      {formatDate(
                                        item.placement.semester.endDate,
                                      )})
                                    </p>
                                  </div>
                                </div>

                                {/* Quick Navigation Actions */}
                                <div className="pt-2 flex flex-wrap items-center gap-2.5">
                                  {onNavigateTab && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onNavigateTab("review-reports")
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#038b95] px-4 py-2 text-xs font-bold text-white hover:bg-[#026f77] transition cursor-pointer shadow-xs"
                                      >
                                        <ClipboardCheck className="h-3.5 w-3.5" />
                                        <span>
                                          Duyệt báo cáo (
                                          {item.placement._count.reports})
                                        </span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          sessionStorage.setItem(
                                            "cb_target_evaluation_placement_id",
                                            item.placement.id,
                                          );
                                          onNavigateTab("evaluation-list");
                                        }}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#b8e6ea] bg-[#e0f4f6] px-4 py-2 text-xs font-bold text-[#02636a] hover:bg-[#cdeff2] transition cursor-pointer"
                                      >
                                        <Award className="h-3.5 w-3.5" />
                                        <span>Chấm điểm thực tập</span>
                                      </button>
                                    </>
                                  )}
                                  {onOpenChat && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onOpenChat(item.placement.id)
                                      }
                                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                                    >
                                      <MessageSquare className="h-3.5 w-3.5 text-[#038b95]" />
                                      <span>Nhắn tin trao đổi</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Cột phải: Thông tin phân công học vụ */}
                              <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between space-y-4">
                                <div>
                                  <h4 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3">
                                    Thông tin phân công hướng dẫn
                                  </h4>
                                  <div className="mt-3 space-y-2 text-xs text-slate-600">
                                    <p className="flex items-center justify-between">
                                      <span className="text-slate-500">
                                        Phân công lúc:
                                      </span>
                                      <span className="font-bold text-slate-800">
                                        {formatDateTime(item.assignedAt)}
                                      </span>
                                    </p>
                                    <p className="flex items-center justify-between">
                                      <span className="text-slate-500">
                                        Người phân công:
                                      </span>
                                      <span className="font-bold text-slate-800">
                                        {item.assignedBy?.email ??
                                          "Quản trị viên hệ thống"}
                                      </span>
                                    </p>
                                    <p className="flex items-center justify-between">
                                      <span className="text-slate-500">
                                        Hoàn tất lúc:
                                      </span>
                                      <span className="font-bold text-slate-800">
                                        {formatDateTime(
                                          item.completedAt,
                                          "Chưa hoàn tất",
                                        )}
                                      </span>
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                                  <div className="rounded-xl bg-[#f8fafd] border border-slate-200/70 p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                      Báo cáo đã nộp
                                    </p>
                                    <p className="mt-1 text-lg font-black text-slate-900">
                                      {item.placement._count.reports}
                                    </p>
                                  </div>
                                  <div className="rounded-xl bg-[#f8fafd] border border-slate-200/70 p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                      Đánh giá hiện có
                                    </p>
                                    <p className="mt-1 text-lg font-black text-slate-900">
                                      {item.placement._count.evaluations}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ROW 3: PHÂN TRANG (PAGINATION FOOTER) */}
        {totalPages > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-3.5 text-xs text-slate-600">
            <span className="font-medium text-slate-500">
              Tổng: <strong className="text-slate-700">{filtered.length}</strong>{" "}
              sinh viên hướng dẫn
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition cursor-pointer shadow-2xs"
                title="Trang trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-semibold text-slate-700 px-1">
                Trang {page}/{totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition cursor-pointer shadow-2xs"
                title="Trang sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
