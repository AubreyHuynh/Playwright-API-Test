import { APIResponse, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_MAX_RESPONSE_TIME_MS = 3000;

export const responseValidator = {
  status(response: APIResponse, expected: number): void {
    expect(response.status(), `Expected HTTP ${expected} but got ${response.status()}`).toBe(
      expected,
    );
  },

  responseTime(elapsedMs: number, maxMs = DEFAULT_MAX_RESPONSE_TIME_MS): void {
    expect(elapsedMs, `Response time ${elapsedMs}ms exceeds limit of ${maxMs}ms`).toBeLessThan(
      maxMs,
    );
  },

  header(response: APIResponse, name: string, expected: string | RegExp): void {
    const val = response.headers()[name.toLowerCase()];
    if (expected instanceof RegExp) {
      expect(val, `Header '${name}'`).toMatch(expected);
    } else {
      expect(val, `Header '${name}'`).toContain(expected);
    }
  },

  async bodyContains(response: APIResponse, subset: Record<string, unknown>): Promise<void> {
    const body = (await response.json()) as Record<string, unknown>;
    for (const [key, value] of Object.entries(subset)) {
      expect(body[key], `Body field '${key}'`).toEqual(value);
    }
  },

  async bodyEquals(response: APIResponse, expected: unknown): Promise<void> {
    const body = await response.json();
    expect(body).toEqual(expected);
  },

  async bodyMatchesFile(
    response: APIResponse,
    filePath: string,
    ignoreFields: string[] = [],
  ): Promise<void> {
    const abs = path.resolve(process.cwd(), filePath);
    const expected = JSON.parse(fs.readFileSync(abs, 'utf-8')) as Record<string, unknown>;
    const body = (await response.json()) as Record<string, unknown>;
    ignoreFields.forEach((k) => {
      delete expected[k];
      delete body[k];
    });
    expect(body).toMatchObject(expected);
  },
};
