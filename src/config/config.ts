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
  logLevel: env.logLevel,
  authStatePath: 'auth-state/token.json',
} as const;
