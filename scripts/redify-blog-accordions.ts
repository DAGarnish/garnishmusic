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

const APPLY = process.argv.includes("--apply");

// Matches a whole [mkd_accordion ...]...[/mkd_accordion] block (non-greedy,
// no nested mkd_accordion expected in this content) so we can check whether
// its own content contains a [mkd_blog_list] - the "From the Blog" widget
// wrapped in an accordion, seen e.g. on la's Logic Production Program page
// as `[mkd_accordion style="toggle" el_class="From Music Production Academy
// Blog"][mkd_accordion_tab title="... Blog" ...][mkd_blog_list ...]`.
const ACCORDION_BLOCK_RE = /\[mkd_accordion\s+([^\]]*)\]([\s\S]*?)\[\/mkd_accordion\]/g;

function addColorStyleRed(attrs: string): string {
  return `${attrs.trim()} color_style="red"`;
}

async function main() {
  const config = (await import(path.resolve("payload.config"))).default;
  const payload = await getPayload({ config });

  let changed = 0;
  for (const collection of ["pages", "products"] as const) {
    let page = 1;
    while (true) {
      const res = await payload.find({ collection, limit: 100, page, depth: 0 });
      for (const doc of res.docs as any[]) {
        const raw: string = doc.wpRawContent;
        if (!raw || !raw.includes("mkd_blog_list") || !raw.includes("mkd_accordion")) continue;

        let modified = false;
        const newRaw = raw.replace(ACCORDION_BLOCK_RE, (whole, attrs, inner) => {
          if (!inner.includes("mkd_blog_list")) return whole;
          if (/color_style\s*=/.test(attrs)) return whole; // already styled
          modified = true;
          return `[mkd_accordion ${addColorStyleRed(attrs)}]${inner}[/mkd_accordion]`;
        });

        if (modified) {
          changed++;
          console.log(`${APPLY ? "APPLY" : "DRY"}: ${collection}#${doc.id} site=${doc.site} slug=${doc.slug}`);
          if (APPLY) {
            await payload.update({ collection, id: doc.id, data: { wpRawContent: newRaw } as any });
          }
        }
      }
      if (page >= res.totalPages) break;
      page++;
    }
  }

  console.log(`\n${APPLY ? "Updated" : "Would update"} ${changed} document(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
