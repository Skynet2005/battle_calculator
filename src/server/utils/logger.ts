type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
  context?: LogContext;
}

/**
 * Structured logger for server-side code
 *
 * In production, these logs should be sent to a logging service
 * (e.g., Sentry, Datadog, CloudWatch)
 */
export const logger = {
  info: (message: string, context?: LogContext) => {
    const entry: LogEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
    };

    if (context) {
      entry.context = context;
    }

    console.log(JSON.stringify(entry));
  },

  warn: (message: string, context?: LogContext) => {
    const entry: LogEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
    };

    if (context) {
      entry.context = context;
    }

    console.warn(JSON.stringify(entry));
  },

  error: (message: string, error?: Error | unknown, context?: LogContext) => {
    const entry: LogEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
    };

    if (error instanceof Error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    } else if (error) {
      entry.error = {
        message: String(error),
      };
    }

    if (context) {
      entry.context = context;
    }

    console.error(JSON.stringify(entry));
  },

  debug: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV === 'development') {
      const entry: LogEntry = {
        level: 'debug',
        message,
        timestamp: new Date().toISOString(),
      };

      if (context) {
        entry.context = context;
      }

      console.debug(JSON.stringify(entry));
    }
  },
};
