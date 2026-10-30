export class Logger {
  private static formatTime(): string {
    return new Date().toLocaleTimeString('vi-VN', { hour12: false });
  }

  static info(message: string, ...args: unknown[]): void {
    console.log(`\x1b[90m[${this.formatTime()}]\x1b[0m \x1b[36mℹ INFO\x1b[0m  ${message}`, ...args);
  }

  static success(message: string, ...args: unknown[]): void {
    console.log(`\x1b[90m[${this.formatTime()}]\x1b[0m \x1b[32m✔ SUCCESS\x1b[0m ${message}`, ...args);
  }

  static warn(message: string, ...args: unknown[]): void {
    console.warn(`\x1b[90m[${this.formatTime()}]\x1b[0m \x1b[33m⚠ WARN\x1b[0m  ${message}`, ...args);
  }

  static error(message: string, ...args: unknown[]): void {
    console.error(`\x1b[90m[${this.formatTime()}]\x1b[0m \x1b[31m✖ ERROR\x1b[0m ${message}`, ...args);
  }

  static job(message: string, ...args: unknown[]): void {
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
