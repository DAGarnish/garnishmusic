import "../../app/modern-globals.css";
import Link from "next/link";
import ModernHeader from "./ModernHeader";
import ModernFooter from "./ModernFooter";
import ModernFaqAccordion from "./ModernFaqAccordion";
import ModernTypewriterHeading from "./ModernTypewriterHeading";
import { getCityName, getCityAbbr } from "../../lib/modern-site-meta";
import { getContactHref } from "../../lib/modern-sites";
import type { MenuNode } from "../menu-html";
import type { EduPrivateInstructionContent } from "../../lib/modern-edu-private-instruction-content";

// edu's own real private-instruction page - richer than the per-city
// shape ModernPrivateInstructionPage handles (see
// extractEduPrivateInstructionContent's own comment for the real content
// shape this reads), so it gets its own template.
export default function ModernEduPrivateInstructionPage({
  site,
  title,
  content,
}: {
  site: any;
  title: string;
  content: EduPrivateInstructionContent;
}) {
  const contactHref = getContactHref(site.slug);
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
            className="font-bold text-[9vw] leading-[0.95] md:text-[3.8vw] md:leading-[0.95] max-w-4xl"
          />
        </div>
      </section>

      {content.introParagraphs.length > 0 && (
        <section className="max-w-[900px] mx-auto px-6 md:px-10 py-16">
          {content.introParagraphs.map((p, i) => (
            <p key={i} className="text-[var(--gmpm-text-dim)] leading-relaxed mb-4 last:mb-0">
              {p}
            </p>
          ))}
        </section>
      )}

      {content.instructorsHeading && (
        <section className="max-w-[900px] mx-auto px-6 md:px-10 pb-16 border-t border-[var(--gmpm-line)] pt-16">
          <h2 className="gmpm-display font-bold text-2xl md:text-3xl mb-6">{content.instructorsHeading}</h2>
          {content.instructorsBody.map((p, i) => (
            <p key={i} className="text-[var(--gmpm-text-dim)] leading-relaxed mb-4 last:mb-0">
              {p}
            </p>
          ))}
        </section>
      )}

      {content.pricingBlocks.length > 0 && (
        <section className="max-w-[900px] mx-auto px-6 md:px-10 pb-16 grid sm:grid-cols-2 gap-px bg-[var(--gmpm-line)] border border-[var(--gmpm-line)]">
          {content.pricingBlocks.map((block, i) => (
            <div key={i} className="bg-[var(--gmpm-bg)] p-8">
              <div className="gmpm-mono text-[11px] uppercase text-[var(--gmpm-accent)] mb-4">{block.title}</div>
              <ul className="space-y-3">
                {block.items.map((item, j) => (
                  <li key={j} className="text-sm text-[var(--gmpm-text)]">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {content.whoForItems.length > 0 && (
        <section className="max-w-[900px] mx-auto px-6 md:px-10 py-16 border-t border-[var(--gmpm-line)]">
          <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-3">Who it's for</div>
          <h2 className="gmpm-display font-bold text-2xl md:text-3xl mb-8">
            {content.whoForHeading || "Who is this for?"}
          </h2>
          <ul className="space-y-3">
            {content.whoForItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-[var(--gmpm-text-dim)] leading-relaxed">
                <span className="text-[var(--gmpm-accent)] mt-1 shrink-0">→</span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {content.closingHeading && (
        <section className="max-w-[900px] mx-auto px-6 md:px-10 py-16 border-t border-[var(--gmpm-line)]">
          <h2 className="gmpm-display font-bold text-2xl md:text-3xl mb-6">{content.closingHeading}</h2>
          {content.closingBody.map((p, i) => (
            <p key={i} className="text-[var(--gmpm-text-dim)] leading-relaxed mb-4 last:mb-0">
              {p}
            </p>
          ))}
          <Link
            href={contactHref}
            className="mt-8 inline-block gmpm-mono text-xs uppercase px-6 py-3 bg-[var(--gmpm-accent)] text-[var(--gmpm-accent-contrast)] font-medium hover:bg-[var(--gmpm-accent-dim)] transition-colors"
          >
            Send us a message
          </Link>
        </section>
      )}

      <ModernFaqAccordion faqs={content.faqs} />

      <ModernFooter siteName={site.name} cityName={getCityName(site)} siteSlug={site.slug} />
    </div>
  );
}
