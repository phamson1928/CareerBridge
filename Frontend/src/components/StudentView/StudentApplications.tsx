import React, { useState } from 'react';
import { Application } from '../../types';
import { getStatusBadge } from '../../utils/matching';
import { getApiErrorMessage } from '../../auth/api';
import { FileCheck, Building2, Calendar, MessageSquare, ExternalLink, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface StudentApplicationsProps {
  applications: Application[];
  onOpenChat: () => void;
  onWithdraw: (applicationId: string) => Promise<void>;
}

export const StudentApplications: React.FC<StudentApplicationsProps> = ({
  applications,
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

      {applications.length === 0 ? (
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

                {/* Timeline status bar */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-700 mb-2">Quy trình xử lý hồ sơ:</h4>
                  <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-semibold">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                      1. Gửi đơn ✓
                    </div>
                    <div
                      className={`p-2 rounded-lg border ${
                        app.status === 'REVIEWING' || app.status === 'ACCEPTED'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      2. Đang xét duyệt
                    </div>
                    <div
                      className={`p-2 rounded-lg border ${
                        app.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      3. Kết quả
                    </div>
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                      4. Bắt đầu thực tập
                    </div>
                  </div>
                </div>

                {/* Company Feedback */}
                {app.companyFeedback && (
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-slate-800">
                    <strong className="text-blue-900 block font-bold mb-1">💬 Phản hồi từ Doanh nghiệp:</strong>
                    <p className="text-slate-700 leading-relaxed">{app.companyFeedback}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Ngày ứng tuyển: {app.appliedAt}
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
