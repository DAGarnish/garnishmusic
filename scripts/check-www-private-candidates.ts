import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });
  const www = sites.docs.find((s: any) => s.slug === "www");

  for (const slug of ["one-to-one-private-tution", "training/music-production-private-tuition", "bespoke-private-tuition"]) {
    const pages = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: www!.id } }, { slug: { equals: slug } }] },
      limit: 1,
    });
    const doc: any = pages.docs[0];
    console.log(`\n${slug}: status=${doc?.status}, wpRawContent length=${doc?.wpRawContent?.length ?? 0}`);
    console.log((doc?.wpRawContent || "").slice(0, 300));
  }

  // also check generic training/ page on hk to confirm it's a stub
  const hk = sites.docs.find((s: any) => s.slug === "hk");
  const genericPages = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: hk!.id } }, { slug: { equals: "training/music-production-private-tuition" } }] },
    limit: 1,
  });
  const genericDoc: any = genericPages.docs[0];
  console.log(`\nhk generic page: status=${genericDoc?.status}, wpRawContent length=${genericDoc?.wpRawContent?.length ?? 0}`);
  console.log((genericDoc?.wpRawContent || "").slice(0, 300));

  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
