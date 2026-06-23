import * as fs from 'fs';
import * as path from 'path';

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
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  load(): string | null {
    if (!fs.existsSync(this.filePath)) return null;
    const data = JSON.parse(fs.readFileSync(this.filePath, 'utf-8')) as TokenData;
    if (Date.now() > data.expiresAt) {
      this.clear();
      return null;
    }
    return data.token;
  }

  clear(): void {
    if (fs.existsSync(this.filePath)) fs.unlinkSync(this.filePath);
  }
}
