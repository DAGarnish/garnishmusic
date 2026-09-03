import "../../app/modern-globals.css";
import Link from "next/link";
import ModernHeader from "./ModernHeader";
import ModernFooter from "./ModernFooter";
import ModernTypewriterHeading from "./ModernTypewriterHeading";
import { getCityName, getCityAbbr } from "../../lib/modern-site-meta";
import { stripHardcodedWhiteText } from "../../lib/modern-course-content";
import type { MenuNode } from "../menu-html";

// Individual instructor bio page (courses/{slug}) - previously fell through
// to the legacy WPBakery-theme rendering even on modern sites, the one gap
// left after the Instructors listing page (ModernInstructorsPage) was
// rebuilt: every card there linked out to a page that didn't match the
// rest of the site's look. role is optional because it only exists on
// sites with a real instructors directory to cross-reference (la/staging -
// see the directory lookup in page.tsx) - pdx/hou's curated instructors
// don't have a separate role/title anywhere in their own content.
export default function ModernInstructorBioPage({
  site,
  name,
  role,
  photoUrl,
  bioHtml,
  backHref,
}: {
  site: any;
  name: string;
  role?: string;
  photoUrl?: string;
  bioHtml: string;
  backHref: string;
}) {
  const cityName = getCityName(site);

  return (
    <div className="gmpm-root min-h-screen">
      <ModernHeader menu={site.mainMenu as MenuNode[] | null} cityAbbr={getCityAbbr(site)} siteSlug={site.slug} />

      <section className="gmpm-grid-bg">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-24 pb-16 md:pt-32 md:pb-20">
          <Link
            href={backHref}
            className="gmpm-mono text-xs uppercase text-[var(--gmpm-text-dim)] hover:text-[var(--gmpm-accent)] transition-colors mb-6 inline-flex items-center gap-2"
          >
            ← Instructors
          </Link>
          <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-6 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-[var(--gmpm-accent)]" />
            {cityName} — Instructor
          </div>
          <ModernTypewriterHeading
            text={name}
            className="font-bold text-[13vw] leading-[0.95] md:text-[5.5vw] md:leading-[0.95] max-w-3xl"
          />
          {role && <p className="mt-6 text-lg text-[var(--gmpm-text-dim)] max-w-xl">{role}</p>}
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-20 grid md:grid-cols-[280px_1fr] gap-12">
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={name}
            className="w-full aspect-square object-cover grayscale gmpm-corner h-fit"
          />
        )}
        <div
          className="prose-modern text-[var(--gmpm-text-dim)] leading-relaxed max-w-2xl [&_p]:mb-4 [&_a]:text-[var(--gmpm-accent)] [&_strong]:text-[var(--gmpm-text)]"
          dangerouslySetInnerHTML={{ __html: stripHardcodedWhiteText(bioHtml) }}
        />
      </section>

      <ModernFooter siteName={site.name} cityName={cityName} siteSlug={site.slug} />
    </div>
  );
}
