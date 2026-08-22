import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  });
}

// Second pass: handles the pages where the "To be in the loop..."
// newsletter callout (and its immediately-following "Check out the student
// feedback..." sibling paragraph, where present) appears TWICE - once in a
// desktop column, once in a vc_hidden-* mobile duplicate - and where the two
// copies differ slightly (e.g. rel="noopener" vs rel="noopener noreferrer"),
// so a single hardcoded find/replace string can't match both. Extracts each
// occurrence's exact boundaries straight out of the stored content instead
// of hand-transcribing it, so there's no risk of a transcription mismatch.
const IDS = [250, 249, 248, 246, 245, 244, 243, 241, 251, 239];

function removeNewsletterBlurb(raw: string): { result: string; removedCount: number } {
  let result = raw;
  let removedCount = 0;

  while (true) {
    const idx = result.toLowerCase().indexOf("to be in the loop");
    if (idx === -1) break;

    const before = result.slice(0, idx);
    const pOpenIdx = before.lastIndexOf("<p");
    const gap = pOpenIdx !== -1 ? before.slice(pOpenIdx) : "";
    const removeStart = /^<p[^>]*>\s*$/.test(gap) ? pOpenIdx : idx;

    let endIdx = result.indexOf("</p>", idx);
    if (endIdx === -1) throw new Error("no closing </p> found - aborting");
    endIdx += 4;
    if (result.slice(endIdx, endIdx + 2) === "\r\n") endIdx += 2;
    else if (result[endIdx] === "\n") endIdx += 1;

    let secondEnd = endIdx;
    const rest = result.slice(endIdx);
    const m = rest.match(/^<p[^>]*>Check out the student feedback[\s\S]*?<\/p>\r?\n?/);
    if (m) secondEnd = endIdx + m[0].length;

    result = result.slice(0, removeStart) + result.slice(secondEnd);
    removedCount++;
  }

  return { result, removedCount };
}

async function main() {
  const payload = await getPayload({ config });

  for (const id of IDS) {
    const doc = await payload.findByID({ collection: "pages", id, depth: 0 });
    const raw = (doc as any).wpRawContent as string;
    const slug = (doc as any).slug;

    const { result, removedCount } = removeNewsletterBlurb(raw);
    if (removedCount === 0) {
      console.log(`[${slug} ${id}] nothing to remove.`);
      continue;
    }

    await payload.update({ collection: "pages", id, data: { wpRawContent: result } });
    console.log(`[${slug} ${id}] removed ${removedCount} occurrence(s).`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
