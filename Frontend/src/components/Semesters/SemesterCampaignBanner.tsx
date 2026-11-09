import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CalendarClock,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Building2,
  Send,
  FileCheck,
} from 'lucide-react';
import { semestersApi } from '../../semesters/api';
import type { SemesterRecord, InternshipCampaignPhase } from '../../semesters/types';
import { formatDate } from '../../utils/format';

interface SemesterCampaignBannerProps {
  role?: 'STUDENT' | 'COMPANY' | 'TEACHER' | 'ADMIN';
  initialCollapsed?: boolean;
  onExploreJobs?: () => void;
  className?: string;
}

interface StageStep {
  key: InternshipCampaignPhase;
  title: string;
  subtitle: string;
  dateLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const SemesterCampaignBanner: React.FC<SemesterCampaignBannerProps> = ({
  role = 'STUDENT',
  initialCollapsed = false,
  onExploreJobs,
  className = '',
}) => {
  const [semesters, setSemesters] = useState<SemesterRecord[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await semestersApi.list({ limit: 20 });
        if (!active) return;
        setSemesters(res.items);

        // Auto select the most relevant active semester
        const recruiting = res.items.find((s) => s.phase === 'RECRUITING');
        const monitoring = res.items.find((s) => s.phase === 'MONITORING');
        const upcoming = res.items.find((s) => s.phase === 'UPCOMING');
        const chosen = recruiting || monitoring || upcoming || res.items[0];
        if (chosen) {
          setSelectedSemesterId(chosen.id);
        }
      } catch (e) {
        // Silently fallback if unable to fetch
        console.error('Failed to load semester campaign', e);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const activeSemester = useMemo(
    () => semesters.find((s) => s.id === selectedSemesterId) ?? semesters[0],
    [semesters, selectedSemesterId],
  );

  if (isLoading || !activeSemester) {
    return null;
  }

  const now = new Date();
  const recStart = new Date(activeSemester.recruitmentStart);
  const semStart = new Date(activeSemester.startDate);
  const semEnd = new Date(activeSemester.endDate);

  // Calculate days difference
  const diffDays = (target: Date) => {
    const ms = target.getTime() - now.getTime();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  };

  const currentPhase: InternshipCampaignPhase = activeSemester.phase;

  // Days countdown label
  let countdownText = '';
  let countdownColor = 'bg-teal-50 text-teal-800 border-teal-200';

  if (currentPhase === 'UPCOMING') {
    const days = diffDays(recStart);
    countdownText = days > 0 ? `Còn ${days} ngày nữa mở cổng nhận hồ sơ` : 'Sắp mở cổng nhận hồ sơ';
    countdownColor = 'bg-cyan-50 text-cyan-800 border-cyan-200';
  } else if (currentPhase === 'RECRUITING') {
    const days = diffDays(semStart);
    countdownText =
      days > 0 ? `Đang mở tuyển: Còn ${days} ngày trước khi chốt đợt` : 'Hôm nay là hạn chốt tuyển dụng';
    countdownColor =
      days <= 5
        ? 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse'
        : 'bg-emerald-50 text-emerald-800 border-emerald-300';
  } else if (currentPhase === 'MONITORING') {
    const days = diffDays(semEnd);
    countdownText =
      days > 0 ? `Đang thực tập: Còn ${days} ngày trước khi kết thúc kỳ` : 'Đang trong giai đoạn nghiệm thu';
    countdownColor = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (currentPhase === 'COMPLETED') {
    countdownText = 'Đợt thực tập đã hoàn tất';
    countdownColor = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  const stages: StageStep[] = [
    {
      key: 'UPCOMING',
      title: 'Lên kế hoạch',
      subtitle: 'Chuẩn bị đợt & tiếp nhận chỉ tiêu DN',
      dateLabel: `Trước ${formatDate(activeSemester.recruitmentStart)}`,
      icon: CalendarClock,
    },
    {
      key: 'RECRUITING',
      title: 'Mở nhận hồ sơ',
      subtitle: 'DN đăng tin, SV ứng tuyển & phỏng vấn',
      dateLabel: `${formatDate(activeSemester.recruitmentStart)} - ${formatDate(activeSemester.startDate)}`,
      icon: Briefcase,
    },
    {
      key: 'MONITORING',
      title: 'Thực tập & Báo cáo',
      subtitle: 'SV làm việc tại DN, GV hướng dẫn & đánh giá',
      dateLabel: `${formatDate(activeSemester.startDate)} - ${formatDate(activeSemester.endDate)}`,
      icon: GraduationCap,
    },
    {
      key: 'COMPLETED',
      title: 'Hoàn thành đợt',
      subtitle: 'Nghiệm thu học phần & tổng kết điểm số',
      dateLabel: `Sau ${formatDate(activeSemester.endDate)}`,
      icon: CheckCircle2,
    },
  ];

  const phaseOrder: Record<InternshipCampaignPhase, number> = {
    UPCOMING: 0,
    RECRUITING: 1,
    MONITORING: 2,
    COMPLETED: 3,
    CANCELLED: -1,
  };

  const currentIndex = phaseOrder[currentPhase] ?? 0;

  // Visual meta per milestone
  const stageMetas = [
    {
      stepNum: '01',
      badge: 'Chuẩn bị',
      themeColor: 'emerald',
      futureIconClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    },
    {
      stepNum: '02',
      badge: 'Tuyển dụng',
      themeColor: 'teal',
      futureIconClass: 'bg-teal-50 text-teal-600 border border-teal-200',
    },
    {
      stepNum: '03',
      badge: 'Thực tập',
      themeColor: 'amber',
      futureIconClass: 'bg-amber-50 text-amber-600 border border-amber-200',
    },
    {
      stepNum: '04',
      badge: 'Về đích',
      themeColor: 'purple',
      futureIconClass: 'bg-purple-50 text-purple-600 border border-purple-200',
    },
  ];

  const progressPercentage =
    currentIndex === 0
      ? 20
      : currentIndex === 1
      ? 50
      : currentIndex === 2
      ? 78
      : 100;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm transition-all ${className}`}
    >
      {/* Top Colorful Gradient Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />

      {/* Decorative ambient subtle background glows */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

      {/* Header bar */}
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-600 text-white shadow-md shadow-teal-700/20 shrink-0">
            <CalendarDays className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Tiến trình học kỳ & Tuyển dụng
              </span>

              {/* Semester switcher dropdown if multiple exist */}
              {semesters.length > 1 ? (
                <div className="relative inline-block">
                  <select
                    value={activeSemester.id}
                    onChange={(e) => setSelectedSemesterId(e.target.value)}
                    className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-50 py-0.5 pl-2.5 pr-6 text-xs font-bold text-slate-800 shadow-2xs hover:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                  >
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.phase === 'RECRUITING' ? 'Đang tuyển' : s.phase === 'MONITORING' ? 'Thực tập' : 'Sắp diễn ra'})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                </div>
              ) : (
                <span className="text-xs font-bold text-slate-900">{activeSemester.name}</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 mt-1">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                {activeSemester.name}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-bold shadow-2xs ${countdownColor}`}
              >
                <Clock className="h-3.5 w-3.5" />
                {countdownText}
              </span>
            </div>
          </div>
        </div>

        {/* Right tools: Collapse toggle & quick action */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {role === 'STUDENT' && currentPhase === 'RECRUITING' && onExploreJobs && (
            <button
              type="button"
              onClick={onExploreJobs}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition"
            >
              <Send className="h-3.5 w-3.5" /> Ứng tuyển ngay
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition cursor-pointer"
            title={isCollapsed ? 'Mở rộng xem chi tiết các giai đoạn' : 'Thu gọn tiến trình'}
          >
            {isCollapsed ? (
              <>
                <span>Xem chi tiết các mốc</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <span>Thu gọn</span>
                <ChevronUp className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stepper Timeline Body */}
      {!isCollapsed && (
        <div className="relative mt-6 pt-3 border-t border-slate-100">
          {/* Continuous Progress Track Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                Lộ trình triển khai
              </span>
              <span className="text-teal-800 font-extrabold bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full text-[11px]">
                {currentIndex === 0
                  ? 'Giai đoạn 1/4 • Lên kế hoạch (20%)'
                  : currentIndex === 1
                  ? 'Giai đoạn 2/4 • Mở nhận hồ sơ (50%)'
                  : currentIndex === 2
                  ? 'Giai đoạn 3/4 • Thực tập thực tế (78%)'
                  : 'Giai đoạn 4/4 • Hoàn thành đợt (100%)'}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/70 shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-700 shadow-xs relative"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
              </div>
            </div>
          </div>

          {/* 4 Creative Bento Milestone Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stages.map((stage, idx) => {
              const isPast = currentIndex > idx;
              const isCurrent = currentIndex === idx;
              const isFuture = currentIndex < idx;
              const StageIcon = stage.icon;
              const meta = stageMetas[idx];

              return (
                <div
                  key={stage.key}
                  className={`relative flex flex-col justify-between rounded-2xl p-4 transition-all duration-200 ${
                    isCurrent
                      ? 'border-2 border-teal-500 bg-gradient-to-b from-teal-50/70 via-white to-white shadow-md shadow-teal-500/10 ring-4 ring-teal-500/10 transform sm:-translate-y-0.5'
                      : isPast
                      ? 'border border-emerald-200/90 bg-gradient-to-b from-emerald-50/40 via-white to-white shadow-2xs hover:border-emerald-300'
                      : 'border border-slate-200/90 bg-slate-50/60 shadow-2xs hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  {/* Top: Badges and Icon */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-700 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-ping" />
                          HIỆN TẠI
                        </span>
                      ) : isPast ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                          ✓ Đã hoàn tất
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 text-[10px] font-bold">
                          Giai đoạn {meta.stepNum}
                        </span>
                      )}

                      {/* Icon */}
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform ${
                          isCurrent
                            ? 'bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-sm shadow-teal-600/30'
                            : isPast
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : meta.futureIconClass
                        }`}
                      >
                        {isPast ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <StageIcon className="h-4 w-4" />
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h4
                      className={`text-sm font-extrabold mt-3 tracking-tight leading-tight ${
                        isCurrent
                          ? 'text-teal-950 font-black'
                          : isPast
                          ? 'text-slate-900 font-bold'
                          : 'text-slate-700 font-bold'
                      }`}
                    >
                      {stage.title}
                    </h4>

                    {/* Date Badge */}
                    <div className="mt-1.5">
                      <span
                        className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          isCurrent
                            ? 'bg-teal-100/90 text-teal-900 border border-teal-200'
                            : isPast
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                            : 'bg-slate-100 text-slate-600 border border-slate-200/70'
                        }`}
                      >
                        {stage.dateLabel}
                      </span>
                    </div>
                  </div>

                  {/* Subtitle */}
                  <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                    {stage.subtitle}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Contextual Role Advice Banner */}
          <div className="mt-5 flex items-start gap-3.5 rounded-2xl border border-teal-200/90 bg-gradient-to-r from-teal-50/90 via-emerald-50/50 to-cyan-50/60 p-4 shadow-2xs relative overflow-hidden">
            <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 bg-teal-400/10 rounded-full blur-2xl" />
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>

            <div className="text-xs text-slate-700 leading-relaxed flex-1">
              {role === 'STUDENT' ? (
                currentPhase === 'RECRUITING' ? (
                  <span>
                    <strong className="text-teal-950 font-bold">Lưu ý sinh viên:</strong> Cổng ứng tuyển đang mở! Các tin tuyển dụng sẽ tự động đóng khi học kỳ bắt đầu vào ngày{' '}
                    <strong className="text-slate-900">{formatDate(activeSemester.startDate)}</strong>. Hãy nhanh chóng hoàn thiện CV và ứng tuyển để nhận lời mời thực tập sớm.
                  </span>
                ) : currentPhase === 'MONITORING' ? (
                  <span>
                    <strong className="text-teal-950 font-bold">Lưu ý sinh viên:</strong> Đợt tuyển dụng đã kết thúc. Bạn đang trong giai đoạn thực tập và theo dõi học vụ. Hãy chú ý lịch nộp báo cáo định kỳ và liên hệ giảng viên hướng dẫn nếu cần hỗ trợ.
                  </span>
                ) : currentPhase === 'UPCOMING' ? (
                  <span>
                    <strong className="text-teal-950 font-bold">Lưu ý sinh viên:</strong> Đợt thực tập sắp tới đang trong giai đoạn chuẩn bị. Cổng nhận hồ sơ sẽ chính thức mở vào ngày{' '}
                    <strong className="text-slate-900">{formatDate(activeSemester.recruitmentStart)}</strong>. Hãy chuẩn bị sẵn hồ sơ cá nhân và kỹ năng của bạn.
                  </span>
                ) : (
                  <span>Kỳ thực tập đã kết thúc thành công. Hãy kiểm tra kết quả đánh giá và xác nhận hoàn thành học phần.</span>
                )
              ) : role === 'COMPANY' ? (
                currentPhase === 'RECRUITING' ? (
                  <span>
                    <strong className="text-teal-950 font-extrabold">Dành cho Doanh nghiệp tuyển dụng:</strong> Cổng tiếp nhận hồ sơ đang mở. Mọi tin tuyển dụng ở trạng thái <em>Mở (OPEN)</em> sẽ tự động chốt khi kỳ thực tập chính thức bắt đầu vào ngày{' '}
                    <strong className="text-teal-900 font-extrabold underline">{formatDate(activeSemester.startDate)}</strong>. Quý doanh nghiệp vui lòng duyệt CV và gửi lời mời thực tập sớm cho các ứng viên phù hợp.
                  </span>
                ) : currentPhase === 'MONITORING' ? (
                  <span>
                    <strong className="text-teal-950 font-extrabold">Dành cho Doanh nghiệp:</strong> Kỳ thực tập đang diễn ra thực tế tại cơ sở. Quý doanh nghiệp phối hợp cùng nhà trường hướng dẫn và theo dõi sinh viên, chuẩn bị đánh giá cuối kỳ khi hoàn thành.
                  </span>
                ) : currentPhase === 'UPCOMING' ? (
                  <span>
                    <strong className="text-teal-950 font-extrabold">Dành cho Doanh nghiệp:</strong> Đợt thực tập mới chuẩn bị mở cổng tiếp nhận. Quý doanh nghiệp có thể chuẩn bị sẵn các mẫu tin tuyển dụng (Templates) để đăng tuyển ngay khi đợt mở vào ngày{' '}
                    <strong className="text-slate-900">{formatDate(activeSemester.recruitmentStart)}</strong>.
                  </span>
                ) : (
                  <span>Đợt thực tập đã hoàn tất. Xin chân thành cảm ơn quý doanh nghiệp đã đồng hành cùng nhà trường và sinh viên.</span>
                )
              ) : (
                <span>
                  Đợt thực tập <strong className="text-slate-900">{activeSemester.name}</strong> đang ở giai đoạn{' '}
                  <strong className="text-teal-800">
                    {currentPhase === 'RECRUITING'
                      ? 'Tuyển dụng & Ứng tuyển'
                      : currentPhase === 'MONITORING'
                      ? 'Theo dõi & Báo cáo học vụ'
                      : currentPhase === 'UPCOMING'
                      ? 'Chuẩn bị'
                      : 'Đã hoàn thành'}
                  </strong>.
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

