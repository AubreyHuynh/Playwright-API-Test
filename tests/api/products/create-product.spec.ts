import { test, expect } from '../../../src/fixtures';
import { PayloadBuilder } from '../../../src/api/payloadBuilder';
import { responseValidator } from '../../../src/validators/responseValidator';

test.describe('@smoke @regression create product', () => {
  test('POST /products returns 200 with dynamic data', async ({ apiClient, testProduct }) => {
    // Arrange
    const payload = PayloadBuilder.fromObject({
      title: testProduct.title,
      price: testProduct.price,
      description: testProduct.description,
      category: testProduct.category,
      image: testProduct.image,
    }).build();

    // Act
    const start = Date.now();
    const response = await apiClient.post('/products', { data: payload });
    const elapsed = Date.now() - start;

    // Assert
    responseValidator.status(response, 200);
    responseValidator.responseTime(elapsed);
    responseValidator.header(response, 'content-type', 'application/json');
    await responseValidator.bodyContains(response, {
      title: testProduct.title,
      price: testProduct.price,
    });

    const body = (await response.json()) as Record<string, unknown>;
    expect(body.id).toBeDefined();
  });

  test('POST /products with file payload returns 200', async ({ apiClient }) => {
    // Arrange
    const payload = PayloadBuilder.fromFile<{
      title: string;
      price: number;
      description: string;
      category: string;
      image: string;
    }>('test-data/payloads/products/create-product.json').build();

    // Act
    const response = await apiClient.post('/products', { data: payload });

    // Assert
    responseValidator.status(response, 200);
    await responseValidator.bodyContains(response, { title: 'QA Test Product' });
  });

  test('POST /products with dynamic payload override returns 200', async ({
    apiClient,
    testProduct,
  }) => {
    // Arrange — start from static file, override with dynamic data
    const payload = PayloadBuilder.fromFile<{
      title: string;
      price: number;
      description: string;
      category: string;
      image: string;
    }>('test-data/payloads/products/create-product.json')
      .set('title', testProduct.title)
      .set('price', testProduct.price)
      .build();

    // Act
    const response = await apiClient.post('/products', { data: payload });

    // Assert
    responseValidator.status(response, 200);
    await responseValidator.bodyContains(response, { title: testProduct.title });
  });
});
