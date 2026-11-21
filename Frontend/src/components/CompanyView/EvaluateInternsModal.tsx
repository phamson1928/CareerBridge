import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  Download,
  FileBadge2,
  FileText,
  Save,
  Upload,
  UserRound,
  Search,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  Clock,
  Award,
  Star,
  Users,
  Calendar,
  AlertCircle,
  Pencil,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import type {
  CreateEvaluationInput,
  EvaluationRecord,
  UpdateEvaluationInput,
} from "../../evaluations/api";
import { downloadPrivateFile, uploadPrivateFile } from "../../files/api";
import type { PlacementRecord } from "../../placements/types";
import { reportsApi } from "../../reports/api";
import type { ReportRecord } from "../../reports/types";
import { formatDate, formatFileSize } from "../../utils/format";
import { semestersApi } from "../../semesters/api";
import type { SemesterRecord } from "../../semesters/types";
import { findDefaultSemester, toSemesterSlug } from "../../semesters/utils";
import { downloadExcelWorkbook } from "../../utils/excelExport";

interface Props {
  placements: PlacementRecord[];
  evaluations: EvaluationRecord[];
  onSubmit: (input: CreateEvaluationInput) => Promise<void>;
  onUpdate: (id: string, input: UpdateEvaluationInput) => Promise<void>;
}

type FilterStatus = "ALL" | "NOT_EVALUATED" | "EVALUATED" | "HAS_CERT" | "COMPLETED";
type SortOption = "NAME_ASC" | "NAME_DESC" | "SCORE_DESC" | "SCORE_ASC" | "DATE_DESC";

const QUICK_SCORES = [7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0];

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
  return (fullName.slice(0, 2) || "TS").toUpperCase();
}

export function EvaluateInternsModal({
  placements,
  evaluations,
  onSubmit,
  onUpdate,
}: Props) {
  // Only show active or completed placements
  const evaluable = useMemo(
    () =>
      placements.filter(
        (placement) =>
          (placement.status === "ACTIVE" || placement.status === "COMPLETED") &&
          (placement.academicStatus === "ACTIVE" ||
            placement.academicStatus === "CLOSED"),
      ),
    [placements],
  );

  const [semesters, setSemesters] = useState<SemesterRecord[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  const [isSemesterDropdownOpen, setIsSemesterDropdownOpen] = useState(false);
  const semesterDropdownRef = useRef<HTMLDivElement>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("NAME_ASC");
  const [openDropdown, setOpenDropdown] = useState<"status" | "sort" | null>(null);
  const filterToolbarRef = useRef<HTMLDivElement>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Row Expand & Evaluation Form State
  const [expandedPlacementId, setExpandedPlacementId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState<number>(8.0);
  const [editComment, setEditComment] = useState<string>("");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Student reports cache per placement
  const [reportsCache, setReportsCache] = useState<Record<string, ReportRecord[]>>({});
  const [loadingReportsId, setLoadingReportsId] = useState<string | null>(null);

  // Close popovers on click outside
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

  // Fetch semesters
  useEffect(() => {
    semestersApi
      .list({ limit: 100 })
      .then((res) => {
        setSemesters(res.items);
        const def = findDefaultSemester(res.items, "COMPANY");
        if (def) setSelectedSemesterId(def.id);
      })
      .catch(() => {});
  }, []);

  // Filter by semester
  const semesterPlacements = useMemo(
    () =>
      evaluable.filter(
        (placement) =>
          !selectedSemesterId ||
          selectedSemesterId === "ALL" ||
          placement.semester.id === selectedSemesterId,
      ),
    [evaluable, selectedSemesterId],
  );

  // Summary Metrics
  const stats = useMemo(() => {
    const total = semesterPlacements.length;
    let evaluated = 0;
    let totalScore = 0;
    let withCert = 0;

    for (const p of semesterPlacements) {
      const ev = evaluations.find(
        (e) => e.placementId === p.id && e.type === "COMPANY",
      );
      if (ev) {
        evaluated++;
        totalScore += ev.score;
        if (ev.certificateFileId || ev.certificateFile) {
          withCert++;
        }
      }
    }

    const pending = total - evaluated;
    const avgScore = evaluated > 0 ? (totalScore / evaluated).toFixed(1) : null;

    return { total, evaluated, pending, avgScore, withCert };
  }, [semesterPlacements, evaluations]);

  // Apply Search, Status Filter & Sorting
  const filteredPlacements = useMemo(() => {
    let result = semesterPlacements.filter((p) => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const studentName = (p.student?.fullName || "").toLowerCase();
        const studentCode = (p.student?.studentCode || "").toLowerCase();
        const major = (p.student?.major || "").toLowerCase();
        const internshipTitle = (p.internship?.title || "").toLowerCase();
        if (
          !studentName.includes(q) &&
          !studentCode.includes(q) &&
          !major.includes(q) &&
          !internshipTitle.includes(q)
        ) {
          return false;
        }
      }

      // Status Filter
      const ev = evaluations.find(
        (e) => e.placementId === p.id && e.type === "COMPANY",
      );

      if (filterStatus === "NOT_EVALUATED") {
        return !ev;
      }
      if (filterStatus === "EVALUATED") {
        return !!ev;
      }
      if (filterStatus === "HAS_CERT") {
        return !!(ev?.certificateFileId || ev?.certificateFile);
      }
      if (filterStatus === "COMPLETED") {
        return p.status === "COMPLETED";
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      const evA = evaluations.find(
        (e) => e.placementId === a.id && e.type === "COMPANY",
      );
      const evB = evaluations.find(
        (e) => e.placementId === b.id && e.type === "COMPANY",
      );

      switch (sortBy) {
        case "NAME_ASC":
          return (a.student?.fullName || "").localeCompare(
            b.student?.fullName || "",
            "vi",
          );
        case "NAME_DESC":
          return (b.student?.fullName || "").localeCompare(
            a.student?.fullName || "",
            "vi",
          );
        case "SCORE_DESC": {
          const scoreA = evA?.score ?? -1;
          const scoreB = evB?.score ?? -1;
          return scoreB - scoreA;
        }
        case "SCORE_ASC": {
          const scoreA = evA?.score ?? 999;
          const scoreB = evB?.score ?? 999;
          return scoreA - scoreB;
        }
        case "DATE_DESC":
        default:
          return (
            new Date(b.startDate || "").getTime() -
            new Date(a.startDate || "").getTime()
          );
      }
    });

    return result;
  }, [semesterPlacements, searchTerm, filterStatus, sortBy, evaluations]);

  // Reset pagination on filter change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterStatus, sortBy, selectedSemesterId]);

  // Pagination slice
  const totalPages = Math.ceil(filteredPlacements.length / itemsPerPage);
  const paginatedPlacements = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredPlacements.slice(start, start + itemsPerPage);
  }, [filteredPlacements, page, itemsPerPage]);

  // Load reports for a student
  const loadReportsForPlacement = async (pId: string) => {
    if (reportsCache[pId]) return;
    setLoadingReportsId(pId);
    try {
      const res = await reportsApi.company({ placementId: pId, limit: 100 });
      setReportsCache((prev) => ({ ...prev, [pId]: res.items }));
    } catch {
      setReportsCache((prev) => ({ ...prev, [pId]: [] }));
    } finally {
      setLoadingReportsId(null);
    }
  };

  // Toggle row expand
  const toggleExpand = (placement: PlacementRecord) => {
    if (expandedPlacementId === placement.id) {
      setExpandedPlacementId(null);
    } else {
      setExpandedPlacementId(placement.id);
      const existing = evaluations.find(
        (e) => e.placementId === placement.id && e.type === "COMPANY",
      );
      setEditScore(existing?.score ?? 8.0);
      setEditComment(existing?.comment ?? "");
      setCertificateFile(null);
      void loadReportsForPlacement(placement.id);
    }
  };

  // Submit evaluation
  const handleSaveEvaluation = async (placement: PlacementRecord) => {
    if (placement.status === "COMPLETED") return;
    setSavingId(placement.id);
    try {
      const uploadedCertId = certificateFile
        ? (await uploadPrivateFile(certificateFile, "CERTIFICATE")).id
        : undefined;

      const existing = evaluations.find(
        (item) => item.placementId === placement.id && item.type === "COMPANY",
      );

      if (existing) {
        await onUpdate(existing.id, {
          score: editScore,
          comment: editComment,
          ...(uploadedCertId ? { certificateFileId: uploadedCertId } : {}),
        });
      } else {
        await onSubmit({
          placementId: placement.id,
          score: editScore,
          comment: editComment,
          ...(uploadedCertId ? { certificateFileId: uploadedCertId } : {}),
        });
      }
      setCertificateFile(null);
      setSaveSuccessId(placement.id);
      setTimeout(() => setSaveSuccessId(null), 3000);
    } finally {
      setSavingId(null);
    }
  };

  // Export Excel
  const exportCompanyEvaluationsExcel = () => {
    const currentSem = semesters.find((s) => s.id === selectedSemesterId);
    const semLabel = currentSem ? currentSem.name : "Tất cả học kỳ";
    const fileSlug = currentSem ? toSemesterSlug(currentSem.name) : "tat-ca-hoc-ky";
    downloadExcelWorkbook(`danh-gia-thuc-tap-sinh-${fileSlug}`, [
      {
        name: "Danh gia thuc tap",
        title: `BẢNG ĐÁNH GIÁ THỰC TẬP SINH DOANH NGHIỆP — ${semLabel.toUpperCase()}`,
        subtitle: `Học kỳ: ${semLabel} — Ngày xuất: ${new Date().toLocaleDateString("vi-VN")} — Tổng số: ${semesterPlacements.length} thực tập sinh`,
        columns: [
          { header: "STT", width: 45, value: (_: any, i: number) => i + 1 },
          { header: "MSSV", width: 105, value: (p: any) => p.student.studentCode },
          { header: "Họ và tên", width: 165, value: (p: any) => p.student.fullName },
          { header: "Ngành đào tạo", width: 165, value: (p: any) => p.student.major },
          { header: "Vị trí thực tập", width: 170, value: (p: any) => p.internship.title },
          { header: "Học kỳ", width: 140, value: (p: any) => p.semester.name },
          {
            header: "Điểm DN",
            width: 90,
            value: (p: any) => {
              const ev = evaluations.find(
                (e) => e.placementId === p.id && e.type === "COMPANY",
              );
              return ev ? ev.score : "Chưa chấm";
            },
          },
          {
            header: "Nhận xét",
            width: 200,
            value: (p: any) => {
              const ev = evaluations.find(
                (e) => e.placementId === p.id && e.type === "COMPANY",
              );
              return ev ? ev.comment : "—";
            },
          },
          {
            header: "Trạng thái",
            width: 120,
            value: (p: any) =>
              p.status === "COMPLETED" ? "Đã hoàn tất" : "Đang thực tập",
          },
        ],
        rows: semesterPlacements,
      },
    ]);
  };

  const currentSelectedSemester = semesters.find((s) => s.id === selectedSemesterId);
  const semesterDisplayLabel = currentSelectedSemester
    ? currentSelectedSemester.name.replace(/\s*\[.*?\]/g, "").trim()
    : "Tất cả học kỳ";

  return (
    <div className="space-y-6">
      {/* 1. HEADER CARD (Đồng bộ chuẩn thiết kế CareerBridge) */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-[#f8fafd] p-4 sm:p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="!text-xl sm:!text-2xl font-extrabold text-[#006f72] tracking-tight">
              Đánh giá Thực tập sinh
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Chấm điểm tổng kết, nhận xét quá trình làm việc và đính kèm tệp Chứng nhận thực tập (nếu có) cho sinh viên.
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
            {semesterPlacements.length > 0 && (
              <button
                type="button"
                onClick={exportCompanyEvaluationsExcel}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#e0f4f6] border border-[#b8e6ea] px-3.5 py-1.5 text-xs font-bold text-teal-800 transition hover:bg-teal-100 shadow-2xs cursor-pointer"
                title="Xuất bảng điểm Excel danh sách thực tập sinh"
              >
                <Download className="h-3.5 w-3.5 text-[#02636a]" />
                <span className="hidden sm:inline">Xuất bảng điểm</span>
              </button>
            )}
          </div>
        </div>

        {/* Bento KPI Metrics Grid */}
        <div className="mt-5 pt-4 border-t border-slate-200/70 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                TỔNG THỰC TẬP SINH
              </span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tracking-tight">
                {stats.total}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Đủ điều kiện đánh giá
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#006f72] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                ĐÃ ĐÁNH GIÁ
              </span>
              <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1 tracking-tight">
                {stats.evaluated}
              </div>
              <p className="text-[11px] text-emerald-600 mt-0.5">
                {stats.total > 0
                  ? `${Math.round((stats.evaluated / stats.total) * 100)}% hoàn thành`
                  : "0%"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                CHỜ ĐÁNH GIÁ
              </span>
              <div className="text-xl sm:text-2xl font-bold text-amber-900 mt-1 tracking-tight">
                {stats.pending}
              </div>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Cần chấm điểm tổng kết
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                ĐIỂM TRUNG BÌNH
              </span>
              <div className="text-xl sm:text-2xl font-bold text-indigo-700 mt-1 tracking-tight">
                {stats.avgScore ? `${stats.avgScore}/10` : "—"}
              </div>
              <p className="text-[11px] text-indigo-600 mt-0.5">
                {stats.withCert > 0 ? `${stats.withCert} có chứng nhận` : "Thang điểm 10"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên thực tập sinh, MSSV, vị trí, chuyên ngành..."
                className="w-full pl-10 pr-9 py-2 rounded-2xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Lọc Trạng thái đánh giá */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setOpenDropdown(openDropdown === "status" ? null : "status")
                  }
                  className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition cursor-pointer shadow-2xs ${
                    filterStatus !== "ALL"
                      ? "border-[#038b95] bg-[#e0f4f6] text-[#02636a]"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>
                    {filterStatus === "ALL" && "Tất cả trạng thái"}
                    {filterStatus === "NOT_EVALUATED" && "Chưa đánh giá"}
                    {filterStatus === "EVALUATED" && "Đã đánh giá"}
                    {filterStatus === "HAS_CERT" && "Đã có chứng nhận"}
                    {filterStatus === "COMPLETED" && "Đã hoàn tất kỳ"}
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
                      { value: "NOT_EVALUATED", label: "Chưa đánh giá" },
                      { value: "EVALUATED", label: "Đã đánh giá" },
                      { value: "HAS_CERT", label: "Đã có chứng nhận" },
                      { value: "COMPLETED", label: "Đã hoàn tất kỳ" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setFilterStatus(opt.value as FilterStatus);
                          setOpenDropdown(null);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer ${
                          filterStatus === opt.value
                            ? "bg-[#e0f4f6] font-extrabold text-[#02636a]"
                            : "font-medium text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {filterStatus === opt.value && (
                          <Check className="h-3.5 w-3.5 text-[#038b95]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sắp xếp */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setOpenDropdown(openDropdown === "sort" ? null : "sort")
                  }
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                >
                  <span className="text-slate-500 font-normal">Sắp xếp:</span>
                  <span>
                    {sortBy === "NAME_ASC" && "Họ tên A-Z"}
                    {sortBy === "NAME_DESC" && "Họ tên Z-A"}
                    {sortBy === "SCORE_DESC" && "Điểm cao nhất"}
                    {sortBy === "SCORE_ASC" && "Điểm thấp nhất"}
                    {sortBy === "DATE_DESC" && "Mới nhất"}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                      openDropdown === "sort" ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openDropdown === "sort" && (
                  <div className="absolute right-0 top-full mt-1.5 z-40 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    {[
                      { value: "NAME_ASC", label: "Họ tên A-Z" },
                      { value: "NAME_DESC", label: "Họ tên Z-A" },
                      { value: "SCORE_DESC", label: "Điểm cao nhất" },
                      { value: "SCORE_ASC", label: "Điểm thấp nhất" },
                      { value: "DATE_DESC", label: "Mới nhất" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSortBy(opt.value as SortOption);
                          setOpenDropdown(null);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer ${
                          sortBy === opt.value
                            ? "bg-[#e0f4f6] font-extrabold text-[#02636a]"
                            : "font-medium text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {sortBy === opt.value && (
                          <Check className="h-3.5 w-3.5 text-[#038b95]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reset filter nếu có */}
              {(filterStatus !== "ALL" || searchTerm.trim() !== "") && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus("ALL");
                    setSearchTerm("");
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

        {/* ROW 2: BẢNG BẢN GHI THỰC TẬP SINH */}
        {filteredPlacements.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">
              Không tìm thấy thực tập sinh nào
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Hãy điều chỉnh từ khóa tìm kiếm hoặc chọn học kỳ khác.
            </p>
            {(filterStatus !== "ALL" || searchTerm.trim() !== "") && (
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("ALL");
                  setSearchTerm("");
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
                  <th className="py-3.5 pl-6 pr-4 min-w-[260px]">Thực tập sinh</th>
                  <th className="py-3.5 px-4 min-w-[230px]">Vị trí & Thời gian</th>
                  <th className="py-3.5 px-4 min-w-[130px] text-center">Báo cáo tuần</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Đánh giá của DN</th>
                  <th className="py-3.5 pl-4 pr-6 text-right min-w-[160px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedPlacements.map((placement) => {
                  const isExpanded = expandedPlacementId === placement.id;
                  const evaluation = evaluations.find(
                    (e) => e.placementId === placement.id && e.type === "COMPANY",
                  );
                  const isLocked = placement.status === "COMPLETED";
                  const avatarColor = getAvatarColor(placement.student.fullName);
                  const initials = getInitials(placement.student.fullName);
                  const cachedReports = reportsCache[placement.id] ?? [];
                  const weeklyReports = cachedReports.filter((r) => r.week > 0);
                  const hasAll10WeeklyReports = weeklyReports.length >= 10;
                  const isEvaluationDisabled =
                    isLocked ||
                    loadingReportsId === placement.id ||
                    !hasAll10WeeklyReports;

                  return (
                    <React.Fragment key={placement.id}>
                      <tr
                        className={`transition-colors hover:bg-slate-50/80 cursor-pointer ${
                          isExpanded ? "bg-[#f4fafb]" : ""
                        }`}
                        onClick={() => toggleExpand(placement)}
                      >
                        {/* 1. Thực tập sinh */}
                        <td className="py-4 pl-6 pr-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-xs font-extrabold shadow-2xs ${avatarColor}`}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold text-sm text-slate-900 truncate">
                                {placement.student.fullName}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                <span className="font-semibold text-slate-700">
                                  {placement.student.studentCode}
                                </span>
                                <span>•</span>
                                <span className="truncate">{placement.student.major}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Vị trí & Thời gian */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-800 line-clamp-1">
                            {placement.internship.title}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>
                              {formatDate(placement.startDate)} –{" "}
                              {formatDate(placement.endDate)}
                            </span>
                          </div>
                          <div className="mt-1">
                            {isLocked ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                <CheckCircle2 className="w-3 h-3 text-slate-400" /> Đã hoàn tất
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                                Đang thực tập
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Báo cáo tuần */}
                        <td className="py-4 px-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(placement);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs"
                            title="Bấm để xem danh sách báo cáo tuần"
                          >
                            <FileText className="w-3.5 h-3.5 text-sky-600" />
                            <span>
                              {reportsCache[placement.id]
                                ? `${reportsCache[placement.id].length} báo cáo`
                                : "Xem báo cáo"}
                            </span>
                          </button>
                        </td>

                        {/* 4. Đánh giá của Doanh nghiệp */}
                        <td className="py-4 px-4">
                          {evaluation ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-black text-emerald-800">
                                  <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                                  <span>{evaluation.score} / 10</span>
                                </span>
                                {(evaluation.certificateFileId ||
                                  evaluation.certificateFile) && (
                                  <span
                                    className="inline-flex items-center gap-1 rounded-md bg-teal-50 text-[10px] font-bold text-teal-800 px-1.5 py-0.5 border border-teal-200"
                                    title="Đã đính kèm tệp chứng nhận thực tập"
                                  >
                                    <FileBadge2 className="w-3 h-3 text-[#038b95]" />
                                    Chứng nhận
                                  </span>
                                )}
                              </div>
                              {evaluation.comment && (
                                <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                                  &ldquo;{evaluation.comment}&rdquo;
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200/70 px-2.5 py-1 text-xs font-bold text-amber-800">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Chưa đánh giá</span>
                            </span>
                          )}
                        </td>

                        {/* 5. Thao tác */}
                        <td className="py-4 pl-4 pr-6 text-right">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => toggleExpand(placement)}
                              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer shadow-2xs ${
                                evaluation
                                  ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                                  : "bg-[#038b95] text-white hover:bg-[#026f77]"
                              }`}
                            >
                              {evaluation ? (
                                <>
                                  <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Chỉnh sửa</span>
                                </>
                              ) : (
                                <>
                                  <Award className="w-3.5 h-3.5 text-teal-100" />
                                  <span>Đánh giá</span>
                                </>
                              )}
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* HÀNG MỞ RỘNG (ACCORDION DETAIL: FORM ĐÁNH GIÁ & BÁO CÁO TUẦN) */}
                      {isExpanded && (
                        <tr className="bg-[#f8fcfe] border-b border-slate-200">
                          <td colSpan={5} className="p-4 sm:p-6">
                            <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
                              {/* CỘT TRÁI: FORM CHẤM ĐIỂM & NHẬN XÉT CỦA DOANH NGHIỆP */}
                              <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-[#038b95]">
                                      <Award className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-black text-slate-900">
                                        Đánh giá kết quả thực tập
                                      </h4>
                                      <p className="text-[11px] text-slate-500">
                                        Sinh viên: <b>{placement.student.fullName}</b> (
                                        {placement.student.studentCode})
                                      </p>
                                    </div>
                                  </div>

                                  {evaluation && (
                                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-800">
                                      Đã chấm {evaluation.score}/10
                                    </span>
                                  )}
                                </div>

                                {/* Quick score buttons & Input score */}
                                <div>
                                  <label className="block text-xs font-bold text-slate-700">
                                    Điểm đánh giá doanh nghiệp (0 – 10){" "}
                                    <span className="text-rose-500">*</span>
                                  </label>

                                  <div className="mt-2 flex items-center gap-3">
                                    <input
                                      disabled={isEvaluationDisabled}
                                      required
                                      type="number"
                                      min="0"
                                      max="10"
                                      step="0.1"
                                      value={editScore}
                                      onChange={(e) =>
                                        setEditScore(Number(e.target.value))
                                      }
                                      className="w-28 rounded-xl border border-slate-300 p-2.5 text-base font-black text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 text-center disabled:bg-slate-100 disabled:text-slate-400"
                                    />
                                    {/* Nút chọn điểm nhanh */}
                                    {!isEvaluationDisabled && (
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        {QUICK_SCORES.map((s) => (
                                          <button
                                            key={s}
                                            type="button"
                                            onClick={() => setEditScore(s)}
                                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                                              editScore === s
                                                ? "bg-[#038b95] text-white shadow-2xs"
                                                : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                            }`}
                                          >
                                            {s.toFixed(1)}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Nhận xét textarea */}
                                <div>
                                  <label className="block text-xs font-bold text-slate-700">
                                    Nhận xét của doanh nghiệp{" "}
                                    <span className="text-rose-500">*</span>
                                  </label>
                                  <textarea
                                    disabled={isEvaluationDisabled}
                                    required
                                    rows={4}
                                    value={editComment}
                                    onChange={(e) => setEditComment(e.target.value)}
                                    placeholder="Nhận xét về thái độ làm việc, kỹ năng chuyên môn, tinh thần học hỏi và kết quả thực tập của sinh viên..."
                                    className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-100 disabled:text-slate-400"
                                  />
                                </div>

                                {/* Đính kèm tệp Chứng nhận thực tập */}
                                <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                                    <FileBadge2 className="h-4 w-4 text-[#038b95]" />
                                    <span>Tệp Chứng nhận thực tập (PDF, PNG, JPG · Tùy chọn)</span>
                                  </div>
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    className="hidden"
                                    onChange={(e) =>
                                      setCertificateFile(e.target.files?.[0] ?? null)
                                    }
                                  />

                                  <div className="flex flex-wrap items-center gap-2 pt-1">
                                    {!isEvaluationDisabled && (
                                      <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
                                      >
                                        <Upload className="h-3.5 w-3.5" />
                                        {certificateFile
                                          ? `${certificateFile.name} (${formatFileSize(certificateFile.size)})`
                                          : evaluation?.certificateFile
                                          ? "Đổi tệp chứng nhận"
                                          : "Tải lên tệp chứng nhận"}
                                      </button>
                                    )}

                                    {certificateFile && (
                                      <button
                                        type="button"
                                        onClick={() => setCertificateFile(null)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                                        title="Hủy tệp vừa chọn"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    )}

                                    {evaluation?.certificateFile && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void downloadPrivateFile(
                                            evaluation.certificateFile!.id,
                                          )
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#e0f4f6] border border-[#b8e6ea] px-3.5 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 transition shadow-2xs cursor-pointer"
                                      >
                                        <Download className="h-3.5 w-3.5 text-[#02636a]" />
                                        <span>{evaluation.certificateFile.originalName}</span>
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {!isLocked &&
                                  loadingReportsId !== placement.id &&
                                  !hasAll10WeeklyReports && (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                                      Chỉ có thể đánh giá khi sinh viên đã nộp đủ{" "}
                                      <b>10 tuần báo cáo thực tập</b> (hiện đã nộp{" "}
                                      <b>{weeklyReports.length}/10 tuần</b>).
                                    </div>
                                  )}

                                {evaluation && (
                                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-500">
                                    <UserRound className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>
                                      Người đánh giá gần nhất: <b>{evaluation.evaluator.email}</b>
                                    </span>
                                  </div>
                                )}

                                {saveSuccessId === placement.id && (
                                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    Đã lưu kết quả đánh giá thành công!
                                  </div>
                                )}

                                {!isLocked ? (
                                  <div className="flex items-center gap-3 pt-1">
                                    <button
                                      type="button"
                                      disabled={
                                        savingId === placement.id ||
                                        isEvaluationDisabled
                                      }
                                      title={
                                        !hasAll10WeeklyReports
                                          ? `Sinh viên cần nộp đủ 10 tuần báo cáo trước khi đánh giá (${weeklyReports.length}/10 tuần)`
                                          : undefined
                                      }
                                      onClick={() => void handleSaveEvaluation(placement)}
                                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#038b95] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#026f77] disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                      <Save className="h-4 w-4" />
                                      {savingId === placement.id
                                        ? "Đang lưu đánh giá..."
                                        : evaluation
                                        ? "Cập nhật đánh giá"
                                        : "Lưu đánh giá"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedPlacementId(null)}
                                      className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold cursor-pointer"
                                    >
                                      Đóng
                                    </button>
                                  </div>
                                ) : (
                                  <p className="rounded-xl bg-slate-100 p-3 text-center text-xs font-semibold text-slate-600">
                                    Hồ sơ thực tập đã hoàn tất, không thể chỉnh sửa điểm.
                                  </p>
                                )}
                              </div>

                              {/* CỘT PHẢI: BÁO CÁO CỦA THỰC TẬP SINH */}
                              <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                  <div>
                                    <h4 className="text-sm font-black text-slate-900">
                                      Báo cáo của thực tập sinh
                                    </h4>
                                    <p className="text-[11px] text-slate-500">
                                      Báo cáo tuần & báo cáo tổng kết cuối kỳ
                                    </p>
                                  </div>
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                    {reportsCache[placement.id]?.length ?? 0} báo cáo
                                  </span>
                                </div>

                                {loadingReportsId === placement.id ? (
                                  <p className="py-12 text-center text-xs text-slate-500">
                                    Đang tải dữ liệu báo cáo...
                                  </p>
                                ) : !reportsCache[placement.id] ||
                                  reportsCache[placement.id].length === 0 ? (
                                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                                    Sinh viên chưa nộp báo cáo nào trong kỳ thực tập này.
                                  </div>
                                ) : (
                                  <div className="max-h-[380px] space-y-3 overflow-y-auto pr-1">
                                    {reportsCache[placement.id].map((report) => (
                                      <div
                                        key={report.id}
                                        className={`rounded-2xl border p-3.5 text-xs ${
                                          report.week === 0
                                            ? "border-indigo-200 bg-indigo-50/40"
                                            : "border-slate-200 bg-slate-50/60"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="font-extrabold text-slate-900">
                                            {report.week === 0
                                              ? "★ Báo cáo tổng kết cuối kỳ"
                                              : `Tuần ${report.week}: ${
                                                  report.title || "Báo cáo tuần"
                                                }`}
                                          </span>
                                          <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                              report.status === "APPROVED"
                                                ? "bg-emerald-100 text-emerald-800"
                                                : report.status === "REJECTED"
                                                ? "bg-rose-100 text-rose-800"
                                                : "bg-amber-100 text-amber-800"
                                            }`}
                                          >
                                            {report.status === "APPROVED"
                                              ? "Đã duyệt"
                                              : report.status === "REJECTED"
                                              ? "Cần sửa"
                                              : "Chờ duyệt"}
                                          </span>
                                        </div>
                                        <p className="mt-2 whitespace-pre-line text-slate-700 leading-5">
                                          {report.content}
                                        </p>
                                        {report.file && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              void downloadPrivateFile(report.file!.id)
                                            }
                                            className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                                          >
                                            <FileText className="h-3.5 w-3.5 text-blue-600" />
                                            Tải tệp: {report.file.originalName}
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
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
              Tổng: <strong className="text-slate-700">{filteredPlacements.length}</strong> thực tập sinh
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
}
