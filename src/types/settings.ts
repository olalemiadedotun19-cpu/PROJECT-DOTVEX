export type ThemeMode = 'dark' | 'light' | 'system';

export type AccentColor = 'blue' | 'emerald' | 'purple' | 'amber' | 'rose';

export type DotvexModelId =
  | 'dotvex-2.0-pro'
  | 'dotvex-2.0-flash'
  | 'dotvex-2.0-ultra'
  | 'dotvex-custom-api';

export interface AISettings {
  activeModel: DotvexModelId;
  remoteApiEndpoint: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  streamResponse: boolean;
  systemPrompt: string;
  enableReasoningTrace: boolean;
}

export interface VoiceSettings {
  enabled: boolean;
  voiceId: string;
  speed: number;
  pitch: number;
  autoPlayResponse: boolean;
  inputLanguage: string;
  continuousListening: boolean;
}

export interface MemorySettings {
  enableCognitionLab: boolean;
  autoExtractMemories: boolean;
  confidenceThreshold: number; // 0.0 to 1.0
  allowMemoryReinforcement: boolean;
  maxRetainedConcepts: number;
}

export interface PrivacySettings {
  saveHistoryLocally: boolean;
  allowDataDiagnostics: boolean;
  encryptStoredChats: boolean;
  telemetryEnabled: boolean;
}

export interface CustomInstructions {
  aboutUser: string;
  responseStyle: string;
  traits: string[];
}

export interface NotificationSettings {
  push: boolean;
  soundAlerts: boolean;
  scheduledPrompts: boolean;
}

export interface GeneralSettings {
  hapticFeedback: boolean;
  liveMarkdownPreview: boolean;
  codeFontSize: 'small' | 'medium' | 'large';
  autoScroll: boolean;
}

export interface SafetySettings {
  contentFilterLevel: 'standard' | 'strict';
  mathVerification: boolean;
  reasoningGuardrails: boolean;
}

export interface SecuritySettings {
  passkeyEnabled: boolean;
  requirePasswordForExport: boolean;
  sessionTimeoutHours: number;
}

export interface UserSettings {
  theme: ThemeMode;
  accentColor: AccentColor;
  userName: string;
  userEmail: string;
  userInitials: string;
  workspace: string;
  trustedContact: string;
  parentalControlsEnabled: boolean;
  customInstructions: CustomInstructions;
  notifications: NotificationSettings;
  general: GeneralSettings;
  safety: SafetySettings;
  security: SecuritySettings;
  ai: AISettings;
  voice: VoiceSettings;
  memory: MemorySettings;
  privacy: PrivacySettings;
  creatorAttribution: string;
}
