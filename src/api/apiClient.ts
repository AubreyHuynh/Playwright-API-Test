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
  retryDelayMs?: number;
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
    const url = this.resolveUrl(endpoint);
    const timeout = opts.timeout ?? config.timeout;
    const maxRetries = Math.max(0, opts.retries ?? config.retryCount);
    const retryDelayMs = Math.max(0, opts.retryDelayMs ?? config.retryDelayMs);
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
        data: opts.data,
        timeout,
      });
      const elapsed = Date.now() - start;
      const body = await this.readResponseBody(response);
      logger.logResponse(response.status(), body, elapsed);

      if (this.shouldRetryStatus(response.status()) && attempt <= maxRetries) {
        await this.waitBeforeRetry(method, url, attempt, maxRetries, retryDelayMs, response.status());
        return this.send(method, endpoint, opts, attempt + 1);
      }

      return response;
    } catch (error) {
      if (attempt <= maxRetries && this.shouldRetryError(error)) {
        await this.waitBeforeRetry(method, url, attempt, maxRetries, retryDelayMs, undefined, error);
        return this.send(method, endpoint, opts, attempt + 1);
      }
      throw new ApiError(
        `${method} ${url} failed after ${attempt} attempt${attempt === 1 ? '' : 's'}`,
        error,
      );
    }
  }

  private resolveUrl(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) return endpoint;

    const baseUrl = config.baseUrl.replace(/\/+$/, '');
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${normalizedEndpoint}`;
  }

  private shouldRetryStatus(status: number): boolean {
    return status === 408 || status === 429 || status >= 500;
  }

  private shouldRetryError(error: unknown): boolean {
    if (!(error instanceof Error)) return true;

    const message = error.message.toLowerCase();
    return [
      'timeout',
      'timed out',
      'econnreset',
      'econnrefused',
      'enotfound',
      'network',
      'socket',
    ].some((pattern) => message.includes(pattern));
  }

  private async waitBeforeRetry(
    method: string,
    url: string,
    attempt: number,
    maxRetries: number,
    retryDelayMs: number,
    status?: number,
    error?: unknown,
  ): Promise<void> {
    const reason =
      status !== undefined
        ? `HTTP ${status}`
        : error instanceof Error
          ? error.message
          : 'transient request error';

    logger.warn(`Retry ${attempt}/${maxRetries} for ${method} ${url}`, { reason });

    if (retryDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
    }
  }

  private async readResponseBody(response: APIResponse): Promise<unknown> {
    const contentType = response.headers()['content-type'] ?? '';
    const text = await response.text().catch(() => '');

    if (!text) return null;

    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(text) as unknown;
      } catch {
        return text;
      }
    }

    return text;
  }
}
