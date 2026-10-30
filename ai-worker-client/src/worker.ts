import axios from 'axios';
import { BackendApiClient } from './api/client';
import { AvailableJob } from './api/types';
import { SupportedAiProvider, WorkerConfig } from './config';
import { CvDownloader } from './pdf/downloader';
import { CvParser } from './pdf/parser';
import { AiProvider } from './providers/base.provider';
import { ProviderFactory } from './providers/provider.factory';
import { Logger } from './utils/logger';

export type WorkerDaemonState = 'RUNNING' | 'PAUSED' | 'CONFIG_PENDING' | 'STOPPED';

export interface ScannedJobRecord {
  jobId: string;
  internshipTitle: string;
  cvFileName: string;
  status: 'SUCCESS' | 'FAILED';
  aiScore?: number;
  recommendation?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  strengths?: string[];
  weaknesses?: string[];
  summary?: string;
  errorMessage?: string;
  durationSec: number;
  timestamp: string;
}

export interface WorkerStats {
  totalProcessed: number;
  successful: number;
  failed: number;
  avgDurationSec: number;
}

export class AiWorkerDaemon {
  private client: BackendApiClient | null = null;
  private provider: AiProvider | null = null;
  private state: WorkerDaemonState = 'STOPPED';
  private isPaused = false;
  private isStopping = false;
  private isProcessingJob = false;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private consecutiveErrors = 0;
  private startedAt = 0;

  private recentJobs: ScannedJobRecord[] = [];
  private stats: WorkerStats = {
    totalProcessed: 0,
    successful: 0,
    failed: 0,
    avgDurationSec: 0,
  };
  private totalProcessingTimeSec = 0;

  constructor(private config: WorkerConfig) {
    if (this.config.isConfigured) {
      this.client = new BackendApiClient(config);
      this.provider = ProviderFactory.create(config);
    }
  }

  async start(): Promise<void> {
    this.startedAt = Date.now();
    this.isStopping = false;

    if (!this.config.isConfigured) {
      this.state = 'CONFIG_PENDING';
      Logger.banner(
        'CAREERBRIDGE AI WORKER (CHỜ CẤU HÌNH)',
        `Vui lòng truy cập Giao diện Web: http://localhost:${this.config.webPort} để thiết lập Worker Token`
      );
      Logger.warn(`Chưa có WORKER_TOKEN hợp lệ. Đang chờ cấu hình từ Dashboard http://localhost:${this.config.webPort}...`);
      
      // Chờ cho đến khi được cập nhật cấu hình qua Web UI
      while (!this.isStopping && this.state === 'CONFIG_PENDING') {
        await this.sleep(1000);
      }

      if (this.isStopping) return;
    }

    this.state = 'RUNNING';
    const providerName = this.provider ? this.provider.name : 'Unknown';
    const modelName = this.provider ? this.provider.modelName : 'Unknown';

    Logger.banner(
      'CAREERBRIDGE AI WORKER DAEMON',
      `Phiên bản: 1.0.0 | Doanh nghiệp: ${this.config.workerName} | Chế độ: ${providerName}`
    );

    Logger.info(`Kết nối Backend: ${this.config.backendUrl}`);
    Logger.info(`Mô hình AI: ${modelName}`);
    Logger.info(`Chu kỳ Polling: ${this.config.pollIntervalMs / 1000}s | Heartbeat: ${this.config.heartbeatIntervalMs / 1000}s`);
    Logger.info(`Giao diện Web Quản trị: http://localhost:${this.config.webPort}`);

    // 1. Gửi Heartbeat đầu tiên để báo Online ngay khi khởi động
    await this.sendInitialHeartbeat();

    // 2. Kích hoạt vòng lặp Heartbeat định kỳ
    this.startHeartbeatLoop();

    // 3. Khởi động vòng lặp lắng nghe công việc (Polling)
    await this.pollLoop();
  }

  async stop(): Promise<void> {
    if (this.isStopping) return;
    this.isStopping = true;
    this.state = 'STOPPED';

    Logger.warn('Đang nhận tín hiệu dừng tiến trình...');

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Nếu đang xử lý dở job thì đợi một lát để gửi nốt kết quả
    if (this.isProcessingJob) {
      Logger.info('Đang đợi hoàn tất tác vụ quét CV hiện tại trước khi tắt...');
      let waitCount = 0;
      while (this.isProcessingJob && waitCount < 30) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        waitCount++;
      }
    }

    Logger.success('AI Worker đã dừng an toàn (Graceful Shutdown).');
  }

  pause(): void {
    this.isPaused = true;
    this.state = 'PAUSED';
    Logger.warn('AI Worker đã tạm dừng nhận việc mới từ hàng đợi.');
  }

  resume(): void {
    if (!this.config.isConfigured) {
      Logger.warn('Chưa cấu hình Worker Token! Không thể tiếp tục quét.');
      return;
    }
    this.isPaused = false;
    this.state = 'RUNNING';
    Logger.success('AI Worker đã tiếp tục lắng nghe công việc từ hàng đợi.');
  }

  async updateConfig(newConfig: WorkerConfig): Promise<void> {
    const wasPending = this.state === 'CONFIG_PENDING';
    this.config = newConfig;
    this.client = new BackendApiClient(newConfig);
    this.provider = ProviderFactory.create(newConfig);

    Logger.info(`Cấu hình Worker đã được cập nhật thành công từ Web UI:`);
    Logger.info(`- Backend: ${this.config.backendUrl}`);
    Logger.info(`- Chế độ AI: ${this.provider.name} (${this.provider.modelName})`);

    // Reset lại Heartbeat Timer với chu kỳ mới
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.startHeartbeatLoop();

    if (wasPending && newConfig.isConfigured) {
      this.state = 'RUNNING';
      await this.sendInitialHeartbeat();
    } else if (this.state === 'RUNNING') {
      await this.sendInitialHeartbeat();
    }
  }

  getStatus() {
    const uptimeSec = this.startedAt ? Math.floor((Date.now() - this.startedAt) / 1000) : 0;
    return {
      state: this.state,
      isPaused: this.isPaused,
      isConfigured: this.config.isConfigured,
      uptimeSec,
      config: {
        backendUrl: this.config.backendUrl,
        workerTokenMasked: this.config.workerToken
          ? `${this.config.workerToken.slice(0, 6)}...${this.config.workerToken.slice(-4)}`
          : '',
        workerName: this.config.workerName,
        provider: this.config.provider,
        aiBaseUrl: this.config.aiBaseUrl,
        aiModel: this.config.aiModel,
        hasApiKey: Boolean(this.config.aiApiKey),
        pollIntervalSec: this.config.pollIntervalMs / 1000,
        heartbeatIntervalSec: this.config.heartbeatIntervalMs / 1000,
        webPort: this.config.webPort,
      },
      stats: this.stats,
      recentJobs: this.recentJobs.slice(-30),
    };
  }

  static async testAiConnection(params: {
    provider: SupportedAiProvider;
    aiBaseUrl: string;
    aiModel: string;
    aiApiKey?: string;
  }): Promise<{ success: boolean; latencyMs: number; message: string; details?: any }> {
    const start = Date.now();
    try {
      if (params.provider === 'mock') {
        return {
          success: true,
          latencyMs: 1,
          message: 'Mock Heuristic Engine sẵn sàng hoạt động ngay (Không cần cài đặt AI Server)',
        };
      }

      if (params.provider === 'ollama') {
        const baseUrl = params.aiBaseUrl.replace(/\/+$/, '');
        // Kiểm tra ping tags hoặc version
        const res = await axios.get(`${baseUrl}/api/tags`, { timeout: 4000 });
        const latencyMs = Date.now() - start;
        const models = res.data?.models?.map((m: any) => m.name) || [];
        const hasModel = models.some((m: string) => m.toLowerCase().includes(params.aiModel.toLowerCase()));
        return {
          success: true,
          latencyMs,
          message: hasModel
            ? `Kết nối Ollama thành công! Đã tìm thấy model "${params.aiModel}".`
            : `Kết nối Ollama thành công (${models.length} model có sẵn). Khuyến nghị tải model "${params.aiModel}".`,
          details: { availableModels: models },
        };
      }

      if (params.provider === 'openai-compatible') {
        const baseUrl = params.aiBaseUrl.replace(/\/+$/, '');
        const endpoint = baseUrl.endsWith('/v1') ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (params.aiApiKey) {
          headers['Authorization'] = `Bearer ${params.aiApiKey}`;
        }

        // Gửi 1 tin nhắn test nhỏ
        const res = await axios.post(
          endpoint,
          {
            model: params.aiModel,
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 5,
            temperature: 0.1,
          },
          { headers, timeout: 6000 }
        );
        const latencyMs = Date.now() - start;
        return {
          success: true,
          latencyMs,
          message: `Kết nối máy chủ AI thành công qua chuẩn OpenAI (${res.data?.model || params.aiModel})!`,
        };
      }

      return { success: false, latencyMs: 0, message: 'Provider không được hỗ trợ' };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Lỗi không xác định';
      return {
        success: false,
        latencyMs,
        message: `Không thể kết nối đến máy chủ AI: ${msg}`,
      };
    }
  }

  static async testBackendConnection(
    backendUrl: string,
    workerToken: string
  ): Promise<{ success: boolean; latencyMs: number; message: string; data?: any }> {
    const start = Date.now();
    try {
      const cleanUrl = backendUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
      const res = await axios.post(
        `${cleanUrl}/api/v1/ai-worker/heartbeat`,
        { modelName: 'ping-test' },
        {
          headers: {
            Authorization: `Bearer ${workerToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );
      const latencyMs = Date.now() - start;
      return {
        success: true,
        latencyMs,
        message: `Xác thực thành công với CareerBridge Backend! Trạng thái: ${res.data?.status || 'ONLINE'}`,
        data: res.data,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message || 'Lỗi kết nối';
      if (status === 401) {
        return {
          success: false,
          latencyMs,
          message: 'Mã WORKER_TOKEN không hợp lệ hoặc đã bị thu hồi trên CareerBridge!',
        };
      }
      return {
        success: false,
        latencyMs,
        message: `Lỗi kết nối tới Backend: ${msg}`,
      };
    }
  }

  private async sendInitialHeartbeat(): Promise<void> {
    if (!this.client || !this.provider) return;
    try {
      await this.client.sendHeartbeat({ modelName: this.provider.modelName });
      Logger.success('Gửi tín hiệu Heartbeat ban đầu thành công. Trạng thái: ONLINE');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi không xác định';
      Logger.error(`Không thể gửi Heartbeat ban đầu đến Backend: ${msg}`);
      if (err.response?.status === 401) {
        Logger.error('LƯU Ý: Mã WORKER_TOKEN không hợp lệ hoặc đã bị thu hồi!');
      }
    }
  }

  private startHeartbeatLoop(): void {
    if (!this.client || !this.provider) return;
    this.heartbeatTimer = setInterval(async () => {
      if (this.isStopping || !this.client || !this.provider) return;
      try {
        await this.client.sendHeartbeat({ modelName: this.provider.modelName });
      } catch (err: any) {
        Logger.warn(`Gửi heartbeat thất bại: ${err.message}`);
      }
    }, this.config.heartbeatIntervalMs);
  }

  private async pollLoop(): Promise<void> {
    Logger.info('Bắt đầu lắng nghe tác vụ quét CV từ hàng đợi...');

    while (!this.isStopping) {
      // Nếu đang tạm dừng hoặc chưa cấu hình xong, ngủ 1s rồi lặp lại
      if (this.isPaused || !this.client || !this.provider) {
        await this.sleep(1000);
        continue;
      }

      try {
        const response = await this.client.pollJob();
        this.consecutiveErrors = 0; // Reset lỗi khi kết nối thành công

        if (response.hasJob) {
          this.isProcessingJob = true;
          await this.processJob(response.job);
          this.isProcessingJob = false;
          // Có job vừa xong -> kiểm tra tiếp ngay không cần chờ lâu
          continue;
        }

        // Không có job -> nghỉ theo chu kỳ định sẵn
        await this.sleep(this.config.pollIntervalMs);
      } catch (err: any) {
        this.consecutiveErrors++;
        const status = err.response?.status;
        const msg = err.response?.data?.message || err.message || 'Lỗi kết nối';

        if (status === 401) {
          Logger.error(`Xác thực thất bại (401): ${msg}. Vui lòng kiểm tra lại WORKER_TOKEN trong Web UI hoặc .env!`);
        } else if (status === 403) {
          Logger.error(`Từ chối truy cập (403): ${msg}. Doanh nghiệp có thể chưa được duyệt hoặc bị khóa!`);
        } else {
          Logger.warn(`Không thể lấy việc từ Backend (${msg}). Thử lại lần thứ ${this.consecutiveErrors}...`);
        }

        // Tự động tăng thời gian chờ (Exponential Backoff từ pollIntervalMs -> tối đa 60s)
        const backoffMs = Math.min(
          60000,
          this.config.pollIntervalMs * Math.pow(1.5, Math.min(this.consecutiveErrors, 5))
        );
        await this.sleep(backoffMs);
      }
    }
  }

  private async processJob(job: AvailableJob): Promise<void> {
    if (!this.client || !this.provider) return;
    const startTime = Date.now();
    Logger.job(
      `[Job #${job.jobId.slice(-6)}] Bắt đầu quét CV cho vị trí: "${job.internship.title}" (Lần thử: ${job.attempts})`
    );

    let tempFilePath: string | null = null;
    try {
      // 1. Tải CV từ Signed URL vào file tạm
      Logger.info(`Đang tải tệp CV (${job.cvFileName || 'CV'})...`);
      tempFilePath = await CvDownloader.downloadToTemp(job.cvDownloadUrl, job.jobId);

      // 2. Trích xuất văn bản từ PDF và dọn dẹp file ngay lập tức
      Logger.info('Đang bóc tách văn bản từ tệp PDF và tự động dọn dẹp file tạm...');
      const cvText = await CvParser.extractTextAndCleanup(tempFilePath);
      tempFilePath = null; // Đã được xóa an toàn trong khối finally của parser

      if (!cvText || cvText.length < 50) {
        throw new Error('Nội dung CV quá ngắn hoặc tệp PDF không chứa văn bản có thể đọc được');
      }

      // 3. Phân tích nội dung CV bằng AI Provider
      Logger.info(`Đang chuyển dữ liệu tới AI Provider (${this.provider.name})...`);
      const analysis = await this.provider.analyze(cvText, job.internship);

      // 4. Báo cáo kết quả thành công về Backend
      Logger.info('Đang đồng bộ kết quả đánh giá về hệ thống CareerBridge...');
      await this.client.completeJob(job.jobId, {
        aiScore: analysis.aiScore,
        recommendation: analysis.recommendation,
        experienceYears: analysis.experienceYears,
        extractedSkills: analysis.extractedSkills,
        matchedSkills: analysis.matchedSkills,
        missingSkills: analysis.missingSkills,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        summary: analysis.summary,
        modelUsed: analysis.modelUsed,
        rawAnalysis: analysis.rawAnalysis,
      });

      const elapsedSec = parseFloat(((Date.now() - startTime) / 1000).toFixed(1));
      Logger.success(
        `[Job #${job.jobId.slice(-6)}] Hoàn tất trong ${elapsedSec}s! Điểm: ${analysis.aiScore}/100 | Đánh giá: ${analysis.recommendation} | Kỹ năng khớp: ${analysis.matchedSkills.length}/${job.internship.requiredSkills.length}`
      );

      // Lưu lại vào lịch sử và cập nhật thống kê
      this.recordJobHistory({
        jobId: job.jobId,
        internshipTitle: job.internship.title,
        cvFileName: job.cvFileName || 'CV-Ung-vien.pdf',
        status: 'SUCCESS',
        aiScore: analysis.aiScore,
        recommendation: analysis.recommendation,
        matchedSkills: analysis.matchedSkills,
        missingSkills: analysis.missingSkills,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        summary: analysis.summary,
        durationSec: elapsedSec,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour12: false }),
      });
    } catch (jobErr: any) {
      const elapsedSec = parseFloat(((Date.now() - startTime) / 1000).toFixed(1));
      const errorMsg = jobErr.message || 'Lỗi không xác định khi xử lý CV';
      Logger.error(`[Job #${job.jobId.slice(-6)}] Xử lý thất bại: ${errorMsg}`);

      // Báo cáo thất bại cho Backend để ghi nhận hoặc xếp lịch thử lại
      try {
        await this.client.failJob(job.jobId, { errorMessage: errorMsg });
      } catch (failApiErr: any) {
        Logger.error(`Không thể gửi báo cáo lỗi về Backend: ${failApiErr.message}`);
      }

      this.recordJobHistory({
        jobId: job.jobId,
        internshipTitle: job.internship.title,
        cvFileName: job.cvFileName || 'CV-Ung-vien.pdf',
        status: 'FAILED',
        errorMessage: errorMsg,
        durationSec: elapsedSec,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour12: false }),
      });
    }
  }

  private recordJobHistory(record: ScannedJobRecord): void {
    this.recentJobs.unshift(record);
    if (this.recentJobs.length > 50) {
      this.recentJobs.pop();
    }

    this.stats.totalProcessed++;
    if (record.status === 'SUCCESS') {
      this.stats.successful++;
    } else {
      this.stats.failed++;
    }
    this.totalProcessingTimeSec += record.durationSec;
    this.stats.avgDurationSec = parseFloat(
      (this.totalProcessingTimeSec / this.stats.totalProcessed).toFixed(1)
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
