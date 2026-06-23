import { test, expect } from '../../../src/fixtures';
import { responseValidator } from '../../../src/validators/responseValidator';

test.describe('@regression update cart', () => {
  test('PUT /carts/1 returns 200 with updated data', async ({ apiClient }) => {
    // Arrange
    const payload = {
      userId: 1,
      products: [
        { productId: 5, quantity: 3 },
        { productId: 10, quantity: 1 },
      ],
    };

    // Act
    const response = await apiClient.put('/carts/1', { data: payload });

    // Assert
    responseValidator.status(response, 200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.userId).toBe(1);
    // Note: FakeStoreAPI PUT response omits the id field
  });

  test('PATCH /carts/1 returns 200 with partial update', async ({ apiClient }) => {
    // Arrange — partial update, only changing products
    const payload = {
      products: [{ productId: 7, quantity: 2 }],
    };

    // Act
    const response = await apiClient.patch('/carts/1', { data: payload });

    // Assert
    responseValidator.status(response, 200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toBeDefined();
  });
});
