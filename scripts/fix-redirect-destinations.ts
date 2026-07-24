import { getPayload } from "payload";
import config from "../payload.config";

// For every redirect whose destination doesn't resolve to real local
// content, try to find the actual content by matching the destination's
// final path segment (the real slug) against our migrated Pages/Posts/
// Products for the same target site - regardless of what URL prefix
// (/classes/, /programs/, /training/, etc.) the stale redirect destination
// used. This fixes the common case where the redirect's stored destination
// itself points to an old/superseded WordPress URL structure.

function lastSegment(pathname: string): string {
  const parts = pathname.replace(/\/+$/, "").split("/");
  return parts[parts.length - 1] || "";
}

async function main() {
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });
  const siteByDomain = new Map(sites.docs.map((s: any) => [s.domain, s]));

  const redirects = await payload.find({ collection: "redirects", limit: 1000 });
  let checked = 0;
  let fixed = 0;
  let stillBroken = 0;
  let alreadyOk = 0;

  for (const redirect of redirects.docs as any[]) {
    checked++;
    let destUrl: URL;
    try {
      destUrl = new URL(redirect.destination);
    } catch {
      continue;
    }
    const destSite = siteByDomain.get(destUrl.hostname);
    if (!destSite) continue;

    const destPath = destUrl.pathname.replace(/^\/+|\/+$/g, "");
    // Already points at a product URL - check as-is.
    const existingPage = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: destSite.id } }, { slug: { equals: destPath } }] },
      limit: 1,
    });
    const existingPost = existingPage.docs.length
      ? { docs: [] }
      : await payload.find({
          collection: "posts",
          where: { and: [{ site: { equals: destSite.id } }, { slug: { equals: destPath } }] },
          limit: 1,
        });
    const existingProduct =
      existingPage.docs.length || existingPost.docs.length
        ? { docs: [] }
        : await payload.find({
            collection: "products",
            where: { and: [{ site: { equals: destSite.id } }, { slug: { equals: destPath } }] },
            limit: 1,
          });

    if (existingPage.docs.length || existingPost.docs.length || existingProduct.docs.length) {
      alreadyOk++;
      continue;
    }

    // Destination doesn't resolve directly - try matching the final path
    // segment (the real slug) against each collection for this site.
    const segment = lastSegment(destPath);
    if (!segment) {
      stillBroken++;
      continue;
    }

    const pageMatch = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: destSite.id } }, { slug: { equals: segment } }] },
      limit: 1,
    });
    const pageMatchNested = pageMatch.docs.length
      ? { docs: [] }
      : await payload.find({
          collection: "pages",
          where: { and: [{ site: { equals: destSite.id } }, { slug: { like: `/${segment}` } }] },
          limit: 1,
        });
    const postMatch =
      pageMatch.docs.length || pageMatchNested.docs.length
        ? { docs: [] }
        : await payload.find({
            collection: "posts",
            where: { and: [{ site: { equals: destSite.id } }, { slug: { equals: segment } }] },
            limit: 1,
          });
    const productMatch =
      pageMatch.docs.length || pageMatchNested.docs.length || postMatch.docs.length
        ? { docs: [] }
        : await payload.find({
            collection: "products",
            where: { and: [{ site: { equals: destSite.id } }, { slug: { equals: `product/${segment}` } }] },
            limit: 1,
          });

    const match =
      pageMatch.docs[0] || pageMatchNested.docs[0] || postMatch.docs[0] || productMatch.docs[0];

    if (match) {
      const newDestination = `https://${destSite.domain}/${match.slug}/`;
      await payload.update({
        collection: "redirects",
        id: redirect.id,
        data: { destination: newDestination },
      });
      console.log(`FIXED [${redirect.source}] ${redirect.destination} -> ${newDestination}`);
      fixed++;
    } else {
      stillBroken++;
    }
  }

  console.log(`\nDONE. Checked: ${checked}, already OK: ${alreadyOk}, fixed: ${fixed}, still broken: ${stillBroken}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
