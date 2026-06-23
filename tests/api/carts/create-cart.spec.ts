import { test, expect } from '../../../src/fixtures';
import { PayloadBuilder } from '../../../src/api/payloadBuilder';
import { responseValidator } from '../../../src/validators/responseValidator';

test.describe('@smoke @regression create cart', () => {
  test('POST /carts returns 201 with dynamic data', async ({ apiClient }) => {
    // Arrange
    const payload = PayloadBuilder.fromObject({
      userId: 1,
      products: [
        { productId: 1, quantity: 2 },
        { productId: 3, quantity: 1 },
      ],
    }).build();

    // Act
    const start = Date.now();
    const response = await apiClient.post('/carts', { data: payload });
    const elapsed = Date.now() - start;

    // Assert
    responseValidator.status(response, 201);
    responseValidator.responseTime(elapsed);
    responseValidator.header(response, 'content-type', 'application/json');

    const body = (await response.json()) as Record<string, unknown>;
    expect(body.id).toBeDefined();
  });

  test('POST /carts with file payload returns 201', async ({ apiClient }) => {
    // Arrange
    const payload = PayloadBuilder.fromFile<{
      userId: number;
      products: Array<{ productId: number; quantity: number }>;
    }>('test-data/payloads/carts/create-cart.json').build();

    // Act
    const response = await apiClient.post('/carts', { data: payload });

    // Assert
    responseValidator.status(response, 201);
    await responseValidator.bodyContains(response, { userId: 1 });
  });

  test('POST /carts with dynamic payload override returns 201', async ({ apiClient }) => {
    // Arrange — start from static file, override userId
    const payload = PayloadBuilder.fromFile<{
      userId: number;
      products: Array<{ productId: number; quantity: number }>;
    }>('test-data/payloads/carts/create-cart.json')
      .set('userId', 2)
      .build();

    // Act
    const response = await apiClient.post('/carts', { data: payload });

    // Assert
    responseValidator.status(response, 201);
    await responseValidator.bodyContains(response, { userId: 2 });
  });
});
