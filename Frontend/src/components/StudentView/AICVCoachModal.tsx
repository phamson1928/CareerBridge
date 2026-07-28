import React, { useState } from 'react';
import { StudentProfile, Internship } from '../../types';
import { Sparkles, Bot, CheckCircle2, AlertTriangle, Lightbulb, X, RefreshCw, Award, ArrowRight } from 'lucide-react';

interface AICVCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentProfile: StudentProfile;
  internships: Internship[];
}

export const AICVCoachModal: React.FC<AICVCoachModalProps> = ({
  isOpen,
  onClose,
  studentProfile,
  internships,
}) => {
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAnalyzeCV = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/ai/analyze-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvText: `Họ tên: ${studentProfile.fullname}\nNgành: ${studentProfile.major}\nTóm tắt: ${studentProfile.summary}\nDự án: ${JSON.stringify(studentProfile.projects)}`,
          studentMajor: studentProfile.major,
          targetSkills: studentProfile.skills,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.details || err.error || 'Lỗi hệ thống');
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể gọi AI Service. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">AI CV Coach & Trợ Lý Tuyển Dụng</h2>
            <p className="text-xs text-slate-500">
              Phân tích điểm mạnh, gợi ý tối ưu CV & lộ trình ứng tuyển thực tập bằng AI (Gemini 3.6 Flash).
            </p>
          </div>
        </div>

        {/* Content Body */}
        {!analysisResult && !loading && (
          <div className="text-center py-8 bg-purple-50/50 border border-purple-100 rounded-2xl p-6">
            <Bot className="w-12 h-12 mx-auto text-purple-600 mb-3" />
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              Phân tích hồ sơ cá nhân của {studentProfile.fullname}
            </h3>
            <p className="text-xs text-slate-600 mb-6 max-w-md mx-auto leading-relaxed">
              Trí tuệ nhân tạo sẽ tự động xem xét kỹ năng ({studentProfile.skills.slice(0, 4).join(', ')}...), ngành học và các dự án cá nhân để đưa ra phản hồi trực tiếp.
            </p>

            <button
              onClick={handleAnalyzeCV}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 mx-auto transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" /> Bắt Đầu Phân Tích Hồ Sơ Với AI
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-12 space-y-3">
            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-800">Gemini 3.6 Flash đang đọc và phân tích CV của bạn...</p>
            <p className="text-[11px] text-slate-400">Đang đối chiếu với nhu cầu tuyển dụng của hơn 50 doanh nghiệp IT.</p>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs my-4">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> {errorMsg}
            </p>
          </div>
        )}

        {analysisResult && (
          <div className="space-y-5 text-xs">
            {/* Score box */}
            <div className="p-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-[10px] text-purple-200 uppercase font-bold tracking-wider">Đánh giá tổng thể CV:</span>
                <h3 className="text-xl font-black mt-0.5">{analysisResult.summaryRating}</h3>
              </div>
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30">
                <Award className="w-6 h-6 text-amber-300" />
                <span className="text-2xl font-black text-amber-300">{analysisResult.overallScore}/10</span>
              </div>
            </div>

            {/* Strengths */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
              <h4 className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Điểm mạnh nổi bật trong hồ sơ:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                {analysisResult.strengths?.map((st: string, idx: number) => (
                  <li key={idx}>{st}</li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
              <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-600" /> Điểm cần tối ưu hóa:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                {analysisResult.improvements?.map((imp: string, idx: number) => (
                  <li key={idx}>{imp}</li>
                ))}
              </ul>
            </div>

            {/* Career Advice */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <h4 className="font-bold text-slate-900 text-xs">💡 Lời khuyên định hướng từ Chuyên Gia AI:</h4>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">{analysisResult.careerAdvice}</p>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                onClick={handleAnalyzeCV}
                className="text-xs text-purple-600 font-bold hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Phân tích lại
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800"
              >
                Đóng phản hồi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
