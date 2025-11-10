/**
 * Centralized logging utility with structured logging support
 * Provides consistent error handling and debugging across the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  /**
   * Log debug information (only in development)
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || '');
    }
  }

  /**
   * Log general information
   */
  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || '');
    }
  }

  /**
   * Log warnings
   */
  warn(message: string, context?: LogContext) {
    console.warn(`[WARN] ${message}`, context || '');
  }

  /**
   * Log errors with full context
   */
  error(message: string, error?: any, context?: LogContext) {
    console.error(`[ERROR] ${message}`, {
      error: error?.message || error,
      stack: error?.stack,
      ...context
    });
  }

  /**
   * Log API errors with structured data
   */
  apiError(endpoint: string, error: any, context?: LogContext) {
    this.error(`API Error: ${endpoint}`, error, {
      endpoint,
      ...context
    });
  }

  /**
   * Log database errors with query context
   */
  dbError(operation: string, table: string, error: any, context?: LogContext) {
    this.error(`Database Error: ${operation} on ${table}`, error, {
      operation,
      table,
      ...context
    });
  }

  /**
   * Log component lifecycle events (development only)
   */
  component(componentName: string, event: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.debug(`${componentName}: ${event}`, context);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience methods
export const logDebug = logger.debug.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);
export const logApiError = logger.apiError.bind(logger);
export const logDbError = logger.dbError.bind(logger);
export const logComponent = logger.component.bind(logger);
