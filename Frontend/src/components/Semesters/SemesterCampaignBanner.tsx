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
  let countdownColor = 'bg-blue-50 text-blue-700 border-blue-200';

  if (currentPhase === 'UPCOMING') {
    const days = diffDays(recStart);
    countdownText = days > 0 ? `Còn ${days} ngày nữa mở cổng nhận hồ sơ` : 'Sắp mở cổng nhận hồ sơ';
    countdownColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (currentPhase === 'RECRUITING') {
    const days = diffDays(semStart);
    countdownText =
      days > 0 ? `Đang mở tuyển: Còn ${days} ngày trước khi chốt đợt` : 'Hôm nay là hạn chốt tuyển dụng';
    countdownColor =
      days <= 5
        ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (currentPhase === 'MONITORING') {
    const days = diffDays(semEnd);
    countdownText =
      days > 0 ? `Đang thực tập: Còn ${days} ngày trước khi kết thúc kỳ` : 'Đang trong giai đoạn nghiệm thu';
    countdownColor = 'bg-sky-50 text-sky-700 border-sky-200';
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

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/20 to-blue-50/30 p-5 shadow-xs transition-all ${className}`}
    >
      {/* Decorative ambient elements */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br from-indigo-200/20 to-blue-300/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-gradient-to-tr from-sky-200/20 to-indigo-100/30 blur-xl" />

      {/* Header bar */}
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs shadow-indigo-200">
            <CalendarDays className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Tiến trình học kỳ
              </span>

              {/* Semester switcher dropdown if multiple exist */}
              {semesters.length > 1 ? (
                <div className="relative inline-block">
                  <select
                    value={activeSemester.id}
                    onChange={(e) => setSelectedSemesterId(e.target.value)}
                    className="cursor-pointer appearance-none rounded-lg border border-indigo-200 bg-white/80 py-0.5 pl-2 pr-6 text-xs font-bold text-slate-800 shadow-2xs hover:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
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

            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <h2 className="text-sm font-extrabold text-slate-900 sm:text-base">
                {activeSemester.name}
              </h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${countdownColor}`}
              >
                <Clock className="h-3 w-3" />
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 hover:shadow-sm"
            >
              <Send className="h-3 w-3" /> Ứng tuyển ngay
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed((v) => !v)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50"
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
        <div className="relative mt-6 pt-2">
          {/* Timeline steps grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 sm:gap-2">
            {stages.map((stage, idx) => {
              const isPast = currentIndex > idx;
              const isCurrent = currentIndex === idx;
              const isFuture = currentIndex < idx;
              const StageIcon = stage.icon;

              let nodeClass = 'border-slate-200 bg-slate-50 text-slate-400';
              let titleClass = 'text-slate-500 font-medium';
              let lineClass = 'bg-slate-200';

              if (isPast) {
                nodeClass = 'border-emerald-500 bg-emerald-50 text-emerald-600';
                titleClass = 'text-slate-800 font-bold';
                lineClass = 'bg-emerald-500';
              } else if (isCurrent) {
                nodeClass =
                  'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-4 ring-indigo-100';
                titleClass = 'text-indigo-900 font-extrabold';
              }

              return (
                <div key={stage.key} className="relative flex sm:flex-col sm:items-center text-left sm:text-center group">
                  {/* Step Connector Line (desktop) */}
                  {idx < stages.length - 1 && (
                    <div
                      className={`hidden sm:block absolute top-4 left-1/2 w-full h-0.5 z-0 ${
                        isPast ? 'bg-emerald-400' : 'bg-slate-200'
                      }`}
                    />
                  )}

                  {/* Step Icon Node */}
                  <div
                    className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-transform duration-200 group-hover:scale-105 ${nodeClass}`}
                  >
                    {isPast ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <StageIcon className="h-4 w-4" />
                    )}

                    {isCurrent && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600" />
                      </span>
                    )}
                  </div>

                  {/* Step Text Info */}
                  <div className="ml-3 sm:ml-0 sm:mt-2.5">
                    <div className="flex items-center gap-1.5 sm:justify-center">
                      <span className={`text-xs ${titleClass}`}>{stage.title}</span>
                      {isCurrent && (
                        <span className="rounded-full bg-indigo-100 px-1.5 py-0.2 text-[10px] font-black uppercase text-indigo-700">
                          Hiện tại
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                      {stage.dateLabel}
                    </p>
                    <p className="hidden text-[11px] text-slate-400 leading-tight sm:block sm:mt-1 max-w-[170px]">
                      {stage.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contextual Role Advice Banner */}
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-indigo-100 bg-white/80 p-3.5 shadow-2xs backdrop-blur-xs">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <Sparkles className="h-3 w-3" />
            </div>

            <div className="text-xs text-slate-600 leading-relaxed">
              {role === 'STUDENT' ? (
                currentPhase === 'RECRUITING' ? (
                  <span>
                    <strong className="text-indigo-900 font-bold">Lưu ý sinh viên:</strong> Cổng ứng tuyển đang mở! Các tin tuyển dụng sẽ tự động đóng khi học kỳ bắt đầu vào ngày{' '}
                    <strong className="text-slate-800">{formatDate(activeSemester.startDate)}</strong>. Hãy nhanh chóng hoàn thiện CV và ứng tuyển để nhận lời mời thực tập sớm.
                  </span>
                ) : currentPhase === 'MONITORING' ? (
                  <span>
                    <strong className="text-sky-900 font-bold">Lưu ý sinh viên:</strong> Đợt tuyển dụng đã kết thúc. Bạn đang trong giai đoạn thực tập và theo dõi học vụ. Hãy chú ý lịch nộp báo cáo định kỳ và liên hệ giảng viên hướng dẫn nếu cần hỗ trợ.
                  </span>
                ) : currentPhase === 'UPCOMING' ? (
                  <span>
                    <strong className="text-indigo-900 font-bold">Lưu ý sinh viên:</strong> Đợt thực tập sắp tới đang trong giai đoạn chuẩn bị. Cổng nhận hồ sơ sẽ chính thức mở vào ngày{' '}
                    <strong className="text-slate-800">{formatDate(activeSemester.recruitmentStart)}</strong>. Hãy chuẩn bị sẵn hồ sơ cá nhân và kỹ năng của bạn.
                  </span>
                ) : (
                  <span>Kỳ thực tập đã kết thúc thành công. Hãy kiểm tra kết quả đánh giá và xác nhận hoàn thành học phần.</span>
                )
              ) : role === 'COMPANY' ? (
                currentPhase === 'RECRUITING' ? (
                  <span>
                    <strong className="text-indigo-900 font-bold">Dành cho Doanh nghiệp:</strong> Cổng đăng bài tuyển dụng đang mở. Mọi tin tuyển dụng ở trạng thái <em>Mở (OPEN)</em> sẽ tự động đóng khi kỳ thực tập bắt đầu vào ngày{' '}
                    <strong className="text-slate-800">{formatDate(activeSemester.startDate)}</strong>. Quý doanh nghiệp vui lòng duyệt hồ sơ và gửi lời mời thực tập sớm.
                  </span>
                ) : currentPhase === 'MONITORING' ? (
                  <span>
                    <strong className="text-sky-900 font-bold">Dành cho Doanh nghiệp:</strong> Kỳ thực tập đang diễn ra thực tế tại cơ sở. Quý doanh nghiệp phối hợp cùng nhà trường hướng dẫn và theo dõi sinh viên, chuẩn bị đánh giá cuối kỳ khi hoàn thành.
                  </span>
                ) : currentPhase === 'UPCOMING' ? (
                  <span>
                    <strong className="text-indigo-900 font-bold">Dành cho Doanh nghiệp:</strong> Đợt thực tập mới chuẩn bị mở cổng tiếp nhận. Quý doanh nghiệp có thể chuẩn bị sẵn các mẫu tin tuyển dụng (Templates) để đăng tuyển ngay khi đợt mở vào ngày{' '}
                    <strong className="text-slate-800">{formatDate(activeSemester.recruitmentStart)}</strong>.
                  </span>
                ) : (
                  <span>Đợt thực tập đã hoàn tất. Xin chân thành cảm ơn quý doanh nghiệp đã đồng hành cùng nhà trường và sinh viên.</span>
                )
              ) : (
                <span>
                  Đợt thực tập <strong className="text-slate-900">{activeSemester.name}</strong> đang ở giai đoạn{' '}
                  <strong className="text-indigo-700">
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

