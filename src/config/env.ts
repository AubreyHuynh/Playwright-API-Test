import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

type Environment = 'dev' | 'sandbox' | 'staging' | 'uat' | 'live';

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optionalEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

const ENV = optionalEnv('ENV', 'dev') as Environment;
const PREFIX = ENV.toUpperCase();

export const env = {
  ENV,
  baseUrl: requireEnv(`${PREFIX}_BASE_URL`),
  username: optionalEnv(`${PREFIX}_USERNAME`),
  password: optionalEnv(`${PREFIX}_PASSWORD`),
  apiKey: optionalEnv('API_KEY'),
  timeoutMs: parseInt(optionalEnv('REQUEST_TIMEOUT_MS', '10000'), 10),
  retryCount: parseInt(optionalEnv('RETRY_COUNT', '3'), 10),
  logLevel: optionalEnv('LOG_LEVEL', 'info'),
  authStatePath: optionalEnv('AUTH_STATE_PATH', 'auth-state/token.json'),
};
