import { env } from './env';

export const config = {
  baseUrl: env.baseUrl,
  credentials: {
    username: env.username,
    password: env.password,
  },
  apiKey: env.apiKey,
  timeout: env.timeoutMs,
  retryCount: env.retryCount,
  retryDelayMs: env.retryDelayMs,
  logLevel: env.logLevel,
  authStatePath: env.authStatePath,
  authTokenTtlSeconds: env.authTokenTtlSeconds,
} as const;
