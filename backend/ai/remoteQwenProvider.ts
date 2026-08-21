import { AIProvider, AIProviderConfig, AIProviderResult, AIStreamChunk, AIMessage } from './provider';
import { buildIdentitySystemPrompt } from './identity';
import { logger } from '../utils/logger';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChatRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface OpenAIChatResponseChoice {
  message: {
    content: string | null;
  };
  finish_reason?: 'stop' | 'length' | 'abort' | null;
}

interface OpenAIChatResponse {
  id: string;
  choices: OpenAIChatResponseChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

interface OpenAIStreamingChunk {
  id: string;
  choices: Array<{
    delta: {
      content?: string | null;
      reasoning_content?: string | null;
    };
    finish_reason?: 'stop' | 'length' | 'abort' | null;
  }>;
}

export class RemoteQwen3Provider implements AIProvider {
  readonly name = 'Qwen3';
  private remoteUrl: string;
  private apiKey: string | null;
  private modelName: string;
  private timeoutMs: number;
  private _isAvailable: boolean = false;
  private _lastGenerationTimeMs: number | null = null;
  private _modelAvailable: boolean = false;

  constructor(
    remoteUrl: string,
    apiKey: string | null = null,
    modelName: string = 'Qwen3-4B-Q4_K_M',
    timeoutMs: number = 900000
  ) {
    this.remoteUrl = remoteUrl.replace(/\/+$/, '');
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.timeoutMs = timeoutMs;
  }

  get isAvailable(): boolean {
    return this._isAvailable;
  }

  get modelAvailable(): boolean {
    return this._modelAvailable;
  }

  get lastGenerationTimeMs(): number | null {
    return this._lastGenerationTimeMs;
  }

  get endpoint(): string {
    return this.remoteUrl;
  }

  async initialize(): Promise<boolean> {
    try {
      logger.info('Initializing remote Qwen3 provider', { endpoint: this.remoteUrl });

      const response = await fetch(`${this.remoteUrl}/v1/models`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        logger.warn('Remote Qwen3 provider health check failed', {
          status: response.status,
          endpoint: this.remoteUrl,
        });
        this._isAvailable = true;
        this._modelAvailable = false;
        return true;
      }

      const data = await response.json().catch(() => null);
      if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        logger.info('Remote Qwen3 model detected', {
          model: data.data[0].id,
          endpoint: this.remoteUrl,
        });
      }

      this._isAvailable = true;
      this._modelAvailable = true;
      logger.info('Remote Qwen3 provider initialized successfully');
      return true;
    } catch (err: any) {
      logger.warn('Remote Qwen3 provider initialization failed, will retry on next request', {
        error: err.message,
      });
      this._isAvailable = true;
      this._modelAvailable = false;
      return true;
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  private buildChatHistory(messages: AIMessage[]): OpenAIMessage[] {
    const history: OpenAIMessage[] = [];

    const systemPrompts: string[] = [];
    const identityPrompt = buildIdentitySystemPrompt();
    systemPrompts.push(identityPrompt);

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemPrompts.push(msg.content);
      }
    }

    if (systemPrompts.length > 0) {
      history.push({ role: 'system', content: systemPrompts.join('\n\n') });
    }

    for (const msg of messages) {
      if (msg.role === 'system') continue;
      history.push({ role: msg.role, content: msg.content });
    }

    return history;
  }

  private buildOpenAIRequest(options: AIProviderConfig, messages: AIMessage[], stream: boolean): OpenAIChatRequest {
    const chatMessages = this.buildChatHistory(messages);

    if (options.systemPrompt) {
      const existingSystem = chatMessages.find(m => m.role === 'system');
      if (existingSystem) {
        existingSystem.content = `${existingSystem.content}\n\n${options.systemPrompt}`;
      } else {
        chatMessages.unshift({ role: 'system', content: options.systemPrompt });
      }
    }

    return {
      model: this.modelName,
      messages: chatMessages,
      temperature: options.temperature ?? 0.7,
      top_p: options.topP ?? 0.9,
      max_tokens: options.maxTokens ?? 256,
      stream,
    };
  }

  async generateMessages(messages: AIMessage[], options: AIProviderConfig): Promise<AIProviderResult> {
    if (!this._isAvailable) {
      throw new Error('Remote Qwen3 provider is not available');
    }

    const requestBody = this.buildOpenAIRequest(options, messages, false);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const startTime = Date.now();

      const response = await fetch(`${this.remoteUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(
          `Remote Qwen3 returned ${response.status}: ${errorBody || response.statusText}`
        );
      }

      const data: OpenAIChatResponse = await response.json();
      const text = data.choices[0]?.message?.content || '';
      this._modelAvailable = true;

      this._lastGenerationTimeMs = Date.now() - startTime;

      return {
        text,
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            }
          : undefined,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(
          `Remote Qwen3 generation timed out after ${this.timeoutMs}ms. Consider increasing the timeout.`
        );
      }
      this._modelAvailable = false;
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async streamMessages(
    messages: AIMessage[],
    options: AIProviderConfig,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<void> {
    if (!this._isAvailable) {
      throw new Error('Remote Qwen3 provider is not available');
    }

    const requestBody = this.buildOpenAIRequest(options, messages, true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const startTime = Date.now();

      const response = await fetch(`${this.remoteUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(
          `Remote Qwen3 returned ${response.status}: ${errorBody || response.statusText}`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data:')) continue;

          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const chunk: OpenAIStreamingChunk = JSON.parse(jsonStr);

            for (const choice of chunk.choices) {
              if (choice.delta?.content) {
                onChunk({
                  type: 'text',
                  delta: choice.delta.content,
                  isFinal: false,
                });
              }
              if (choice.delta?.reasoning_content) {
                onChunk({
                  type: 'thinking',
                  reasoning: choice.delta.reasoning_content,
                  isFinal: false,
                });
              }
              if (choice.finish_reason === 'stop' || choice.finish_reason === 'length') {
                onChunk({
                  type: 'status',
                  status: 'completed',
                  isFinal: true,
                });
              }
            }
          } catch {
            // Skip malformed SSE chunks
          }
        }
      }

      this._modelAvailable = true;
      this._lastGenerationTimeMs = Date.now() - startTime;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(
          `Remote Qwen3 generation timed out after ${this.timeoutMs}ms. Consider increasing the timeout.`
        );
      }
      this._modelAvailable = false;
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async dispose(): Promise<void> {
    this._isAvailable = false;
    this._modelAvailable = false;
    logger.info('Remote Qwen3 provider disposed');
  }
}
