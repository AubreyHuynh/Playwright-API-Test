import { test } from '../../../src/fixtures';
import { responseValidator } from '../../../src/validators/responseValidator';

test.describe('@regression delete cart', () => {
  test('DELETE /carts/1 returns 200', async ({ apiClient }) => {
    // Arrange — FakeStoreAPI simulates deletion, always returns 200 with the deleted object

    // Act
    const response = await apiClient.delete('/carts/1');

    // Assert
    responseValidator.status(response, 200);
  });
});
