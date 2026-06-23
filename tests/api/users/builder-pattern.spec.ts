import { test, expect } from '../../../src/fixtures';
import { RequestBuilder } from '../../../src/api/requestBuilder';
import { HeadersBuilder } from '../../../src/api/headersBuilder';
import { PayloadBuilder } from '../../../src/api/payloadBuilder';
import { QueryParams } from '../../../src/api/queryParams';
import { responseValidator } from '../../../src/validators/responseValidator';

test.describe('@smoke @regression builder pattern', () => {
  // ── RequestBuilder — GET ───────────────────────────────────────────────────

  test('GET with RequestBuilder and inline params', async ({ apiClient }) => {
    // Arrange
    const request = RequestBuilder.get('/products')
      .param('limit', 3)
      .param('sort', 'asc');

    // Act
    const response = await request.execute(apiClient);

    // Assert
    responseValidator.status(response, 200);
    const body = (await response.json()) as unknown[];
    expect(body).toHaveLength(3);
  });

  test('GET with RequestBuilder and QueryParams block', async ({ apiClient }) => {
    // Arrange — compose QueryParams then hand off to RequestBuilder
    const params = QueryParams.create()
      .add('limit', 5)
      .add('sort', 'asc');

    const response = await RequestBuilder.get('/products').params(params).execute(apiClient);

    // Assert
    responseValidator.status(response, 200);
    const body = (await response.json()) as Array<{ id: number }>;
    expect(body.length).toBe(5);
  });

  // ── RequestBuilder — POST ──────────────────────────────────────────────────

  test('POST with RequestBuilder and plain body', async ({ apiClient, testProduct }) => {
    // Arrange
    const response = await RequestBuilder.post('/products')
      .body({
        title: testProduct.title,
        price: testProduct.price,
        description: testProduct.description,
        category: testProduct.category,
        image: testProduct.image,
      })
      .execute(apiClient);

    // Assert
    responseValidator.status(response, 200);
    await responseValidator.bodyContains(response, { title: testProduct.title });
  });

  test('POST with RequestBuilder + PayloadBuilder body', async ({ apiClient, testProduct }) => {
    // Arrange — PayloadBuilder resolves at .body() call; no separate .build() needed
    const payload = PayloadBuilder.fromFile<{
      title: string;
      price: number;
      description: string;
      category: string;
      image: string;
    }>('test-data/payloads/products/create-product.json')
      .set('title', testProduct.title)
      .set('price', testProduct.price);

    const response = await RequestBuilder.post('/products').body(payload).execute(apiClient);

    // Assert
    responseValidator.status(response, 200);
    await responseValidator.bodyContains(response, { title: testProduct.title });
  });

  // ── HeadersBuilder ─────────────────────────────────────────────────────────

  test('HeadersBuilder assembles headers correctly', async ({ apiClient }) => {
    // Arrange — build headers with HeadersBuilder, then attach via RequestBuilder
    const headers = HeadersBuilder.create()
      .accept('application/json')
      .add('X-Request-ID', 'test-suite-001')
      .add('X-Correlation-ID', 'builder-pattern-test');

    const response = await RequestBuilder.get('/products/1').headers(headers).execute(apiClient);

    // Assert
    responseValidator.status(response, 200);
  });

  test('HeadersBuilder bearer token attaches Authorization header', async ({ apiClient }) => {
    // Arrange — simulate a pre-fetched token
    const fakeToken = 'eyJhbGciOiJSUzI1NiJ9.test';
    const headers = HeadersBuilder.create().bearer(fakeToken);

    // build() is inspectable before execution
    const built = headers.build();
    expect(built['Authorization']).toBe(`Bearer ${fakeToken}`);

    // FakeStoreAPI ignores auth, so we can still verify the request succeeds
    const response = await RequestBuilder.get('/products/1').headers(headers).execute(apiClient);
    responseValidator.status(response, 200);
  });

  test('HeadersBuilder basicAuth encodes credentials as Base64', async () => {
    // Arrange
    const headers = HeadersBuilder.create().basicAuth('user@example.com', 's3cr3t').build();

    // Assert — RFC 7617: "Basic base64(user:pass)"
    const encoded = Buffer.from('user@example.com:s3cr3t').toString('base64');
    expect(headers['Authorization']).toBe(`Basic ${encoded}`);
  });

  test('HeadersBuilder apiKey uses custom header name', async () => {
    // Arrange
    const headers = HeadersBuilder.create()
      .apiKey('my-key-123')
      .apiKey('secondary', 'X-Alt-Key')
      .build();

    expect(headers['x-api-key']).toBe('my-key-123');
    expect(headers['X-Alt-Key']).toBe('secondary');
  });

  // ── RequestBuilder.build() — inspect without executing ───────────────────

  test('RequestBuilder.build() exposes full request for assertion', async () => {
    // Arrange
    const request = RequestBuilder.post('/products')
      .header('X-Trace', 'trace-abc')
      .param('dryRun', true)
      .body({ title: 'Test Product', price: 9.99 })
      .timeout(5000)
      .retries(1)
      .build();

    // Assert — verify the built shape without firing the request
    expect(request.method).toBe('POST');
    expect(request.endpoint).toBe('/products');
    expect(request.options.headers?.['X-Trace']).toBe('trace-abc');
    expect((request.options.params as Record<string, unknown>)['dryRun']).toBe(true);
    expect(request.options.timeout).toBe(5000);
    expect(request.options.retries).toBe(1);
  });

  // ── Full composition: RequestBuilder + HeadersBuilder + QueryParams ────────

  test('Full builder composition — GET with headers and params', async ({ apiClient }) => {
    // Arrange — assemble each piece independently, compose in RequestBuilder
    const headers = HeadersBuilder.create()
      .accept('application/json')
      .add('X-Source', 'playwright-builder');

    const params = QueryParams.create()
      .add('limit', 2)
      .add('sort', 'asc');

    // Act
    const response = await RequestBuilder.get('/products')
      .headers(headers)
      .params(params)
      .execute(apiClient);

    // Assert
    responseValidator.status(response, 200);
    const body = (await response.json()) as Array<{ id: number }>;
    expect(body).toHaveLength(2);
  });
});
