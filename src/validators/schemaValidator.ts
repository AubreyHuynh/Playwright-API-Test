import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';
import { SchemaError } from '../utils/errorHandler';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const cache = new Map<string, ValidateFunction>();

export const schemaValidator = {
  fromFile(schemaPath: string): ValidateFunction {
    if (cache.has(schemaPath)) return cache.get(schemaPath)!;
    const abs = path.resolve(process.cwd(), schemaPath);
    const schema = JSON.parse(fs.readFileSync(abs, 'utf-8')) as Record<string, unknown>;
    const validate = ajv.compile(schema);
    cache.set(schemaPath, validate);
    return validate;
  },

  validate(data: unknown, schemaPath: string): void {
    const validate = this.fromFile(schemaPath);
    if (!validate(data)) {
      const errors = ajv.errorsText(validate.errors);
      throw new SchemaError(`Schema validation failed for '${schemaPath}': ${errors}`);
    }
  },

  validateInline(data: unknown, schema: Record<string, unknown>): void {
    const validate = ajv.compile(schema);
    if (!validate(data)) {
      const errors = ajv.errorsText(validate.errors);
      throw new SchemaError(`Schema validation failed: ${errors}`);
    }
  },
};
