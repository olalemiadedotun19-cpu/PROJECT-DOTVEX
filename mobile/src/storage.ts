import AsyncStorage from '@react-native-async-storage/async-storage';
import { Conversation, MemoryItem, UserSettings } from './types';
import { DEFAULT_SETTINGS } from './types';

const CONVERSATIONS_KEY = 'dotvex_conversations';
const MEMORIES_KEY = 'dotvex_memories';
const SETTINGS_KEY = 'dotvex_settings';

export class StorageService {
  async getConversations(): Promise<Conversation[]> {
    try {
      const data = await AsyncStorage.getItem(CONVERSATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  async saveConversations(conversations: Conversation[]): Promise<void> {
    await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  }

  async getMemories(): Promise<MemoryItem[]> {
    try {
      const data = await AsyncStorage.getItem(MEMORIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  async saveMemories(memories: MemoryItem[]): Promise<void> {
    await AsyncStorage.setItem(MEMORIES_KEY, JSON.stringify(memories));
  }

  async getSettings(): Promise<UserSettings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
}

export const storage = new StorageService();
