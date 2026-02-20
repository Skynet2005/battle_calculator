/**
 * Client-side logger utility
 *
 * Provides structured logging for client-side code.
 * In production, these logs can be sent to a logging service.
 * Do not log sensitive data (passwords, tokens, PII) with this logger.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  userId?: string;
  component?: string;
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
 * Client-side logger for React components
 *
 * In production, consider sending these logs to a service like Sentry
 */
export const clientLogger = {
  info: (message: string, context?: LogContext) => {
    const entry: LogEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
    };

    if (context) {
      entry.context = context;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify(entry));
    }
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

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Example: Send to error tracking service
      // errorTrackingService.captureException(error, { extra: context });
    }
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
