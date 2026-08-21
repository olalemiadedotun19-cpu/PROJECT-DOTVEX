import { AIProvider, AIProviderConfig, AIProviderResult, AIStreamChunk, AIMessage } from '../ai/provider';

export class AIServiceNotConfiguredError extends Error {
  readonly code = 'AI_NOT_CONFIGURED';

  constructor(message = 'DOTVEX AI provider is not configured yet.') {
    super(message);
    this.name = 'AIServiceNotConfiguredError';
  }
}

export class AIServiceUnavailableError extends Error {
  readonly code = 'AI_UNAVAILABLE';

  constructor(message = 'DOTVEX AI is currently unavailable.') {
    super(message);
    this.name = 'AIServiceUnavailableError';
  }
}

export class AIService {
  private provider: AIProvider | null = null;

  setProvider(provider: AIProvider | null): void {
    this.provider = provider;
  }

  getProviderName(): string | null {
    return this.provider?.name ?? null;
  }

  isModelAvailable(): boolean {
    return this.provider !== null && this.provider.isAvailable;
  }

  isAvailable(): boolean {
    return this.provider !== null && this.provider.isAvailable;
  }

  async generate(messages: AIMessage[], options: AIProviderConfig): Promise<AIProviderResult> {
    if (!this.provider) {
      throw new AIServiceNotConfiguredError();
    }
    if (!this.provider.isAvailable) {
      throw new AIServiceUnavailableError();
    }
    return this.provider.generateMessages(messages, options);
  }

  async stream(messages: AIMessage[], options: AIProviderConfig, onChunk: (chunk: AIStreamChunk) => void): Promise<void> {
    if (!this.provider) {
      throw new AIServiceNotConfiguredError();
    }
    if (!this.provider.isAvailable) {
      throw new AIServiceUnavailableError();
    }
    return this.provider.streamMessages(messages, options, onChunk);
  }
}

export const aiService = new AIService();
