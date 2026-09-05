import React, { useState } from 'react';
import { Application, ApplicationStatus } from '../../types';
import { getStatusBadge } from '../../utils/matching';
import { getApiErrorMessage } from '../../auth/api';
import { formatDate } from '../../utils/format';
import { FileCheck, Building2, MessageSquare, ExternalLink, Clock, Check, X } from 'lucide-react';

interface StudentApplicationsProps {
  applications: Application[];
  isLoading?: boolean;
  onOpenChat: () => void;
  onWithdraw: (applicationId: string) => Promise<void>;
}

function ApplicationProgressBar({ status }: { status: ApplicationStatus }) {
  const isRejected = status === 'REJECTED';
  const isWithdrawn = status === 'WITHDRAWN';

  let currentStep = 0;
  if (status === 'PENDING') currentStep = 0;
  else if (status === 'REVIEWING') currentStep = 1;
  else if (status === 'ACCEPTED') currentStep = 2;
  else if (status === 'REJECTED') currentStep = 2;

  const steps = [
    { title: 'Nộp hồ sơ', desc: 'Đã gửi đến doanh nghiệp' },
    { title: 'Đang xét duyệt', desc: 'Doanh nghiệp đang xem CV' },
    {
      title: isRejected ? 'Từ chối' : 'Kết quả duyệt',
      desc: isRejected
        ? 'Chưa phù hợp đợt này'
        : status === 'ACCEPTED'
        ? 'Trúng tuyển thực tập'
        : 'Chờ phản hồi',
    },
    {
      title: 'Vào thực tập',
      desc: status === 'ACCEPTED' ? 'Khởi động kỳ thực tập' : 'Chờ duyệt kết quả',
    },
  ];

  if (isWithdrawn) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-500">
        Đơn ứng tuyển này đã được rút bởi sinh viên.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
      <h4 className="mb-3 text-xs font-bold text-slate-700">Tiến trình xử lý hồ sơ:</h4>
      <div className="relative flex items-center justify-between px-2 sm:px-6">
        {/* Background Connecting Line */}
        <div className="absolute left-8 right-8 top-3.5 h-0.5 -translate-y-1/2 bg-slate-200" />
        {/* Active Progress Line */}
        <div
          className={`absolute left-8 top-3.5 h-0.5 -translate-y-1/2 transition-all duration-500 ${
            isRejected ? 'bg-rose-500' : 'bg-emerald-500'
          }`}
          style={{
            width: `calc(${Math.min(currentStep, 3) / 3} * (100% - 4rem))`,
          }}
        />

        {steps.map((step, idx) => {
          const isDone = idx < currentStep || (idx === currentStep && status === 'ACCEPTED');
          const isCurrent = idx === currentStep && status !== 'ACCEPTED' && !isRejected;
          const isStepRejected = idx === currentStep && isRejected;

          return (
            <div key={idx} className="relative z-10 flex flex-col items-center text-center">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                  isStepRejected
                    ? 'border-rose-500 bg-rose-500 text-white shadow-sm ring-4 ring-rose-100'
                    : isDone
                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                    : isCurrent
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm ring-4 ring-indigo-100'
                    : 'border-slate-300 bg-white text-slate-400'
                }`}
              >
                {isStepRejected ? (
                  <X className="h-3.5 w-3.5" />
                ) : isDone ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <p
                className={`mt-2 text-[11px] font-bold ${
                  isStepRejected
                    ? 'text-rose-700'
                    : isDone
                    ? 'text-emerald-700'
                    : isCurrent
                    ? 'text-indigo-700'
                    : 'text-slate-500'
                }`}
              >
                {step.title}
              </p>
              <p className="hidden sm:block text-[10px] text-slate-400 max-w-[100px] leading-tight mt-0.5">
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
}) => {
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const withdraw = async (applicationId: string) => {
    setWithdrawingId(applicationId);
    setActionError(null);
    try {
      await onWithdraw(applicationId);
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Danh Sách Đơn Ứng Tuyển</h2>
          <p className="text-xs text-slate-500 mt-0.5">Theo dõi trạng thái xử lý hồ sơ thực tập theo thời gian thực.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
            Tổng cộng: {applications.length} đơn
          </span>
        </div>
      </div>

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
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
          <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold text-slate-600">Bạn chưa ứng tuyển vị trí nào</p>
          <p className="text-xs text-slate-400 mt-1">Hãy chuyển sang tab "Cơ hội thực tập" để chọn vị trí phù hợp.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const badge = getStatusBadge(app.status);

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-200 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{app.internshipTitle}</h3>
                    <p className="text-xs font-semibold text-blue-600 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5" /> {app.companyName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${badge.bg}`}>
                      <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                    <button
                      onClick={onOpenChat}
                      className="p-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-slate-600 transition-colors"
                      title="Nhắn tin với Doanh nghiệp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    {(app.status === 'PENDING' || app.status === 'REVIEWING') && (
                      <button
                        onClick={() => void withdraw(app.id)}
                        disabled={withdrawingId === app.id}
                        className="px-2.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl disabled:opacity-50"
                      >
                        {withdrawingId === app.id ? 'Đang rút...' : 'Rút đơn'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Stepper Bar */}
                <ApplicationProgressBar status={app.status} />

                {/* Company Feedback */}
                {app.companyFeedback && (
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-slate-800">
                    <strong className="text-blue-900 block font-bold mb-1">💬 Phản hồi từ Doanh nghiệp:</strong>
                    <p className="text-slate-700 leading-relaxed">{app.companyFeedback}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Ngày ứng tuyển: {formatDate(app.appliedAt)}
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
                {actionError && <p className="text-xs text-rose-600">{actionError}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
