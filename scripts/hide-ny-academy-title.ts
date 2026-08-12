import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });

  // Find the NY site
  const sites = await payload.find({
    collection: "sites",
    where: { domain: { contains: "ny" } },
    limit: 10,
  });

  const nySite = sites.docs.find((s: any) => s.domain?.includes("ny"));
  if (!nySite) {
    console.error("Could not find NY site");
    process.exit(1);
  }
  console.log(`Found NY site: ${(nySite as any).domain} (id: ${nySite.id})`);

  // Find the music-production-academy page on that site
  const pages = await payload.find({
    collection: "pages",
    where: {
      and: [
        { site: { equals: nySite.id } },
        { slug: { equals: "music-production-academy" } },
      ],
    },
    limit: 5,
    depth: 0,
  });

  if (pages.docs.length === 0) {
    console.error("Could not find music-production-academy page on NY site");
    process.exit(1);
  }

  const page = pages.docs[0];
  console.log(`Found page: ${(page as any).title} (id: ${page.id})`);

  await payload.update({
    collection: "pages",
    id: page.id,
    data: { showTitleArea: false },
  });

  console.log("Done. showTitleArea set to false.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
