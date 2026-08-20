import { getPayload } from "payload";
import config from "../payload.config";

// ny site's product/electronic-dj-class (id 160): moves the 9 "first half of
// the year" 2026 cohorts (A1, U, V, W, X, Y, B, Z, A - originally sitting
// between T and C in the Schedules accordion) to the end of the list as a
// new 2027 block. Dates are shifted by exactly 364 days (52 weeks), not a
// naive +1 calendar year, so each cohort keeps landing on the same weekdays
// its "Mondays/Wednesdays" etc. label promises. Sessions that land on a 2027
// US federal holiday get a "(skipping X)" annotation, matching the
// "(skipping Labor Day)" / "(skipping Memorial Day)" convention already used
// elsewhere on this site's schedule listings (see
// scripts/tidy-dj-course-product-text.ts). The old block is located by
// slicing the live content between markers rather than a hardcoded literal,
// since the source has a stray non-breaking space (U+00A0) before one "|"
// that's easy to mistype by hand.
const PRODUCT_ID = 160;

const NEW_2027_BLOCK = `
<p style="text-align: left;"><strong>2027</strong></p>
<p style="text-align: left;">A1) 3/1 – 4/7 | Mondays/Wednesdays | 6.30p – 9.30p | 12 Classes in Manhattan</p>
<p style="text-align: left;">U) 3/17 – 4/26 | Mondays/Wednesdays | 6.30p – 9.30p | 12 Classes in Brooklyn</p>
<p style="text-align: left;">V) 4/6 – 5/15 | Tuesdays/Thursdays | 6.30p – 9.30p | 12 Classes in Manhattan</p>
<p style="text-align: left;">W) 5/3 – 6/9 (skipping Memorial Day) | Mondays/Wednesdays | 6.30p – 9.30p | 12 Classes in Brooklyn</p>
<p style="text-align: left;">X) 5/8 – 7/3 (skipping Juneteenth) | Saturdays | 2.15p – 6.15p | 9 Classes in Brooklyn</p>
<p style="text-align: left;">Y) 5/16 – 7/11 (skipping Independence Day) | Sundays | 2.15p – 6.15p | 9 Classes in Manhattan</p>
<p style="text-align: left;">B) 5/29 – 7/24 (skipping Juneteenth) | Saturdays | 2.15p – 6.15p | 9 Classes in Manhattan</p>
<p style="text-align: left;">Z) 6/21 – 7/28 | Mondays/Wednesdays | 6.30p – 9.30p | 12 Classes in Manhattan</p>
<p style="text-align: left;">A) 6/22 – 7/29 | Tuesdays/Thursdays | 6.30p – 9.30p | 12 Classes in Brooklyn</p>`;

async function main() {
  const payload = await getPayload({ config });

  const before = await payload.findByID({ collection: "products", id: PRODUCT_ID, depth: 0 });
  const raw = (before as any).wpRawContent as string;

  const blockStart = raw.indexOf('<p style="text-align: left;">A1) 3/2');
  const blockEnd = raw.indexOf('<p style="text-align: left;">C) 7/12');
  if (blockStart === -1 || blockEnd === -1 || blockEnd <= blockStart) {
    console.error("Could not locate the 9-cohort block boundaries - aborting.", { blockStart, blockEnd });
    process.exit(1);
  }
  const oldBlock = raw.slice(blockStart, blockEnd);
  // Sanity check: exactly the 9 letters we expect, nothing more/less.
  const letters = [...oldBlock.matchAll(/<p style="text-align: left;">([A-Z0-9]+)\)/g)].map((m) => m[1]);
  const expectedLetters = ["A1", "U", "V", "W", "X", "Y", "B", "Z", "A"];
  if (JSON.stringify(letters) !== JSON.stringify(expectedLetters)) {
    console.error("Unexpected cohort letters in located block - aborting.", letters);
    process.exit(1);
  }

  const withoutOldBlock = raw.slice(0, blockStart) + raw.slice(blockEnd);

  const oLineStart = withoutOldBlock.indexOf('<p style="text-align: left;">O) 11/10');
  if (oLineStart === -1) {
    console.error("Could not locate the O) line - aborting.");
    process.exit(1);
  }
  const oLineEnd = withoutOldBlock.indexOf("</p>", oLineStart) + "</p>".length;

  const updated =
    withoutOldBlock.slice(0, oLineEnd) + NEW_2027_BLOCK + withoutOldBlock.slice(oLineEnd);

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
