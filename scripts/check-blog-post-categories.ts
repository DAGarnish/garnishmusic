import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });

  const cats = await payload.find({
    collection: "categories",
    where: { site: { equals: 15 } },
    limit: 300,
    depth: 0,
    sort: "slug",
  });
  console.log(`total categories on edu (site 15): ${cats.totalDocs}`);
  for (const c of cats.docs as any[]) {
    console.log(c.id, "|", c.slug, "|", c.name);
  }

  const postsTotal = await payload.find({ collection: "posts", where: { site: { equals: 15 } }, limit: 1 });
  console.log("\ntotal posts on edu:", postsTotal.totalDocs);

  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
