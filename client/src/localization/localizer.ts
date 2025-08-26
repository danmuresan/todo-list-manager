import catalog from './en.json';

type Entry = { value: string; description: string };
type Catalog = Record<string, Entry>;

const map: Catalog = catalog as Catalog;

/**
 * Retrieve a localized string by key.
 * @param key label key.
 * @returns localized string.
 */
export function localize(key: keyof typeof map | string): string {
  const k = String(key);
  return map[k]?.value ?? k;
}
