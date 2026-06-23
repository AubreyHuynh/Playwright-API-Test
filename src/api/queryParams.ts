import * as fs from 'fs';
import * as path from 'path';

type ParamValue = string | number | boolean;

interface ParamEntry {
  key: string;
  value: ParamValue;
  enabled: boolean;
  description?: string;
}

export class QueryParams {
  private entries: ParamEntry[] = [];

  private constructor() {}

  static create(): QueryParams {
    return new QueryParams();
  }

  static fromEntries(entries: ParamEntry[]): QueryParams {
    const qp = new QueryParams();
    qp.entries = entries.map((e) => ({ ...e }));
    return qp;
  }

  static fromFile(relativePath: string): QueryParams {
    const abs = path.resolve(process.cwd(), relativePath);
    const entries = JSON.parse(fs.readFileSync(abs, 'utf-8')) as ParamEntry[];
    return QueryParams.fromEntries(entries);
  }

  add(key: string, value: ParamValue, enabled = true, description?: string): this {
    this.entries.push({ key, value, enabled, description });
    return this;
  }

  disable(key: string): this {
    const entry = this.entries.find((e) => e.key === key);
    if (entry) entry.enabled = false;
    return this;
  }

  enable(key: string): this {
    const entry = this.entries.find((e) => e.key === key);
    if (entry) entry.enabled = true;
    return this;
  }

  set(key: string, value: ParamValue): this {
    const entry = this.entries.find((e) => e.key === key);
    if (entry) {
      entry.value = value;
    } else {
      this.entries.push({ key, value, enabled: true });
    }
    return this;
  }

  build(): Record<string, ParamValue> {
    return Object.fromEntries(
      this.entries.filter((e) => e.enabled).map((e) => [e.key, e.value]),
    );
  }
}
