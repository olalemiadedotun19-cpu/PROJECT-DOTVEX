export interface DotvexTheme {
  dark: boolean;
  colors: {
    background: string;
    surface: string;
    surfaceVariant: string;
    card: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    accent: string;
    accentText: string;
    inputBackground: string;
    userBubble: string;
    userBubbleText: string;
    assistantBubble: string;
    assistantBubbleText: string;
    primary: string;
    primaryText: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    disabled: string;
    backdrop: string;
    notification: string;
    divider: string;
    icon: string;
    iconActive: string;
    buttonDisabled: string;
    separator: string;
    elevation: {
      level0: string;
      level1: string;
      level2: string;
      level3: string;
      level4: string;
    };
  };
}

const darkColors: DotvexTheme['colors'] = {
  background: '#090a0f',
  surface: '#12151e',
  surfaceVariant: '#1a1f2c',
  card: '#151822',
  text: '#ececec',
  textSecondary: '#b4b4b4',
  textMuted: '#737373',
  border: '#1e2433',
  accent: '#3b82f6',
  accentText: '#ffffff',
  inputBackground: '#181c28',
  userBubble: '#2f2f2f',
  userBubbleText: '#ececec',
  assistantBubble: '#212121',
  assistantBubbleText: '#ececec',
  primary: '#3b82f6',
  primaryText: '#ffffff',
  error: '#f43f5e',
  success: '#10a37f',
  warning: '#f59e0b',
  info: '#3b82f6',
  disabled: '#3a3a3a',
  backdrop: '#121212',
  notification: '#ff3b30',
  divider: '#1e2433',
  icon: '#737373',
  iconActive: '#3b82f6',
  buttonDisabled: '#2a2a2a',
  separator: '#1e2433',
  elevation: {
    level0: '#090a0f',
    level1: '#12151e',
    level2: '#1a1f2c',
    level3: '#1e2433',
    level4: '#252a38',
  },
};

const lightColors: DotvexTheme['colors'] = {
  background: '#ffffff',
  surface: '#f9fafb',
  surfaceVariant: '#f3f4f6',
  card: '#ffffff',
  text: '#09090b',
  textSecondary: '#52525b',
  textMuted: '#71717a',
  border: '#e4e4e7',
  accent: '#3b82f6',
  accentText: '#ffffff',
  inputBackground: '#f4f4f5',
  userBubble: '#09090b',
  userBubbleText: '#ffffff',
  assistantBubble: '#f4f4f5',
  assistantBubbleText: '#09090b',
  primary: '#3b82f6',
  primaryText: '#ffffff',
  error: '#f43f5e',
  success: '#10a37f',
  warning: '#f59e0b',
  info: '#3b82f6',
  disabled: '#d4d4d8',
  backdrop: '#ffffff',
  notification: '#ff3b30',
  divider: '#e4e4e7',
  icon: '#71717a',
  iconActive: '#3b82f6',
  buttonDisabled: '#e4e4e7',
  separator: '#e4e4e7',
  elevation: {
    level0: '#ffffff',
    level1: '#f9fafb',
    level2: '#f3f4f6',
    level3: '#e4e4e7',
    level4: '#d4d4d8',
  },
};

export function getTheme(dark: boolean): DotvexTheme {
  return {
    dark,
    colors: dark ? darkColors : lightColors,
  };
}

export const ACCENT_COLORS: Record<string, string> = {
  blue: '#3b82f6',
  emerald: '#10a37f',
  purple: '#a855f7',
  amber: '#f59e0b',
  rose: '#f43f5e',
};
