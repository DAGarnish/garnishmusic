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

  const pages = await payload.find({
    collection: "pages",
    where: { portfolioCategories: { in: catIds } },
    limit: 100,
    depth: 1
  });

  for (const p of pages.docs) {
    const fImg = p.featuredImage;
    const tbImg = p.titleBackgroundImage;
    
    if (!fImg && !tbImg) {
      // Missing both images. Let's look for a product with the same slug (or title)
      const products = await payload.find({
        collection: "products",
        where: { slug: { equals: p.slug } },
        limit: 1,
        depth: 1
      });
      if (products.docs.length > 0) {
        const prod = products.docs[0];
        console.log(`Found product for missing page ${p.slug}. Product has ${prod.images?.length || 0} images`);
        if (prod.images && prod.images.length > 0) {
          const img = prod.images[0];
          console.log(` - product image: ${img.url}`);
        }
      } else {
        console.log(`No product found for ${p.slug}`);
      }
    }
  }

  process.exit(0);
}

main().catch(console.error);
