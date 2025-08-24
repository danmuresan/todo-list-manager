import { randomUUID, randomBytes } from 'crypto';

/**
 * Generates a new random GUID.
 * @returns A new random GUID.
 */
export function newId(): string {
    return randomUUID();
}

/**
 * Generates a new random key.
 * @param length - The desired length of the key.
 * @returns A new random key.
 */
export function newKey(length = 10): string {
    // URL-safe base64 and trimmed to desired length
    const bytes: number = Math.ceil((length * 3) / 4);
    const str: string = randomBytes(bytes).toString('base64url');
    return str.slice(0, length);
}
