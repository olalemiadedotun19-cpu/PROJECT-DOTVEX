import { ApiClient } from './apiClient';
import { Conversation, GroupedConversations } from '../types/conversation';
import { ChatMessage } from '../types/chat';

export class ConversationService {
  private client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  setClient(client: ApiClient): void {
    this.client = client;
  }

  async getConversations(): Promise<Conversation[]> {
    return this.client.get<Conversation[]>('/api/conversations');
  }

  async createConversation(title: string = 'New chat'): Promise<Conversation> {
    return this.client.post<Conversation>('/api/conversations', { title });
  }

  async getConversation(id: string): Promise<Conversation> {
    return this.client.get<Conversation>(`/api/conversations/${encodeURIComponent(id)}`);
  }

  async updateConversation(id: string, updates: { title?: string; isPinned?: boolean }): Promise<void> {
    await this.client.patch(`/api/conversations/${encodeURIComponent(id)}`, updates);
  }

  async togglePin(id: string): Promise<void> {
    const conv = await this.getConversation(id);
    await this.updateConversation(id, { isPinned: !conv?.isPinned });
  }

  async deleteConversation(id: string): Promise<void> {
    await this.client.delete(`/api/conversations/${encodeURIComponent(id)}`);
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    return this.client.get<ChatMessage[]>(
      `/api/conversations/${encodeURIComponent(conversationId)}/messages`
    );
  }

  async saveMessages(conversationId: string, messages: ChatMessage[]): Promise<void> {
    await this.client.post(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, {
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      })),
    });
  }

  async saveMessage(conversationId: string, message: ChatMessage): Promise<void> {
    await this.client.post(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, {
      messages: [
        {
          id: message.id,
          role: message.role,
          content: message.content,
          timestamp: message.timestamp,
        },
      ],
    });
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
}
