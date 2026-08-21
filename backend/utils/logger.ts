type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLogLevel = LOG_LEVELS[(process.env.LOG_LEVEL as LogLevel) || 'info'];

function formatLog(entry: LogEntry): string {
  const ts = new Date(entry.timestamp).toISOString();
  let line = `[${ts}] [${entry.level.toUpperCase()}] [DOTVEX] ${entry.message}`;

  if (entry.data && Object.keys(entry.data).length > 0) {
    const dataStr = JSON.stringify(entry.data, null, 2);
    line += `\n  Data: ${dataStr}`;
  }

  return line;
}

export function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  if (LOG_LEVELS[level] > currentLogLevel) return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: Date.now(),
    data,
  };

  const formatted = formatLog(entry);

  if (level === 'error') {
    console.error(formatted);
  } else if (level === 'warn') {
    console.warn(formatted);
  } else if (level === 'debug') {
    console.debug(formatted);
  } else {
    console.log(formatted);
  }
}

export const logger = {
  info: (message: string, data?: Record<string, unknown>) => log('info', message, data),
  warn: (message: string, data?: Record<string, unknown>) => log('warn', message, data),
  error: (message: string, data?: Record<string, unknown>) => log('error', message, data),
  debug: (message: string, data?: Record<string, unknown>) => log('debug', message, data),
};
