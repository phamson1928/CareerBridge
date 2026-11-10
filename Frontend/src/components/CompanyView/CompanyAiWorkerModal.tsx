import { ModalPortal } from "../ModalPortal";
import React, { useEffect, useState } from 'react';
import {
  Bot,
  Cpu,
  Sparkles,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Power,
  X,
  Plus,
  Server,
  ShieldCheck,
  Terminal,
  Zap,
  Globe,
  Download,
} from 'lucide-react';
import { aiWorkerApi } from '../../ai-worker/api';
import type { CompanyWorkerDashboardData, CompanyWorkerItem } from '../../ai-worker/types';
import { getApiErrorMessage } from '../../auth/api';
import { useAppFeedback } from '../Feedback/AppFeedbackProvider';
import { formatDateTime } from '../../utils/format';

interface CompanyAiWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated?: () => void;
}

export const CompanyAiWorkerModal: React.FC<CompanyAiWorkerModalProps> = ({
  isOpen,
  onClose,
  onSettingsUpdated,
}) => {
  const feedback = useAppFeedback();

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<CompanyWorkerDashboardData | null>(null);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New worker creation state
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [selectedEngine, setSelectedEngine] = useState<'OLLAMA' | 'UNIVERSAL' | 'MOCK'>('OLLAMA');
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState('http://localhost:11434');
  const [universalBaseUrl, setUniversalBaseUrl] = useState('http://localhost:8000/v1');
  const [universalApiKey, setUniversalApiKey] = useState('');
  const [createdTokenData, setCreatedTokenData] = useState<{
    token: string;
    workerName: string;
    engine: 'OLLAMA' | 'UNIVERSAL' | 'MOCK';
    aiBaseUrl: string;
    modelName: string;
    aiApiKey?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadWorkerZip = async (token?: string, workerName?: string) => {
    setIsDownloading(true);
    try {
      await aiWorkerApi.downloadClientPackage({
        token,
        workerName,
        modelName: createdTokenData?.modelName,
        engine: createdTokenData?.engine,
        aiBaseUrl: createdTokenData?.aiBaseUrl,
        aiApiKey: createdTokenData?.aiApiKey,
      });
      feedback.notify({
        title: 'Bắt đầu tải gói AI Worker',
        message: 'File .zip đang được tải về máy của bạn. Hãy giải nén và nhấp đúp file start.bat để khởi chạy.',
        tone: 'success',
      });
    } catch (err) {
      feedback.notify({
        title: 'Không thể tải gói AI Worker',
        message: getApiErrorMessage(err),
        tone: 'error',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await aiWorkerApi.getCompanyWorkers();
      setData(res);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setCreatedTokenData(null);
      setShowCreateForm(false);
    }
  }, [isOpen]);

  const handleToggleAutoScan = async () => {
    if (!data || isUpdatingSettings) return;
    const nextState = !data.autoAiScanEnabled;
    setIsUpdatingSettings(true);
    try {
      await aiWorkerApi.updateSettings({ autoAiScanEnabled: nextState });
      setData((prev) => (prev ? { ...prev, autoAiScanEnabled: nextState } : null));
      feedback.notify({
        title: nextState
          ? 'Đã bật tự động quét CV bằng AI'
          : 'Đã tạm dừng tự động quét CV',
        message: nextState
          ? 'Các hồ sơ nộp mới sẽ tự động được gửi tới AI Worker nội bộ để phân tích.'
          : 'Hệ thống sẽ không tự động tạo tác vụ quét cho ứng viên mới.',
        tone: nextState ? 'success' : 'info',
      });
      onSettingsUpdated?.();
    } catch (err) {
      feedback.notify({
        title: 'Không thể cập nhật cài đặt',
        message: getApiErrorMessage(err),
        tone: 'error',
      });
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerName.trim() || isCreating) return;

    setIsCreating(true);
    setError(null);
    try {
      let modelIdentifier = 'mock-heuristic-v1';
      let targetBaseUrl = '';
      let targetApiKey = '';

      if (selectedEngine === 'OLLAMA') {
        modelIdentifier = newModelName.trim() || 'qwen2.5:7b';
        targetBaseUrl = ollamaBaseUrl.trim() || 'http://localhost:11434';
      } else if (selectedEngine === 'UNIVERSAL') {
        modelIdentifier = newModelName.trim() || 'mistralai/Mistral-7B-Instruct-v0.3';
        targetBaseUrl = universalBaseUrl.trim() || 'http://localhost:8000/v1';
        targetApiKey = universalApiKey.trim();
      }

      const res = await aiWorkerApi.createWorker({
        name: newWorkerName.trim(),
        modelName: modelIdentifier,
      });

      setCreatedTokenData({
        token: res.token,
        workerName: res.worker.name,
        engine: selectedEngine,
        aiBaseUrl: targetBaseUrl,
        modelName: modelIdentifier,
        aiApiKey: targetApiKey,
      });
      setShowCreateForm(false);
      setNewWorkerName('');
      setNewModelName('');
      feedback.notify({
        title: 'Khởi tạo AI Worker thành công',
        message: 'Mã token và gói cài đặt đã sẵn sàng. Bạn có thể tải ngay file ZIP hoặc sao chép token.',
        tone: 'success',
      });
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyEnvConfig = () => {
    if (!createdTokenData) return;
    let envContent = '';
    if (createdTokenData.engine === 'UNIVERSAL') {
      envContent = `# Cấu hình CareerBridge AI Worker (Universal AI Server - vLLM / LocalAI / llama.cpp / LAN)
BACKEND_URL=http://localhost:3000
WORKER_TOKEN=${createdTokenData.token}
WORKER_NAME=${createdTokenData.workerName}
AI_PROVIDER=openai-compatible
AI_BASE_URL=${createdTokenData.aiBaseUrl}
AI_MODEL=${createdTokenData.modelName}
${createdTokenData.aiApiKey ? `AI_API_KEY=${createdTokenData.aiApiKey}\n` : ''}POLL_INTERVAL_SEC=5
HEARTBEAT_INTERVAL_SEC=25`;
    } else if (createdTokenData.engine === 'OLLAMA') {
      envContent = `# Cấu hình CareerBridge AI Worker (Ollama Local)
BACKEND_URL=http://localhost:3000
WORKER_TOKEN=${createdTokenData.token}
WORKER_NAME=${createdTokenData.workerName}
AI_PROVIDER=ollama
AI_BASE_URL=${createdTokenData.aiBaseUrl}
AI_MODEL=${createdTokenData.modelName}
POLL_INTERVAL_SEC=5
HEARTBEAT_INTERVAL_SEC=25`;
    } else {
      envContent = `# Cấu hình CareerBridge AI Worker (Chế độ Bộ lọc Kỹ năng Tự động Heuristic - 0 GPU)
BACKEND_URL=http://localhost:3000
WORKER_TOKEN=${createdTokenData.token}
WORKER_NAME=${createdTokenData.workerName}
AI_PROVIDER=mock
POLL_INTERVAL_SEC=5
HEARTBEAT_INTERVAL_SEC=25`;
    }

    navigator.clipboard.writeText(envContent);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const handleDeleteWorker = async (worker: CompanyWorkerItem) => {
    const confirmed = await feedback.confirm({
      title: 'Thu hồi & Xóa AI Worker',
      message: `Bạn có chắc muốn xóa worker "${worker.name}"? Mã token hiện tại sẽ bị vô hiệu hóa ngay lập tức và worker này sẽ ngắt kết nối.`,
      confirmLabel: 'Xác nhận xóa',
      tone: 'danger',
    });
    if (!confirmed) return;

    setDeletingId(worker.id);
    try {
      await aiWorkerApi.deleteWorker(worker.id);
      feedback.notify({
        title: 'Đã xóa AI Worker',
        tone: 'info',
      });
      await loadData();
      onSettingsUpdated?.();
    } catch (err) {
      feedback.notify({
        title: 'Không thể xóa worker',
        message: getApiErrorMessage(err),
        tone: 'error',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyToken = () => {
    if (!createdTokenData) return;
    navigator.clipboard.writeText(createdTokenData.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    feedback.notify({
      title: 'Đã sao chép token vào clipboard',
      tone: 'success',
    });
  };

  if (!isOpen) return null;

  const onlineWorkersCount = data?.workers.filter((w) => w.isOnline).length || 0;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-950/30">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Quản Lý AI Worker & Quét CV Nội Bộ
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                  On-Premise Privacy
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Kết nối các máy trạm AI nội bộ (Ollama) để phân tích CV tự động mà không lo rò rỉ dữ liệu.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Token Generated Dedicated Modal Overlay */}
          {createdTokenData && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl shadow-2xl border-2 border-indigo-300 w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800">
                {/* Sticky Header - Always visible with Close Button */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                  <div className="flex items-center gap-2.5 text-indigo-900 font-bold text-base">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Mã Token Của Bạn Đã Sẵn Sàng!</h4>
                      <p className="text-xs text-slate-500 font-normal">Worker: <strong>{createdTokenData.workerName}</strong></p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCreatedTokenData(null)}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
                    title="Đóng cửa sổ"
                  >
                    ✕
                  </button>
                </div>

                {/* Scrollable Body Content */}
                <div className="p-6 overflow-y-auto space-y-4 flex-1">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Cài đặt tự động:</strong> Bạn chỉ cần nhấn nút <strong>"Tải Gói Cài Đặt AI Worker (.ZIP)"</strong> bên dưới. Mã token và chế độ AI bạn vừa chọn ({createdTokenData.engine === 'OLLAMA' ? 'Ollama Local' : createdTokenData.engine === 'UNIVERSAL' ? 'Universal AI Server' : 'Bộ lọc Mock'}) đã được tích hợp sẵn 100%!
                    </span>
                  </div>

                  {/* Token Box */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">MÃ TOKEN KẾT NỐI (WORKER_TOKEN)</label>
                    <div className="flex items-center gap-2 bg-slate-900 rounded-2xl p-3.5 text-emerald-400 font-mono text-xs select-all break-all shadow-inner">
                      <span className="flex-1 overflow-x-auto">{createdTokenData.token}</span>
                      <button
                        type="button"
                        onClick={handleCopyToken}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                          copied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md font-extrabold'
                        }`}
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Đã chép
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Sao chép Token
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 1-Click Download Pre-configured Worker ZIP */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 space-y-2.5">
                    <div>
                      <h5 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        Tải Gói AI Worker Chạy Ngay (.ZIP) - Khuyên Dùng
                      </h5>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Gói ZIP đã được <strong>cấu hình sẵn Token & Backend URL</strong>. Doanh nghiệp chỉ cần tải về, giải nén và nhấp đúp file <code>start.bat</code> là worker tự kết nối ngay!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadWorkerZip(createdTokenData.token, createdTokenData.workerName)}
                      disabled={isDownloading}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
                    >
                      <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
                      {isDownloading ? 'Đang đóng gói file ZIP...' : 'Tải Gói Cài Đặt AI Worker (.ZIP) (Đã Kèm Token)'}
                    </button>
                  </div>

                  {/* Operational Guide Tip */}
                  <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-blue-950">
                      <Terminal className="w-3.5 h-3.5 text-blue-600" />
                      <span>3 bước vận hành cực kỳ đơn giản:</span>
                    </div>
                    <ol className="text-[11px] text-blue-800 list-decimal list-inside space-y-0.5 leading-relaxed">
                      <li>Tải và giải nén file <strong>.ZIP</strong> trên máy tính doanh nghiệp.</li>
                      <li>Nhấp đúp file <strong>start.bat</strong> (hoặc chạy <code>./start.sh</code> trên Mac/Linux).</li>
                      <li>Worker sẽ tự cài thư viện, tự kết nối và quét CV tự động trong nền (Xem tiến độ & điểm số trực tiếp trên web CareerBridge)!</li>
                    </ol>
                  </div>
                </div>

                {/* Sticky Footer - Always visible at bottom */}
                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyEnvConfig}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    Sao chép .env
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreatedTokenData(null)}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
                  >
                    Tôi đã sao chép xong &bull; Đóng
                  </button>
                </div>
              </div>
            </div>
          )}



          {/* Toggle Setting & Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Auto Scan Toggle Card */}
            <div className="md:col-span-4 p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    data?.autoAiScanEnabled
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <Power className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    Tự động quét CV khi có đơn mới
                    {data?.autoAiScanEnabled && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        Đang kích hoạt
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hệ thống sẽ tự động thêm hồ sơ sinh viên vào hàng đợi quét ngay khi sinh viên nộp đơn.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleAutoScan}
                disabled={isUpdatingSettings || isLoading}
                className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${
                  data?.autoAiScanEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    data?.autoAiScanEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Quick Stats */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500">Worker kết nối</p>
                <p className="text-base font-extrabold text-slate-900">
                  {onlineWorkersCount} <span className="text-xs font-normal text-slate-500">/ {data?.workers.length || 0} online</span>
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-amber-800">Đang chờ quét</p>
                <p className="text-base font-extrabold text-amber-900">
                  {data?.stats.pendingJobs || 0}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-emerald-800">Đã hoàn thành</p>
                <p className="text-base font-extrabold text-emerald-900">
                  {data?.stats.completedJobs || 0}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-rose-800">Lỗi / Hết hạn</p>
                <p className="text-base font-extrabold text-rose-900">
                  {data?.stats.failedJobs || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Worker Management List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Danh Sách AI Worker ({data?.workers.length || 0}/5)
                </h4>
                <p className="text-xs text-slate-500">
                  Mỗi doanh nghiệp có thể kết nối tối đa 5 Worker chạy song song để tăng tốc độ quét CV.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadWorkerZip()}
                  disabled={isDownloading}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Tải bộ mã nguồn Worker Client (.ZIP) để cài đặt trên máy trạm nội bộ"
                >
                  <Download className={`w-3.5 h-3.5 text-indigo-600 ${isDownloading ? 'animate-bounce' : ''}`} />
                  Tải Gói AI Worker (.ZIP)
                </button>

                {!showCreateForm && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    disabled={(data?.workers.length || 0) >= 5}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> Kết Nối Worker Mới
                  </button>
                )}
              </div>
            </div>

            {/* Inline Create Form */}
            {showCreateForm && (
              <form
                onSubmit={handleCreateWorker}
                className="p-4 rounded-2xl bg-slate-50 border border-indigo-200 space-y-3 animate-in fade-in duration-200"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-indigo-600" /> Cấu hình Worker Mới
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Hủy
                  </button>
                </div>

                {/* Radio Button Engine Selection - 3 Clean Options */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    Chọn chế độ hoạt động của AI Worker <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <label
                      className={`relative flex flex-col justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedEngine === 'OLLAMA'
                          ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600/30'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                            Ollama Local
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                            Cá nhân
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Chạy qua Ollama trên máy tính cá nhân. Tối ưu cho Qwen 2.5 hoặc Llama 3.2.
                        </p>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="engineType"
                          value="OLLAMA"
                          checked={selectedEngine === 'OLLAMA'}
                          onChange={() => setSelectedEngine('OLLAMA')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-[10px] text-slate-600 font-medium">Chọn Ollama</span>
                      </div>
                    </label>

                    <label
                      className={`relative flex flex-col justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedEngine === 'UNIVERSAL'
                          ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600/30'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Server className="w-3.5 h-3.5 text-purple-600" />
                            Universal Server
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                            vLLM / LAN
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Chuẩn OpenAI API cho máy chủ AI chuyên dụng, cụm GPU hoặc mạng LAN nội bộ.
                        </p>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="engineType"
                          value="UNIVERSAL"
                          checked={selectedEngine === 'UNIVERSAL'}
                          onChange={() => setSelectedEngine('UNIVERSAL')}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-[10px] text-slate-600 font-medium">Chọn Universal LAN</span>
                      </div>
                    </label>

                    <label
                      className={`relative flex flex-col justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedEngine === 'MOCK'
                          ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600/30'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            Mock Heuristic
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            0 GPU • Nhanh
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Bóc tách từ khóa kỹ năng tích hợp sẵn. Không cần card đồ họa GPU, chạy ngay!
                        </p>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="engineType"
                          value="MOCK"
                          checked={selectedEngine === 'MOCK'}
                          onChange={() => setSelectedEngine('MOCK')}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-[10px] text-slate-600 font-medium">Chọn Heuristic</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Form fields based on selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={selectedEngine === 'MOCK' ? 'sm:col-span-2' : ''}>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tên định danh Worker <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: AI-Server-Office-01"
                      value={newWorkerName}
                      onChange={(e) => setNewWorkerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                    />
                  </div>

                  {selectedEngine === 'OLLAMA' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Tên mô hình AI</span>
                        <span className="text-[10px] text-slate-400 font-normal">Mặc định: qwen2.5:7b</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: qwen2.5:7b hoặc llama3.2:3b"
                        value={newModelName}
                        onChange={(e) => setNewModelName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                      />
                    </div>
                  )}

                  {selectedEngine === 'UNIVERSAL' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Tên mô hình AI</span>
                        <span className="text-[10px] text-slate-400 font-normal">Mặc định: mistralai/...</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: mistralai/Mistral-7B-Instruct-v0.3 hoặc qwen2.5:7b"
                        value={newModelName}
                        onChange={(e) => setNewModelName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                      />
                    </div>
                  )}
                </div>

                {/* Engine URL inputs */}
                {selectedEngine === 'OLLAMA' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-indigo-500" />
                        Địa chỉ URL Ollama & Cổng
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Mặc định: http://localhost:11434</span>
                    </label>
                    <input
                      type="text"
                      placeholder="http://localhost:11434"
                      value={ollamaBaseUrl}
                      onChange={(e) => setOllamaBaseUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white font-mono"
                    />
                  </div>
                )}

                {selectedEngine === 'UNIVERSAL' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-purple-500" />
                          Địa chỉ URL Máy Chủ AI (Base URL)
                        </span>
                      </label>
                      <input
                        type="text"
                        placeholder="http://localhost:8000/v1 hoặc IP mạng LAN http://192.168.1.50:8000/v1"
                        value={universalBaseUrl}
                        onChange={(e) => setUniversalBaseUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white font-mono"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Hỗ trợ vLLM (8000/v1), LocalAI/llama.cpp (8080/v1)...</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>API Key Nội Bộ (Tùy chọn)</span>
                        <span className="text-[10px] text-slate-400 font-normal">Để trống nếu không có</span>
                      </label>
                      <input
                        type="password"
                        placeholder="Bearer token nội bộ..."
                        value={universalApiKey}
                        onChange={(e) => setUniversalApiKey(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white font-mono"
                      />
                    </div>
                  </div>
                )}

                {selectedEngine === 'MOCK' && (
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Chế độ Mock Heuristic tự động phân tích không cần cài đặt thêm server ngoài. Gói ZIP sẽ được cấu hình sẵn để chạy ngay lập tức!</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !newWorkerName.trim()}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {isCreating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang tạo...
                      </>
                    ) : (
                      'Tạo Worker & Lấy Token'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Workers Table / List */}
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="text-xs">Đang tải danh sách Worker...</span>
              </div>
            ) : !data || data.workers.length === 0 ? (
              <div className="py-10 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 space-y-2">
                <Bot className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
                <p className="text-xs font-bold text-slate-700">Chưa có AI Worker nào được kết nối</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Hãy nhấn <strong>"Kết Nối Worker Mới"</strong> để nhận mã Token bí mật và khởi chạy worker trên máy chủ doanh nghiệp.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {data.workers.map((worker) => (
                  <div
                    key={worker.id}
                    className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Online/Offline status indicator */}
                      <div className="relative flex items-center justify-center">
                        <div
                          className={`w-3.5 h-3.5 rounded-full ${
                            worker.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                        {worker.isOnline && (
                          <span className="absolute w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-900 text-xs truncate">
                            {worker.name}
                          </h5>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              worker.isOnline
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {worker.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>Model: <strong className="text-slate-700">{worker.modelName || 'Mặc định'}</strong></span>
                          <span>•</span>
                          <span>Lần cuối ping: {worker.lastSeenAt ? formatDateTime(worker.lastSeenAt) : 'Chưa có'}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteWorker(worker)}
                      disabled={deletingId === worker.id}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50"
                      title="Thu hồi token & xóa worker"
                    >
                      {deletingId === worker.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-rose-500" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-slate-400" />
            <span>Worker chạy trên mã nguồn mở độc lập (TypeScript / Docker)</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
      </ModalPortal>
  );
};
