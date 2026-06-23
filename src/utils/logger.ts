import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import { config } from '../config/config';

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'authorization',
  'x-api-key',
  'secret',
  'apikey',
]);
const LOGS_DIR = path.resolve(process.cwd(), 'logs');

fs.mkdirSync(LOGS_DIR, { recursive: true });

function maskSensitive(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(maskSensitive);
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
      k,
      SENSITIVE_KEYS.has(k.toLowerCase()) ? '[MASKED]' : maskSensitive(v),
    ]),
  );
}

const winstonLogger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new winston.transports.File({ filename: path.join(LOGS_DIR, 'test.log') }),
    new winston.transports.File({ filename: path.join(LOGS_DIR, 'error.log'), level: 'error' }),
  ],
});

export const logger = {
  info: (msg: string, meta?: unknown) => winstonLogger.info(msg, { meta }),
  warn: (msg: string, meta?: unknown) => winstonLogger.warn(msg, { meta }),
  error: (msg: string, meta?: unknown) => winstonLogger.error(msg, { meta }),

  logRequest(method: string, url: string, headers?: unknown, body?: unknown): void {
    winstonLogger.info('→ REQUEST', {
      method,
      url,
      headers: maskSensitive(headers),
      body: maskSensitive(body),
    });
  },

  logResponse(status: number, body: unknown, elapsedMs: number): void {
    winstonLogger.info('← RESPONSE', {
      status,
      body: maskSensitive(body),
      elapsedMs,
    });
  },
};
