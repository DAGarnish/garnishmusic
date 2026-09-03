import "../../app/modern-globals.css";
import ModernHeader from "./ModernHeader";
import ModernFooter from "./ModernFooter";
import ModernComparisonTable from "./ModernComparisonTable";
import ModernTypewriterHeading from "./ModernTypewriterHeading";
import { getCityName, getCityAbbr } from "../../lib/modern-site-meta";
import type { MenuNode } from "../menu-html";
import type { WhyUsBlurb } from "../../lib/modern-why-us-content";

// edu's own real /why-us/ page - see extractWhyUsBlurbs' own comment for
// the real content shape (4 plain <strong>Label:</strong> paragraphs, no
// shortcode structure at all). Also carries the same "Why choose Garnish?"
// comparison table every course page gets (ModernComparisonTable, centered
// here the same way - see that component's own `centered` prop comment) -
// user request, made right after that section shipped, to build a
// standalone page around it.
export default function ModernWhyUsPage({
  site,
  title,
  heroImageUrl,
  blurbs,
}: {
  site: any;
  title: string;
  heroImageUrl?: string;
  blurbs: WhyUsBlurb[];
}) {
  return (
    <div className="gmpm-root min-h-screen">
      <ModernHeader menu={site.mainMenu as MenuNode[] | null} cityAbbr={getCityAbbr(site)} siteSlug={site.slug} />

      <section className="relative overflow-hidden gmpm-grid-bg">
        <div className="absolute inset-0">
          {heroImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroImageUrl} alt="" className="w-full h-full object-cover opacity-60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--gmpm-bg)] via-[var(--gmpm-bg)]/55 to-[var(--gmpm-bg)]/10" />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-6 md:px-10 pt-24 pb-16 md:pt-32 md:pb-20 text-center">
          <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-6 flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 bg-[var(--gmpm-accent)]" />
            {getCityName(site)}
          </div>
          <ModernTypewriterHeading
            key={title}
            text={title}
            className="font-bold text-[9vw] leading-[1.05] md:text-[4vw] md:leading-[1.05] max-w-4xl mx-auto"
          />
        </div>
      </section>

      {blurbs.length > 0 && (
        <section className="max-w-[900px] mx-auto px-6 md:px-10 py-16 md:py-20 space-y-12">
          {blurbs.map((blurb, i) => (
            <div key={i}>
              <h2 className="gmpm-display font-bold text-xl md:text-2xl mb-3">{blurb.label}</h2>
              <p
                className="text-[var(--gmpm-text-dim)] leading-relaxed [&_a]:text-[var(--gmpm-accent)] [&_a]:underline [&_a]:underline-offset-2"
                dangerouslySetInnerHTML={{ __html: blurb.bodyHtml }}
              />
            </div>
          ))}
        </section>
      )}

      <ModernComparisonTable cityAbbr={getCityAbbr(site)} centered />

      <ModernFooter siteName={site.name} cityName={getCityName(site)} siteSlug={site.slug} />
    </div>
  );
}
