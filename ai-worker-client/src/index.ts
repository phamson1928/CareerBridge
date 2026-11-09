import { loadConfig } from './config';
import { Logger } from './utils/logger';
import { AiWorkerDaemon } from './worker';

async function main(): Promise<void> {
  try {
    const config = loadConfig(false);
    const worker = new AiWorkerDaemon(config);

    // Xử lý dừng tiến trình nhẹ nhàng khi nhận tín hiệu Ctrl+C hoặc Kill
    const handleShutdown = async (signal: string) => {
      Logger.warn(`\nNhận tín hiệu ${signal}. Bắt đầu quá trình dừng Worker an toàn...`);
      await worker.stop();
      process.exit(0);
    };

    process.on('SIGINT', () => void handleShutdown('SIGINT'));
    process.on('SIGTERM', () => void handleShutdown('SIGTERM'));

    process.on('unhandledRejection', (reason: unknown) => {
      Logger.error('Lỗi Promise không được xử lý:', reason);
    });

    // Khởi chạy Worker Daemon (lắng nghe hàng đợi CV từ CareerBridge Backend)
    await worker.start();
  } catch (error: any) {
    Logger.error('Không thể khởi chạy Worker:', error.message || error);
    process.exit(1);
  }
}

void main();
