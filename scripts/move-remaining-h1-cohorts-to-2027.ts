import { getPayload } from "payload";
import config from "../payload.config";

// Follow-up to scripts/move-h1-2026-cohorts-to-2027.ts: that script moved
// only the 9 cohorts visible in the user's screenshot (A1, U, V, W, X, Y, B,
// Z, A) to the new 2027 block, leaving P, Q, R, H, T (Jan-Apr 2026 starts)
// sitting at the very top of the list. The user clarified the page should
// read "July to Dec '26, then Jan to Jun '27" - i.e. ALL of the original
// first-half-of-2026 cohorts belong in the 2027 block, not just the 9 that
// happened to be in the screenshot. This moves P, Q, R, H, T there too
// (shifted by the same 364-day/52-week rule to preserve weekdays), inserted
// in chronological order ahead of A1, and removes them from the top so the
// list now starts with C) (July 2026) as its first entry.
const PRODUCT_ID = 160;

const NEW_JAN_TO_FEB_2027_BLOCK = `<p style="text-align: left;">P) 1/2 – 2/27 | Saturdays | 2.15p – 6.15p | 9 Classes in Manhattan</p>
<p style="text-align: left;">Q) 1/3 – 2/28 | Sundays | 2.15p – 6.15p | 9 Classes in Brooklyn</p>
<p style="text-align: left;">R) 1/11 – 2/17 (skipping Martin Luther King Jr. Day &amp; Presidents Day) | Mondays/Wednesdays | 6.30p – 9.30p | 12 Classes in Brooklyn</p>
<p style="text-align: left;">H) 1/12 – 2/16 | Tuesdays/Thursdays | 6.30p – 9.30p | 12 Classes in Manhattan</p>
<p style="text-align: left;">T) 2/23 – 4/1 | Tuesdays/Thursdays | 6.30p – 9.30p | 12 Classes in Manhattan</p>
`;

async function main() {
  const payload = await getPayload({ config });

  const before = await payload.findByID({ collection: "products", id: PRODUCT_ID, depth: 0 });
  const raw = (before as any).wpRawContent as string;

  const blockStart = raw.indexOf('<p style="text-align: left;">P) 1/3');
  const blockEnd = raw.indexOf('<p style="text-align: left;">C) 7/12');
  if (blockStart === -1 || blockEnd === -1 || blockEnd <= blockStart) {
    console.error("Could not locate the P-T block boundaries - aborting.", { blockStart, blockEnd });
    process.exit(1);
  }
  const oldBlock = raw.slice(blockStart, blockEnd);
  const letters = [...oldBlock.matchAll(/<p style="text-align: left;">([A-Z0-9]+)\)/g)].map((m) => m[1]);
  const expectedLetters = ["P", "Q", "R", "H", "T"];
  if (JSON.stringify(letters) !== JSON.stringify(expectedLetters)) {
    console.error("Unexpected cohort letters in located block - aborting.", letters);
    process.exit(1);
  }

  const withoutOldBlock = raw.slice(0, blockStart) + raw.slice(blockEnd);

  const a1LineStart = withoutOldBlock.indexOf('<p style="text-align: left;">A1) 3/1');
  if (a1LineStart === -1) {
    console.error("Could not locate the 2027 A1) line - aborting.");
    process.exit(1);
  }

  const updated =
    withoutOldBlock.slice(0, a1LineStart) +
    NEW_JAN_TO_FEB_2027_BLOCK +
    withoutOldBlock.slice(a1LineStart);

  await payload.update({
    collection: "products",
    id: PRODUCT_ID,
    data: { wpRawContent: updated },
  });

  console.log("Updated product", PRODUCT_ID, "- new length:", updated.length, "(was", raw.length, ")");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
