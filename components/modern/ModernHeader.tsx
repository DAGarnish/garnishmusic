import Link from "next/link";
import type { MenuNode } from "../menu-html";

function NavGroup({ item }: { item: MenuNode }) {
  const hasChildren = item.children && item.children.length > 0;

  if (!hasChildren) {
    return (
      <Link
        href={item.url}
        target={item.newTab ? "_blank" : undefined}
        className="gpmm-nav-link text-sm text-[var(--gmpm-text-dim)] hover:text-[var(--gmpm-accent)] transition-colors"
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div className="group relative">
      <button className="text-sm text-[var(--gmpm-text-dim)] hover:text-[var(--gmpm-accent)] transition-colors">
        {item.label}
      </button>
      <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity absolute left-0 top-full pt-3 z-50">
        <div className="w-[min(90vw,640px)] max-h-[70vh] overflow-y-auto bg-[var(--gmpm-bg-raised)] border border-[var(--gmpm-line)] p-6 grid grid-cols-2 gap-x-8 gap-y-5 shadow-2xl">
          {item.children!.map((sub, i) => (
            <div key={i}>
              <div className="gmpm-mono text-[10px] uppercase text-[var(--gmpm-accent)] mb-2">
                {sub.label}
              </div>
              {sub.children && sub.children.length > 0 ? (
                <ul className="space-y-1.5">
                  {sub.children.map((leaf, j) => (
                    <li key={j}>
                      <Link
                        href={leaf.url}
                        target={leaf.newTab ? "_blank" : undefined}
                        className="text-sm text-[var(--gmpm-text)] hover:text-[var(--gmpm-accent)] transition-colors"
                      >
                        {leaf.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <Link
                  href={sub.url}
                  target={sub.newTab ? "_blank" : undefined}
                  className="text-sm text-[var(--gmpm-text)] hover:text-[var(--gmpm-accent)] transition-colors"
                >
                  View
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ModernHeader({
  menu,
}: {
  menu?: MenuNode[] | null;
}) {
  return (
    <header className="sticky top-0 z-50 bg-[var(--gmpm-bg)]/95 backdrop-blur border-b border-[var(--gmpm-line)]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-20 flex items-center justify-between gap-8">
        <Link href="/" className="gmpm-display text-lg font-bold shrink-0">
          GARNISH<span className="text-[var(--gmpm-accent)]">.</span>
          <span className="gmpm-mono text-[10px] align-top text-[var(--gmpm-text-dim)] ml-1">PDX</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {(menu || []).map((item, i) => (
            <NavGroup key={i} item={item} />
          ))}
        </nav>

        <Link
          href="/contact-map"
          className="shrink-0 gmpm-mono text-xs uppercase px-4 py-2 border border-[var(--gmpm-accent)] text-[var(--gmpm-accent)] hover:bg-[var(--gmpm-accent)] hover:text-black transition-colors"
        >
          Talk to us
        </Link>
      </div>
    </header>
  );
}
