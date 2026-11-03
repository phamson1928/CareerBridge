import axios from 'axios';
import { loadConfig } from '../config';
import { Logger } from '../utils/logger';
import { AiWorkerDaemon } from '../worker';
import { LocalWebServer } from './server';

async function runWebTests(): Promise<void> {
  Logger.banner('RUNNING LOCAL WEB SERVER & DASHBOARD INTERNAL TESTS');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string): void {
    total++;
    if (condition) {
      Logger.success(`[PASS] ${desc}`);
      passed++;
    } else {
      Logger.error(`[FAIL] ${desc}`);
      throw new Error(`Test failed: ${desc}`);
    }
  }

  const testConfig = loadConfig(true);
  const worker = new AiWorkerDaemon(testConfig);
  const server = new LocalWebServer(worker);

  const testPort = 5999;
  const activePort = await server.start(testPort);
  assert(activePort >= testPort, `Web Server khởi chạy thành công trên cổng ${activePort}`);

  const baseUrl = `http://localhost:${activePort}`;

  try {
    // 1. GET / -> Phải trả về HTML Dashboard
    const resHtml = await axios.get(`${baseUrl}/`);
    assert(resHtml.status === 200, 'GET / trả về HTTP 200');
    assert(resHtml.data.includes('CareerBridge AI Worker'), 'HTML chứa tiêu đề thương hiệu CareerBridge');
    assert(resHtml.data.includes('Giao diện Quản trị Cấu hình Nội bộ'), 'HTML chứa tiêu đề quản trị');

    // 2. GET /api/status -> Trả về cấu trúc JSON đúng
    const resStatus = await axios.get(`${baseUrl}/api/status`);
    assert(resStatus.status === 200, 'GET /api/status trả về HTTP 200');
    assert(typeof resStatus.data.state === 'string', 'Trạng thái state hợp lệ');
    assert(typeof resStatus.data.stats === 'object', 'Thống kê stats hợp lệ');
    assert(Array.isArray(resStatus.data.recentJobs), 'Danh sách recentJobs là mảng');

    // 3. POST /api/control (pause & resume)
    const resPause = await axios.post(`${baseUrl}/api/control`, { action: 'pause' });
    assert(resPause.data.isPaused === true, 'Tạm dừng polling qua Web API thành công');

    const resResume = await axios.post(`${baseUrl}/api/control`, { action: 'resume' });
    assert(resResume.status === 200, 'Gửi lệnh resume thành công');

    // 4. POST /api/test-ai với Mock Provider
    const resTestAi = await axios.post(`${baseUrl}/api/test-ai`, {
      provider: 'mock',
      aiBaseUrl: 'http://localhost',
      aiModel: 'mock-model',
    });
    assert(resTestAi.data.success === true, 'Test Mock AI Engine trả về thành công ngay lập tức');

    // 5. GET /api/logs
    const resLogs = await axios.get(`${baseUrl}/api/logs`);
    assert(Array.isArray(resLogs.data), 'GET /api/logs trả về mảng log');
    assert(resLogs.data.length > 0, 'Đã ghi nhận log trong bộ đệm');

    Logger.success(`\nTOÀN BỘ ${passed}/${total} WEB SERVER TESTS ĐÃ VƯỢT QUA XUẤT SẮC!`);
  } finally {
    await server.stop();
  }
}

runWebTests().catch((err) => {
  Logger.error('Lỗi kiểm thử Web Server:', err.message || err);
  process.exit(1);
});
