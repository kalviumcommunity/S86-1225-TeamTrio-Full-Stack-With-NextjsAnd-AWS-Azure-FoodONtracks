
/**
 * Structured Logger Utility
 * Provides consistent, environment-aware logging across the application
 * Supports JSON output for production monitoring (CloudWatch/Azure Monitor)
/**
 * Structured Logger Utility
 * Provides consistent, environment-aware logging across the application
 * Supports JSON output for production monitoring (CloudWatch/Azure Monitor)
 * Includes correlation IDs for distributed tracing
 */

type LogLevel = 'info' | 'error' | 'warn' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  environment: string;
  service: string;
  version: string;
  requestId?: string;
  userId?: string | number;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  context?: Record<string, any>;
  meta?: Record<string, any>;
  stack?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private service = 'foodontracks-api';
  private version = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

  /**
   * Generate a unique correlation ID for request tracing
   */
  generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Format log entry as JSON
   */
  private formatLog(
    level: LogLevel,
    message: string,
    options: {
      requestId?: string;
      userId?: string | number;
      endpoint?: string;
      method?: string;
      statusCode?: number;
      duration?: number;
      context?: Record<string, any>;
      meta?: Record<string, any>;
      stack?: string;
    } = {}
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',

      service: this.service,
      version: this.version,
      requestId: options.requestId,
      userId: options.userId,
      endpoint: options.endpoint,
      method: options.method,
      statusCode: options.statusCode,
      duration: options.duration,
      context: options.context,
      meta: options.meta,
      stack: options.stack,
    };
  }

  /**
   * Output log to console (CloudWatch/Azure Monitor will capture this)
   */
  private output(entry: LogEntry): void {
    if (this.isDevelopment) {
      const colors: Record<LogLevel, string> = {
        info: '\x1b[36m',
        error: '\x1b[31m',
        warn: '\x1b[33m',
        debug: '\x1b[35m',
      };
      const reset = '\x1b[0m';

      const logMsg = `${colors[entry.level]}[${entry.level.toUpperCase()}]${reset} ${entry.message}`;
      
      // Show full context and meta in development
      if (entry.context || entry.meta) {
        console.log(logMsg, {
          ...(entry.context && { context: entry.context }),
          ...(entry.meta && { meta: entry.meta }),
        });
      } else {
        console.log(logMsg);
      }

      if (entry.stack) {
        console.error(`${colors.error}${entry.stack}${reset}`);
      }
    } else {
      // Production: JSON output for CloudWatch/Azure Monitor
      console.log(JSON.stringify(entry));
    }
  }

  /**
   * Log info level messages
   */
  info(
    message: string,
    options: {
      requestId?: string;
      userId?: string | number;
      endpoint?: string;
      method?: string;
      statusCode?: number;
      duration?: number;
      context?: Record<string, any>;
      meta?: Record<string, any>;
    } = {}
  ): void {
    const entry = this.formatLog('info', message, options);
    this.output(entry);
  }

  /**
   * Log error level messages
   */
  error(
    message: string,
    error?: Error | unknown,
    options: {
      requestId?: string;
      userId?: string | number;
      endpoint?: string;
      statusCode?: number;
      context?: Record<string, any>;
      meta?: Record<string, any>;
    } = {}
  ): void {
    let errorMessage = '';
    let stack = '';

    if (error instanceof Error) {
      errorMessage = error.message;
      stack = error.stack || '';
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error) {
      errorMessage = String(error);
    }

    const entry = this.formatLog('error', message, {
      ...options,
      stack: stack || options.meta?.stack,
      context: {
        ...options.context,
        errorDetail: errorMessage,
      },
    });
    this.output(entry);
  }

  /**
   * Log warning level messages
   */
  warn(
    message: string,
    options: {
      requestId?: string;
      context?: Record<string, any>;
      meta?: Record<string, any>;
    } = {}
  ): void {
    const entry = this.formatLog('warn', message, options);
    this.output(entry);
  }

  /**
   * Log debug level messages (development only)
   */
  debug(
    message: string,
    options: {
      requestId?: string;
      context?: Record<string, any>;
      meta?: Record<string, any>;
    } = {}
  ): void {
    if (this.isDevelopment) {
      const entry = this.formatLog('debug', message, options);
      this.output(entry);
    }
  }

  /**
   * Log API request with timing and status
   */
  logRequest(
    requestId: string,
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    userId?: string | number,
    error?: Error
  ): void {
    const isError = statusCode >= 400;
    const logFn = isError ? this.error.bind(this) : this.info.bind(this);

    logFn(`${method} ${endpoint} - ${statusCode}`, error, {
      requestId,
      endpoint,
      statusCode,
      userId,
      context: {
        method,
        duration,
        responseTime: `${duration}ms`,
      },
    });
  }
}

export const logger = new Logger();

export default logger;
