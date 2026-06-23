import { test, expect } from '../../../src/fixtures';
import { responseValidator } from '../../../src/validators/responseValidator';
import { schemaValidator } from '../../../src/validators/schemaValidator';

test.describe('@smoke @regression get cart', () => {
  test('GET /carts/1 returns 200 with valid schema', async ({ apiClient }) => {
    // Arrange — cart ID 1 is always present in FakeStoreAPI

    // Act
    const start = Date.now();
    const response = await apiClient.get('/carts/1');
    const elapsed = Date.now() - start;

    // Assert
    responseValidator.status(response, 200);
    responseValidator.responseTime(elapsed);
    responseValidator.header(response, 'content-type', 'application/json');
    const body = await response.json();
    schemaValidator.validate(body, 'test-data/schemas/carts/cart-schema.json');
  });

  test('GET /carts/9999 returns 200 with empty or null body for non-existent cart', async ({
    apiClient,
  }) => {
    // Note: FakeStoreAPI returns 200 with null/empty body for out-of-range IDs (not REST-standard 404)
    const response = await apiClient.get('/carts/9999');
    responseValidator.status(response, 200);
    const text = await response.text();
    expect(['', 'null']).toContain(text.trim());
  });

  test('GET /carts returns array of carts with valid schema', async ({ apiClient }) => {
    const response = await apiClient.get('/carts');

    responseValidator.status(response, 200);
    const body = await response.json();
    schemaValidator.validate(body, 'test-data/schemas/carts/carts-list-schema.json');
  });

  test('GET /carts/1 contains products array', async ({ apiClient }) => {
    const response = await apiClient.get('/carts/1');

    responseValidator.status(response, 200);
    const body = (await response.json()) as {
      id: number;
      userId: number;
      products: Array<{ productId: number; quantity: number }>;
    };
    expect(body.products).toBeDefined();
    expect(Array.isArray(body.products)).toBe(true);
    expect(body.products.length).toBeGreaterThan(0);
    body.products.forEach((p) => {
      expect(p.productId).toBeDefined();
      expect(p.quantity).toBeDefined();
    });
  });
});
