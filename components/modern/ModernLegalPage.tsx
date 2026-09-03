import "../../app/modern-globals.css";
import ModernHeader from "./ModernHeader";
import ModernFooter from "./ModernFooter";
import { getCityName, getCityAbbr } from "../../lib/modern-site-meta";
import type { MenuNode } from "../menu-html";
import type { LegalSection } from "../../lib/modern-legal-content";

// edu's real /tc/ and /privacy-policy/ pages - see extractLegalDocument's
// own comment for the real content shape (a flat run of heading + bare-
// paragraph/list sections, no images/pricing/testimonials/accordions the
// way a course page has), so a plain document layout instead of
// ModernCoursePage's much richer one.
export default function ModernLegalPage({
  site,
  title,
  sections,
}: {
  site: any;
  title: string;
  sections: LegalSection[];
}) {
  return (
    <div className="gmpm-root min-h-screen">
      <ModernHeader menu={site.mainMenu as MenuNode[] | null} cityAbbr={getCityAbbr(site)} siteSlug={site.slug} />

      <section className="gmpm-grid-bg">
        <div className="max-w-[900px] mx-auto px-6 md:px-10 pt-24 pb-16 md:pt-32 md:pb-20">
          <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-6 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-[var(--gmpm-accent)]" />
            {getCityName(site)}
          </div>
          <h1 className="gmpm-display font-bold text-[10vw] leading-[0.95] md:text-[4vw] md:leading-[0.95]">
            {title}
          </h1>
        </div>
      </section>

      <section className="max-w-[900px] mx-auto px-6 md:px-10 pb-24 space-y-10">
        {sections.map((s, i) => (
          <div key={i}>
            <h2 className="gmpm-display font-bold text-xl mb-3">{s.heading}</h2>
            <div
              className="prose-modern text-[var(--gmpm-text-dim)] leading-relaxed [&_a]:text-[var(--gmpm-accent)] [&_strong]:text-[var(--gmpm-text)]"
              dangerouslySetInnerHTML={{ __html: s.bodyHtml }}
            />
          </div>
        ))}
      </section>

      <ModernFooter siteName={site.name} cityName={getCityName(site)} siteSlug={site.slug} />
    </div>
  );
}
