import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });

  // Find all homepage pages (wpPostId=5271) that still have showTitleArea=true
  const pages = await payload.find({
    collection: "pages",
    where: { wpPostId: { equals: 5271 } },
    limit: 50,
    depth: 1,
  });

  let updatedCount = 0;

  for (const p of pages.docs as any[]) {
    if (p.showTitleArea === true) {
      const siteName = typeof p.site === "object" ? p.site?.domain : p.site;
      await payload.update({
        collection: "pages",
        id: p.id,
        data: { showTitleArea: false },
      });
      console.log(`✅ Hid title area on homepage for: ${siteName} (page ID ${p.id}, title "${p.title}")`);
      updatedCount++;
    } else {
      const siteName = typeof p.site === "object" ? p.site?.domain : p.site;
      console.log(`⏭️  Already hidden for: ${siteName}`);
    }
  }

  console.log(`\nDone. Updated ${updatedCount} pages.`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
