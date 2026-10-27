import { useEffect, useState, useCallback } from 'react';
import {
  ArrowUpRight,
  Briefcase,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Filter,
  LoaderCircle,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Undo2,
  Calendar,
  Lock,
} from 'lucide-react';
import { getApiErrorMessage } from '../../auth/api';
import { companiesApi, CompanyProfileRecord } from '../../companies/api';
import { dashboardApi } from '../../dashboard/api';
import type { CompanyDashboardData } from '../../dashboard/types';
import { semestersApi } from '../../semesters/api';
import type { SemesterRecord } from '../../semesters/types';
import { CompanyInternshipStatsModal } from './CompanyInternshipStatsModal';

interface CompanyDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenCreatePosting: () => void;
}

export function CompanyDashboard({ onNavigateTab, onOpenCreatePosting }: CompanyDashboardProps) {
  const [company, setCompany] = useState<CompanyProfileRecord | null>(null);
  const [dashboardData, setDashboardData] = useState<CompanyDashboardData | null>(null);
  const [semesters, setSemesters] = useState<SemesterRecord[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal xem chi tiết thống kê của 1 tin tuyển dụng
  const [selectedInternshipIdForStats, setSelectedInternshipIdForStats] = useState<string | null>(null);

  // 1. Tải thông tin hồ sơ doanh nghiệp và danh sách đợt
  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const [profile, semPage] = await Promise.all([
          companiesApi.getMine(),
          semestersApi.list({ page: 1, limit: 100 }),
        ]);
        if (active) {
          setCompany(profile);
          setSemesters(semPage.items || []);
        }
      } catch (err) {
        if (active) setError(getApiErrorMessage(err));
      }
    };
    void init();
    return () => {
      active = false;
    };
  }, []);

  // 2. Tải số liệu thống kê Dashboard theo kỳ và phân trang
  const fetchDashboardStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await dashboardApi.getCompany({
        semesterId: selectedSemesterId || undefined,
        page,
        limit: pageSize,
      });
      setDashboardData(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSemesterId, page]);

  useEffect(() => {
    if (company && (company.status === 'APPROVED' || company.status === 'SUSPENDED')) {
      void fetchDashboardStats();
    } else if (company) {
      setLoading(false);
    }
  }, [company, fetchDashboardStats]);

  const handleSemesterChange = (semesterId: string) => {
    setSelectedSemesterId(semesterId);
    setPage(1); // Reset về trang 1 khi lọc
  };

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

  if (loading && !dashboardData && !company) {
    return <LoadingState />;
  }

  if (!company) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-10 text-center shadow-xs">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-rose-600" />
        <h3 className="text-base font-extrabold text-slate-900">Chưa có hồ sơ doanh nghiệp</h3>
        <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
          {error || 'Hãy tạo và gửi hồ sơ xác minh doanh nghiệp để bắt đầu quản lý tuyển dụng và xem thống kê số liệu.'}
        </p>
        <button
          onClick={() => onNavigateTab('company-profile')}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
        >
          Cập nhật hồ sơ doanh nghiệp
        </button>
      </div>
    );
  }

  const isPendingApproval = company.status === 'DRAFT' || company.status === 'PENDING' || company.status === 'REJECTED';

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <section className="company-hero relative overflow-hidden flex flex-col items-start justify-between gap-6 rounded-3xl bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 p-6 text-white shadow-xl md:flex-row md:items-center border border-emerald-900/40">
        <div className="flex items-center gap-4 z-10">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-emerald-400 bg-emerald-100 text-xl font-black text-emerald-800 shadow-md overflow-hidden">
            {company.logo ? (
              <img src={company.logo} alt={company.companyName} className="h-full w-full object-cover" />
            ) : (
              company.companyName.charAt(0)
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black">{company.companyName}</h1>
              {company.status === 'APPROVED' && (
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                  ✓ Đã xác minh
                </span>
              )}
              {company.status === 'SUSPENDED' && (
                <span className="rounded-full border border-amber-400/40 bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                  ⚠ Tạm dừng hoạt động
                </span>
              )}
              {company.status === 'PENDING' && (
                <span className="rounded-full border border-blue-400/40 bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-bold text-blue-300">
                  ⏳ Đang chờ xác minh
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-300">
              {company.tagline || 'Thống kê hiệu quả tuyển dụng & phân tích chất lượng ứng viên'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={onOpenCreatePosting}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-black text-slate-950 shadow-lg hover:bg-emerald-400 transition"
          >
            <Plus className="h-4 w-4" /> Đăng tuyển thực tập mới
          </button>
        </div>
      </section>

      {/* Thông báo nếu chưa được xác minh (PENDING/DRAFT/REJECTED) */}
      {isPendingApproval && (
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-6 text-amber-900 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
              <Lock className="h-6 w-6" />
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="text-base font-extrabold text-amber-950">
                Tính năng Thống kê Tuyển dụng đang tạm khóa
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed max-w-2xl">
                Hồ sơ doanh nghiệp hiện đang ở trạng thái <strong>{company.status}</strong>. Hệ thống thống kê tuyển dụng, phễu ứng tuyển và phân tích kỹ năng ứng viên sẽ tự động kích hoạt ngay khi hồ sơ của bạn được Nhà trường phê duyệt (APPROVED).
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigateTab('company-profile')}
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition"
                >
                  Xem tình trạng hồ sơ xác minh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thông báo nếu đang SUSPENDED */}
      {company.status === 'SUSPENDED' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              Tài khoản đang trong trạng thái <strong>TẠM DỪNG</strong>. Bạn vẫn có thể tra cứu toàn bộ số liệu thống kê lịch sử và hiệu quả tuyển dụng các đợt thực tập bên dưới.
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('company-profile')}
            className="text-amber-800 font-bold underline hover:text-amber-950"
          >
            Xem lý do
          </button>
        </div>
      )}

      {/* Nếu được phép xem stats (APPROVED hoặc SUSPENDED) */}
      {!isPendingApproval && (
        <>
          {/* Controls & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Filter className="h-4 w-4 text-emerald-600" />
                <span>Lọc theo đợt thực tập:</span>
              </div>
              <select
                value={selectedSemesterId}
                onChange={(e) => handleSemesterChange(e.target.value)}
                className="rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition"
              >
                <option value="">Tất cả các đợt tuyển dụng</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => void fetchDashboardStats(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
                <span>Làm mới số liệu</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {dashboardData && (
            <>
              {/* 1. KPIs Top Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="Lượt xem tuyển dụng"
                  value={dashboardData.kpis.totalViews}
                  subtext={`${dashboardData.kpis.uniqueViewers} ứng viên duy nhất đã xem`}
                  icon={<Eye className="h-5 w-5" />}
                  tone="blue"
                />
                <MetricCard
                  label="Đơn nộp ứng tuyển"
                  value={dashboardData.kpis.totalApplications}
                  subtext={`${dashboardData.kpis.applicationsByStatus.ACCEPTED} hồ sơ đã tiếp nhận`}
                  icon={<FileText className="h-5 w-5" />}
                  tone="emerald"
                />
                <MetricCard
                  label="Lấp đầy chỉ tiêu"
                  value={`${dashboardData.kpis.filledSlots} / ${dashboardData.kpis.totalSlots}`}
                  subtext={`Đạt ${formatPercent(dashboardData.kpis.fillRate)} tổng chỉ tiêu`}
                  icon={<Target className="h-5 w-5" />}
                  tone="amber"
                />
                <MetricCard
                  label="Tin tuyển dụng"
                  value={dashboardData.kpis.totalInternships}
                  subtext={`${dashboardData.kpis.openInternships} đang mở · ${dashboardData.kpis.closedInternships} đã đóng`}
                  icon={<Briefcase className="h-5 w-5" />}
                  tone="purple"
                />
              </div>

              {/* Phân bố tin & Thời gian tuyển trung bình (Time to Hire) */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Thời gian tuyển TB */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl bg-purple-100 p-2 text-purple-700">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Thời gian tuyển dụng trung bình (Time-to-Hire)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Tốc độ xử lý hồ sơ từ khi nộp đến lúc có kết quả
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Tới khi tiếp nhận (Accept)
                      </span>
                      <div className="mt-1 text-lg font-black text-slate-900">
                        {formatHours(dashboardData.kpis.avgHoursToAccept)}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Áp dụng cho hồ sơ trạng thái ACCEPTED
                      </span>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Tới quyết định (Accept/Reject)
                      </span>
                      <div className="mt-1 text-lg font-black text-slate-900">
                        {formatHours(dashboardData.kpis.avgHoursToDecision)}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Áp dụng cho hồ sơ ACCEPTED & REJECTED
                      </span>
                    </div>
                  </div>
                </div>

                {/* Phân bố trạng thái tin */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl bg-teal-100 p-2 text-teal-700">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Cơ cấu trạng thái tin tuyển dụng
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Tổng số {dashboardData.kpis.totalInternships} vị trí trong phạm vi
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-xl bg-emerald-50/80 p-3 border border-emerald-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Đang mở</span>
                      <div className="mt-1 text-xl font-black text-emerald-950">{dashboardData.kpis.openInternships}</div>
                    </div>
                    <div className="rounded-xl bg-slate-100/80 p-3 border border-slate-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">Đã đóng</span>
                      <div className="mt-1 text-xl font-black text-slate-900">{dashboardData.kpis.closedInternships}</div>
                    </div>
                    <div className="rounded-xl bg-amber-50/80 p-3 border border-amber-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Bản nháp</span>
                      <div className="mt-1 text-xl font-black text-amber-950">{dashboardData.kpis.draftInternships}</div>
                    </div>
                    <div className="rounded-xl bg-rose-50/80 p-3 border border-rose-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">Đã hủy</span>
                      <div className="mt-1 text-xl font-black text-rose-950">{dashboardData.kpis.cancelledInternships}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Recruitment Funnel (Phễu Tuyển Dụng) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      Phễu tuyển dụng tổng thể (Recruitment Funnel)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Đo lường tỷ lệ chuyển đổi qua các vòng từ lúc nộp đơn tới khi ra quyết định
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <span>Tổng đơn nộp:</span>
                    <span className="text-emerald-700 font-black text-sm">{dashboardData.funnel.applied}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">1. Đã nộp</span>
                    <div className="mt-1 text-2xl font-black text-slate-900">{dashboardData.funnel.applied}</div>
                    <span className="mt-1.5 inline-block rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      100%
                    </span>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 text-center">
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">2. Đang/Đã duyệt</span>
                    <div className="mt-1 text-2xl font-black text-blue-900">{dashboardData.funnel.everReviewing}</div>
                    <span className="mt-1.5 inline-block rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                      {formatPercent(dashboardData.funnel.reviewRate)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-center">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">3. Được nhận</span>
                    <div className="mt-1 text-2xl font-black text-emerald-900">{dashboardData.funnel.accepted}</div>
                    <span className="mt-1.5 inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {formatPercent(dashboardData.funnel.acceptRate)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 text-center">
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">4. Từ chối</span>
                    <div className="mt-1 text-2xl font-black text-rose-900">{dashboardData.funnel.rejected}</div>
                    <span className="mt-1.5 inline-block rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                      {formatPercent(dashboardData.funnel.rejectRate)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 text-center">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">5. Rút hồ sơ</span>
                    <div className="mt-1 text-2xl font-black text-slate-800">{dashboardData.funnel.withdrawn}</div>
                    <span className="mt-1.5 inline-block rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      {formatPercent(dashboardData.funnel.withdrawRate)}
                    </span>
                  </div>
                </div>

                {dashboardData.funnel.everReviewing > 0 && (
                  <div className="mt-3 rounded-xl bg-emerald-50/60 border border-emerald-100 px-4 py-2.5 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span>
                      Tỷ lệ trúng tuyển sau khi vào vòng xem xét (Accept given Reviewing):
                    </span>
                    <strong className="text-emerald-950 font-black text-sm">
                      {formatPercent(dashboardData.funnel.acceptGivenReview)}
                    </strong>
                  </div>
                )}

                {/* Phân bố 5 trạng thái đơn hiện tại */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      Phân bổ trạng thái hiện tại ({dashboardData.kpis.totalApplications} hồ sơ):
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 font-bold text-amber-800 border border-amber-200">
                        <Clock className="h-3.5 w-3.5" /> Chờ duyệt: {dashboardData.kpis.applicationsByStatus.PENDING}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 font-bold text-blue-800 border border-blue-200">
                        <Eye className="h-3.5 w-3.5" /> Đang xem xét: {dashboardData.kpis.applicationsByStatus.REVIEWING}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 font-bold text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Đã nhận: {dashboardData.kpis.applicationsByStatus.ACCEPTED}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1 font-bold text-rose-800 border border-rose-200">
                        <XCircle className="h-3.5 w-3.5" /> Từ chối: {dashboardData.kpis.applicationsByStatus.REJECTED}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-bold text-slate-700 border border-slate-200">
                        <Undo2 className="h-3.5 w-3.5" /> Đã rút: {dashboardData.kpis.applicationsByStatus.WITHDRAWN}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Top 10 Applicant Skills (Nguồn Kỹ Năng Ứng Viên) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                      Top 10 kỹ năng phổ biến của ứng viên
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Dữ liệu tổng hợp từ các sinh viên đã nộp đơn vào doanh nghiệp
                    </p>
                  </div>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 border border-slate-200">
                    Bảo mật: Ẩn danh hoàn toàn (Không PII)
                  </span>
                </div>

                {dashboardData.applicantSkills.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 italic">
                    Chưa có ứng viên nộp hồ sơ hoặc ứng viên chưa khai báo kỹ năng trong kỳ này.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {dashboardData.applicantSkills.map((skill, index) => (
                      <div
                        key={skill.skillId}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 hover:border-indigo-200 hover:bg-indigo-50/30 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-black text-indigo-700">
                            #{index + 1}
                          </span>
                          <span className="text-[11px] font-bold text-indigo-700">
                            {formatPercent(skill.share)}
                          </span>
                        </div>
                        <h4 className="mt-2 text-xs font-black text-slate-900 truncate" title={skill.name}>
                          {skill.name}
                        </h4>
                        <div className="mt-1 text-[11px] text-slate-500">
                          {skill.applicantCount} ứng viên có kỹ năng
                        </div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-600"
                            style={{ width: `${Math.min(100, Math.max(0, skill.share * 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Thống kê theo từng tin tuyển dụng (perInternship) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-emerald-600" />
                      Hiệu quả tuyển dụng theo từng vị trí
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Theo dõi số lượt xem, hồ sơ nộp, và tỷ lệ tuyển dụng của từng bài đăng
                    </p>
                  </div>
                  <div className="text-xs text-slate-500 font-semibold">
                    Tổng cộng: <strong>{dashboardData.perInternship.meta.total}</strong> vị trí
                  </div>
                </div>

                {dashboardData.perInternship.items.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-400">
                    Chưa có bài đăng tuyển dụng nào trong bộ lọc này.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                          <th className="py-3 px-3">Vị trí & Đợt thực tập</th>
                          <th className="py-3 px-3">Trạng thái</th>
                          <th className="py-3 px-3 text-center">Lượt xem / Người xem</th>
                          <th className="py-3 px-3 text-center">Đơn ứng tuyển</th>
                          <th className="py-3 px-3 text-center">Chỉ tiêu / Đã nhận</th>
                          <th className="py-3 px-3 text-center">Tỷ lệ lấp đầy</th>
                          <th className="py-3 px-3 text-center">Tỷ lệ tuyển</th>
                          <th className="py-3 px-3 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dashboardData.perInternship.items.map((job) => (
                          <tr key={job.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3.5 px-3">
                              <div className="font-extrabold text-slate-900 hover:text-emerald-700 transition">
                                {job.title}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                {job.semesterName || 'Chưa gán đợt'}
                              </div>
                            </td>

                            <td className="py-3.5 px-3">
                              <span
                                className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                                  job.status === 'OPEN'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : job.status === 'CLOSED'
                                      ? 'bg-slate-100 text-slate-700'
                                      : job.status === 'DRAFT'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {job.status === 'OPEN'
                                  ? 'Đang mở'
                                  : job.status === 'CLOSED'
                                    ? 'Đã đóng'
                                    : job.status === 'DRAFT'
                                      ? 'Bản nháp'
                                      : 'Đã hủy'}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 text-center">
                              <span className="font-extrabold text-slate-900">{job.views}</span>
                              <span className="text-slate-400 text-[11px]"> ({job.uniqueViewers} SV)</span>
                            </td>

                            <td className="py-3.5 px-3 text-center">
                              <span className="font-extrabold text-slate-900">{job.applications}</span>
                            </td>

                            <td className="py-3.5 px-3 text-center">
                              <span className="font-bold text-slate-900">
                                {job.filledSlots} / {job.slots}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 text-center">
                              <span
                                className={`font-bold ${
                                  job.fillRate >= 1
                                    ? 'text-emerald-700'
                                    : job.fillRate > 0
                                      ? 'text-amber-700'
                                      : 'text-slate-400'
                                }`}
                              >
                                {formatPercent(job.fillRate)}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 text-center">
                              <span className="font-semibold text-slate-700">
                                {formatPercent(job.acceptRate)}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedInternshipIdForStats(job.id)}
                                className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                              >
                                <BarChart3 className="h-3.5 w-3.5" /> Xem thống kê
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Phân trang cho perInternship */}
                {dashboardData.perInternship.meta.totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
                    <span className="text-slate-500 font-semibold">
                      Trang <strong>{dashboardData.perInternship.meta.page}</strong> / {dashboardData.perInternship.meta.totalPages} (Tổng {dashboardData.perInternship.meta.total} tin)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={dashboardData.perInternship.meta.page <= 1}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> Trước
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(dashboardData.perInternship.meta.totalPages, p + 1))}
                        disabled={dashboardData.perInternship.meta.page >= dashboardData.perInternship.meta.totalPages}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
                      >
                        Sau <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <ActionCard
              title="Quản lý bài đăng tuyển dụng"
              body="Xem danh sách bài đăng, cập nhật hạn nộp, lưu làm mẫu tin hoặc đăng lại cho đợt tiếp theo."
              onClick={() => onNavigateTab('postings')}
            />
            <ActionCard
              title="Ứng viên & duyệt hồ sơ"
              body="Theo dõi hồ sơ sinh viên nộp đơn, xem xét CV, chuyển trạng thái vòng tuyển và trao đổi trực tiếp."
              onClick={() => onNavigateTab('applicants')}
            />
          </div>
        </>
      )}

      {/* Modal thống kê chi tiết tin tuyển dụng */}
      {selectedInternshipIdForStats && (
        <CompanyInternshipStatsModal
          internshipId={selectedInternshipIdForStats}
          onClose={() => setSelectedInternshipIdForStats(null)}
        />
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtext,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  tone: 'emerald' | 'blue' | 'amber' | 'purple';
}) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
        <div className={`rounded-xl p-2.5 border ${tones[tone]}`}>{icon}</div>
      </div>
      <div className="mt-2">
        <h3 className="text-2xl font-black text-slate-900">{value}</h3>
        <p className="mt-1 text-xs text-slate-500 font-medium truncate">{subtext}</p>
      </div>
    </div>
  );
}

function ActionCard({ title, body, onClick }: { title: string; body: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-xs transition-all hover:border-emerald-300 hover:shadow-md cursor-pointer"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
          {title}
        </h3>
        <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-700 transition" />
      </div>
      <p className="text-xs leading-relaxed text-slate-500">{body}</p>
    </button>
  );
}

function LoadingState() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center text-sm text-slate-500 shadow-xs">
      <LoaderCircle className="mx-auto mb-3 h-8 w-8 animate-spin text-emerald-600" />
      <span className="font-semibold">Đang tải số liệu thống kê doanh nghiệp...</span>
    </div>
  );
}
