import React, { useState } from 'react';
import { Application, ApplicationStatus } from '../../types';
import { getStatusBadge } from '../../utils/matching';
import { getApiErrorMessage } from '../../auth/api';
import { applicationsApi } from '../../applications/api';
import { formatDate, formatDateTime } from '../../utils/format';
import { useAppFeedback } from '../Feedback/AppFeedbackProvider';
import {
  FileCheck,
  Building2,
  MessageSquare,
  ExternalLink,
  Clock,
  Check,
  X,
  Calendar,
  Video,
  MapPin,
  Mail,
  Sparkles,
  CheckCircle2,
  XCircle,
  Trash2,
} from 'lucide-react';

interface StudentApplicationsProps {
  applications: Application[];
  isLoading?: boolean;
  onOpenChat: () => void;
  onWithdraw: (applicationId: string) => Promise<void>;
  onReload?: () => void;
}

function ApplicationProgressBar({
  status,
  hasInterview,
}: {
  status: ApplicationStatus;
  hasInterview: boolean;
}) {
  const isRejected = status === 'REJECTED';
  const isDeclined = status === 'DECLINED';
  const isExpired = status === 'EXPIRED';
  const isWithdrawn = status === 'WITHDRAWN';
  const isTerminalNegative = isRejected || isDeclined || isExpired;

  let currentStep = 0;
  if (status === 'PENDING' || status === 'REVIEWING') currentStep = 0;
  else if (status === 'INTERVIEWING') currentStep = 1;
  else if (status === 'OFFERED' || isDeclined || isExpired) currentStep = 2;
  else if (status === 'ACCEPTED') currentStep = 3;
  else if (isRejected) currentStep = hasInterview ? 1 : 0;

  const steps = [
    {
      title: 'Sàng lọc CV',
      desc: status === 'REVIEWING' ? 'Đang xem xét hồ sơ' : 'Đã nộp hồ sơ',
    },
    {
      title: 'Phỏng vấn',
      desc: hasInterview ? 'Đã có lịch phỏng vấn' : 'Trao đổi với công ty',
    },
    {
      title: isDeclined
        ? 'Đã từ chối Offer'
        : isExpired
          ? 'Hết hạn'
          : 'Lời mời (Offer)',
      desc:
        status === 'OFFERED'
          ? 'Chờ bạn xác nhận'
          : isDeclined
            ? 'Bạn đã từ chối'
            : isExpired
              ? 'Đã hết hạn'
              : 'Đề nghị thực tập',
    },
    {
      title: 'Nhận thực tập',
      desc:
        status === 'ACCEPTED'
          ? 'Đã tạo hồ sơ thực tập'
          : 'Chốt vị trí thực tập',
    },
  ];

  if (isWithdrawn) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-500">
        Đơn ứng tuyển này đã được rút (hoặc tự động rút sau khi bạn nhận thực tập tại đơn vị khác).
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
      <h4 className="mb-3 text-xs font-bold text-slate-700">
        Tiến trình tuyển dụng & nhận thực tập:
      </h4>
      <div className="relative flex items-center justify-between px-2 sm:px-6">
        {/* Background Connecting Line */}
        <div className="absolute left-8 right-8 top-3.5 h-0.5 -translate-y-1/2 bg-slate-200" />
        {/* Active Progress Line */}
        <div
          className={`absolute left-8 top-3.5 h-0.5 -translate-y-1/2 transition-all duration-500 ${
            isTerminalNegative ? 'bg-rose-500' : 'bg-[#008b8f]'
          }`}
          style={{
            width: `calc(${Math.min(currentStep, 3) / 3} * (100% - 4rem))`,
          }}
        />

        {steps.map((step, idx) => {
          const isDone =
            idx < currentStep || (idx === currentStep && status === 'ACCEPTED');
          const isCurrent =
            idx === currentStep &&
            status !== 'ACCEPTED' &&
            !isTerminalNegative;
          const isStepNegative = idx === currentStep && isTerminalNegative;

          return (
            <div
              key={idx}
              className="relative z-10 flex flex-col items-center text-center"
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                  isStepNegative
                    ? 'border-rose-500 bg-rose-500 text-white shadow-sm ring-4 ring-rose-100'
                    : isDone
                      ? 'border-[#008b8f] bg-[#008b8f] text-white shadow-sm'
                      : isCurrent
                        ? 'border-[#008b8f] bg-[#008b8f] text-white shadow-sm ring-4 ring-[#e9f7f7]'
                        : 'border-slate-300 bg-white text-slate-400'
                }`}
              >
                {isStepNegative ? (
                  <X className="h-3.5 w-3.5" />
                ) : isDone ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <p
                className={`mt-2 text-[11px] font-bold ${
                  isStepNegative
                    ? 'text-rose-700'
                    : isDone
                      ? 'text-[#006d72]'
                      : isCurrent
                        ? 'text-[#008b8f]'
                        : 'text-slate-500'
                }`}
              >
                {step.title}
              </p>
              <p className="hidden sm:block text-[10px] text-slate-400 max-w-[110px] leading-tight mt-0.5">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const StudentApplications: React.FC<StudentApplicationsProps> = ({
  applications,
  isLoading,
  onOpenChat,
  onWithdraw,
  onReload,
}) => {
  const feedback = useAppFeedback();
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [respondingOfferId, setRespondingOfferId] = useState<string | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const visibleApplications = applications.filter(
    (app) => !app.hiddenByStudentAt,
  );

  const handleDeleteApplication = async (app: Application) => {
    const confirmed = await feedback.confirm({
      title: 'Xóa đơn khỏi danh sách',
      message: `Bạn có chắc muốn xóa đơn ứng tuyển vị trí "${app.internshipTitle}" tại ${app.companyName} khỏi danh sách hiển thị?`,
      confirmLabel: 'Xóa đơn',
      tone: 'danger',
    });
    if (!confirmed) return;

    setDeletingId(app.id);
    setActionError(null);
    try {
      await applicationsApi.remove(app.id);
      feedback.notify({
        title: 'Đã xóa đơn ứng tuyển khỏi danh sách',
        tone: 'info',
      });
      onReload?.();
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  const withdraw = async (applicationId: string) => {
    const confirmed = await feedback.confirm({
      title: 'Rút đơn ứng tuyển',
      message: 'Bạn có chắc chắn muốn rút đơn ứng tuyển này không?',
      confirmLabel: 'Rút đơn',
      tone: 'danger',
    });
    if (!confirmed) return;

    setWithdrawingId(applicationId);
    setActionError(null);
    try {
      await onWithdraw(applicationId);
      onReload?.();
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setWithdrawingId(null);
    }
  };

  const handleAcceptOffer = async (app: Application) => {
    const confirmed = await feedback.confirm({
      title: 'Xác nhận nhận lời mời thực tập',
      message: `Khi bạn xác nhận nhận thực tập vị trí "${app.internshipTitle}" tại ${app.companyName}, hệ thống sẽ khởi tạo Hồ sơ thực tập (Placement) và tự động rút các đơn ứng tuyển hoặc lời mời thực tập khác của bạn trong cùng đợt này. Bạn có chắc chắn đồng ý?`,
      confirmLabel: 'Đồng ý nhận thực tập',
    });
    if (!confirmed) return;

    setRespondingOfferId(app.id);
    setActionError(null);
    try {
      await applicationsApi.acceptOffer(app.id);
      feedback.notify({
        title: 'Chúc mừng bạn đã nhận vị trí thực tập!',
        message: `Hồ sơ thực tập tại ${app.companyName} đã được khởi tạo và đang chờ nhà trường phân công giảng viên hướng dẫn.`,
        tone: 'success',
      });
      onReload?.();
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setRespondingOfferId(null);
    }
  };

  const handleDeclineOffer = async (app: Application) => {
    const confirmed = await feedback.confirm({
      title: 'Từ chối lời mời thực tập (Offer)',
      message: `Bạn có chắc muốn từ chối lời mời thực tập vị trí "${app.internshipTitle}" tại ${app.companyName}? Sau khi từ chối, chỉ tiêu sẽ được nhường lại cho ứng viên khác.`,
      confirmLabel: 'Từ chối Offer',
      tone: 'danger',
    });
    if (!confirmed) return;

    setRespondingOfferId(app.id);
    setActionError(null);
    try {
      await applicationsApi.declineOffer(app.id);
      feedback.notify({
        title: 'Đã từ chối lời mời thực tập',
        message: 'Bạn có thể tiếp tục theo dõi các đơn ứng tuyển khác.',
        tone: 'info',
      });
      onReload?.();
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setRespondingOfferId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Danh Sách Đơn Ứng Tuyển
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi lịch phỏng vấn, xác nhận lời mời thực tập (Offer) và tiến
            trình xét duyệt theo thời gian thực.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
            Tổng cộng: {visibleApplications.length} đơn
          </span>
        </div>
      </div>

      {actionError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {actionError}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((skeletonId) => (
            <div
              key={skeletonId}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 animate-pulse"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="h-5 w-48 bg-slate-200 rounded mb-2" />
                  <div className="h-4 w-32 bg-slate-100 rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-24 bg-slate-200 rounded-full" />
                  <div className="h-8 w-8 bg-slate-100 rounded-xl" />
                </div>
              </div>
              <div className="h-24 w-full bg-slate-50 rounded-2xl border border-slate-100" />
              <div className="flex items-center justify-between pt-2">
                <div className="h-4 w-40 bg-slate-100 rounded" />
                <div className="h-4 w-24 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : visibleApplications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
          <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold text-slate-600">
            Bạn chưa ứng tuyển vị trí nào
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Hãy chuyển sang tab "Cơ hội thực tập" để chọn vị trí phù hợp.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleApplications.map((app) => {
            const badge = getStatusBadge(app.status);
            const canWithdraw =
              app.status === 'PENDING' ||
              app.status === 'REVIEWING' ||
              app.status === 'INTERVIEWING';
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

            return (
              <div
                key={app.id}
                className={`rounded-2xl border p-5 shadow-xs transition-all space-y-4 ${
                  isInactive
                    ? 'bg-slate-50/50 border-slate-200/90 opacity-90'
                    : 'bg-white border-slate-200 hover:border-blue-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {app.internshipTitle}
                    </h3>
                    <p className="text-xs font-semibold text-blue-600 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5" /> {app.companyName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${badge.bg}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                    {!isInactive && (
                      <button
                        onClick={onOpenChat}
                        className="p-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-slate-600 transition-colors"
                        title="Nhắn tin với Doanh nghiệp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    )}
                    {canWithdraw && (
                      <button
                        onClick={() => void withdraw(app.id)}
                        disabled={withdrawingId === app.id}
                        className="px-2.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl disabled:opacity-50"
                      >
                        {withdrawingId === app.id ? 'Đang rút...' : 'Rút đơn'}
                      </button>
                    )}
                    {isTerminal && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteApplication(app)}
                        disabled={deletingId === app.id}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-slate-600 font-bold text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
                        title="Xóa đơn đã hoàn tất hoặc hết hiệu lực khỏi danh sách"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deletingId === app.id ? 'Đang xóa...' : 'Xóa'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Stepper Bar */}
                <ApplicationProgressBar
                  status={app.status}
                  hasInterview={Boolean(app.interview)}
                />

                {/* Interview Schedule Card */}
                {app.interview && (
                  <div
                    className={`rounded-2xl border p-4 text-xs space-y-3 ${
                      isInactive
                        ? 'border-slate-200 bg-slate-100/70 text-slate-500'
                        : 'border-[#aad9da] bg-[#f4fbfb] text-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar
                          className={`w-4 h-4 shrink-0 ${
                            isInactive ? 'text-slate-400' : 'text-[#008b8f]'
                          }`}
                        />
                        <h4
                          className={`text-sm font-bold ${
                            isInactive ? 'text-slate-600' : 'text-[#12353b]'
                          }`}
                        >
                          {isInactive
                            ? 'Lịch phỏng vấn trước đó (Đã đóng): '
                            : 'Lịch phỏng vấn: '}
                          {formatDateTime(app.interview.scheduledAt)} (60 phút)
                        </h4>
                      </div>
                      <span
                        className={`w-fit rounded-full border bg-white px-3 py-1 text-[11px] font-bold ${
                          isInactive
                            ? 'border-slate-200 text-slate-500'
                            : 'border-[#aad9da] text-[#006d72]'
                        }`}
                      >
                        {app.interview.mode === 'ONLINE'
                          ? 'Trực tuyến (Online)'
                          : 'Trực tiếp (Offline)'}
                      </span>
                    </div>

                    <div
                      className={`grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-white p-3 border ${
                        isInactive ? 'border-slate-200' : 'border-[#c7e5e5]'
                      }`}
                    >
                      <div>
                        <span className="text-[11px] text-slate-500 block">
                          {app.interview.mode === 'ONLINE'
                            ? 'Đường dẫn phòng họp (Online):'
                            : 'Địa điểm phỏng vấn:'}
                        </span>
                        <strong
                          className={`font-bold mt-0.5 flex items-center gap-1.5 ${
                            isInactive ? 'text-slate-500' : 'text-[#12353b]'
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
                          {!isInactive &&
                          app.interview.mode === 'ONLINE' &&
                          app.interview.meetingLink?.startsWith('http') ? (
                            <a
                              href={app.interview.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#006d72] underline truncate"
                            >
                              {app.interview.meetingLink}
                            </a>
                          ) : (
                            <span
                              className={`truncate ${
                                isInactive ? 'line-through' : ''
                              }`}
                            >
                              {app.interview.meetingLink ||
                                app.interview.location ||
                                'Đang cập nhật'}
                            </span>
                          )}
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
                          {app.interview.contactName} •{' '}
                          {!isInactive ? (
                            <a
                              href={`mailto:${app.interview.contactEmail}?subject=${encodeURIComponent(
                                `[CareerBridge] Phản hồi lịch phỏng vấn - ${app.internshipTitle} - ${app.studentName}`,
                              )}`}
                              className="text-[#006d72] underline"
                            >
                              {app.interview.contactEmail}
                            </a>
                          ) : (
                            <span>{app.interview.contactEmail}</span>
                          )}
                          {app.interview.contactPhone
                            ? ` • ${app.interview.contactPhone}`
                            : ''}
                        </strong>
                      </div>
                    </div>

                    {app.interview.note && (
                      <div
                        className={`rounded-xl bg-white p-3 border ${
                          isInactive ? 'border-slate-200' : 'border-[#c7e5e5]'
                        }`}
                      >
                        <strong
                          className={`block font-bold mb-1 ${
                            isInactive ? 'text-slate-600' : 'text-[#12353b]'
                          }`}
                        >
                          Lưu ý từ doanh nghiệp:
                        </strong>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                          {app.interview.note}
                        </p>
                      </div>
                    )}

                    {app.status === 'INTERVIEWING' && (
                      <div className="flex flex-wrap items-center gap-2.5">
                        <a
                          href={`mailto:${app.interview.contactEmail}?subject=${encodeURIComponent(
                            `[CareerBridge] Xác nhận / Trao đổi lịch phỏng vấn - ${app.internshipTitle}`,
                          )}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#008b8f] hover:bg-[#006d72] px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors"
                        >
                          <Mail className="w-4 h-4" /> Phản hồi / Đề xuất lịch
                          qua Email
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Offer Card with 1-Click Confirm / Decline */}
                {app.status === 'OFFERED' && (
                  <div className="rounded-2xl border border-[#aad9da] bg-[#f4fbfb] p-4 text-xs text-slate-700 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#008b8f] shrink-0" />
                        <h4 className="text-sm font-bold text-[#12353b]">
                          Chúc mừng! Doanh nghiệp gửi Lời mời thực tập (Offer)
                        </h4>
                      </div>
                      {app.offerExpiresAt && (
                        <span className="w-fit rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[11px] font-bold text-amber-800">
                          Hạn xác nhận: {formatDateTime(app.offerExpiresAt)}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-white p-3 border border-[#c7e5e5]">
                      <div>
                        <span className="text-[11px] text-slate-500 block">
                          Thời gian thực tập chính thức:
                        </span>
                        <strong className="font-bold text-[#12353b] mt-0.5 block">
                          {formatDate(app.internshipStartDate)} —{' '}
                          {formatDate(app.internshipEndDate)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block">
                          Quy định xác nhận:
                        </span>
                        <strong className="font-bold text-[#12353b] mt-0.5 block">
                          Khi nhận lời mời này, các đơn khác trong kỳ sẽ tự động
                          rút.
                        </strong>
                      </div>
                    </div>

                    {app.offerMessage && (
                      <div className="rounded-xl bg-white p-3 border border-[#c7e5e5]">
                        <strong className="block font-bold text-[#12353b] mb-1">
                          Lời nhắn từ {app.companyName}:
                        </strong>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                          {app.offerMessage}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => void handleAcceptOffer(app)}
                        disabled={respondingOfferId === app.id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#008b8f] hover:bg-[#006d72] px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {respondingOfferId === app.id
                          ? 'Đang xử lý...'
                          : 'Xác nhận nhận lời mời thực tập'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeclineOffer(app)}
                        disabled={respondingOfferId === app.id}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-4 py-2 text-xs font-bold text-rose-800 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Từ chối lời mời
                      </button>
                    </div>
                  </div>
                )}

                {/* Rejection / Company Feedback (avoid duplicating offerMessage) */}
                {(app.rejectionReason ||
                  (app.companyFeedback &&
                    app.companyFeedback !== app.offerMessage)) && (
                  <div className="rounded-2xl border border-[#aad9da] bg-[#f4fbfb] p-4 text-xs text-slate-700 space-y-1.5">
                    <strong className="text-[#12353b] block font-bold text-sm">
                      Phản hồi từ Doanh nghiệp:
                    </strong>
                    {app.rejectionReason && (
                      <p className="text-rose-800 font-bold">
                        Lý do: {app.rejectionReason}
                      </p>
                    )}
                    {app.companyFeedback && (
                      <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                        {app.companyFeedback}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Ngày ứng tuyển:{' '}
                    {formatDate(app.appliedAt)}
                  </span>
                  {app.cvUrl ? (
                    <a
                      href={app.cvUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      Xem CV đã gửi <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span>CV được lưu riêng tư trong hệ thống</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
