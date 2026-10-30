import { WorkerConfig } from '../config';
import { AiProvider } from './base.provider';
import { MockAiProvider } from './mock.provider';
import { OllamaAiProvider } from './ollama.provider';

export class ProviderFactory {
  static create(config: WorkerConfig): AiProvider {
    if (config.provider === 'ollama') {
      return new OllamaAiProvider(config.ollamaBaseUrl, config.ollamaModel);
    }

    return new MockAiProvider();
  }
}
