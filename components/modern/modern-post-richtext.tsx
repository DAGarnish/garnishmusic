import type { JSXConvertersFunction } from "@payloadcms/richtext-lexical/react";

// Payload's own Lexical shape for "no content" - RichText throws on
// undefined/null `data`, so every caller falls back to this instead.
export const EMPTY_RICHTEXT = {
  root: {
    type: "root",
    children: [],
    direction: null,
    format: "" as const,
    indent: 0,
    version: 1,
  },
};

// Blog post bodies get the "video" block (blocks/Video.ts, added to
// Posts.ts's Lexical editor via BlocksFeature) so a post can embed a
// playable YouTube video inline between paragraphs, not just at the top as
// a featuredImage. Shared by the legacy post-single template
// ([[...slug]]/page.tsx) and ModernBlogPostPage - same underlying Lexical
// field/block type, just a different outer page shell around it.
export const postRichTextConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  blocks: {
    video: ({ node }: { node: any }) => (
      <div style={{ margin: "2rem 0", borderRadius: 14, overflow: "hidden", aspectRatio: "16 / 9" }}>
        <iframe
          src={(node.fields as any).link}
          style={{ width: "100%", height: "100%", border: 0, display: "block" }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          data-fluidvids="loaded"
        />
      </div>
    ),
  },
});
