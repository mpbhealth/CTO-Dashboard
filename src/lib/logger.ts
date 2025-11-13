type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private logEntry(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (this.isDevelopment || (this.isProduction && level === 'error')) {
      const prefix = `[${entry.timestamp.toISOString()}] [${level.toUpperCase()}]`;
      if (context) {
        console[level === 'debug' ? 'log' : level](prefix, message, context);
      } else {
        console[level === 'debug' ? 'log' : level](prefix, message);
      }
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    this.logEntry('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.logEntry('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    };
    this.logEntry('error', message, errorContext);

    // In production, errors should always be logged
    if (this.isProduction && error instanceof Error) {
      console.error(`[PRODUCTION ERROR] ${message}:`, error);
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    if (this.isDevelopment) {
      this.logEntry('debug', message, context);
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  // Convenience methods that match console API
  log(message: string, ...args: unknown[]) {
    if (this.isDevelopment) {
      console.log(message, ...args);
    }
  }

  table(data: unknown) {
    if (this.isDevelopment) {
      console.table(data);
    }
  }

  group(label: string) {
    if (this.isDevelopment) {
      console.group(label);
    }
  }

  groupEnd() {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }
}

export const logger = new Logger();
