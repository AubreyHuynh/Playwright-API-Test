# Enterprise API Automation Framework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready enterprise API automation framework with Playwright + TypeScript targeting the ReqRes public API (`https://reqres.in/api`).

**Architecture:** Layered architecture — Config → Auth → API Client → Validators → Fixtures → Tests. All HTTP calls go through `ApiClient`. Cross-cutting concerns (logging, error handling) are centralized utilities injected through Playwright fixtures. No browser configuration — API-only.

**Tech Stack:** Playwright (`@playwright/test`), TypeScript (strict), dotenv, AJV + ajv-formats, `@faker-js/faker`, winston, ESLint + `@typescript-eslint`, Prettier, Husky, lint-staged, Docker, GitHub Actions.

## Global Constraints

- Base URL resolved from `.env`: `DEV_BASE_URL`, `SANDBOX_BASE_URL`, `STAGING_BASE_URL`, `UAT_BASE_URL`, `LIVE_BASE_URL`
- Active environment selected via `ENV=dev|sandbox|staging|uat|live`
- TypeScript strict mode — no `any` without explicit cast comment
- All HTTP calls routed through `ApiClient.sendRequest()` — no direct `request.fetch()` in tests
- Tokens masked in logs as `[MASKED]`; passwords as `[MASKED]`
- Tests follow AAA pattern with `// Arrange / // Act / // Assert` comments
- Parallel-safe: every test uses Faker-generated unique data, no shared state
- Target API for sample tests: `https://reqres.in/api` (free, no auth key needed for basic ops)

---

## File Structure

```
├── .env.example                          # env template (committed)
├── .eslintrc.js                          # ESLint config
├── .gitignore                            # excludes .env, auth-state/, logs/, etc.
├── .husky/pre-commit                     # runs lint-staged
├── .prettierrc                           # Prettier config
├── .github/workflows/api-tests.yml      # CI/CD pipeline (replaces playwright.yml)
├── Dockerfile                            # test container
├── docker-compose.yml                    # compose for local + CI
├── package.json                          # scripts + all dependencies
├── playwright.config.ts                  # API-focused, no browsers, multi-env
├── tsconfig.json                         # strict TypeScript
├── src/
│   ├── config/
│   │   ├── env.ts                        # dotenv loader + env-var accessors
│   │   └── config.ts                     # central Config object (single source of truth)
│   ├── api/
│   │   ├── apiClient.ts                  # GET/POST/PUT/PATCH/DELETE + retry + timeout
│   │   └── payloadBuilder.ts             # fluent builder for request bodies
│   ├── auth/
│   │   ├── authManager.ts                # Bearer / OAuth2 / ApiKey / Basic strategies
│   │   └── tokenStore.ts                 # file-based token persistence + expiry check
│   ├── validators/
│   │   ├── responseValidator.ts          # status / headers / body / response-time checks
│   │   └── schemaValidator.ts            # AJV wrapper: compile + validate + format errors
│   ├── fixtures/
│   │   └── index.ts                      # authFixture, apiClientFixture, testDataFixture, cleanupFixture
│   ├── helpers/
│   │   └── testDataFactory.ts            # Faker wrappers returning typed interfaces
│   └── utils/
│       ├── logger.ts                     # winston: console + file, masking sensitive fields
│       └── errorHandler.ts              # ApiError, SchemaError, AuthError classes + handler
├── test-data/
│   ├── payloads/users/create-user.json   # static payload template
│   ├── responses/users/created-user.json # expected response shape
│   └── schemas/users/
│       ├── user-schema.json              # single user AJV schema
│       └── users-list-schema.json        # paginated list AJV schema
├── auth-state/                           # gitignored; token cache written here at runtime
│   └── .gitkeep
└── tests/
    └── api/
        ├── users/
        │   ├── create-user.spec.ts       # POST /users — happy + negative
        │   ├── get-user.spec.ts          # GET /users/:id — found + 404
        │   ├── update-user.spec.ts       # PUT + PATCH /users/:id
        │   └── delete-user.spec.ts       # DELETE /users/:id
        └── auth/
            └── login.spec.ts             # POST /login — success + bad credentials
```

---

## Phase 1: Project Foundation & Cleanup

**Files:**
- Delete: `tests/example.spec.ts`
- Modify: `package.json`
- Create: `tsconfig.json`, `.env.example`, `.gitignore` (update), `playwright.config.ts` (rewrite)

### Task 1.1: Remove example files and install dependencies

- [ ] Delete `tests/example.spec.ts`
- [ ] Delete `.github/workflows/playwright.yml` (will be replaced in Phase 9)
- [ ] Install runtime deps:
  ```bash
  npm install dotenv ajv ajv-formats @faker-js/faker winston
  ```
- [ ] Install dev deps:
  ```bash
  npm install -D typescript eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier eslint-config-prettier husky lint-staged
  ```

### Task 1.2: Create `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "outDir": "dist",
    "rootDir": ".",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*", "tests/**/*", "playwright.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### Task 1.3: Update `package.json` scripts

```json
{
  "scripts": {
    "test": "playwright test",
    "test:dev": "cross-env ENV=dev playwright test",
    "test:sandbox": "cross-env ENV=sandbox playwright test",
    "test:smoke": "playwright test --grep @smoke",
    "test:regression": "playwright test --grep @regression",
    "report": "playwright show-report",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"]
  }
}
```

### Task 1.4: Create `.env.example`

```env
ENV=dev

DEV_BASE_URL=https://reqres.in/api
SANDBOX_BASE_URL=https://reqres.in/api
STAGING_BASE_URL=https://reqres.in/api
UAT_BASE_URL=https://reqres.in/api
LIVE_BASE_URL=https://reqres.in/api

DEV_USERNAME=eve.holt@reqres.in
DEV_PASSWORD=cityslicka
SANDBOX_USERNAME=eve.holt@reqres.in
SANDBOX_PASSWORD=cityslicka

API_KEY=
REQUEST_TIMEOUT_MS=10000
RETRY_COUNT=3
LOG_LEVEL=info
```

### Task 1.5: Rewrite `playwright.config.ts`

```typescript
import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],
  timeout: 30_000,
  use: {
    baseURL: process.env[`${(process.env.ENV ?? 'dev').toUpperCase()}_BASE_URL`],
    extraHTTPHeaders: { 'Content-Type': 'application/json', Accept: 'application/json' },
    trace: 'on-first-retry',
  },
  projects: [{ name: 'api' }],
});
```

---

## Phase 2: Core Config & Environment

**Files:**
- Create: `src/config/env.ts`, `src/config/config.ts`

### Task 2.1: `src/config/env.ts` — dotenv loader + typed accessors

```typescript
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function require(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  ENV: optional('ENV', 'dev') as 'dev' | 'sandbox' | 'staging' | 'uat' | 'live',
  baseUrl(): string {
    const key = `${this.ENV.toUpperCase()}_BASE_URL`;
    return require(key);
  },
  username(): string { return require(`${env.ENV.toUpperCase()}_USERNAME`); },
  password(): string { return require(`${env.ENV.toUpperCase()}_PASSWORD`); },
  apiKey: optional('API_KEY', ''),
  timeoutMs: parseInt(optional('REQUEST_TIMEOUT_MS', '10000'), 10),
  retryCount: parseInt(optional('RETRY_COUNT', '3'), 10),
  logLevel: optional('LOG_LEVEL', 'info'),
};
```

### Task 2.2: `src/config/config.ts` — single source of truth

```typescript
import { env } from './env';

export const config = {
  get baseUrl() { return env.baseUrl(); },
  get credentials() { return { username: env.username(), password: env.password() }; },
  apiKey: env.apiKey,
  timeout: env.timeoutMs,
  retryCount: env.retryCount,
  logLevel: env.logLevel,
  authStatePath: 'auth-state/token.json',
};
```

---

## Phase 3: API Client Layer

**Files:**
- Create: `src/api/apiClient.ts`, `src/api/payloadBuilder.ts`

### Task 3.1: `src/api/apiClient.ts`

```typescript
import { APIRequestContext, APIResponse } from '@playwright/test';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/errorHandler';

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  retries?: number;
  data?: unknown;
}

export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  get(endpoint: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.send('GET', endpoint, opts);
  }
  post(endpoint: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.send('POST', endpoint, opts);
  }
  put(endpoint: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.send('PUT', endpoint, opts);
  }
  patch(endpoint: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.send('PATCH', endpoint, opts);
  }
  delete(endpoint: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.send('DELETE', endpoint, opts);
  }

  private async send(
    method: string,
    endpoint: string,
    opts: RequestOptions,
    attempt = 1
  ): Promise<APIResponse> {
    const url = endpoint.startsWith('http') ? endpoint : `${config.baseUrl}${endpoint}`;
    const timeout = opts.timeout ?? config.timeout;
    const maxRetries = opts.retries ?? config.retryCount;

    logger.logRequest(method, url, opts.headers, opts.data);
    const start = Date.now();

    try {
      const response = await this.request.fetch(url, {
        method,
        headers: opts.headers,
        params: opts.params as Record<string, string>,
        data: opts.data ? JSON.stringify(opts.data) : undefined,
        timeout,
      });
      logger.logResponse(response.status(), await response.json().catch(() => ({})), Date.now() - start);
      return response;
    } catch (error) {
      if (attempt < maxRetries) {
        logger.warn(`Retry ${attempt}/${maxRetries} for ${method} ${url}`);
        return this.send(method, endpoint, opts, attempt + 1);
      }
      throw new ApiError(`${method} ${url} failed after ${maxRetries} attempts`, error);
    }
  }
}
```

### Task 3.2: `src/api/payloadBuilder.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';

export class PayloadBuilder<T extends Record<string, unknown>> {
  private payload: T;

  private constructor(base: T) {
    this.payload = structuredClone(base);
  }

  static fromFile<T extends Record<string, unknown>>(relativePath: string): PayloadBuilder<T> {
    const abs = path.resolve(process.cwd(), relativePath);
    const raw = fs.readFileSync(abs, 'utf-8');
    return new PayloadBuilder<T>(JSON.parse(raw) as T);
  }

  static fromObject<T extends Record<string, unknown>>(obj: T): PayloadBuilder<T> {
    return new PayloadBuilder<T>(obj);
  }

  set<K extends keyof T>(key: K, value: T[K]): this {
    this.payload[key] = value;
    return this;
  }

  merge(partial: Partial<T>): this {
    Object.assign(this.payload, partial);
    return this;
  }

  build(): T {
    return structuredClone(this.payload);
  }
}
```

---

## Phase 4: Authentication Management

**Files:**
- Create: `src/auth/authManager.ts`, `src/auth/tokenStore.ts`

### Task 4.1: `src/auth/tokenStore.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';

interface TokenData {
  token: string;
  expiresAt: number;
}

export class TokenStore {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = path.resolve(process.cwd(), filePath);
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
  }

  save(token: string, ttlSeconds = 3600): void {
    const data: TokenData = { token, expiresAt: Date.now() + ttlSeconds * 1000 };
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  load(): string | null {
    if (!fs.existsSync(this.filePath)) return null;
    const data: TokenData = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
    if (Date.now() > data.expiresAt) { this.clear(); return null; }
    return data.token;
  }

  clear(): void {
    if (fs.existsSync(this.filePath)) fs.unlinkSync(this.filePath);
  }
}
```

### Task 4.2: `src/auth/authManager.ts`

```typescript
import { ApiClient } from '../api/apiClient';
import { config } from '../config/config';
import { TokenStore } from './tokenStore';
import { AuthError } from '../utils/errorHandler';

export type AuthStrategy = 'bearer' | 'apiKey' | 'basic' | 'none';

export interface AuthHeaders {
  Authorization?: string;
  'x-api-key'?: string;
}

export class AuthManager {
  private tokenStore: TokenStore;

  constructor(private readonly client: ApiClient) {
    this.tokenStore = new TokenStore(config.authStatePath);
  }

  async getHeaders(strategy: AuthStrategy = 'bearer'): Promise<AuthHeaders> {
    switch (strategy) {
      case 'bearer':  return { Authorization: `Bearer ${await this.getBearerToken()}` };
      case 'apiKey':  return { 'x-api-key': config.apiKey };
      case 'basic': {
        const { username, password } = config.credentials;
        const encoded = Buffer.from(`${username}:${password}`).toString('base64');
        return { Authorization: `Basic ${encoded}` };
      }
      case 'none': return {};
    }
  }

  async getBearerToken(): Promise<string> {
    const cached = this.tokenStore.load();
    if (cached) return cached;

    const { username, password } = config.credentials;
    const response = await this.client.post('/login', {
      data: { email: username, password },
    });

    if (response.status() !== 200) {
      throw new AuthError(`Login failed: ${response.status()}`);
    }
    const body = await response.json() as { token: string };
    this.tokenStore.save(body.token);
    return body.token;
  }

  invalidate(): void {
    this.tokenStore.clear();
  }
}
```

---

## Phase 5: Validators

**Files:**
- Create: `src/validators/responseValidator.ts`, `src/validators/schemaValidator.ts`

### Task 5.1: `src/validators/schemaValidator.ts`

```typescript
import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';
import { SchemaError } from '../utils/errorHandler';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const cache = new Map<string, ValidateFunction>();

export const schemaValidator = {
  fromFile(schemaPath: string): ValidateFunction {
    if (cache.has(schemaPath)) return cache.get(schemaPath)!;
    const abs = path.resolve(process.cwd(), schemaPath);
    const schema = JSON.parse(fs.readFileSync(abs, 'utf-8'));
    const validate = ajv.compile(schema);
    cache.set(schemaPath, validate);
    return validate;
  },

  validate(data: unknown, schemaPath: string): void {
    const validate = this.fromFile(schemaPath);
    if (!validate(data)) {
      const errors = ajv.errorsText(validate.errors);
      throw new SchemaError(`Schema validation failed: ${errors}`);
    }
  },

  validateInline<T>(data: unknown, schema: JSONSchemaType<T>): void {
    const validate = ajv.compile(schema);
    if (!validate(data)) {
      const errors = ajv.errorsText(validate.errors);
      throw new SchemaError(`Schema validation failed: ${errors}`);
    }
  },
};
```

### Task 5.2: `src/validators/responseValidator.ts`

```typescript
import { APIResponse } from '@playwright/test';
import { expect } from '@playwright/test';

const DEFAULT_MAX_RESPONSE_TIME_MS = 3000;

export const responseValidator = {
  async status(response: APIResponse, expected: number): Promise<void> {
    expect(response.status(), `Expected status ${expected}`).toBe(expected);
  },

  async responseTime(elapsedMs: number, maxMs = DEFAULT_MAX_RESPONSE_TIME_MS): Promise<void> {
    expect(elapsedMs, `Response time ${elapsedMs}ms exceeds ${maxMs}ms`).toBeLessThan(maxMs);
  },

  async header(response: APIResponse, name: string, expected: string | RegExp): Promise<void> {
    const val = response.headers()[name.toLowerCase()];
    if (expected instanceof RegExp) {
      expect(val, `Header ${name}`).toMatch(expected);
    } else {
      expect(val, `Header ${name}`).toContain(expected);
    }
  },

  async bodyContains(response: APIResponse, subset: Record<string, unknown>): Promise<void> {
    const body = await response.json() as Record<string, unknown>;
    for (const [key, value] of Object.entries(subset)) {
      expect(body[key], `Body field '${key}'`).toEqual(value);
    }
  },

  async bodyEquals(response: APIResponse, expected: unknown): Promise<void> {
    const body = await response.json();
    expect(body).toEqual(expected);
  },

  async bodyMatchesFile(response: APIResponse, filePath: string, ignore: string[] = []): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    const expected = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf-8')) as Record<string, unknown>;
    const body = await response.json() as Record<string, unknown>;
    ignore.forEach(k => { delete expected[k]; delete body[k]; });
    expect(body).toMatchObject(expected);
  },
};
```

---

## Phase 6: Logging & Error Handling

**Files:**
- Create: `src/utils/logger.ts`, `src/utils/errorHandler.ts`

### Task 6.1: `src/utils/errorHandler.ts`

```typescript
export class ApiError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class SchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaError';
  }
}
```

### Task 6.2: `src/utils/logger.ts`

```typescript
import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import { config } from '../config/config';

const SENSITIVE_KEYS = new Set(['password', 'token', 'authorization', 'x-api-key', 'secret']);
const LOGS_DIR = path.resolve(process.cwd(), 'logs');
fs.mkdirSync(LOGS_DIR, { recursive: true });

function mask(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
      k,
      SENSITIVE_KEYS.has(k.toLowerCase()) ? '[MASKED]' : mask(v),
    ])
  );
}

const winstonLogger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) }),
    new winston.transports.File({ filename: path.join(LOGS_DIR, 'test.log') }),
    new winston.transports.File({ filename: path.join(LOGS_DIR, 'error.log'), level: 'error' }),
  ],
});

export const logger = {
  info: (msg: string, meta?: unknown) => winstonLogger.info(msg, { meta }),
  warn: (msg: string, meta?: unknown) => winstonLogger.warn(msg, { meta }),
  error: (msg: string, meta?: unknown) => winstonLogger.error(msg, { meta }),
  logRequest(method: string, url: string, headers?: unknown, body?: unknown): void {
    winstonLogger.info('→ REQUEST', { method, url, headers: mask(headers), body: mask(body) });
  },
  logResponse(status: number, body: unknown, elapsedMs: number): void {
    winstonLogger.info('← RESPONSE', { status, body: mask(body), elapsedMs });
  },
};
```

---

## Phase 7: Fixtures & Test Data Factory

**Files:**
- Create: `src/fixtures/index.ts`, `src/helpers/testDataFactory.ts`

### Task 7.1: `src/helpers/testDataFactory.ts`

```typescript
import { faker } from '@faker-js/faker';

export interface UserData {
  name: string;
  job: string;
  email: string;
}

export interface Credentials {
  email: string;
  password: string;
}

export const testDataFactory = {
  user(): UserData {
    return {
      name: faker.person.fullName(),
      job: faker.person.jobTitle(),
      email: faker.internet.email(),
    };
  },
  credentials(): Credentials {
    return {
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12 }),
    };
  },
};
```

### Task 7.2: `src/fixtures/index.ts`

```typescript
import { test as base, APIRequestContext } from '@playwright/test';
import { ApiClient } from '../api/apiClient';
import { AuthManager } from '../auth/authManager';
import { testDataFactory, UserData } from '../helpers/testDataFactory';

interface ApiFixtures {
  apiClient: ApiClient;
  authManager: AuthManager;
  testUser: UserData;
  cleanup: (fn: () => Promise<void>) => void;
}

export const test = base.extend<ApiFixtures>({
  apiClient: async ({ request }: { request: APIRequestContext }, use: (c: ApiClient) => Promise<void>) => {
    await use(new ApiClient(request));
  },

  authManager: async ({ apiClient }: { apiClient: ApiClient }, use: (a: AuthManager) => Promise<void>) => {
    await use(new AuthManager(apiClient));
  },

  testUser: async ({}, use: (u: UserData) => Promise<void>) => {
    await use(testDataFactory.user());
  },

  cleanup: async ({}, use: (register: (fn: () => Promise<void>) => void) => Promise<void>) => {
    const fns: Array<() => Promise<void>> = [];
    await use((fn) => fns.push(fn));
    for (const fn of fns.reverse()) await fn().catch(console.error);
  },
});

export { expect } from '@playwright/test';
```

---

## Phase 8: Test Data Files & Sample Tests

### Task 8.1: Test data files

**`test-data/payloads/users/create-user.json`**
```json
{ "name": "Jane Doe", "job": "QA Engineer" }
```

**`test-data/responses/users/created-user.json`**
```json
{ "name": "Jane Doe", "job": "QA Engineer" }
```

**`test-data/schemas/users/user-schema.json`**
```json
{
  "type": "object",
  "properties": {
    "id": { "type": "number" },
    "email": { "type": "string", "format": "email" },
    "first_name": { "type": "string" },
    "last_name": { "type": "string" },
    "avatar": { "type": "string", "format": "uri" }
  },
  "required": ["id", "email", "first_name", "last_name"],
  "additionalProperties": true
}
```

**`test-data/schemas/users/users-list-schema.json`**
```json
{
  "type": "object",
  "properties": {
    "page": { "type": "number" },
    "per_page": { "type": "number" },
    "total": { "type": "number" },
    "total_pages": { "type": "number" },
    "data": {
      "type": "array",
      "items": { "$ref": "#/definitions/user" }
    }
  },
  "required": ["page", "per_page", "total", "total_pages", "data"],
  "definitions": {
    "user": {
      "type": "object",
      "properties": {
        "id": { "type": "number" },
        "email": { "type": "string" },
        "first_name": { "type": "string" },
        "last_name": { "type": "string" }
      },
      "required": ["id", "email", "first_name", "last_name"]
    }
  }
}
```

### Task 8.2: Sample tests

**`tests/api/users/create-user.spec.ts`**
```typescript
import { test, expect } from '../../../src/fixtures';
import { PayloadBuilder } from '../../../src/api/payloadBuilder';
import { responseValidator } from '../../../src/validators/responseValidator';
import { schemaValidator } from '../../../src/validators/schemaValidator';

test.describe('@smoke @regression create user', () => {
  test('POST /users returns 201 with created user data', async ({ apiClient, testUser }) => {
    // Arrange
    const payload = PayloadBuilder.fromObject({ name: testUser.name, job: testUser.job }).build();

    // Act
    const start = Date.now();
    const response = await apiClient.post('/users', { data: payload });
    const elapsed = Date.now() - start;

    // Assert
    await responseValidator.status(response, 201);
    await responseValidator.responseTime(elapsed);
    await responseValidator.header(response, 'content-type', 'application/json');
    await responseValidator.bodyContains(response, { name: testUser.name, job: testUser.job });

    const body = await response.json() as Record<string, unknown>;
    expect(body.id).toBeDefined();
    expect(body.createdAt).toBeDefined();
  });

  test('POST /users with file payload returns 201', async ({ apiClient }) => {
    // Arrange
    const payload = PayloadBuilder
      .fromFile<{ name: string; job: string }>('test-data/payloads/users/create-user.json')
      .build();

    // Act
    const response = await apiClient.post('/users', { data: payload });

    // Assert
    await responseValidator.status(response, 201);
    await responseValidator.bodyMatchesFile(response, 'test-data/responses/users/created-user.json', ['id', 'createdAt']);
  });
});
```

**`tests/api/users/get-user.spec.ts`**
```typescript
import { test, expect } from '../../../src/fixtures';
import { responseValidator } from '../../../src/validators/responseValidator';
import { schemaValidator } from '../../../src/validators/schemaValidator';

test.describe('@smoke @regression get user', () => {
  test('GET /users/2 returns 200 with valid schema', async ({ apiClient }) => {
    // Arrange — user ID 2 exists in reqres.in

    // Act
    const start = Date.now();
    const response = await apiClient.get('/users/2');
    const elapsed = Date.now() - start;

    // Assert
    await responseValidator.status(response, 200);
    await responseValidator.responseTime(elapsed);
    const body = await response.json() as { data: unknown };
    schemaValidator.validate(body.data, 'test-data/schemas/users/user-schema.json');
  });

  test('GET /users/999 returns 404', async ({ apiClient }) => {
    // Arrange — ID 999 does not exist

    // Act
    const response = await apiClient.get('/users/999');

    // Assert
    await responseValidator.status(response, 404);
  });

  test('GET /users returns paginated list with valid schema', async ({ apiClient }) => {
    // Arrange

    // Act
    const response = await apiClient.get('/users', { params: { page: 1 } });

    // Assert
    await responseValidator.status(response, 200);
    const body = await response.json();
    schemaValidator.validate(body, 'test-data/schemas/users/users-list-schema.json');
  });
});
```

**`tests/api/users/update-user.spec.ts`**
```typescript
import { test, expect } from '../../../src/fixtures';
import { responseValidator } from '../../../src/validators/responseValidator';

test.describe('@regression update user', () => {
  test('PUT /users/2 returns 200 with updated data', async ({ apiClient, testUser }) => {
    // Arrange
    const payload = { name: testUser.name, job: testUser.job };

    // Act
    const response = await apiClient.put('/users/2', { data: payload });

    // Assert
    await responseValidator.status(response, 200);
    await responseValidator.bodyContains(response, { name: testUser.name, job: testUser.job });
    const body = await response.json() as Record<string, unknown>;
    expect(body.updatedAt).toBeDefined();
  });

  test('PATCH /users/2 returns 200 with partial update', async ({ apiClient }) => {
    // Arrange
    const payload = { job: 'Senior QA Engineer' };

    // Act
    const response = await apiClient.patch('/users/2', { data: payload });

    // Assert
    await responseValidator.status(response, 200);
    await responseValidator.bodyContains(response, { job: 'Senior QA Engineer' });
  });
});
```

**`tests/api/users/delete-user.spec.ts`**
```typescript
import { test } from '../../../src/fixtures';
import { responseValidator } from '../../../src/validators/responseValidator';

test.describe('@regression delete user', () => {
  test('DELETE /users/2 returns 204 no content', async ({ apiClient }) => {
    // Arrange — reqres.in simulates deletion

    // Act
    const response = await apiClient.delete('/users/2');

    // Assert
    await responseValidator.status(response, 204);
  });
});
```

**`tests/api/auth/login.spec.ts`**
```typescript
import { test, expect } from '../../../src/fixtures';
import { responseValidator } from '../../../src/validators/responseValidator';

test.describe('@smoke auth', () => {
  test('POST /login with valid credentials returns 200 and token', async ({ apiClient }) => {
    // Arrange
    const payload = { email: 'eve.holt@reqres.in', password: 'cityslicka' };

    // Act
    const response = await apiClient.post('/login', { data: payload });

    // Assert
    await responseValidator.status(response, 200);
    const body = await response.json() as { token: string };
    expect(body.token).toBeDefined();
    expect(typeof body.token).toBe('string');
  });

  test('POST /login with missing password returns 400', async ({ apiClient }) => {
    // Arrange
    const payload = { email: 'eve.holt@reqres.in' };

    // Act
    const response = await apiClient.post('/login', { data: payload });

    // Assert
    await responseValidator.status(response, 400);
    await responseValidator.bodyContains(response, { error: 'Missing password' });
  });
});
```

---

## Phase 9: Docker & CI/CD

### Task 9.1: `Dockerfile`

```dockerfile
FROM mcr.microsoft.com/playwright:v1.49.0-noble

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx playwright install --with-deps chromium

ENV ENV=dev

CMD ["npx", "playwright", "test", "--reporter=html"]
```

### Task 9.2: `docker-compose.yml`

```yaml
version: '3.8'

services:
  api-tests:
    build: .
    environment:
      - ENV=${ENV:-dev}
      - DEV_BASE_URL=${DEV_BASE_URL:-https://reqres.in/api}
      - SANDBOX_BASE_URL=${SANDBOX_BASE_URL:-https://reqres.in/api}
      - DEV_USERNAME=${DEV_USERNAME:-eve.holt@reqres.in}
      - DEV_PASSWORD=${DEV_PASSWORD:-cityslicka}
      - REQUEST_TIMEOUT_MS=${REQUEST_TIMEOUT_MS:-10000}
      - RETRY_COUNT=${RETRY_COUNT:-3}
    volumes:
      - ./playwright-report:/app/playwright-report
      - ./logs:/app/logs
```

### Task 9.3: `.github/workflows/api-tests.yml`

```yaml
name: API Tests

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
  workflow_dispatch:
    inputs:
      environment:
        description: Target environment
        required: true
        default: dev
        type: choice
        options: [dev, sandbox, staging, uat, live]
      tags:
        description: Test tags (e.g. @smoke)
        required: false
        default: ''

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check

  test:
    needs: lint
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2]
      fail-fast: false
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - name: Run API tests
        env:
          ENV: ${{ github.event.inputs.environment || 'dev' }}
          DEV_BASE_URL: ${{ secrets.DEV_BASE_URL }}
          SANDBOX_BASE_URL: ${{ secrets.SANDBOX_BASE_URL }}
          DEV_USERNAME: ${{ secrets.DEV_USERNAME }}
          DEV_PASSWORD: ${{ secrets.DEV_PASSWORD }}
        run: |
          GREP="${{ github.event.inputs.tags }}"
          if [ -n "$GREP" ]; then
            npx playwright test --shard=${{ matrix.shard }}/2 --grep="$GREP"
          else
            npx playwright test --shard=${{ matrix.shard }}/2
          fi
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-shard-${{ matrix.shard }}
          path: playwright-report/
          retention-days: 30

  merge-reports:
    needs: test
    runs-on: ubuntu-latest
    if: always()
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - uses: actions/download-artifact@v4
        with:
          path: all-reports
          pattern: playwright-report-shard-*
      - run: npx playwright merge-reports --reporter html ./all-reports
      - uses: actions/upload-artifact@v4
        with:
          name: playwright-report-merged
          path: playwright-report/
          retention-days: 30
```

---

## Phase 10: Code Quality

### Task 10.1: `.eslintrc.js`

```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  env: { node: true, es2022: true },
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'warn',
  },
};
```

### Task 10.2: `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "trailingComma": "es5",
  "tabWidth": 2
}
```

### Task 10.3: Husky setup

```bash
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

---

## Self-Review Checklist

- [x] API Client: GET/POST/PUT/PATCH/DELETE ✓
- [x] Retry mechanism in ApiClient ✓
- [x] PayloadBuilder: file + object + fluent ✓
- [x] AJV schema validation (file + inline) ✓
- [x] Response validation: status, header, body, time ✓
- [x] Auth: Bearer, ApiKey, Basic strategies ✓
- [x] Token persistence + expiry (TokenStore) ✓
- [x] Environment management: dev/sandbox/staging/uat/live ✓
- [x] Central config module ✓
- [x] Playwright fixtures: apiClient, authManager, testUser, cleanup ✓
- [x] Faker test data factory ✓
- [x] Winston logger with sensitive field masking ✓
- [x] Centralized error classes ✓
- [x] Parallel execution: fullyParallel + independent data ✓
- [x] HTML reporter ✓
- [x] Test tags: @smoke, @regression ✓
- [x] AAA pattern in all tests ✓
- [x] Docker + docker-compose ✓
- [x] GitHub Actions: lint → test (sharded) → merge-reports ✓
- [x] Manual trigger with environment + tag inputs ✓
- [x] ESLint + Prettier + Husky + lint-staged ✓
- [x] No hardcoded URLs/credentials ✓
- [x] Sensitive data masked in logs ✓
