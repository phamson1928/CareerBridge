export interface LogEntry {
  id: number;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error' | 'job';
  message: string;
}

export class Logger {
  private static readonly MAX_LOGS = 200;
  private static logHistory: LogEntry[] = [];
  private static nextId = 1;

  private static formatTime(): string {
    return new Date().toLocaleTimeString('vi-VN', { hour12: false });
  }

  private static pushLog(level: LogEntry['level'], message: string): void {
    const entry: LogEntry = {
      id: this.nextId++,
      timestamp: this.formatTime(),
      level,
      message,
    };
    this.logHistory.push(entry);
    if (this.logHistory.length > this.MAX_LOGS) {
      this.logHistory.shift();
    }
  }

  static getRecentLogs(limit = 100): LogEntry[] {
    return this.logHistory.slice(-limit);
  }

  static clearLogs(): void {
    this.logHistory = [];
  }

  static info(message: string, ...args: unknown[]): void {
    const fullMsg = args.length > 0 ? `${message} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}` : message;
    this.pushLog('info', fullMsg);
    console.log(`\x1b[90m[${this.formatTime()}]\x1b[0m \x1b[36mℹ INFO\x1b[0m  ${message}`, ...args);
  }

  static success(message: string, ...args: unknown[]): void {
    const fullMsg = args.length > 0 ? `${message} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}` : message;
    this.pushLog('success', fullMsg);
    console.log(`\x1b[90m[${this.formatTime()}]\x1b[0m \x1b[32m✔ SUCCESS\x1b[0m ${message}`, ...args);
  }

  static warn(message: string, ...args: unknown[]): void {
    const fullMsg = args.length > 0 ? `${message} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}` : message;
    this.pushLog('warn', fullMsg);
    console.warn(`\x1b[90m[${this.formatTime()}]\x1b[0m \x1b[33m⚠ WARN\x1b[0m  ${message}`, ...args);
  }

  static error(message: string, ...args: unknown[]): void {
    const fullMsg = args.length > 0 ? `${message} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}` : message;
    this.pushLog('error', fullMsg);
    console.error(`\x1b[90m[${this.formatTime()}]\x1b[0m \x1b[31m✖ ERROR\x1b[0m ${message}`, ...args);
  }

  static job(message: string, ...args: unknown[]): void {
    const fullMsg = args.length > 0 ? `${message} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}` : message;
    this.pushLog('job', fullMsg);
    console.log(`\x1b[90m[${this.formatTime()}]\x1b[0m \x1b[35m⚡ JOB\x1b[0m   ${message}`, ...args);
  }

  static banner(title: string, subtitle?: string): void {
    console.log('\n\x1b[34m======================================================================\x1b[0m');
    console.log(`\x1b[1m\x1b[36m   ${title}\x1b[0m`);
    if (subtitle) {
      console.log(`\x1b[90m   ${subtitle}\x1b[0m`);
    }
    console.log('\x1b[34m======================================================================\x1b[0m\n');
  }
}
