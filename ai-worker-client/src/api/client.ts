import axios, { AxiosInstance } from 'axios';
import { WorkerConfig } from '../config';
import {
  CompleteJobPayload,
  FailJobPayload,
  HeartbeatPayload,
  PollJobResponse,
} from './types';

export class BackendApiClient {
  private readonly client: AxiosInstance;

  constructor(private readonly config: WorkerConfig) {
    this.client = axios.create({
      baseURL: `${config.backendUrl}/api/v1/ai-worker`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Worker-Token': config.workerToken,
        'User-Agent': `CareerBridge-Worker/${config.workerName}`,
      },
    });
  }

  async pollJob(): Promise<PollJobResponse> {
    const response = await this.client.get<any>('/jobs/poll');
    const raw = response.data;
    if (raw && typeof raw.hasJob === 'boolean') {
      return raw;
    }
    if (raw && raw.data && typeof raw.data.hasJob === 'boolean') {
      return raw.data;
    }
    return raw;
  }

  async completeJob(jobId: string, payload: CompleteJobPayload): Promise<void> {
    await this.client.post(`/jobs/${jobId}/complete`, payload);
  }

  async failJob(jobId: string, payload: FailJobPayload): Promise<void> {
    await this.client.post(`/jobs/${jobId}/fail`, payload);
  }

  async sendHeartbeat(payload: HeartbeatPayload): Promise<void> {
    await this.client.post('/heartbeat', payload);
  }
}
