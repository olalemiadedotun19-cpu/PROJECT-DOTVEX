import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  ApiClient,
  SettingsService,
  ChatService,
  ConversationService,
  CognitionService,
  UserSettings,
} from '@dotvex/shared';
import { AsyncStorageAdapter } from '../services/storage';
import { MobileVoiceService } from '../services/voice';
import { DotvexTheme, getTheme, ACCENT_COLORS } from '../theme';

export const API_BASE_URL_DEFAULT = 'http://localhost:3000';

interface AppContextType {
  ready: boolean;
  settings: UserSettings;
  theme: DotvexTheme;
  apiBaseUrl: string;
  apiKey: string;
  client: ApiClient;
  settingsService: SettingsService;
  chatService: ChatService;
  conversationService: ConversationService;
  cognitionService: CognitionService;
  voiceService: MobileVoiceService;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  updateApiConfig: (baseUrl: string, apiKey: string) => void;
  isDark: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

const storage = new AsyncStorageAdapter();
const settingsService = new SettingsService(storage);
const voiceService = new MobileVoiceService();

const client = new ApiClient({ baseUrl: API_BASE_URL_DEFAULT });
const chatService = new ChatService(client);
const conversationService = new ConversationService(client);
const cognitionService = new CognitionService(client);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState(API_BASE_URL_DEFAULT);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    (async () => {
      const s = await settingsService.getSettings();
      setSettings(s);
      const base = s.ai.remoteApiEndpoint || API_BASE_URL_DEFAULT;
      setApiBaseUrl(base);
      client.setBaseUrl(base);
      setReady(true);
    })();
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      if (!settings) return;
      const next = { ...settings, ...updates };
      setSettings(next);
      await settingsService.saveSettings(next);
      if (updates.ai?.remoteApiEndpoint && updates.ai.remoteApiEndpoint !== apiBaseUrl) {
        setApiBaseUrl(updates.ai.remoteApiEndpoint);
        client.setBaseUrl(updates.ai.remoteApiEndpoint);
      }
    },
    [settings, apiBaseUrl]
  );

  const updateApiConfig = useCallback(
    (baseUrl: string, key: string) => {
      setApiBaseUrl(baseUrl);
      setApiKey(key);
      client.setBaseUrl(baseUrl);
      client.setApiKey(key);
    },
    []
  );

  if (!ready || !settings) {
    return null;
  }

  const accentColor = ACCENT_COLORS[settings.accentColor] || ACCENT_COLORS.blue;
  const themeColors = getTheme(settings.theme === 'dark');
  themeColors.colors.accent = accentColor;
  themeColors.colors.primary = accentColor;
  themeColors.colors.iconActive = accentColor;

  const value: AppContextType = {
    ready,
    settings,
    theme: themeColors,
    apiBaseUrl,
    apiKey,
    client,
    settingsService,
    chatService,
    conversationService,
    cognitionService,
    voiceService,
    updateSettings,
    updateApiConfig,
    isDark: settings.theme === 'dark',
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
