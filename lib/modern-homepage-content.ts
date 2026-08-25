// Pulls "heading + following paragraph" pairs out of a Payload Lexical
// richtext tree, for the modern pdx homepage's program cards. Reads the
// real page.content the CMS holds (same doc content editors already
// maintain) rather than hardcoding copy, so editing the page in Payload
// admin keeps the modern homepage in sync same as the legacy one.
// Some migrated WP copy has literal "&amp;"-style entities baked into the
// Lexical text nodes themselves (double-encoded during migration), which
// the legacy dangerouslySetInnerHTML pipeline decodes for free but a plain
// React text child does not - decode the common ones explicitly.
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'");
}

function textOf(node: any): string {
  if (!node?.children) return "";
  return decodeEntities(node.children.map((c: any) => c.text || "").join(""));
}

export type ProgramCard = { heading: string; body: string };

export function extractProgramCards(content: any, limit = 3): ProgramCard[] {
  const children: any[] = content?.root?.children || [];
  const cards: ProgramCard[] = [];

  for (let i = 0; i < children.length && cards.length < limit; i++) {
    const node = children[i];
    if (node.type !== "heading" || node.tag !== "h2") continue;
    const next = children[i + 1];
    if (next?.type !== "paragraph") continue; // bare section label, e.g. "Certified Producer Programs" - no body, skip
    const heading = textOf(node).trim();
    const body = textOf(next).trim();
    if (!heading || !body) continue;
    cards.push({ heading, body });
  }

  return cards;
}
