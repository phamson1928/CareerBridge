import React, { useState } from 'react';
import { Application, ApplicationStatus, CompanyProfile } from '../../types';
import { getStatusBadge } from '../../utils/matching';
import { getApiErrorMessage } from '../../auth/api';
import { getPrivateFileDownloadUrl } from '../../files/api';
import { Users, Search, CheckCircle2, XCircle, FileText, Sparkles, MessageSquare, Clock, Filter, Send } from 'lucide-react';

interface ManageApplicantsProps {
  companyProfile: CompanyProfile;
  applications: Application[];
  onUpdateStatus: (applicationId: string, status: ApplicationStatus, feedback?: string) => Promise<void>;
  onOpenChat: () => void;
}

export const ManageApplicants: React.FC<ManageApplicantsProps> = ({
  companyProfile,
  applications,
  onUpdateStatus,
  onOpenChat,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [openingCvId, setOpeningCvId] = useState<string | null>(null);

  const companyApps = applications.filter((a) => a.companyId === companyProfile.id);

  const filteredApps = companyApps.filter((a) => {
    const matchesStatus = filterStatus === 'ALL' || a.status === filterStatus;
    const matchesSearch =
      a.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.internshipTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.studentMajor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleApplyAction = async (status: ApplicationStatus) => {
    if (!selectedApp) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await onUpdateStatus(selectedApp.id, status, feedbackText || (status === 'ACCEPTED' ? 'Hồ sơ đã được phê duyệt.' : 'Cảm ơn em đã quan tâm.'));
      setSelectedApp(null);
      setFeedbackText('');
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCv = async (fileId: string) => {
    setOpeningCvId(fileId);
    setActionError(null);
    try {
      const { downloadUrl } = await getPrivateFileDownloadUrl(fileId);
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
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
          <h2 className="text-xl font-bold text-slate-900">Quản Lý Ứng Viên & Duyệt CV</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Đánh giá hồ sơ sinh viên ứng tuyển, đối chiếu điểm Skill Match % và phê duyệt trực tiếp.
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
            <option value="ACCEPTED">Đã nhận</option>
            <option value="REJECTED">Từ chối</option>
            <option value="WITHDRAWN">Sinh viên rút đơn</option>
          </select>
        </div>
      </div>

      {/* Applications Grid */}
      <div className="space-y-4">
        {filteredApps.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold text-slate-600">Không tìm thấy đơn ứng tuyển phù hợp</p>
          </div>
        ) : (
          filteredApps.map((app) => {
            const badge = getStatusBadge(app.status);
            const canReview = app.status === 'PENDING' || app.status === 'REVIEWING';

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-200 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-lg flex items-center justify-center">
                      {app.studentName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{app.studentName}</h3>
                      <p className="text-xs text-slate-500">{app.studentMajor} • Vị trí: <strong className="text-slate-800">{app.internshipTitle}</strong></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {app.matchScore}% Match
                    </span>

                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Candidate Skills */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Kỹ năng ứng viên:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {app.studentSkills.map((sk) => (
                      <span key={sk} className="bg-slate-100 text-slate-700 text-[11px] px-2.5 py-0.5 rounded-md font-medium border border-slate-200">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Cover Letter excerpt */}
                {app.coverLetter && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-700">
                    <strong className="block font-bold mb-0.5">Thư giới thiệu từ sinh viên:</strong>
                    <p className="italic text-slate-600">"{app.coverLetter}"</p>
                  </div>
                )}

                {/* Action Row */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3 text-xs">
                    {app.cvFileId ? (
                      <button
                        type="button"
                        onClick={() => void openCv(app.cvFileId!)}
                        disabled={openingCvId === app.cvFileId}
                        className="text-blue-600 font-bold hover:underline flex items-center gap-1 disabled:opacity-50"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {openingCvId === app.cvFileId ? 'Đang mở CV...' : 'Xem CV đầy đủ'}
                      </button>
                    ) : app.cvUrl ? (
                      <a
                        href={app.cvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> Xem CV đầy đủ
                      </a>
                    ) : (
                      <span className="text-slate-500">CV được lưu riêng tư</span>
                    )}
                    <button
                      onClick={onOpenChat}
                      className="text-slate-600 font-semibold hover:text-blue-600 flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Nhắn tin trực tiếp
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedApp(app);
                      setFeedbackText(app.companyFeedback || '');
                    }}
                    disabled={!canReview}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {canReview ? 'Xử lý hồ sơ →' : 'Đã xử lý'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Review & Approve Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="font-bold text-slate-900 text-base mb-1">Cập Nhật Trạng Thái Hồ Sơ</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedApp.studentName} - {selectedApp.internshipTitle}</p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Ghi chú phản hồi gửi sinh viên:</label>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Nhập nội dung phản hồi (ví dụ: Mời em đến phỏng vấn vào ngày 15/08...)..."
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => void handleApplyAction('REVIEWING')}
                  disabled={isSubmitting}
                  className="py-2.5 bg-blue-50 text-blue-800 font-bold border border-blue-200 rounded-xl hover:bg-blue-100"
                >
                  Đang xem xét
                </button>
                <button
                  type="button"
                  onClick={() => void handleApplyAction('ACCEPTED')}
                  disabled={isSubmitting}
                  className="py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-xs"
                >
                  Chấp nhận ✓
                </button>
                <button
                  type="button"
                  onClick={() => void handleApplyAction('REJECTED')}
                  disabled={isSubmitting}
                  className="py-2.5 bg-rose-50 text-rose-800 font-bold border border-rose-200 rounded-xl hover:bg-rose-100"
                >
                  Từ chối ✕
                </button>
              </div>

              <div className="text-right pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-xs text-slate-500 hover:underline font-semibold"
                >
                  Hủy bỏ
                </button>
              </div>
              {actionError && <p className="text-xs text-rose-600">{actionError}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
