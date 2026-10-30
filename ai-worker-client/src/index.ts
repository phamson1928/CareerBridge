import { exec } from 'child_process';
import { loadConfig } from './config';
import { Logger } from './utils/logger';
import { LocalWebServer } from './web/server';
import { AiWorkerDaemon } from './worker';

async function openBrowser(url: string): Promise<void> {
  const startCmd =
    process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`;

  exec(startCmd, () => {
    // Không cần xử lý nếu người dùng đang chạy trên môi trường headless không có GUI
  });
}

async function main(): Promise<void> {
  try {
    const config = loadConfig(true);
    const worker = new AiWorkerDaemon(config);
    const webServer = new LocalWebServer(worker);

    // Xử lý dừng tiến trình nhẹ nhàng khi nhận tín hiệu Ctrl+C hoặc Kill
    const handleShutdown = async (signal: string) => {
      Logger.warn(`Nhận tín hiệu ${signal}. Bắt đầu quá trình dừng Worker và Web Server...`);
      await Promise.all([worker.stop(), webServer.stop()]);
      process.exit(0);
    };

    process.on('SIGINT', () => void handleShutdown('SIGINT'));
    process.on('SIGTERM', () => void handleShutdown('SIGTERM'));

    process.on('unhandledRejection', (reason: unknown) => {
      Logger.error('Lỗi Promise không được xử lý:', reason);
    });

    // 1. Khởi chạy Web Server nội bộ (mặc định port 5050)
    const activePort = await webServer.start(config.webPort);

    // Tự động mở trình duyệt nếu bật cờ (hoặc khi chưa cấu hình token để hỗ trợ HR ngay lập tức)
    if (!config.isConfigured || process.env.AUTO_OPEN_BROWSER === 'true') {
      void openBrowser(`http://localhost:${activePort}`);
    }

    // 2. Khởi chạy Worker Daemon (sẽ tự động lắng nghe việc hoặc chờ cấu hình từ Web)
    await worker.start();
  } catch (error: any) {
    Logger.error('Không thể khởi chạy Worker:', error.message || error);
    process.exit(1);
  }
}

void main();

