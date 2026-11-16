import React, { useEffect, useMemo, useRef, useState } from "react";
import { ModalPortal } from "../ModalPortal";
import {
  AlertCircle,
  BookOpenCheck,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileText,
  Filter,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { downloadPrivateFile } from "../../files/api";
import { ReportFileDetails } from "../../reports/ReportFileDetails";
import { reportsApi } from "../../reports/api";
import { semestersApi } from "../../semesters/api";
import type { SemesterRecord } from "../../semesters/types";
import { findDefaultSemester } from "../../semesters/utils";
import type { ReportRecord, ReportStatus } from "../../reports/types";
import { formatDateTime } from "../../utils/format";

const statusBadge: Record<ReportStatus, { label: string; className: string }> =
  {
    DRAFT: {
      label: "Bản nháp",
      className: "bg-slate-100 text-slate-700 border border-slate-200",
    },
    SUBMITTED: {
      label: "Chờ giảng viên duyệt",
      className: "bg-amber-50 text-amber-800 border border-amber-200",
    },
    APPROVED: {
      label: "Đã phê duyệt",
      className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    },
    REJECTED: {
      label: "Yêu cầu bổ sung",
      className: "bg-rose-50 text-rose-700 border border-rose-200",
    },
  };

export const ReviewReports: React.FC = () => {
  const [items, setItems] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<ReportRecord | null>(null);
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("SUBMITTED");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "FINAL" | "WEEKLY">(
    "ALL",
  );
  const [semesters, setSemesters] = useState<SemesterRecord[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  const [placementFilter, setPlacementFilter] = useState<string>("");
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [busy, setBusy] = useState(false);

  // Dropdown states
  const [isSemesterDropdownOpen, setIsSemesterDropdownOpen] = useState(false);
  const semesterDropdownRef = useRef<HTMLDivElement>(null);
  const [openDropdown, setOpenDropdown] = useState<
    "student" | "type" | "status" | null
  >(null);
  const filterToolbarRef = useRef<HTMLDivElement>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

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

  const load = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [res, semRes] = await Promise.all([
        reportsApi.supervised({ limit: 100 }),
        semestersApi.list({ limit: 100 }),
      ]);
      setItems(res.items.filter((item) => item.status !== "DRAFT"));
      setSemesters(semRes.items);
      setSelectedSemesterId((prev) => {
        if (prev) return prev;
        const def = findDefaultSemester(semRes.items, "LECTURER");
        return def ? def.id : "ALL";
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const semesterScopedItems = useMemo(() => {
    return items.filter((item) => {
      if (
        selectedSemesterId &&
        selectedSemesterId !== "ALL" &&
        item.placement.semester?.id &&
        item.placement.semester.id !== selectedSemesterId
      ) {
        return false;
      }
      return true;
    });
  }, [items, selectedSemesterId]);

  const studentOptions = useMemo(() => {
    const map = new Map<string, { placementId: string; label: string }>();
    for (const r of semesterScopedItems) {
      if (!map.has(r.placementId)) {
        map.set(r.placementId, {
          placementId: r.placementId,
          label: `${r.placement.student.fullName} (${r.placement.student.studentCode}) — ${r.placement.company.companyName}`,
        });
      }
    }
    return Array.from(map.values());
  }, [semesterScopedItems]);

  const filteredItems = useMemo(() => {
    return semesterScopedItems.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (placementFilter && item.placementId !== placementFilter) return false;
      if (typeFilter === "FINAL" && item.week !== 0) return false;
      if (typeFilter === "WEEKLY" && item.week === 0) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const match = [
          item.placement.student.fullName,
          item.placement.student.studentCode,
          item.placement.student.majorRef?.name ??
            item.placement.student.major ??
            "",
          item.placement.student.majorRef?.faculty?.name ?? "",
          item.placement.company.companyName,
          item.title ?? "",
          item.content,
        ].some((val) => val.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [semesterScopedItems, placementFilter, search, statusFilter, typeFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter, placementFilter, selectedSemesterId]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, page, itemsPerPage]);

  const metrics = useMemo(
    () => ({
      pending: semesterScopedItems.filter((r) => r.status === "SUBMITTED")
        .length,
      pendingFinal: semesterScopedItems.filter(
        (r) => r.status === "SUBMITTED" && r.week === 0,
      ).length,
      approved: semesterScopedItems.filter((r) => r.status === "APPROVED")
        .length,
      rejected: semesterScopedItems.filter((r) => r.status === "REJECTED")
        .length,
    }),
    [semesterScopedItems],
  );

  const review = async (status: "APPROVED" | "REJECTED") => {
    if (!selected) return;
    if (status === "REJECTED" && !feedback.trim()) {
      setModalError(
        "Vui lòng nhập nhận xét chi tiết để sinh viên biết cần chỉnh sửa nội dung gì.",
      );
      return;
    }
    setBusy(true);
    setModalError("");
    try {
      await reportsApi.review(selected.id, {
        status,
        feedback: feedback.trim() || undefined,
      });
      setSelected(null);
      setFeedback("");
      await load(true);
    } catch (requestError) {
      setModalError(getApiErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const download = async (fileId: string) => {
    try {
      await downloadPrivateFile(fileId);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  const currentSelectedSemester = semesters.find(
    (s) => s.id === selectedSemesterId,
  );
  const semesterDisplayLabel = currentSelectedSemester
    ? currentSelectedSemester.name.replace(/\s*\[.*?\]/g, "").trim()
    : "Tất cả học kỳ";

  const selectedStudentLabel = useMemo(() => {
    if (!placementFilter) return "Tất cả sinh viên";
    const found = studentOptions.find((o) => o.placementId === placementFilter);
    return found ? found.label.split(" — ")[0] : "Tất cả sinh viên";
  }, [placementFilter, studentOptions]);

  const hasActiveFilters =
    search.trim() !== "" ||
    placementFilter !== "" ||
    typeFilter !== "ALL" ||
    statusFilter !== "";

  return (
    <div className="space-y-6">
      {/* 1. HEADER CARD (Đồng bộ chuẩn thiết kế CompanyView) */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-[#f8fafd] p-4 sm:p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="!text-xl sm:!text-2xl font-extrabold text-[#006f72] tracking-tight">
              Duyệt Nhật ký Tuần & Báo cáo Tổng kết
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Rà soát nhật ký công việc hàng tuần và phê duyệt Cuốn báo cáo tổng kết thực tập cuối kỳ của sinh viên trước khi chấm điểm kết thúc học phần.
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

            <button
              type="button"
              onClick={() => void load(true)}
              disabled={refreshing}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 shadow-2xs cursor-pointer"
              title="Làm mới danh sách báo cáo"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-[#038b95] ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* 4 Interactive Bento KPI Cards */}
        <div className="mt-5 pt-4 border-t border-slate-200/70 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => {
              setStatusFilter("SUBMITTED");
              setTypeFilter("ALL");
            }}
            className={`rounded-2xl p-3.5 sm:p-4 border text-left shadow-2xs flex items-center justify-between transition cursor-pointer ${
              statusFilter === "SUBMITTED" && typeFilter === "ALL"
                ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20"
                : "bg-white border-slate-200/70 hover:border-amber-300"
            }`}
          >
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                ĐANG CHỜ DUYỆT
              </span>
              <div className="text-xl sm:text-2xl font-bold text-amber-900 mt-1 tracking-tight">
                {metrics.pending}
              </div>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Cần giảng viên chấm
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter("SUBMITTED");
              setTypeFilter("FINAL");
            }}
            className={`rounded-2xl p-3.5 sm:p-4 border text-left shadow-2xs flex items-center justify-between transition cursor-pointer ${
              typeFilter === "FINAL"
                ? "bg-[#e0f4f6]/70 border-[#038b95] ring-2 ring-[#038b95]/20"
                : "bg-white border-slate-200/70 hover:border-[#038b95]/50"
            }`}
          >
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                BC TỔNG KẾT CHỜ DUYỆT
              </span>
              <div className="text-xl sm:text-2xl font-bold text-[#006f72] mt-1 tracking-tight">
                {metrics.pendingFinal}
              </div>
              <p className="text-[11px] text-[#038b95] mt-0.5">
                Nghiệm thu cuối kỳ
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#006f72] flex items-center justify-center shrink-0">
              <BookOpenCheck className="w-5 h-5" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter("APPROVED");
              setTypeFilter("ALL");
            }}
            className={`rounded-2xl p-3.5 sm:p-4 border text-left shadow-2xs flex items-center justify-between transition cursor-pointer ${
              statusFilter === "APPROVED"
                ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20"
                : "bg-white border-slate-200/70 hover:border-emerald-300"
            }`}
          >
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                ĐÃ PHÊ DUYỆT
              </span>
              <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1 tracking-tight">
                {metrics.approved}
              </div>
              <p className="text-[11px] text-emerald-600 mt-0.5">
                Đạt yêu cầu học vụ
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter("REJECTED");
              setTypeFilter("ALL");
            }}
            className={`rounded-2xl p-3.5 sm:p-4 border text-left shadow-2xs flex items-center justify-between transition cursor-pointer ${
              statusFilter === "REJECTED"
                ? "bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/20"
                : "bg-white border-slate-200/70 hover:border-rose-300"
            }`}
          >
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                YÊU CẦU BỔ SUNG
              </span>
              <div className="text-xl sm:text-2xl font-bold text-rose-700 mt-1 tracking-tight">
                {metrics.rejected}
              </div>
              <p className="text-[11px] text-rose-600 mt-0.5">
                Cần sinh viên sửa lại
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          <AlertCircle className="mr-1.5 inline h-4 w-4" />
          {error}
        </p>
      )}

      {/* 2. UNIFIED CARD CONTAINER: TOOLBAR + REPORTS LIST + PAGINATION */}
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
                placeholder="Tìm sinh viên, MSSV, doanh nghiệp, tiêu đề hoặc nội dung báo cáo..."
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
              {/* Lọc Sinh viên phụ trách */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === "student" ? null : "student",
                    )
                  }
                  className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition cursor-pointer shadow-2xs ${
                    placementFilter !== ""
                      ? "border-[#038b95] bg-[#e0f4f6] text-[#02636a]"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="max-w-[180px] truncate">
                    {selectedStudentLabel}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                      openDropdown === "student" ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openDropdown === "student" && (
                  <div className="absolute right-0 top-full mt-1.5 z-40 w-72 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setPlacementFilter("");
                        setOpenDropdown(null);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer ${
                        placementFilter === ""
                          ? "bg-[#e0f4f6] font-extrabold text-[#02636a]"
                          : "font-medium text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>Tất cả sinh viên phụ trách</span>
                      {placementFilter === "" && (
                        <Check className="h-3.5 w-3.5 text-[#038b95]" />
                      )}
                    </button>
                    {studentOptions.map((opt) => (
                      <button
                        key={opt.placementId}
                        type="button"
                        onClick={() => {
                          setPlacementFilter(opt.placementId);
                          setOpenDropdown(null);
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer ${
                          placementFilter === opt.placementId
                            ? "bg-[#e0f4f6] font-extrabold text-[#02636a]"
                            : "font-medium text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {placementFilter === opt.placementId && (
                          <Check className="h-3.5 w-3.5 text-[#038b95] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Lọc Loại báo cáo */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setOpenDropdown(openDropdown === "type" ? null : "type")
                  }
                  className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition cursor-pointer shadow-2xs ${
                    typeFilter !== "ALL"
                      ? "border-[#038b95] bg-[#e0f4f6] text-[#02636a]"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>
                    {typeFilter === "ALL" && "Mọi loại báo cáo"}
                    {typeFilter === "FINAL" && "Báo cáo tổng kết cuối kỳ"}
                    {typeFilter === "WEEKLY" && "Nhật ký báo cáo tuần"}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                      openDropdown === "type" ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openDropdown === "type" && (
                  <div className="absolute right-0 top-full mt-1.5 z-40 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    {[
                      { value: "ALL", label: "Mọi loại báo cáo" },
                      { value: "FINAL", label: "Báo cáo tổng kết cuối kỳ" },
                      { value: "WEEKLY", label: "Nhật ký báo cáo tuần" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setTypeFilter(
                            opt.value as "ALL" | "FINAL" | "WEEKLY",
                          );
                          setOpenDropdown(null);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer ${
                          typeFilter === opt.value
                            ? "bg-[#e0f4f6] font-extrabold text-[#02636a]"
                            : "font-medium text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {typeFilter === opt.value && (
                          <Check className="h-3.5 w-3.5 text-[#038b95]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Lọc Trạng thái */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setOpenDropdown(openDropdown === "status" ? null : "status")
                  }
                  className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition cursor-pointer shadow-2xs ${
                    statusFilter !== ""
                      ? "border-[#038b95] bg-[#e0f4f6] text-[#02636a]"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>
                    {statusFilter === "" && "Tất cả trạng thái"}
                    {statusFilter === "SUBMITTED" && "Chờ duyệt"}
                    {statusFilter === "APPROVED" && "Đã phê duyệt"}
                    {statusFilter === "REJECTED" && "Yêu cầu bổ sung"}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                      openDropdown === "status" ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openDropdown === "status" && (
                  <div className="absolute right-0 top-full mt-1.5 z-40 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    {[
                      { value: "", label: "Tất cả trạng thái" },
                      { value: "SUBMITTED", label: "Chờ duyệt" },
                      { value: "APPROVED", label: "Đã phê duyệt" },
                      { value: "REJECTED", label: "Yêu cầu bổ sung" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setStatusFilter(opt.value);
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

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("");
                    setTypeFilter("ALL");
                    setPlacementFilter("");
                    setSearch("");
                  }}
                  className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                  title="Xem toàn bộ báo cáo"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Tất cả</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ROW 2: DANH SÁCH BÁO CÁO */}
        {loading ? (
          <div className="flex min-h-64 items-center justify-center p-12 text-xs font-semibold text-slate-500">
            <LoaderCircle className="mr-2 h-5 w-5 animate-spin text-[#038b95]" />
            Đang tải danh sách báo cáo của sinh viên...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Filter className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">
              Không có báo cáo nào khớp với bộ lọc hiện tại
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Bạn có thể chuyển sang xem toàn bộ báo cáo đã phê duyệt hoặc chọn học kỳ khác.
            </p>
            {statusFilter !== "" && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("");
                  setTypeFilter("ALL");
                  setPlacementFilter("");
                  setSearch("");
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#038b95] px-4 py-2 text-xs font-bold text-white hover:bg-[#026f77] transition cursor-pointer shadow-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Xem toàn bộ báo cáo
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginatedItems.map((report) => {
              const isFinal = report.week === 0;
              const badge = statusBadge[report.status];
              return (
                <article
                  key={report.id}
                  className={`p-5 sm:p-6 transition hover:bg-slate-50/50 ${
                    isFinal ? "bg-[#f8fcfe]" : ""
                  }`}
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-extrabold shadow-2xs ${
                          isFinal
                            ? "bg-[#038b95] text-white"
                            : "bg-[#e0f4f6] text-[#02636a] border border-[#b8e6ea]"
                        }`}
                      >
                        {isFinal ? (
                          <BookOpenCheck className="h-5 w-5" />
                        ) : (
                          `T${report.week}`
                        )}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                              isFinal
                                ? "bg-[#038b95] text-white"
                                : "bg-[#e0f4f6] text-[#02636a]"
                            }`}
                          >
                            {isFinal
                              ? "★ Báo cáo tổng kết cuối kỳ"
                              : `Nhật ký Tuần ${report.week}`}
                          </span>
                          <h3 className="font-extrabold text-sm text-slate-900">
                            {report.placement.student.fullName}{" "}
                            <span className="font-semibold text-slate-500">
                              ({report.placement.student.studentCode})
                            </span>
                          </h3>
                          {(report.placement.student.majorRef?.name ||
                            report.placement.student.major) && (
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                              {report.placement.student.majorRef?.name ??
                                report.placement.student.major}
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-xs font-bold text-slate-800">
                          {report.title ||
                            (isFinal
                              ? "Báo cáo tổng kết thực tập tốt nghiệp"
                              : `Báo cáo thực tập tuần ${report.week}`)}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                          <Building2 className="h-3.5 w-3.5 text-[#038b95]" />
                          <span className="font-semibold text-slate-700">
                            {report.placement.company.companyName}
                          </span>
                          <span>•</span>
                          <span>{report.placement.internship.title}</span>
                          {report.submittedAt && (
                            <>
                              <span>•</span>
                              <span>
                                Nộp lúc {formatDateTime(report.submittedAt)}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`self-start rounded-full px-3 py-1 text-xs font-bold shrink-0 ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="mt-3.5 rounded-2xl border border-slate-200/80 bg-[#f8fafd] p-4 text-xs sm:text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                    {report.content}
                  </div>

                  {report.feedback && (
                    <div className="mt-3 rounded-2xl border border-[#b8e6ea] bg-[#e0f4f6]/50 p-3.5 text-xs text-slate-700">
                      <b className="text-[#006f72]">
                        Nhận xét của giảng viên hướng dẫn:
                      </b>{" "}
                      {report.feedback}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      {report.file && (
                        <ReportFileDetails
                          file={report.file}
                          onDownload={download}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(report);
                          setFeedback(report.feedback ?? "");
                          setModalError("");
                        }}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer shadow-xs ${
                          report.status === "SUBMITTED"
                            ? "bg-[#038b95] text-white hover:bg-[#026f77]"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <ClipboardCheck className="h-4 w-4" />
                        <span>
                          {report.status === "SUBMITTED"
                            ? "Kiểm duyệt & Nhận xét"
                            : "Cập nhật nhận xét"}
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ROW 3: PHÂN TRANG */}
        {totalPages > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-3.5 text-xs text-slate-600">
            <span className="font-medium text-slate-500">
              Tổng:{" "}
              <strong className="text-slate-700">{filteredItems.length}</strong>{" "}
              báo cáo
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

      {/* MODAL KIỂM DUYỆT & NHẬN XÉT */}
      {selected && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs modal-backdrop-appear">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl modal-scale-in border border-slate-100">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e0f4f6] px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-[#02636a]">
                    <ClipboardCheck className="h-3.5 w-3.5 text-[#038b95]" />
                    {selected.week === 0
                      ? "Nghiệm thu Báo cáo tổng kết cuối kỳ"
                      : `Duyệt báo cáo tuần ${selected.week}`}
                  </span>
                  <h3 className="mt-2 text-lg font-extrabold text-slate-900">
                    {selected.placement.student.fullName} (
                    {selected.placement.student.studentCode})
                  </h3>
                  {(selected.placement.student.majorRef?.name ||
                    selected.placement.student.major) && (
                    <p className="mt-0.5 text-xs font-semibold text-[#038b95]">
                      Ngành:{" "}
                      {selected.placement.student.majorRef?.name ??
                        selected.placement.student.major}
                      {selected.placement.student.majorRef?.faculty?.name
                        ? ` · Khoa ${selected.placement.student.majorRef.faculty.name}`
                        : ""}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-slate-500">
                    {selected.placement.company.companyName} ·{" "}
                    {selected.placement.internship.title}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                  onClick={() => setSelected(null)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 max-h-48 overflow-y-auto rounded-2xl border border-slate-200/80 bg-[#f8fafd] p-3.5 text-xs leading-5 text-slate-700 whitespace-pre-line">
                {selected.content}
              </div>

              {selected.file && (
                <div className="mt-3">
                  <ReportFileDetails
                    file={selected.file}
                    onDownload={download}
                  />
                </div>
              )}

              {modalError && (
                <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
                  {modalError}
                </p>
              )}

              <label className="mt-4 block text-xs font-bold text-slate-700">
                Nhận xét của giảng viên hướng dẫn{" "}
                <span className="font-normal text-slate-500">
                  (bắt buộc nếu yêu cầu sinh viên sửa lại)
                </span>
                <textarea
                  rows={4}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all"
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  placeholder="Nhập đánh giá tiến độ hoặc các điểm sinh viên cần bổ sung, chỉnh sửa..."
                />
              </label>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void review("REJECTED")}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-800 transition hover:bg-rose-100 disabled:opacity-50 cursor-pointer"
                >
                  Yêu cầu chỉnh sửa
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void review("APPROVED")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#038b95] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#026f77] disabled:opacity-50 cursor-pointer"
                >
                  <Check className="h-4 w-4" /> Phê duyệt báo cáo
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};
