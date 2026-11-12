import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  LoaderCircle,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { placementsApi } from "../../placements/api";
import type {
  AcademicMonitoringStatus,
  PlacementRecord,
  PlacementStatus,
} from "../../placements/types";
import { formatDate, formatDateTime } from "../../utils/format";
import { ProfileAvatarPreview } from "../ProfileAvatarUpload";

const placementStatusLabel: Record<PlacementStatus, string> = {
  PENDING: "Chờ bắt đầu",
  ACTIVE: "Đang thực tập",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
};

const academicStatusLabel: Record<AcademicMonitoringStatus, string> = {
  PENDING: "Chờ phân công GVHD",
  ACTIVE: "Đang được nhà trường theo dõi",
  CLOSED: "Đã nghiệm thu học phần",
  CANCELLED: "Đã hủy theo dõi",
};

const workTypeLabel: Record<string, string> = {
  ONSITE: "Toàn thời gian (Tại công ty)",
  Onsite: "Toàn thời gian (Tại công ty)",
  REMOTE: "Làm việc từ xa (Remote)",
  Remote: "Làm việc từ xa (Remote)",
  HYBRID: "Kết hợp linh hoạt (Hybrid)",
  Hybrid: "Kết hợp linh hoạt (Hybrid)",
  "Full-time": "Toàn thời gian (On-site)",
  "Part-time": "Bán thời gian (Part-time)",
};

const MAX_INTERNSHIP_WEEKS = 10;

function getPlacementTimeline(startDateStr: string | null, endDateStr: string | null) {
  if (!startDateStr || !endDateStr) {
    return {
      totalWeeks: MAX_INTERNSHIP_WEEKS,
      currentWeek: 0,
      daysLeft: null,
      percent: 0,
      isFinished: false,
    };
  }
  const start = new Date(startDateStr).getTime();
  const end = new Date(endDateStr).getTime();
  const now = Date.now();

  const totalMs = Math.max(1, end - start);
  const elapsedMs = Math.max(0, now - start);

  const totalDays = Math.round(totalMs / (1000 * 60 * 60 * 24));
  // Chuẩn hóa theo khung học phần thực tập tối đa 10 tuần
  const totalWeeks = Math.min(
    MAX_INTERNSHIP_WEEKS,
    Math.max(1, Math.round(totalDays / 7)),
  );

  const elapsedDays = Math.ceil(elapsedMs / (1000 * 60 * 60 * 24));
  const currentWeek = Math.min(totalWeeks, Math.max(1, Math.ceil(elapsedDays / 7)));

  const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  const percent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));
  const isFinished = now > end;

  return { totalWeeks, currentWeek, daysLeft, percent, isFinished };
}

interface PlacementOverviewProps {
  onNavigateTab?: (tab: string) => void;
  onOpenChat?: () => void;
}

export const PlacementOverview: React.FC<PlacementOverviewProps> = ({
  onNavigateTab,
  onOpenChat,
}) => {
  const [placements, setPlacements] = useState<PlacementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void placementsApi
      .listMine()
      .then((result) => setPlacements(result.items))
      .catch((requestError) => setError(getApiErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex min-h-72 items-center justify-center text-sm text-slate-500">
        <LoaderCircle className="mr-2 h-5 w-5 animate-spin text-teal-600" />
        Đang tải thông tin thực tập...
      </div>
    );

  if (error)
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
        <AlertCircle className="mr-2 inline h-4 w-4" />
        {error}
      </div>
    );

  return (
    <section className="space-y-6 w-full">
      {/* Centered Open Typography Header */}
      <div className="text-center max-w-2xl mx-auto pt-2 pb-5 sm:pt-4 sm:pb-7 space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
          Hồ Sơ Thực Tập
        </h1>
        <p className="text-sm sm:text-base text-slate-500 font-normal leading-relaxed">
          Thông tin đơn vị tiếp nhận, lịch trình làm việc và giảng viên hướng dẫn phụ trách.
        </p>
      </div>

      {placements.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-xs">
          <BriefcaseBusiness className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-base font-black text-slate-800">
            Chưa có hồ sơ thực tập
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Sau khi doanh nghiệp chấp nhận đơn ứng tuyển và bạn xác nhận nhận lời mời,
            hồ sơ thực tập chính thức sẽ được hiển thị tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-6 w-full">
          {placements.map((placement) => {
            const timeline = getPlacementTimeline(placement.startDate, placement.endDate);
            const progress = placement.progress;

            return (
              <article
                key={placement.id}
                className="w-full rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md hover:border-teal-300"
              >
                {/* Top decorative gradient line */}
                <div
                  className={`h-2 w-full ${
                    placement.status === "ACTIVE"
                      ? "bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600"
                      : placement.status === "PENDING"
                        ? "bg-amber-400"
                        : "bg-slate-400"
                  }`}
                />

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Row 1: Header - Title, Semester, Status Badges */}
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between pb-6 border-b border-slate-100 text-center lg:text-left">
                    <div className="space-y-1.5 flex flex-col items-center lg:items-start">
                      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                        <span className="rounded-full bg-teal-50 border border-teal-200 px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-teal-800">
                          {placement.semester.name}
                        </span>
                        {placement.internship.department && (
                          <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-0.5 text-[11px] font-bold text-slate-600">
                            Phòng ban: {placement.internship.department}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {placement.internship.title}
                      </h2>
                      <p className="text-sm font-semibold text-teal-700 flex items-center justify-center lg:justify-start gap-1.5 pt-0.5">
                        <Building2 className="h-4 w-4 shrink-0" />
                        {placement.company.companyName}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center lg:items-end gap-2 shrink-0 self-center lg:self-auto">
                      <span
                        className={`rounded-full px-3.5 py-1 text-xs font-bold border ${
                          placement.status === "ACTIVE"
                            ? "bg-teal-50 text-teal-800 border-teal-200"
                            : placement.status === "PENDING"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        Công việc: {placementStatusLabel[placement.status]}
                      </span>
                      <span
                        className={`rounded-full px-3.5 py-1 text-xs font-bold border ${
                          placement.academicStatus === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {academicStatusLabel[placement.academicStatus]}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Timeline Progress Bar */}
                  {placement.startDate && placement.endDate && (
                    <div className="rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50/50 via-white to-slate-50 p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <CalendarDays className="h-4 w-4 text-teal-700 shrink-0" />
                          <span className="font-bold text-slate-900">
                            Thời gian thực tập: {formatDate(placement.startDate)} — {formatDate(placement.endDate)}
                          </span>
                          <span className="text-slate-400">({timeline.totalWeeks} tuần)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-teal-800">
                            {timeline.isFinished
                              ? "Đã kết thúc đợt thực tập"
                              : `Đang ở tuần ${timeline.currentWeek}/${timeline.totalWeeks}`}
                          </span>
                          {timeline.daysLeft !== null && timeline.daysLeft >= 0 && (
                            <span className="rounded-full bg-white border border-teal-200 px-2.5 py-0.5 text-[11px] font-bold text-teal-700 shadow-2xs">
                              Còn {timeline.daysLeft} ngày
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Visual progress bar */}
                      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-700"
                          style={{ width: `${timeline.percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Row 3: Bento Grid 3 Columns */}
                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Column 1: Thông tin làm việc */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
                        <Building2 className="h-4 w-4 text-teal-700" />
                        Đơn vị tiếp nhận
                      </div>
                      <div className="space-y-2.5 text-xs text-slate-700">
                        <div>
                          <p className="text-[11px] text-slate-400">Công ty:</p>
                          <p className="font-bold text-slate-900 mt-0.5">{placement.company.companyName}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-400">Địa điểm làm việc:</p>
                          <p className="font-semibold text-slate-800 mt-0.5 flex items-start gap-1">
                            <MapPin className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                            <span>{placement.internship.location ?? "Chưa cập nhật địa điểm"}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-400">Hình thức làm việc:</p>
                          <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                            <span>
                              {placement.internship.workType
                                ? workTypeLabel[placement.internship.workType] ?? placement.internship.workType
                                : "Chưa cập nhật hình thức"}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Giảng viên hướng dẫn */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
                        <GraduationCap className="h-4 w-4 text-teal-700" />
                        Giảng viên hướng dẫn
                      </div>
                      {placement.supervision ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <ProfileAvatarPreview
                              fileId={placement.supervision.lecturer.avatarFileId}
                              fallback={placement.supervision.lecturer.fullName.charAt(0)}
                              className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-teal-100 font-black text-teal-800 border border-teal-200"
                              imageClassName="h-full w-full object-cover"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-black text-slate-900 truncate">
                                {placement.supervision.lecturer.fullName}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                                {placement.supervision.lecturer.title ?? "Giảng viên"} ·{" "}
                                {placement.supervision.lecturer.faculty?.name ??
                                  placement.supervision.lecturer.department}
                              </p>
                            </div>
                          </div>
                          <div className="border-t border-slate-200/80 pt-2.5 text-[11px] text-slate-500 space-y-1">
                            <p className="flex items-center justify-between">
                              <span>Phân công:</span>
                              <span className="font-semibold text-slate-800">
                                {formatDateTime(placement.supervision.assignedAt)}
                              </span>
                            </p>
                            <p className="flex items-center gap-1 text-emerald-700 font-bold">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              Đang hướng dẫn học phần
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2.5 text-xs text-amber-800 py-3">
                          <Clock3 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">Đang chờ nhà trường phân công</p>
                            <p className="text-slate-500 mt-1">
                              Thông tin giảng viên sẽ được hiển thị ngay khi ban quản trị hoàn tất phân công.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Column 3: Tiến độ học phần & Báo cáo */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
                        <BookOpenCheck className="h-4 w-4 text-teal-700" />
                        Tiến độ &amp; Đánh giá
                      </div>
                      <div className="space-y-2.5 text-xs text-slate-700">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Tiến độ báo cáo tuần:</span>
                          <span className="font-black text-slate-900">
                            {progress?.weeklyReportCount ?? progress?.reportCount ?? 0} tuần
                            {progress?.approvedReports ? (
                              <span className="text-emerald-700 font-bold ml-1">
                                (Đã duyệt: {progress.approvedReports})
                              </span>
                            ) : null}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Báo cáo tổng kết:</span>
                          <span className="font-bold text-slate-800">
                            {progress?.finalReportStatus === "APPROVED"
                              ? "Đã duyệt"
                              : progress?.finalReportStatus === "SUBMITTED"
                                ? "Đang chờ duyệt"
                                : progress?.finalReportStatus === "REJECTED"
                                  ? "Cần sửa lại"
                                  : "Chưa nộp"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Điểm tổng kết:</span>
                          <span className="font-black text-teal-800">
                            {progress?.finalScore !== null && progress?.finalScore !== undefined
                              ? `${progress.finalScore.toFixed(2)} / 10`
                              : "Chờ chấm điểm"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Chứng nhận thực tập:</span>
                          <span className="font-bold text-slate-800">
                            {progress?.hasCompanyCertificate
                              ? "Đã có chứng nhận"
                              : "Chưa cấp"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Quick Action Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                      {onNavigateTab && (
                        <>
                          <button
                            type="button"
                            onClick={() => onNavigateTab("reports")}
                            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#00a3a6] to-[#006d72] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                          >
                            <FileText className="h-4 w-4" />
                            Báo cáo thực tập tuần
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigateTab("evaluations")}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-800 active:scale-95 transition-all cursor-pointer shadow-2xs"
                          >
                            <Award className="h-4 w-4 text-teal-600" />
                            Xem đánh giá &amp; điểm
                          </button>
                        </>
                      )}
                    </div>
                    {onOpenChat && (
                      <button
                        type="button"
                        onClick={onOpenChat}
                        className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-4 py-2.5 text-xs font-bold text-teal-800 hover:bg-teal-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
                      >
                        <MessageSquare className="h-4 w-4 text-teal-600" />
                        Nhắn tin với Doanh nghiệp
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
