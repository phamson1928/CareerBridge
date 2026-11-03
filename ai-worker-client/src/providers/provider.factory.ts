import { WorkerConfig } from '../config';
import { AiProvider } from './base.provider';
import { MockAiProvider } from './mock.provider';
import { OllamaAiProvider } from './ollama.provider';
import { OpenAiCompatibleProvider } from './openai-compatible.provider';

export class ProviderFactory {
  static create(config: WorkerConfig): AiProvider {
    if (config.provider === 'openai-compatible') {
      return new OpenAiCompatibleProvider(
        config.aiBaseUrl,
        config.aiModel,
        config.aiApiKey,
      );
    }

    if (config.provider === 'ollama') {
      return new OllamaAiProvider(config.ollamaBaseUrl, config.ollamaModel);
    }

    return new MockAiProvider();
  }
}
