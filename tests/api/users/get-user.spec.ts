import { test, expect } from '../../../src/fixtures';
import { responseValidator } from '../../../src/validators/responseValidator';
import { schemaValidator } from '../../../src/validators/schemaValidator';

test.describe('@smoke @regression get user', () => {
  test('GET /users/1 returns 200 with valid schema', async ({ apiClient }) => {
    // Arrange — user ID 1 is always present in FakeStoreAPI

    // Act
    const start = Date.now();
    const response = await apiClient.get('/users/1');
    const elapsed = Date.now() - start;

    // Assert
    responseValidator.status(response, 200);
    responseValidator.responseTime(elapsed);
    responseValidator.header(response, 'content-type', 'application/json');
    const body = await response.json();
    schemaValidator.validate(body, 'test-data/schemas/users/user-schema.json');
  });

  test('GET /users/9999 returns 200 with empty or null body for non-existent user', async ({
    apiClient,
  }) => {
    // Note: FakeStoreAPI returns 200 with null/empty body for out-of-range IDs (not REST-standard 404)
    const response = await apiClient.get('/users/9999');
    responseValidator.status(response, 200);
    const text = await response.text();
    expect(['', 'null']).toContain(text.trim());
  });

  test('GET /users returns array of users with valid schema', async ({ apiClient }) => {
    const response = await apiClient.get('/users');

    responseValidator.status(response, 200);
    const body = await response.json();
    schemaValidator.validate(body, 'test-data/schemas/users/users-list-schema.json');
  });

  test('GET /users with limit param returns limited results', async ({ apiClient }) => {
    const response = await apiClient.get('/users', { params: { limit: 3 } });

    responseValidator.status(response, 200);
    const body = (await response.json()) as unknown[];
    expect(body.length).toBeLessThanOrEqual(3);
  });
});
