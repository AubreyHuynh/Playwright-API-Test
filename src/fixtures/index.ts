import { test as base, APIRequestContext } from '@playwright/test';
import { ApiClient } from '../api/apiClient';
import { AuthManager } from '../auth/authManager';
import { testDataFactory, UserData, ProductData } from '../helpers/testDataFactory';
import { logger } from '../utils/logger';

type CleanupFn = () => Promise<void>;

interface ApiFixtures {
  apiClient: ApiClient;
  authManager: AuthManager;
  testUser: UserData;
  testProduct: ProductData;
  cleanup: (fn: CleanupFn) => void;
}

export const test = base.extend<ApiFixtures>({
  apiClient: async (
    { request }: { request: APIRequestContext },
    use: (client: ApiClient) => Promise<void>,
  ) => {
    await use(new ApiClient(request));
  },

  authManager: async (
    { apiClient }: { apiClient: ApiClient },
    use: (manager: AuthManager) => Promise<void>,
  ) => {
    await use(new AuthManager(apiClient));
  },

  testUser: async ({}, use: (user: UserData) => Promise<void>) => {
    await use(testDataFactory.user());
  },

  testProduct: async ({}, use: (product: ProductData) => Promise<void>) => {
    await use(testDataFactory.product());
  },

  cleanup: async ({}, use: (register: (fn: CleanupFn) => void) => Promise<void>) => {
    const fns: CleanupFn[] = [];
    await use((fn: CleanupFn) => { fns.push(fn); });
    for (const fn of fns.reverse()) {
      await fn().catch((err: unknown) =>
        logger.error('Cleanup failed', err instanceof Error ? err.message : err),
      );
    }
  },
});

export { expect } from '@playwright/test';
