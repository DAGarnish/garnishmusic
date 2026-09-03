import { getPayload } from "payload";
import config from "../payload.config";

// User request: 301 /contact/ to /connect/ on staging - /connect is the
// real contactSlug wired up in MODERN_SITE_ROUTES.staging (see
// ModernEduContactPage), but staging's own nav (cloned from edu) links
// "Contact" at /contact, which has no page of its own and would otherwise
// 404 through the modern route matcher's contactSlug check (source/
// destination compared exact, no regex - see collections/Redirects.ts).
async function main() {
  const payload = await getPayload({ config });

  const sites = await payload.find({ collection: "sites", where: { slug: { equals: "staging" } }, limit: 1 });
  const site = sites.docs[0] as any;
  if (!site) {
    console.error("no 'staging' site found - aborting");
    process.exit(1);
  }

  const existing = await payload.find({
    collection: "redirects",
    where: { and: [{ site: { equals: site.id } }, { source: { equals: "/contact" } }] },
    limit: 1,
    depth: 0,
  });
  if (existing.totalDocs > 0) {
    console.error("redirect already exists - aborting", existing.docs[0]);
    process.exit(1);
  }

  const redirect = await payload.create({
    collection: "redirects",
    data: {
      site: site.id,
      source: "/contact",
      destination: "/connect",
      statusCode: 301,
    },
  });
  console.log("created redirect", redirect.id, "on site", site.id);
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
