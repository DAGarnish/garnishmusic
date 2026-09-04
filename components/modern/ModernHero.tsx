import Link from "next/link";
import ModernTypewriterHeading from "./ModernTypewriterHeading";

export default function ModernHero({
  heroImageUrl,
  stats,
  cityName,
  contactHref = "/contact-map",
  imageMaxHeightClassName,
}: {
  heroImageUrl?: string;
  stats: string[];
  cityName: string;
  contactHref?: string;
  // This section's own content (stats grid included) makes it much taller
  // than edu's own shorter header - object-cover on a full-height image
  // inside that much taller box scales the image up more and crops tighter
  // than the same photo gets on edu, reading as "zoomed in" even though
  // it's the exact same file (confirmed on ny, which reuses edu's own
  // header photo - user request 2026-09-04). Capping the image's own
  // height here (rather than letting it stretch to the full, taller
  // section) keeps its crop close to how edu's shorter header shows it;
  // undefined elsewhere keeps every other caller's existing full-height
  // treatment unchanged.
  imageMaxHeightClassName?: string;
}) {
  return (
    <section className="relative overflow-hidden gmpm-grid-bg">
      <div className={`absolute inset-x-0 top-0 ${imageMaxHeightClassName || "inset-y-0"}`}>
        {heroImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImageUrl} alt="" className="w-full h-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--gmpm-bg)] via-[var(--gmpm-bg)]/55 to-[var(--gmpm-bg)]/10" />
      </div>

      <div
        className={`relative max-w-[1400px] mx-auto px-6 md:px-10 pt-28 md:pt-40 ${
          stats.length ? "pb-20 md:pb-28" : "pb-12 md:pb-16"
        }`}
      >
        <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-6 flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-[var(--gmpm-accent)]" />
          {cityName} — Music Production &amp; DJ School
        </div>

        <ModernTypewriterHeading
          text={`The world's boutique music production school | ${cityName}`}
          highlight="boutique"
          className="font-bold text-[13vw] leading-[0.95] md:text-[6.5vw] md:leading-[0.95] max-w-4xl"
        />

        <p className="mt-8 text-lg text-[var(--gmpm-text-dim)] max-w-xl">
          Learn to produce the music you love, in a pro studio setting — small classes,
          working producers as instructors, ten years of critically acclaimed courses.
        </p>

        <div className={`flex flex-wrap items-center gap-4 ${stats.length ? "mt-10" : "mt-10 mb-4"}`}>
          <Link
            href={contactHref}
            className="gmpm-mono text-xs uppercase px-6 py-3 bg-[var(--gmpm-accent)] text-[var(--gmpm-accent-contrast)] font-medium hover:bg-[var(--gmpm-accent-dim)] transition-colors"
          >
            Book a free consultation
          </Link>
          <Link
            href="#programs"
            className="gmpm-mono text-xs uppercase px-6 py-3 border border-[var(--gmpm-line)] hover:border-[var(--gmpm-accent)] transition-colors"
          >
            View programs
          </Link>
        </div>

        {/* Empty stats (mia - see ModernHomePage's own comment) skips this
            bar entirely rather than rendering an empty bordered grid. */}
        {stats.length > 0 && (
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--gmpm-line)] border border-[var(--gmpm-line)]">
            {stats.map((s, i) => (
              <div key={i} className="bg-[var(--gmpm-bg)] p-5">
                <div className="gmpm-mono text-[10px] text-[var(--gmpm-text-dim)] mb-1">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="text-sm">{s}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
