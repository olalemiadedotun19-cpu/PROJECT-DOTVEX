import { UserSettings, ThemeMode, AccentColor } from '../types/settings';

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

export const ACCENT_COLOR_MAP: Record<AccentColor, string> = {
  blue: '#3b82f6',
  emerald: '#10a37f',
  purple: '#a855f7',
  amber: '#f59e0b',
  rose: '#f43f5e',
};

export const MODEL_METADATA: Record<
  string,
  { name: string; tag: string; description: string; color: string }
> = {
  'dotvex-2.0-pro': {
    name: 'DOTVEX 2.0 Pro',
    tag: 'Default',
    description: 'Smart reasoning and multimodal intelligence for all everyday tasks',
    color: 'text-emerald-400',
  },
  'dotvex-2.0-flash': {
    name: 'DOTVEX 2.0 Flash',
    tag: 'Fast',
    description: 'Lightning-fast responses with ultra-low latency execution',
    color: 'text-cyan-400',
  },
  'dotvex-2.0-ultra': {
    name: 'DOTVEX 2.0 Ultra',
    tag: 'Deep Reasoning',
    description: 'Advanced multi-step reasoning, complex code generation and math',
    color: 'text-purple-400',
  },
  'dotvex-custom-api': {
    name: 'DOTVEX Custom Endpoint',
    tag: 'Custom',
    description: 'Connected to custom local or remote cognitive endpoint',
    color: 'text-amber-400',
  },
};

export function isDarkTheme(theme: ThemeMode, systemPrefersDark: boolean): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return systemPrefersDark;
}
