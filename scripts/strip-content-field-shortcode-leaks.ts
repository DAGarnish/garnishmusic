import { getPayload } from "payload";
import config from "../payload.config";

// A second, distinct source of the same "[contact-form-7 ...]" visible junk
// found in scripts/wp-shortcode-tree.ts's TOKEN_RE/VOID_TAGS fix: these 17
// pages (8 la, 9 mia - all thin, mostly-empty legacy utility pages) render
// through their native Payload `content` (Lexical richText) field, not
// wpRawContent, so that shortcode-tree fix never touches them - the literal
// WP shortcode text was typed/migrated directly into a text node as
// ordinary prose, with no real Contact Form 7 embed behind it in this app
// either way. Strips the shortcode text (and any trailing lone newline it
// followed) out of each affected text node, then drops any paragraph left
// with no real text at all (the "[contact-form-7 id=...]"-only paragraphs).
const LEAK_RE = /\r?\n?\s*\[contact-form-7\b[^\]]*\]/g;

function stripNode(node: any): boolean {
  // Returns true if this node (after stripping) has any real content left.
  if (node.type === "text") {
    node.text = (node.text || "").replace(LEAK_RE, "");
    return node.text.trim().length > 0;
  }
  if (Array.isArray(node.children)) {
    node.children = node.children.filter((child: any) => stripNode(child));
    return node.children.length > 0;
  }
  return true;
}

async function main() {
  const targets: { site: number; slug: string }[] = [
    { site: 22, slug: "academy/urban-music-academy" },
    { site: 22, slug: "academy/application" },
    { site: 22, slug: "contact-test" },
    { site: 22, slug: "music-school-reviews" },
    { site: 22, slug: "ios-deployment-essentials" },
    { site: 22, slug: "music-foundations" },
    { site: 22, slug: "dj-experiences" },
    { site: 22, slug: "academy/songwriting-music-producer" },
    { site: 24, slug: "academy/urban-music-academy" },
    { site: 24, slug: "academy/application" },
    { site: 24, slug: "apple-exams" },
    { site: 24, slug: "music-school-reviews" },
    { site: 24, slug: "music-foundations" },
    { site: 24, slug: "dj-experiences" },
    { site: 24, slug: "ios-deployment-essentials" },
    { site: 24, slug: "academy/songwriting-music-producer" },
    { site: 24, slug: "macos-support-essentials" },
  ];

  const payload = await getPayload({ config });
  for (const t of targets) {
    const res = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: t.site } }, { slug: { equals: t.slug } }] },
      limit: 1,
      depth: 0,
    });
    const doc = res.docs[0] as any;
    if (!doc?.content?.root) { console.error("skip (not found):", t); continue; }

    const before = JSON.stringify(doc.content);
    if (!before.includes("contact-form-7")) { console.log("already clean:", t.site, t.slug); continue; }

    doc.content.root.children = doc.content.root.children.filter((child: any) => stripNode(child));
    await payload.update({ collection: "pages", id: doc.id, data: { content: doc.content } });
    console.log("cleaned", t.site, t.slug, "(id", doc.id + ")");
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
