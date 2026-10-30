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
  const [createdTokenData, setCreatedTokenData] = useState<{
    token: string;
    workerName: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      const res = await aiWorkerApi.createWorker({
        name: newWorkerName.trim(),
        modelName: newModelName.trim() || undefined,
      });

      setCreatedTokenData({
        token: res.token,
        workerName: res.worker.name,
      });
      setShowCreateForm(false);
      setNewWorkerName('');
      setNewModelName('');
      feedback.notify({
        title: 'Khởi tạo AI Worker thành công',
        message: 'Mã token đã được tạo. Hãy sao chép ngay để cấu hình vào Worker.',
        tone: 'success',
      });
      await loadData();
      onSettingsUpdated?.();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsCreating(false);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
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

          {/* Token Generated Alert Banner */}
          {createdTokenData && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-emerald-50 border border-indigo-200 shadow-xs space-y-3 animate-in slide-in-from-top-3 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Mã Token Kết Nối Worker ({createdTokenData.workerName})
                </div>
                <button
                  onClick={() => setCreatedTokenData(null)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Đóng
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                <strong className="text-rose-600">Lưu ý quan trọng:</strong> Vì lý do bảo mật, mã bí mật này <strong>chỉ hiển thị duy nhất 1 lần</strong>. Vui lòng sao chép và dán vào file <code>.env</code> của Worker trên máy trạm của bạn.
              </p>

              <div className="flex items-center gap-2 bg-slate-900 rounded-xl p-3 text-emerald-400 font-mono text-xs select-all break-all shadow-inner">
                <span className="flex-1 overflow-x-auto">{createdTokenData.token}</span>
                <button
                  onClick={handleCopyToken}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Đã sao chép
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Sao chép
                    </>
                  )}
                </button>
              </div>

              <div className="pt-1 text-[11px] text-slate-500 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                Cấu hình: <code>WORKER_TOKEN={createdTokenData.token.slice(0, 16)}...</code> trong thư mục <code>ai-worker-client</code>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
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

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tên mô hình AI (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: qwen2.5:7b hoặc llama3.2:3b"
                      value={newModelName}
                      onChange={(e) => setNewModelName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                    />
                  </div>
                </div>

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
  );
};
