import { getPayload } from "payload";
import config from "../payload.config";

// Root cause of the "[vc_row][vc_column][vc_column_text]..." junk visibly
// leaking onto la/mia (and every other city site's) course pages: the
// shared [mkd_blog_list] "From the Blog" widget always pulls its posts from
// edu's network-wide Posts collection (see lib/wp-blog-list-resolver.ts)
// and renders each post's own `excerpt` field verbatim, no shortcode
// stripping - and 3 of edu's 329 posts had the same raw-WPBakery-dump
// migration bug in `excerpt` that Pages' metaDescription had (see
// scripts/generate-seo-descriptions.ts). Since every course/page embedding
// this widget shares the same edu posts, this is a small, one-time fix here
// rather than a per-site one. The posts' own `content` (Lexical richText)
// field parsed correctly, so this pulls a clean excerpt straight from its
// first paragraph's real text instead of re-stripping the corrupted string.
function firstParagraphText(content: any): string {
  const firstPara = content?.root?.children?.find((c: any) => c.type === "paragraph");
  if (!firstPara) return "";
  return (firstPara.children || [])
    .map((n: any) => n.text || "")
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, maxLen = 160, minLen = 60): string {
  if (text.length <= maxLen) return text;
  const window = text.slice(0, maxLen + 1);
  const lastSentenceEnd = Math.max(window.lastIndexOf(". "), window.lastIndexOf("! "), window.lastIndexOf("? "));
  if (lastSentenceEnd >= minLen) return window.slice(0, lastSentenceEnd + 1).trim();
  const lastSpace = window.slice(0, maxLen).lastIndexOf(" ");
  return (lastSpace >= minLen ? window.slice(0, lastSpace) : window.slice(0, maxLen)).trim() + "...";
}

async function main() {
  const payload = await getPayload({ config });
  const ids = [784, 241, 201];

  for (const id of ids) {
    const doc = (await payload.findByID({ collection: "posts", id, depth: 0 })) as any;
    const plain = firstParagraphText(doc.content);
    if (plain.length < 40) {
      console.error(`post ${id} (${doc.slug}): couldn't extract usable text, skipping`);
      continue;
    }
    const newExcerpt = truncate(plain);
    await payload.update({ collection: "posts", id, data: { excerpt: newExcerpt } });
    console.log(`updated post ${id} (${doc.slug}): "${newExcerpt}"`);
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
