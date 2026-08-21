import { ApiClient } from './apiClient';
import {
  MemoryItem,
  CognitionLabStats,
  UserUnderstandingProfile,
  CreateMemoryParams,
  UpdateMemoryParams,
} from '../types/memory';

export class CognitionService {
  private client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  setClient(client: ApiClient): void {
    this.client = client;
  }

  async getMemories(): Promise<MemoryItem[]> {
    return this.client.get<MemoryItem[]>('/api/memories');
  }

  async getMemory(id: string): Promise<MemoryItem> {
    return this.client.get<MemoryItem>(`/api/memories/${encodeURIComponent(id)}`);
  }

  async addMemory(params: CreateMemoryParams): Promise<MemoryItem> {
    return this.client.post<MemoryItem>('/api/memories', params);
  }

  async updateMemory(id: string, updates: UpdateMemoryParams): Promise<void> {
    await this.client.patch(`/api/memories/${encodeURIComponent(id)}`, updates);
  }

  async deleteMemory(id: string): Promise<void> {
    await this.client.delete(`/api/memories/${encodeURIComponent(id)}`);
  }

  async clearAll(): Promise<void> {
    await this.client.delete('/api/memories');
  }

  async getStats(): Promise<CognitionLabStats> {
    return this.client.get<CognitionLabStats>('/api/memories/stats');
  }

  async search(query: string): Promise<MemoryItem[]> {
    return this.client.get<MemoryItem[]>(`/api/memories/search?q=${encodeURIComponent(query)}`);
  }

  async getUserUnderstanding(): Promise<UserUnderstandingProfile> {
    return this.client.get<UserUnderstandingProfile>('/api/user-understanding');
  }

  async getCommunicationStyle(): Promise<MemoryItem[]> {
    const data = await this.client.get<{ communicationStyle: MemoryItem[] }>(
      '/api/communication-style'
    );
    return data.communicationStyle;
  }

  async getPreferences(): Promise<MemoryItem[]> {
    const data = await this.client.get<{ preferences: MemoryItem[] }>('/api/preferences');
    return data.preferences;
  }

  async getLearningEvents(memoryId?: string, limit: number = 50): Promise<any[]> {
    const path = memoryId
      ? `/api/memories/${encodeURIComponent(memoryId)}/learning-events?limit=${limit}`
      : `/api/learning-events?limit=${limit}`;
    return this.client.get<any[]>(path);
  }

  async migrateIfNeeded(localMemories: MemoryItem[]): Promise<void> {
    if (localMemories.length === 0) return;
    try {
      await this.client.post('/api/memories/migrate', { memories: localMemories });
    } catch (err) {
      console.warn('[DOTVEX] Memory migration failed:', (err as Error).message);
    }
  }
}
