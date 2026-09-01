import { themeStylesheets } from "../app/(frontend)/layout";

// The legacy WordPress theme's stylesheets - normally loaded once by the
// (frontend) root layout, but that layout skips them network-wide for any
// "modern" site (MODERN_SITE_SLUGS in lib/modern-sites.ts), on the
// assumption every page on such a site renders through the modern
// component tree. Some pages on a modern site still fall through to this
// legacy renderer by design (mia's shop/cart, blog, calendar, and any page
// that doesn't fit a modern template yet, e.g. private-tuition) - those
// pages need their own copy of these stylesheets. Rendered by the legacy
// branches in [[...slug]]/page.tsx themselves rather than in the layout
// (which has no way to know, this far above the dynamic route segment,
// whether the specific page being rendered is modern or legacy), relying on
// React 19's automatic <link rel="stylesheet">/<style> hoisting and
// deduplication to land these in <head> regardless of how deep in the tree
// they're rendered - confirmed working for exactly this shape (see React's
// own docs on the `precedence`-free stylesheet <link> resource type).
export default function LegacyThemeAssets({ customCss }: { customCss?: string | null }) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css?family=Prompt:100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic|Rubik:100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
      />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      {themeStylesheets.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      {customCss && <style id="wp-custom-css" dangerouslySetInnerHTML={{ __html: customCss }} />}
    </>
  );
}
