const CACHE_KEY = 'pp_content_cache_v2';

const memoryCache: Record<string, string> = {};

function getKey(page: string, key: string): string {
  return `${page}::${key}`;
}

export function getCachedContent(page: string, key: string, defaultValue: string): string {
  const cacheKey = getKey(page, key);
  if (memoryCache[cacheKey] !== undefined) return memoryCache[cacheKey];

  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed[cacheKey] !== undefined) {
        memoryCache[cacheKey] = parsed[cacheKey];
        return parsed[cacheKey];
      }
    }
  } catch {
    // Ignore localStorage parse errors
  }

  return defaultValue;
}

export function setCachedContent(page: string, key: string, value: string): void {
  const cacheKey = getKey(page, key);
  memoryCache[cacheKey] = value;

  try {
    const stored = localStorage.getItem(CACHE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    parsed[cacheKey] = value;
    localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore localStorage write errors
  }
}
