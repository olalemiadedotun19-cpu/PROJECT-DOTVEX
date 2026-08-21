export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  thinkingTrace?: string;
}

export interface AIProviderConfig {
  modelId?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  enableThinking?: boolean;
  enableWebSearch?: boolean;
  systemPrompt?: string;
}

export interface AIStreamChunk {
  type: 'thinking' | 'text' | 'status';
  delta?: string;
  full?: string;
  reasoning?: string;
  status?: string;
  isFinal: boolean;
}

export interface AIProviderResult {
  text: string;
  reasoning?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIProvider {
  readonly name: string;
  readonly isAvailable: boolean;

  generateMessages: (messages: AIMessage[], options: AIProviderConfig) => Promise<AIProviderResult>;

  streamMessages: (
    messages: AIMessage[],
    options: AIProviderConfig,
    onChunk: (chunk: AIStreamChunk) => void
  ) => Promise<void>;
}
