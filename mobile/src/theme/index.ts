export type ThemeMode = 'dark' | 'light' | 'system';

export interface DotvexTheme {
  dark: boolean;
  cognitionLab: boolean;
  colors: {
    dark: boolean;
    bgMain: string;
    bgSidebar: string;
    bgCard: string;
    bgComposer: string;
    bgInput: string;
    borderMain: string;
    borderSubtle: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentText: string;
    userBubble: string;
    userBubbleText: string;
    assistantBubble: string;
    assistantBubbleText: string;
    iconMuted: string;
    error: string;
    success: string;
    warning: string;
    amber: string;
    emerald: string;
    blue: string;
    purple: string;
    red: string;
  };
}

const mainDark: DotvexTheme = {
  dark: true,
  cognitionLab: false,
  colors: {
    dark: true,
    bgMain: '#212121',
    bgSidebar: '#171717',
    bgCard: '#2f2f2f',
    bgComposer: '#2f2f2f',
    bgInput: '#2f2f2f',
    borderMain: '#333333',
    borderSubtle: '#383838',
    textPrimary: '#ececec',
    textSecondary: '#b4b4b4',
    textMuted: '#737373',
    accent: '#10a37f',
    accentText: '#ffffff',
    userBubble: '#2f2f2f',
    userBubbleText: '#ececec',
    assistantBubble: '#212121',
    assistantBubbleText: '#ececec',
    iconMuted: '#737373',
    error: '#f43f5e',
    success: '#10a37f',
    warning: '#f59e0b',
    amber: '#f59e0b',
    emerald: '#10a37f',
    blue: '#3b82f6',
    purple: '#a855f7',
    red: '#f43f5e',
  },
};

const mainLight: DotvexTheme = {
  dark: false,
  cognitionLab: false,
  colors: {
    dark: false,
    bgMain: '#ffffff',
    bgSidebar: '#f9f9f9',
    bgCard: '#f3f3f3',
    bgComposer: '#f4f4f4',
    bgInput: '#f4f4f4',
    borderMain: '#e5e5e5',
    borderSubtle: '#eeeeee',
    textPrimary: '#0d0d0d',
  textSecondary: '#5d5d5d',
    textMuted: '#8e8e8e',
    accent: '#10a37f',
    accentText: '#ffffff',
    userBubble: '#f4f4f4',
    userBubbleText: '#0d0d0d',
    assistantBubble: '#ffffff',
    assistantBubbleText: '#0d0d0d',
    iconMuted: '#8e8e8e',
    error: '#f43f5e',
    success: '#10a37f',
    warning: '#f59e0b',
    amber: '#f59e0b',
    emerald: '#10a37f',
    blue: '#3b82f6',
    purple: '#a855f7',
    red: '#f43f5e',
  },
};

const cognitionLabDark: DotvexTheme = {
  dark: true,
  cognitionLab: true,
  colors: {
    dark: true,
    bgMain: '#090a0f',
    bgSidebar: '#171717',
    bgCard: '#12151e',
    bgComposer: '#12151e',
    bgInput: '#181c28',
    borderMain: '#1a1f2c',
    borderSubtle: '#1e2433',
    textPrimary: '#ececec',
    textSecondary: '#b4b4b4',
    textMuted: '#737373',
    accent: '#3b82f6',
    accentText: '#ffffff',
    userBubble: '#12151e',
    userBubbleText: '#ececec',
    assistantBubble: '#090a0f',
    assistantBubbleText: '#ececec',
    iconMuted: '#737373',
    error: '#f43f5e',
    success: '#10a37f',
    warning: '#f59e0b',
    amber: '#f59e0b',
    emerald: '#10a37f',
    blue: '#3b82f6',
    purple: '#a855f7',
    red: '#f43f5e',
  },
};

const cognitionLabLight: DotvexTheme = {
  dark: false,
  cognitionLab: true,
  colors: {
    dark: false,
    bgMain: '#f5f5f5',
    bgSidebar: '#f9f9f9',
    bgCard: '#ffffff',
    bgComposer: '#ffffff',
    bgInput: '#f9f9fa',
    borderMain: '#e5e5e5',
    borderSubtle: '#eeeeee',
    textPrimary: '#111827',
    textSecondary: '#374151',
    textMuted: '#6b7280',
    accent: '#3b82f6',
    accentText: '#ffffff',
    userBubble: '#ffffff',
    userBubbleText: '#111827',
    assistantBubble: '#f5f5f5',
    assistantBubbleText: '#111827',
    iconMuted: '#9ca3af',
    error: '#f43f5e',
    success: '#10a37f',
    warning: '#f59e0b',
    amber: '#f59e0b',
    emerald: '#10a37f',
    blue: '#3b82f6',
    purple: '#a855f7',
    red: '#f43f5e',
  },
};

export function getTheme(
  mode: ThemeMode,
  systemPrefersDark: boolean,
  cognitionLab = false
): DotvexTheme {
  const dark =
    mode === 'dark' || (mode === 'system' && systemPrefersDark);
  if (cognitionLab) {
    return dark ? cognitionLabDark : cognitionLabLight;
  }
  return dark ? mainDark : mainLight;
}

export const ACCENT_COLORS: Record<string, string> = {
  blue: '#3b82f6',
  emerald: '#10a37f',
  purple: '#a855f7',
  amber: '#f59e0b',
  rose: '#f43f5e',
};
