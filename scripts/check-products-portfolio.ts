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

  const products = await payload.find({
    collection: "products",
    where: { portfolioCategories: { in: catIds } },
    limit: 5,
    depth: 1
  });

  console.log(`Found ${products.docs.length} products in short-courses`);
  for (const p of products.docs) {
    console.log(`Product: ${p.slug}`);
    console.log(` - images length: ${p.images?.length || 0}`);
  }

  process.exit(0);
}

main().catch(console.error);
