import React, { useState } from 'react';
import { Application, ApplicationStatus, CompanyProfile } from '../../types';
import { getStatusBadge } from '../../utils/matching';
import { getApiErrorMessage } from '../../auth/api';
import { downloadPrivateFile } from '../../files/api';
import {
  applicationsApi,
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
} from 'lucide-react';

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

  const companyApps = applications.filter(
    (a) => a.companyId === companyProfile.id && !a.hiddenByCompanyAt,
  );

  const filteredApps = companyApps.filter((a) => {
    const matchesStatus = filterStatus === 'ALL' || a.status === filterStatus;
    const matchesSearch =
      a.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.internshipTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.studentMajor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
      {/* Header & Filter Controls */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Quản Lý Ứng Viên & Phỏng Vấn / Offer
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sàng lọc CV, đặt lịch mời phỏng vấn qua email (.ics) và gửi lời mời
            thực tập (Offer).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-1.5 text-xs text-slate-700">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên/ngành sinh viên..."
              className="bg-transparent focus:outline-none w-36 sm:w-48"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold"
          >
            <option value="ALL">Tất cả trạng thái</option>
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
                    ? 'bg-slate-50/50 border-slate-200/90 opacity-90'
                    : 'bg-white border-slate-200 hover:border-emerald-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl font-black text-lg flex items-center justify-center ${
                        isInactive
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {app.studentName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {app.studentName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {app.studentMajor} • Vị trí:{' '}
                        <strong className="text-slate-800">
                          {app.internshipTitle}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {app.matchScore !== null && (
                      <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {app.matchScore}% Match
                      </span>
                    )}

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${badge.bg}`}
                    >
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
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {app.cvFileId ? (
                      <button
                        type="button"
                        onClick={() => void openCv(app.cvFileId!)}
                        disabled={openingCvId === app.cvFileId}
                        className="text-[#008b8f] font-bold hover:underline flex items-center gap-1 disabled:opacity-50"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {openingCvId === app.cvFileId
                          ? 'Đang mở CV...'
                          : 'Xem CV đầy đủ'}
                      </button>
                    ) : app.cvUrl ? (
                      <a
                        href={app.cvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#008b8f] font-bold hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> Xem CV đầy đủ
                      </a>
                    ) : (
                      <span className="text-slate-500">
                        CV được lưu riêng tư
                      </span>
                    )}
                    {!isInactive ? (
                      <button
                        onClick={onOpenChat}
                        className="text-slate-600 font-semibold hover:text-[#008b8f] flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Nhắn tin trực
                        tiếp
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                        <Lock className="w-3.5 h-3.5" /> Hồ sơ đã đóng thao tác
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
    </div>
  );
};
