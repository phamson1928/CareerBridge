import { useEffect, useState, useCallback } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Building,
  CheckCircle,
  Download,
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
  LayoutDashboard,
  Award,
  Layers,
} from 'lucide-react';
import { getApiErrorMessage } from '../../auth/api';
import { companiesApi, CompanyProfileRecord } from '../../companies/api';
import { dashboardApi } from '../../dashboard/api';
import type { CompanyDashboardData } from '../../dashboard/types';
import { semestersApi } from '../../semesters/api';
import { findDefaultSemester, toSemesterSlug } from '../../semesters/utils';
import { downloadExcelWorkbook } from '../../utils/excelExport';
import type { SemesterRecord } from '../../semesters/types';
import { CompanyInternshipStatsModal } from './CompanyInternshipStatsModal';
import { SemesterCampaignBanner } from '../Semesters/SemesterCampaignBanner';

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
  const [lastUpdated, setLastUpdated] = useState<string>('');

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
          const semList = semPage.items || [];
          setSemesters(semList);
          const def = findDefaultSemester(semList, 'COMPANY');
          if (def) setSelectedSemesterId(def.id);
          const now = new Date();
          setLastUpdated(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} ${now.getDate()} thg ${now.getMonth() + 1}, ${now.getFullYear()}`);
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
      const now = new Date();
      setLastUpdated(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} ${now.getDate()} thg ${now.getMonth() + 1}, ${now.getFullYear()}`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSemesterId, page]);

  useEffect(() => {
    if (!company) return;
    if (company.status === 'DRAFT' || company.status === 'PENDING' || company.status === 'REJECTED') {
      setLoading(false);
      return;
    }
    void fetchDashboardStats();
  }, [company, fetchDashboardStats]);

  const handleSemesterChange = (newSemesterId: string) => {
    setSelectedSemesterId(newSemesterId);
    setPage(1);
  };

  // Xuất Excel danh sách tin tuyển dụng & hiệu quả
  const exportStatsExcel = () => {
    if (!dashboardData || dashboardData.perInternship.items.length === 0) return;

    const currentSem = semesters.find((s) => s.id === selectedSemesterId);
    const semName = currentSem ? currentSem.name : 'Tat-ca-dot';
    const slug = toSemesterSlug(semName);

    downloadExcelWorkbook(`thong-ke-tuyen-dung-${slug}`, [
      {
        name: 'Thong Ke Tuyen Dung',
        title: `BÁO CÁO HIỆU QUẢ TUYỂN DỤNG THỰC TẬP — ${semName.toUpperCase()}`,
        subtitle: `Doanh nghiệp: ${company?.companyName || ''} — Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`,
        columns: [
          { header: 'STT', width: 45, value: (_: unknown, index: number) => index + 1 },
          { header: 'Vị trí tuyển dụng', width: 220, value: (item: any) => item.title },
          { header: 'Đợt thực tập', width: 150, value: (item: any) => item.semesterName || '—' },
          { header: 'Trạng thái', width: 110, value: (item: any) => item.status },
          { header: 'Chỉ tiêu', width: 80, value: (item: any) => item.slots },
          { header: 'Đã nhận', width: 80, value: (item: any) => item.filledSlots },
          { header: 'Lượt xem', width: 90, value: (item: any) => item.views },
          { header: 'Đơn nộp', width: 90, value: (item: any) => item.applications },
          {
            header: 'Tỷ lệ lấp đầy',
            width: 120,
            value: (item: any) => (item.fillRate ? `${(item.fillRate * 100).toFixed(1)}%` : '0%'),
          },
          {
            header: 'Tỷ lệ chấp thuận',
            width: 120,
            value: (item: any) => (item.acceptRate ? `${(item.acceptRate * 100).toFixed(1)}%` : '0%'),
          },
        ],
        rows: dashboardData.perInternship.items,
      },
    ]);
  };

  const formatHours = (hours: number | null | undefined) => {
    if (hours === null || hours === undefined) return 'Chưa đủ dữ liệu';
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} phút`;
    }
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
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xs">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-rose-600" />
        <h3 className="text-base font-bold text-slate-900">Chưa có hồ sơ doanh nghiệp</h3>
        <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
          {error || 'Hãy tạo và gửi hồ sơ xác minh doanh nghiệp để bắt đầu quản lý tuyển dụng và xem thống kê số liệu.'}
        </p>
        <button
          onClick={() => onNavigateTab('company-profile')}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition"
        >
          Cập nhật hồ sơ doanh nghiệp
        </button>
      </div>
    );
  }

  const isPendingApproval = company.status === 'DRAFT' || company.status === 'PENDING' || company.status === 'REJECTED';
  const currentSemester = semesters.find((s) => s.id === selectedSemesterId);

  return (
    <div className="space-y-6">
      {/* 1. Page Header (Modern Clean SaaS Style) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200/60 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-800 mb-2">
            <LayoutDashboard className="h-3.5 w-3.5 text-teal-600" />
            <span>TỔNG QUAN DOANH NGHIỆP</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Trung tâm điều hành tuyển dụng
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Theo dõi tuyển dụng, hồ sơ ứng viên và tiến độ tuyển sinh bằng dữ liệu vận hành thời gian thực.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void fetchDashboardStats(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
            <span>Làm mới</span>
          </button>

          {dashboardData && dashboardData.perInternship.items.length > 0 && (
            <button
              type="button"
              onClick={exportStatsExcel}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-50 border border-teal-200 px-4 py-2.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-teal-700" />
              <span>Xuất Excel</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCreatePosting}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Đăng tuyển mới</span>
          </button>
        </div>
      </div>

      {/* 2. Company Profile Mini-Card (Soft UI Hero replacement) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xl font-bold text-teal-800 shadow-2xs overflow-hidden">
            {company.logo ? (
              <img src={company.logo} alt={company.companyName} className="h-full w-full object-cover" />
            ) : (
              <Building className="h-6 w-6 text-teal-600" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{company.companyName}</h2>
              {company.status === 'APPROVED' && (
                <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-teal-800">
                  ✓ Đã xác minh
                </span>
              )}
              {company.status === 'SUSPENDED' && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                  ⚠ Tạm dừng hoạt động
                </span>
              )}
              {company.status === 'PENDING' && (
                <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-800">
                  ⏳ Đang chờ xác minh
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {company.tagline || 'Thống kê hiệu quả tuyển dụng & phân tích chất lượng ứng viên'}
              {company.address ? ` • ${company.address}` : ''}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('company-profile')}
          className="text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline"
        >
          Chỉnh sửa hồ sơ →
        </button>
      </div>

      {/* Thông báo nếu chưa được xác minh (PENDING/DRAFT/REJECTED) */}
      {isPendingApproval && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 text-amber-900 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700 shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="text-sm font-bold text-amber-950">
                Tính năng Thống kê Tuyển dụng đang tạm khóa
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed max-w-2xl">
                Hồ sơ doanh nghiệp hiện đang ở trạng thái <strong>{company.status}</strong>. Hệ thống thống kê tuyển dụng, phễu ứng tuyển và phân tích kỹ năng ứng viên sẽ tự động kích hoạt ngay khi hồ sơ của bạn được Nhà trường phê duyệt (APPROVED).
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigateTab('company-profile')}
                  className="rounded-xl bg-amber-700 px-4 py-2 text-xs font-bold text-white hover:bg-amber-800 transition"
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
          {/* Tiến trình Đợt thực tập / Campaign Timeline Banner */}
          <SemesterCampaignBanner role="COMPANY" />

          {/* 3. Segmented Filter Toolbar (Reference Style) */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-slate-500 mb-1 font-medium">Kỳ thực tập</label>
                <select
                  value={selectedSemesterId}
                  onChange={(e) => handleSemesterChange(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none transition"
                >
                  <option value="">Toàn bộ các đợt</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-500 mb-1 font-medium">Phạm vi tuyển dụng</label>
                <div className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2.5 flex items-center justify-between">
                  <span>{company.companyName}</span>
                  <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-md">DN</span>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-500 mb-1 font-medium">Trạng thái dữ liệu</label>
                <div className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-500" />
                  <span>Dữ liệu thời gian thực</span>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-500 mb-1 font-medium">Đợt hiển thị</label>
                <div className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2.5 truncate">
                  {currentSemester ? currentSemester.name : 'Tất cả các đợt'}
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-200/50 text-xs text-slate-500 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Cập nhật: {lastUpdated || 'Vừa xong'}</span>
              </span>
              <span>•</span>
              <span>Phạm vi: {currentSemester ? currentSemester.name : 'Toàn hệ thống'}</span>
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
              {/* 4. KPI Metrics Bento Grid (3-Tier Structure + Pastel Circles) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="LƯỢT XEM BÀI ĐĂNG"
                  value={dashboardData.kpis.totalViews}
                  subtext={`${dashboardData.kpis.uniqueViewers} sinh viên duy nhất đã xem`}
                  icon={<Eye className="h-5 w-5 text-sky-600" />}
                  iconBgColor="bg-sky-50"
                />

                <MetricCard
                  label="ĐƠN ỨNG TUYỂN"
                  value={dashboardData.kpis.totalApplications}
                  subtext={`${dashboardData.kpis.applicationsByStatus.ACCEPTED} ứng viên đã tiếp nhận`}
                  icon={<FileText className="h-5 w-5 text-teal-600" />}
                  iconBgColor="bg-teal-50"
                />

                <MetricCard
                  label="CHỈ TIÊU LẤP ĐẦY"
                  value={`${dashboardData.kpis.filledSlots} / ${dashboardData.kpis.totalSlots}`}
                  subtext={`Đạt ${formatPercent(dashboardData.kpis.fillRate)} tổng chỉ tiêu`}
                  icon={<Target className="h-5 w-5 text-amber-600" />}
                  iconBgColor="bg-amber-50"
                />

                <MetricCard
                  label="TIN TUYỂN DỤNG"
                  value={dashboardData.kpis.totalInternships}
                  subtext={`${dashboardData.kpis.openInternships} đang mở • ${dashboardData.kpis.closedInternships} đã đóng`}
                  icon={<Briefcase className="h-5 w-5 text-rose-600" />}
                  iconBgColor="bg-rose-50"
                />
              </div>

              {/* 5. Accent Progress Cards (Bottom Row Reference Style) */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Accent 1: Tỷ lệ lấp đầy slot */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 border-l-4 border-l-teal-600 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      TỶ LỆ LẤP ĐẦY CHỈ TIÊU (FILL RATE)
                    </span>
                    <div className="text-3xl font-bold text-teal-800 mt-2 tracking-tight">
                      {formatPercent(dashboardData.kpis.fillRate)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {dashboardData.kpis.filledSlots}/{dashboardData.kpis.totalSlots} vị trí đã được sử dụng
                    </p>
                  </div>
                </div>

                {/* Accent 2: Tỷ lệ chấp thuận sau xem xét */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 border-l-4 border-l-teal-600 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      TỶ LỆ TUYỂN DỤNG THÀNH CÔNG
                    </span>
                    <div className="text-3xl font-bold text-teal-800 mt-2 tracking-tight">
                      {formatPercent(dashboardData.funnel.acceptRate)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {dashboardData.funnel.accepted} sinh viên trúng tuyển trên tổng {dashboardData.funnel.applied} đơn
                    </p>
                  </div>
                </div>

                {/* Accent 3: Đơn chờ duyệt (cần xử lý) */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 border-l-4 border-l-rose-500 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      HỒ SƠ CHỜ DUYỆT CẦN XỬ LÝ
                    </span>
                    <div className="text-3xl font-bold text-rose-600 mt-2 tracking-tight">
                      {dashboardData.kpis.applicationsByStatus.PENDING}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Ứng viên đang chờ phản hồi từ doanh nghiệp
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigateTab('applicants')}
                    className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors cursor-pointer"
                    title="Chuyển đến duyệt ứng viên"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* 6. Phân bố trạng thái & Thời gian tuyển trung bình (Time to Hire) */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Thời gian tuyển TB */}
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-teal-50 p-2 text-teal-700">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Thời gian tuyển dụng trung bình (Time-to-Hire)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Tốc độ xử lý hồ sơ từ khi nộp đến lúc có kết quả
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-slate-50/70 p-3.5 border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Tới khi tiếp nhận (Accept)
                      </span>
                      <div className="mt-1 text-xl font-bold text-slate-900">
                        {formatHours(dashboardData.kpis.avgHoursToAccept)}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Áp dụng cho hồ sơ trạng thái ACCEPTED
                      </span>
                    </div>

                    <div className="rounded-xl bg-slate-50/70 p-3.5 border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Tới quyết định (Accept/Reject)
                      </span>
                      <div className="mt-1 text-xl font-bold text-slate-900">
                        {formatHours(dashboardData.kpis.avgHoursToDecision)}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Áp dụng cho hồ sơ ACCEPTED & REJECTED
                      </span>
                    </div>
                  </div>
                </div>

                {/* Phân bố trạng thái tin */}
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-teal-50 p-2 text-teal-700">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Cơ cấu trạng thái tin tuyển dụng
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Tổng số {dashboardData.kpis.totalInternships} vị trí trong phạm vi
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-xl bg-teal-50/60 p-3 border border-teal-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">Đang mở</span>
                      <div className="mt-1 text-xl font-bold text-teal-900">{dashboardData.kpis.openInternships}</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">Đã đóng</span>
                      <div className="mt-1 text-xl font-bold text-slate-800">{dashboardData.kpis.closedInternships}</div>
                    </div>
                    <div className="rounded-xl bg-amber-50/60 p-3 border border-amber-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Bản nháp</span>
                      <div className="mt-1 text-xl font-bold text-amber-900">{dashboardData.kpis.draftInternships}</div>
                    </div>
                    <div className="rounded-xl bg-rose-50/60 p-3 border border-rose-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">Đã hủy</span>
                      <div className="mt-1 text-xl font-bold text-rose-900">{dashboardData.kpis.cancelledInternships}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. Recruitment Funnel (Phễu Tuyển Dụng) */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-teal-600" />
                      Phễu tuyển dụng tổng thể (Recruitment Funnel)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Đo lường tỷ lệ chuyển đổi qua các vòng từ lúc nộp đơn tới khi ra quyết định
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <span>Tổng đơn nộp:</span>
                    <span className="text-teal-700 font-bold text-sm">{dashboardData.funnel.applied}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">1. Đã nộp</span>
                    <div className="mt-1 text-2xl font-bold text-slate-900">{dashboardData.funnel.applied}</div>
                    <span className="mt-1.5 inline-block rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      100%
                    </span>
                  </div>

                  <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3.5 text-center">
                    <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">2. Đang/Đã duyệt</span>
                    <div className="mt-1 text-2xl font-bold text-sky-900">{dashboardData.funnel.everReviewing}</div>
                    <span className="mt-1.5 inline-block rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                      {formatPercent(dashboardData.funnel.reviewRate)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3.5 text-center">
                    <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">3. Được nhận</span>
                    <div className="mt-1 text-2xl font-bold text-teal-900">{dashboardData.funnel.accepted}</div>
                    <span className="mt-1.5 inline-block rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                      {formatPercent(dashboardData.funnel.acceptRate)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 text-center">
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">4. Từ chối</span>
                    <div className="mt-1 text-2xl font-bold text-rose-900">{dashboardData.funnel.rejected}</div>
                    <span className="mt-1.5 inline-block rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                      {formatPercent(dashboardData.funnel.rejectRate)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 text-center">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">5. Rút hồ sơ</span>
                    <div className="mt-1 text-2xl font-bold text-slate-800">{dashboardData.funnel.withdrawn}</div>
                    <span className="mt-1.5 inline-block rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      {formatPercent(dashboardData.funnel.withdrawRate)}
                    </span>
                  </div>
                </div>

                {dashboardData.funnel.everReviewing > 0 && (
                  <div className="mt-3 rounded-xl bg-teal-50/60 border border-teal-100 px-4 py-2.5 text-xs text-teal-900 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span>
                      Tỷ lệ trúng tuyển sau khi vào vòng xem xét (Accept given Reviewing):
                    </span>
                    <strong className="text-teal-950 font-bold text-sm">
                      {formatPercent(dashboardData.funnel.acceptGivenReview)}
                    </strong>
                  </div>
                )}
              </div>

              {/* 8. Top 10 Applicant Skills */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-teal-600" />
                      Top 10 kỹ năng phổ biến của ứng viên
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Dữ liệu tổng hợp từ các sinh viên đã nộp đơn vào doanh nghiệp
                    </p>
                  </div>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 border border-slate-200">
                    Bảo mật: Ẩn danh hoàn toàn
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
                        className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 hover:border-teal-200 hover:bg-teal-50/20 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-800">
                            #{index + 1}
                          </span>
                          <span className="text-[11px] font-bold text-teal-700">
                            {skill.applicantCount} ứng viên
                          </span>
                        </div>
                        <div className="mt-2 font-bold text-slate-800 text-xs truncate" title={skill.name}>
                          {skill.name}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Tỷ lệ: {formatPercent(skill.share)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 9. Performance by Internship Table */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-teal-600" />
                      Hiệu quả theo từng vị trí tuyển dụng
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bảng chi tiết số liệu chuyển đổi từng tin tuyển dụng trong kỳ
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    Tổng <strong>{dashboardData.perInternship.meta.total}</strong> vị trí
                  </span>
                </div>

                {dashboardData.perInternship.items.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 italic">
                    Chưa có tin tuyển dụng nào trong phạm vi đợt này.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-3">Vị trí tuyển dụng</th>
                          <th className="py-3 px-3 text-center">Trạng thái</th>
                          <th className="py-3 px-3 text-center">Chỉ tiêu</th>
                          <th className="py-3 px-3 text-center">Đã nhận</th>
                          <th className="py-3 px-3 text-center">Lượt xem</th>
                          <th className="py-3 px-3 text-center">Đơn nộp</th>
                          <th className="py-3 px-3 text-center">Tỷ lệ lấp đầy</th>
                          <th className="py-3 px-3 text-center">Tỷ lệ nhận</th>
                          <th className="py-3 px-3 text-right">Chi tiết</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dashboardData.perInternship.items.map((job) => (
                          <tr key={job.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3.5 px-3">
                              <div className="font-bold text-slate-900 text-xs">{job.title}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {job.semesterName || '—'}
                              </div>
                            </td>

                            <td className="py-3.5 px-3 text-center">
                              {job.status === 'OPEN' && (
                                <span className="inline-flex rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800 border border-teal-200">
                                  Đang mở
                                </span>
                              )}
                              {job.status === 'CLOSED' && (
                                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                                  Đã đóng
                                </span>
                              )}
                              {job.status === 'DRAFT' && (
                                <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                                  Nháp
                                </span>
                              )}
                              {job.status === 'CANCELLED' && (
                                <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-200">
                                  Đã hủy
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                              {job.slots}
                            </td>

                            <td className="py-3.5 px-3 text-center">
                              <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                                {job.filledSlots}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 text-center text-slate-600">
                              {job.views}
                            </td>

                            <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                              {job.applications}
                            </td>

                            <td className="py-3.5 px-3 text-center">
                              <span className="font-semibold text-slate-700">
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
                                className="inline-flex items-center gap-1 rounded-xl bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 border border-teal-200 transition cursor-pointer"
                              >
                                <BarChart3 className="h-3.5 w-3.5" /> Xem
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
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> Trước
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(dashboardData.perInternship.meta.totalPages, p + 1))}
                        disabled={dashboardData.perInternship.meta.page >= dashboardData.perInternship.meta.totalPages}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                      >
                        Sau <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* 10. Quick Action Navigation Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
  iconBgColor = 'bg-teal-50',
}: {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  iconBgColor?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow transition-shadow flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </span>
          <div className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">
            {value}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            {subtext}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBgColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ActionCard({ title, body, onClick }: { title: string; body: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-xs transition-all hover:border-teal-200 hover:shadow-md cursor-pointer"
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition">
          {title}
        </h3>
        <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-teal-700 transition" />
      </div>
      <p className="text-xs leading-relaxed text-slate-500">{body}</p>
    </button>
  );
}

function LoadingState() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-16 text-center text-sm text-slate-500 shadow-xs">
      <LoaderCircle className="mx-auto mb-3 h-8 w-8 animate-spin text-teal-600" />
      <span className="font-semibold">Đang tải số liệu thống kê tuyển dụng...</span>
    </div>
  );
}
