import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  X,
  FileText,
  ThumbsUp,
  Star,
  HelpCircle,
  Bot,
  Calendar,
  Award,
  Layers,
  Code2,
} from 'lucide-react';
import { Application } from '../../types';
import { formatDateTime } from '../../utils/format';
import { applicationsApi, toLegacyApplication } from '../../applications/api';

interface AiScanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onRescan?: (applicationId: string) => Promise<void>;
  onOpenCv?: (cvFileId: string) => Promise<void>;
}

export const AiScanDetailModal: React.FC<AiScanDetailModalProps> = ({
  isOpen,
  onClose,
  application,
  onRescan,
  onOpenCv,
}) => {
  const [isRescanning, setIsRescanning] = useState(false);
  const [currentApp, setCurrentApp] = useState<Application | null>(application);

  useEffect(() => {
    setCurrentApp(application);
  }, [application]);

  // Real-time polling while modal is open and scan is in queue or running
  useEffect(() => {
    if (!isOpen || !currentApp) return;
    const status = currentApp.aiScanJob?.status;
    if (status !== 'PENDING' && status !== 'PROCESSING') return;

    const interval = setInterval(async () => {
      try {
        const record = await applicationsApi.getById(currentApp.id);
        const mapped = toLegacyApplication(record);
        setCurrentApp(mapped);
      } catch {
        // silent polling catch
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isOpen, currentApp?.id, currentApp?.aiScanJob?.status]);

  if (!isOpen || !currentApp) return null;

  const job = currentApp.aiScanJob;
  const aiScore = currentApp.aiScore ?? job?.aiScore ?? null;
  const isCompleted = job?.status === 'COMPLETED' || (aiScore !== null && aiScore !== undefined);
  const isProcessing = job?.status === 'PROCESSING';
  const isPending = job?.status === 'PENDING';
  const isFailed = job?.status === 'FAILED';

  const handleRescan = async () => {
    if (!onRescan || isRescanning || !currentApp) return;
    setIsRescanning(true);
    try {
      await onRescan(currentApp.id);
      // Immediately set status to pending to reflect UI
      setCurrentApp((prev) =>
        prev
          ? {
              ...prev,
              aiScanJob: prev.aiScanJob
                ? { ...prev.aiScanJob, status: 'PENDING' }
                : {
                    id: 'temp-pending',
                    status: 'PENDING',
                    aiScore: null,
                    recommendation: null,
                    experienceYears: null,
                    extractedSkills: [],
                    matchedSkills: [],
                    missingSkills: [],
                    strengths: [],
                    weaknesses: [],
                    summary: null,
                    attempts: 0,
                    maxAttempts: 3,
                    errorDetails: null,
                    completedAt: null,
                    createdAt: new Date().toISOString(),
                  },
            }
          : null,
      );
    } finally {
      setIsRescanning(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) {
      return {
        text: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        ring: 'text-emerald-500',
        badge: 'from-emerald-600 to-teal-600',
      };
    }
    if (score >= 65) {
      return {
        text: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        ring: 'text-blue-500',
        badge: 'from-blue-600 to-indigo-600',
      };
    }
    if (score >= 50) {
      return {
        text: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        ring: 'text-amber-500',
        badge: 'from-amber-600 to-orange-600',
      };
    }
    return {
      text: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      ring: 'text-rose-500',
      badge: 'from-rose-600 to-red-600',
    };
  };

  const getRecommendationBadge = (rec?: string | null) => {
    switch (rec) {
      case 'STRONG_HIRE':
        return {
          label: 'Rất phù hợp (Strong Hire)',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />,
        };
      case 'HIRE':
        return {
          label: 'Phù hợp (Hire)',
          bg: 'bg-teal-100 text-teal-800 border-teal-300',
          icon: <ThumbsUp className="w-3.5 h-3.5 text-teal-600" />,
        };
      case 'POTENTIAL':
        return {
          label: 'Tiềm năng (Potential)',
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: <HelpCircle className="w-3.5 h-3.5 text-amber-600" />,
        };
      case 'NOT_RECOMMENDED':
        return {
          label: 'Cần cân nhắc thêm',
          bg: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />,
        };
      default:
        return {
          label: 'Chưa có kết luận',
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: <Bot className="w-3.5 h-3.5 text-slate-500" />,
        };
    }
  };

  const scoreTheme = getScoreColor(aiScore ?? 0);
  const recBadge = getRecommendationBadge(job?.recommendation);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/40">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <Sparkles className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Báo Cáo Phân Tích CV Chuyên Sâu bằng AI
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  On-Premise AI
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Ứng viên: <strong className="text-white">{application.studentName}</strong> • Vị trí: <strong className="text-white">{application.internshipTitle}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRescan && (
              <button
                onClick={handleRescan}
                disabled={isRescanning}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Yêu cầu AI Worker quét lại CV này"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRescanning ? 'animate-spin' : ''}`} />
                {isRescanning ? 'Đang gửi...' : 'Quét Lại CV'}
              </button>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Case 1: In Queue (PENDING) */}
          {isPending && (
            <div className="py-14 px-6 rounded-3xl bg-amber-50/60 border border-amber-200/80 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shadow-inner">
                <Clock className="w-8 h-8 animate-pulse text-amber-600" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h4 className="text-base font-bold text-slate-900">
                  Hồ sơ đang trong hàng đợi chờ AI phân tích
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Đơn ứng tuyển của ứng viên <strong>{currentApp.studentName}</strong> đã được xếp vào hàng đợi quét tự động. Khi AI Worker nội bộ hoàn tất quét, bảng đánh giá sẽ <strong>tự động xuất hiện ngay tại đây</strong> mà không cần bạn phải tải lại trang.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <span className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white text-amber-800 border border-amber-200 shadow-2xs flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" /> Đang lắng nghe kết quả từ AI Worker...
                </span>
                {onRescan && (
                  <button
                    type="button"
                    onClick={handleRescan}
                    disabled={isRescanning}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isRescanning ? 'Đang gửi...' : 'Ưu tiên quét ngay'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Case 2: Actively Processing (PROCESSING) */}
          {isProcessing && (
            <div className="py-14 px-6 rounded-3xl bg-indigo-50/60 border border-indigo-200/80 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-100 border border-indigo-300 flex items-center justify-center text-indigo-700 shadow-inner">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h4 className="text-base font-bold text-slate-900">
                  AI Worker đang bóc tách & phân tích CV...
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mô hình AI nội bộ đang đọc file CV ({currentApp.cvName || 'PDF'}), bóc tách kỹ năng, kinh nghiệm và tính toán thang điểm đối chiếu với yêu cầu công việc.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white text-indigo-800 border border-indigo-200 shadow-2xs flex items-center gap-2 animate-pulse">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> Đang tự động nạp kết quả theo thời gian thực...
                </span>
              </div>
            </div>
          )}

          {/* Case 3: Failed */}
          {isFailed && (
            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs text-rose-950">Tác vụ quét CV gặp sự cố</h5>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    {job?.errorDetails || 'Không thể trích xuất văn bản từ tệp CV hoặc mô hình AI nội bộ phản hồi timeout.'}
                  </p>
                </div>
              </div>
              {onRescan && (
                <button
                  type="button"
                  onClick={handleRescan}
                  disabled={isRescanning}
                  className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl text-xs shrink-0 hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isRescanning ? 'Đang gửi...' : 'Thử quét lại ngay'}
                </button>
              )}
            </div>
          )}

          {/* Case 4: No scan job exists yet */}
          {!isCompleted && !isPending && !isProcessing && !isFailed && (
            <div className="py-14 px-6 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shadow-inner">
                <Bot className="w-8 h-8 text-slate-400" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h4 className="text-base font-bold text-slate-900">
                  Hồ sơ chưa được phân tích bằng AI
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Nhấn nút bên dưới để gửi yêu cầu tới AI Worker nội bộ. Toàn bộ quá trình quét chạy trên máy trạm của doanh nghiệp và an toàn tuyệt đối.
                </p>
              </div>
              {onRescan && (
                <button
                  type="button"
                  onClick={handleRescan}
                  disabled={isRescanning}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {isRescanning ? 'Đang gửi...' : 'Kích hoạt quét AI ngay'}
                </button>
              )}
            </div>
          )}

          {/* Case 5: Completed Full Assessment Report */}
          {isCompleted && (
            <>
              {/* Section 1: Score & Top Highlights Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                  {/* Circular Score display */}
                  <div
                    className={`relative w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center shrink-0 shadow-inner ${scoreTheme.bg} ${scoreTheme.border}`}
                  >
                    <span className="text-2xl font-black tracking-tight text-slate-900">
                      {aiScore !== null ? aiScore : '--'}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                      / 100 điểm
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span
                        className={`text-xs font-extrabold px-3 py-1 rounded-full border flex items-center gap-1.5 ${recBadge.bg}`}
                      >
                        {recBadge.icon}
                        {recBadge.label}
                      </span>

                      {job?.experienceYears !== null && job?.experienceYears !== undefined && (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" /> ~{job.experienceYears} năm kinh nghiệm
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">
                      Điểm Đánh Giá Mức Độ Phù Hợp Năng Lực (AI Score)
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                      Điểm số được tính toán tự động thông qua việc đối chiếu trực tiếp các yêu cầu trong tin tuyển dụng với nội dung kinh nghiệm thực tế được thể hiện trong CV của ứng viên.
                    </p>
                  </div>
                </div>

                {/* Skills Matched from CV */}
                {job && (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center shrink-0 shadow-xs w-full sm:w-auto min-w-[150px]">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                      Kỹ Năng Thực Tế (CV)
                    </span>
                    <div className="text-xl font-black text-slate-900 flex items-center justify-center gap-1.5 mt-1">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>{job.matchedSkills?.length || 0}</span>
                      <span className="text-xs font-semibold text-slate-400">
                        / {(job.matchedSkills?.length || 0) + (job.missingSkills?.length || 0)} yêu cầu
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mt-1 border border-emerald-200/60">
                      Trích xuất từ file CV
                    </span>
                  </div>
                )}
              </div>

              {/* Section 2: Skill Matrix */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Đối Chiếu Kỹ Năng Chuyên Môn (Skill Matrix)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Matched skills */}
                  <div className="p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Kỹ năng đáp ứng ({job?.matchedSkills.length || 0})
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        Khớp với yêu cầu
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {job?.matchedSkills && job.matchedSkills.length > 0 ? (
                        job.matchedSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-white text-emerald-800 border border-emerald-200 shadow-2xs flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Chưa tìm thấy kỹ năng khớp rõ ràng</span>
                      )}
                    </div>
                  </div>

                  {/* Missing skills */}
                  <div className="p-4 rounded-2xl border border-rose-200/80 bg-rose-50/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        Kỹ năng còn thiếu ({job?.missingSkills.length || 0})
                      </span>
                      <span className="text-[10px] text-rose-700 font-semibold bg-rose-100/80 px-2 py-0.5 rounded-full">
                        Cần đào tạo / Kiểm tra
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {job?.missingSkills && job.missingSkills.length > 0 ? (
                        job.missingSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-white text-rose-800 border border-rose-200 shadow-2xs flex items-center gap-1"
                          >
                            <AlertCircle className="w-3 h-3 text-rose-500" />
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold">
                          ✔ Ứng viên đáp ứng đầy đủ tất cả kỹ năng yêu cầu!
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Other extracted skills */}
                {job?.extractedSkills && job.extractedSkills.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-bold text-slate-600 mb-2 block flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-slate-500" />
                      Kỹ năng công nghệ & chuyên môn khác tìm thấy trong CV:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {job.extractedSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-medium px-2.5 py-0.5 rounded-lg bg-white text-slate-700 border border-slate-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Strengths & Weaknesses (2-column layout) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border border-emerald-200/80 space-y-2.5">
                  <h5 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    Điểm mạnh nổi bật của ứng viên
                  </h5>
                  <ul className="space-y-1.5">
                    {job?.strengths && job.strengths.length > 0 ? (
                      job.strengths.map((str, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          <span>{str}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-slate-400 italic">Chưa có ghi nhận điểm mạnh cụ thể.</li>
                    )}
                  </ul>
                </div>

                {/* Weaknesses / Interview questions */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/50 to-orange-50/30 border border-amber-200/80 space-y-2.5">
                  <h5 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    Điểm cần lưu ý khi phỏng vấn
                  </h5>
                  <ul className="space-y-1.5">
                    {job?.weaknesses && job.weaknesses.length > 0 ? (
                      job.weaknesses.map((weak, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          <span>{weak}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-slate-400 italic">Không có điểm cảnh báo đáng kể.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Section 4: AI Summary */}
              {job?.summary && (
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-2">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-indigo-600" />
                    Tóm tắt năng lực tổng quan (AI Executive Summary)
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed italic bg-white/80 p-3.5 rounded-xl border border-indigo-100">
                    "{job.summary}"
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Mô hình AI:</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-mono text-[11px]">
              {job?.errorDetails ? 'N/A' : (job as any)?.modelUsed || 'Local AI Engine'}
            </span>
            {job?.completedAt && (
              <>
                <span>•</span>
                <span>Hoàn tất lúc: {formatDateTime(job.completedAt)}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {application.cvFileId && onOpenCv && (
              <button
                onClick={() => onOpenCv(application.cvFileId!)}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Mở Tệp CV Gốc
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
