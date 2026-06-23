import { test } from '../../../src/fixtures';
import { responseValidator } from '../../../src/validators/responseValidator';

test.describe('@regression delete user', () => {
  test('DELETE /users/1 returns 200', async ({ apiClient }) => {
    // Arrange — FakeStoreAPI simulates deletion, always returns 200 with the deleted object

    // Act
    const response = await apiClient.delete('/users/1');

    // Assert
    responseValidator.status(response, 200);
  });
});
