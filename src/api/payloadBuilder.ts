import * as fs from 'fs';
import * as path from 'path';

export class PayloadBuilder<T extends Record<string, unknown>> {
  private payload: T;

  private constructor(base: T) {
    this.payload = structuredClone(base);
  }

  static fromFile<T extends Record<string, unknown>>(relativePath: string): PayloadBuilder<T> {
    const abs = path.resolve(process.cwd(), relativePath);
    const raw = fs.readFileSync(abs, 'utf-8');
    return new PayloadBuilder<T>(JSON.parse(raw) as T);
  }

  static fromObject<T extends Record<string, unknown>>(obj: T): PayloadBuilder<T> {
    return new PayloadBuilder<T>(structuredClone(obj));
  }

  set<K extends keyof T>(key: K, value: T[K]): this {
    this.payload[key] = value;
    return this;
  }

  merge(partial: Partial<T>): this {
    Object.assign(this.payload, partial);
    return this;
  }

  build(): T {
    return structuredClone(this.payload);
  }
}
