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
import { getCityName, getCityAbbr } from "../../lib/modern-site-meta";
import type { MenuNode } from "../menu-html";
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
}) {
  return (
    <div className="gmpm-root min-h-screen">
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
                  className="gmpm-mono text-xs uppercase px-6 py-3 bg-[var(--gmpm-accent)] text-black font-medium hover:bg-[var(--gmpm-accent-dim)] transition-colors"
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

      {sections.map((s, i) => (
        <section key={i} className="max-w-[900px] mx-auto px-6 md:px-10 py-12 border-t border-[var(--gmpm-line)]">
          <h2 className="gmpm-display font-bold text-2xl md:text-3xl mb-6">{s.heading}</h2>
          <div
            className="prose-modern text-[var(--gmpm-text-dim)] leading-relaxed [&_p]:mb-4 [&_a]:text-[var(--gmpm-accent)] [&_strong]:text-[var(--gmpm-text)]"
            dangerouslySetInnerHTML={{ __html: s.bodyHtml }}
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
      ))}

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

      {videoEmbeds.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-20">
          <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-3">Student stories</div>
          <h2 className="gmpm-display font-bold text-3xl md:text-4xl max-w-2xl mb-12">What our students say.</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {videoEmbeds.map((v, i) => (
              <div key={i} className="gmpm-corner border border-[var(--gmpm-line)]">
                <div className="aspect-video">
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
        </section>
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
              className="shrink-0 gmpm-mono text-xs uppercase px-6 py-3 bg-[var(--gmpm-accent)] text-black font-medium hover:bg-[var(--gmpm-accent-dim)] transition-colors"
            >
              Enroll now
            </Link>
          </div>
        </section>
      )}

      <ModernRelatedPosts posts={relatedPosts} eduDomain={eduDomain} />

      <ModernFooter siteName={site.name} cityName={getCityName(site)} />
    </div>
  );
}
