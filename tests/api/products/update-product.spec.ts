import { test } from '../../../src/fixtures';
import { responseValidator } from '../../../src/validators/responseValidator';

test.describe('@regression update product', () => {
  test('PUT /products/1 returns 200 with updated data', async ({ apiClient, testProduct }) => {
    // Arrange
    const payload = {
      title: testProduct.title,
      price: testProduct.price,
      description: testProduct.description,
      category: testProduct.category,
      image: testProduct.image,
    };

    // Act
    const response = await apiClient.put('/products/1', { data: payload });

    // Assert
    responseValidator.status(response, 200);
    await responseValidator.bodyContains(response, { title: testProduct.title });
    // Note: FakeStoreAPI PUT response omits the id field
  });

  test('PATCH /products/1 returns 200 with partial update', async ({ apiClient }) => {
    // Arrange
    const payload = { title: 'Patched Product Title' };

    // Act
    const response = await apiClient.patch('/products/1', { data: payload });

    // Assert
    responseValidator.status(response, 200);
    await responseValidator.bodyContains(response, { title: 'Patched Product Title' });
  });
});
