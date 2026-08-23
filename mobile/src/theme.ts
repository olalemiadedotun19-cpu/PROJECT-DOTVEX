export interface DotvexTheme {
  dark: boolean;
  colors: {
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

const darkTheme: DotvexTheme = {
  dark: true,
  colors: {
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

const lightTheme: DotvexTheme = {
  dark: false,
  colors: {
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

export function getTheme(dark: boolean): DotvexTheme {
  return dark ? darkTheme : lightTheme;
}

export const ACCENT_COLORS: Record<string, string> = {
  blue: '#3b82f6',
  emerald: '#10a37f',
  purple: '#a855f7',
  amber: '#f59e0b',
  rose: '#f43f5e',
};
