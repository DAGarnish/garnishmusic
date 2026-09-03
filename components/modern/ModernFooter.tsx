import Link from "next/link";
import { getFooterCourseLinks, getContactHref } from "../../lib/modern-sites";

export default function ModernFooter({
  siteName,
  cityName,
  siteSlug,
}: {
  siteName: string;
  cityName: string;
  siteSlug?: string | null;
}) {
  const courseLinks = getFooterCourseLinks(siteSlug);
  const contactHref = getContactHref(siteSlug);
  return (
    <footer className="border-t border-[var(--gmpm-line)] bg-[var(--gmpm-bg)]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 grid gap-12 md:grid-cols-3">
        <div>
          <div className="gmpm-display text-lg font-bold mb-3">
            GARNISH<span className="gmpm-logo-dot">█</span>
          </div>
          <p className="text-sm text-[var(--gmpm-text-dim)] max-w-xs">
            {siteName}. World-class music production and DJ training, taught by working
            producers.
          </p>
        </div>

        <div>
          <div className="gmpm-mono text-[10px] uppercase text-[var(--gmpm-accent)] mb-3">Courses</div>
          <ul className="space-y-2 text-sm text-[var(--gmpm-text-dim)]">
            {courseLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-[var(--gmpm-text)]">{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="gmpm-mono text-[10px] uppercase text-[var(--gmpm-accent)] mb-3">Get in touch</div>
          <ul className="space-y-2 text-sm text-[var(--gmpm-text-dim)]">
            <li><Link href={contactHref} className="hover:text-[var(--gmpm-text)]">Contact</Link></li>
            <li><a href="https://garn.link/discord" target="_blank" className="hover:text-[var(--gmpm-text)]">Discord community</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--gmpm-line)]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-6 gmpm-mono text-[11px] text-[var(--gmpm-text-dim)]">
          © {new Date().getFullYear()} Garnish Music Production School — {cityName}
        </div>
      </div>
    </footer>
  );
}
