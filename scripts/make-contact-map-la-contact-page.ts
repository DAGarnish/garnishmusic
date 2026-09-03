import { getPayload } from "payload";
import config from "../payload.config";

// User request: make la's /contact-map/ the site's real contact page (it
// currently 404s - la has no page at that slug) and 301 the old contact
// page's URL (music-production-school-los-angeles-contact, page id 2264,
// currently wired up as la's contactSlug in lib/modern-site-routes.ts) to
// it. Companion code change: lib/modern-site-routes.ts LA_ROUTES.contactSlug
// updated to "contact-map" in the same change, since the modern route
// matcher (app/(frontend)/[[...slug]]/page.tsx) looks up the contact page by
// that exact slug value.
async function main() {
  const payload = await getPayload({ config });

  const existingRedirect = await payload.find({
    collection: "redirects",
    where: { and: [{ site: { equals: 22 } }, { source: { equals: "/music-production-school-los-angeles-contact" } }] },
    limit: 1,
    depth: 0,
  });
  if (existingRedirect.totalDocs > 0) {
    console.error("redirect already exists - aborting", existingRedirect.docs[0]);
    process.exit(1);
  }

  const conflictingSlug = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: 22 } }, { slug: { equals: "contact-map" } }] },
    limit: 1,
    depth: 0,
  });
  if (conflictingSlug.totalDocs > 0) {
    console.error("a page already exists at slug contact-map - aborting", conflictingSlug.docs[0]);
    process.exit(1);
  }

  await payload.update({
    collection: "pages",
    id: 2264,
    data: { slug: "contact-map" },
  });
  console.log("renamed page 2264 slug -> contact-map");

  const redirect = await payload.create({
    collection: "redirects",
    data: {
      site: 22,
      source: "/music-production-school-los-angeles-contact",
      destination: "/contact-map",
      statusCode: 301,
    },
  });
  console.log("created redirect", redirect.id);

  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
