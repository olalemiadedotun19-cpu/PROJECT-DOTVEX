import { AIProvider, AIProviderConfig, AIProviderResult, AIStreamChunk, AIMessage } from './provider';
import { buildIdentitySystemPrompt } from './identity';
import { config } from '../config';
import fs from 'fs';

let _nlc: any = null;

async function loadNLC(): Promise<any> {
  if (!_nlc) {
    _nlc = await import('node-llama-cpp');
  }
  return _nlc;
}

export class Qwen3GenerationError extends Error {
  readonly code = 'QWEN3_GENERATION_ERROR';
  constructor(message: string) {
    super(message);
    this.name = 'Qwen3GenerationError';
  }
}

export class Qwen3Provider implements AIProvider {
  readonly name = 'Qwen3';
  private modelPath: string;
  private generationTimeoutMs: number;
  private contextSize: number;
  private gpuEnabled: boolean;
  private gpuType: 'cuda' | 'metal' | 'vulkan' | null;
  private gpuLayers: number | null;
  private _isAvailable: boolean = false;
  private llama: any = null;
  private model: any = null;
  private context: any = null;
  private session: any = null;
  private _lastGenerationTimeMs: number | null = null;
  private _lock: Promise<void> | null = null;

  constructor(
    modelPath: string,
    generationTimeoutMs: number = 120000,
    contextSize: number = 2048,
    gpuEnabled: boolean = false,
    gpuType: 'cuda' | 'metal' | 'vulkan' | null = null,
    gpuLayers: number | null = null
  ) {
    this.modelPath = modelPath;
    this.generationTimeoutMs = generationTimeoutMs;
    this.contextSize = contextSize;
    this.gpuEnabled = gpuEnabled;
    this.gpuType = gpuType;
    this.gpuLayers = gpuLayers;
  }

  get isAvailable(): boolean {
    return this._isAvailable;
  }

  get modelAvailable(): boolean {
    return this.model !== null;
  }

  get lastGenerationTimeMs(): number | null {
    return this._lastGenerationTimeMs;
  }

  async initialize(): Promise<boolean> {
    try {
      if (!fs.existsSync(this.modelPath)) {
        console.error('[DOTVEX] Qwen3 model file not found:', this.modelPath);
        return false;
      }

      console.log('[DOTVEX] Initializing Qwen3 provider...');

      const nlc = await loadNLC();

      const llamaOptions: any = {
        logLevel: 'warn',
        maxThreads: config?.qwen3GpuEnabled ? 4 : 2,
      };

      if (this.gpuEnabled) {
        llamaOptions.gpu = this.gpuType || 'auto';
        if (this.gpuLayers !== null) {
          llamaOptions.gpuLayers = this.gpuLayers;
        }
      } else {
        llamaOptions.gpu = false;
      }

      this.llama = await nlc.getLlama(llamaOptions);

      this.model = await this.llama.loadModel({
        modelPath: this.modelPath,
        useMmap: false,
        onLoadProgress: (progress: number) => {
          const pct = Math.round(progress * 100);
          if (pct % 20 === 0) {
            console.log(`[DOTVEX] Qwen3 model loading: ${pct}%`);
          }
        },
      });

      this.context = await this.model.createContext({
        contextSize: this.contextSize,
        batchSize: 128,
      });

      this.session = new nlc.LlamaChatSession({
        contextSequence: this.context.getSequence(0),
        chatWrapper: new nlc.QwenChatWrapper({ variation: '3', thoughts: 'discourage' }),
      });

      this._isAvailable = true;
      console.log('[DOTVEX] Qwen3 provider initialized successfully');
      console.log('[DOTVEX] Identity system prompt loaded for DOTVEX');
      return true;
    } catch (err: any) {
      console.error('[DOTVEX] Failed to initialize Qwen3 provider:', err.message);
      this._isAvailable = false;
      return false;
    }
  }

  private async acquireLock(): Promise<() => void> {
    while (this._lock) {
      await this._lock;
    }
    let release: () => void;
    const done = new Promise<void>((resolve) => {
      release = resolve;
    });
    this._lock = done;
    return () => {
      release!();
      this._lock = null;
    };
  }

  private buildChatHistory(messages: AIMessage[], userSystemPrompt?: string): any[] {
    const history: any[] = [];

    const identityPrompt = buildIdentitySystemPrompt(userSystemPrompt);
    history.push({ type: 'system', text: identityPrompt });

    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i];
      if (msg.role === 'system') {
        continue;
      } else if (msg.role === 'user') {
        history.push({ type: 'user', text: msg.content });
      } else if (msg.role === 'assistant') {
        history.push({ type: 'model', response: [msg.content] });
      }
    }

    return history;
  }

  private buildPromptOptions(options: AIProviderConfig, signal?: AbortSignal): any {
    return {
      maxTokens: options.maxTokens ?? 256,
      temperature: options.temperature ?? 0.7,
      topP: options.topP ?? 0.9,
      ...(signal ? { signal, stopOnAbortSignal: true } : {}),
    };
  }

  async generateMessages(messages: AIMessage[], options: AIProviderConfig): Promise<AIProviderResult> {
    if (!this._isAvailable || !this.session) {
      throw new Error('Qwen3 provider is not available');
    }

    const release = await this.acquireLock();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.generationTimeoutMs);

    try {
      const history = this.buildChatHistory(messages, options.systemPrompt);
      if (history.length > 0) {
        this.session.setChatHistory(history);
      }

      const promptText = messages[messages.length - 1]?.content ?? '';
      const start = Date.now();

       const text = await this.session.prompt(promptText, this.buildPromptOptions(options, controller.signal));
      this._lastGenerationTimeMs = Date.now() - start;

      return {
        text,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Qwen3GenerationError(
          `DOTVEX generation timed out after ${this.generationTimeoutMs}ms. Consider increasing GENERATION_TIMEOUT_MS for slower hardware.`
        );
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
      release();
    }
  }

  async streamMessages(
    messages: AIMessage[],
    options: AIProviderConfig,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<void> {
    if (!this._isAvailable || !this.session) {
      throw new Error('Qwen3 provider is not available');
    }

    const release = await this.acquireLock();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.generationTimeoutMs);

    try {
      const history = this.buildChatHistory(messages, options.systemPrompt);
      if (history.length > 0) {
        this.session.setChatHistory(history);
      }

      const promptText = messages[messages.length - 1]?.content ?? '';
      const start = Date.now();

      await this.session.prompt(promptText, {
        ...this.buildPromptOptions(options, controller.signal),
        onTextChunk: (text: string) => {
          onChunk({
            type: 'text',
            delta: text,
            isFinal: false,
          });
        },
        onResponseChunk: (chunk: any) => {
          if (chunk.type === 'segment' && chunk.segmentType === 'thought') {
            onChunk({
              type: 'thinking',
              reasoning: chunk.text,
              isFinal: false,
            });
          }
        },
      });

      this._lastGenerationTimeMs = Date.now() - start;

      onChunk({
        type: 'status',
        status: 'completed',
        isFinal: true,
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Qwen3GenerationError(
          `DOTVEX generation timed out after ${this.generationTimeoutMs}ms. Consider increasing GENERATION_TIMEOUT_MS for slower hardware.`
        );
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
      release();
    }
  }

  async dispose(): Promise<void> {
    try {
      if (this.session) {
        try { this.session.dispose(); } catch {}
        this.session = null;
      }
      if (this.context) {
        await this.context.dispose();
        this.context = null;
      }
      if (this.model) {
        await this.model.dispose();
        this.model = null;
      }
      if (this.llama) {
        await this.llama.dispose();
        this.llama = null;
      }
      this._isAvailable = false;
      console.log('[DOTVEX] Qwen3 provider disposed');
    } catch (err: any) {
      console.error('[DOTVEX] Error disposing Qwen3 provider:', err.message);
    }
  }
}
