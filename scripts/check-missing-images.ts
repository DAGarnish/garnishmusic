import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const categories = await payload.find({
    collection: "categories",
    where: { slug: { equals: "short-courses" } },
    limit: 10
  });

  const catIds = categories.docs.map(c => c.id);

  if (catIds.length === 0) {
    console.log("No short-courses category found");
    process.exit(0);
  }

  const pages = await payload.find({
    collection: "pages",
    where: { portfolioCategories: { in: catIds } },
    limit: 100,
    depth: 1
  });

  for (const p of pages.docs) {
    const fImg = p.featuredImage ? (typeof p.featuredImage === 'object' ? p.featuredImage.url : p.featuredImage) : null;
    const tbImg = p.titleBackgroundImage ? (typeof p.titleBackgroundImage === 'object' ? p.titleBackgroundImage.url : p.titleBackgroundImage) : null;
    
    if (!fImg && !tbImg) {
      console.log(`Missing BOTH on Page: ${p.slug} (${p.title})`);
    } else {
      console.log(`Page: ${p.slug} (${p.title}) has images. fImg: ${!!fImg}, tbImg: ${!!tbImg}`);
    }
  }

  process.exit(0);
}

main().catch(console.error);
