import { headers } from "next/headers";
import { getAllSitesCached } from "./sites-cache";

const DEFAULT_DOMAIN = "www.garnishmusicproduction.com";

// Maps a local dev hostname (e.g. "edu.localhost", "localhost") to the
// production domain it should mirror, so lookups work the same locally
// as they will once real subdomains are wired up (Vercel wildcard domains, etc.)
function resolveProductionDomain(host: string): string {
  const hostname = host.split(":")[0];
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return DEFAULT_DOMAIN;
  }
  if (hostname.endsWith(".localhost")) {
    const subdomain = hostname.replace(".localhost", "");
    return subdomain === "www"
      ? DEFAULT_DOMAIN
      : `${subdomain}.garnishmusicproduction.com`;
  }
  return hostname;
}

export async function getCurrentSite() {
  const headerList = await headers();
  const host = headerList.get("host") || DEFAULT_DOMAIN;
  const domain = resolveProductionDomain(host);

  const sites = await getAllSitesCached();
  return sites.find((s: any) => s.domain === domain) || null;
}

// Context needed to rewrite absolute production-domain URLs (baked into
// migrated WordPress menu data) so they stay on the right *.localhost
// subdomain during local dev, while leaving them untouched in production
// where garnishmusicproduction.com is the real domain.
export type UrlRewriteContext = {
  localBase: string | null; // e.g. "localhost:3000", or null when not local dev
  domainMap: Map<string, string>; // production domain -> site slug
};

export async function getUrlRewriteContext(): Promise<UrlRewriteContext> {
  const headerList = await headers();
  const host = headerList.get("host") || "";
  const hostname = host.split(":")[0];
  const isLocalDev = hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost");

  if (!isLocalDev) {
    return { localBase: null, domainMap: new Map() };
  }

  const port = host.includes(":") ? host.split(":")[1] : "";
  const localBase = port ? `localhost:${port}` : "localhost";

  const sites = await getAllSitesCached();
  const domainMap = new Map<string, string>();
  for (const site of sites) {
    domainMap.set(site.domain, site.slug);
    // WordPress menu data sometimes links the main site without "www."
    if (site.isMainSite) {
      domainMap.set(site.domain.replace(/^www\./, ""), site.slug);
    }
  }

  return { localBase, domainMap };
}

export function rewriteUrlForLocalDev(url: string, ctx: UrlRewriteContext): string {
  if (!ctx.localBase) return url;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url; // relative URL, or not a valid absolute URL - leave as-is
  }
  const slug = ctx.domainMap.get(parsed.hostname);
  if (slug === undefined) return url; // external link, not one of our sites
  // Always prefix the slug, even "www" -> "www.localhost:PORT", rather than
  // special-casing it down to bare "localhost:PORT". Next.js's dev server
  // treats "localhost:PORT" (and "127.0.0.1:PORT") as its own canonical
  // origin and silently relativizes any redirect Location header targeting
  // it, regardless of what request.url reports. For a *.localhost request,
  // that collapses a cross-subdomain redirect (e.g. ber.localhost -> main
  // site) into a same-origin relative one, which the browser then resolves
  // against the host it's actually talking to - producing an infinite
  // self-redirect loop. "www.localhost" is a distinct hostname Next doesn't
  // recognize as itself, and proxy.ts's resolveProductionDomain() already
  // maps it to the main site same as bare "localhost" does.
  const newHost = `${slug}.${ctx.localBase}`;
  // Force http: - the local dev server doesn't terminate TLS on this port.
  return `http://${newHost}${parsed.pathname}${parsed.search}${parsed.hash}`;
}

// Rewrites every href="https://<our-domain>/..." occurrence inside a raw
// HTML string (e.g. the static scraped header/footer markup) the same way,
// so static chrome doesn't send visitors off to production while dev-testing.
export function rewriteHtmlLinksForLocalDev(html: string, ctx: UrlRewriteContext): string {
  if (!ctx.localBase) return html;
  return html.replace(/href="(https?:\/\/[^"]+)"/g, (match, url) => {
    const rewritten = rewriteUrlForLocalDev(url, ctx);
    return `href="${rewritten}"`;
  });
}
