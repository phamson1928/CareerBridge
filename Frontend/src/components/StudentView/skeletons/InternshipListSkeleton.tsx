import React from "react";
import {
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Search,
  RefreshCw,
  ClipboardList,
  UserRound,
  Settings,
  ArrowRight,
  Target,
  Send,
  CalendarClock,
  GraduationCap,
  CheckCircle2,
  MapPin,
  DollarSign,
  Calendar,
  Users,
} from "lucide-react";
import { SkeletonBlock, SkeletonBadge } from "./SkeletonPrimitives";

/**
 * 1. Hero Section Skeleton: Chuẩn xác 100% với Hero Hub tràn viền 100svh của sinh viên
 */
export function InternshipHeroSkeleton() {
  return (
    <section
      className="student-hero-hub relative left-1/2 m-0 h-[100svh] min-h-[620px] max-h-[960px] w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-[#06181b] select-none"
      aria-hidden="true"
    >
      <picture className="absolute inset-0 h-full w-full">
        <source srcSet="/homepage-hero.webp" type="image/webp" />
        <img
          className="h-full w-full object-cover object-right sm:object-center select-none pointer-events-none opacity-40"
          src="/homepage-hero.jpg"
          alt=""
          loading="eager"
        />
      </picture>
      {/* Aurora Ambient Orbs */}
      <div className="sb-hero-overlay absolute inset-0" />
      <div className="sb-ambient-orb absolute -left-16 top-1/4 h-[420px] w-[420px] rounded-full bg-teal-400/20 blur-[130px] pointer-events-none" />
      <div className="sb-ambient-orb-2 absolute left-[15%] bottom-1/4 h-[360px] w-[360px] rounded-full bg-emerald-400/15 blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto flex h-full max-w-[1240px] flex-col justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <div className="max-w-2xl text-center sm:text-left flex flex-col items-center sm:items-start mx-auto sm:mx-0">
          {/* Badge: Cổng thông tin thực tập */}
          <span className="sb-glass-dark inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-teal-100 shadow-[0_4px_20px_rgba(0,163,166,0.18)]">
            <span className="sb-beacon relative flex h-2 w-2 rounded-full bg-emerald-400" />
            Cổng Thông Tin Thực Tập
          </span>

          {/* Heading 2 dòng */}
          <div className="mt-5 space-y-2.5 flex flex-col items-center sm:items-start">
            <SkeletonBlock dark className="h-9 sm:h-12 w-64 sm:w-80 rounded-2xl" />
            <SkeletonBlock dark className="h-9 sm:h-12 w-72 sm:w-[440px] rounded-2xl" />
          </div>

          {/* Subtitle mô tả */}
          <div className="mt-4 space-y-2 w-full max-w-xl flex flex-col items-center sm:items-start">
            <SkeletonBlock dark className="h-4 sm:h-5 w-full max-w-lg rounded-lg" />
            <SkeletonBlock dark className="h-4 sm:h-5 w-4/5 max-w-md rounded-lg" />
          </div>

          {/* 2 Nút CTA */}
          <div className="mt-6 flex flex-wrap items-center justify-center sm:justify-start gap-3.5">
            <SkeletonBlock dark className="h-12 w-44 rounded-full bg-gradient-to-r from-teal-500/30 to-teal-700/40 border border-teal-400/20" />
            <div className="sb-btn-cv inline-flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-bold text-white">
              <FileText className="h-4 w-4 text-teal-300" />
              <SkeletonBlock dark className="h-4 w-28 rounded-md" />
            </div>
          </div>
        </div>

        {/* 3 Thẻ thống kê kính mờ Hero Stats */}
        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3 max-w-[780px]">
          {[
            { icon: <Briefcase className="h-4 w-4" /> },
            { icon: <Send className="h-4 w-4" /> },
            { icon: <Target className="h-4 w-4" /> },
          ].map((item, idx) => (
            <div
              key={idx}
              className="sb-glass-dark sb-stat-card flex items-center justify-between gap-2.5 sm:gap-3 rounded-2xl px-3.5 sm:px-4 py-3"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-teal-300/30 bg-teal-400/10 text-teal-200">
                  {item.icon}
                </span>
                <div className="space-y-1.5 min-w-0">
                  <SkeletonBlock dark className="h-6 w-14 rounded-md" />
                  <SkeletonBlock dark className="h-3 w-24 rounded-md" />
                </div>
              </div>
              <SkeletonBlock dark className="h-6 w-6 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </div>

      <div className="sb-scroll-cue absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full p-2 text-teal-100/80">
        <ChevronDown className="h-6 w-6" />
      </div>
    </section>
  );
}

/**
 * 2. Semester Campaign Timeline Skeleton: Chuẩn phong cách 4 mốc thời gian thực 28Tech
 */
export function SemesterTimelineSkeleton() {
  const stageIcons = [CalendarClock, Briefcase, GraduationCap, CheckCircle2];
  const borderClasses = [
    "border-b-[5px] border-cyan-400",
    "border-b-[5px] border-teal-500",
    "border-b-[5px] border-[#006d72]",
    "border-b-[5px] border-emerald-500",
  ];

  return (
    <section
      className="relative pt-14 sm:pt-20 lg:pt-24 pb-10 sm:pb-12 select-none w-full"
      aria-label="Đang tải tiến trình học kỳ"
    >
      {/* Header căn giữa */}
      <div className="flex flex-col items-center text-center max-w-4xl mx-auto px-4">
        <span className="inline-flex items-center rounded-full border border-teal-200/90 bg-teal-50/90 px-4 py-1 text-xs font-black uppercase tracking-wider text-teal-800 shadow-2xs">
          TIẾN TRÌNH HỌC KỲ
        </span>
        <SkeletonBlock className="mt-3.5 h-9 sm:h-10 w-72 sm:w-96 rounded-2xl" />
        <SkeletonBlock className="mt-3 h-4 sm:h-5 w-60 sm:w-80 rounded-lg" />
      </div>

      {/* Timeline 4 Mốc Chuẩn Phong Cách 28Tech */}
      <div className="relative mt-10 sm:mt-14">
        {/* Thanh ray ngang */}
        <div className="hidden lg:block absolute top-[10px] -left-6 -right-6 h-[2px] bg-[linear-gradient(90deg,transparent_0%,#0c2340_10%,#0c2340_90%,transparent_100%)] z-0 pointer-events-none" />

        {/* Grid 4 Thẻ Mốc so le */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 items-start">
          {[0, 1, 2, 3].map((idx) => {
            const isStaggered = idx % 2 === 1;
            const Icon = stageIcons[idx];

            return (
              <div key={idx} className="flex flex-col items-center w-full">
                {/* Pin định vị trên ray */}
                <div className="hidden lg:flex flex-col items-center z-10 pointer-events-none">
                  <div className="h-5 w-5 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center z-20">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                  </div>
                  <div
                    className={`w-[2px] bg-slate-300 ${
                      isStaggered ? "h-12" : "h-4"
                    }`}
                  />
                </div>

                {/* Thẻ Milestone */}
                <div
                  className={`w-full relative z-20 bg-white rounded-2xl p-6 sm:p-7 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.07)] border border-slate-100 flex flex-col justify-between items-center text-center overflow-hidden min-h-[320px] sm:min-h-[330px] ${borderClasses[idx]}`}
                >
                  {/* Vòng cung lưỡi liềm */}
                  <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-24 w-24 rounded-full border-[5px] border-cyan-100/70" />

                  {/* Icon + Giai đoạn + Tên mốc */}
                  <div className="flex flex-col items-center w-full">
                    <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-400">
                      <Icon className="h-7 w-7" />
                    </div>

                    <SkeletonBlock className="h-3 w-20 rounded-md" />

                    <div className="mt-2 min-h-[2.75rem] flex items-center justify-center w-full">
                      <SkeletonBlock className="h-6 w-36 rounded-lg" />
                    </div>
                  </div>

                  {/* Huy hiệu trạng thái */}
                  <div className="my-2.5 h-7 flex items-center justify-center">
                    <SkeletonBadge className="h-6 w-24" />
                  </div>

                  {/* Mô tả & Ngày tháng */}
                  <div className="border-t border-slate-100/80 pt-3.5 w-full flex flex-col items-center gap-1.5">
                    <SkeletonBlock className="h-3.5 w-44 rounded-md" />
                    <SkeletonBlock className="h-3 w-32 rounded-md" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * 3. Full Bleed Horizontal Divider
 */
export function FullBleedDivider() {
  return (
    <hr className="relative left-1/2 -translate-x-1/2 w-screen max-w-[100vw] my-6 sm:my-8 border-0 border-t border-slate-200/90 pointer-events-none" />
  );
}

/**
 * 4. Job Recommendations Skeleton: Chuẩn giao diện đề xuất vị trí thực tập
 */
export function JobRecommendationsSkeleton() {
  return (
    <section
      className="relative pt-10 sm:pt-12 pb-10 sm:pb-12 space-y-6 select-none w-full"
      aria-label="Đang tải gợi ý việc làm"
    >
      {/* Header căn giữa */}
      <div className="flex flex-col items-center text-center max-w-4xl mx-auto px-4">
        <span className="inline-flex items-center rounded-full border border-teal-200/90 bg-teal-50/90 px-4 py-1 text-xs font-black uppercase tracking-wider text-teal-800 shadow-2xs">
          GỢI Ý PHÙ HỢP
        </span>
        <SkeletonBlock className="mt-3.5 h-9 sm:h-10 w-80 sm:w-[420px] rounded-2xl" />
        <SkeletonBlock className="mt-2.5 h-4 w-full max-w-lg rounded-md" />
      </div>

      {/* Thanh điều khiển hợp nhất */}
      <div className="max-w-4xl mx-auto w-full rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 sm:px-5 sm:py-3.5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
        {/* Trái: Mức độ sẵn sàng hồ sơ */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <ClipboardList className="h-4.5 w-4.5" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-4 w-36 rounded-md" />
              <SkeletonBadge className="h-5 w-14" />
            </div>
            <SkeletonBlock className="h-3 w-56 rounded-md" />
          </div>
        </div>

        {/* Phải: Cụm nút hành động */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 sm:self-center">
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-400">
            <UserRound className="h-3.5 w-3.5" />
            <SkeletonBlock className="h-3.5 w-12 rounded-md" />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-400">
            <Settings className="h-3.5 w-3.5" />
            <SkeletonBlock className="h-3.5 w-16 rounded-md" />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-xl bg-teal-800/20 px-3.5 py-1.5 text-xs font-bold text-teal-800">
            <RefreshCw className="h-3.5 w-3.5 text-teal-600 animate-spin" />
            <SkeletonBlock className="h-3.5 w-14 rounded-md" />
          </div>
        </div>
      </div>

      {/* Grid 2 Recommendation Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1].map((idx) => (
          <article
            key={idx}
            className="sb-job-card flex h-full flex-col justify-between overflow-hidden p-5 sm:p-6"
          >
            <div>
              {/* Header: Logo, Rank, Title, Company & Match Ring */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3.5">
                  <SkeletonBlock className="h-12 w-12 shrink-0 rounded-2xl" />
                  <div className="space-y-1.5 min-w-0">
                    <SkeletonBadge className="h-4 w-16" />
                    <SkeletonBlock className="h-5 w-44 rounded-md" />
                    <SkeletonBlock className="h-3.5 w-28 rounded-md" />
                  </div>
                </div>
                <SkeletonBlock className="h-12 w-12 shrink-0 rounded-full" />
              </div>

              {/* Badges: Học kỳ, địa điểm, trạng thái đối sánh */}
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                <SkeletonBadge className="h-5.5 w-24" />
                <SkeletonBadge className="h-5.5 w-20" />
                <SkeletonBadge className="h-5.5 w-24" />
              </div>

              {/* Hộp Điểm phù hợp & Cần bổ sung */}
              <div className="mt-3.5 space-y-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <SkeletonBlock className="h-3 w-4/5 rounded-md" />
                <SkeletonBlock className="h-3 w-3/5 rounded-md" />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-dashed border-teal-900/10 pt-3.5">
              <SkeletonBlock className="h-4 w-24 rounded-md" />
              <SkeletonBlock className="h-8 w-28 rounded-xl" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/**
 * 5. Single Bento Job Card Skeleton: Khớp từng chi tiết với thẻ việc làm chính thức
 */
export function JobCardSkeleton() {
  return (
    <article className="sb-job-card flex flex-col justify-between overflow-hidden p-5 sm:p-6 select-none">
      <div className="relative">
        {/* Header: Company logo + Title + Company name */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <SkeletonBlock className="h-14 w-14 shrink-0 rounded-2xl" />
            <div className="space-y-1.5 min-w-0">
              <SkeletonBlock className="h-3.5 w-28 rounded-md" />
              <SkeletonBlock className="h-5 w-48 rounded-md" />
            </div>
          </div>
        </div>

        {/* Badges: Đợt, hạn nộp, hình thức */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <SkeletonBadge className="h-6 w-20" />
          <SkeletonBadge className="h-6 w-24" />
          <SkeletonBadge className="h-6 w-16" />
        </div>

        {/* Meta Tiles (2x2 Grid) */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {/* Địa điểm */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 space-y-1">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-slate-300" />
              <SkeletonBlock className="h-2.5 w-12 rounded-sm" />
            </div>
            <SkeletonBlock className="h-3.5 w-24 rounded-md" />
          </div>

          {/* Trợ cấp */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2 space-y-1">
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-emerald-300" />
              <SkeletonBlock className="h-2.5 w-12 rounded-sm" />
            </div>
            <SkeletonBlock className="h-3.5 w-20 rounded-md" />
          </div>

          {/* Hạn nộp */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 space-y-1">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-300" />
              <SkeletonBlock className="h-2.5 w-12 rounded-sm" />
            </div>
            <SkeletonBlock className="h-3.5 w-22 rounded-md" />
          </div>

          {/* Chỉ tiêu */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 space-y-1">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-slate-300" />
              <SkeletonBlock className="h-2.5 w-12 rounded-sm" />
            </div>
            <SkeletonBlock className="h-3.5 w-16 rounded-md" />
          </div>
        </div>

        {/* Short Description (2 lines) */}
        <div className="mt-4 space-y-1.5">
          <SkeletonBlock className="h-3 w-full rounded-md" />
          <SkeletonBlock className="h-3 w-3/4 rounded-md" />
        </div>

        {/* Target Majors Badges */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <SkeletonBadge className="h-5.5 w-28" />
          <SkeletonBadge className="h-5.5 w-32" />
        </div>

        {/* Required Skills Badges */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <SkeletonBadge className="h-5.5 w-16" />
          <SkeletonBadge className="h-5.5 w-20" />
          <SkeletonBadge className="h-5.5 w-14" />
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-dashed border-teal-900/10 pt-4">
        <SkeletonBlock className="h-4 w-24 rounded-md" />
        <SkeletonBlock className="h-8 w-28 rounded-none bg-teal-700/25" />
      </div>
    </article>
  );
}

/**
 * 6. Job Cards Grid Skeleton: Grid danh sách thẻ việc làm
 */
export function JobCardsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 select-none">
      {Array.from({ length: count }).map((_, index) => (
        <JobCardSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * 7. Full Internship List Skeleton: Tái hiện trọn vẹn từng phần trang Cơ hội việc làm
 */
export function InternshipListSkeleton() {
  return (
    <div
      className="w-full space-y-8 select-none"
      aria-busy="true"
      aria-label="Đang tải danh sách việc làm"
    >
      {/* 1. Hero Hub Header */}
      <InternshipHeroSkeleton />

      {/* 2. Tiến trình Đợt thực tập / Campaign Timeline */}
      <SemesterTimelineSkeleton />

      {/* 3. Thanh ngang phân tách 1 */}
      <FullBleedDivider />

      {/* 4. Gợi ý việc làm phù hợp */}
      <JobRecommendationsSkeleton />

      {/* 5. Thanh ngang phân tách 2 */}
      <FullBleedDivider />

      {/* 6. Tiêu đề khu vực tin tuyển dụng */}
      <div className="scroll-mt-24 flex flex-col items-center text-center max-w-4xl mx-auto px-4 pt-10 sm:pt-12 pb-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/90 bg-teal-50/90 px-4 py-1 text-xs font-black uppercase tracking-wider text-teal-800 shadow-2xs">
          <Briefcase className="h-3.5 w-3.5 text-teal-700" /> Tin tuyển dụng
        </span>
        <h2 className="mt-3.5 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          Khám phá cơ hội thực tập
        </h2>
        <p className="mt-2.5 text-sm sm:text-base font-medium text-slate-600 max-w-2xl leading-relaxed">
          Lọc theo vị trí, kỹ năng và chuyên ngành để tìm nơi phù hợp nhất với bạn.
        </p>
      </div>

      {/* 7. Filter Hub: Thanh tìm kiếm & bộ lọc */}
      <div className="relative z-20 w-full rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 sm:p-4 shadow-sm backdrop-blur-md">
        {/* Hàng 1: Search bar + Nút Làm mới */}
        <div className="flex flex-col sm:flex-row gap-2.5 w-full items-center">
          <div className="relative flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-slate-800 min-h-11 w-full sm:flex-1">
            <Search className="h-4.5 w-4.5 shrink-0 text-teal-600" />
            <SkeletonBlock className="h-4 w-64 rounded-md" />
          </div>

          {/* Nút Làm mới - Soft red */}
          <div className="inline-flex w-full sm:w-auto shrink-0 h-11 items-center justify-center gap-1.5 rounded-xl border border-rose-200/90 bg-rose-50/70 px-4 text-xs font-bold text-rose-700 shadow-2xs">
            <RefreshCw className="h-3.5 w-3.5 shrink-0 text-rose-600" />
            <span>Làm mới</span>
          </div>
        </div>

        {/* Hàng 2: Các bộ lọc (Kỹ năng, Khoa, Ngành) */}
        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-2.5 w-full items-start">
          <SkeletonBlock className="h-11 w-full rounded-xl" />
          <SkeletonBlock className="h-11 w-full rounded-xl" />
          <SkeletonBlock className="h-11 w-full rounded-xl" />
        </div>
      </div>

      {/* 8. Danh sách Bento Job Cards (6 thẻ) */}
      <JobCardsGridSkeleton count={6} />

      {/* 9. Thanh Phân Trang */}
      <div className="flex flex-col items-center justify-center gap-2 pt-6 pb-2">
        <nav
          aria-label="Phân trang danh sách tin tuyển dụng"
          className="inline-flex items-center gap-1 p-1.5 rounded-2xl border border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-md"
        >
          <div className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold text-slate-400">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Trước</span>
          </div>
          <SkeletonBlock className="h-9 w-9 rounded-xl" />
          <SkeletonBlock className="h-9 w-9 rounded-xl" />
          <SkeletonBlock className="h-9 w-9 rounded-xl" />
          <div className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold text-slate-400">
            <span className="hidden sm:inline">Sau</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </nav>
      </div>
    </div>
  );
}
