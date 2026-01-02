export type LogMeta = Record<string, unknown>;

export function genRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
}

type LogLevel = 'info' | 'error' | 'warn' | 'debug';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatLog(level: LogLevel, message: string, meta?: LogMeta, stack?: string) {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      meta,
      ...(stack ? { stack } : {}),
    } as const;
  }

  private output(entry: ReturnType<Logger['formatLog']>): void {
    if (this.isDevelopment) {
      const colors: Record<LogLevel, string> = {
        info: '\x1b[36m',
        error: '\x1b[31m',
        warn: '\x1b[33m',
        debug: '\x1b[35m',
      };
      const reset = '\x1b[0m';

      // Pretty output in development
      // eslint-disable-next-line no-console
      console.log(`${colors[entry.level]}[${entry.level.toUpperCase()}]${reset} ${entry.message}`, entry.meta || '');
      if ((entry as any).stack) {
        // eslint-disable-next-line no-console
        console.error((entry as any).stack);
      }
    } else {
      // Production: emit JSON for log collectors
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(entry));
    }
  }

  info(message: string, meta?: LogMeta) {
    this.output(this.formatLog('info', message, meta));
  }

  error(message: string, meta?: LogMeta, stack?: string) {
    this.output(this.formatLog('error', message, meta, stack));
  }

  warn(message: string, meta?: LogMeta) {
    this.output(this.formatLog('warn', message, meta));
  }

  debug(message: string, meta?: LogMeta) {
    if (this.isDevelopment) this.output(this.formatLog('debug', message, meta));
  }
}

export const logger = new Logger();

export default logger;
