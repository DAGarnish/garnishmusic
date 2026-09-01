import "../../app/modern-globals.css";
import Link from "next/link";
import ModernHeader from "./ModernHeader";
import ModernFooter from "./ModernFooter";
import ModernFaqAccordion from "./ModernFaqAccordion";
import ModernAccordionSection from "./ModernAccordionSection";
import ModernTypewriterHeading from "./ModernTypewriterHeading";
import ModernRelatedPosts from "./ModernRelatedPosts";
import ModernInstructorGrid, { type InstructorGridItem } from "./ModernInstructorGrid";
import ModernTestimonialCarousel from "./ModernTestimonialCarousel";
import ModernCourseScheduleAccordion from "./ModernCourseScheduleAccordion";
import ModernCurriculumAccordion from "./ModernCurriculumAccordion";
import { getCityName, getCityAbbr } from "../../lib/modern-site-meta";
import type { MenuNode } from "../menu-html";
import { stripHardcodedWhiteText } from "../../lib/modern-course-content";
import type {
  CourseSection,
  CurriculumModule,
  CoursePricing,
  Faq,
  AccordionModule,
  VideoEmbed,
} from "../../lib/modern-course-content";
import type { RelatedPost } from "../../lib/modern-related-posts";
import type { TestimonialItem } from "../../scripts/wp-shortcode-render";
import type { PayPalButton } from "../PayPalHostedButtons";

export default function ModernCoursePage({
  site,
  title,
  heroImageUrl,
  sections,
  curriculum,
  intro,
  pricing,
  faqs,
  curriculumAccordion = [],
  curriculumEyebrow = "Curriculum",
  curriculumHeading = "Program modules.",
  secondaryAccordion = [],
  secondaryAccordionEyebrow = "",
  secondaryAccordionHeading = "",
  videoEmbeds = [],
  instructorGridItems = [],
  testimonials = [],
  relatedPosts,
  eduDomain,
  themeClassName,
  courseSchedule,
  whatYouWillLearn,
  isSpanish = false,
}: {
  site: any;
  title: string;
  heroImageUrl?: string;
  sections: CourseSection[];
  curriculum: CurriculumModule[];
  intro: string[];
  pricing: CoursePricing;
  faqs: Faq[];
  curriculumAccordion?: AccordionModule[];
  // Some pages' one accordion is really instructor bios (+ a trailing
  // syllabus tab), not curriculum modules - see extractAccordionModules'
  // own comment on courses/k-pop-hitmaker. Real content either way, but
  // "CURRICULUM / Program modules." mislabels it, so callers with that
  // shape can override both.
  curriculumEyebrow?: string;
  curriculumHeading?: string;
  // garnish-la-artist-services has two genuinely separate real accordions
  // (Offerings, then a Gear List) that extractAccordionModules can't tell
  // apart on its own (it scans the whole page for [mkd_accordion_tab]s) -
  // callers with two split this second group out and label it here.
  secondaryAccordion?: AccordionModule[];
  secondaryAccordionEyebrow?: string;
  secondaryAccordionHeading?: string;
  videoEmbeds?: VideoEmbed[];
  instructorGridItems?: InstructorGridItem[];
  testimonials?: TestimonialItem[];
  relatedPosts: RelatedPost[];
  eduDomain: string;
  // Opt-in class (e.g. "gmpm-theme-classic-dark" in modern-globals.css) that
  // overrides this template's --gmpm-* tokens for specific course pages,
  // set by page.tsx keyed off slug. Undefined for every other course page,
  // which keeps the site-wide default look.
  themeClassName?: string;
  // mia's "View Course Schedule & Details" disclosure (cohort dates,
  // pricing breakdown, PayPal checkout) - see COURSE_SCHEDULE_PAGES in
  // page.tsx. Undefined for every course page without a matching product
  // doc, which is every course page on every other modern site so far.
  courseSchedule?: { bodyHtml: string; paypalButtons?: PayPalButton[] };
  // mia's own curriculum breakdown (extractIconBulletCardGroups, see that
  // function's own comment) - a real module-by-module bullet list this
  // template had nowhere to show at all before, distinct from `curriculum`
  // above (that prop's own <h2>+<ul> shape never matches mia's <h4>+
  // [mkd_icon] one).
  whatYouWillLearn?: CurriculumModule[];
  // curso-de-dj-espanol is Spanish-language body copy sitting inside this
  // same shared English-labeled template (course pages have no real i18n
  // system) - the handful of this template's own hardcoded UI labels (not
  // the imported blog posts below, which are real English-only editorial
  // content on a separate hub site) get swapped to Spanish when set, keyed
  // off slug by the caller.
  isSpanish?: boolean;
}) {
  // See the "Student stories" section below for what this gates.
  const showsInstructorsInSections = sections.some((s) => /instructors|collaborators/i.test(s.heading));
  // Gates the standalone testimonials block below - a section with this
  // heading already renders `testimonials` itself (see the sections.map
  // loop), so this avoids a double carousel on la/pdx pages that use that
  // shape. mia's own course pages never produce a "students say" section at
  // all (see extractCourseSections/the sections check above); their
  // [mkd_testimonials] widget sits under its own standalone "Testimonials"
  // heading (extractTestimonialCategorySlugs' isStudentsSayHeading matches
  // that literal heading too), which the standalone block below covers.
  const showsTestimonialsInSections = sections.some((s) => /students say/i.test(s.heading));
  // True whenever the standalone testimonials block below will actually
  // render - reused by the "Student stories" video fallback further down so
  // it doesn't also show once real written testimonials are already up.
  const showsStandaloneTestimonials = !showsTestimonialsInSections && testimonials.length > 0;
  // mia's own single "quick sample" clip sits beside its intro section at
  // the very top of the page (a real two-column row in the source, text
  // left/video right - e.g. electronic-dj-course's own "Garnish DJ
  // Classes, worldwide" Short), not buried down in the "Student stories"
  // section with the rest of this template's video fallback further below
  // - that section is for a genuine multi-video testimonial gallery
  // (la's academy page), which a single clip paired with the intro isn't.
  // Only pairs with sections[0] when there's exactly one video and a real
  // first section to sit beside.
  const showsVideoBesideIntro = sections.length > 0 && videoEmbeds.length === 1;

  return (
    <div className={`gmpm-root min-h-screen ${themeClassName || ""}`}>
      <ModernHeader menu={site.mainMenu as MenuNode[] | null} cityAbbr={getCityAbbr(site)} />

      <section className="relative overflow-hidden gmpm-grid-bg">
        <div className="absolute inset-0">
          {heroImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroImageUrl} alt="" className="w-full h-full object-cover opacity-60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--gmpm-bg)] via-[var(--gmpm-bg)]/55 to-[var(--gmpm-bg)]/10" />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-6 md:px-10 pt-24 pb-16 md:pt-32 md:pb-20">
          <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-6 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-[var(--gmpm-accent)]" />
            Course — {getCityName(site)}
          </div>
          <ModernTypewriterHeading
            key={title}
            text={title}
            className="font-bold text-[11vw] leading-[0.95] md:text-[5vw] md:leading-[0.95] max-w-3xl"
          />

          {pricing.priceLine && (
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="gmpm-mono text-sm text-[var(--gmpm-text-dim)] border border-[var(--gmpm-line)] px-4 py-2">
                {pricing.priceLine}
              </div>
              {pricing.enrollLink && (
                <Link
                  href={pricing.enrollLink}
                  target="_blank"
                  className="gmpm-mono text-xs uppercase px-6 py-3 bg-[var(--gmpm-accent)] text-[var(--gmpm-accent-contrast)] font-medium hover:bg-[var(--gmpm-accent-dim)] transition-colors"
                >
                  Enroll now
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {intro.length > 0 && (
        <section className="max-w-[900px] mx-auto px-6 md:px-10 py-16 space-y-5">
          {intro.map((p, i) => (
            <p key={i} className="text-[var(--gmpm-text-dim)] leading-relaxed">
              {p}
            </p>
          ))}
        </section>
      )}

      {sections.map((s, i) =>
        i === 0 && showsVideoBesideIntro ? (
          <section
            key={i}
            className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 border-t border-[var(--gmpm-line)] grid md:grid-cols-3 gap-10 items-start"
          >
            <div className="md:col-span-2">
              <h2 className="gmpm-display font-bold text-2xl md:text-3xl mb-6">{s.heading}</h2>
              <div
                className="prose-modern text-[var(--gmpm-text-dim)] leading-relaxed [&_p]:mb-4 [&_a]:text-[var(--gmpm-accent)] [&_strong]:text-[var(--gmpm-text)]"
                dangerouslySetInnerHTML={{ __html: stripHardcodedWhiteText(s.bodyHtml) }}
              />
            </div>
            <div className={`gmpm-corner border border-[var(--gmpm-line)] ${videoEmbeds[0].vertical ? "max-w-xs md:ml-auto" : ""}`}>
              <div className={videoEmbeds[0].vertical ? "aspect-[9/16]" : "aspect-video"}>
                <iframe
                  src={videoEmbeds[0].embedUrl}
                  title={videoEmbeds[0].title}
                  className="w-full h-full"
                  style={{ border: 0 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              {videoEmbeds[0].title && (
                <div className="px-4 py-3 gmpm-mono text-xs uppercase text-[var(--gmpm-text-dim)]">
                  {videoEmbeds[0].title}
                </div>
              )}
            </div>
          </section>
        ) : (
          <section key={i} className="max-w-[900px] mx-auto px-6 md:px-10 py-12 border-t border-[var(--gmpm-line)]">
            <h2 className="gmpm-display font-bold text-2xl md:text-3xl mb-6">{s.heading}</h2>
            <div
              className="prose-modern text-[var(--gmpm-text-dim)] leading-relaxed [&_p]:mb-4 [&_a]:text-[var(--gmpm-accent)] [&_strong]:text-[var(--gmpm-text)]"
              dangerouslySetInnerHTML={{ __html: stripHardcodedWhiteText(s.bodyHtml) }}
            />
            {/* The real instructor photo grid behind this page's own "Meet
                Our World-Class Instructors" section - the [mkd_portfolio_slider]
                shortcode itself was previously silently stripped, leaving just
                this heading + intro paragraph with no photos. Some pages'
                heading calls the same real roster "Collaborators" instead
                (garnish-la-artist-services) - matched too, rather than only
                the literal word "instructors". */}
            {/instructors|collaborators/i.test(s.heading) && <ModernInstructorGrid items={instructorGridItems} />}
            {/* The real [mkd_testimonials] widget behind this section - see
                page.tsx's own testimonials fetch (explicitly excludes Paris
                Hilton, kept off these pages until specifically asked for). */}
            {/students say/i.test(s.heading) && <ModernTestimonialCarousel items={testimonials} />}
          </section>
        )
      )}

      {/* "Below the certified logos" - on the pages that have this content
          at all (mia's own), the logo is the last thing in the intro/
          sections body above, whichever shape produced it (plain `intro`
          array vs a real [mkd_section_title] `sections` entry - confirmed
          both shapes exist across different course pages, see
          extractCourseIntro's own oldShape/parallaxCards split), so this
          renders after both rather than only one. */}
      {whatYouWillLearn && whatYouWillLearn.length > 0 && (
        <ModernCurriculumAccordion
          title={isSpanish ? "Lo Que Aprenderás" : "What You Will Learn"}
          modules={whatYouWillLearn}
        />
      )}

      {/* mia's own standalone "Testimonials" row - see
          showsTestimonialsInSections' own comment above for why this is
          separate from the sections.map carousel used by la/pdx's
          "Students Say" section shape. */}
      {showsStandaloneTestimonials && (
        <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-20">
          <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-3">Testimonials</div>
          <h2 className="gmpm-display font-bold text-3xl md:text-4xl max-w-2xl mb-12">What our students say.</h2>
          <ModernTestimonialCarousel items={testimonials} />
        </section>
      )}

      {courseSchedule && (
        <ModernCourseScheduleAccordion
          title={isSpanish ? "Ver Horario y Detalles del Curso" : undefined}
          bodyHtml={courseSchedule.bodyHtml}
          paypalButtons={courseSchedule.paypalButtons}
        />
      )}

      {curriculum.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-24">
          <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-3">Curriculum</div>
          <h2 className="gmpm-display font-bold text-3xl md:text-5xl max-w-2xl mb-16">
            What you&apos;ll cover.
          </h2>
          <div className="grid md:grid-cols-3 gap-px bg-[var(--gmpm-line)] border border-[var(--gmpm-line)]">
            {curriculum.map((mod, i) => (
              <div key={i} className="gmpm-corner bg-[var(--gmpm-bg)] p-8">
                <div className="gmpm-mono text-[11px] text-[var(--gmpm-text-dim)] mb-4">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="gmpm-display font-bold text-lg mb-4">{mod.heading}</h3>
                <ul className="space-y-2">
                  {mod.items.map((item, j) => (
                    <li key={j} className="text-sm text-[var(--gmpm-text-dim)] flex gap-2">
                      <span className="text-[var(--gmpm-accent)]">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Real instructor photos (see extractPortfolioSliderSpec) take this
          slot over the video-testimonials section below when they're
          available and not already shown - a section whose own heading
          matches /instructors|collaborators/i (above) already renders
          instructorGridItems itself, so this would otherwise duplicate the
          exact same grid a second time on those pages. mia's own course
          pages regularly have neither a real "Meet Our Instructors" section
          nor a genuine student-testimonial video (extractVideoEmbeds's
          match here is often just a generic school-promo clip, not
          testimonial content, confirmed on courses/ableton-live-course -
          real instructor photos are the more useful, accurate thing to
          show in this spot on pages like that one). The video also drops
          out entirely once real written testimonials are already shown
          above (see the standalone Testimonials section) - both under the
          same "What our students say." heading would be redundant, and the
          video is frequently that generic promo clip rather than real
          student testimony anyway. */}
      {!showsInstructorsInSections && instructorGridItems.length > 0 ? (
        <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-20">
          <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-3">Instructors</div>
          <h2 className="gmpm-display font-bold text-3xl md:text-4xl max-w-2xl mb-4">Meet your instructors.</h2>
          <ModernInstructorGrid items={instructorGridItems} />
        </section>
      ) : (
        !showsStandaloneTestimonials && !showsVideoBesideIntro && videoEmbeds.length > 0 && (
          <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-20">
            <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-3">Student stories</div>
            <h2 className="gmpm-display font-bold text-3xl md:text-4xl max-w-2xl mb-12">What our students say.</h2>
            {/* A lone vertical clip (e.g. electronic-dj-course's own YouTube
                Short) gets its own right-aligned, portrait-proportioned
                layout instead of stretching into a half-width 16:9 grid
                cell - the standard two-up grid below is for the common case
                of one or more regular landscape clips. */}
            {videoEmbeds.length === 1 && videoEmbeds[0].vertical ? (
              <div className="flex md:justify-end">
                <div className="gmpm-corner border border-[var(--gmpm-line)] w-full max-w-xs">
                  <div className="aspect-[9/16]">
                    <iframe
                      src={videoEmbeds[0].embedUrl}
                      title={videoEmbeds[0].title}
                      className="w-full h-full"
                      style={{ border: 0 }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                  {videoEmbeds[0].title && (
                    <div className="px-4 py-3 gmpm-mono text-xs uppercase text-[var(--gmpm-text-dim)]">
                      {videoEmbeds[0].title}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {videoEmbeds.map((v, i) => (
                  <div key={i} className="gmpm-corner border border-[var(--gmpm-line)]">
                    <div className={v.vertical ? "aspect-[9/16] max-w-xs mx-auto" : "aspect-video"}>
                      <iframe
                        src={v.embedUrl}
                        title={v.title}
                        className="w-full h-full"
                        style={{ border: 0 }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                    {v.title && (
                      <div className="px-4 py-3 gmpm-mono text-xs uppercase text-[var(--gmpm-text-dim)]">{v.title}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )
      )}

      <ModernAccordionSection eyebrow={curriculumEyebrow} heading={curriculumHeading} items={curriculumAccordion} />

      <ModernAccordionSection eyebrow={secondaryAccordionEyebrow} heading={secondaryAccordionHeading} items={secondaryAccordion} />

      <ModernFaqAccordion faqs={faqs} />

      {pricing.enrollLink && (
        <section className="border-t border-[var(--gmpm-line)] py-20">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <h2 className="gmpm-display font-bold text-2xl md:text-4xl max-w-xl">
              Ready to get started?
            </h2>
            <Link
              href={pricing.enrollLink}
              target="_blank"
              className="shrink-0 gmpm-mono text-xs uppercase px-6 py-3 bg-[var(--gmpm-accent)] text-[var(--gmpm-accent-contrast)] font-medium hover:bg-[var(--gmpm-accent-dim)] transition-colors"
            >
              Enroll now
            </Link>
          </div>
        </section>
      )}

      <ModernRelatedPosts posts={relatedPosts} eduDomain={eduDomain} isSpanish={isSpanish} />

      <ModernFooter siteName={site.name} cityName={getCityName(site)} />
    </div>
  );
}
