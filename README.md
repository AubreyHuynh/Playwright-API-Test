# Playwright API Test Framework

A TypeScript API test framework built on [Playwright](https://playwright.dev/), targeting the [FakeStoreAPI](https://fakestoreapi.com) e-commerce REST API. The framework demonstrates production-grade patterns: builder pattern, fixture-based dependency injection, schema validation, structured logging, and token caching.

## Features

- **Builder pattern** — fluent `RequestBuilder`, `HeadersBuilder`, `PayloadBuilder`, and `QueryParams` for composing HTTP requests
- **AJV schema validation** — JSON Schema contracts for all response shapes
- **Playwright fixtures** — `apiClient`, `authManager`, `testUser`, `testProduct`, `cleanup` injected per test
- **Token caching** — file-based `TokenStore` with configurable TTL avoids redundant login calls
- **Faker.js test data** — `testDataFactory` generates dynamic users, products, and carts
- **Winston logger** — structured JSON logs with automatic masking of secrets (`password`, `token`, `authorization`, etc.)
- **Retry logic** — configurable `RETRY_COUNT` with attempt-level logging
- **Multi-environment** — `ENV` variable selects `dev / sandbox / staging / uat / live` base URLs
- **GitHub Actions CI** — `.github/workflows/playwright.yml` with HTML report artifact upload
- **Docker support** — `Dockerfile` and `docker-compose.yml` for containerised runs

## Project Structure

```
src/
  api/            # HTTP client, request/header/payload/query builders, request loader
  auth/           # AuthManager (bearer / basic / apiKey), TokenStore
  config/         # env.ts (reads .env), config.ts (typed config object)
  fixtures/       # Playwright base.extend fixtures
  helpers/        # testDataFactory (Faker-backed)
  validators/     # responseValidator (status, time, headers, body), schemaValidator (AJV)
  utils/          # Winston logger, custom error classes

tests/
  api/
    auth/         # login flow
    users/        # CRUD + builder pattern
    products/     # CRUD + request-loader
    carts/        # CRUD

test-data/
  schemas/        # JSON Schema files for AJV validation
  payloads/       # Static request body files
  requests/       # JSON request-definition files for RequestLoader
```

## Prerequisites

- Node.js 22+
- npm

## Setup

```bash
npm install
npx playwright install --with-deps chromium
```

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

The default `.env` targets FakeStoreAPI with the seeded test account:

```
ENV=dev
DEV_BASE_URL=https://fakestoreapi.com
DEV_USERNAME=johnd
DEV_PASSWORD=m38rmF$
PLAYWRIGHT_FORCE_ASYNC_LOADER=true   # required on Node.js 22+
RETRY_COUNT=3
REQUEST_TIMEOUT_MS=10000
```

## Running Tests

```bash
# All tests
npm test

# Headed (shows browser dev-tools for debugging)
npx playwright test --headed

# Filter by tag
npx playwright test --grep "@smoke"
npx playwright test --grep "@regression"

# Specific test file
npx playwright test tests/api/auth/login.spec.ts

# Last-failed only
npx playwright test --last-failed

# HTML report
npx playwright show-report
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ENV` | `dev` | Active environment (`dev / sandbox / staging / uat / live`) |
| `DEV_BASE_URL` | — | Base URL for dev environment |
| `DEV_USERNAME` | — | Login username for dev |
| `DEV_PASSWORD` | — | Login password for dev |
| `API_KEY` | — | Optional API key for `apiKey` auth strategy |
| `REQUEST_TIMEOUT_MS` | `10000` | Per-request timeout in milliseconds |
| `RETRY_COUNT` | `3` | Number of retries on network errors |
| `LOG_LEVEL` | `info` | Winston log level (`debug / info / warn / error`) |
| `PLAYWRIGHT_FORCE_ASYNC_LOADER` | `true` | Required on Node.js 22+ |
| `AUTH_STATE_PATH` | `auth-state/token.json` | Token cache file path |

## Key Design Patterns

### Builder Pattern

```ts
const response = await RequestBuilder.post('/products')
  .headers(HeadersBuilder.create().bearer(token).accept('application/json'))
  .params(QueryParams.create().add('dryRun', true))
  .body(PayloadBuilder.fromFile('test-data/payloads/products/create-product.json')
    .set('title', 'Override Title'))
  .timeout(5000)
  .execute(apiClient);
```

### Fixtures

```ts
test('creates a product', async ({ apiClient, testProduct, cleanup }) => {
  const response = await apiClient.post('/products', { data: testProduct });
  cleanup(async () => { /* teardown */ });
  // ...
});
```

### Schema Validation

```ts
const body = await response.json();
schemaValidator.validate(body, 'test-data/schemas/products/product-schema.json');
```

### Auth Strategies

```ts
// Bearer token (auto-fetched and cached)
const headers = await authManager.getHeaders('bearer');

// Basic auth
const headers = await authManager.getHeaders('basic');

// API Key
const headers = await authManager.getHeaders('apiKey');
```

## Linting & Type Checking

```bash
npm run lint        # ESLint with TypeScript parser
npx tsc --noEmit    # Type check without emitting files
```

## Docker

```bash
docker compose up --build
```

## CI/CD

The GitHub Actions workflow (`.github/workflows/playwright.yml`) runs the full suite on every push and pull request, then uploads the HTML report as a build artifact.

## API Coverage

| Endpoint | Methods |
|---|---|
| `/auth/login` | POST |
| `/users` | GET, POST |
| `/users/:id` | GET, PUT, PATCH, DELETE |
| `/products` | GET, POST |
| `/products/:id` | GET, PUT, PATCH, DELETE |
| `/products/categories` | GET |
| `/carts` | GET, POST |
| `/carts/:id` | GET, PUT, PATCH, DELETE |
