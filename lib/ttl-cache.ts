// Generic version of the module-scope TTL cache pattern already proven in
// sites-cache.ts for exactly this environment's problem: every DB round trip
// (Neon serverless Postgres) costs multiple seconds, but this app's content
// changes on the order of "someone edits it," not per request. This module
// runs on the Node.js runtime (not Edge), so the cache reliably persists
// across requests within the same warm server process/lambda instance - it
// does not persist across cold starts or share state between instances, but
// collapses repeat requests hitting the same warm instance to zero extra DB
// round trips instead of one (or several, for pages with many distinct
// content categories) per request.
type Entry<T> = { value: T; expiresAt: number };

export function createTtlCache<T>(ttlMs: number) {
  const cache = new Map<string, Entry<T>>();
  const inFlight = new Map<string, Promise<T>>();

  return async function getCached(key: string, compute: () => Promise<T>): Promise<T> {
    const hit = cache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.value;

    const pending = inFlight.get(key);
    if (pending) return pending;

    const promise = (async () => {
      try {
        const value = await compute();
        cache.set(key, { value, expiresAt: Date.now() + ttlMs });
        return value;
      } finally {
        inFlight.delete(key);
      }
    })();
    inFlight.set(key, promise);
    return promise;
  };
}
