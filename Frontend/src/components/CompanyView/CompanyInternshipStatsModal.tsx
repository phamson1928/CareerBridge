import { useEffect, useState } from 'react';
import {
  X,
  Eye,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  BarChart3,
  Target,
  Sparkles,
  AlertCircle,
  Briefcase,
  MapPin,
  Calendar,
  Check,
  XCircle,
  Undo2,
  LoaderCircle,
  UserCheck,
} from 'lucide-react';
import { getApiErrorMessage } from '../../auth/api';
import { dashboardApi } from '../../dashboard/api';
import type { CompanyInternshipStatsData } from '../../dashboard/types';

interface CompanyInternshipStatsModalProps {
  internshipId: string;
  onClose: () => void;
}

export function CompanyInternshipStatsModal({
  internshipId,
  onClose,
}: CompanyInternshipStatsModalProps) {
  const [data, setData] = useState<CompanyInternshipStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await dashboardApi.getCompanyInternshipStats(internshipId);
        if (active) setData(result);
      } catch (err) {
        if (active) setError(getApiErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    };
    void fetchStats();
    return () => {
      active = false;
    };
  }, [internshipId]);

  const formatHours = (hours: number | null | undefined) => {
    if (hours === null || hours === undefined) return 'Chưa có dữ liệu';
    if (hours < 24) return `${hours.toFixed(1)} giờ`;
    const days = (hours / 24).toFixed(1);
    return `${hours.toFixed(1)} giờ (~${days} ngày)`;
  };

  const formatPercent = (rate: number | null | undefined) => {
    if (rate === null || rate === undefined) return '0%';
    return `${(rate * 100).toFixed(1)}%`;
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800 border border-emerald-200">Đang mở tuyển</span>;
      case 'CLOSED':
        return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200">Đã đóng</span>;
      case 'DRAFT':
        return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">Bản nháp</span>;
      case 'CANCELLED':
        return <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 border border-rose-200">Đã hủy</span>;
      default:
        return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 px-6 py-5 text-white">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                <BarChart3 className="h-3.5 w-3.5" /> Thống kê tuyển dụng chi tiết
              </span>
              {data && statusBadge(data.internship.status)}
            </div>
            <h2 className="text-xl font-black text-white sm:text-2xl leading-tight">
              {data ? data.internship.title : 'Chi tiết thống kê tuyển dụng'}
            </h2>
            {data && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-0.5">
                {data.internship.semesterName && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                    {data.internship.semesterName}
                  </span>
                )}
                {data.internship.department && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-emerald-400" />
                    {data.internship.department}
                  </span>
                )}
                {data.internship.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                    {data.internship.location}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="py-16 text-center text-slate-500">
              <LoaderCircle className="mx-auto mb-3 h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm font-semibold">Đang tải số liệu thống kê chi tiết...</p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <strong className="font-bold">Không thể tải thống kê</strong>
                <p className="mt-1 text-xs text-rose-700">{error}</p>
              </div>
            </div>
          )}

          {data && (
            <>
              {/* 1. KPIs Top Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 p-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Lượt xem</span>
                    <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
                      <Eye className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-2xl font-black text-slate-900">{data.kpis.views}</div>
                  <div className="mt-1 text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Users className="h-3 w-3 text-blue-500" />
                    <span>{data.kpis.uniqueViewers} người xem duy nhất</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 p-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Đơn ứng tuyển</span>
                    <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                      <UserCheck className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-2xl font-black text-slate-900">{data.kpis.totalApplications}</div>
                  <div className="mt-1 text-[11px] font-semibold text-emerald-600">
                    {data.kpis.applicationsByStatus.ACCEPTED} hồ sơ đã nhận
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-amber-50/70 to-orange-50/40 p-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Lấp đầy chỉ tiêu</span>
                    <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                      <Target className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-2xl font-black text-slate-900">
                    {data.kpis.filledSlots} / {data.kpis.totalSlots}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-amber-700">
                    Đạt {formatPercent(data.kpis.fillRate)} chỉ tiêu
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-purple-50/70 to-pink-50/40 p-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Thời gian TB tuyển</span>
                    <div className="rounded-xl bg-purple-100 p-2 text-purple-700">
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-base font-extrabold text-slate-900 leading-tight">
                    {formatHours(data.kpis.avgHoursToAccept)}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Tới quyết định: {formatHours(data.kpis.avgHoursToDecision)}
                  </div>
                </div>
              </div>

              {/* 2. Funnel Visualization */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      Phễu tuyển dụng vị trí này (Recruitment Funnel)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tỷ lệ chuyển đổi qua các vòng từ lúc nộp đơn tới khi tiếp nhận
                    </p>
                  </div>
                  <div className="text-xs font-bold text-slate-600">
                    Tổng đơn: <span className="text-emerald-700 font-extrabold">{data.funnel.applied}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-center">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">1. Đã nộp</span>
                    <div className="mt-1 text-xl font-black text-slate-900">{data.funnel.applied}</div>
                    <span className="mt-1 inline-block rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      100%
                    </span>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-center">
                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">2. Đang/Đã duyệt</span>
                    <div className="mt-1 text-xl font-black text-blue-900">{data.funnel.everReviewing}</div>
                    <span className="mt-1 inline-block rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                      {formatPercent(data.funnel.reviewRate)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-center">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">3. Được nhận</span>
                    <div className="mt-1 text-xl font-black text-emerald-900">{data.funnel.accepted}</div>
                    <span className="mt-1 inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {formatPercent(data.funnel.acceptRate)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-center">
                    <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">4. Từ chối</span>
                    <div className="mt-1 text-xl font-black text-rose-900">{data.funnel.rejected}</div>
                    <span className="mt-1 inline-block rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                      {formatPercent(data.funnel.rejectRate)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">5. Rút hồ sơ</span>
                    <div className="mt-1 text-xl font-black text-slate-800">{data.funnel.withdrawn}</div>
                    <span className="mt-1 inline-block rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      {formatPercent(data.funnel.withdrawRate)}
                    </span>
                  </div>
                </div>

                {data.funnel.everReviewing > 0 && (
                  <div className="mt-3 rounded-xl bg-emerald-50/50 border border-emerald-100 px-3 py-2 text-xs text-emerald-800 flex items-center justify-between">
                    <span>
                      Tỷ lệ tuyển sau khi vào vòng xem xét hồ sơ (Accept given Reviewing):
                    </span>
                    <strong className="text-emerald-900 font-extrabold text-sm">
                      {formatPercent(data.funnel.acceptGivenReview)}
                    </strong>
                  </div>
                )}

                {/* Status distribution bar */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700">Trạng thái hiện tại của {data.kpis.totalApplications} đơn:</span>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 font-semibold text-amber-800 border border-amber-200">
                      <Clock className="h-3.5 w-3.5" /> Chờ duyệt: {data.kpis.applicationsByStatus.PENDING}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 font-semibold text-blue-800 border border-blue-200">
                      <Eye className="h-3.5 w-3.5" /> Đang xem xét: {data.kpis.applicationsByStatus.REVIEWING}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 border border-emerald-200">
                      <Check className="h-3.5 w-3.5" /> Được nhận: {data.kpis.applicationsByStatus.ACCEPTED}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1 font-semibold text-rose-800 border border-rose-200">
                      <XCircle className="h-3.5 w-3.5" /> Từ chối: {data.kpis.applicationsByStatus.REJECTED}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-700 border border-slate-200">
                      <Undo2 className="h-3.5 w-3.5" /> Đã rút: {data.kpis.applicationsByStatus.WITHDRAWN}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Skills Analysis Grid */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Required Skills Coverage */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Độ phủ kỹ năng của bài đăng
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tỷ lệ ứng viên đáp ứng các kỹ năng bắt buộc và tùy chọn
                    </p>

                    <div className="mt-4 space-y-3">
                      {data.requiredSkillCoverage.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-4 text-center">
                          Tin tuyển dụng này chưa thiết lập kỹ năng yêu cầu.
                        </p>
                      ) : (
                        data.requiredSkillCoverage.map((skill) => {
                          const rate = skill.applicantHaveRate ?? 0;
                          const percentStr = formatPercent(skill.applicantHaveRate);
                          return (
                            <div key={skill.skillId} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800">{skill.name}</span>
                                  {skill.isRequired ? (
                                    <span className="rounded-sm bg-rose-50 px-1.5 py-0.5 text-[9px] font-extrabold text-rose-700 border border-rose-200">
                                      Bắt buộc
                                    </span>
                                  ) : (
                                    <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600">
                                      Tùy chọn
                                    </span>
                                  )}
                                </div>
                                <span className="font-semibold text-slate-600">
                                  {skill.applicantHaveCount} ứng viên ({percentStr})
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    skill.isRequired
                                      ? rate >= 0.7
                                        ? 'bg-emerald-500'
                                        : rate >= 0.4
                                          ? 'bg-amber-500'
                                          : 'bg-rose-500'
                                      : 'bg-indigo-500'
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(0, rate * 100))}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Top Applicant Skills */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                      Top kỹ năng nổi bật của ứng viên
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Các kỹ năng phổ biến nhất mà các ứng viên nộp tin này sở hữu (Không PII)
                    </p>

                    <div className="mt-4 space-y-2.5">
                      {data.topApplicantSkills.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-4 text-center">
                          Chưa có ứng viên nộp đơn hoặc ứng viên chưa khai báo kỹ năng.
                        </p>
                      ) : (
                        data.topApplicantSkills.map((item, idx) => (
                          <div
                            key={item.skillId}
                            className="flex items-center justify-between rounded-xl bg-slate-50/80 px-3 py-2 text-xs border border-slate-100"
                          >
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-black text-indigo-700">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-slate-800">{item.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-extrabold text-indigo-700">{item.applicantCount} ứng viên</span>
                              <span className="ml-1 text-slate-400 text-[11px]">({formatPercent(item.share)})</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Match Score Statistics */}
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 text-white shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                      Độ tương thích hồ sơ
                    </span>
                    <h3 className="text-lg font-black text-white flex items-center gap-2 mt-0.5">
                      <Sparkles className="h-5 w-5 text-amber-400" />
                      Thống kê Điểm Match Score Hệ thống
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Đo lường mức độ phù hợp giữa kỹ năng ứng viên và yêu cầu bài đăng ({data.matchScore.counted} hồ sơ đã chấm điểm)
                    </p>
                  </div>

                  <div className="flex items-center gap-6 bg-white/10 rounded-2xl px-6 py-3 border border-white/10 backdrop-blur-xs">
                    <div className="text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Trung bình</span>
                      <div className="text-2xl font-black text-emerald-400">
                        {data.matchScore.avg !== null ? data.matchScore.avg.toFixed(1) : '-'}
                      </div>
                    </div>
                    <div className="h-8 w-px bg-white/20" />
                    <div className="text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Thấp nhất</span>
                      <div className="text-lg font-bold text-rose-300">
                        {data.matchScore.min !== null ? data.matchScore.min : '-'}
                      </div>
                    </div>
                    <div className="h-8 w-px bg-white/20" />
                    <div className="text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Cao nhất</span>
                      <div className="text-lg font-bold text-amber-300">
                        {data.matchScore.max !== null ? data.matchScore.max : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
