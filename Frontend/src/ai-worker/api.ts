import { api } from '../auth/api';
import type { ApiSuccess } from '../auth/auth.types';
import type {
  CompanyWorkerDashboardData,
  CreateWorkerResponse,
} from './types';

export const aiWorkerApi = {
  // Lấy danh sách worker, thống kê jobs và cờ autoAiScanEnabled
  getCompanyWorkers: async () =>
    (await api.get<ApiSuccess<CompanyWorkerDashboardData>>('/ai-worker/workers'))
      .data.data,

  // Tạo worker mới (trả về raw token chỉ 1 lần duy nhất)
  createWorker: async (input: { name: string; modelName?: string }) =>
    (
      await api.post<ApiSuccess<CreateWorkerResponse>>(
        '/ai-worker/workers',
        input,
      )
    ).data.data,

  // Xóa / thu hồi worker
  deleteWorker: async (workerId: string) =>
    (
      await api.delete<ApiSuccess<{ deleted: boolean; workerId: string }>>(
        `/ai-worker/workers/${workerId}`,
      )
    ).data.data,

  // Bật/tắt quét CV tự động
  updateSettings: async (input: { autoAiScanEnabled: boolean }) =>
    (
      await api.patch<ApiSuccess<{ autoAiScanEnabled: boolean }>>(
        '/ai-worker/settings',
        input,
      )
    ).data.data,

  // Yêu cầu quét lại CV cho một hồ sơ cụ thể
  rescanApplication: async (applicationId: string) =>
    (
      await api.post<
        ApiSuccess<{
          success: boolean;
          jobId: string;
          applicationId: string;
          status: string;
        }>
      >(`/ai-worker/applications/${applicationId}/rescan`)
    ).data.data,

  // Tải gói cài đặt AI Worker Client (.zip) kèm cấu hình (.env)
  downloadClientPackage: async (params?: {
    token?: string;
    workerName?: string;
    modelName?: string;
    engine?: 'OLLAMA' | 'MOCK' | 'UNIVERSAL';
    aiBaseUrl?: string;
    aiApiKey?: string;
  }) => {
    const response = await api.get('/ai-worker/download-client', {
      params,
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/zip' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (params?.workerName || 'CareerBridge-AI-Worker')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute(
      'download',
      params?.token ? `CareerBridge-Worker-${safeName}.zip` : 'CareerBridge-AI-Worker.zip',
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
