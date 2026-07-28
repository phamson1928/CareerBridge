import React, { useState } from 'react';
import { Evaluation, StudentProfile, Internship, CompanyProfile } from '../../types';
import { Award, CheckCircle, Star, MessageSquare, Save, X, ChevronRight } from 'lucide-react';

interface EvaluateInternsProps {
  companyProfile: CompanyProfile;
  evaluations: Evaluation[];
  internships: Internship[];
  studentProfiles: StudentProfile[];
  onSubmitEvaluation: (evaluation: Partial<Evaluation>) => void;
}

export const EvaluateInternsModal: React.FC<EvaluateInternsProps> = ({
  companyProfile,
  evaluations,
  internships,
  studentProfiles,
  onSubmitEvaluation,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('std-1');
  const [technicalScore, setTechnicalScore] = useState<number>(9.0);
  const [softSkillScore, setSoftSkillScore] = useState<number>(8.5);
  const [disciplineScore, setDisciplineScore] = useState<number>(9.5);
  const [companyFeedback, setCompanyFeedback] = useState<string>(
    'Sinh viên tiếp thu nhanh, hoàn thành xuất sắc các nhiệm vụ được giao.'
  );

  const activeStudent = studentProfiles.find((s) => s.id === selectedStudentId) || studentProfiles[0];
  const existingEval = evaluations.find((e) => e.studentId === selectedStudentId);

  const calculateOverall = () => {
    return Number(((technicalScore * 0.4 + softSkillScore * 0.3 + disciplineScore * 0.3)).toFixed(1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;

    onSubmitEvaluation({
      studentId: activeStudent.id,
      studentName: activeStudent.fullname,
      internshipId: activeStudent.activeInternshipId || 'int-1',
      companyId: companyProfile.id,
      companyName: companyProfile.companyName,
      technicalScore,
      softSkillScore,
      disciplineScore,
      overallScore: calculateOverall(),
      companyFeedback,
      evaluatedAt: new Date().toISOString().split('T')[0],
    });

    alert('Đã lưu kết quả đánh giá thực tập thành công!');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">Đánh Giá & Chấm Điểm Kết Thúc Thực Tập</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Nhập bảng đánh giá điểm số và nhận xét năng lực cho thực tập sinh gửi về Nhà trường.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Selector List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thực tập sinh chính thức:</h3>
          {studentProfiles.map((std) => (
            <div
              key={std.id}
              onClick={() => setSelectedStudentId(std.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedStudentId === std.id
                  ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20 shadow-2xs'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div>
                <h4 className="font-bold text-slate-900 text-xs">{std.fullname}</h4>
                <p className="text-[11px] text-slate-500">{std.major}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          ))}
        </div>

        {/* Evaluation Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Bảng Đánh Giá: {activeStudent?.fullname}</h3>
              <p className="text-xs text-slate-500">Mã số: {activeStudent?.studentCode} • {activeStudent?.major}</p>
            </div>
            <div className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-xl border border-emerald-200 font-extrabold text-xs">
              Điểm tổng kết dự kiến: {calculateOverall()}/10
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* Criteria Scores */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-800 mb-1">Kỹ năng Chuyên môn (40%):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={technicalScore}
                  onChange={(e) => setTechnicalScore(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg text-base font-extrabold text-blue-600 bg-white"
                />
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-800 mb-1">Kỹ năng Mềm (30%):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={softSkillScore}
                  onChange={(e) => setSoftSkillScore(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg text-base font-extrabold text-purple-600 bg-white"
                />
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-800 mb-1">Ý thức Kỷ luật (30%):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={disciplineScore}
                  onChange={(e) => setDisciplineScore(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg text-base font-extrabold text-emerald-600 bg-white"
                />
              </div>
            </div>

            {/* Written Comment */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Nhận xét chi tiết về thái độ & kết quả thực tập:
              </label>
              <textarea
                rows={4}
                required
                value={companyFeedback}
                onChange={(e) => setCompanyFeedback(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Lưu & Gửi Đánh Giá Về Trường
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
