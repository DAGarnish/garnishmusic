import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const [miaRes, stagingRes] = await Promise.all([
    payload.find({ collection: "pages", where: { and: [{ site: { equals: 17 } }, { wpPostId: { equals: 5271 } }] }, limit: 1, depth: 0 }),
    payload.find({ collection: "pages", where: { and: [{ site: { equals: 24 } }, { wpPostId: { equals: 5271 } }] }, limit: 1, depth: 0 }),
  ]);
  const mia = miaRes.docs[0] as any;
  const staging = stagingRes.docs[0] as any;
  console.log("mia id:", mia?.id, "updatedAt:", mia?.updatedAt);
  console.log("staging id:", staging?.id, "updatedAt:", staging?.updatedAt);
  console.log("content identical:", mia?.wpRawContent === staging?.wpRawContent);
  console.log("mia content length:", mia?.wpRawContent?.length);
  console.log("staging content length:", staging?.wpRawContent?.length);

  // Check how many pages differ in wpRawContent across the whole site
  const [allMia, allStaging] = await Promise.all([
    payload.find({ collection: "pages", where: { site: { equals: 17 } }, limit: 500, depth: 0 }),
    payload.find({ collection: "pages", where: { site: { equals: 24 } }, limit: 500, depth: 0 }),
  ]);
  const miaByWp = new Map((allMia.docs as any[]).map((p) => [p.wpPostId, p]));
  const stagingByWp = new Map((allStaging.docs as any[]).map((p) => [p.wpPostId, p]));
  let matched = 0, differ = 0, onlyStaging = 0, onlyMia = 0;
  for (const [wpId, sp] of stagingByWp) {
    const mp = miaByWp.get(wpId);
    if (!mp) { onlyStaging++; continue; }
    matched++;
    if (mp.wpRawContent !== sp.wpRawContent) differ++;
  }
  for (const wpId of miaByWp.keys()) if (!stagingByWp.has(wpId)) onlyMia++;
  console.log({ matched, differ, onlyStaging, onlyMia });
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
