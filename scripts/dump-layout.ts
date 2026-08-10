import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const pages = await payload.find({
    collection: "pages",
    limit: 1,
    where: { slug: { equals: "programs/ableton-producer-program" } }
  });
  
  const page = pages.docs[0];
  if (page?.layout) {
    const summarize = (blocks: any[], depth = 0): any[] =>
      blocks.map(b => {
        const indent = '  '.repeat(depth);
        const summary: any = { blockType: b.blockType };
        if (b.width) summary.width = b.width;
        if (b.title) summary.title = b.title?.substring(0, 60);
        if (b.html) summary.html_preview = b.html?.substring(0, 80);
        if (b.columns) summary.columns = summarize(b.columns, depth + 1);
        if (b.blocks) summary.blocks = summarize(b.blocks, depth + 1);
        if (b.items) summary.items = b.items.map((i: any) => ({ title: i.title }));
        return summary;
      });
    console.log(JSON.stringify(summarize(page.layout), null, 2));
  }
  process.exit(0);
}

main().catch(console.error);
