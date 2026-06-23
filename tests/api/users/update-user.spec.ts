import { test } from '../../../src/fixtures';
import { responseValidator } from '../../../src/validators/responseValidator';

test.describe('@regression update user', () => {
  test('PUT /users/1 returns 200 with updated data', async ({ apiClient, testUser }) => {
    // Arrange
    const payload = {
      username: testUser.name.toLowerCase().replace(/\s+/g, '_'),
      email: testUser.email,
      password: 'Updated@1234',
    };

    // Act
    const response = await apiClient.put('/users/1', { data: payload });

    // Assert
    responseValidator.status(response, 200);
    await responseValidator.bodyContains(response, { email: testUser.email });
    // Note: FakeStoreAPI PUT response omits the id field
  });

  test('PATCH /users/1 returns 200 with partial update', async ({ apiClient }) => {
    // Arrange
    const payload = { username: 'patched_username' };

    // Act
    const response = await apiClient.patch('/users/1', { data: payload });

    // Assert
    responseValidator.status(response, 200);
    await responseValidator.bodyContains(response, { username: 'patched_username' });
  });
});
