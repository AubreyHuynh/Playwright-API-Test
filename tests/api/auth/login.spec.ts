import { test, expect } from '../../../src/fixtures';
import { responseValidator } from '../../../src/validators/responseValidator';
import { schemaValidator } from '../../../src/validators/schemaValidator';
import { config } from '../../../src/config/config';

test.describe('@smoke auth — login', () => {
  test('POST /auth/login with valid credentials returns 200 and token', async ({ apiClient }) => {
    // Arrange — use seeded FakeStoreAPI test account from config
    const payload = {
      username: config.credentials.username,
      password: config.credentials.password,
    };

    // Act
    const start = Date.now();
    const response = await apiClient.post('/auth/login', { data: payload });
    const elapsed = Date.now() - start;

    // Assert — FakeStoreAPI returns 200 for successful login
    responseValidator.status(response, 200);
    responseValidator.responseTime(elapsed);
    responseValidator.header(response, 'content-type', 'application/json');

    const body = await response.json();
    schemaValidator.validate(body, 'test-data/schemas/auth/login-response-schema.json');

    const typed = body as { token: string };
    expect(typed.token).toBeDefined();
    expect(typeof typed.token).toBe('string');
    expect(typed.token.length).toBeGreaterThan(0);
  });

  test('POST /auth/login with invalid credentials returns 401', async ({ apiClient }) => {
    // Arrange
    const payload = { username: 'no_such_user', password: 'wrong_password_xyz' };

    // Act
    const response = await apiClient.post('/auth/login', { data: payload });

    // Assert
    responseValidator.status(response, 401);
  });

  test('POST /auth/login token can be used as Bearer header', async ({
    apiClient,
    authManager,
  }) => {
    // Arrange — login and get token via AuthManager
    const token = await authManager.getBearerToken();
    expect(token).toBeTruthy();

    // Act — make an authenticated request using the token
    const response = await apiClient.get('/users/1', {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Assert — FakeStoreAPI doesn't enforce auth, verifies the request succeeds
    responseValidator.status(response, 200);
  });
});
