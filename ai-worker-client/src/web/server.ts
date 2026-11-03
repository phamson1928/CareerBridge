import http, { IncomingMessage, ServerResponse } from 'http';
import { saveConfigToEnv } from '../config';
import { Logger } from '../utils/logger';
import { AiWorkerDaemon } from '../worker';
import { getDashboardHtml } from './dashboard';

export class LocalWebServer {
  private server: http.Server | null = null;
  private currentPort = 5050;

  constructor(private readonly worker: AiWorkerDaemon) {}

  async start(preferredPort = 5050): Promise<number> {
    return new Promise((resolve, reject) => {
      this.currentPort = preferredPort;
      this.server = http.createServer((req, res) => this.handleRequest(req, res));

      this.server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          Logger.warn(`Cổng ${this.currentPort} đã được sử dụng. Thử chuyển sang cổng ${this.currentPort + 1}...`);
          this.currentPort++;
          this.server?.listen(this.currentPort);
        } else {
          Logger.error('Lỗi khởi động Web Server nội bộ:', err.message);
          reject(err);
        }
      });

      this.server.listen(this.currentPort, () => {
        Logger.banner(
          'GIAO DIỆN QUẢN TRỊ NỘI BỘ (LOCAL WEB UI)',
          `Truy cập ngay tại: http://localhost:${this.currentPort}`
        );
        resolve(this.currentPort);
      });
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server?.close(() => {
          this.server = null;
          resolve();
        });
      });
    }
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = req.url?.split('?')[0] || '/';
    const method = req.method?.toUpperCase() || 'GET';

    // CORS & Content negotiation
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      // 1. Dashboard UI
      if (method === 'GET' && (url === '/' || url === '/index.html')) {
        const html = getDashboardHtml();
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Length': Buffer.byteLength(html),
        });
        res.end(html);
        return;
      }

      // 2. GET /api/status
      if (method === 'GET' && url === '/api/status') {
        const status = this.worker.getStatus();
        this.sendJson(res, 200, status);
        return;
      }

      // 3. POST /api/config
      if (method === 'POST' && url === '/api/config') {
        const body = await this.readJsonBody(req);
        const newConfig = await saveConfigToEnv(body);
        await this.worker.updateConfig(newConfig);
        const updatedStatus = this.worker.getStatus();
        this.sendJson(res, 200, updatedStatus);
        return;
      }

      // 4. POST /api/control
      if (method === 'POST' && url === '/api/control') {
        const body = await this.readJsonBody(req);
        if (body.action === 'pause') {
          this.worker.pause();
        } else if (body.action === 'resume') {
          this.worker.resume();
        }
        const updatedStatus = this.worker.getStatus();
        this.sendJson(res, 200, updatedStatus);
        return;
      }

      // 5. POST /api/test-backend
      if (method === 'POST' && url === '/api/test-backend') {
        const body = await this.readJsonBody(req);
        const status = this.worker.getStatus();
        const backendUrl = body.backendUrl || status.config.backendUrl;
        const workerToken = body.workerToken || process.env.WORKER_TOKEN || '';

        const result = await AiWorkerDaemon.testBackendConnection(backendUrl, workerToken);
        this.sendJson(res, 200, result);
        return;
      }

      // 6. POST /api/test-ai
      if (method === 'POST' && url === '/api/test-ai') {
        const body = await this.readJsonBody(req);
        const result = await AiWorkerDaemon.testAiConnection({
          provider: body.provider,
          aiBaseUrl: body.aiBaseUrl,
          aiModel: body.aiModel,
          aiApiKey: body.aiApiKey,
        });
        this.sendJson(res, 200, result);
        return;
      }

      // 7. GET /api/logs
      if (method === 'GET' && url === '/api/logs') {
        const logs = Logger.getRecentLogs(80);
        this.sendJson(res, 200, logs);
        return;
      }

      // 8. POST /api/logs/clear
      if (method === 'POST' && url === '/api/logs/clear') {
        Logger.clearLogs();
        this.sendJson(res, 200, { success: true });
        return;
      }

      // 404 Not Found
      this.sendJson(res, 404, { error: 'Endpoint không tồn tại' });
    } catch (err: any) {
      Logger.error(`Lỗi xử lý Web Request [${method} ${url}]:`, err.message);
      this.sendJson(res, 500, { error: err.message || 'Lỗi máy chủ nội bộ' });
    }
  }

  private sendJson(res: ServerResponse, statusCode: number, data: any): void {
    const jsonStr = JSON.stringify(data);
    res.writeHead(statusCode, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(jsonStr),
    });
    res.end(jsonStr);
  }

  private readJsonBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
        if (body.length > 1e6) {
          req.socket.destroy();
          reject(new Error('Payload quá lớn'));
        }
      });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (e) {
          reject(new Error('Dữ liệu JSON không hợp lệ'));
        }
      });
      req.on('error', reject);
    });
  }
}
