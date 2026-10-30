import { loadConfig } from './config';
import { Logger } from './utils/logger';
import { AiWorkerDaemon } from './worker';

async function main(): Promise<void> {
  try {
    const config = loadConfig();
    const worker = new AiWorkerDaemon(config);

    // Xử lý dừng tiến trình nhẹ nhàng khi nhận tín hiệu Ctrl+C hoặc Kill
    const handleShutdown = async (signal: string) => {
      Logger.warn(`Nhận tín hiệu ${signal}. Bắt đầu quá trình dừng Worker...`);
      await worker.stop();
      process.exit(0);
    };

    process.on('SIGINT', () => void handleShutdown('SIGINT'));
    process.on('SIGTERM', () => void handleShutdown('SIGTERM'));

    process.on('unhandledRejection', (reason: unknown) => {
      Logger.error('Lỗi Promise không được xử lý:', reason);
    });

    await worker.start();
  } catch (error: any) {
    Logger.error('Không thể khởi chạy Worker:', error.message || error);
    process.exit(1);
  }
}

void main();
