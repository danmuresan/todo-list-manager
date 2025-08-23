import { randomUUID, randomBytes } from 'crypto';

export function newId(): string {
  return randomUUID();
}

export function newKey(length = 10): string {
  // URL-safe base64 and trimmed to desired length
  const bytes = Math.ceil((length * 3) / 4);
  const str = randomBytes(bytes).toString('base64url');
  return str.slice(0, length);
}
