import "../../app/modern-globals.css";
import { getPayloadClient } from "../../lib/get-payload";
import { extractProgramCards } from "../../lib/modern-homepage-content";
import ModernHeader from "./ModernHeader";
import ModernHero from "./ModernHero";
import ModernFooter from "./ModernFooter";
import ModernPartners from "./ModernPartners";
import { PARTNER_LOGOS_LIME } from "../../lib/modern-partner-logos";
import { getCityName, getCityAbbr } from "../../lib/modern-site-meta";
import type { MenuNode } from "../menu-html";

export default async function ModernHomePage({ site }: { site: any }) {
  const payload = await getPayloadClient();

  const [pages, sliders] = await Promise.all([
    payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: site.id } }, { wpPostId: { equals: site.homepageWpId } }] },
      limit: 1,
    }),
    payload.find({
      collection: "hero-sliders",
      where: { and: [{ site: { equals: site.id } }, { alias: { equals: "main-home" } }] },
      limit: 1,
      depth: 1,
    }),
  ]);

  const homeDoc = pages.docs[0];
  const cards = homeDoc?.content ? extractProgramCards(homeDoc.content) : [];

  const slides = (sliders.docs[0] as any)?.slides || [];
  const imagedSlides = slides.filter((s: any) => typeof s.image === "object" && s.image?.url);
  // Prefer the in-studio shot over the generic multi-city collage that
  // happens to be slide 1 - it reads far better against the sharp/technical
  // direction than a stock skyline montage.
  const heroImage = (
    imagedSlides.find((s: any) => /studio|JAM\d/i.test(s.image.url)) || imagedSlides[0]
  )?.image?.url;
  const stats = slides
    .map((s: any) => s.layers?.[0]?.text)
    .filter((t: string | undefined): t is string => Boolean(t))
    .map((t: string) => t.replace(/<br\s*\/?>/gi, " "))
    .slice(0, 4);

  const cityName = getCityName(site);

  return (
    <div className="gmpm-root min-h-screen">
      <ModernHeader menu={site.mainMenu as MenuNode[] | null} cityAbbr={getCityAbbr(site)} />
      <ModernHero
        heroImageUrl={heroImage}
        cityName={cityName}
        stats={stats.length ? stats : ["10 years running", "Small class sizes", "Working producers as tutors", `${cityName} studio`]}
      />

      {cards.length > 0 && (
        <section id="programs" className="max-w-[1400px] mx-auto px-6 md:px-10 py-24">
          <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-3">Programs</div>
          <h2 className="gmpm-display font-bold text-3xl md:text-5xl max-w-2xl mb-16">
            Structured paths from first beat to finished record.
          </h2>
          <div className="grid md:grid-cols-3 gap-px bg-[var(--gmpm-line)] border border-[var(--gmpm-line)]">
            {cards.map((card, i) => (
              <div key={i} className="gmpm-corner bg-[var(--gmpm-bg)] p-8 flex flex-col">
                <div className="gmpm-mono text-[11px] text-[var(--gmpm-text-dim)] mb-6">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="gmpm-display font-bold text-xl mb-4">{card.heading}</h3>
                <p className="text-sm text-[var(--gmpm-text-dim)] leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <ModernPartners logos={PARTNER_LOGOS_LIME} />

      <ModernFooter siteName={site.name} cityName={cityName} />
    </div>
  );
}
