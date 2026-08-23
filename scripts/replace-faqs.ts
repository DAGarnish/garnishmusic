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

type Faq = { q: string; a: string };
type Job = { id: number; faqs: Faq[] };

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildBlock(faqs: Faq[]): string {
  const tabs = faqs
    .map(
      (f) =>
        `[mkd_accordion_tab title="${escHtml(f.q).replace(/"/g, "&quot;")}" title_tag="h5"]\n[vc_column_text]<p>${f.a}</p>[/vc_column_text]\n[/mkd_accordion_tab]`
    )
    .join("\n");
  return `[vc_empty_space height="40px"][vc_row content_width="grid"][vc_column][vc_column_text]
<h4 style="text-align: center;"><strong>Frequently Asked Questions</strong></h4>
[/vc_column_text][vc_empty_space height="16px"][vc_column_text][mkd_accordion style="toggle"]
${tabs}
[/mkd_accordion]
[/vc_column_text][vc_empty_space height="40px"][/vc_column][/vc_row]`;
}

const MARKER = '[vc_empty_space height="40px"][vc_row content_width="grid"][vc_column][vc_column_text]\n<h4 style="text-align: center;"><strong>Frequently Asked Questions</strong></h4>';

async function main() {
  const jobFile = process.argv[2];
  if (!jobFile) throw new Error("usage: replace-faqs.ts <jobs.json>");
  const jobs: Job[] = JSON.parse(fs.readFileSync(jobFile, "utf8"));

  const config = (await import(path.resolve("payload.config"))).default;
  const payload = await getPayload({ config });

  for (const job of jobs) {
    const doc = await payload.findByID({ collection: "pages", id: job.id, depth: 0 });
    const raw = (doc as any).wpRawContent as string;
    const idx = raw.indexOf(MARKER);
    if (idx === -1) {
      console.log(`NO EXISTING FAQ FOUND for id ${job.id} - use insert-faqs.ts instead`);
      continue;
    }
    const base = raw.slice(0, idx).replace(/\n+$/, "");
    const block = buildBlock(job.faqs);
    const updated = base + "\n" + block;
    await payload.update({ collection: "pages", id: job.id, data: { wpRawContent: updated } as any });
    console.log(`REPLACED id ${job.id} (${(doc as any).title}) - ${job.faqs.length} FAQs`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
