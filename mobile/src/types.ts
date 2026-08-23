export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  timestamp: number;
  status?: 'sending' | 'thinking' | 'generating' | 'completed' | 'error';
  modelName?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
}

export interface MemoryItem {
  id: string;
  concept: string;
  category: string;
  content: string;
  confidence: number;
  importance: number;
  tags: string[];
  sourceType?: string;
  evidenceCount?: number;
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  userName: string;
  temperature: number;
  maxTokens: number;
  apiEndpoint: string;
  apiKey: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  accentColor: 'emerald',
  userName: 'User',
  temperature: 0.7,
  maxTokens: 4096,
  apiEndpoint: '',
  apiKey: '',
};
