/**
 * Structured Logger Utility
 * Provides consistent, structured logging across the application
 * 
 * Usage:
 *   logger.info('User created', { userId: 123, email: 'user@example.com' })
 *   logger.error('Database error', { error: err, context: 'POST /api/users' })
 *   logger.warn('Slow query detected', { duration: 5000, query: 'SELECT...' })
 */

interface LogMetadata {
  [key: string]: any;
}

interface LogEntry {
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
  meta?: LogMetadata;
  timestamp: string;
  environment: string;
  requestId?: string;
}

class Logger {
  private environment: string;

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
  }

  private formatLog(level: string, message: string, meta?: LogMetadata): LogEntry {
    return {
      level: level as 'info' | 'error' | 'warn' | 'debug',
      message,
      meta,
      timestamp: new Date().toISOString(),
      environment: this.environment,
    };
  }

  /**
   * Log informational messages
   */
  info(message: string, meta?: LogMetadata) {
    const logEntry = this.formatLog('info', message, meta);
    console.log(JSON.stringify(logEntry));
  }

  /**
   * Log error messages with full stack traces in development
   */
  error(message: string, meta?: LogMetadata) {
    const logEntry = this.formatLog('error', message, meta);
    console.error(JSON.stringify(logEntry));

    // In production, also send to external service (e.g., Sentry, CloudWatch)
    if (this.environment === 'production') {
      this.sendToExternalService(logEntry);
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, meta?: LogMetadata) {
    const logEntry = this.formatLog('warn', message, meta);
    console.warn(JSON.stringify(logEntry));
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, meta?: LogMetadata) {
    if (this.environment === 'development') {
      const logEntry = this.formatLog('debug', message, meta);
      console.debug(JSON.stringify(logEntry));
    }
  }

  /**
   * Send error logs to external monitoring service
   * Can be extended to send to Sentry, CloudWatch, Datadog, etc.
   */
  private sendToExternalService(logEntry: LogEntry) {
    // TODO: PRODUCTION MONITORING INTEGRATION REQUIRED
    // Choose one of the following and uncomment:
    
    // Option 1: Sentry (Recommended for error tracking)
    // Install: npm install @sentry/nextjs
    // Setup: https://docs.sentry.io/platforms/javascript/guides/nextjs/
    // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    //   Sentry.captureException(new Error(logEntry.message), {
    //     level: logEntry.level,
    //     extra: logEntry.meta,
    //   });
    // }
    
    // Option 2: AWS CloudWatch
    // Install: npm install @aws-sdk/client-cloudwatch-logs
    // if (process.env.AWS_CLOUDWATCH_LOG_GROUP) {
    //   const cloudWatch = new CloudWatchLogsClient({ region: process.env.AWS_REGION });
    //   // Send log to CloudWatch
    // }
    
    // Option 3: Azure Application Insights
    // Install: npm install applicationinsights
    // if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    //   const appInsights = require('applicationinsights');
    //   appInsights.defaultClient.trackException({ exception: new Error(logEntry.message) });
    // }
    
    // For now, log to console in production
    console.warn('External logging not configured:', logEntry.message);
  }
}

// Export singleton instance
export const logger = new Logger();
