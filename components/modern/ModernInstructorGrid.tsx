import Link from "next/link";

export type InstructorGridItem = { name: string; href: string; imageUrl?: string };

// The real instructor photo grid behind a course page's own "Meet Our
// World-Class Instructors" section (see extractPortfolioSliderSpec) -
// rendered as a static wrapping grid rather than reproducing the legacy
// theme's own JS slider, which doesn't need to run for the photos to show.
export default function ModernInstructorGrid({ items }: { items: InstructorGridItem[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {items.map((item, i) => (
        <Link
          key={i}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group gmpm-corner border border-[var(--gmpm-line)] overflow-hidden block"
        >
          <div className="aspect-square overflow-hidden bg-[var(--gmpm-line)]">
            {item.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}
          </div>
          <div className="px-3 py-3 gmpm-mono text-xs uppercase text-[var(--gmpm-text)] group-hover:text-[var(--gmpm-accent)] transition-colors">
            {item.name}
          </div>
        </Link>
      ))}
    </div>
  );
}
