import { UserSettings, ThemeMode, AccentColor } from '../../types/settings';

const STORAGE_KEY_SETTINGS = 'dotvex_settings_v3';

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  accentColor: 'blue',
  userName: 'Olalemi Adedotun',
  userEmail: 'olalemiadedotun19@gmail.com',
  userInitials: 'OA',
  workspace: 'Personal',
  trustedContact: 'security@dotvex.ai',
  parentalControlsEnabled: false,
  customInstructions: {
    aboutUser: 'Software engineer & AI architect working on modern distributed systems and creative intelligence.',
    responseStyle: 'Direct, mathematically rigorous, highly structured with clean code and no unnecessary fluff.',
    traits: ['Fast learner', 'TypeScript / React', 'Clean Architecture'],
  },
  notifications: {
    push: true,
    soundAlerts: false,
    scheduledPrompts: true,
  },
  general: {
    hapticFeedback: true,
    liveMarkdownPreview: true,
    codeFontSize: 'medium',
    autoScroll: true,
  },
  safety: {
    contentFilterLevel: 'standard',
    mathVerification: true,
    reasoningGuardrails: true,
  },
  security: {
    passkeyEnabled: true,
    requirePasswordForExport: false,
    sessionTimeoutHours: 72,
  },
  creatorAttribution: 'Dotman (Olalemi Michael Adedotun)',
  ai: {
    activeModel: 'dotvex-2.0-pro',
    remoteApiEndpoint: '',
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 8192,
    streamResponse: true,
    systemPrompt:
      'You are DOTVEX 2.0, the next-generation cognitive AI assistant created by Dotman (Olalemi Michael Adedotun). You are articulate, deep-thinking, precise, and supportive across reasoning, code, and persistent cognition.',
    enableReasoningTrace: true,
  },
  voice: {
    enabled: true,
    voiceId: 'Cove',
    speed: 1.0,
    pitch: 1.0,
    autoPlayResponse: false,
    inputLanguage: 'en-US',
    continuousListening: false,
  },
  memory: {
    enableCognitionLab: true,
    autoExtractMemories: true,
    confidenceThreshold: 0.75,
    allowMemoryReinforcement: true,
    maxRetainedConcepts: 250,
  },
  privacy: {
    saveHistoryLocally: true,
    allowDataDiagnostics: false,
    encryptStoredChats: true,
    telemetryEnabled: false,
  },
};

class SettingsService {
  getSettings(): UserSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw);
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
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  applyTheme(theme: ThemeMode): void {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const root = document.documentElement;
    const body = document.body;

    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
      if (body) {
        body.classList.add('dark');
        body.classList.remove('light');
      }
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
      if (body) {
        body.classList.remove('dark');
        body.classList.add('light');
      }
    }
  }

  applyAccentColor(accent: AccentColor): void {
    const colorMap: Record<AccentColor, string> = {
      blue: '#3b82f6',
      emerald: '#10a37f',
      purple: '#a855f7',
      amber: '#f59e0b',
      rose: '#f43f5e',
    };
    document.documentElement.style.setProperty('--accent-active', colorMap[accent] || '#3b82f6');
  }
}

export const settingsService = new SettingsService();
