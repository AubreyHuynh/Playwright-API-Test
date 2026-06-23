export class HeadersBuilder {
  private readonly _headers: Record<string, string> = {};

  private constructor() {}

  static create(): HeadersBuilder {
    return new HeadersBuilder();
  }

  bearer(token: string): this {
    this._headers['Authorization'] = `Bearer ${token}`;
    return this;
  }

  basicAuth(username: string, password: string): this {
    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    this._headers['Authorization'] = `Basic ${encoded}`;
    return this;
  }

  apiKey(key: string, headerName = 'x-api-key'): this {
    this._headers[headerName] = key;
    return this;
  }

  contentType(type: string): this {
    this._headers['Content-Type'] = type;
    return this;
  }

  accept(type: string): this {
    this._headers['Accept'] = type;
    return this;
  }

  add(name: string, value: string): this {
    this._headers[name] = value;
    return this;
  }

  merge(headers: Record<string, string>): this {
    Object.assign(this._headers, headers);
    return this;
  }

  build(): Record<string, string> {
    return { ...this._headers };
  }
}
