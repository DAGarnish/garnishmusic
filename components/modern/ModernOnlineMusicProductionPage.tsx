import "../../app/modern-globals.css";
import ModernHeader from "./ModernHeader";
import ModernFooter from "./ModernFooter";
import ModernTypewriterHeading from "./ModernTypewriterHeading";
import { getCityName, getCityAbbr } from "../../lib/modern-site-meta";
import type { MenuNode } from "../menu-html";
import type { VideoEmbed } from "../../lib/modern-course-content";

// edu-2's real /online-music-production/ page ("Do What You Love.
// Remotely.") - a network-wide hub page about Garnish's live-online/hybrid
// classes, not a per-city course, so it gets its own small template (title
// + hero image + a few paragraphs + the real explainer video) rather than
// ModernCoursePage's much richer one built for curriculum/pricing/FAQs this
// page doesn't have. See extractOnlineMusicProductionParagraphs' own
// comment for why the generic course extractors don't fit here.
export default function ModernOnlineMusicProductionPage({
  site,
  title,
  heroImageUrl,
  paragraphs,
  video,
}: {
  site: any;
  title: string;
  heroImageUrl?: string;
  paragraphs: string[];
  video: VideoEmbed | null;
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
            text={title}
            className="font-bold text-[9vw] leading-[1.05] md:text-[4vw] md:leading-[1.05] max-w-4xl mx-auto"
          />
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-20 grid md:grid-cols-3 gap-10 items-start">
        <div className="md:col-span-2 space-y-5">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className="text-[var(--gmpm-text-dim)] leading-relaxed [&_strong]:text-[var(--gmpm-text)]"
              dangerouslySetInnerHTML={{ __html: p }}
            />
          ))}
        </div>

        {video && (
          <div className="gmpm-corner border border-[var(--gmpm-line)]">
            <div className="aspect-video">
              <iframe
                src={video.embedUrl}
                title={video.title}
                className="w-full h-full"
                style={{ border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </section>

      <ModernFooter siteName={site.name} cityName={getCityName(site)} siteSlug={site.slug} />
    </div>
  );
}
