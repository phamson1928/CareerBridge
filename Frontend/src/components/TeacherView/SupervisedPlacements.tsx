import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Download,
  LoaderCircle,
  MapPin,
  Search,
  UsersRound,
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

const supervisionStatusLabel: Record<SupervisionRecord["status"], string> = {
  ACTIVE: "Đang hướng dẫn",
  COMPLETED: "Đã hoàn tất",
  CANCELLED: "Đã hủy",
};

export const SupervisedPlacements: React.FC = () => {
  const [items, setItems] = useState<SupervisionRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [semesters, setSemesters] = useState<SemesterRecord[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const distinctMajors = Array.from(
    new Set(items.map((item) => item.placement.student.major).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
  const filtered = items.filter((item) => {
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
    const matchesSemester =
      !selectedSemesterId ||
      selectedSemesterId === "ALL" ||
      item.placement.semester.id === selectedSemesterId;
    return matchesKeyword && matchesMajor && matchesSemester;
  });

  const exportListExcel = () => {
    const currentSem = semesters.find((s) => s.id === selectedSemesterId);
    const semLabel = currentSem ? currentSem.name : "Tất cả học kỳ";
    const fileSlug = currentSem ? toSemesterSlug(currentSem.name) : "tat-ca-hoc-ky";
    downloadExcelWorkbook(`danh-sach-sinh-vien-${fileSlug}`, [
      {
        name: "Sinh vien phu trach",
        title: `DANH SÁCH SINH VIÊN THỰC TẬP — ${semLabel.toUpperCase()}`,
        subtitle: `Học kỳ: ${semLabel} — Ngày xuất: ${new Date().toLocaleDateString("vi-VN")} — Tổng số: ${filtered.length} sinh viên`,
        columns: [
          { header: "STT", width: 45, value: (_, i) => i + 1 },
          { header: "MSSV", width: 105, value: (s) => s.placement.student.studentCode },
          { header: "Họ và tên", width: 165, value: (s) => s.placement.student.fullName },
          { header: "Ngành đào tạo", width: 175, value: (s) => s.placement.student.major },
          { header: "Khoa", width: 165, value: (s) => s.placement.student.faculty?.name ?? "—" },
          { header: "Doanh nghiệp thực tập", width: 190, value: (s) => s.placement.company.companyName },
          { header: "Vị trí thực tập", width: 170, value: (s) => s.placement.internship.title },
          { header: "Học kỳ", width: 140, value: (s) => s.placement.semester.name },
          { header: "Số báo cáo đã nộp", width: 120, value: (s) => s.placement._count.reports },
          { header: "Số đánh giá", width: 105, value: (s) => s.placement._count.evaluations },
          { header: "Trạng thái hướng dẫn", width: 130, value: (s) => supervisionStatusLabel[s.status] },
        ],
        rows: filtered,
      },
    ]);
  };

  return (
    <section className="space-y-6">
      {/* Modern Clean SaaS Page Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-800 mb-2">
            <ClipboardCheck className="h-3.5 w-3.5 text-teal-600" /> Theo dõi & Hướng dẫn học vụ
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Sinh Viên Đang Phụ Trách
          </h1>
          <p className="mt-1 max-w-xl text-xs sm:text-sm text-slate-500">
            Danh sách sinh viên thực tập được phân công theo dõi, rà soát nhật ký và hướng dẫn học phần.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-xl bg-teal-50 border border-teal-200 px-3 py-2 text-xs font-bold text-teal-800 shadow-2xs">
            <UsersRound className="h-4 w-4 text-teal-600" />{" "}
            {items.filter((item) => item.status === "ACTIVE").length} sinh viên đang hoạt động
          </div>
          {filtered.length > 0 && (
            <button
              type="button"
              onClick={exportListExcel}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-teal-300 hover:text-teal-800 active:scale-95 transition-all"
            >
              <Download className="h-4 w-4" /> Xuất danh sách Excel
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs sm:grid-cols-[1fr_200px_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm sinh viên, mã số, ngành, vị trí hoặc doanh nghiệp..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all"
          />
        </div>
        <select
          value={selectedMajor}
          onChange={(event) => setSelectedMajor(event.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:bg-white transition-all"
        >
          <option value="">Tất cả ngành ({distinctMajors.length})</option>
          {distinctMajors.map((major) => (
            <option key={major} value={major}>
              {major}
            </option>
          ))}
        </select>
        <select
          value={selectedSemesterId}
          onChange={(event) => setSelectedSemesterId(event.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:bg-white font-medium text-slate-800 transition-all"
        >
          <option value="ALL">Tất cả học kỳ</option>
          {semesters.map((sem) => (
            <option key={sem.id} value={sem.id}>
              {sem.name} ({sem.status})
            </option>
          ))}
        </select>
      </div>
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="mr-2 inline h-4 w-4" />
          {error}
        </div>
      )}
      {loading ? (
        <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
          Đang tải danh sách...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <UsersRound className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-black text-slate-700">
            Chưa có sinh viên phù hợp
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Các hồ sơ thực tập được quản trị viên phân công cho bạn sẽ xuất hiện
            tại đây.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2 bento-stagger">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-teal-300 card-interactive"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ProfileAvatarPreview
                    fileId={item.placement.student.avatarFileId}
                    fallback={item.placement.student.fullName.charAt(0)}
                    className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-teal-50 border border-teal-100 text-lg font-black text-teal-700 shadow-2xs"
                    imageClassName="h-full w-full object-cover"
                  />
                  <div>
                    <h2 className="font-black text-slate-900">
                      {item.placement.student.fullName}
                    </h2>
                    <p className="mt-1 font-mono text-[10px] text-slate-500">
                      {item.placement.student.studentCode} ·{" "}
                      {item.placement.student.major}
                      {item.placement.student.faculty?.name
                        ? ` (${item.placement.student.faculty.name})`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${item.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"}`}
                  >
                    {supervisionStatusLabel[item.status]}
                  </span>
                  {item.placement.student.faculty?.id &&
                    item.lecturer.facultyId &&
                    item.placement.student.faculty.id !==
                      item.lecturer.facultyId && (
                      <span className="rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                        Hướng dẫn liên khoa
                      </span>
                    )}
                </div>
              </div>
              <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-xs text-slate-600">
                <p className="flex items-center gap-2">
                  <BriefcaseBusiness className="h-4 w-4 text-teal-700" />
                  {item.placement.internship.title}
                </p>
                <p className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-teal-700" />
                  {item.placement.company.companyName}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-teal-700" />
                  {item.placement.internship.location ??
                    "Chưa cập nhật địa điểm"}
                </p>
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-teal-700" />
                  {item.placement.semester.name} ·{" "}
                  {formatDate(item.placement.semester.startDate)} —{" "}
                  {formatDate(item.placement.semester.endDate)}
                </p>
              </div>
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px] text-slate-600">
                <p>
                  Phân công lúc:{" "}
                  <span className="font-semibold text-slate-800">
                    {formatDateTime(item.assignedAt)}
                  </span>
                </p>
                <p className="mt-1">
                  Người phân công:{" "}
                  <span className="font-semibold text-slate-800">
                    {item.assignedBy?.email ?? "Tài khoản đã bị xóa"}
                  </span>
                </p>
                <p
                  className="mt-1 truncate font-mono"
                  title={item.assignedById ?? undefined}
                >
                  Mã người phân công: {item.assignedById ?? "—"}
                </p>
                <p className="mt-1">
                  Hoàn tất lúc:{" "}
                  <span className="font-semibold text-slate-800">
                    {formatDateTime(item.completedAt, "Chưa hoàn tất")}
                  </span>
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Báo cáo
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-800">
                    {item.placement._count.reports}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Đánh giá
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-800">
                    {item.placement._count.evaluations}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
