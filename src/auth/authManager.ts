import { ApiClient } from '../api/apiClient';
import { config } from '../config/config';
import { TokenStore } from './tokenStore';
import { AuthError } from '../utils/errorHandler';

export type AuthStrategy = 'bearer' | 'apiKey' | 'basic' | 'none';

export interface AuthHeaders {
  Authorization?: string;
  'x-api-key'?: string;
}

export class AuthManager {
  private readonly tokenStore: TokenStore;

  constructor(private readonly client: ApiClient) {
    this.tokenStore = new TokenStore(config.authStatePath);
  }

  async getHeaders(strategy: AuthStrategy = 'bearer'): Promise<AuthHeaders> {
    switch (strategy) {
      case 'bearer':
        return { Authorization: `Bearer ${await this.getBearerToken()}` };

      case 'apiKey':
        if (!config.apiKey) throw new AuthError('API_KEY env var is not set');
        return { 'x-api-key': config.apiKey };

      case 'basic': {
        const { username, password } = config.credentials;
        if (!username || !password) throw new AuthError('Username/password env vars are not set');
        const encoded = Buffer.from(`${username}:${password}`).toString('base64');
        return { Authorization: `Basic ${encoded}` };
      }

      case 'none':
        return {};
    }
  }

  async getBearerToken(): Promise<string> {
    const cached = this.tokenStore.load();
    if (cached) return cached;

    const { username, password } = config.credentials;
    if (!username || !password) throw new AuthError('Credentials env vars are not set for login');

    const response = await this.client.post('/auth/login', {
      data: { username, password },
    });

    if (!response.ok()) {
      const body = await response.text();
      throw new AuthError(`Login failed (${response.status()}): ${body}`);
    }

    const body = (await response.json()) as { token: string };
    if (!body.token) {
      throw new AuthError('Login response did not include a bearer token');
    }
    this.tokenStore.save(body.token);
    return body.token;
  }

  invalidate(): void {
    this.tokenStore.clear();
  }
}
