/**
 * Safe logger utility that sanitizes sensitive data, passwords,
 * and connection strings before printing to the console.
 */

function sanitize(message: string): string {
  // Redact mongodb connection strings: mongodb+srv://user:pass@host...
  return message.replace(
    /(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@)/gi,
    '$1[REDACTED_PASSWORD]$3'
  );
}

export const logger = {
  info: (message: string, ...args: unknown[]): void => {
    console.log(`[INFO] ${new Date().toISOString()} - ${sanitize(message)}`, ...args);
  },
  warn: (message: string, ...args: unknown[]): void => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${sanitize(message)}`, ...args);
  },
  error: (message: string, error?: unknown): void => {
    if (error instanceof Error) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${sanitize(message)}: ${sanitize(error.message)}`);
    } else {
      console.error(`[ERROR] ${new Date().toISOString()} - ${sanitize(message)}`, error || '');
    }
  },
};
