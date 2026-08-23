import { getPayload } from "payload";
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

function stripTags(s: string): string {
  return s.replace(/\[[^\]]*\]/g, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#8217;/g, "'").replace(/\s+/g, " ").trim();
}

const IDS: number[] = process.argv.slice(2).map(Number);

async function main() {
  const config = (await import("../payload.config")).default;
  const payload = await getPayload({ config });
  for (const id of IDS) {
    const doc = await payload.findByID({ collection: "pages", id, depth: 0 });
    const raw = (doc as any).wpRawContent as string;
    console.log(`\n=== id ${id} (${(doc as any).title}) len=${raw.length} ===`);
    console.log(stripTags(raw).slice(0, 900));
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
