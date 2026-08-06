import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  // Find "short-courses" category
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
    limit: 5,
    depth: 1
  });

  for (const p of pages.docs) {
    console.log(`Page: ${p.slug}`);
    console.log(` - featuredImage: ${p.featuredImage ? (typeof p.featuredImage === 'object' ? p.featuredImage.url : p.featuredImage) : 'none'}`);
    console.log(` - titleBackgroundImage: ${p.titleBackgroundImage ? (typeof p.titleBackgroundImage === 'object' ? p.titleBackgroundImage.url : p.titleBackgroundImage) : 'none'}`);
    console.log(` - title: ${p.title}`);
  }

  process.exit(0);
}

main().catch(console.error);
