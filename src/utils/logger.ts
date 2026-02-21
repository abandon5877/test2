/**
 * 日志系统
 * 提供统一的日志记录接口，支持不同日志级别
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  prefix?: string;
}

class Logger {
  private static instance: Logger;
  private config: LoggerConfig = {
    level: LogLevel.DEBUG,
    enableConsole: true
  };

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private formatMessage(level: string, message: string, prefix?: string): string {
    const timestamp = new Date().toISOString();
    const prefixStr = prefix || this.config.prefix || '';
    return `[${timestamp}] [${level}]${prefixStr ? ` [${prefixStr}]` : ''} ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG) && this.config.enableConsole) {
      console.log(this.formatMessage('DEBUG', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO) && this.config.enableConsole) {
      console.log(this.formatMessage('INFO', message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN) && this.config.enableConsole) {
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR) && this.config.enableConsole) {
      console.error(this.formatMessage('ERROR', message), ...args);
    }
  }

  // 创建带前缀的日志记录器
  createChildLogger(prefix: string): Logger {
    const childLogger = new Logger();
    childLogger.configure({
      ...this.config,
      prefix
    });
    return childLogger;
  }
}

// 导出单例
export const logger = Logger.getInstance();

// 导出便捷函数
export const logDebug = (message: string, ...args: unknown[]) => logger.debug(message, ...args);
export const logInfo = (message: string, ...args: unknown[]) => logger.info(message, ...args);
export const logWarn = (message: string, ...args: unknown[]) => logger.warn(message, ...args);
export const logError = (message: string, ...args: unknown[]) => logger.error(message, ...args);

// 模块日志记录器工厂
export function createModuleLogger(moduleName: string) {
  return logger.createChildLogger(moduleName);
}
