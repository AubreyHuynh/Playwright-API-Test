import { test, expect } from '../../../src/fixtures';
import { PayloadBuilder } from '../../../src/api/payloadBuilder';
import { responseValidator } from '../../../src/validators/responseValidator';

// Note: FakeStoreAPI POST /users returns only {"id": N} — it does not echo back the full user object.
// Assertions are scoped to what the API actually returns.

test.describe('@smoke @regression create user', () => {
  test('POST /users returns 200 with created id', async ({ apiClient, testUser }) => {
    // Arrange
    const payload = PayloadBuilder.fromObject({
      username: testUser.name.toLowerCase().replace(/\s+/g, '_'),
      email: testUser.email,
      password: 'Test@1234',
    }).build();

    // Act
    const start = Date.now();
    const response = await apiClient.post('/users', { data: payload });
    const elapsed = Date.now() - start;

    // Assert
    responseValidator.status(response, 200);
    responseValidator.responseTime(elapsed);
    responseValidator.header(response, 'content-type', 'application/json');

    const body = (await response.json()) as Record<string, unknown>;
    expect(body.id).toBeDefined();
  });

  test('POST /users with file payload returns 200', async ({ apiClient }) => {
    // Arrange
    const payload = PayloadBuilder.fromFile<{ username: string; email: string; password: string }>(
      'test-data/payloads/users/create-user.json',
    ).build();

    // Act
    const response = await apiClient.post('/users', { data: payload });

    // Assert
    responseValidator.status(response, 200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.id).toBeDefined();
  });

  test('POST /users with dynamic payload override returns 200', async ({ apiClient, testUser }) => {
    // Arrange — start from static file, override with dynamic data
    const payload = PayloadBuilder.fromFile<{ username: string; email: string; password: string }>(
      'test-data/payloads/users/create-user.json',
    )
      .set('email', testUser.email)
      .set('username', testUser.name.toLowerCase().replace(/\s+/g, '_'))
      .build();

    // Act
    const response = await apiClient.post('/users', { data: payload });

    // Assert
    responseValidator.status(response, 200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.id).toBeDefined();
  });
});
