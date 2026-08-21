import { StorageAdapter, MemoryStorageAdapter } from './storage';
import { UserSettings } from '../types/settings';
import { DEFAULT_SETTINGS } from '../config/settings';

const SETTINGS_KEY = 'dotvex_settings_v3';

export class SettingsService {
  private storage: StorageAdapter;

  constructor(storage?: StorageAdapter) {
    this.storage = storage || new MemoryStorageAdapter();
  }

  async getSettings(): Promise<UserSettings> {
    try {
      const raw = await this.storage.getItem(SETTINGS_KEY);
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw);
      return this.mergeSettings(parsed);
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    try {
      await this.storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  private mergeSettings(parsed: any): UserSettings {
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      customInstructions: {
        ...DEFAULT_SETTINGS.customInstructions,
        ...(parsed.customInstructions || {}),
      },
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...(parsed.notifications || {}),
      },
      general: {
        ...DEFAULT_SETTINGS.general,
        ...(parsed.general || {}),
      },
      safety: {
        ...DEFAULT_SETTINGS.safety,
        ...(parsed.safety || {}),
      },
      security: {
        ...DEFAULT_SETTINGS.security,
        ...(parsed.security || {}),
      },
      ai: { ...DEFAULT_SETTINGS.ai, ...(parsed.ai || {}) },
      voice: { ...DEFAULT_SETTINGS.voice, ...(parsed.voice || {}) },
      memory: { ...DEFAULT_SETTINGS.memory, ...(parsed.memory || {}) },
      privacy: { ...DEFAULT_SETTINGS.privacy, ...(parsed.privacy || {}) },
    };
  }
}
