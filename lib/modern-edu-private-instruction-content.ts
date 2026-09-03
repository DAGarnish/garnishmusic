// edu's own real "private-instruction" page (id 1395, site 15) is a
// genuinely richer shape than either the la or mia one
// modern-private-instruction-content.ts's extractPrivateInstructionContent
// was built for - a real "Specialist Expert Instructors" blurb, two
// side-by-side pricing blocks (remote vs in-person), a "Who Is This For?"
// checklist, a closing pitch, and a real 10-question FAQ block (all 10
// Q&As packed into a *single* [mkd_accordion_tab], <h5> per question -
// extractFaqs' one-tab-per-question regex finds none of them here) -
// bespoke to this one page, same principle as
// modern-private-instruction-content.ts's own file-level comment for why
// it doesn't try to generalize from one page's real structure.
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&bull;/g, "•");
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, "")).trim();
}

export type PricingBlock = { title: string; items: string[] };
export type EduFaq = { question: string; answer: string };

export type EduPrivateInstructionContent = {
  introParagraphs: string[];
  instructorsHeading: string | null;
  instructorsBody: string[];
  pricingBlocks: PricingBlock[];
  whoForHeading: string | null;
  whoForItems: string[];
  closingHeading: string | null;
  closingBody: string[];
  faqs: EduFaq[];
};

export function extractEduPrivateInstructionContent(wpRawContent: string): EduPrivateInstructionContent {
  const raw = wpRawContent || "";

  // The two intro <p>s sit in the first [vc_column_text] block, before the
  // "Specialist Expert Instructors" <h2>.
  const introBlockMatch = raw.match(/\[vc_column_text[^\]]*\]([\s\S]*?)<h2[^>]*>Specialist Expert Instructors/i);
  const introParagraphs = introBlockMatch
    ? [...introBlockMatch[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => stripTags(m[1])).filter(Boolean)
    : [];

  const instructorsBlockMatch = raw.match(
    /<h2[^>]*>(Specialist Expert Instructors)<\/h2>([\s\S]*?)\[\/vc_column_text\]\[vc_empty_space\]\[\/vc_column_inner\]/i
  );
  const instructorsHeading = instructorsBlockMatch ? decodeEntities(instructorsBlockMatch[1]) : null;
  const instructorsBody = instructorsBlockMatch
    ? instructorsBlockMatch[2]
        .split(/\n{2,}/)
        .map((p) => stripTags(p))
        .filter(Boolean)
    : [];

  // Two [mkd_icon_with_text ... text="• line\n• line" title="..."] blocks -
  // the shortcode's own `text` attribute is the bullet list, `title` is
  // the card heading (matches [mkd_icon_with_text]'s real usage here, not
  // the more common heading+body shape the rest of this file assumes).
  const pricingBlocks: PricingBlock[] = [...raw.matchAll(/\[mkd_icon_with_text[^\]]*\btext="([^"]*)"[^\]]*\btitle="([^"]*)"\]/gi)].map(
    (m) => ({
      title: decodeEntities(m[2]),
      items: m[1]
        .split(/\n/)
        .map((line) => decodeEntities(line.replace(/^•\s*/, "")).trim())
        .filter(Boolean),
    })
  );

  const whoForMatch = raw.match(
    /\[mkd_accordion_tab title="([^"]*)"[^\]]*\][\s\S]*?<ul>([\s\S]*?)<\/ul>[\s\S]*?\[\/mkd_accordion_tab\]/i
  );
  const whoForHeading = whoForMatch ? decodeEntities(whoForMatch[1]) : null;
  const whoForItems = whoForMatch
    ? [...whoForMatch[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => stripTags(m[1])).filter(Boolean)
    : [];

  const closingMatch = raw.match(/<h2[^>]*>(Invest in Your Music Journey)<\/h2>([\s\S]*?)\[\/vc_column_text\]/i);
  const closingHeading = closingMatch ? decodeEntities(closingMatch[1]) : null;
  const closingBody = closingMatch
    ? [
        ...closingMatch[2].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi),
        // The first paragraph here is bare text (no <p> wrapper) ahead of
        // the real <p> - captured separately so it isn't dropped.
      ]
        .map((m) => stripTags(m[1]))
        .filter(Boolean)
    : [];
  if (closingMatch) {
    const leadIn = stripTags(closingMatch[2].split(/<p/i)[0]);
    if (leadIn) closingBody.unshift(leadIn);
  }

  // The FAQ block is one [mkd_accordion_tab title="Frequently Asked
  // Questions (FAQ)"] with 10 <h5>question</h5>answer-text pairs inside,
  // not 10 separate tabs - split manually rather than via extractFaqs.
  const faqBlockMatch = raw.match(/\[mkd_accordion_tab title="Frequently Asked Questions[^"]*"[^\]]*\]([\s\S]*?)\[\/mkd_accordion_tab\]/i);
  const faqs: EduFaq[] = [];
  if (faqBlockMatch) {
    const parts = faqBlockMatch[1].split(/<h5[^>]*>/i).slice(1);
    for (const part of parts) {
      const [q, ...rest] = part.split(/<\/h5>/i);
      const question = stripTags(q);
      const answer = stripTags(rest.join("</h5>"));
      if (question && answer) faqs.push({ question, answer });
    }
  }

  return {
    introParagraphs,
    instructorsHeading,
    instructorsBody,
    pricingBlocks,
    whoForHeading,
    whoForItems,
    closingHeading,
    closingBody,
    faqs,
  };
}
