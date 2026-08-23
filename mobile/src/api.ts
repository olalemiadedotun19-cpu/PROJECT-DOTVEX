import { ChatMessage, Conversation, MemoryItem, UserSettings } from './types';

const API_BASE_URL = 'http://localhost:3000';

export class ApiService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.apiKey = '';
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) h['x-api-key'] = this.apiKey;
    return h;
  }

  async sendMessage(
    message: string,
    history: ChatMessage[],
    settings: UserSettings
  ): Promise<{ text: string; reasoning?: string; modelName: string; conversationId: string }> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        message,
        messages: history.map((m) => ({ role: m.role, content: m.content })),
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  async getConversations(): Promise<Conversation[]> {
    const response = await fetch(`${this.baseUrl}/api/conversations`, {
      headers: this.headers(),
    });
    if (!response.ok) return [];
    return response.json();
  }

  async createConversation(title: string): Promise<Conversation> {
    const response = await fetch(`${this.baseUrl}/api/conversations`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ title }),
    });
    return response.json();
  }

  async deleteConversation(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/conversations/${id}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const response = await fetch(`${this.baseUrl}/api/conversations/${conversationId}/messages`, {
      headers: this.headers(),
    });
    if (!response.ok) return [];
    return response.json();
  }

  async getMemories(): Promise<MemoryItem[]> {
    const response = await fetch(`${this.baseUrl}/api/memories`, {
      headers: this.headers(),
    });
    if (!response.ok) return [];
    return response.json();
  }

  async addMemory(concept: string, category: string, content: string): Promise<MemoryItem> {
    const response = await fetch(`${this.baseUrl}/api/memories`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ concept, category, content }),
    });
    return response.json();
  }

  async deleteMemory(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/memories/${id}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
  }

  async getMemoryStats(): Promise<{ totalMemories: number; activeConcepts: number; averageConfidence: number }> {
    const response = await fetch(`${this.baseUrl}/api/memories/stats`, {
      headers: this.headers(),
    });
    if (!response.ok) return { totalMemories: 0, activeConcepts: 0, averageConfidence: 0 };
    return response.json();
  }
}

export const apiService = new ApiService();
