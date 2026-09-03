import "../../app/modern-globals.css";
import Link from "next/link";
import ModernHeader from "./ModernHeader";
import ModernFooter from "./ModernFooter";
import ModernFaqAccordion from "./ModernFaqAccordion";
import ModernTypewriterHeading from "./ModernTypewriterHeading";
import { getCityName, getCityAbbr } from "../../lib/modern-site-meta";
import { getContactHref } from "../../lib/modern-sites";
import type { MenuNode } from "../menu-html";
import type { Faq } from "../../lib/modern-course-content";
import type { PrivateInstructionContent } from "../../lib/modern-private-instruction-content";

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

      <section className="max-w-[900px] mx-auto px-6 md:px-10 py-16 grid md:grid-cols-2 gap-12">
        <div>
          {content.intro && (
            <p className="text-[var(--gmpm-text-dim)] leading-relaxed mb-6">{content.intro}</p>
          )}
          {content.onlineNote && (
            <p className="text-[var(--gmpm-text-dim)] leading-relaxed">{content.onlineNote}</p>
          )}
        </div>

        {content.pricingItems.length > 0 && (
          <div className="gmpm-corner border border-[var(--gmpm-line)] p-8 h-fit">
            <div className="gmpm-mono text-[11px] uppercase text-[var(--gmpm-accent)] mb-4">Pricing</div>
            <ul className="space-y-3 mb-6">
              {content.pricingItems.map((item, i) => (
                <li key={i} className="text-sm text-[var(--gmpm-text)]">
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href={getContactHref(site.slug)}
              className="inline-block gmpm-mono text-xs uppercase px-6 py-3 bg-[var(--gmpm-accent)] text-[var(--gmpm-accent-contrast)] font-medium hover:bg-[var(--gmpm-accent-dim)] transition-colors"
            >
              Send us a message
            </Link>
          </div>
        )}
      </section>

      <ModernFaqAccordion faqs={faqs} />

      <ModernFooter siteName={site.name} cityName={getCityName(site)} siteSlug={site.slug} />
    </div>
  );
}
