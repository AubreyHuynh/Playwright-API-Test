import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

type Environment = 'dev' | 'sandbox' | 'staging' | 'uat' | 'live';
const ALLOWED_ENVIRONMENTS: Environment[] = ['dev', 'sandbox', 'staging', 'uat', 'live'];

function requireEnv(key: string): string {
  const val = process.env[key]?.trim();
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optionalEnv(key: string, fallback = ''): string {
  return process.env[key]?.trim() ?? fallback;
}

function numberEnv(key: string, fallback: number): number {
  const raw = optionalEnv(key, String(fallback));
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value) || value < 0) {
    throw new Error(`Invalid numeric env var: ${key}=${raw}`);
  }
  return value;
}

const rawEnv = optionalEnv('ENV', 'dev').toLowerCase();
if (!ALLOWED_ENVIRONMENTS.includes(rawEnv as Environment)) {
  throw new Error(
    `Invalid ENV '${rawEnv}'. Expected one of: ${ALLOWED_ENVIRONMENTS.join(', ')}`,
  );
}

const ENV = rawEnv as Environment;
const PREFIX = ENV.toUpperCase();

export const env = {
  ENV,
  baseUrl: requireEnv(`${PREFIX}_BASE_URL`),
  username: optionalEnv(`${PREFIX}_USERNAME`),
  password: optionalEnv(`${PREFIX}_PASSWORD`),
  apiKey: optionalEnv('API_KEY'),
  timeoutMs: numberEnv('REQUEST_TIMEOUT_MS', 10000),
  retryCount: numberEnv('RETRY_COUNT', 3),
  retryDelayMs: numberEnv('RETRY_DELAY_MS', 250),
  logLevel: optionalEnv('LOG_LEVEL', 'info'),
  authStatePath: optionalEnv('AUTH_STATE_PATH', 'auth-state/token.json'),
  authTokenTtlSeconds: numberEnv('AUTH_TOKEN_TTL_SECONDS', 3600),
};
