import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface UploadUrlResponse {
  url: string;
  token: string;
}

interface DownloadUrlResponse {
  signedURL: string;
}

@Injectable()
export class SupabaseStorageService {
  private readonly url?: string;
  private readonly serviceKey?: string;
  private readonly bucket: string;
  private readonly expiresIn: number;

  constructor(config: ConfigService) {
    this.url = config.get<string>('SUPABASE_URL')?.replace(/\/$/, '');
    this.serviceKey = config.get<string>('SUPABASE_SERVICE_KEY');
    this.bucket = config.get<string>('FILES_BUCKET', 'internhub-files');
    this.expiresIn = config.get<number>('SIGNED_URL_EXPIRES_IN_SECONDS', 300);
  }

  async createUploadUrl(storageKey: string) {
    const encodedKey = this.encodeStorageKey(storageKey);
    const payload = await this.request<UploadUrlResponse>(
      `/storage/v1/object/upload/sign/${this.bucket}/${encodedKey}`,
      {},
    );
    const uploadUrl = this.toAbsoluteUrl(payload.url);
    const separator = uploadUrl.includes('?') ? '&' : '?';
    return {
      uploadUrl: uploadUrl.includes('token=')
        ? uploadUrl
        : `${uploadUrl}${separator}token=${encodeURIComponent(payload.token)}`,
    };
  }

  async createDownloadUrl(storageKey: string): Promise<string> {
    const encodedKey = this.encodeStorageKey(storageKey);
    const payload = await this.request<DownloadUrlResponse>(
      `/storage/v1/object/sign/${this.bucket}/${encodedKey}`,
      { expiresIn: this.expiresIn },
    );
    return this.toAbsoluteUrl(payload.signedURL);
  }

  getExpiresIn(): number {
    return this.expiresIn;
  }

  private async request<T>(path: string, body: object): Promise<T> {
    if (!this.url || !this.serviceKey) {
      throw new ServiceUnavailableException({
        code: 'FILE_STORAGE_NOT_CONFIGURED',
        message: 'Supabase Storage is not configured',
      });
    }
    let response: Response;
    try {
      response = await fetch(`${this.url}${path}`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.serviceKey}`,
          apikey: this.serviceKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new ServiceUnavailableException({
        code: 'FILE_STORAGE_UNAVAILABLE',
        message: 'File storage is temporarily unavailable',
      });
    }
    if (!response.ok) {
      throw new ServiceUnavailableException({
        code: 'FILE_STORAGE_REQUEST_FAILED',
        message: 'Could not create a signed storage URL',
      });
    }
    return (await response.json()) as T;
  }

  private toAbsoluteUrl(path: string): string {
    if (path.startsWith('http')) return path;
    const storageBaseUrl = `${this.url}/storage/v1`;
    return path.startsWith('/storage/v1/')
      ? `${this.url}${path}`
      : `${storageBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private encodeStorageKey(storageKey: string): string {
    return storageKey.split('/').map(encodeURIComponent).join('/');
  }
}
