import { BackendApiClient } from './api/client';
import { AvailableJob } from './api/types';
import { WorkerConfig } from './config';
import { CvDownloader } from './pdf/downloader';
import { CvParser } from './pdf/parser';
import { AiProvider } from './providers/base.provider';
import { ProviderFactory } from './providers/provider.factory';
import { Logger } from './utils/logger';

export class AiWorkerDaemon {
  private readonly client: BackendApiClient;
  private readonly provider: AiProvider;
  private isStopping = false;
  private isProcessingJob = false;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private consecutiveErrors = 0;

  constructor(private readonly config: WorkerConfig) {
    this.client = new BackendApiClient(config);
    this.provider = ProviderFactory.create(config);
  }

  async start(): Promise<void> {
    Logger.banner(
      'CAREERBRIDGE AI WORKER DAEMON',
      `Phiên bản: 1.0.0 | Doanh nghiệp: ${this.config.workerName} | Chế độ: ${this.provider.name}`
    );

    Logger.info(`Kết nối Backend: ${this.config.backendUrl}`);
    Logger.info(`Mô hình AI: ${this.provider.modelName}`);
    Logger.info(`Chu kỳ Polling: ${this.config.pollIntervalMs / 1000}s | Heartbeat: ${this.config.heartbeatIntervalMs / 1000}s`);

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

  private async sendInitialHeartbeat(): Promise<void> {
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
    this.heartbeatTimer = setInterval(async () => {
      if (this.isStopping) return;
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
          Logger.error(`Xác thực thất bại (401): ${msg}. Vui lòng kiểm tra lại WORKER_TOKEN trong .env!`);
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

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      Logger.success(
        `[Job #${job.jobId.slice(-6)}] Hoàn tất trong ${elapsed}s! Điểm: ${analysis.aiScore}/100 | Đánh giá: ${analysis.recommendation} | Kỹ năng khớp: ${analysis.matchedSkills.length}/${job.internship.requiredSkills.length}`
      );
    } catch (jobErr: any) {
      const errorMsg = jobErr.message || 'Lỗi không xác định khi xử lý CV';
      Logger.error(`[Job #${job.jobId.slice(-6)}] Xử lý thất bại: ${errorMsg}`);

      // Báo cáo thất bại cho Backend để ghi nhận hoặc xếp lịch thử lại
      try {
        await this.client.failJob(job.jobId, { errorMessage: errorMsg });
      } catch (failApiErr: any) {
        Logger.error(`Không thể gửi báo cáo lỗi về Backend: ${failApiErr.message}`);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
