export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus = 'sending' | 'thinking' | 'generating' | 'completed' | 'error' | 'stopped';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  textContent?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  reasoningTrace?: string;
  isReasoningCollapsed?: boolean;
  timestamp: number;
  status?: MessageStatus;
  error?: string;
  modelName?: string;
  latencyMs?: number;
  attachments?: Attachment[];
  savedToLibrary?: boolean;
  generatedImageUrl?: string;
  codeOutput?: string;
}

export interface GenerationChunk {
  text: string;
  reasoning?: string;
  isComplete: boolean;
  status: MessageStatus;
}
