// src/utils/logger.ts

type LoggerMethod = (...args: any[]) => void;

interface Logger {
  log: LoggerMethod;
  error: (message: string, error?: any) => void;
  warn: LoggerMethod;
  info: LoggerMethod;
}

const logger: Logger = {
  log: (...args: any[]) => {
    if (__DEV__) {
      console.log('[LOG]', ...args);
    }
    // Add production log service here if needed
  },
  
  error: (message: string, error?: any) => {
    if (__DEV__) {
      console.error('[ERROR]', message, error);
    } else {
      // Production error handling:
      // Sentry.captureException(error);
      // or FirebaseCrashlytics().recordError(error);
    }
  },
  
  warn: (...args: any[]) => {
    if (__DEV__) {
      console.warn('[WARN]', ...args);
    }
  },
  
  info: (...args: any[]) => {
    if (__DEV__) {
      console.info('[INFO]', ...args);
    }
  }
};

export default logger;