import { ChatMessage } from './chat';
import { MemoryItem, CognitionLabStats, UserUnderstandingProfile } from './memory';

export interface ApiError {
  code: string;
  message: string;
}

export interface ErrorResponse {
  error: ApiError;
}

export interface ChatRequest {
  conversationId?: string;
  message?: string;
  userMessage?: string;
  messages?: Array<{
    role: string;
    content: string;
    attachments?: any[];
  }>;
  attachments?: any[];
  modelId?: string;
  enableThinking?: boolean;
  enableWebSearch?: boolean;
  systemPrompt?: string;
  customInstructions?: {
    aboutUser?: string;
    responseStyle?: string;
    traits?: string[];
  };
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}

export interface ChatSuccessResponse {
  text: string;
  reasoning?: string;
  modelName: string;
  conversationId: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ConversationCreateRequest {
  title?: string;
}

export interface ConversationUpdateRequest {
  title?: string;
  isPinned?: boolean;
}

export interface MessageSaveRequest {
  messages: Array<{
    id: string;
    role: string;
    content: string;
    timestamp: number;
  }>;
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

export interface MemorySearchResponse {
  results: MemoryItem[];
}

export interface MemoryStatsResponse extends CognitionLabStats {}

export interface UserUnderstandingResponse extends UserUnderstandingProfile {}

export interface CommunicationStyleResponse {
  communicationStyle: MemoryItem[];
}

export interface PreferencesResponse {
  preferences: MemoryItem[];
}

export interface HealthResponse {
  status: string;
  service: string;
  provider: string;
  modelAvailable: boolean;
  database: string;
}
