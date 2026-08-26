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
    try {
      const payload = await getPayloadClient();
      const result = await payload.find({ collection: "sites", limit: 100 });
      cache = { sites: result.docs, expiresAt: Date.now() + TTL_MS };
      return result.docs;
    } finally {
      // Must run on the failure path too (a transient Neon blip, not just
      // the success path) - inFlight = null sitting only after the query
      // was unreachable once payload.find() threw, permanently pinning
      // inFlight to that one rejected promise for the rest of this server
      // process's life. Every request after that point immediately
      // re-awaited (and re-threw) the same stale rejection forever, with no
      // way to recover short of restarting the dev server - confirmed as
      // the actual cause of a real "Failed query: select count(*) from
      // sites" error that kept recurring on every request long after the
      // underlying DB round trip was healthy again.
      inFlight = null;
    }
  })();

  return inFlight;
}
