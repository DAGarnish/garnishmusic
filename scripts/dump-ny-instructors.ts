import { getPayload } from "payload";
import config from "../payload.config";

const NY_SITE_ID = 14;
const slugs = [
  "courses/isobel-ward",
  "courses/brian-thabault",
  "courses/daniel-lonner",
  "courses/charles-reeves",
  "courses/98-dots",
  "courses/nick-gallick-2",
  "courses/scott-hampton",
  "courses/heinrich-dr-hz-zwahlen",
  "courses/mike-guerriero",
  "courses/jonathan-harris",
  "courses/shareef-islam",
];

async function main() {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: NY_SITE_ID } }, { slug: { in: slugs } }] },
    limit: 20,
    depth: 1,
  });
  for (const p of res.docs as any[]) {
    const img = typeof p.featuredImage === "object" ? p.featuredImage?.url : p.featuredImage;
    console.log(`- slug=${p.slug} title="${p.title}" img=${img}`);
  }
  const found = new Set((res.docs as any[]).map((p) => p.slug));
  console.log("missing:", slugs.filter((s) => !found.has(s)));
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
