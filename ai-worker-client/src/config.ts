import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

export interface WorkerConfig {
  backendUrl: string;
  workerToken: string;
  workerName: string;
  provider: 'mock' | 'ollama';
  ollamaBaseUrl: string;
  ollamaModel: string;
  pollIntervalMs: number;
  heartbeatIntervalMs: number;
}

export function loadConfig(): WorkerConfig {
  const rawBackendUrl = process.env.BACKEND_URL?.trim() || 'http://localhost:3000';
  const backendUrl = rawBackendUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');

  const workerToken = process.env.WORKER_TOKEN?.trim() || '';
  if (!workerToken) {
    throw new Error(
      'Thiếu biến môi trường WORKER_TOKEN! Vui lòng cấu hình token do Doanh nghiệp tạo (bắt đầu bằng cwb_...) trong file .env'
    );
  }

  const rawProvider = (process.env.AI_PROVIDER?.trim().toLowerCase() || 'mock') as 'mock' | 'ollama';
  const provider = rawProvider === 'ollama' ? 'ollama' : 'mock';

  const rawOllamaUrl = process.env.OLLAMA_BASE_URL?.trim() || 'http://localhost:11434';
  const ollamaBaseUrl = rawOllamaUrl.replace(/\/+$/, '');
  const ollamaModel = process.env.OLLAMA_MODEL?.trim() || 'qwen2.5:7b';

  const pollIntervalSec = Math.max(1, parseInt(process.env.POLL_INTERVAL_SEC || '5', 10));
  const heartbeatIntervalSec = Math.max(5, parseInt(process.env.HEARTBEAT_INTERVAL_SEC || '25', 10));

  const workerName = process.env.WORKER_NAME?.trim() || 'Company-AI-Worker';

  return {
    backendUrl,
    workerToken,
    workerName,
    provider,
    ollamaBaseUrl,
    ollamaModel,
    pollIntervalMs: pollIntervalSec * 1000,
    heartbeatIntervalMs: heartbeatIntervalSec * 1000,
  };
}
