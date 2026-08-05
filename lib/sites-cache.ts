import { getPayloadClient } from "./get-payload";

// proxy.ts, getCurrentSite(), and getUrlRewriteContext() each ran their own
// full `sites` query on every single request (confirmed: 3 separate
// round-trips to Neon for site data alone per page view), even though site
// records change on the order of "someone edits it in the admin," not per
// request. Combined with Neon's multi-second serverless round-trip latency
// in this environment, that's pure added latency on every page load for
// data that's the same as it was a few seconds ago. A short in-process TTL
// cache collapses those to at most one real query per window; proxy.ts now
// runs on the Node.js runtime by default (not Edge), so this module-scope
// cache reliably persists across requests within the same server process.
const TTL_MS = 30_000;
let cache: { sites: any[]; expiresAt: number } | null = null;
let inFlight: Promise<any[]> | null = null;

export async function getAllSitesCached(): Promise<any[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.sites;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const payload = await getPayloadClient();
    const result = await payload.find({ collection: "sites", limit: 100 });
    cache = { sites: result.docs, expiresAt: Date.now() + TTL_MS };
    inFlight = null;
    return result.docs;
  })();

  return inFlight;
}
