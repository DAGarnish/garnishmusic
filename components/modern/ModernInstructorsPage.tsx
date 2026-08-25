import "../../app/modern-globals.css";
import ModernHeader from "./ModernHeader";
import ModernFooter from "./ModernFooter";
import ModernTypewriterHeading from "./ModernTypewriterHeading";
import type { MenuNode } from "../menu-html";

export type InstructorCard = {
  name: string;
  photoUrl?: string;
  bioHtml: string;
};

export default function ModernInstructorsPage({
  site,
  instructors,
}: {
  site: any;
  instructors: InstructorCard[];
}) {
  return (
    <div className="gmpm-root min-h-screen">
      <ModernHeader menu={site.mainMenu as MenuNode[] | null} />

      <section className="gmpm-grid-bg">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-24 pb-16 md:pt-32 md:pb-20">
          <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-6 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-[var(--gmpm-accent)]" />
            Portland — The roster
          </div>
          <ModernTypewriterHeading
            text="Instructors | Portland"
            className="font-bold text-[15vw] leading-[0.95] md:text-[6vw] md:leading-[0.95] max-w-3xl"
          />
          <p className="mt-8 text-lg text-[var(--gmpm-text-dim)] max-w-xl">
            Working producers, mixers, and songwriters — not career teachers.
          </p>
        </div>
      </section>

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
                dangerouslySetInnerHTML={{ __html: inst.bioHtml }}
              />
            </div>
          </div>
        ))}
      </section>

      <ModernFooter siteName={site.name} />
    </div>
  );
}
