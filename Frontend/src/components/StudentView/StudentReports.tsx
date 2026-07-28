import React, { useState } from 'react';
import { WeeklyReport, StudentProfile } from '../../types';
import { getReportStatusBadge } from '../../utils/matching';
import { CheckSquare, Plus, Calendar, FileText, Send, CheckCircle, Clock, X, MessageSquare, AlertCircle } from 'lucide-react';

interface StudentReportsProps {
  reports: WeeklyReport[];
  studentProfile: StudentProfile;
  onSubmitReport: (report: Partial<WeeklyReport>) => void;
}

export const StudentReports: React.FC<StudentReportsProps> = ({
  reports,
  studentProfile,
  onSubmitReport,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [weekNumber, setWeekNumber] = useState(reports.length + 1);
  const [tasksCompleted, setTasksCompleted] = useState('');
  const [plansNextWeek, setPlansNextWeek] = useState('');
  const [learningsAndChallenges, setLearningsAndChallenges] = useState('');
  const [attachmentName, setAttachmentName] = useState('BaoCao_ThucTap.pdf');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tasksCompleted.trim()) return;

    onSubmitReport({
      weekNumber: Number(weekNumber),
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      tasksCompleted,
      plansNextWeek,
      learningsAndChallenges,
      attachmentName,
      attachmentUrl: 'https://pdfobject.com/pdf/sample.pdf',
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString().split('T')[0],
    });

    setIsModalOpen(false);
    setTasksCompleted('');
    setPlansNextWeek('');
    setLearningsAndChallenges('');
  };

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản Lý Báo Cáo Thực Tập Theo Tuần</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Nộp báo cáo định kỳ cho Doanh nghiệp & Giảng viên hướng dẫn ({studentProfile.university}).
          </p>
        </div>
        <button
          id="btn-new-report"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Nộp Báo Cáo Mới
        </button>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
            <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold text-slate-600">Chưa có báo cáo tuần nào</p>
            <p className="text-xs text-slate-400 mt-1">Nhấn "Nộp Báo Cáo Mới" để bắt đầu báo cáo tiến độ tuần đầu tiên.</p>
          </div>
        ) : (
          reports.map((rep) => {
            const badge = getReportStatusBadge(rep.status);

            return (
              <div
                key={rep.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-extrabold flex items-center justify-center border border-blue-200 text-sm">
                      T{rep.weekNumber}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Báo Cáo Thực Tập Tuần {rep.weekNumber}</h3>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" /> Từ {rep.startDate} đến {rep.endDate}
                      </span>
                    </div>
                  </div>

                  <span className={`text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${badge.bg}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <strong className="text-slate-900 block font-bold mb-1">✅ Công việc đã hoàn thành:</strong>
                    <p className="whitespace-pre-line text-slate-600 leading-relaxed">{rep.tasksCompleted}</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <strong className="text-slate-900 block font-bold mb-1">🚀 Kế hoạch tuần tiếp theo:</strong>
                    <p className="whitespace-pre-line text-slate-600 leading-relaxed">{rep.plansNextWeek || 'Chưa cập nhật'}</p>
                  </div>
                </div>

                {rep.learningsAndChallenges && (
                  <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 text-xs text-amber-900">
                    <strong className="font-bold block mb-0.5">💡 Bài học & Thách thức:</strong>
                    <p className="text-amber-800 leading-relaxed">{rep.learningsAndChallenges}</p>
                  </div>
                )}

                {/* Supervisor & Teacher Remarks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {rep.companyComment && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs">
                      <span className="font-bold text-blue-900 block">🏢 Nhận xét từ Doanh nghiệp:</span>
                      <p className="text-slate-700 mt-1">{rep.companyComment}</p>
                    </div>
                  )}

                  {rep.teacherComment && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs">
                      <span className="font-bold text-purple-900 block">👨‍🏫 Nhận xét từ Giảng viên:</span>
                      <p className="text-slate-700 mt-1">{rep.teacherComment}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-600" /> Nộp Báo Cáo Thực Tập Theo Tuần
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Chọn Tuần Thực Tập:</label>
                <select
                  value={weekNumber}
                  onChange={(e) => setWeekNumber(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((w) => (
                    <option key={w} value={w}>
                      Tuần {w}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Nội dung công việc đã hoàn thành (*):
                </label>
                <textarea
                  rows={4}
                  required
                  value={tasksCompleted}
                  onChange={(e) => setTasksCompleted(e.target.value)}
                  placeholder="- Setup project
- Nghiên cứu tài liệu
- Viết API authentication..."
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Kế hoạch tuần tới:</label>
                <textarea
                  rows={3}
                  value={plansNextWeek}
                  onChange={(e) => setPlansNextWeek(e.target.value)}
                  placeholder="Nêu cụ thể nhiệm vụ sẽ làm trong tuần tiếp theo..."
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Bài học & Thách thức gặp phải:</label>
                <textarea
                  rows={2}
                  value={learningsAndChallenges}
                  onChange={(e) => setLearningsAndChallenges(e.target.value)}
                  placeholder="Khó khăn trong quá trình thực hiện và giải pháp..."
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Tên file minh chứng đính kèm (.pdf):</label>
                <input
                  type="text"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Gửi báo cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
