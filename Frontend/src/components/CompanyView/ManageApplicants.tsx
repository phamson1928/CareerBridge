import React, { useState, useEffect, useCallback } from 'react';
import { Application, ApplicationStatus, CompanyProfile } from '../../types';
import { getStatusBadge } from '../../utils/matching';
import { getApiErrorMessage } from '../../auth/api';
import { downloadPrivateFile } from '../../files/api';
import {
  applicationsApi,
  toLegacyApplication,
  type InterviewMode,
} from '../../applications/api';
import { formatDate, formatDateTime } from '../../utils/format';
import { useAppFeedback } from '../Feedback/AppFeedbackProvider';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Sparkles,
  MessageSquare,
  Calendar,
  Mail,
  RefreshCw,
  X,
  Clock,
  MapPin,
  Video,
  Trash2,
  Lock,
  Bot,
  AlertCircle,
  Star,
  SlidersHorizontal,
} from 'lucide-react';
import { CompanyAiWorkerModal } from './CompanyAiWorkerModal';
import { AiScanDetailModal } from './AiScanDetailModal';
import { aiWorkerApi } from '../../ai-worker/api';
import { semestersApi } from '../../semesters/api';
import type { SemesterRecord } from '../../semesters/types';
import { findDefaultSemester, toSemesterSlug } from '../../semesters/utils';
import { downloadExcelWorkbook } from '../../utils/excelExport';

interface ManageApplicantsProps {
  companyProfile: CompanyProfile;
  applications: Application[];
  onUpdateStatus: (
    applicationId: string,
    status: ApplicationStatus,
    feedback?: string,
  ) => Promise<void>;
  onOpenChat: () => void;
  onReload?: () => void;
}

type ModalMode = 'INTERVIEW' | 'OFFER' | 'REJECT' | null;

const QUICK_REJECTION_REASONS = [
  'Chưa phù hợp định hướng kỹ năng hiện tại',
  'Đã tuyển đủ chỉ tiêu cho vị trí này',
  'Thời gian thực tập chưa phù hợp với lịch dự án',
  'Cần bổ sung thêm kinh nghiệm thực hành sau phỏng vấn',
];

function toDatetimeLocalValue(iso?: string | null): string {
  const date = iso ? new Date(iso) : new Date(Date.now() + 2 * 86400000);
  if (!iso) {
    date.setHours(9, 0, 0, 0);
  }
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export const ManageApplicants: React.FC<ManageApplicantsProps> = ({
  companyProfile,
  applications,
  onUpdateStatus,
  onOpenChat,
  onReload,
}) => {
  const feedback = useAppFeedback();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [semesters, setSemesters] = useState<SemesterRecord[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');

  useEffect(() => {
    semestersApi
      .list({ limit: 100 })
      .then((res) => {
        setSemesters(res.items);
        const def = findDefaultSemester(res.items, 'COMPANY');
        if (def) setSelectedSemesterId(def.id);
      })
      .catch(() => {});
  }, []);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);

  // Interview form state
  const [scheduledAt, setScheduledAt] = useState('');
  const [interviewMode, setInterviewMode] = useState<InterviewMode>('ONLINE');
  const [locationOrLink, setLocationOrLink] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [interviewNote, setInterviewNote] = useState('');

  // Offer form state (1-2 days, default 2 days)
  const [expiresInDays, setExpiresInDays] = useState(2);
  const [offerMessage, setOfferMessage] = useState('');

  // Reject form state
  const [rejectionReason, setRejectionReason] = useState(
    QUICK_REJECTION_REASONS[0],
  );
  const [companyFeedback, setCompanyFeedback] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendingLogId, setResendingLogId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [openingCvId, setOpeningCvId] = useState<string | null>(null);

  // AI Worker & Scan state
  const [isAiWorkerModalOpen, setIsAiWorkerModalOpen] = useState(false);
  const [aiDetailApp, setAiDetailApp] = useState<Application | null>(null);
  const [aiFilterRec, setAiFilterRec] = useState<string>('ALL');
  const [aiFilterScore, setAiFilterScore] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'AI_SCORE_DESC' | 'NAME_ASC'>('DATE_DESC');
  const [rescanningAppId, setRescanningAppId] = useState<string | null>(null);

  // Local applications state for real-time reactivity without manual F5
  const [localApps, setLocalApps] = useState<Application[]>(applications);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setLocalApps(applications);
  }, [applications]);

  const refreshApplications = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await applicationsApi.listMine({ page: 1, limit: 100 });
      const mapped = res.items.map(toLegacyApplication);
      setLocalApps(mapped);

      // Keep detail modal application in sync if open
      setAiDetailApp((current) => {
        if (!current) return null;
        const updated = mapped.find((a) => a.id === current.id);
        return updated || current;
      });
    } catch (err) {
      if (!silent) {
        feedback.notify({
          title: 'Không thể làm mới danh sách',
          message: getApiErrorMessage(err),
          tone: 'error',
        });
      }
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, [feedback]);

  const companyApps = localApps.filter(
    (a) => a.companyId === companyProfile.id && !a.hiddenByCompanyAt,
  );

  const hasActiveAiJobs = companyApps.some(
    (a) =>
      a.aiScanJob?.status === 'PENDING' ||
      a.aiScanJob?.status === 'PROCESSING' ||
      rescanningAppId === a.id,
  );

  // Auto-poll in background every 3 seconds while there are active AI scan tasks
  useEffect(() => {
    if (!hasActiveAiJobs) return;
    const interval = setInterval(() => {
      void refreshApplications(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [hasActiveAiJobs, refreshApplications]);

  const handleRescanCv = async (applicationId: string) => {
    setRescanningAppId(applicationId);
    try {
      await aiWorkerApi.rescanApplication(applicationId);
      feedback.notify({
        title: 'Đã đưa CV vào hàng đợi quét lại',
        message: 'AI Worker nội bộ sẽ nhận tác vụ và cập nhật kết quả trong giây lát.',
        tone: 'success',
      });
      // Immediately refresh applications to show pending/processing state
      void refreshApplications(true);
    } catch (err) {
      feedback.notify({
        title: 'Không thể quét lại CV',
        message: getApiErrorMessage(err),
        tone: 'error',
      });
    } finally {
      setRescanningAppId(null);
    }
  };

  const totalAppsCount = companyApps.length;
  const pendingCount = companyApps.filter(
    (a) => a.status === 'PENDING' || a.status === 'REVIEWING',
  ).length;
  const interviewingCount = companyApps.filter(
    (a) => a.status === 'INTERVIEWING' || a.status === 'OFFERED',
  ).length;
  const acceptedCount = companyApps.filter(
    (a) => a.status === 'ACCEPTED',
  ).length;
  const aiScannedCount = companyApps.filter(
    (a) => a.aiScanJob?.status === 'COMPLETED' || a.aiScore !== null,
  ).length;

  const filteredApps = companyApps
    .filter((a) => {
      const matchesStatus = filterStatus === 'ALL' || a.status === filterStatus;
      const matchesSearch =
        a.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.internshipTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.studentMajor.toLowerCase().includes(searchTerm.toLowerCase());

      const rec = a.aiScanJob?.recommendation || null;
      const matchesAiRec =
        aiFilterRec === 'ALL' ||
        (aiFilterRec === 'NONE' && !rec) ||
        rec === aiFilterRec;

      const score = a.aiScore ?? a.aiScanJob?.aiScore ?? null;
      let matchesAiScore = true;
      if (aiFilterScore === '80_PLUS') matchesAiScore = score !== null && score >= 80;
      else if (aiFilterScore === '60_TO_79') matchesAiScore = score !== null && score >= 60 && score < 80;
      else if (aiFilterScore === 'UNDER_60') matchesAiScore = score !== null && score < 60;
      else if (aiFilterScore === 'NOT_SCANNED') matchesAiScore = score === null;

      const matchesSemester =
        !selectedSemesterId ||
        selectedSemesterId === 'ALL' ||
        a.semesterId === selectedSemesterId;

      return matchesStatus && matchesSearch && matchesAiRec && matchesAiScore && matchesSemester;
    })
    .sort((a, b) => {
      if (sortBy === 'AI_SCORE_DESC') {
        const scoreA = a.aiScore ?? a.aiScanJob?.aiScore ?? -1;
        const scoreB = b.aiScore ?? b.aiScanJob?.aiScore ?? -1;
        return scoreB - scoreA;
      }
      if (sortBy === 'NAME_ASC') {
        return a.studentName.localeCompare(b.studentName, 'vi');
      }
      return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
    });

  const exportApplicantsExcel = () => {
    const currentSem = semesters.find((s) => s.id === selectedSemesterId);
    const semLabel = currentSem ? currentSem.name : 'Tất cả các đợt';
    const fileSlug = currentSem ? toSemesterSlug(currentSem.name) : 'tat-ca-cac-dot';
    downloadExcelWorkbook(`danh-sach-ung-vien-${fileSlug}`, [
      {
        name: 'Ung vien',
        title: `DANH SÁCH ỨNG VIÊN TUYỂN DỤNG — ${semLabel.toUpperCase()}`,
        subtitle: `Doanh nghiệp: ${companyProfile.companyName} • Đợt: ${semLabel} • Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} • Tổng số: ${filteredApps.length} ứng viên`,
        columns: [
          { header: 'STT', width: 45, value: (_: any, i: number) => i + 1 },
          { header: 'Họ và tên ứng viên', width: 175, value: (a: any) => a.studentName },
          { header: 'Chuyên ngành', width: 160, value: (a: any) => a.studentMajor },
          { header: 'Vị trí tuyển dụng', width: 180, value: (a: any) => a.internshipTitle },
          { header: 'Đợt thực tập', width: 140, value: (a: any) => a.semesterName || '—' },
          { header: 'Ngày nộp', width: 110, value: (a: any) => new Date(a.appliedAt).toLocaleDateString('vi-VN') },
          { header: 'Điểm AI', width: 90, value: (a: any) => a.aiScore !== null && a.aiScore !== undefined ? a.aiScore : 'Chưa quét' },
          { header: 'Khuyến nghị AI', width: 140, value: (a: any) => a.aiScanJob?.recommendation || '—' },
          { header: 'Trạng thái', width: 130, value: (a: any) => getStatusBadge(a.status).label },
          { header: 'Phản hồi / Ghi chú', width: 180, value: (a: any) => a.companyFeedback || a.rejectionReason || '—' },
        ],
        rows: filteredApps,
      },
    ]);
  };

  const openInterviewModal = (app: Application) => {
    setSelectedApp(app);
    setModalMode('INTERVIEW');
    setActionError(null);

    const existing = app.interview;
    const mode = existing?.mode ?? 'ONLINE';
    setScheduledAt(toDatetimeLocalValue(existing?.scheduledAt));
    setInterviewMode(mode);
    setLocationOrLink(
      mode === 'ONLINE'
        ? existing?.meetingLink ?? ''
        : existing?.location ?? companyProfile.address ?? '',
    );
    setContactName(
      existing?.contactName ||
        `Bộ phận Nhân sự - ${companyProfile.companyName}`,
    );
    setContactEmail(
      existing?.contactEmail || companyProfile.contactEmail || '',
    );
    setContactPhone(existing?.contactPhone ?? '');
    setInterviewNote(
      existing?.note ??
        'Vui lòng phản hồi email này để xác nhận tham dự hoặc đề xuất lịch khác nếu trùng lịch học.',
    );
  };

  const openOfferModal = (app: Application) => {
    setSelectedApp(app);
    setModalMode('OFFER');
    setActionError(null);
    setExpiresInDays(2);
    setOfferMessage(
      `Chúc mừng bạn đã vượt qua vòng phỏng vấn tại ${companyProfile.companyName}! Chúng tôi rất mong được chào đón bạn đồng hành trong kỳ thực tập sắp tới.`,
    );
  };

  const openRejectModal = (app: Application) => {
    setSelectedApp(app);
    setModalMode('REJECT');
    setActionError(null);
    setRejectionReason(QUICK_REJECTION_REASONS[0]);
    setCompanyFeedback(app.companyFeedback ?? '');
  };

  const closeModal = () => {
    setSelectedApp(null);
    setModalMode(null);
    setActionError(null);
  };

  const handleMarkReviewing = async (app: Application) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await onUpdateStatus(app.id, 'REVIEWING');
      feedback.notify({
        title: 'Đã chuyển sang Đang xem xét',
        tone: 'success',
      });
      onReload?.();
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !modalMode) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      if (modalMode === 'INTERVIEW') {
        await applicationsApi.scheduleInterview(selectedApp.id, {
          scheduledAt: new Date(scheduledAt).toISOString(),
          mode: interviewMode,
          ...(interviewMode === 'ONLINE'
            ? { meetingLink: locationOrLink.trim() }
            : { location: locationOrLink.trim() }),
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim() || undefined,
          note: interviewNote.trim() || undefined,
        });
        feedback.notify({
          title: 'Đã gửi thư mời phỏng vấn',
          message: `Đã gửi email kèm lịch phỏng vấn (.ics) tới ${selectedApp.studentName}.`,
          tone: 'success',
        });
      } else if (modalMode === 'OFFER') {
        await applicationsApi.sendOffer(selectedApp.id, {
          expiresInDays: Number(expiresInDays),
          offerMessage: offerMessage.trim() || undefined,
        });
        feedback.notify({
          title: 'Đã gửi lời mời thực tập (Offer)',
          message: `Ứng viên ${selectedApp.studentName} có ${expiresInDays} ngày để xác nhận trên hệ thống.`,
          tone: 'success',
        });
      } else if (modalMode === 'REJECT') {
        await applicationsApi.reject(selectedApp.id, {
          rejectionReason: rejectionReason.trim(),
          companyFeedback: companyFeedback.trim() || undefined,
        });
        feedback.notify({
          title: 'Đã từ chối hồ sơ',
          message: `Đã gửi email thông báo kết quả cho ${selectedApp.studentName}.`,
          tone: 'success',
        });
      }
      closeModal();
      onReload?.();
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async (appId: string, logId: string) => {
    setResendingLogId(logId);
    setActionError(null);
    try {
      const updated = await applicationsApi.resendEmail(appId, logId);
      const latest = updated.emailLogs?.[0];
      if (!latest || latest.status === 'SENT') {
        feedback.notify({
          title: 'Đã gửi lại email thành công',
          tone: 'success',
        });
      } else {
        feedback.notify({
          title: 'Gửi email thất bại',
          message: latest.error ?? 'Vui lòng kiểm tra cấu hình SMTP.',
          tone: 'error',
        });
      }
      onReload?.();
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setResendingLogId(null);
    }
  };

  const handleDeleteApplication = async (app: Application) => {
    const confirmed = await feedback.confirm({
      title: 'Xóa hồ sơ khỏi danh sách',
      message: `Bạn có chắc muốn xóa hồ sơ ứng tuyển của ${app.studentName} (${app.internshipTitle}) khỏi danh sách quản lý của doanh nghiệp?`,
      confirmLabel: 'Xóa hồ sơ',
      tone: 'danger',
    });
    if (!confirmed) return;

    setDeletingId(app.id);
    setActionError(null);
    try {
      await applicationsApi.remove(app.id);
      feedback.notify({
        title: 'Đã xóa hồ sơ khỏi danh sách',
        tone: 'info',
      });
      onReload?.();
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  const openCv = async (fileId: string) => {
    setOpeningCvId(fileId);
    setActionError(null);
    try {
      await downloadPrivateFile(fileId);
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setOpeningCvId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header (Modern Clean SaaS Style) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200/60 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-800 mb-2">
            <Users className="h-3.5 w-3.5 text-teal-600" />
            <span>QUẢN LÝ ỨNG VIÊN & TUYỂN DỤNG</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hồ sơ ứng viên & Quy trình tuyển dụng
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800">
              {companyApps.length} hồ sơ
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Sàng lọc CV bằng AI On-Premise, phỏng vấn ứng viên và phát hành lời mời thực tập (Offer).
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onReload?.()}
            className="inline-flex items-center gap-1.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs cursor-pointer text-xs font-bold"
            title="Làm mới danh sách ứng viên"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          {/* AI Worker Settings Button */}
          <button
            type="button"
            onClick={() => setIsAiWorkerModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            title="Quản lý kết nối AI Worker và cấu hình tự động quét CV"
          >
            <Bot className="w-4 h-4" />
            <span>AI Worker & Quét CV</span>
            <span className="w-2 h-2 rounded-full bg-emerald-300 ring-2 ring-white/50 animate-pulse" />
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              TỔNG ỨNG VIÊN
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">
              {totalAppsCount}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Hồ sơ trong phạm vi
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              CHỜ XỬ LÝ
            </span>
            <div className="text-2xl font-bold text-amber-900 mt-1.5 tracking-tight">
              {pendingCount}
            </div>
            <p className="text-xs text-amber-700 mt-0.5">
              Cần phản hồi sớm
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              PHỎNG VẤN / OFFER
            </span>
            <div className="text-2xl font-bold text-teal-800 mt-1.5 tracking-tight">
              {interviewingCount}
            </div>
            <p className="text-xs text-teal-700 mt-0.5">
              Đang trong quy trình
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              ĐÃ PHÂN TÍCH AI
            </span>
            <div className="text-2xl font-bold text-purple-900 mt-1.5 tracking-tight">
              {aiScannedCount} <span className="text-xs font-normal text-purple-600">/ {totalAppsCount}</span>
            </div>
            <p className="text-xs text-purple-700 mt-0.5">
              Đã trích xuất điểm match
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Segmented Search & Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 flex items-center bg-white focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-600 rounded-xl border border-slate-200 transition-all px-3.5 py-2.5 text-xs shadow-2xs">
            <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên ứng viên, vị trí tuyển dụng, chuyên ngành..."
              className="bg-transparent focus:outline-hidden w-full text-xs text-slate-800 placeholder:text-slate-400 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
                title="Xóa từ khóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Cluster */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Semester Filter */}
            <select
              value={selectedSemesterId}
              onChange={(e) => setSelectedSemesterId(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-hidden transition-all cursor-pointer shadow-2xs"
            >
              <option value="ALL">Tất cả đợt tuyển dụng</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-hidden transition-all cursor-pointer shadow-2xs"
            >
              <option value="ALL">Tất cả trạng thái ({companyApps.length})</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="REVIEWING">Đang xem xét</option>
              <option value="INTERVIEWING">Mời phỏng vấn</option>
              <option value="OFFERED">Đã gửi Offer</option>
              <option value="ACCEPTED">Đã nhận thực tập</option>
              <option value="DECLINED">SV từ chối Offer</option>
              <option value="EXPIRED">Hết hạn</option>
              <option value="REJECTED">Từ chối</option>
              <option value="WITHDRAWN">Đã rút đơn</option>
            </select>

            {/* AI Recommendation Filter */}
            <select
              value={aiFilterRec}
              onChange={(e) => setAiFilterRec(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-purple-200 text-xs bg-purple-50/70 hover:bg-purple-100/70 font-bold text-purple-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-hidden transition-all cursor-pointer shadow-2xs"
            >
              <option value="ALL">Khuyến nghị AI: Tất cả</option>
              <option value="STRONG_HIRE">⭐ Rất phù hợp (Strong Hire)</option>
              <option value="HIRE">👍 Phù hợp (Hire)</option>
              <option value="POTENTIAL">💡 Tiềm năng (Potential)</option>
              <option value="NOT_RECOMMENDED">⚠️ Cần cân nhắc</option>
              <option value="NONE">Chưa quét AI</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-hidden transition-all cursor-pointer shadow-2xs"
            >
              <option value="DATE_DESC">Sắp xếp: Mới nhất</option>
              <option value="AI_SCORE_DESC">Sắp xếp: Điểm AI cao nhất</option>
              <option value="NAME_ASC">Sắp xếp: Tên ứng viên (A-Z)</option>
            </select>

            {/* Live AI Progress Indicator */}
            {hasActiveAiJobs && (
              <span className="px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Đang tự động cập nhật kết quả AI...</span>
              </span>
            )}

            {/* Manual Silent Refresh Button */}
            <button
              type="button"
              onClick={() => void refreshApplications(false)}
              disabled={isRefreshing}
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
              title="Làm mới dữ liệu mà không cần tải lại trang"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Đang tải...' : 'Làm mới'}</span>
            </button>

            {/* Reset Filters */}
            {(filterStatus !== 'ALL' || aiFilterRec !== 'ALL' || searchTerm.trim() !== '') && (
              <button
                type="button"
                onClick={() => {
                  setFilterStatus('ALL');
                  setAiFilterRec('ALL');
                  setSearchTerm('');
                }}
                className="px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                title="Xóa tất cả bộ lọc"
              >
                <X className="w-3.5 h-3.5" />
                <span>Xóa lọc</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {actionError && !modalMode && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {actionError}
        </div>
      )}

      {/* Applications Grid */}
      <div className="space-y-4">
        {filteredApps.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold text-slate-600">
              Không tìm thấy đơn ứng tuyển phù hợp
            </p>
          </div>
        ) : (
          filteredApps.map((app) => {
            const badge = getStatusBadge(app.status);
            const latestEmail = app.emailLogs?.[0];
            const isTerminal =
              app.status === 'ACCEPTED' ||
              app.status === 'REJECTED' ||
              app.status === 'DECLINED' ||
              app.status === 'EXPIRED' ||
              app.status === 'WITHDRAWN';
            const isInactive =
              app.status === 'REJECTED' ||
              app.status === 'DECLINED' ||
              app.status === 'EXPIRED' ||
              app.status === 'WITHDRAWN';
            const canResendEmail =
              (app.status === 'INTERVIEWING' || app.status === 'OFFERED') &&
              latestEmail?.status === 'FAILED';
            const interviewTarget =
              app.interview?.mode === 'ONLINE'
                ? app.interview.meetingLink
                : app.interview?.location;

            return (
              <div
                key={app.id}
                className={`rounded-2xl border p-5 shadow-xs transition-all space-y-4 ${
                  isInactive
                    ? 'bg-slate-50/70 border-slate-200'
                    : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Modern Avatar Monogram */}
                    <div
                      className={`w-12 h-12 rounded-2xl font-black text-lg flex items-center justify-center shrink-0 shadow-2xs ${
                        isInactive
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-indigo-100'
                      }`}
                    >
                      {app.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm truncate">
                          {app.studentName}
                        </h3>
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {app.studentMajor}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-500">Ứng tuyển:</span>
                        <strong className="text-indigo-900 font-bold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                          {app.internshipTitle}
                        </strong>
                        <span className="text-slate-400 text-[11px] font-medium">• Nộp {formatDate(app.appliedAt)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
                    {/* AI Scan Evaluation Badge */}
                    {rescanningAppId === app.id || app.aiScanJob?.status === 'PROCESSING' ? (
                      <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 flex items-center gap-1.5 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                        Đang quét AI...
                      </span>
                    ) : app.aiScanJob?.status === 'PENDING' ? (
                      <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Chờ AI quét...
                      </span>
                    ) : app.aiScanJob?.status === 'COMPLETED' ||
                      (app.aiScore !== null && app.aiScore !== undefined) ? (
                      <button
                        type="button"
                        onClick={() => setAiDetailApp(app)}
                        className={`text-xs font-bold px-3.5 py-1.5 rounded-full border flex items-center gap-1.5 transition-all hover:scale-105 shadow-2xs cursor-pointer ${
                          (app.aiScore ?? 0) >= 80
                            ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 text-emerald-900 border-emerald-300 hover:border-emerald-400 shadow-emerald-100'
                            : (app.aiScore ?? 0) >= 60
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-900 border-indigo-300 hover:border-indigo-400 shadow-indigo-100'
                              : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 border-amber-300 hover:border-amber-400 shadow-amber-100'
                        }`}
                        title="Bấm để xem báo cáo phân tích AI chuyên sâu"
                      >
                        <Bot className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{app.aiScore ?? app.aiScanJob?.aiScore}/100 AI</span>
                        {app.aiScanJob?.recommendation && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wide border-l border-current/30 pl-1.5">
                            {app.aiScanJob.recommendation === 'STRONG_HIRE'
                              ? 'Rất phù hợp'
                              : app.aiScanJob.recommendation === 'HIRE'
                                ? 'Phù hợp'
                                : app.aiScanJob.recommendation === 'POTENTIAL'
                                  ? 'Tiềm năng'
                                  : 'Cân nhắc'}
                          </span>
                        )}
                      </button>
                    ) : app.aiScanJob?.status === 'FAILED' ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full border border-rose-200 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-500" /> Lỗi quét AI
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleRescanCv(app.id)}
                          disabled={rescanningAppId === app.id}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Thử quét lại"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${
                              rescanningAppId === app.id ? 'animate-spin' : ''
                            }`}
                          />
                        </button>
                      </div>
                    ) : app.cvFileId ? (
                      <button
                        type="button"
                        onClick={() => void handleRescanCv(app.id)}
                        disabled={rescanningAppId === app.id}
                        className="text-xs font-bold px-3 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 hover:text-indigo-900 rounded-full border border-indigo-200 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                        title="Kích hoạt phân tích CV bằng AI Worker"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-600" /> Quét AI ngay
                      </button>
                    ) : null}

                    {/* Status Badge with colored dot */}
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-2xs ${badge.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Cover Letter excerpt */}
                {app.coverLetter && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-700">
                    <strong className="block font-bold mb-0.5">
                      Thư giới thiệu từ sinh viên:
                    </strong>
                    <p className="italic text-slate-600">"{app.coverLetter}"</p>
                  </div>
                )}

                {/* Interview details card */}
                {app.interview && (
                  <div
                    className={`rounded-xl border p-3.5 text-xs space-y-2 ${
                      isInactive
                        ? 'border-slate-200 bg-slate-100/70 text-slate-500'
                        : 'border-[#aad9da] bg-[#f4fbfb] text-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <strong
                        className={`font-bold flex items-center gap-1.5 text-xs ${
                          isInactive ? 'text-slate-600' : 'text-[#12353b]'
                        }`}
                      >
                        <Calendar
                          className={`w-4 h-4 shrink-0 ${
                            isInactive ? 'text-slate-400' : 'text-[#008b8f]'
                          }`}
                        />
                        {isInactive
                          ? 'Lịch phỏng vấn trước đó (Đã đóng): '
                          : 'Lịch phỏng vấn đã gửi: '}
                        {formatDateTime(app.interview.scheduledAt)} (60 phút)
                      </strong>
                      <span
                        className={`w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                          isInactive
                            ? 'border-slate-200 bg-white text-slate-500'
                            : 'border-[#aad9da] bg-white text-[#006d72]'
                        }`}
                      >
                        {app.interview.mode === 'ONLINE'
                          ? 'Trực tuyến (Online)'
                          : 'Trực tiếp (Offline)'}
                      </span>
                    </div>
                    <div
                      className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-lg bg-white p-2.5 border ${
                        isInactive ? 'border-slate-200' : 'border-[#c7e5e5]'
                      }`}
                    >
                      <div>
                        <span className="text-[11px] text-slate-500 block">
                          {app.interview.mode === 'ONLINE'
                            ? 'Đường dẫn phòng họp:'
                            : 'Địa điểm phỏng vấn:'}
                        </span>
                        <strong
                          className={`font-bold mt-0.5 flex items-center gap-1.5 truncate ${
                            isInactive
                              ? 'text-slate-500 line-through'
                              : 'text-[#12353b]'
                          }`}
                        >
                          {app.interview.mode === 'ONLINE' ? (
                            <Video
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isInactive ? 'text-slate-400' : 'text-[#008b8f]'
                              }`}
                            />
                          ) : (
                            <MapPin
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isInactive ? 'text-slate-400' : 'text-[#008b8f]'
                              }`}
                            />
                          )}
                          <span className="truncate">
                            {interviewTarget || 'Đang cập nhật'}
                          </span>
                        </strong>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block">
                          Người phụ trách liên hệ:
                        </span>
                        <strong
                          className={`font-bold mt-0.5 block ${
                            isInactive ? 'text-slate-500' : 'text-[#12353b]'
                          }`}
                        >
                          {app.interview.contactName} ({app.interview.contactEmail}
                          {app.interview.contactPhone
                            ? ` • ${app.interview.contactPhone}`
                            : ''}
                          )
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Offer details banner */}
                {app.status === 'OFFERED' && app.offerExpiresAt && (
                  <div className="rounded-xl border border-[#aad9da] bg-[#f4fbfb] p-3.5 text-xs text-slate-700 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <strong className="font-bold text-[#12353b] flex items-center gap-1.5 text-xs">
                        <Clock className="w-4 h-4 text-[#008b8f] shrink-0" />
                        Đã gửi lời mời thực tập (Offer) • Đang giữ 1 chỉ tiêu
                      </strong>
                      <span className="w-fit rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                        Hạn xác nhận: {formatDateTime(app.offerExpiresAt)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Latest Email Log status & Resend (Resend only allowed on active INTERVIEWING/OFFERED when FAILED) */}
                {latestEmail && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Email gần nhất: <strong>{latestEmail.subject}</strong>
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-bold ${
                          latestEmail.status === 'SENT'
                            ? 'bg-[#e9f7f7] text-[#006d72]'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {latestEmail.status === 'SENT' ? 'Đã gửi' : 'Gửi lỗi'}
                      </span>
                    </div>
                    {canResendEmail && (
                      <button
                        type="button"
                        onClick={() =>
                          void handleResendEmail(app.id, latestEmail.id)
                        }
                        disabled={resendingLogId === latestEmail.id}
                        className="inline-flex items-center gap-1 font-bold text-[#008b8f] hover:text-[#006d72] disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-3 h-3 ${
                            resendingLogId === latestEmail.id
                              ? 'animate-spin'
                              : ''
                          }`}
                        />
                        {resendingLogId === latestEmail.id
                          ? 'Đang gửi lại...'
                          : 'Gửi lại email'}
                      </button>
                    )}
                  </div>
                )}

                {/* Action Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {app.cvFileId ? (
                      <button
                        type="button"
                        onClick={() => void openCv(app.cvFileId!)}
                        disabled={openingCvId === app.cvFileId}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        {openingCvId === app.cvFileId ? 'Đang mở CV...' : 'Xem CV đầy đủ'}
                      </button>
                    ) : app.cvUrl ? (
                      <a
                        href={app.cvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-600" /> Xem CV đầy đủ
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        CV lưu riêng tư
                      </span>
                    )}

                    {/* Nút Đánh giá AI - Hiển thị trạng thái thông minh theo tiến trình thực tế */}
                    {app.aiScanJob?.status === 'COMPLETED' ||
                    (app.aiScore !== null && app.aiScore !== undefined) ? (
                      <button
                        type="button"
                        onClick={() => setAiDetailApp(app)}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Xem chi tiết điểm số, kỹ năng và tóm tắt đánh giá năng lực của AI"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        Đánh giá AI ({app.aiScore ?? app.aiScanJob?.aiScore ?? 0}đ)
                      </button>
                    ) : app.aiScanJob?.status === 'PROCESSING' ||
                      rescanningAppId === app.id ? (
                      <button
                        type="button"
                        onClick={() => setAiDetailApp(app)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center gap-1.5 animate-pulse cursor-pointer"
                        title="AI Worker đang phân tích CV... Bấm để theo dõi tiến trình"
                      >
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        AI đang phân tích...
                      </button>
                    ) : app.aiScanJob?.status === 'PENDING' ? (
                      <button
                        type="button"
                        onClick={() => setAiDetailApp(app)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-medium text-xs flex items-center gap-1.5 cursor-pointer"
                        title="Hồ sơ đang trong hàng đợi chờ AI Worker nội bộ xử lý. Bấm để xem"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Chờ AI quét...
                      </button>
                    ) : app.aiScanJob?.status === 'FAILED' ? (
                      <button
                        type="button"
                        onClick={() => void handleRescanCv(app.id)}
                        disabled={rescanningAppId === app.id}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                        title="Lỗi quét AI. Bấm để gửi quét lại"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                        {rescanningAppId === app.id ? 'Đang gửi lại...' : 'Lỗi quét • Quét lại'}
                      </button>
                    ) : app.cvFileId ? (
                      <button
                        type="button"
                        onClick={() => void handleRescanCv(app.id)}
                        disabled={rescanningAppId === app.id}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                        title="Kích hoạt phân tích CV bằng AI Worker nội bộ"
                      >
                        <Bot className="w-3.5 h-3.5 text-indigo-600" />
                        {rescanningAppId === app.id ? 'Đang gửi...' : 'Đánh giá AI'}
                      </button>
                    ) : null}

                    {!isInactive ? (
                      <button
                        type="button"
                        onClick={onOpenChat}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500" /> Nhắn tin
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium px-2.5 py-1 bg-slate-100 rounded-lg">
                        <Lock className="w-3 h-3 text-slate-400" /> Hồ sơ đã kết thúc
                      </span>
                    )}
                  </div>

                  {/* Step-specific Workflow Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {app.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => void handleMarkReviewing(app)}
                        disabled={isSubmitting}
                        className="px-3 py-2 rounded-xl border border-[#aad9da] bg-[#e9f7f7] text-[#12353b] font-bold text-xs hover:bg-[#d8f1f1] disabled:opacity-50"
                      >
                        Đang xem xét
                      </button>
                    )}

                    {(app.status === 'PENDING' ||
                      app.status === 'REVIEWING') && (
                      <>
                        <button
                          type="button"
                          onClick={() => openInterviewModal(app)}
                          className="px-3.5 py-2 rounded-xl bg-[#008b8f] hover:bg-[#006d72] text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5" /> Mời phỏng vấn
                        </button>
                        <button
                          type="button"
                          onClick={() => openRejectModal(app)}
                          className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Từ chối
                        </button>
                      </>
                    )}

                    {app.status === 'INTERVIEWING' && (
                      <>
                        <button
                          type="button"
                          onClick={() => openInterviewModal(app)}
                          className="px-3 py-2 rounded-xl border border-[#aad9da] bg-[#e9f7f7] hover:bg-[#d8f1f1] text-[#12353b] font-bold text-xs"
                        >
                          Cập nhật lịch PV
                        </button>
                        <button
                          type="button"
                          onClick={() => openOfferModal(app)}
                          className="px-3.5 py-2 rounded-xl bg-[#008b8f] hover:bg-[#006d72] text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đạt — Gửi
                          Offer
                        </button>
                        <button
                          type="button"
                          onClick={() => openRejectModal(app)}
                          className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Không đạt
                        </button>
                      </>
                    )}

                    {isTerminal && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteApplication(app)}
                        disabled={deletingId === app.id}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-slate-600 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        title="Xóa hồ sơ đã hoàn tất hoặc hết hiệu lực khỏi danh sách"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deletingId === app.id ? 'Đang xóa...' : 'Xóa'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Interview / Offer / Reject */}
      {selectedApp && modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={(e) => void handleSubmitModal(e)}
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {modalMode === 'INTERVIEW' &&
                    'Gửi Thư Mời Phỏng Vấn (Kèm Lịch .ics)'}
                  {modalMode === 'OFFER' &&
                    'Xác Nhận Đạt Phỏng Vấn & Gửi Lời Mời Thực Tập (Offer)'}
                  {modalMode === 'REJECT' &&
                    (selectedApp.status === 'INTERVIEWING'
                      ? 'Thông Báo Kết Quả Chưa Đạt Sau Phỏng Vấn'
                      : 'Từ Chối Hồ Sơ Ứng Tuyển')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ứng viên: <strong>{selectedApp.studentName}</strong> • Vị trí:{' '}
                  <strong>{selectedApp.internshipTitle}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalMode === 'INTERVIEW' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label className="font-bold text-slate-800">
                  Thời gian phỏng vấn *
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal"
                  />
                </label>

                <label className="font-bold text-slate-800">
                  Hình thức phỏng vấn *
                  <select
                    value={interviewMode}
                    onChange={(e) => {
                      const nextMode = e.target.value as InterviewMode;
                      setInterviewMode(nextMode);
                      if (nextMode === 'OFFLINE' && !locationOrLink) {
                        setLocationOrLink(companyProfile.address || '');
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 font-normal"
                  >
                    <option value="ONLINE">
                      Trực tuyến (Google Meet / Zoom / Teams)
                    </option>
                    <option value="OFFLINE">Trực tiếp tại văn phòng</option>
                  </select>
                </label>

                <label className="font-bold text-slate-800 sm:col-span-2">
                  {interviewMode === 'ONLINE'
                    ? 'Đường dẫn phòng họp (Link) *'
                    : 'Địa chỉ phỏng vấn *'}
                  <input
                    type="text"
                    required
                    value={locationOrLink}
                    onChange={(e) => setLocationOrLink(e.target.value)}
                    placeholder={
                      interviewMode === 'ONLINE'
                        ? 'https://meet.google.com/...'
                        : 'Tầng 5, Tòa nhà...'
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal"
                  />
                </label>

                <label className="font-bold text-slate-800">
                  Người phụ trách liên hệ *
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal"
                  />
                </label>

                <label className="font-bold text-slate-800">
                  Email liên hệ (Reply-To) *
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal"
                  />
                </label>

                <label className="font-bold text-slate-800 sm:col-span-2">
                  Số điện thoại liên hệ (tùy chọn)
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="0901234567"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal"
                  />
                </label>

                <label className="font-bold text-slate-800 sm:col-span-2">
                  Ghi chú / Nội dung chuẩn bị cho ứng viên
                  <textarea
                    rows={3}
                    value={interviewNote}
                    onChange={(e) => setInterviewNote(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal"
                  />
                </label>
              </div>
            )}

            {modalMode === 'OFFER' && (
              <div className="space-y-3.5">
                <div className="rounded-2xl border border-[#aad9da] bg-[#e9f7f7] p-3.5 text-[#12353b]">
                  <p className="font-bold">
                    Thời gian thực tập (lấy từ tin tuyển dụng):
                  </p>
                  <p className="mt-1 text-sm font-black text-[#006d72]">
                    {formatDate(selectedApp.internshipStartDate)} —{' '}
                    {formatDate(selectedApp.internshipEndDate)}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    Khi gửi Offer, hệ thống sẽ giữ 1 chỉ tiêu (slot) cho ứng
                    viên này trong tối đa 1–2 ngày để đảm bảo công ty kịp tuyển
                    bù nếu ứng viên không xác nhận.
                  </p>
                </div>

                <label className="block font-bold text-slate-800">
                  Thời hạn sinh viên xác nhận Offer (1 – 2 ngày) *
                  <select
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 font-normal"
                  >
                    <option value={1}>1 ngày (24 giờ)</option>
                    <option value={2}>2 ngày (48 giờ - Khuyên dùng)</option>
                  </select>
                </label>

                <label className="block font-bold text-slate-800">
                  Lời nhắn chào mừng & hướng dẫn nhận việc (Onboarding)
                  <textarea
                    rows={4}
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    placeholder="Nhập thông tin chào mừng, hồ sơ cần chuẩn bị hoặc người hướng dẫn..."
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal"
                  />
                </label>
              </div>
            )}

            {modalMode === 'REJECT' && (
              <div className="space-y-3.5">
                <div>
                  <span className="block font-bold text-slate-800 mb-1.5">
                    Chọn nhanh lý do từ chối:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_REJECTION_REASONS.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setRejectionReason(reason)}
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold border transition-colors ${
                          rejectionReason === reason
                            ? 'border-rose-500 bg-rose-50 text-rose-800'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block font-bold text-slate-800">
                  Lý do từ chối *
                  <input
                    type="text"
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal"
                  />
                </label>

                <label className="block font-bold text-slate-800">
                  Nhận xét chi tiết gửi ứng viên (tùy chọn)
                  <textarea
                    rows={3}
                    value={companyFeedback}
                    onChange={(e) => setCompanyFeedback(e.target.value)}
                    placeholder="Góp ý chân thành giúp sinh viên cải thiện kỹ năng..."
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal"
                  />
                </label>
              </div>
            )}

            {actionError && (
              <p className="rounded-xl bg-rose-50 p-2.5 text-xs text-rose-600 border border-rose-200">
                {actionError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-xl font-bold text-white shadow-xs transition-colors disabled:opacity-50 ${
                  modalMode === 'REJECT'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#008b8f] hover:bg-[#006d72]'
                }`}
              >
                {isSubmitting
                  ? 'Đang xử lý...'
                  : modalMode === 'INTERVIEW'
                    ? 'Gửi thư mời phỏng vấn'
                    : modalMode === 'OFFER'
                      ? 'Gửi lời mời thực tập (Offer)'
                      : 'Xác nhận từ chối & Gửi mail'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI Worker & Quét CV Modals */}
      <CompanyAiWorkerModal
        isOpen={isAiWorkerModalOpen}
        onClose={() => setIsAiWorkerModalOpen(false)}
        onSettingsUpdated={onReload}
      />

      <AiScanDetailModal
        isOpen={Boolean(aiDetailApp)}
        onClose={() => setAiDetailApp(null)}
        application={aiDetailApp}
        onRescan={handleRescanCv}
        onOpenCv={openCv}
      />
    </div>
  );
};
