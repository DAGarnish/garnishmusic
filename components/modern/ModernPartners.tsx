import type { PartnerLogo } from "../../lib/modern-partner-logos";

// Logos are pre-processed to real transparent PNGs, flat-colored to match
// whichever accent the caller passes in (lime network-wide, red on pdx -
// see lib/modern-partner-logos.ts), so they sit directly on the section's
// own background - no card, no box, no blend-mode trick needed.
export default function ModernPartners({ logos }: { logos: PartnerLogo[] }) {
  if (!logos.length) return null;
  return (
    <section className="border-t border-[var(--gmpm-line)] py-16 md:py-20">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-12 text-center">
          Some of our partners
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-10 gap-y-12">
          {logos.map((logo, i) => (
            <a
              key={i}
              href={logo.link}
              target="_blank"
              rel="noopener"
              title={logo.name}
              className="flex items-center justify-center h-10"
            >
              {/* transform/filter are GPU-accelerated compositor properties
                  (no layout/paint work on every frame), so this hover stays
                  cheap regardless of how many logos are on the page. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo.url}
                alt={logo.name}
                className="max-w-full max-h-full object-contain transition-transform duration-200 hover:scale-110 hover:drop-shadow-[0_0_14px_var(--gmpm-accent)]"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
