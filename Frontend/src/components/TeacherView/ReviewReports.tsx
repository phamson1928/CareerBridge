import React, { useState } from 'react';
import { WeeklyReport } from '../../types';
import { getReportStatusBadge } from '../../utils/matching';
import { CheckSquare, Calendar, MessageSquare, Check, X, FileText } from 'lucide-react';

interface ReviewReportsProps {
  reports: WeeklyReport[];
  onReviewReport: (reportId: string, status: WeeklyReport['status'], comment: string) => void;
}

export const ReviewReports: React.FC<ReviewReportsProps> = ({
  reports,
  onReviewReport,
}) => {
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const [commentText, setCommentText] = useState('');

  const handleAction = (status: WeeklyReport['status']) => {
    if (!selectedReport) return;
    onReviewReport(selectedReport.id, status, commentText || 'Đã duyệt báo cáo tiến độ.');
    setSelectedReport(null);
    setCommentText('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">Giám Sát & Duyệt Báo Cáo Tuần</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Giảng viên theo dõi tiến độ làm việc thực tế của sinh viên tại doanh nghiệp theo tuần.
        </p>
      </div>

      <div className="space-y-4">
        {reports.map((rep) => {
          const badge = getReportStatusBadge(rep.status);

          return (
            <div key={rep.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {rep.studentName} - Báo Cáo Tuần {rep.weekNumber}
                  </h3>
                  <p className="text-xs text-slate-500">Doanh nghiệp: {rep.companyName}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border self-start ${badge.bg}`}>
                  {badge.label}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <strong className="block font-bold mb-1">Công việc đã làm:</strong>
                  <p className="whitespace-pre-line text-slate-600">{rep.tasksCompleted}</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <strong className="block font-bold mb-1">Kế hoạch tuần tới:</strong>
                  <p className="whitespace-pre-line text-slate-600">{rep.plansNextWeek}</p>
                </div>
              </div>

              {rep.teacherComment && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900">
                  <strong className="font-bold block">Nhận xét của Giảng viên:</strong>
                  <p className="mt-0.5">{rep.teacherComment}</p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedReport(rep);
                    setCommentText(rep.teacherComment || '');
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Duyệt & Nhận xét →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="font-bold text-slate-900 text-base mb-1">Duyệt Báo Cáo</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedReport.studentName} - Tuần {selectedReport.weekNumber}</p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Nhận xét góp ý cho sinh viên:</label>
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Gợi ý nhận xét: Báo cáo đầy đủ, công việc đảm bảo tiến độ..."
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAction('APPROVED')}
                  className="py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-xs hover:bg-emerald-700"
                >
                  Duyệt báo cáo ✓
                </button>
                <button
                  onClick={() => handleAction('NEEDS_REVISION')}
                  className="py-2.5 bg-rose-50 text-rose-800 border border-rose-200 font-bold rounded-xl hover:bg-rose-100"
                >
                  Yêu cầu sửa lại
                </button>
              </div>

              <div className="text-right pt-2 border-t border-slate-100">
                <button onClick={() => setSelectedReport(null)} className="text-xs text-slate-500 font-semibold">
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
