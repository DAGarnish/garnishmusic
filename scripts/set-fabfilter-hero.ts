import { getPayload } from "payload";
import configPromise from "../payload.config";

const FABFILTER_PRO_Q_MEDIA_ID = 4081; // FabFilter-Pro-Q-2-Screen-Shot@2x-1.png, 2000x1276

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });
  const pdx = sites.docs.find((s: any) => s.slug === "pdx");

  for (const slug of ["courses/mixing-mastering", "courses/mastering"]) {
    const pages = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: pdx!.id } }, { slug: { equals: slug } }] },
      limit: 1,
    });
    const doc: any = pages.docs[0];
    if (!doc) {
      console.log(`SKIP: ${slug} not found`);
      continue;
    }
    await payload.update({
      collection: "pages",
      id: doc.id,
      data: { titleBackgroundImage: FABFILTER_PRO_Q_MEDIA_ID },
    });
    console.log(`${slug}: titleBackgroundImage -> FabFilter Pro-Q screenshot (media #${FABFILTER_PRO_Q_MEDIA_ID})`);
  }
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
