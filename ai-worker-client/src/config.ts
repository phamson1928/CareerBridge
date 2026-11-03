import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

export type SupportedAiProvider = 'mock' | 'ollama' | 'openai-compatible';

export interface WorkerConfig {
  backendUrl: string;
  workerToken: string;
  workerName: string;
  provider: SupportedAiProvider;
  ollamaBaseUrl: string;
  ollamaModel: string;
  aiBaseUrl: string;
  aiModel: string;
  aiApiKey?: string;
  pollIntervalMs: number;
  heartbeatIntervalMs: number;
  webPort: number;
  isConfigured: boolean;
}

export function loadConfig(allowEmptyToken = true): WorkerConfig {
  const rawBackendUrl = process.env.BACKEND_URL?.trim() || 'http://localhost:3000';
  const backendUrl = rawBackendUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');

  const workerToken = process.env.WORKER_TOKEN?.trim() || '';
  if (!workerToken && !allowEmptyToken) {
    throw new Error(
      'Thiếu biến môi trường WORKER_TOKEN! Vui lòng cấu hình token do Doanh nghiệp tạo (bắt đầu bằng cwb_...) trong file .env hoặc qua Giao diện Web http://localhost:5050'
    );
  }

  const rawProvider = process.env.AI_PROVIDER?.trim().toLowerCase() || 'mock';
  let provider: SupportedAiProvider = 'mock';
  if (['openai-compatible', 'vllm', 'localai', 'llamacpp', 'openai', 'universal'].includes(rawProvider)) {
    provider = 'openai-compatible';
  } else if (rawProvider === 'ollama') {
    provider = 'ollama';
  } else {
    provider = 'mock';
  }

  // Base URL & Model: Hỗ trợ linh hoạt cả AI_BASE_URL / OLLAMA_BASE_URL
  const rawAiUrl = process.env.AI_BASE_URL?.trim() || process.env.OLLAMA_BASE_URL?.trim() || 'http://localhost:11434';
  const aiBaseUrl = rawAiUrl.replace(/\/+$/, '');
  const aiModel = process.env.AI_MODEL?.trim() || process.env.OLLAMA_MODEL?.trim() || 'qwen2.5:7b';
  const aiApiKey = process.env.AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || undefined;

  const ollamaBaseUrl = aiBaseUrl;
  const ollamaModel = aiModel;

  const pollIntervalSec = Math.max(1, parseInt(process.env.POLL_INTERVAL_SEC || '5', 10));
  const heartbeatIntervalSec = Math.max(5, parseInt(process.env.HEARTBEAT_INTERVAL_SEC || '25', 10));
  const webPort = parseInt(process.env.WEB_PORT || '5050', 10);

  const workerName = process.env.WORKER_NAME?.trim() || 'Company-AI-Worker';

  return {
    backendUrl,
    workerToken,
    workerName,
    provider,
    ollamaBaseUrl,
    ollamaModel,
    aiBaseUrl,
    aiModel,
    aiApiKey,
    pollIntervalMs: pollIntervalSec * 1000,
    heartbeatIntervalMs: heartbeatIntervalSec * 1000,
    webPort,
    isConfigured: Boolean(workerToken && workerToken.length > 5),
  };
}

/**
 * Ghi cấu hình mới vào tệp .env và nạp lại process.env
 */
export async function saveConfigToEnv(updates: {
  backendUrl?: string;
  workerToken?: string;
  workerName?: string;
  provider?: SupportedAiProvider;
  aiBaseUrl?: string;
  aiModel?: string;
  aiApiKey?: string;
  pollIntervalSec?: number;
  heartbeatIntervalSec?: number;
  webPort?: number;
}): Promise<WorkerConfig> {
  const envPath = path.resolve(process.cwd(), '.env');
  let currentContent = '';

  if (fs.existsSync(envPath)) {
    currentContent = await fs.promises.readFile(envPath, 'utf-8');
  } else {
    // Nếu chưa có file .env, thử đọc từ .env.example
    const examplePath = path.resolve(process.cwd(), '.env.example');
    if (fs.existsSync(examplePath)) {
      currentContent = await fs.promises.readFile(examplePath, 'utf-8');
    }
  }

  const envMap = new Map<string, string>();
  // Parse dòng hiện tại
  currentContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      envMap.set(key, val);
    }
  });

  // Áp dụng các thay đổi
  if (updates.backendUrl !== undefined) envMap.set('BACKEND_URL', updates.backendUrl);
  if (updates.workerToken !== undefined) envMap.set('WORKER_TOKEN', updates.workerToken);
  if (updates.workerName !== undefined) envMap.set('WORKER_NAME', updates.workerName);
  if (updates.provider !== undefined) envMap.set('AI_PROVIDER', updates.provider);
  if (updates.aiBaseUrl !== undefined) envMap.set('AI_BASE_URL', updates.aiBaseUrl);
  if (updates.aiModel !== undefined) envMap.set('AI_MODEL', updates.aiModel);
  if (updates.aiApiKey !== undefined) envMap.set('AI_API_KEY', updates.aiApiKey);
  if (updates.pollIntervalSec !== undefined) envMap.set('POLL_INTERVAL_SEC', String(updates.pollIntervalSec));
  if (updates.heartbeatIntervalSec !== undefined) envMap.set('HEARTBEAT_INTERVAL_SEC', String(updates.heartbeatIntervalSec));
  if (updates.webPort !== undefined) envMap.set('WEB_PORT', String(updates.webPort));

  // Tái tạo nội dung file .env
  const lines: string[] = [
    '# CareerBridge On-premise AI Worker Configuration',
    '# Tự động cập nhật từ Giao diện Quản trị Nội bộ (Local Web UI)',
    '',
    `BACKEND_URL=${envMap.get('BACKEND_URL') || 'http://localhost:3000'}`,
    `WORKER_TOKEN=${envMap.get('WORKER_TOKEN') || ''}`,
    `WORKER_NAME=${envMap.get('WORKER_NAME') || 'Company-AI-Worker'}`,
    `AI_PROVIDER=${envMap.get('AI_PROVIDER') || 'mock'}`,
    `AI_BASE_URL=${envMap.get('AI_BASE_URL') || 'http://localhost:11434'}`,
    `AI_MODEL=${envMap.get('AI_MODEL') || 'qwen2.5:7b'}`,
    envMap.get('AI_API_KEY') ? `AI_API_KEY=${envMap.get('AI_API_KEY')}` : '# AI_API_KEY=',
    `POLL_INTERVAL_SEC=${envMap.get('POLL_INTERVAL_SEC') || '5'}`,
    `HEARTBEAT_INTERVAL_SEC=${envMap.get('HEARTBEAT_INTERVAL_SEC') || '25'}`,
    `WEB_PORT=${envMap.get('WEB_PORT') || '5050'}`,
  ];

  await fs.promises.writeFile(envPath, lines.join('\n'), 'utf-8');

  // Cập nhật process.env trực tiếp trong phiên chạy hiện tại
  for (const [k, v] of envMap.entries()) {
    process.env[k] = v;
  }

  return loadConfig(true);
}
