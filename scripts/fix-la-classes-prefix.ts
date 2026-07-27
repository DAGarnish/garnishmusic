import { getPayload } from "payload";
import config from "../payload.config";

// The `la` subsite is the only one with a custom WooCommerce product_base
// ("/classes" instead of the default "/product", confirmed live on
// production via `wp option get woocommerce_permalinks --url=la...`).
// The original migration hardcoded "product/" for every site's products,
// so every la product - and every cross-site redirect pointing at one -
// got the wrong prefix. This corrects both.

async function main() {
  const payload = await getPayload({ config });

  const sites = await payload.find({ collection: "sites", where: { domain: { equals: "la.garnishmusicproduction.com" } }, limit: 1 });
  const laSite = sites.docs[0];
  if (!laSite) throw new Error("la site not found");

  const products = await payload.find({
    collection: "products",
    where: { and: [{ site: { equals: laSite.id } }, { slug: { like: "product/" } }] },
    limit: 1000,
  });

  let productsFixed = 0;
  for (const p of products.docs as any[]) {
    if (!p.slug.startsWith("product/")) continue;
    const newSlug = p.slug.replace(/^product\//, "classes/");
    await payload.update({ collection: "products", id: p.id, data: { slug: newSlug } });
    console.log(`PRODUCT ${p.id}: ${p.slug} -> ${newSlug}`);
    productsFixed++;
  }

  const redirects = await payload.find({
    collection: "redirects",
    where: { destination: { like: "https://la.garnishmusicproduction.com/product/" } },
    limit: 1000,
  });

  let redirectsFixed = 0;
  for (const r of redirects.docs as any[]) {
    const newDestination = r.destination.replace(
      "https://la.garnishmusicproduction.com/product/",
      "https://la.garnishmusicproduction.com/classes/"
    );
    await payload.update({ collection: "redirects", id: r.id, data: { destination: newDestination } });
    console.log(`REDIRECT ${r.id}: ${r.destination} -> ${newDestination}`);
    redirectsFixed++;
  }

  console.log(`\nDONE. Products fixed: ${productsFixed}, redirects fixed: ${redirectsFixed}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
