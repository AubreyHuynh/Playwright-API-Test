import * as fs from 'fs';
import * as path from 'path';
import { APIResponse } from '@playwright/test';
import { ApiClient } from './apiClient';
import { QueryParams } from './queryParams';

export interface RequestParam {
  key: string;
  value: string | number | boolean;
  enabled: boolean;
  description?: string;
}

export interface RequestDefinition {
  name: string;
  description?: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  headers?: Record<string, string>;
  params?: RequestParam[];
  body?: Record<string, unknown> | null;
}

const METHOD_MAP: Record<
  RequestDefinition['method'],
  keyof Pick<ApiClient, 'get' | 'post' | 'put' | 'patch' | 'delete'>
> = {
  GET: 'get',
  POST: 'post',
  PUT: 'put',
  PATCH: 'patch',
  DELETE: 'delete',
};

export class RequestLoader {
  static fromFile(relativePath: string): RequestDefinition {
    const abs = path.resolve(process.cwd(), relativePath);
    return JSON.parse(fs.readFileSync(abs, 'utf-8')) as RequestDefinition;
  }

  static async run(client: ApiClient, relativePath: string): Promise<APIResponse> {
    const def = RequestLoader.fromFile(relativePath);
    const params = def.params ? QueryParams.fromEntries(def.params).build() : undefined;

    const method = METHOD_MAP[def.method];
    return client[method](def.endpoint, {
      headers: def.headers,
      params,
      data: def.body ?? undefined,
    });
  }
}
