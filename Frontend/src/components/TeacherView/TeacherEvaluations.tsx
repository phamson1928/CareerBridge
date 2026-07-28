import React, { useState } from 'react';
import { Evaluation, StudentProfile } from '../../types';
import { Award, GraduationCap, CheckCircle2, Save } from 'lucide-react';

interface TeacherEvaluationsProps {
  evaluations: Evaluation[];
  assignedStudents: StudentProfile[];
  onSaveTeacherFeedback: (evaluationId: string, teacherFeedback: string) => void;
}

export const TeacherEvaluations: React.FC<TeacherEvaluationsProps> = ({
  evaluations,
  assignedStudents,
  onSaveTeacherFeedback,
}) => {
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedEvalId, setSelectedEvalId] = useState<string>('eval-1');

  const currentEval = evaluations.find((e) => e.id === selectedEvalId) || evaluations[0];

  const handleSave = () => {
    if (!currentEval) return;
    onSaveTeacherFeedback(currentEval.id, feedbackText);
    alert('Đã lưu xác nhận đánh giá tốt nghiệp thành công!');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">Tổng Hợp Đánh Giá & Điểm Thực Tập</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Giảng viên xác nhận điểm từ Doanh nghiệp và nhập nhận xét báo cáo tốt nghiệp cho Khoa.
        </p>
      </div>

      {evaluations.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
          Chưa có đánh giá thực tập nào từ Doanh nghiệp.
        </div>
      ) : (
        <div className="space-y-4">
          {evaluations.map((ev) => (
            <div key={ev.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{ev.studentName}</h3>
                  <p className="text-xs text-slate-500">Doanh nghiệp thực tập: {ev.companyName}</p>
                </div>

                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-4 py-2 rounded-xl border border-emerald-200 font-black text-sm">
                  <Award className="w-5 h-5 text-emerald-600" />
                  <span>Điểm Doanh nghiệp: {ev.overallScore}/10</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block font-semibold">Chuyên môn (40%)</span>
                  <strong className="text-blue-600 text-base font-black">{ev.technicalScore}</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block font-semibold">Kỹ năng mềm (30%)</span>
                  <strong className="text-purple-600 text-base font-black">{ev.softSkillScore}</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block font-semibold">Kỷ luật (30%)</span>
                  <strong className="text-emerald-600 text-base font-black">{ev.disciplineScore}</strong>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800">
                <strong className="font-bold block mb-1">💬 Nhận xét chi tiết từ Doanh nghiệp:</strong>
                <p className="text-slate-600 leading-relaxed">{ev.companyFeedback}</p>
              </div>

              {ev.teacherFeedback ? (
                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900">
                  <strong className="font-bold block mb-1">👨‍🏫 Nhận xét của Giảng viên hướng dẫn:</strong>
                  <p>{ev.teacherFeedback}</p>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <label className="block font-bold text-slate-800">Nhận xét tổng kết của Giảng viên:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Nhập đánh giá hoàn thành đợt thực tập..."
                      className="flex-1 p-2.5 border border-slate-300 rounded-xl"
                    />
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl shadow-xs"
                    >
                      Lưu nhận xét
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
