import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPayloadClient } from "./lib/get-payload";
import { rewriteUrlForLocalDev, type UrlRewriteContext } from "./lib/current-site";

const DEFAULT_DOMAIN = "www.garnishmusicproduction.com";

function resolveProductionDomain(host: string): string {
  const hostname = host.split(":")[0];
  if (hostname === "localhost" || hostname === "127.0.0.1") return DEFAULT_DOMAIN;
  if (hostname.endsWith(".localhost")) {
    const subdomain = hostname.replace(".localhost", "");
    return subdomain === "www" ? DEFAULT_DOMAIN : `${subdomain}.garnishmusicproduction.com`;
  }
  return hostname;
}

function stripTrailingSlash(p: string): string {
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

// Static-file-looking paths (has a dot in the last segment) never get a
// trailing slash appended, matching WordPress's own behavior.
function looksLikeStaticFile(p: string): boolean {
  const lastSegment = p.split("/").pop() || "";
  return lastSegment.includes(".");
}

export async function proxy(request: NextRequest) {
  const rawPathname = request.nextUrl.pathname;
  const pathname = stripTrailingSlash(rawPathname);
  const host = request.headers.get("host") || DEFAULT_DOMAIN;
  const domain = resolveProductionDomain(host);
  const hostname = host.split(":")[0];
  const isLocalDev = hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost");

  const payload = await getPayloadClient();

  const allSites = await payload.find({ collection: "sites", limit: 100 });
  const site = allSites.docs.find((s: any) => s.domain === domain);
  if (!site) return NextResponse.next();

  const redirects = await payload.find({
    collection: "redirects",
    where: { and: [{ site: { equals: site.id } }, { source: { equals: pathname } }] },
    limit: 1,
  });
  const match = redirects.docs[0];
  if (match) {
    let destination = match.destination;
    if (isLocalDev) {
      const port = host.includes(":") ? host.split(":")[1] : "";
      const localBase = port ? `localhost:${port}` : "localhost";
      const domainMap = new Map<string, string>();
      for (const s of allSites.docs) {
        domainMap.set(s.domain, s.slug);
        if (s.isMainSite) domainMap.set(s.domain.replace(/^www\./, ""), s.slug);
      }
      const ctx: UrlRewriteContext = { localBase, domainMap };
      destination = rewriteUrlForLocalDev(destination, ctx);
    }
    return NextResponse.redirect(new URL(destination, request.url), match.statusCode || 301);
  }

  // No custom redirect - enforce WordPress's trailing-slash convention for
  // everything else (real content pages only; proxy's matcher already
  // excludes /api, /admin, /_next, /theme, and other static routes).
  if (!rawPathname.endsWith("/") && !looksLikeStaticFile(rawPathname)) {
    // NextURL (request.nextUrl) normalizes away trailing slashes on
    // assignment, silently undoing this redirect. Build a plain URL instead.
    const target = new URL(request.url);
    target.pathname = rawPathname + "/";
    return NextResponse.redirect(target.toString(), 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|theme|admin|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
