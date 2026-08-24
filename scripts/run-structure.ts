import { getPayload } from "payload";
import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8").split("\n").forEach((line) => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  });
}

const APPLY = process.argv.includes("--apply");
const FORCE = process.argv.includes("--force");
const modulePath = process.argv[2];

function flatten(node: any): string {
  const parts: string[] = [];
  (function walk(n: any) {
    if (n.type === "text") parts.push(n.text || "");
    if (Array.isArray(n.children)) n.children.forEach(walk);
  })(node);
  return parts.join("");
}

// Normalize punctuation/whitespace variants that are cosmetic (my hand-typed
// straight quotes vs the DB's curly ones, &nbsp; vs space, etc.) so the
// word-bag diff only flags genuine content loss, not encoding noise.
function words(s: string): string[] {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

function multisetDiff(a: string[], b: string[]) {
  const count = new Map<string, number>();
  for (const w of a) count.set(w, (count.get(w) || 0) + 1);
  for (const w of b) count.set(w, (count.get(w) || 0) - 1);
  const missing: string[] = [];
  const extra: string[] = [];
  for (const [w, c] of count) {
    if (c > 0) for (let i = 0; i < c; i++) missing.push(w);
    if (c < 0) for (let i = 0; i < -c; i++) extra.push(w);
  }
  return { missing, extra };
}

async function main() {
  const config = (await import(path.resolve("payload.config"))).default;
  const payload = await getPayload({ config });

  const mod = await import(path.resolve(modulePath));
  const { postId, children } = mod;

  const p: any = await payload.findByID({ collection: "posts", id: postId, depth: 0 });
  const origText = p.content.root.children.map(flatten).join(" ");
  const newText = children.map(flatten).join(" ");

  const origWords = words(origText);
  const newWords = words(newText);
  const { missing, extra } = multisetDiff(origWords, newWords);

  console.log(`id=${postId} "${p.title}"`);
  console.log(`original words: ${origWords.length}, new words: ${newWords.length}`);
  if (missing.length > 0) console.log(`MISSING (${missing.length}):`, missing.slice(0, 60).join(" | "));
  if (extra.length > 0) console.log(`EXTRA (${extra.length}):`, extra.slice(0, 60).join(" | "));
  if (missing.length === 0 && extra.length === 0) console.log("Word-for-word match confirmed.");

  if (APPLY) {
    if (missing.length > 0 && !FORCE) {
      console.log("Refusing to apply: missing words detected (pass --force after manual review to override).");
      process.exit(1);
    }
    const newContent = { ...p.content, root: { ...p.content.root, children } };
    await payload.update({ collection: "posts", id: postId, data: { content: newContent } as any });
    console.log("Applied.");
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
