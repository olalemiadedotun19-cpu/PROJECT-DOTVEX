import { Conversation, GroupedConversations, ProjectFolder, ScheduledTask, LibraryItem } from '../../types/conversation';
import { ChatMessage } from '../../types/chat';
import { API_BASE_URL, getApiHeaders } from './config';

const STORAGE_KEY_CONVERSATIONS = 'dotvex_conversations_v3';
const STORAGE_KEY_MESSAGES_PREFIX = 'dotvex_messages_v3_';
const STORAGE_KEY_PROJECTS = 'dotvex_projects_v1';
const STORAGE_KEY_SCHEDULED = 'dotvex_scheduled_v1';
const STORAGE_KEY_LIBRARY = 'dotvex_library_v1';

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

class ConversationService {
  private cache: Conversation[] | null = null;
  private messageCache: Map<string, ChatMessage[]> = new Map();

  async getConversations(): Promise<Conversation[]> {
    try {
      const data = await apiFetch<Conversation[]>('/conversations');
      this.cache = data;
      this.cacheToLocal(data);
      return data;
    } catch (err) {
      console.warn('[DOTVEX] Backend unavailable, falling back to localStorage for conversations:', (err as Error).message);
      return this.getLocalConversations();
    }
  }

  saveConversations(conversations: Conversation[]): void {
    this.cache = conversations;
    this.cacheToLocal(conversations);
  }

  private getLocalConversations(): Conversation[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      if (!raw) return [];
      return JSON.parse(raw) as Conversation[];
    } catch {
      return [];
    }
  }

  private cacheToLocal(conversations: Conversation[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations));
    } catch (e) {
      console.error('Failed to cache conversations:', e);
    }
  }

  async createConversation(title = 'New chat'): Promise<Conversation> {
    const newConv: Conversation = {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastMessagePreview: '',
      isPinned: false,
    };

    try {
      const created = await apiFetch<Conversation>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ title }),
      });
      this.cache = null;
      this.messageCache.delete(created.id);
      return created;
    } catch (err) {
      console.warn('[DOTVEX] Failed to create conversation on backend, using local:', (err as Error).message);
      const current = this.getLocalConversations();
      current.unshift(newConv);
      this.cacheToLocal(current);
      return newConv;
    }
  }

  async togglePin(id: string): Promise<void> {
    const list = await this.getConversations();
    const target = list.find((c) => c.id === id);
    if (!target) return;

    try {
      await apiFetch(`/conversations/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPinned: !target.isPinned }),
      });
    } catch (err) {
      console.warn('[DOTVEX] Failed to toggle pin on backend:', (err as Error).message);
    }

    target.isPinned = !target.isPinned;
    this.cache = list;
    this.cacheToLocal(list);
  }

  async updateTitle(id: string, newTitle: string): Promise<void> {
    const list = await this.getConversations();
    const target = list.find((c) => c.id === id);
    if (!target) return;

    try {
      await apiFetch(`/conversations/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: newTitle }),
      });
    } catch (err) {
      console.warn('[DOTVEX] Failed to update title on backend:', (err as Error).message);
    }

    target.title = newTitle;
    target.updatedAt = Date.now();
    this.cache = list;
    this.cacheToLocal(list);
  }

  async deleteConversation(id: string): Promise<void> {
    try {
      await apiFetch(`/conversations/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('[DOTVEX] Failed to delete conversation on backend:', (err as Error).message);
    }

    const list = this.getLocalConversations().filter((c) => c.id !== id);
    this.cache = list;
    this.cacheToLocal(list);
    localStorage.removeItem(STORAGE_KEY_MESSAGES_PREFIX + id);
    this.messageCache.delete(id);
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const data = await apiFetch<ChatMessage[]>(`/conversations/${encodeURIComponent(conversationId)}/messages`);
      this.messageCache.set(conversationId, data);
      this.cacheMessagesLocally(conversationId, data);
      return data;
    } catch (err) {
      console.warn('[DOTVEX] Backend unavailable, falling back to localStorage for messages:', (err as Error).message);
      return this.getLocalMessages(conversationId);
    }
  }

  private getLocalMessages(conversationId: string): ChatMessage[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_MESSAGES_PREFIX + conversationId);
      if (!raw) return [];
      return JSON.parse(raw) as ChatMessage[];
    } catch {
      return [];
    }
  }

  private cacheMessagesLocally(conversationId: string, messages: ChatMessage[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_MESSAGES_PREFIX + conversationId, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to cache messages:', e);
    }
  }

  async saveMessages(conversationId: string, messages: ChatMessage[]): Promise<void> {
    this.cacheMessagesLocally(conversationId, messages);
    this.messageCache.set(conversationId, messages);

    try {
      await apiFetch(`/conversations/${encodeURIComponent(conversationId)}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          messages: messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
          })),
        }),
      });
    } catch (err) {
      console.warn('[DOTVEX] Failed to save messages on backend:', (err as Error).message);
    }

    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      const preview = lastMsg.content ? lastMsg.content.substring(0, 80) : '';
      const list = this.getLocalConversations();
      const conv = list.find((c) => c.id === conversationId);
      if (conv) {
        conv.lastMessagePreview = preview;
        conv.updatedAt = Date.now();
        if (conv.title === 'New chat' && messages[0]?.role === 'user') {
          conv.title = messages[0].content.slice(0, 36) || 'New chat';
        }
        this.cache = list;
        this.cacheToLocal(list);
      }
    }
  }

  async saveMessage(conversationId: string, message: ChatMessage): Promise<void> {
    const existing = this.messageCache.get(conversationId) ?? this.getLocalMessages(conversationId);
    const idx = existing.findIndex((m) => m.id === message.id);
    if (idx >= 0) {
      existing[idx] = message;
    } else {
      existing.push(message);
    }
    this.messageCache.set(conversationId, existing);
    this.cacheMessagesLocally(conversationId, existing);

    try {
      await apiFetch(`/conversations/${encodeURIComponent(conversationId)}/messages`, {
        method: 'POST',
        body: JSON.stringify({ messages: [message] }),
      });
    } catch (err) {
      console.warn('[DOTVEX] Failed to save message on backend:', (err as Error).message);
    }
  }

  groupConversations(conversations: Conversation[]): GroupedConversations[] {
    const unpinned = conversations.filter((c) => !c.isPinned);
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const prev7: Conversation[] = [];
    const prev30: Conversation[] = [];
    const older: Conversation[] = [];

    unpinned.forEach((conv) => {
      const diff = now - conv.updatedAt;
      if (diff < ONE_DAY) {
        today.push(conv);
      } else if (diff < 2 * ONE_DAY) {
        yesterday.push(conv);
      } else if (diff < 7 * ONE_DAY) {
        prev7.push(conv);
      } else if (diff < 30 * ONE_DAY) {
        prev30.push(conv);
      } else {
        older.push(conv);
      }
    });

    const groups: GroupedConversations[] = [];
    if (today.length) groups.push({ group: 'Today', conversations: today });
    if (yesterday.length) groups.push({ group: 'Yesterday', conversations: yesterday });
    if (prev7.length) groups.push({ group: 'Previous 7 Days', conversations: prev7 });
    if (prev30.length) groups.push({ group: 'Previous 30 Days', conversations: prev30 });
    if (older.length) groups.push({ group: 'Older', conversations: older });

    return groups;
  }

  getLibraryItems(): LibraryItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LIBRARY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  addLibraryItem(item: Omit<LibraryItem, 'id' | 'createdAt'>): LibraryItem {
    const newItem: LibraryItem = {
      ...item,
      id: 'lib_' + Date.now(),
      createdAt: Date.now(),
    };
    const list = this.getLibraryItems();
    list.unshift(newItem);
    localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(list));
    return newItem;
  }

  deleteLibraryItem(id: string): void {
    const list = this.getLibraryItems().filter((i) => i.id !== id);
    localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(list));
  }

  getScheduledTasks(): ScheduledTask[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SCHEDULED);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  addScheduledTask(task: Omit<ScheduledTask, 'id'>): ScheduledTask {
    const newTask: ScheduledTask = {
      ...task,
      id: 'sched_' + Date.now(),
    };
    const list = this.getScheduledTasks();
    list.unshift(newTask);
    localStorage.setItem(STORAGE_KEY_SCHEDULED, JSON.stringify(list));
    return newTask;
  }

  deleteScheduledTask(id: string): void {
    const list = this.getScheduledTasks().filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY_SCHEDULED, JSON.stringify(list));
  }

  getProjects(): ProjectFolder[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  createProject(name: string, description = ''): ProjectFolder {
    const newProj: ProjectFolder = {
      id: 'proj_' + Date.now(),
      name,
      description,
      createdAt: Date.now(),
      conversationIds: [],
    };
    const list = this.getProjects();
    list.unshift(newProj);
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(list));
    return newProj;
  }

  deleteProject(id: string): void {
    const list = this.getProjects().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(list));
  }
}

export const conversationService = new ConversationService();
