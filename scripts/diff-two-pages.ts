import { getPayload } from "payload";
import config from "../payload.config";

function firstDiffContext(a: string, b: string): string {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return `...${a.slice(Math.max(0, i - 80), i)}[MIA]<<<${a.slice(i, i + 80)}\n---VS---\n...${b.slice(Math.max(0, i - 80), i)}[STAGING]<<<${b.slice(i, i + 80)}`;
}

async function main() {
  const payload = await getPayload({ config });
  for (const wpPostId of [8845, 5271]) {
    const [miaRes, stagingRes] = await Promise.all([
      payload.find({ collection: "pages", where: { and: [{ site: { equals: 17 } }, { wpPostId: { equals: wpPostId } }] }, limit: 1, depth: 0 }),
      payload.find({ collection: "pages", where: { and: [{ site: { equals: 24 } }, { wpPostId: { equals: wpPostId } }] }, limit: 1, depth: 0 }),
    ]);
    const mia = miaRes.docs[0] as any;
    const staging = stagingRes.docs[0] as any;
    console.log(`\n=== wpPostId ${wpPostId} (${mia?.slug}) ===`);
    console.log(firstDiffContext(mia.wpRawContent, staging.wpRawContent));
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
