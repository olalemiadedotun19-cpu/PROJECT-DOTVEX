import { MemoryItem, CognitionLabStats, MemoryCategory, MemoryLifespan, UserUnderstandingProfile } from '../../types/memory';
import { API_BASE_URL, getApiHeaders } from './config';

const STORAGE_KEY_COGNITION = 'dotvex_cognition_memory_v1';
let migrationAttempted = false;

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { ...getApiHeaders(), ...options.headers },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.error?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

class CognitionService {
  private cache: MemoryItem[] | null = null;

  async migrateIfNeeded(): Promise<void> {
    if (migrationAttempted) return;
    migrationAttempted = true;

    const local = this.getLocalMemories();
    if (local.length === 0) return;

    try {
      await apiFetch('/memories/migrate', {
        method: 'POST',
        body: JSON.stringify({ memories: local }),
      });
      this.cache = null;
    } catch (err) {
      console.warn('[DOTVEX] Memory migration failed, keeping localStorage:', (err as Error).message);
    }
  }

  private getLocalMemories(): MemoryItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COGNITION);
      if (!raw) return [];
      return JSON.parse(raw) as MemoryItem[];
    } catch {
      return [];
    }
  }

  private setLocalMemories(memories: MemoryItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_COGNITION, JSON.stringify(memories));
    } catch (e) {
      console.error('Failed to save memories to localStorage:', e);
    }
  }

  async getMemories(): Promise<MemoryItem[]> {
    try {
      const data = await apiFetch<MemoryItem[]>('/memories');
      this.cache = data;
      return data;
    } catch (err) {
      console.warn('[DOTVEX] Backend unavailable, falling back to localStorage for memories:', (err as Error).message);
      return this.cache ?? this.getLocalMemories();
    }
  }

  saveMemories(memories: MemoryItem[]): void {
    this.cache = memories;
    this.setLocalMemories(memories);
  }

  async addMemory(params: {
    concept: string;
    category: MemoryCategory;
    content: string;
    confidence?: number;
    importance?: number;
    lifespan?: MemoryLifespan;
    tags?: string[];
    sourceConversationId?: string;
    sourceType?: string;
    evidenceCount?: number;
  }): Promise<MemoryItem> {
    const localItem: MemoryItem = {
      id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      concept: params.concept.trim(),
      category: params.category,
      content: params.content.trim(),
      confidence: Math.min(1.0, Math.max(0.1, params.confidence ?? 0.85)),
      importance: params.importance ?? 0.5,
      lifespan: params.lifespan ?? 'short_term',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastReinforcedAt: Date.now(),
      tags: params.tags || [],
      sourceConversationId: params.sourceConversationId,
      sourceType: (params.sourceType as any) ?? 'explicit',
      evidenceCount: params.evidenceCount ?? 1,
      lastConfirmedAt: Date.now(),
    };

    try {
      const created = await apiFetch<MemoryItem>('/memories', {
        method: 'POST',
        body: JSON.stringify({
          concept: params.concept,
          category: params.category,
          content: params.content,
          confidence: params.confidence,
          importance: params.importance,
          lifespan: params.lifespan,
          tags: params.tags,
          sourceConversationId: params.sourceConversationId,
          sourceType: params.sourceType,
          evidenceCount: params.evidenceCount,
        }),
      });
      this.cache = null;
      return created;
    } catch (err) {
      console.warn('[DOTVEX] Failed to save memory on backend, using local:', (err as Error).message);
      const current = this.getLocalMemories();
      current.unshift(localItem);
      this.setLocalMemories(current);
      this.cache = current;
      return localItem;
    }
  }

  async updateMemory(id: string, updates: Partial<Omit<MemoryItem, 'id' | 'createdAt'>>): Promise<void> {
    try {
      await apiFetch(`/memories/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.warn('[DOTVEX] Failed to update memory on backend:', (err as Error).message);
    }

    const list = this.cache ?? this.getLocalMemories();
    const idx = list.findIndex((m) => m.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates, lastReinforcedAt: Date.now() };
      this.cache = list;
      this.setLocalMemories(list);
    }
  }

  async deleteMemory(id: string): Promise<void> {
    try {
      await apiFetch(`/memories/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('[DOTVEX] Failed to delete memory on backend:', (err as Error).message);
    }

    const list = (this.cache ?? this.getLocalMemories()).filter((m) => m.id !== id);
    this.cache = list;
    this.setLocalMemories(list);
  }

  async clearAll(): Promise<void> {
    try {
      await apiFetch('/memories', { method: 'DELETE' });
    } catch (err) {
      console.warn('[DOTVEX] Failed to clear memories on backend:', (err as Error).message);
    }
    this.cache = null;
    this.setLocalMemories([]);
  }

  async getLearningEvents(memoryId?: string, limit: number = 50): Promise<any[]> {
    try {
      const path = memoryId
        ? `/memories/${encodeURIComponent(memoryId)}/learning-events?limit=${limit}`
        : `/learning-events?limit=${limit}`;
      return await apiFetch<any[]>(path);
    } catch (err) {
      console.warn('[DOTVEX] Failed to fetch learning events:', (err as Error).message);
      return [];
    }
  }

   async getStats(): Promise<CognitionLabStats> {
    try {
      const stats = await apiFetch<CognitionLabStats>('/memories/stats');
      return stats;
    } catch (err) {
      const memories = this.cache ?? this.getLocalMemories();
      const total = memories.length;
      const avgConf = total > 0
        ? memories.reduce((acc, m) => acc + m.confidence, 0) / total
        : 0;
      const uniqueConcepts = new Set(memories.map((m) => m.concept.toLowerCase())).size;
       const avgImp = total > 0
         ? memories.reduce((acc, m) => acc + (m.importance ?? 0.5), 0) / total
         : 0;
       const explicitCount = memories.filter((m) => m.sourceType === 'explicit').length;
       const inferredCount = memories.filter((m) => m.sourceType === 'inferred').length;
       const avgEvidence = total > 0
         ? memories.reduce((acc, m) => acc + (m.evidenceCount ?? 1), 0) / total
         : 0;
       return {
         totalMemories: total,
         activeConcepts: uniqueConcepts,
         averageConfidence: parseFloat(avgConf.toFixed(2)),
         averageImportance: parseFloat(avgImp.toFixed(2)),
         lastUpdated: memories.length > 0 ? Math.max(...memories.map((m) => m.lastReinforcedAt)) : Date.now(),
         explicitCount,
         inferredCount,
         avgEvidenceCount: parseFloat(avgEvidence.toFixed(2)),
       };
    }
  }

   async search(query: string): Promise<MemoryItem[]> {
    try {
      return await apiFetch<MemoryItem[]>(`/memories/search?q=${encodeURIComponent(query)}`);
    } catch (err) {
      const q = query.toLowerCase();
      const memories = this.cache ?? this.getLocalMemories();
      return memories.filter(
        (m) =>
          m.concept.toLowerCase().includes(q) ||
          m.content.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
  }

  async getUserUnderstanding(): Promise<UserUnderstandingProfile> {
    try {
      return await apiFetch<UserUnderstandingProfile>('/user-understanding');
    } catch (err) {
      console.warn('[DOTVEX] Backend unavailable for user understanding:', (err as Error).message);
      const memories = this.cache ?? this.getLocalMemories();
      return this.buildProfileFromMemories(memories);
    }
  }

  async getCommunicationStyle(): Promise<MemoryItem[]> {
    try {
      const data = await apiFetch<{ communicationStyle: MemoryItem[] }>(`/communication-style`);
      return data.communicationStyle;
    } catch (err) {
      console.warn('[DOTVEX] Backend unavailable for communication style:', (err as Error).message);
      const memories = this.cache ?? this.getLocalMemories();
      return memories.filter((m) => m.tags.some((t) => t.includes('communication_style')));
    }
  }

  async getPreferences(): Promise<MemoryItem[]> {
    try {
      const data = await apiFetch<{ preferences: MemoryItem[] }>(`/preferences`);
      return data.preferences;
    } catch (err) {
      console.warn('[DOTVEX] Backend unavailable for preferences:', (err as Error).message);
      const memories = this.cache ?? this.getLocalMemories();
      return memories.filter((m) => m.category === 'preference' && !m.tags.some((t) => t.includes('communication_style')));
    }
  }

  private buildProfileFromMemories(memories: MemoryItem[]): UserUnderstandingProfile {
    const prefs = memories.filter((m) => m.category === 'preference');
    const commStyle = prefs.filter((m) => m.tags.some((t) => t.includes('communication_style')));
    const prefsNoStyle = prefs.filter((m) => !m.tags.some((t) => t.includes('communication_style')));
    const goals = memories.filter((m) => m.category === 'instruction' && m.tags.some((t) => t.includes('goal') || t.includes('aspiration')));
    const projects = memories.filter((m) => m.category === 'project');
    const interests = memories.filter((m) => m.tags.some((t) => t.includes('technology') || t.includes('interest')));
    const instructions = memories.filter((m) => m.category === 'instruction');
    const facts = memories.filter((m) => m.category === 'fact');

    return {
      preferences: prefsNoStyle,
      interests,
      goals,
      projects,
      communicationStyle: commStyle,
      instructions,
      facts,
    };
  }
}

export const cognitionService = new CognitionService();
