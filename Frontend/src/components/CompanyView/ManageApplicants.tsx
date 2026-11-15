import { ModalPortal } from "../ModalPortal";
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Building,
  Star,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
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

const STATUS_FILTER_CHOICES = [
  { value: 'ALL', label: 'Tất cả trạng thái', color: 'bg-slate-400' },
  { value: 'PENDING', label: 'Chờ duyệt', color: 'bg-amber-500' },
  { value: 'REVIEWING', label: 'Đang xem xét', color: 'bg-sky-500' },
  { value: 'INTERVIEWING', label: 'Mời phỏng vấn', color: 'bg-teal-500' },
  { value: 'OFFERED', label: 'Đã gửi lời mời nhận việc', color: 'bg-emerald-500' },
  { value: 'ACCEPTED', label: 'Đã nhận thực tập', color: 'bg-emerald-600' },
  { value: 'DECLINED', label: 'Sinh viên từ chối nhận việc', color: 'bg-rose-400' },
  { value: 'EXPIRED', label: 'Hết hạn', color: 'bg-slate-400' },
  { value: 'REJECTED', label: 'Từ chối', color: 'bg-rose-500' },
  { value: 'WITHDRAWN', label: 'Đã rút đơn', color: 'bg-slate-400' },
];

const AI_REC_FILTER_CHOICES = [
  { value: 'ALL', label: 'Khuyến nghị AI: Tất cả' },
  { value: 'STRONG_HIRE', label: '⭐ Rất phù hợp' },
  { value: 'HIRE', label: '👍 Phù hợp' },
  { value: 'POTENTIAL', label: '💡 Tiềm năng' },
  { value: 'NOT_RECOMMENDED', label: '⚠️ Cần cân nhắc' },
  { value: 'NONE', label: 'Chưa quét AI' },
];

const SORT_CHOICES = [
  { value: 'DATE_DESC', label: 'Mới nhất' },
  { value: 'AI_SCORE_DESC', label: 'Điểm AI cao nhất' },
  { value: 'NAME_ASC', label: 'Tên ứng viên (A-Z)' },
];

function toDatetimeLocalValue(iso?: string | null): string {
  const date = iso ? new Date(iso) : new Date(Date.now() + 2 * 86400000);
  if (!iso) {
    date.setHours(9, 0, 0, 0);
  }
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

const OfferExpiresDropdown = React.memo(function OfferExpiresDropdown({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 shadow-2xs hover:border-slate-300 cursor-pointer outline-none focus:border-[#038b95]"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#038b95]" />
          <span>{value === 1 ? '1 ngày (24 giờ)' : '2 ngày (48 giờ - Khuyên dùng)'}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 ${isOpen ? 'rotate-180 text-[#038b95]' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              onChange(1);
              setIsOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs cursor-pointer ${
              value === 1
                ? 'bg-[#e0f4f6] text-[#02636a] font-bold'
                : 'text-slate-700 hover:bg-slate-50 font-medium'
            }`}
          >
            <span>1 ngày (24 giờ)</span>
            {value === 1 && <Check className="w-4 h-4 text-[#038b95]" />}
          </button>
          <button
            type="button"
            onClick={() => {
              onChange(2);
              setIsOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs cursor-pointer ${
              value === 2
                ? 'bg-[#e0f4f6] text-[#02636a] font-bold'
                : 'text-slate-700 hover:bg-slate-50 font-medium'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>2 ngày (48 giờ)</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                Khuyên dùng
              </span>
            </div>
            {value === 2 && <Check className="w-4 h-4 text-[#038b95]" />}
          </button>
        </div>
      )}
    </div>
  );
});

const InterviewModeDropdown = React.memo(function InterviewModeDropdown({
  value,
  onChange,
}: {
  value: InterviewMode;
  onChange: (val: InterviewMode) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 shadow-2xs hover:border-slate-300 cursor-pointer outline-none focus:border-[#038b95]"
      >
        <div className="flex items-center gap-2">
          {value === 'ONLINE' ? (
            <Video className="w-4 h-4 text-sky-600" />
          ) : (
            <Building className="w-4 h-4 text-amber-600" />
          )}
          <span>
            {value === 'ONLINE'
              ? 'Trực tuyến (Google Meet / Zoom / Teams)'
              : 'Trực tiếp tại văn phòng'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 ${isOpen ? 'rotate-180 text-[#038b95]' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              onChange('ONLINE');
              setIsOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs cursor-pointer ${
              value === 'ONLINE'
                ? 'bg-[#e0f4f6] text-[#02636a] font-bold'
                : 'text-slate-700 hover:bg-slate-50 font-medium'
            }`}
          >
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-sky-600" />
              <span>Trực tuyến (Google Meet / Zoom / Teams)</span>
            </div>
            {value === 'ONLINE' && <Check className="w-4 h-4 text-[#038b95]" />}
          </button>
          <button
            type="button"
            onClick={() => {
              onChange('OFFLINE');
              setIsOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs cursor-pointer ${
              value === 'OFFLINE'
                ? 'bg-[#e0f4f6] text-[#02636a] font-bold'
                : 'text-slate-700 hover:bg-slate-50 font-medium'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-600" />
              <span>Trực tiếp tại văn phòng</span>
            </div>
            {value === 'OFFLINE' && <Check className="w-4 h-4 text-[#038b95]" />}
          </button>
        </div>
      )}
    </div>
  );
});

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
  const [isSemesterDropdownOpen, setIsSemesterDropdownOpen] = useState(false);
  const semesterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSemesterDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (semesterDropdownRef.current && !semesterDropdownRef.current.contains(e.target as Node)) {
        setIsSemesterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSemesterDropdownOpen]);

  const currentSemesterLabel = useMemo(() => {
    if (!selectedSemesterId || selectedSemesterId === 'ALL') return 'Tất cả đợt tuyển dụng';
    const currentSem = semesters.find((s) => s.id === selectedSemesterId);
    return currentSem ? currentSem.name.replace(/\s*\[.*?\]/g, '').trim() : 'Chọn học kỳ';
  }, [selectedSemesterId, semesters]);

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

  // Filter toolbar custom dropdowns state
  const [openFilterDropdown, setOpenFilterDropdown] = useState<'STATUS' | 'AI_REC' | 'SORT' | null>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openFilterDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setOpenFilterDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openFilterDropdown]);

  // Pagination & record expansion state
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const toggleExpandApp = (id: string) => {
    setExpandedAppId((prev) => (prev === id ? null : id));
  };

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

  const semesterApps = useMemo(() => {
    return companyApps.filter(
      (a) =>
        !selectedSemesterId ||
        selectedSemesterId === 'ALL' ||
        a.semesterId === selectedSemesterId,
    );
  }, [companyApps, selectedSemesterId]);

  const totalAppsCount = semesterApps.length;
  const pendingCount = semesterApps.filter(
    (a) => a.status === 'PENDING' || a.status === 'REVIEWING',
  ).length;
  const interviewingCount = semesterApps.filter(
    (a) => a.status === 'INTERVIEWING' || a.status === 'OFFERED',
  ).length;
  const acceptedCount = semesterApps.filter(
    (a) => a.status === 'ACCEPTED',
  ).length;
  const aiScannedCount = semesterApps.filter(
    (a) => a.aiScanJob?.status === 'COMPLETED' || a.aiScore !== null,
  ).length;

  const filteredApps = semesterApps
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

      return matchesStatus && matchesSearch && matchesAiRec && matchesAiScore;
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

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterStatus, aiFilterRec, aiFilterScore, sortBy, selectedSemesterId]);

  const totalPages = Math.max(1, Math.ceil(filteredApps.length / itemsPerPage));
  const paginatedApps = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredApps.slice(start, start + itemsPerPage);
  }, [filteredApps, page, itemsPerPage]);

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
          message: `Đã gửi thư mời phỏng vấn tới ${selectedApp.studentName}.`,
          tone: 'success',
        });
      } else if (modalMode === 'OFFER') {
        await applicationsApi.sendOffer(selectedApp.id, {
          expiresInDays: Number(expiresInDays),
          offerMessage: offerMessage.trim() || undefined,
        });
        feedback.notify({
          title: 'Đã gửi lời mời thực tập',
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

  const handleOpenCv = async (app: Application) => {
    if (app.cvFileId) {
      setOpeningCvId(app.id);
      setActionError(null);
      try {
        await downloadPrivateFile(app.cvFileId);
      } catch (error) {
        setActionError(getApiErrorMessage(error));
      } finally {
        setOpeningCvId(null);
      }
    } else if (app.cvUrl) {
      window.open(app.cvUrl, '_blank', 'noopener,noreferrer');
    } else {
      setActionError('Hồ sơ ứng viên chưa có tệp CV đính kèm.');
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
    <div className="admin-page admin-page--feature space-y-6">
      {/* 1. Page Header & KPI Cards Unified Bento Container */}
      <div className="relative z-30 rounded-2xl sm:rounded-3xl bg-[#f8fafd] p-4 sm:p-5 text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.06)] border border-slate-200/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="!text-xl sm:!text-2xl font-extrabold text-[#006f72] tracking-tight">
              Hồ sơ ứng viên & Quy trình tuyển dụng
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Sàng lọc hồ sơ bằng AI nội bộ, phỏng vấn ứng viên và gửi lời mời thực tập.
            </p>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Semester Selector Pill Dropdown */}
            <div className="relative z-40" ref={semesterDropdownRef}>
              <button
                type="button"
                onClick={() => setIsSemesterDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full bg-white/95 hover:bg-white backdrop-blur-md border border-[#a5dfe4] hover:border-[#038b95] px-3.5 py-1.5 text-xs font-bold text-[#02636a] shadow-2xs transition-all cursor-pointer"
                title="Lọc ứng viên theo đợt tuyển dụng"
              >
                <Calendar className="h-3.5 w-3.5 text-[#038b95] shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-[320px]">
                  {currentSemesterLabel}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-[#038b95] shrink-0 transition-transform duration-200 ${
                    isSemesterDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isSemesterDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 w-[340px] sm:w-[370px] max-w-[92vw] rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-2xl no-scrollbar max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                    Chọn đợt tuyển dụng
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSemesterId('ALL');
                      setIsSemesterDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition cursor-pointer ${
                      selectedSemesterId === 'ALL' || !selectedSemesterId
                        ? 'bg-[#e0f4f6] text-[#02636a] font-extrabold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-[#038b95]" />
                      <span>Tất cả đợt tuyển dụng</span>
                    </span>
                    {(selectedSemesterId === 'ALL' || !selectedSemesterId) && (
                      <Check className="h-3.5 w-3.5 text-[#038b95] shrink-0" />
                    )}
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  {semesters.map((s) => {
                    const isSelected = s.id === selectedSemesterId;
                    const cleanName = s.name.replace(/\s*\[.*?\]/g, '').trim();
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedSemesterId(s.id);
                          setIsSemesterDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#e0f4f6] text-[#02636a] font-extrabold'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                        }`}
                      >
                        <span className="font-semibold text-xs whitespace-nowrap text-slate-800 truncate">
                          {cleanName}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {s.phase && (
                            <span
                              className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9.5px] font-bold ${
                                s.phase === 'RECRUITING'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : s.phase === 'ONGOING' || s.phase === 'MONITORING'
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                  : s.phase === 'UPCOMING'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {s.phase === 'RECRUITING'
                                ? 'Đang tuyển dụng'
                                : s.phase === 'ONGOING' || s.phase === 'MONITORING'
                                ? 'Hiện tại'
                                : s.phase === 'UPCOMING'
                                ? 'Sắp diễn ra'
                                : 'Đã kết thúc'}
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

            {/* AI Settings Button */}
            <button
              type="button"
              onClick={() => setIsAiWorkerModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-[#038b95] hover:bg-[#026f77] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer shrink-0"
              title="Quản lý kết nối máy trạm AI và cấu hình tự động quét hồ sơ"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Máy trạm AI & Quét hồ sơ</span>
              <span className="w-2 h-2 rounded-full bg-emerald-300 ring-2 ring-white/50 animate-pulse" />
            </button>
          </div>
        </div>

        {/* Integrated KPI Metrics Bento Grid */}
        <div className="mt-4 pt-3.5 border-t border-slate-200/70 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/70 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                TỔNG ỨNG VIÊN
              </span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tracking-tight">
                {totalAppsCount}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Hồ sơ trong phạm vi
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/70 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                CHỜ XỬ LÝ
              </span>
              <div className="text-xl sm:text-2xl font-bold text-amber-900 mt-1 tracking-tight">
                {pendingCount}
              </div>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Cần phản hồi sớm
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/70 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                PHỎNG VẤN / MỜI NHẬN VIỆC
              </span>
              <div className="text-xl sm:text-2xl font-bold text-[#038b95] mt-1 tracking-tight">
                {interviewingCount}
              </div>
              <p className="text-[11px] text-teal-700 mt-0.5">
                Đang trong quy trình
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#e0f4f6] text-[#038b95] flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/70 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                ĐÃ PHÂN TÍCH AI
              </span>
              <div className="text-xl sm:text-2xl font-bold text-purple-900 mt-1 tracking-tight">
                {aiScannedCount} <span className="text-xs font-normal text-purple-600">/ {totalAppsCount}</span>
              </div>
              <p className="text-[11px] text-purple-700 mt-0.5">
                Đã trích xuất điểm match
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Unified Container: Filter Bar + Records Table + Pagination */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {/* ROW 1: BỘ LỌC TỰ ĐỘNG THIẾT KẾ GIỐNG TRANG TIN TUYỂN DỤNG */}
        <div className="border-b border-slate-100 bg-slate-50/40 p-4 sm:p-5 space-y-3">
          <div
            ref={filterBarRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 text-xs"
          >
            {/* Ô tìm kiếm tên ứng viên, vị trí, chuyên ngành */}
            <div className="lg:col-span-5 relative">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-[#038b95] focus-within:ring-2 focus-within:ring-[#038b95]/20 transition shadow-2xs">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo tên ứng viên, chuyên ngành, vị trí..."
                  className="w-full py-2.5 outline-none font-medium text-slate-800 text-xs placeholder:text-slate-400 bg-transparent"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Xóa từ khóa tìm kiếm"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Dropdown Trạng thái (Custom Dropdown) */}
            <div className="relative lg:col-span-3">
              {(() => {
                const selectedStatusObj =
                  STATUS_FILTER_CHOICES.find((opt) => opt.value === filterStatus) || STATUS_FILTER_CHOICES[0];

                return (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFilterDropdown(openFilterDropdown === 'STATUS' ? null : 'STATUS')
                      }
                      className={`w-full flex items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2.5 text-xs font-semibold transition shadow-2xs cursor-pointer ${
                        openFilterDropdown === 'STATUS'
                          ? 'border-[#038b95] ring-2 ring-[#038b95]/20 text-slate-900'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${selectedStatusObj.color}`} />
                        <span className="truncate">{selectedStatusObj.label}</span>
                      </span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                          openFilterDropdown === 'STATUS' ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {openFilterDropdown === 'STATUS' && (
                      <div className="absolute left-0 top-full mt-1.5 z-40 w-full min-w-[220px] rounded-2xl border border-slate-200/90 bg-white p-2 shadow-2xl max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Chọn trạng thái
                        </div>
                        {STATUS_FILTER_CHOICES.map((opt) => {
                          const isSelected = filterStatus === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setFilterStatus(opt.value);
                                setOpenFilterDropdown(null);
                              }}
                              className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer ${
                                isSelected
                                  ? 'bg-[#e0f4f6] text-[#02636a] font-bold'
                                  : 'text-slate-700 hover:bg-slate-50 font-medium'
                              }`}
                            >
                              <span className="flex items-center gap-2 truncate">
                                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${opt.color}`} />
                                <span className="truncate">{opt.label}</span>
                              </span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-[#038b95] shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Dropdown Khuyến nghị AI (Custom Dropdown) */}
            <div className="relative lg:col-span-2">
              {(() => {
                const selectedAiRecObj =
                  AI_REC_FILTER_CHOICES.find((opt) => opt.value === aiFilterRec) || AI_REC_FILTER_CHOICES[0];

                return (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFilterDropdown(openFilterDropdown === 'AI_REC' ? null : 'AI_REC')
                      }
                      className={`w-full flex items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2.5 text-xs font-semibold transition shadow-2xs cursor-pointer ${
                        openFilterDropdown === 'AI_REC'
                          ? 'border-[#038b95] ring-2 ring-[#038b95]/20 text-slate-900'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Sparkles className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                        <span className="truncate">{selectedAiRecObj.label}</span>
                      </span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                          openFilterDropdown === 'AI_REC' ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {openFilterDropdown === 'AI_REC' && (
                      <div className="absolute left-0 top-full mt-1.5 z-40 w-full min-w-[210px] rounded-2xl border border-slate-200/90 bg-white p-2 shadow-2xl max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Khuyến nghị AI
                        </div>
                        {AI_REC_FILTER_CHOICES.map((opt) => {
                          const isSelected = aiFilterRec === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setAiFilterRec(opt.value);
                                setOpenFilterDropdown(null);
                              }}
                              className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer ${
                                isSelected
                                  ? 'bg-[#e0f4f6] text-[#02636a] font-bold'
                                  : 'text-slate-700 hover:bg-slate-50 font-medium'
                              }`}
                            >
                              <span className="truncate">{opt.label}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-[#038b95] shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Dropdown Sắp xếp (Custom Dropdown) */}
            <div className="relative lg:col-span-2">
              {(() => {
                const selectedSortObj =
                  SORT_CHOICES.find((opt) => opt.value === sortBy) || SORT_CHOICES[0];

                return (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFilterDropdown(openFilterDropdown === 'SORT' ? null : 'SORT')
                      }
                      className={`w-full flex items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2.5 text-xs font-semibold transition shadow-2xs cursor-pointer ${
                        openFilterDropdown === 'SORT'
                          ? 'border-[#038b95] ring-2 ring-[#038b95]/20 text-slate-900'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{selectedSortObj.label}</span>
                      </span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                          openFilterDropdown === 'SORT' ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {openFilterDropdown === 'SORT' && (
                      <div className="absolute right-0 top-full mt-1.5 z-40 w-full min-w-[200px] rounded-2xl border border-slate-200/90 bg-white p-2 shadow-2xl max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Sắp xếp theo
                        </div>
                        {SORT_CHOICES.map((opt) => {
                          const isSelected = sortBy === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setSortBy(opt.value as any);
                                setOpenFilterDropdown(null);
                              }}
                              className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer ${
                                isSelected
                                  ? 'bg-[#e0f4f6] text-[#02636a] font-bold'
                                  : 'text-slate-700 hover:bg-slate-50 font-medium'
                              }`}
                            >
                              <span className="truncate">{opt.label}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-[#038b95] shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Dòng trạng thái bộ lọc + nút Làm mới */}
          <div className="flex items-center justify-between pt-0.5 flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-500 font-medium">
                Hiển thị: <strong className="text-slate-800 font-bold">{filteredApps.length}</strong> ứng viên
              </span>
              {(filterStatus !== 'ALL' || aiFilterRec !== 'ALL' || searchTerm.trim() !== '') && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus('ALL');
                    setAiFilterRec('ALL');
                    setSearchTerm('');
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Xóa bộ lọc</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {hasActiveAiJobs && (
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold flex items-center gap-1.5 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                  <span>Đang cập nhật AI...</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => void refreshApplications(false)}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs disabled:opacity-50"
                title="Làm mới danh sách ứng viên"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Đang tải...' : 'Làm mới'}</span>
              </button>
              <button
                type="button"
                onClick={exportApplicantsExcel}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer shadow-2xs"
                title="Xuất bảng Excel danh sách ứng viên"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">Xuất Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* ROW 2: BẢNG DANH SÁCH BẢN GHI (DẠNG RECORD CÓ THỂ MỞ RỘNG CHI TIẾT) */}
        {actionError && !modalMode && (
          <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {actionError}
          </div>
        )}

        {filteredApps.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">Không tìm thấy hồ sơ ứng tuyển phù hợp</p>
            <p className="text-xs text-slate-400 mt-1">
              Hãy điều chỉnh từ khóa hoặc bộ lọc để xem các hồ sơ khác.
            </p>
            {(filterStatus !== 'ALL' || aiFilterRec !== 'ALL' || searchTerm.trim() !== '') && (
              <button
                type="button"
                onClick={() => {
                  setFilterStatus('ALL');
                  setAiFilterRec('ALL');
                  setSearchTerm('');
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#038b95] px-4 py-2 text-xs font-bold text-white hover:bg-[#026f77] transition cursor-pointer shadow-xs"
              >
                <X className="h-4 w-4" /> Xóa tất cả bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 pl-6 pr-4 min-w-[260px]">Ứng viên</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Vị trí ứng tuyển</th>
                  <th className="py-3.5 px-4 min-w-[170px]">Đánh giá AI</th>
                  <th className="py-3.5 px-4 min-w-[130px] text-center">Trạng thái</th>
                  <th className="py-3.5 pl-4 pr-6 text-right min-w-[180px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedApps.map((app) => {
                  const isExpanded = expandedAppId === app.id;
                  const badge = getStatusBadge(app.status);
                  const isInactive =
                    app.status === 'REJECTED' ||
                    app.status === 'DECLINED' ||
                    app.status === 'EXPIRED' ||
                    app.status === 'WITHDRAWN';
                  const isTerminal = isInactive || app.status === 'ACCEPTED';
                  const latestEmail = app.emailLogs?.[0];
                  const canResendEmail =
                    (app.status === 'INTERVIEWING' || app.status === 'OFFERED') &&
                    latestEmail?.status === 'FAILED';
                  const score = app.aiScore ?? app.aiScanJob?.aiScore ?? null;
                  const rec = app.aiScanJob?.recommendation || null;

                  return (
                    <React.Fragment key={app.id}>
                      <tr
                        onClick={() => toggleExpandApp(app.id)}
                        className={`h-16 transition hover:bg-[#f0fbfb]/70 cursor-pointer ${
                          isExpanded ? 'bg-[#f4fbfb]/90' : isInactive ? 'bg-slate-50/40 opacity-80' : ''
                        }`}
                      >
                        {/* 1. Ứng viên */}
                        <td className="py-3 pl-6 pr-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 shadow-2xs ${
                                isInactive
                                  ? 'bg-slate-200 text-slate-600'
                                  : 'bg-gradient-to-br from-[#038b95] to-[#006f72] text-white'
                              }`}
                            >
                              {app.studentName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 truncate block hover:text-[#038b95] transition">
                                {app.studentName}
                              </span>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {app.studentMajor} · <span className="text-slate-400">Nộp {formatDate(app.appliedAt)}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Vị trí ứng tuyển */}
                        <td className="py-3 px-4">
                          <div className="max-w-[220px]">
                            <span
                              className="font-semibold text-slate-900 truncate block"
                              title={app.internshipTitle}
                            >
                              {app.internshipTitle}
                            </span>
                            {app.semesterName && (
                              <span className="text-[10.5px] text-slate-400 truncate block">
                                {app.semesterName}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Đánh giá AI */}
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          {rescanningAppId === app.id || app.aiScanJob?.status === 'PROCESSING' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-[#02636a] text-[11px] font-bold border border-[#a5dfe4] animate-pulse">
                              <RefreshCw className="w-3 h-3 animate-spin text-[#038b95]" />
                              Đang quét...
                            </span>
                          ) : app.aiScanJob?.status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Chờ quét...
                            </span>
                          ) : score !== null ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setAiDetailApp(app)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 hover:bg-teal-100 text-[#02636a] text-[11px] font-bold border border-[#a5dfe4] transition cursor-pointer"
                                title="Xem phân tích chi tiết AI"
                              >
                                <Bot className="w-3.5 h-3.5 text-[#038b95]" />
                                <span>{score}/100</span>
                              </button>
                              {rec === 'STRONG_HIRE' && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                  Rất phù hợp
                                </span>
                              )}
                              {rec === 'HIRE' && (
                                <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold border border-teal-200">
                                  Phù hợp
                                </span>
                              )}
                              {rec === 'POTENTIAL' && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                                  Tiềm năng
                                </span>
                              )}
                              {rec === 'NOT_RECOMMENDED' && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                                  Cân nhắc
                                </span>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void handleRescanCv(app.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10.5px] font-semibold transition cursor-pointer"
                              title="Yêu cầu máy trạm AI phân tích CV"
                            >
                              <Sparkles className="w-3 h-3 text-purple-600" />
                              <span>Quét AI</span>
                            </button>
                          )}
                        </td>

                        {/* 4. Trạng thái */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${badge.bg} ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* 5. Thao tác */}
                        <td className="py-3 pl-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => void handleOpenCv(app)}
                              disabled={openingCvId === app.id}
                              title="Xem CV ứng viên"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-2xs disabled:opacity-50"
                            >
                              {openingCvId === app.id ? (
                                <RefreshCw className="w-4 h-4 text-[#038b95] animate-spin" />
                              ) : (
                                <FileText className="w-4 h-4 text-[#038b95]" />
                              )}
                            </button>

                            {app.status === 'PENDING' || app.status === 'REVIEWING' ? (
                              <button
                                type="button"
                                onClick={() => openInterviewModal(app)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#038b95] hover:bg-[#026f77] text-white font-bold text-xs transition cursor-pointer shadow-2xs"
                              >
                                Mời PV
                              </button>
                            ) : app.status === 'INTERVIEWING' ? (
                              <button
                                type="button"
                                onClick={() => openOfferModal(app)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-2xs flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Mời việc
                              </button>
                            ) : null}

                            {/* Hiện nút Xóa bên ngoài cho các hồ sơ có thể xóa */}
                            {isTerminal && (
                              <button
                                type="button"
                                onClick={() => void handleDeleteApplication(app)}
                                disabled={deletingId === app.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer shadow-2xs disabled:opacity-50"
                                title="Xóa hồ sơ khỏi danh sách"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>{deletingId === app.id ? 'Đang xóa...' : 'Xóa'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => toggleExpandApp(app.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                              title={isExpanded ? 'Thu gọn chi tiết' : 'Xem chi tiết hồ sơ'}
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180 text-[#038b95]' : ''
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED DETAILS ACCORDION ROW */}
                      {isExpanded && (
                        <tr className="bg-[#f8fcfc] border-b border-slate-200/90">
                          <td colSpan={5} className="p-4 sm:p-5">
                            <div className="w-full space-y-3.5 text-xs text-slate-700">
                              {/* Thư giới thiệu */}
                              {app.coverLetter && (
                                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                                  <span className="font-bold text-slate-800 block mb-1">
                                    Thư giới thiệu từ sinh viên:
                                  </span>
                                  <p className="italic text-slate-600 leading-relaxed">
                                    "{app.coverLetter}"
                                  </p>
                                </div>
                              )}

                              {/* Lịch phỏng vấn */}
                              {app.interview && (
                                <div className="rounded-xl border border-teal-200 bg-[#f0f9f9] p-3.5 space-y-2">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <strong className="text-[#006f72] flex items-center gap-1.5 font-bold">
                                      <Calendar className="w-4 h-4 text-[#038b95]" />
                                      Lịch phỏng vấn: {formatDateTime(app.interview.scheduledAt)} ({app.interview.durationMinutes || 60} phút)
                                    </strong>
                                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#02636a] border border-[#a5dfe4]">
                                      {app.interview.mode === 'ONLINE' ? 'Trực tuyến (Online)' : 'Trực tiếp (Tại văn phòng)'}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-teal-100">
                                    <div>
                                      <span className="font-semibold text-slate-700">Địa điểm/Link: </span>
                                      {app.interview.mode === 'ONLINE' ? (
                                        <a href={app.interview.meetingLink} target="_blank" rel="noreferrer" className="text-teal-700 underline font-medium">
                                          {app.interview.meetingLink || 'Chưa cung cấp link'}
                                        </a>
                                      ) : (
                                        <span>{app.interview.location || 'Tại văn phòng công ty'}</span>
                                      )}
                                    </div>
                                    {app.interview.contactName && (
                                      <div>
                                        <span className="font-semibold text-slate-700">Người phụ trách: </span>
                                        <span>{app.interview.contactName} {app.interview.contactEmail ? `(${app.interview.contactEmail})` : ''}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Email log */}
                              {latestEmail && (
                                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 text-[11px] shadow-2xs">
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Email gần nhất: <strong>{latestEmail.subject}</strong></span>
                                    <span className={`px-2 py-0.5 rounded-full font-bold ${
                                      latestEmail.status === 'SENT' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                    }`}>
                                      {latestEmail.status === 'SENT' ? 'Đã gửi' : 'Thất bại'}
                                    </span>
                                  </div>
                                  {canResendEmail && (
                                    <button
                                      type="button"
                                      onClick={() => void handleResendEmail(latestEmail.id)}
                                      disabled={resendingLogId === latestEmail.id}
                                      className="text-teal-700 font-bold hover:underline"
                                    >
                                      Gửi lại
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Actions row inside expanded view */}
                              <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-200">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void handleOpenCv(app)}
                                    disabled={openingCvId === app.id}
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-[#038b95]" />
                                    <span>Xem CV đầy đủ</span>
                                  </button>
                                  {score !== null && (
                                    <button
                                      type="button"
                                      onClick={() => setAiDetailApp(app)}
                                      className="px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 font-bold text-xs text-purple-900 shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                      <span>Đánh giá AI ({score}đ)</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={onOpenChat}
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-xs text-slate-600 shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Nhắn tin</span>
                                  </button>
                                </div>

                                <div className="flex items-center gap-2">
                                  {app.status === 'PENDING' || app.status === 'REVIEWING' ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => openInterviewModal(app)}
                                        className="px-3 py-1.5 rounded-xl bg-[#038b95] hover:bg-[#026f77] text-white font-bold text-xs shadow-2xs cursor-pointer flex items-center gap-1.5"
                                      >
                                        <Calendar className="w-3.5 h-3.5" /> Mời phỏng vấn
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openRejectModal(app)}
                                        className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs cursor-pointer flex items-center gap-1"
                                      >
                                        <XCircle className="w-3.5 h-3.5" /> Không đạt
                                      </button>
                                    </>
                                  ) : app.status === 'INTERVIEWING' ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => openInterviewModal(app)}
                                        className="px-3 py-1.5 rounded-xl border border-[#aad9da] bg-[#e9f7f7] hover:bg-[#d8f1f1] text-[#12353b] font-bold text-xs cursor-pointer"
                                      >
                                        Cập nhật lịch PV
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openOfferModal(app)}
                                        className="px-3.5 py-1.5 rounded-xl bg-[#008b8f] hover:bg-[#006d72] text-white font-bold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Đạt — Mời nhận việc
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openRejectModal(app)}
                                        className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
                                      >
                                        <XCircle className="w-3.5 h-3.5" /> Không đạt
                                      </button>
                                    </>
                                  ) : null}

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

        {/* ROW 3: PHÂN TRANG */}
        {totalPages > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-3.5 text-xs text-slate-600">
            <span className="font-medium text-slate-500">
              Tổng: <strong className="text-slate-700">{filteredApps.length}</strong> ứng viên
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

            {/* Modal: Interview / Offer / Reject */}
      {selectedApp && modalMode && (

        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={(e) => void handleSubmitModal(e)}
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-2xs ${
                    modalMode === 'INTERVIEW'
                      ? 'bg-[#e0f4f6] text-[#038b95]'
                      : modalMode === 'OFFER'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {modalMode === 'INTERVIEW' && <Calendar className="h-5 w-5" />}
                  {modalMode === 'OFFER' && <CheckCircle2 className="h-5 w-5" />}
                  {modalMode === 'REJECT' && <XCircle className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base tracking-tight">
                    {modalMode === 'INTERVIEW' && 'Gửi Thư Mời Phỏng Vấn'}
                    {modalMode === 'OFFER' &&
                      'Xác Nhận Đạt Phỏng Vấn & Gửi Lời Mời Thực Tập'}
                    {modalMode === 'REJECT' &&
                      (selectedApp.status === 'INTERVIEWING'
                        ? 'Thông Báo Kết Quả Chưa Đạt Sau Phỏng Vấn'
                        : 'Từ Chối Hồ Sơ Ứng Tuyển')}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
                    <span>Ứng viên: <strong className="text-slate-800 font-bold">{selectedApp.studentName}</strong></span>
                    <span className="text-slate-300">•</span>
                    <span>Vị trí: <strong className="text-slate-800 font-bold">{selectedApp.internshipTitle}</strong></span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
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
                    className="mt-1 w-full rounded-xl border border-slate-200/90 bg-slate-50/50 p-2.5 font-normal text-slate-800 transition-all hover:bg-white hover:border-slate-300 focus:border-[#038b95] focus:bg-white focus:ring-3 focus:ring-[#038b95]/15 focus:outline-none"
                  />
                </label>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Hình thức phỏng vấn <span className="text-rose-500">*</span>
                  </label>
                  <InterviewModeDropdown
                    value={interviewMode}
                    onChange={(nextMode) => {
                      setInterviewMode(nextMode);
                      if (nextMode === 'OFFLINE' && !locationOrLink) {
                        setLocationOrLink(companyProfile.address || '');
                      }
                    }}
                  />
                </div>

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
                    className="mt-1 w-full rounded-xl border border-slate-200/90 bg-slate-50/50 p-2.5 font-normal text-slate-800 transition-all hover:bg-white hover:border-slate-300 focus:border-[#038b95] focus:bg-white focus:ring-3 focus:ring-[#038b95]/15 focus:outline-none"
                  />
                </label>

                <label className="font-bold text-slate-800">
                  Người phụ trách liên hệ *
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200/90 bg-slate-50/50 p-2.5 font-normal text-slate-800 transition-all hover:bg-white hover:border-slate-300 focus:border-[#038b95] focus:bg-white focus:ring-3 focus:ring-[#038b95]/15 focus:outline-none"
                  />
                </label>

                <label className="font-bold text-slate-800">
                  Email liên hệ (Reply-To) *
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200/90 bg-slate-50/50 p-2.5 font-normal text-slate-800 transition-all hover:bg-white hover:border-slate-300 focus:border-[#038b95] focus:bg-white focus:ring-3 focus:ring-[#038b95]/15 focus:outline-none"
                  />
                </label>

                <label className="font-bold text-slate-800 sm:col-span-2">
                  Số điện thoại liên hệ (tùy chọn)
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="0901234567"
                    className="mt-1 w-full rounded-xl border border-slate-200/90 bg-slate-50/50 p-2.5 font-normal text-slate-800 transition-all hover:bg-white hover:border-slate-300 focus:border-[#038b95] focus:bg-white focus:ring-3 focus:ring-[#038b95]/15 focus:outline-none"
                  />
                </label>

                <label className="font-bold text-slate-800 sm:col-span-2">
                  Ghi chú / Nội dung chuẩn bị cho ứng viên
                  <textarea
                    rows={3}
                    value={interviewNote}
                    onChange={(e) => setInterviewNote(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200/90 bg-slate-50/50 p-2.5 font-normal text-slate-800 transition-all hover:bg-white hover:border-slate-300 focus:border-[#038b95] focus:bg-white focus:ring-3 focus:ring-[#038b95]/15 focus:outline-none"
                  />
                </label>
              </div>
            )}

            {modalMode === 'OFFER' && (
              <div className="space-y-3.5">
                <div className="rounded-2xl border border-[#b8e6ea] bg-[#e0f4f6]/60 p-4 text-slate-800">
                  <p className="font-bold text-slate-900">
                    Thời gian thực tập:
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-[#038b95]">
                    {formatDate(selectedApp.internshipStartDate)} —{' '}
                    {formatDate(selectedApp.internshipEndDate)}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                    Khi gửi lời mời, hệ thống sẽ giữ 1 chỉ tiêu cho ứng
                    viên này trong tối đa 1–2 ngày để đảm bảo công ty kịp tuyển
                    bù nếu ứng viên không xác nhận.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Thời hạn sinh viên xác nhận nhận việc (1 – 2 ngày) <span className="text-rose-500">*</span>
                  </label>
                  <OfferExpiresDropdown
                    value={expiresInDays}
                    onChange={setExpiresInDays}
                  />
                </div>

                <label className="block font-bold text-slate-800">
                  Lời nhắn chào mừng & hướng dẫn nhận việc
                  <textarea
                    rows={4}
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    placeholder="Nhập thông tin chào mừng, hồ sơ cần chuẩn bị hoặc người hướng dẫn..."
                    className="mt-1 w-full rounded-xl border border-slate-200/90 bg-slate-50/50 p-2.5 font-normal text-slate-800 transition-all hover:bg-white hover:border-slate-300 focus:border-[#038b95] focus:bg-white focus:ring-3 focus:ring-[#038b95]/15 focus:outline-none"
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
                    className="mt-1 w-full rounded-xl border border-slate-200/90 bg-slate-50/50 p-2.5 font-normal text-slate-800 transition-all hover:bg-white hover:border-slate-300 focus:border-[#038b95] focus:bg-white focus:ring-3 focus:ring-[#038b95]/15 focus:outline-none"
                  />
                </label>

                <label className="block font-bold text-slate-800">
                  Nhận xét chi tiết gửi ứng viên (tùy chọn)
                  <textarea
                    rows={3}
                    value={companyFeedback}
                    onChange={(e) => setCompanyFeedback(e.target.value)}
                    placeholder="Góp ý chân thành giúp sinh viên cải thiện kỹ năng..."
                    className="mt-1 w-full rounded-xl border border-slate-200/90 bg-slate-50/50 p-2.5 font-normal text-slate-800 transition-all hover:bg-white hover:border-slate-300 focus:border-[#038b95] focus:bg-white focus:ring-3 focus:ring-[#038b95]/15 focus:outline-none"
                  />
                </label>
              </div>
            )}

            {actionError && (
              <p className="rounded-xl bg-rose-50 p-2.5 text-xs text-rose-600 border border-rose-200">
                {actionError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3.5">
              <button
                type="button"
                onClick={closeModal}
                className="px-4.5 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-white shadow-xs transition cursor-pointer disabled:opacity-50 ${
                  modalMode === 'REJECT'
                    ? 'bg-rose-600 hover:bg-rose-700 focus:ring-3 focus:ring-rose-200'
                    : 'bg-[#038b95] hover:bg-[#02636a] focus:ring-3 focus:ring-[#038b95]/20 shadow-2xs'
                }`}
              >
                {isSubmitting
                  ? 'Đang xử lý...'
                  : modalMode === 'INTERVIEW'
                    ? 'Gửi thư mời phỏng vấn'
                    : modalMode === 'OFFER'
                      ? 'Gửi lời mời thực tập'
                      : 'Xác nhận từ chối & Gửi mail'}
              </button>
            </div>
          </form>
        </div>
        </ModalPortal>
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
