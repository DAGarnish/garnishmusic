import "../../app/modern-globals.css";
import Link from "next/link";
import ModernHeader from "./ModernHeader";
import ModernFooter from "./ModernFooter";
import ModernTypewriterHeading from "./ModernTypewriterHeading";
import { getCityName, getCityAbbr } from "../../lib/modern-site-meta";
import { stripHardcodedWhiteText } from "../../lib/modern-course-content";
import type { InstructorDirectoryCard } from "../../lib/modern-instructors-content";
import type { MenuNode } from "../menu-html";

export type InstructorCard = {
  name: string;
  photoUrl?: string;
  bioHtml: string;
};

export default function ModernInstructorsPage({
  site,
  instructors,
  directory,
}: {
  site: any;
  instructors: InstructorCard[];
  // When the site's own instructors page is a real, hand-maintained
  // directory (currently la/staging - see extractInstructorDirectory),
  // every real instructor is shown as a card linking out to their own bio
  // page instead of a curated few with the full bio inlined - pdx/hou's
  // instructors pages have no real content of their own to parse (see
  // modern-site-routes.ts), so they still use the curated `instructors`
  // list above.
  directory?: InstructorDirectoryCard[];
}) {
  const cityName = getCityName(site);
  const isDirectory = Boolean(directory && directory.length > 0);

  return (
    <div className="gmpm-root min-h-screen">
      <ModernHeader menu={site.mainMenu as MenuNode[] | null} cityAbbr={getCityAbbr(site)} siteSlug={site.slug} />

      <section className="gmpm-grid-bg">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-24 pb-16 md:pt-32 md:pb-20">
          <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-6 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-[var(--gmpm-accent)]" />
            {cityName} — The roster
          </div>
          <ModernTypewriterHeading
            text={`Instructors | ${cityName}`}
            className="font-bold text-[15vw] leading-[0.95] md:text-[6vw] md:leading-[0.95] max-w-3xl"
          />
          <p className="mt-8 text-lg text-[var(--gmpm-text-dim)] max-w-xl">
            {isDirectory
              ? `${directory!.length} working producers, mixers, and songwriters — not career teachers.`
              : "Working producers, mixers, and songwriters — not career teachers."}
          </p>
        </div>
      </section>

      {isDirectory ? (
        <section className="max-w-[1400px] mx-auto px-6 md:px-10 pt-4 md:pt-6 pb-4 md:pb-6 space-y-px bg-[var(--gmpm-line)] border-t border-b border-[var(--gmpm-line)]">
          {directory!.map((inst, i) => (
            <div key={i} className="bg-[var(--gmpm-bg)] py-12 grid md:grid-cols-[220px_1fr] gap-8">
              <div>
                <div className="gmpm-mono text-[11px] text-[var(--gmpm-text-dim)] mb-4">
                  {String(i + 1).padStart(2, "0")}
                </div>
                {inst.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={inst.photoUrl}
                    alt={inst.name}
                    className="w-full aspect-square object-cover grayscale gmpm-corner"
                  />
                )}
              </div>
              <div>
                <h2 className="gmpm-display font-bold text-2xl md:text-3xl mb-2">{inst.name}</h2>
                {inst.title && (
                  <p className="text-[var(--gmpm-text-dim)] mb-4">{inst.title}</p>
                )}
                {inst.info.length > 0 && (
                  <div className="space-y-2 mb-6 max-w-2xl">
                    {inst.info.map((line, j) => (
                      <p key={j} className="text-sm text-[var(--gmpm-text-dim)] leading-relaxed">
                        {line}
                      </p>
                    ))}
                  </div>
                )}
                <Link
                  href={inst.href}
                  className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] hover:opacity-70 transition-opacity"
                >
                  See Bio →
                </Link>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section className="max-w-[1400px] mx-auto px-6 md:px-10 pt-4 md:pt-6 pb-4 md:pb-6 space-y-px bg-[var(--gmpm-line)] border-t border-b border-[var(--gmpm-line)]">
          {instructors.map((inst, i) => (
            <div key={i} className="bg-[var(--gmpm-bg)] py-12 grid md:grid-cols-[220px_1fr] gap-8">
              <div>
                <div className="gmpm-mono text-[11px] text-[var(--gmpm-text-dim)] mb-4">
                  {String(i + 1).padStart(2, "0")}
                </div>
                {inst.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={inst.photoUrl}
                    alt={inst.name}
                    className="w-full aspect-square object-cover grayscale gmpm-corner"
                  />
                )}
              </div>
              <div>
                <h2 className="gmpm-display font-bold text-2xl md:text-3xl mb-4">{inst.name}</h2>
                <div
                  className="prose-modern text-[var(--gmpm-text-dim)] leading-relaxed max-w-2xl [&_p]:mb-4 [&_a]:text-[var(--gmpm-accent)] [&_strong]:text-[var(--gmpm-text)]"
                  dangerouslySetInnerHTML={{ __html: stripHardcodedWhiteText(inst.bioHtml) }}
                />
              </div>
            </div>
          ))}
        </section>
      )}

      <ModernFooter siteName={site.name} cityName={cityName} siteSlug={site.slug} />
    </div>
  );
}
