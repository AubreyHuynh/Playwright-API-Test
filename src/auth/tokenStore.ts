import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

interface TokenData {
  token: string;
  expiresAt: number;
}

export class TokenStore {
  private readonly filePath: string;

  constructor(relativePath: string) {
    this.filePath = path.resolve(process.cwd(), relativePath);
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
  }

  save(token: string, ttlSeconds = 3600): void {
    const data: TokenData = {
      token,
      expiresAt: Date.now() + ttlSeconds * 1000,
    };
    const tempPath = `${this.filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
    fs.renameSync(tempPath, this.filePath);
  }

  load(): string | null {
    if (!fs.existsSync(this.filePath)) return null;
    try {
      const data = JSON.parse(fs.readFileSync(this.filePath, 'utf-8')) as TokenData;
      if (!data.token || typeof data.expiresAt !== 'number' || Date.now() > data.expiresAt) {
        this.clear();
        return null;
      }
      return data.token;
    } catch (error) {
      logger.warn('Token cache was unreadable and has been cleared', {
        path: this.filePath,
        error: error instanceof Error ? error.message : error,
      });
      this.clear();
      return null;
    }
  }

  clear(): void {
    if (fs.existsSync(this.filePath)) fs.unlinkSync(this.filePath);
  }
}
