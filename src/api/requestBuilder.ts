import { APIResponse } from '@playwright/test';
import { ApiClient, RequestOptions } from './apiClient';
import { HeadersBuilder } from './headersBuilder';
import { PayloadBuilder } from './payloadBuilder';
import { QueryParams } from './queryParams';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type BuiltRequest = {
  method: HttpMethod;
  endpoint: string;
  options: RequestOptions;
};

const CLIENT_METHOD: Record<HttpMethod, keyof Pick<ApiClient, 'get' | 'post' | 'put' | 'patch' | 'delete'>> = {
  GET: 'get',
  POST: 'post',
  PUT: 'put',
  PATCH: 'patch',
  DELETE: 'delete',
};

export class RequestBuilder {
  private _method: HttpMethod = 'GET';
  private _endpoint = '';
  private _headers: Record<string, string> = {};
  private _params?: QueryParams | Record<string, string | number | boolean>;
  private _body?: unknown;
  private _timeout?: number;
  private _retries?: number;

  private constructor() {}

  // ── Static factories ───────────────────────────────────────────────────────

  static get(endpoint: string): RequestBuilder {
    return RequestBuilder._make('GET', endpoint);
  }

  static post(endpoint: string): RequestBuilder {
    return RequestBuilder._make('POST', endpoint);
  }

  static put(endpoint: string): RequestBuilder {
    return RequestBuilder._make('PUT', endpoint);
  }

  static patch(endpoint: string): RequestBuilder {
    return RequestBuilder._make('PATCH', endpoint);
  }

  static delete(endpoint: string): RequestBuilder {
    return RequestBuilder._make('DELETE', endpoint);
  }

  private static _make(method: HttpMethod, endpoint: string): RequestBuilder {
    const rb = new RequestBuilder();
    rb._method = method;
    rb._endpoint = endpoint;
    return rb;
  }

  // ── Chainable setters ──────────────────────────────────────────────────────

  header(name: string, value: string): this {
    this._headers[name] = value;
    return this;
  }

  headers(h: HeadersBuilder | Record<string, string>): this {
    const resolved = h instanceof HeadersBuilder ? h.build() : h;
    Object.assign(this._headers, resolved);
    return this;
  }

  params(p: QueryParams | Record<string, string | number | boolean>): this {
    this._params = p;
    return this;
  }

  param(key: string, value: string | number | boolean): this {
    if (this._params instanceof QueryParams) {
      this._params.add(key, value);
    } else {
      this._params = { ...(this._params ?? {}), [key]: value };
    }
    return this;
  }

  body(data: PayloadBuilder<Record<string, unknown>> | unknown): this {
    this._body = data instanceof PayloadBuilder ? data.build() : data;
    return this;
  }

  timeout(ms: number): this {
    this._timeout = ms;
    return this;
  }

  retries(count: number): this {
    this._retries = count;
    return this;
  }

  // ── Terminal operations ────────────────────────────────────────────────────

  build(): BuiltRequest {
    const options: RequestOptions = {};
    if (Object.keys(this._headers).length) options.headers = { ...this._headers };
    if (this._params !== undefined) options.params = this._params;
    if (this._body !== undefined) options.data = this._body;
    if (this._timeout !== undefined) options.timeout = this._timeout;
    if (this._retries !== undefined) options.retries = this._retries;

    return { method: this._method, endpoint: this._endpoint, options };
  }

  async execute(client: ApiClient): Promise<APIResponse> {
    const { method, endpoint, options } = this.build();
    return client[CLIENT_METHOD[method]](endpoint, options);
  }
}
