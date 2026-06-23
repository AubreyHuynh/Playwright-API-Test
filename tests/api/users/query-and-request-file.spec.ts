import { test, expect } from '../../../src/fixtures';
import { QueryParams } from '../../../src/api/queryParams';
import { RequestLoader } from '../../../src/api/requestLoader';
import { responseValidator } from '../../../src/validators/responseValidator';

test.describe('@smoke @regression query params and request files', () => {
  // ── QueryParams builder ────────────────────────────────────────────────────
  // Products endpoint is used here because it explicitly supports ?limit and ?sort

  test('GET /products with QueryParams builder returns limited results', async ({ apiClient }) => {
    // Arrange — build params fluently, same as Postman's params tab
    const params = QueryParams.create()
      .add('limit', 5, true, 'Max results per page')
      .add('sort', 'asc', true, 'Sort order ascending')
      .add('_debug', 'true', false, 'Disabled — not sent to server');

    // Act
    const response = await apiClient.get('/products', { params });

    // Assert
    responseValidator.status(response, 200);
    const body = (await response.json()) as unknown[];
    expect(body).toHaveLength(5);
  });

  test('GET /products with QueryParams — enable sort param at runtime', async ({ apiClient }) => {
    // Arrange — sort starts disabled, enable it for this test
    const params = QueryParams.create()
      .add('limit', 5)
      .add('sort', 'desc', false)
      .enable('sort');

    // Act
    const response = await apiClient.get('/products', { params });

    // Assert
    responseValidator.status(response, 200);
    const body = (await response.json()) as Array<{ id: number }>;
    expect(body.length).toBeGreaterThan(0);
    // sort=desc means higher IDs appear first
    expect(body[0].id).toBeGreaterThan(body[body.length - 1].id);
  });

  test('GET /products with QueryParams — override param value', async ({ apiClient }) => {
    // Arrange — start with default limit, override to 3 for this test
    const params = QueryParams.create().add('limit', 10).set('limit', 3);

    // Act
    const response = await apiClient.get('/products', { params });

    // Assert
    responseValidator.status(response, 200);
    const body = (await response.json()) as unknown[];
    expect(body).toHaveLength(3);
  });

  // ── Request definition files ───────────────────────────────────────────────

  test('GET /products via request file returns 200 with limited results', async ({ apiClient }) => {
    // File: test-data/requests/products/get-products.json
    // Enabled params: limit=5, sort=asc  |  Disabled: _debug (not sent)

    // Act
    const response = await RequestLoader.run(
      apiClient,
      'test-data/requests/products/get-products.json',
    );

    // Assert
    responseValidator.status(response, 200);
    const body = (await response.json()) as unknown[];
    expect(body).toHaveLength(5);
  });

  test('POST /products via request file returns 201', async ({ apiClient }) => {
    // File: test-data/requests/products/create-product.json

    // Act
    const response = await RequestLoader.run(
      apiClient,
      'test-data/requests/products/create-product.json',
    );

    // Assert
    responseValidator.status(response, 201);
    await responseValidator.bodyContains(response, { title: 'Request File Product' });
  });

  test('RequestLoader.fromFile exposes definition for inspection', async ({ apiClient }) => {
    // Arrange — load definition without running it
    const def = RequestLoader.fromFile('test-data/requests/products/get-products.json');

    // Assert definition shape
    expect(def.method).toBe('GET');
    expect(def.endpoint).toBe('/products');
    expect(def.params).toHaveLength(3);

    // Only enabled params reach the server
    const enabledParams = def.params!.filter((p) => p.enabled);
    expect(enabledParams).toHaveLength(2);

    // Act — run with a runtime param layered on top, overriding limit to 2
    const params = QueryParams.fromEntries(def.params!).set('limit', 2);
    const response = await apiClient.get(def.endpoint, { params });

    // Assert
    responseValidator.status(response, 200);
    const body = (await response.json()) as unknown[];
    expect(body).toHaveLength(2);
  });
});
