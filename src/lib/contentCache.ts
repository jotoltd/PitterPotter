const CACHE_KEY = 'pp_content_cache_v2';

const memoryCache: Record<string, string> = {};

function getKey(page: string, key: string): string {
  return `${page}::${key}`;
}

export function getCachedContent(page: string, key: string, defaultValue: string): string {
  const cacheKey = getKey(page, key);
  const cached = memoryCache[cacheKey];
  if (cached !== undefined && cached !== null && cached !== '') return cached;

  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const storedValue = parsed[cacheKey];
      if (storedValue !== undefined && storedValue !== null && storedValue !== '') {
        memoryCache[cacheKey] = storedValue;
        return storedValue;
      }
    }
  } catch {
    // Ignore localStorage parse errors
  }

  return defaultValue;
}

export function setCachedContent(page: string, key: string, value: string): void {
  if (value === undefined || value === null || value === '') return;

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
