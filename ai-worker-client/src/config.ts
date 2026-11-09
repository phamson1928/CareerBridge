import dotenv from 'dotenv';

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
  isConfigured: boolean;
}

export function loadConfig(allowEmptyToken = false): WorkerConfig {
  const rawBackendUrl = process.env.BACKEND_URL?.trim() || 'http://localhost:3000';
  const backendUrl = rawBackendUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');

  const workerToken = process.env.WORKER_TOKEN?.trim() || '';
  if (!workerToken && !allowEmptyToken) {
    throw new Error(
      'Thiếu biến môi trường WORKER_TOKEN! Vui lòng cấu hình token do Doanh nghiệp tạo (bắt đầu bằng cwb_...) trong file .env'
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
    isConfigured: Boolean(workerToken && workerToken.length > 5),
  };
}
