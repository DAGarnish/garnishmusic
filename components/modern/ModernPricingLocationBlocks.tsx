export type PricingLocationBlock = {
  icon: "pricing" | "location";
  title: string;
  items: string[];
};

// Small, spare line icons matching the design system's own geometric mono
// aesthetic (ModernAccordionToggleIcon, ModernComparisonTable's check/cross)
// rather than an icon font or external asset - a dollar sign for pricing
// tiers, a map pin for where the tuition physically happens.
function DollarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
      <path d="M12 2v20M17 6.5c0-1.93-2.24-3.5-5-3.5s-5 1.57-5 3.5S9.24 10 12 10s5 1.57 5 3.5-2.24 3.5-5 3.5-5-1.57-5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
      <path
        d="M12 21.5s7-6.4 7-12A7 7 0 1 0 5 9.5c0 5.6 7 12 7 12Z"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.4" />
    </svg>
  );
}

// The "24-hour package $X plus $Y at a studio, $Z elsewhere" shape shows up
// on every real private-instruction page network-wide, but always as one
// undifferentiated wall of bullets - splitting "what it costs" from "what
// it costs extra depending on where you have it" into two visually
// distinct, icon-led cards (user request 2026-09-04, reference: a
// screenshot of a legacy site's own icon-with-text pair) makes the
// location-dependent add-on costs something a reader can spot at a glance
// instead of parsing prose. Renders one card if only one block has items
// (pdx/hou have no location tiers at all), two side by side otherwise.
export default function ModernPricingLocationBlocks({ blocks }: { blocks: PricingLocationBlock[] }) {
  const visible = blocks.filter((b) => b.items.length > 0);
  if (visible.length === 0) return null;

  return (
    <div className={`grid gap-6 ${visible.length > 1 ? "sm:grid-cols-2" : ""}`}>
      {visible.map((block, i) => (
        <div key={i} className="gmpm-corner border border-[var(--gmpm-line)] p-8">
          <div className="flex items-center gap-3 mb-5">
            <span className="shrink-0 w-9 h-9 rounded-full bg-[var(--gmpm-accent)] text-[var(--gmpm-accent-contrast)] flex items-center justify-center">
              {block.icon === "pricing" ? <DollarIcon /> : <LocationIcon />}
            </span>
            <h3 className="gmpm-display font-bold text-lg">{block.title}</h3>
          </div>
          <ul className="space-y-3">
            {block.items.map((item, j) => (
              <li key={j} className="flex items-start gap-2.5 text-sm text-[var(--gmpm-text)] leading-relaxed">
                <span className="text-[var(--gmpm-accent)] mt-0.5 shrink-0">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
