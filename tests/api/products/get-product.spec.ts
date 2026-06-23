import { test, expect } from '../../../src/fixtures';
import { responseValidator } from '../../../src/validators/responseValidator';
import { schemaValidator } from '../../../src/validators/schemaValidator';

test.describe('@smoke @regression get product', () => {
  test('GET /products/1 returns 200 with valid schema', async ({ apiClient }) => {
    // Arrange — product ID 1 is always present in FakeStoreAPI

    // Act
    const start = Date.now();
    const response = await apiClient.get('/products/1');
    const elapsed = Date.now() - start;

    // Assert
    responseValidator.status(response, 200);
    responseValidator.responseTime(elapsed);
    responseValidator.header(response, 'content-type', 'application/json');
    const body = await response.json();
    schemaValidator.validate(body, 'test-data/schemas/products/product-schema.json');
  });

  test('GET /products/9999 returns 200 with empty or null body for non-existent product', async ({
    apiClient,
  }) => {
    // Note: FakeStoreAPI returns 200 with null/empty body for out-of-range IDs (not REST-standard 404)
    const response = await apiClient.get('/products/9999');
    responseValidator.status(response, 200);
    const text = await response.text();
    expect(['', 'null']).toContain(text.trim());
  });

  test('GET /products returns array of products with valid schema', async ({ apiClient }) => {
    const response = await apiClient.get('/products');

    responseValidator.status(response, 200);
    const body = await response.json();
    schemaValidator.validate(body, 'test-data/schemas/products/products-list-schema.json');
  });

  test('GET /products with limit param returns limited results', async ({ apiClient }) => {
    const response = await apiClient.get('/products', { params: { limit: 5 } });

    responseValidator.status(response, 200);
    const body = (await response.json()) as unknown[];
    expect(body).toHaveLength(5);
  });

  test('GET /products with sort=desc returns products in descending order', async ({
    apiClient,
  }) => {
    const response = await apiClient.get('/products', { params: { sort: 'desc' } });

    responseValidator.status(response, 200);
    const body = (await response.json()) as Array<{ id: number }>;
    expect(body.length).toBeGreaterThan(0);
    expect(body[0].id).toBeGreaterThan(body[body.length - 1].id);
  });

  test('GET /products with limit and sort returns correct subset', async ({ apiClient }) => {
    const response = await apiClient.get('/products', { params: { limit: 3, sort: 'asc' } });

    responseValidator.status(response, 200);
    const body = (await response.json()) as Array<{ id: number; title: string; price: number }>;
    expect(body).toHaveLength(3);
    body.forEach((p) => {
      expect(p.id).toBeDefined();
      expect(p.title).toBeDefined();
      expect(p.price).toBeDefined();
    });
  });
});
