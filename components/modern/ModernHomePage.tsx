import "../../app/modern-globals.css";
import { getPayloadClient } from "../../lib/get-payload";
import { extractProgramCards } from "../../lib/modern-homepage-content";
import {
  extractAccordionModules,
  extractSingleImageIds,
  resolveSingleImages,
  extractRawHtmlVideoSrc,
  extractHomepageOfferings,
  extractHomepagePortfolioSection,
  extractTestimonialCategorySlugs,
  stripHardcodedWhiteText,
} from "../../lib/modern-course-content";
import { buildPortfolioListResolver } from "../../lib/wp-portfolio-resolver";
import ModernHeader from "./ModernHeader";
import ModernHero from "./ModernHero";
import ModernFooter from "./ModernFooter";
import ModernPartners from "./ModernPartners";
import ModernAccordionSection from "./ModernAccordionSection";
import ModernTestimonialCarousel from "./ModernTestimonialCarousel";
import type { TestimonialItem } from "../../scripts/wp-shortcode-render";
import { PARTNER_LOGOS_LIME, PARTNER_LOGOS_RED } from "../../lib/modern-partner-logos";
import { getCityName, getCityAbbr } from "../../lib/modern-site-meta";
import { MODERN_SITE_ROUTES } from "../../lib/modern-site-routes";
import { isCreamThemeSite } from "../../lib/modern-sites";
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

  const homeDoc = pages.docs[0] as any;

  // [vc_single_image] shortcodes reference a media doc by its original
  // WordPress attachment id, not this app's own Payload id (see
  // resolveSingleImages) - resolved and spliced back in as real <img> tags
  // before any of the extractors below run.
  let raw: string = homeDoc?.wpRawContent || "";
  const singleImageIds = extractSingleImageIds(raw);
  if (singleImageIds.length > 0) {
    const mediaRes = await payload.find({
      collection: "media",
      where: { wpAttachmentId: { in: singleImageIds.map(Number) } },
      // Padded well past the number of unique ids requested - some
      // wpAttachmentIds have more than one media doc migrated under them
      // (confirmed: id 17604 has 2), and a limit sized exactly to the
      // unique-id count can silently truncate the result set before
      // reaching every id.
      limit: singleImageIds.length + 20,
      depth: 0,
    });
    const urlsById = new Map(mediaRes.docs.map((d: any) => [String(d.wpAttachmentId), d.url as string]));
    raw = resolveSingleImages(raw, urlsById);
  }

  // mia's homepage course grid ("Shorter Music Production Classes") is a
  // [mkd_portfolio_list category="short-courses"] widget - real pages
  // (portfolioCategories-tagged), not inline text, so it needs its own DB
  // resolve rather than anything extractHomepageOfferings can find in raw
  // text (see extractHomepagePortfolioSection's own comment for why that
  // extractor can't see this row at all).
  const portfolioSection = extractHomepagePortfolioSection(raw);
  const portfolioItems = portfolioSection
    ? (await buildPortfolioListResolver(site.id, raw))(portfolioSection.categorySlug).slice(
        0,
        portfolioSection.count
      )
    : [];

  // la's real homepage is content-dense - real [mkd_section_title] offering
  // rows (Degree Programs, 360 Academy, each Music Production Programs
  // sub-card, Express Courses, Private Instruction...), most paired with
  // their own real photo (see extractHomepageOfferings). Tried first since
  // it's far richer than the Lexical-content-field 3-card fallback
  // (extractProgramCards) pdx/hou's own homepages still need - their raw
  // content doesn't use this shape at all (confirmed: 0 offerings found on
  // either).
  // extractHomepageOfferings still finds the portfolio widget's own
  // preceding heading-only row (mia's heading and the [mkd_portfolio_list]
  // itself sit in two separate top-level rows) and turns it into its own
  // text-only offering card (heading + the row's subtitle as body) - a real
  // card by that extractor's own rules, but a duplicate of the heading the
  // grid section above already renders. Dropped here rather than in the
  // extractor itself, since "this heading belongs to the portfolio grid
  // instead" is only knowable once portfolioSection has been resolved.
  const offerings = extractHomepageOfferings(raw).filter(
    (g) => !portfolioSection || g.groupHeading.trim().toLowerCase() !== portfolioSection.heading.trim().toLowerCase()
  );
  const cards = offerings.length === 0 && homeDoc?.content ? extractProgramCards(homeDoc.content) : [];
  const accordionItems = extractAccordionModules(raw);
  const heroVideo = extractRawHtmlVideoSrc(raw);

  // Each offering card's own real photo is named by background_image="<WP
  // attachment id>", the same id space (and same resolution path) as
  // [vc_single_image] elsewhere in this app - resolved in one batch rather
  // than per-card.
  const offeringImageIds = [
    ...new Set(
      offerings.flatMap((g) => g.cards.map((c) => c.imageId).filter((id): id is string => Boolean(id)))
    ),
  ];
  let offeringImageUrls = new Map<string, string>();
  if (offeringImageIds.length > 0) {
    const offeringMediaRes = await payload.find({
      collection: "media",
      where: { wpAttachmentId: { in: offeringImageIds.map(Number) } },
      // See the singleImageIds query above - padded past the unique-id
      // count for the same duplicate-wpAttachmentId reason (this is exactly
      // how id 16788, Private Instruction's own photo, was silently
      // dropped: id 17604 has 2 docs, and limit: offeringImageIds.length
      // filled up before the query ever reached 16788).
      limit: offeringImageIds.length + 20,
      depth: 0,
    });
    offeringImageUrls = new Map(offeringMediaRes.docs.map((d: any) => [String(d.wpAttachmentId), d.url as string]));
  }

  // The "Our Students Say..." row's own single hand-picked quote (Paris
  // Hilton) sits right above a [mkd_testimonials category="..."] widget
  // pulling many more real reviews - resolved here rather than through
  // lib/wp-testimonials-resolver.ts's own legacy-pipeline resolver, which
  // filters the category docs themselves by site and finds none: staging's
  // cloned testimonials still point at la's original category docs, not
  // freshly cloned ones, so that site filter excludes every one of them.
  // Matching on the populated category's own slug instead (ignoring which
  // site the category doc happens to belong to) sidesteps that entirely.
  const testimonialCategorySlugs = extractTestimonialCategorySlugs(raw);
  let testimonials: TestimonialItem[] = [];
  if (testimonialCategorySlugs.length > 0) {
    const testimonialsRes = await payload.find({
      collection: "testimonials",
      where: { site: { equals: site.id } },
      limit: 200,
      depth: 1,
    });
    testimonials = testimonialsRes.docs
      .filter((t: any) =>
        Array.isArray(t.categories) &&
        t.categories.some((c: any) => testimonialCategorySlugs.includes(typeof c === "object" ? c.slug : c))
      )
      .map((t: any) => ({
        author: t.author,
        text: t.text,
        imageUrl: typeof t.image === "object" ? t.image?.url : undefined,
      }));
  }

  const slides = (sliders.docs[0] as any)?.slides || [];
  const imagedSlides = slides.filter((s: any) => typeof s.image === "object" && s.image?.url);
  // Prefer the in-studio shot over the generic multi-city collage that
  // happens to be slide 1 - it reads far better against the sharp/technical
  // direction than a stock skyline montage. Always the hero's own
  // background now (the real hero video, when found, plays as its own full-
  // brightness section further down the page instead - see heroVideo).
  const heroImage = (
    imagedSlides.find((s: any) => /studio|JAM\d/i.test(s.image.url)) || imagedSlides[0]
  )?.image?.url;
  const stats = slides
    .map((s: any) => s.layers?.[0]?.text)
    .filter((t: string | undefined): t is string => Boolean(t))
    .map((t: string) => t.replace(/<br\s*\/?>/gi, " "))
    .slice(0, 4);

  const cityName = getCityName(site);
  const contactSlug = MODERN_SITE_ROUTES[site.slug]?.contactSlug;

  // The "Our Students Say..." card's own hand-picked quote (Paris Hilton) -
  // linked to her real public Wikipedia page, and its trailing "Contact
  // Admissions" CTA dropped: that button made sense as this card's own
  // closing action before the testimonial carousel existed right under it,
  // but now just adds a stray, off-topic link between two testimonials.
  const studentsSayBodyHtml = (html: string) =>
    html
      .replace(
        /<strong>Paris Hilton<\/strong>/,
        '<a href="https://en.wikipedia.org/wiki/Paris_Hilton" target="_blank" rel="noopener"><strong>Paris Hilton</strong></a>'
      )
      .replace(/<p><a[^>]*>Contact Admissions<\/a><\/p>/, "");

  return (
    <div className="gmpm-root min-h-screen">
      <ModernHeader menu={site.mainMenu as MenuNode[] | null} cityAbbr={getCityAbbr(site)} />
      <ModernHero
        heroImageUrl={heroImage}
        cityName={cityName}
        stats={stats.length ? stats : ["10 years running", "Small class sizes", "Working producers as tutors", `${cityName} studio`]}
        contactHref={contactSlug ? `/${contactSlug}` : undefined}
      />

      {heroVideo && (
        <section className="w-full">
          {/* Full brightness, no dimming gradient - unlike the hero's own
              background treatment, this plays as a real, undimmed video
              showcase rather than text-legibility backdrop. */}
          <video src={heroVideo} autoPlay muted loop playsInline className="w-full h-auto block" />
        </section>
      )}

      <ModernAccordionSection eyebrow="About" heading="Why choose us?" items={accordionItems} />

      {offerings.length > 0 && (
        <section id="programs" className="max-w-[1400px] mx-auto px-6 md:px-10 pt-16 md:pt-24">
          <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-3">Programs</div>
          <h2 className="gmpm-display font-bold text-3xl md:text-5xl max-w-2xl mb-4">
            Structured paths from first beat to finished record.
          </h2>
        </section>
      )}
      {offerings.map((group, gi) => (
        <div key={gi}>
          {/* A group with more than one card (e.g. Music Production
              Programs' four sub-programs) gets its own small label above
              them, since each card already carries its own specific heading
              rather than the group's - a single-card group's one card
              already uses the group's own heading directly (see
              extractHomepageOfferings), so no separate label is needed
              there. */}
          {group.cards.length > 1 && (
            <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-12">
              <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)]">{group.groupHeading}</div>
            </div>
          )}
          {group.cards.map((card, ci) => {
            const imageUrl = card.imageId ? offeringImageUrls.get(card.imageId) : undefined;
            return (
              <section
                key={ci}
                className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 md:py-12 border-t border-[var(--gmpm-line)]"
              >
                {/* items-center (not items-start) - a card's own text
                    column is regularly shorter than its portrait-oriented
                    photo (see the aspect-[4/5] image box below), and
                    top-aligning it left a lot of dead space under short
                    cards; centering it against the photo's full height
                    reads far more intentional. */}
                <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
                  {imageUrl && (
                    <div className="gmpm-corner border border-[var(--gmpm-line)] aspect-[4/5] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl} alt={card.heading} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className={imageUrl ? "" : "md:col-span-2 max-w-[700px]"}>
                    <h3 className="gmpm-display font-bold text-2xl md:text-3xl mb-6">{card.heading}</h3>
                    <div
                      className="prose-modern text-[var(--gmpm-text-dim)] leading-relaxed [&_p]:mb-4 [&_a]:text-[var(--gmpm-accent)] [&_strong]:text-[var(--gmpm-text)]"
                      dangerouslySetInnerHTML={{
                        __html: stripHardcodedWhiteText(
                          /^our students say/i.test(card.heading) ? studentsSayBodyHtml(card.bodyHtml) : card.bodyHtml
                        ),
                      }}
                    />
                    {/* The real [mkd_testimonials] widget behind this specific
                        card's own single quote - see testimonials above. */}
                    {/^our students say/i.test(card.heading) && <ModernTestimonialCarousel items={testimonials} />}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      ))}

      {portfolioSection && portfolioItems.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24 border-t border-[var(--gmpm-line)]">
          <h2 className="gmpm-display font-bold text-3xl md:text-5xl max-w-2xl mb-12">
            {portfolioSection.heading}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {portfolioItems.map((item, i) => (
              <a key={i} href={item.href} className="group block">
                {item.imageUrl && (
                  <div className="gmpm-corner border border-[var(--gmpm-line)] aspect-[4/5] overflow-hidden mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <h3 className="gmpm-display font-bold text-lg group-hover:text-[var(--gmpm-accent)] transition-colors">
                  {item.title}
                </h3>
              </a>
            ))}
          </div>
        </section>
      )}

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

      <ModernPartners logos={isCreamThemeSite(site.slug) ? PARTNER_LOGOS_RED : PARTNER_LOGOS_LIME} />

      <ModernFooter siteName={site.name} cityName={cityName} />
    </div>
  );
}
