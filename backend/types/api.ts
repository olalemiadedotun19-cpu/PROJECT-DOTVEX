export interface ChatMessageEntry {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: AttachmentEntry[];
}

export interface AttachmentEntry {
  name: string;
  type: string;
  size: number;
  url?: string;
  textContent?: string;
}

export interface MemoryEntry {
  concept: string;
  content: string;
  category: string;
}

export interface CustomInstructions {
  aboutUser?: string;
  responseStyle?: string;
  traits?: string[];
}

export interface ConversationEntry {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  lastMessagePreview?: string;
  isPinned?: boolean;
  projectId?: string;
}

export interface CreateConversationRequest {
  title?: string;
}

export interface UpdateConversationRequest {
  title?: string;
  isPinned?: boolean;
}

export interface MessageEntry {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  reasoningTrace?: string;
  isReasoningCollapsed?: boolean;
  status?: string;
  modelName?: string;
  latencyMs?: number;
  attachments?: unknown[];
  savedToLibrary?: boolean;
  generatedImageUrl?: string;
  codeOutput?: string;
}

export interface CreateMessageRequest {
  messages?: MessageEntry[];
}

export interface ChatRequest {
  conversationId?: string;
  message?: string;
  userMessage?: string;
  messages?: ChatMessageEntry[];
  attachments?: AttachmentEntry[];
  modelId?: string;
  modelName?: string;
  enableThinking?: boolean;
  enableWebSearch?: boolean;
  systemPrompt?: string;
  customInstructions?: CustomInstructions;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  memories?: MemoryEntry[];
}

export interface ChatSuccessResponse {
  text: string;
  reasoning?: string;
  modelName?: string;
  conversationId?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export interface MemoryCreateRequest {
  concept: string;
  category: string;
  content: string;
  confidence?: number;
  importance?: number;
  lifespan?: string;
  tags?: string[];
  sourceConversationId?: string;
  sourceType?: string;
  evidenceCount?: number;
}

export interface MemoryUpdateRequest {
  concept?: string;
  category?: string;
  content?: string;
  confidence?: number;
  importance?: number;
  lifespan?: string;
  tags?: string[];
  sourceConversationId?: string;
  sourceType?: string;
  evidenceCount?: number;
  lastConfirmedAt?: number;
  lastContradictedAt?: number;
}

export interface MemoryMigrateRequest {
  memories: Array<{
    id: string;
    concept: string;
    category: string;
    content: string;
    confidence: number;
    createdAt?: number;
    lastReinforcedAt?: number;
    tags?: string[];
    sourceConversationId?: string;
    sourceType?: string;
    evidenceCount?: number;
  }>;
}
