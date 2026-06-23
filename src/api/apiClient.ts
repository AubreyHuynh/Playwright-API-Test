import { APIRequestContext, APIResponse } from '@playwright/test';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/errorHandler';
import { QueryParams } from './queryParams';

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: QueryParams | Record<string, string | number | boolean>;
  timeout?: number;
  retries?: number;
  data?: unknown;
}

export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  get(endpoint: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.send('GET', endpoint, opts);
  }

  post(endpoint: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.send('POST', endpoint, opts);
  }

  put(endpoint: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.send('PUT', endpoint, opts);
  }

  patch(endpoint: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.send('PATCH', endpoint, opts);
  }

  delete(endpoint: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.send('DELETE', endpoint, opts);
  }

  private async send(
    method: string,
    endpoint: string,
    opts: RequestOptions,
    attempt = 1,
  ): Promise<APIResponse> {
    const url = endpoint.startsWith('http') ? endpoint : `${config.baseUrl}${endpoint}`;
    const timeout = opts.timeout ?? config.timeout;
    const maxRetries = opts.retries ?? config.retryCount;
    const params =
      opts.params instanceof QueryParams
        ? opts.params.build()
        : (opts.params as Record<string, string | number | boolean> | undefined);

    logger.logRequest(method, url, opts.headers, opts.data);
    const start = Date.now();

    try {
      const response = await this.request.fetch(url, {
        method,
        headers: opts.headers,
        params: params as Record<string, string | number | boolean>,
        data: opts.data !== undefined ? JSON.stringify(opts.data) : undefined,
        timeout,
      });
      const elapsed = Date.now() - start;
      const body = await response.json().catch(() => ({}));
      logger.logResponse(response.status(), body, elapsed);
      return response;
    } catch (error) {
      if (attempt <= maxRetries) {
        logger.warn(`Retry ${attempt}/${maxRetries} for ${method} ${url}`);
        return this.send(method, endpoint, opts, attempt + 1);
      }
      throw new ApiError(`${method} ${url} failed after ${maxRetries} retries`, error);
    }
  }
}
