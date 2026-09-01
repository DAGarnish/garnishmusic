import { COMPARISON_VARIANTS } from "../../lib/modern-course-content";

// The "Side-by-Side Overview" graphic (Garnish vs. Others/Online Tutorials,
// five rows of green checks/red X's) mia's own course pages never had at
// all in their own raw content - la/pdx pages get it via a real
// [vc_single_image] shortcode (see comparisonTableHtml/COMPARISON_VARIANTS
// in lib/modern-course-content.ts, which rebuilds it as themed HTML rather
// than the original raster graphic), rebuilt here as a real component so
// every course page can show it, not just ones whose own source content
// happened to reference it. Uses the "18427" generic 5-row variant (every
// page checked shares this content, per that file's own comment) with the
// real per-site city abbreviation rather than a hardcoded "LA".
export default function ModernComparisonTable({ cityAbbr }: { cityAbbr: string }) {
  // The "18427" variant's own last row is transcribed verbatim from la's
  // original graphic ("Exclusive LA Events & Master Classes") - real for
  // la itself, but wrong for every other site this same generic variant
  // now renders on, so its own "LA" gets the same per-site swap the
  // "Garnish LA" label above already gets elsewhere (see page.tsx's own
  // sections-fix loop for the embedded-table version of this same fix).
  const rows = COMPARISON_VARIANTS["18427"].map((row) =>
    row === "Exclusive LA Events & Master Classes" ? `Exclusive ${cityAbbr} Events & Master Classes` : row
  );
  return (
    <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-20">
      <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-3">Why Garnish</div>
      <h2 className="gmpm-display font-bold text-3xl md:text-4xl max-w-2xl mb-8">
        Why choose Garnish?
      </h2>
      <div className="max-w-[900px] gmpm-corner border border-[var(--gmpm-line)]">
        <div className="grid grid-cols-[1fr_88px_88px] items-center gap-4 px-5 py-4">
          <span className="gmpm-mono text-xs uppercase text-[var(--gmpm-text-dim)]">Side-by-Side Overview</span>
          <span className="justify-self-center gmpm-mono text-xs uppercase text-[var(--gmpm-accent)]">
            Garnish {cityAbbr}
          </span>
          <span className="justify-self-center gmpm-mono text-xs uppercase text-[var(--gmpm-text-dim)]">Others</span>
        </div>
        {rows.map((label, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_88px_88px] items-center gap-4 px-5 py-3 border-t border-[var(--gmpm-line)]"
          >
            <span>{label}</span>
            <span className="justify-self-center text-[var(--gmpm-accent)] text-lg leading-none">&#10003;</span>
            <span className="justify-self-center text-[var(--gmpm-text-dim)] text-lg leading-none opacity-60">
              &#10005;
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
