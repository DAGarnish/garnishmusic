import Link from "next/link";
import ModernTypewriterHeading from "./ModernTypewriterHeading";

export default function ModernHero({ heroImageUrl, stats }: { heroImageUrl?: string; stats: string[] }) {
  return (
    <section className="relative overflow-hidden gmpm-grid-bg">
      <div className="absolute inset-0">
        {heroImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImageUrl} alt="" className="w-full h-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--gmpm-bg)] via-[var(--gmpm-bg)]/55 to-[var(--gmpm-bg)]/10" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-6 md:px-10 pt-28 pb-20 md:pt-40 md:pb-28">
        <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-6 flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-[var(--gmpm-accent)]" />
          Portland — Music Production &amp; DJ School
        </div>

        <ModernTypewriterHeading
          text="The world's boutique music production school"
          highlight="boutique"
          className="font-bold text-[13vw] leading-[0.95] md:text-[6.5vw] md:leading-[0.95] max-w-4xl"
        />

        <p className="mt-8 text-lg text-[var(--gmpm-text-dim)] max-w-xl">
          Learn to produce the music you love, in a pro studio setting — small classes,
          working producers as instructors, ten years of critically acclaimed courses.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/contact-map"
            className="gmpm-mono text-xs uppercase px-6 py-3 bg-[var(--gmpm-accent)] text-black font-medium hover:bg-[var(--gmpm-accent-dim)] transition-colors"
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
      </div>
    </section>
  );
}
