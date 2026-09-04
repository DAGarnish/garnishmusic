import "../../app/modern-globals.css";
import Link from "next/link";
import ModernHeader from "./ModernHeader";
import ModernFooter from "./ModernFooter";
import ModernFaqAccordion from "./ModernFaqAccordion";
import ModernTypewriterHeading from "./ModernTypewriterHeading";
import ModernPricingLocationBlocks from "./ModernPricingLocationBlocks";
import { getCityName, getCityAbbr } from "../../lib/modern-site-meta";
import { getContactHref } from "../../lib/modern-sites";
import type { MenuNode } from "../menu-html";
import type { Faq } from "../../lib/modern-course-content";
import { splitPrivateInstructionPricing, type PrivateInstructionContent } from "../../lib/modern-private-instruction-content";

export default function ModernPrivateInstructionPage({
  site,
  title,
  content,
  faqs,
}: {
  site: any;
  title: string;
  content: PrivateInstructionContent;
  faqs: Faq[];
}) {
  // sf's own real page carries its pricing as two already-titled
  // [mkd_icon_with_text] cards (see PrivateInstructionContent's own
  // comment) - used as-is, with real site-specific titles, in preference
  // to the flat pricingItems heuristic split below (mia/pdx/hou's own
  // shape, which has no real block titles of its own to draw on).
  const { pricing, location } =
    content.pricingBlocks.length > 0
      ? {
          pricing: content.pricingBlocks[0]?.items ?? [],
          location: content.pricingBlocks[1]?.items ?? [],
        }
      : splitPrivateInstructionPricing(content.pricingItems);
  const pricingTitle = content.pricingBlocks[0]?.title || "Pricing";
  const locationTitle = content.pricingBlocks[1]?.title || "Location & Studio Costs";
  return (
    <div className="gmpm-root min-h-screen">
      <ModernHeader menu={site.mainMenu as MenuNode[] | null} cityAbbr={getCityAbbr(site)} siteSlug={site.slug} />

      <section className="gmpm-grid-bg">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-24 pb-16 md:pt-32 md:pb-20">
          <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-6 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-[var(--gmpm-accent)]" />
            {getCityName(site)} — One to one
          </div>
          <ModernTypewriterHeading
            text={title}
            className="font-bold text-[10vw] leading-[0.95] md:text-[4.5vw] md:leading-[0.95] max-w-3xl"
          />
        </div>
      </section>

      {(content.intro || content.onlineNote) && (
        <section className="max-w-[900px] mx-auto px-6 md:px-10 pt-16">
          {content.intro && (
            <p className="text-[var(--gmpm-text-dim)] leading-relaxed mb-4">{content.intro}</p>
          )}
          {content.onlineNote && (
            <p className="text-[var(--gmpm-text-dim)] leading-relaxed">{content.onlineNote}</p>
          )}
        </section>
      )}

      {(pricing.length > 0 || location.length > 0) && (
        <section className="max-w-[1100px] mx-auto px-6 md:px-10 py-16">
          <ModernPricingLocationBlocks
            blocks={[
              { icon: "pricing", title: pricingTitle, items: pricing },
              { icon: "location", title: locationTitle, items: location },
            ]}
          />
          <Link
            href={getContactHref(site.slug)}
            className="mt-8 inline-block gmpm-mono text-xs uppercase px-6 py-3 bg-[var(--gmpm-accent)] text-[var(--gmpm-accent-contrast)] font-medium hover:bg-[var(--gmpm-accent-dim)] transition-colors"
          >
            Send us a message
          </Link>
        </section>
      )}

      <ModernFaqAccordion faqs={faqs} />

      <ModernFooter siteName={site.name} cityName={getCityName(site)} siteSlug={site.slug} />
    </div>
  );
}
