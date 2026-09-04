"use client";

import { useState } from "react";
import Link from "next/link";
import type { MenuNode } from "../menu-html";
import ModernAccordionToggleIcon from "./ModernAccordionToggleIcon";
import { getTalkToUsHref } from "../../lib/modern-sites";

// site.mainMenu is cloned verbatim from the legacy WP data, where a "Home"
// item points at "/locations" (the network-wide city picker, correct for
// the legacy multi-city theme's own header). This modern rebuild is a
// single site with its own real homepage, so "Home" should mean this site's
// own "/" instead - fixed here, once, rather than mutating the shared CMS
// menu data other (legacy-themed) sites still render correctly as-is.
//
// Some other nav items (e.g. "Art of Remix", under Programs > Express
// Courses) are absolute "https://la.garnishmusicproduction.com/..." links
// baked in at clone time, rather than the relative paths most items use -
// correct for the legacy theme (real content genuinely lives on that
// specific subdomain there), but wrong for this modern rebuild: staging
// (and any other modern site) has its own real copy of that same page, so
// the link should stay on the current site instead of bouncing to
// production. Any absolute URL on one of our own *.garnishmusicproduction.com
// domains is relativized to its own pathname for exactly this reason.
//
// "Live Online" is the one exception: it points at
// edu.garnishmusicproduction.com/online-music-production/, a genuinely
// distinct network-wide hub site with its own real content (not a per-city
// clone pdx/hou/staging each have their own copy of) - relativizing it
// turned a working cross-site link into a 404 on every modern site's own
// domain, since none of them actually have that page. edu.* is excluded
// from the match so it's left absolute and still bounces to production.
//
// "F1 USA Visa Eligible (LA)" (under Programs > Accredited) is a second,
// narrower exception, listed by exact URL rather than by domain: unlike
// "Art of Remix" above, this specific page (la's own accredited-certificate
// program) genuinely only exists on la - no other site has a local copy -
// so it's deliberately excluded from relativizeOwnDomain even though most
// other la.garnishmusicproduction.com links should still be relativized
// (see scripts/fix-f1-visa-nav-link.ts, which set this URL network-wide).
const CROSS_SITE_ONLY_URLS = new Set([
  "https://la.garnishmusicproduction.com/certificate-music-production-songwriting/",
]);
const OWN_DOMAIN = /^https?:\/\/(?!edu\.)([^/]*\.)?garnishmusicproduction\.com(?::\d+)?(\/[^?#]*)/i;
function relativizeOwnDomain(url: string): string {
  if (CROSS_SITE_ONLY_URLS.has(url)) return url;
  const m = url.match(OWN_DOMAIN);
  return m ? m[2] || "/" : url;
}
function fixHomeLink(nodes: MenuNode[]): MenuNode[] {
  return nodes.map((n) => ({
    ...n,
    url: n.label.trim().toLowerCase() === "home" ? "/" : relativizeOwnDomain(n.url),
    children: n.children.length > 0 ? fixHomeLink(n.children) : n.children,
  }));
}

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
        <div className="w-[min(90vw,640px)] max-h-[70vh] overflow-y-auto bg-[var(--gmpm-bg-raised)] border border-[var(--gmpm-line)] p-6 flex gap-x-8 shadow-2xl">
          {/* Two independent flex columns, not a 2-col CSS grid - a grid's
              row-major placement shares row height across both columns, so
              a short group (e.g. "USA F1 Visa Eligible", one item) sharing a
              row with a tall one (e.g. "Intermediate Classes", nine items)
              left a large dead gap under the short group's own content
              before the next row started. Flex columns size independently,
              closing that gap.
              Split sequentially (first half in col0, rest in col1), not by
              even/odd index - groups are stored in the exact top-to-bottom
              reading order MobileNavItem's own single-column accordion
              needs below, so the desktop columns have to read that same
              array left-to-right-then-down rather than interleaving it. */}
          {[0, 1].map((col) => {
            const children = item.children!;
            const splitAt = Math.ceil(children.length / 2);
            const colChildren = col === 0 ? children.slice(0, splitAt) : children.slice(splitAt);
            return (
              <div key={col} className="flex-1 space-y-5">
                {colChildren.map((sub, i) => (
                  <div key={i}>
                    {sub.children && sub.children.length > 0 ? (
                      <>
                        <div className="gmpm-mono text-[10px] uppercase text-[var(--gmpm-accent)] mb-2">
                          {sub.label}
                        </div>
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
                      </>
                    ) : (
                      <Link
                        href={sub.url}
                        target={sub.newTab ? "_blank" : undefined}
                        className="text-sm text-[var(--gmpm-text)] hover:text-[var(--gmpm-accent)] transition-colors"
                      >
                        {sub.label}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// A top-level item whose own children are ALL themselves named groups of
// real leaf links (not bare links) - "About" (2 groups: this site's own
// city/hub items, plus "Locations"/"Other Locations") and the "Programs"-
// style item ("Accredited", "Comprehensive Programs", "Beginner Classes",
// "Intermediate Classes", "DJ & More", ...) both share exactly this shape
// network-wide, under whatever top-level label each site happens to use
// ("Programs" on la, "Music Production & DJ Courses" on pdx/hou, "Music
// Production & DJ Programs" on staging, ...) - detected structurally
// instead of by exact label text for that reason. "Contact"/"Instructors"
// (bare links or leaf children with no sub-children of their own) never
// match, so they keep NavGroup's plain single-column list. Confirmed
// against every site's own real menu (scripts/check-nav-shapes.ts).
function isTabbedGroupShape(item: MenuNode): boolean {
  return item.children.length > 0 && item.children.every((c) => c.children && c.children.length > 0);
}

// Two (About) or several (Programs) small tabs on the left - the first one
// bulleted/highlighted like the legacy theme's own "you are here" marker,
// the rest plain below it - with whichever is hovered showing its own real
// items on the right. Matches the legacy theme's own "About" dropdown
// (screenshot, user request 2026-09-04), rolled out to any other dropdown
// sharing that same shape (see isTabbedGroupShape) - most directly
// "Programs", per a follow-up request the same day to copy this same
// interaction there too - rather than NavGroup's generic side-by-side-
// columns layout (which showed every group at once).
function TabbedNavGroup({ item }: { item: MenuNode }) {
  const groups = item.children;
  const [activeIndex, setActiveIndex] = useState(0);
  const active = groups[activeIndex];

  return (
    <div className="group relative" onMouseLeave={() => setActiveIndex(0)}>
      <button className="text-sm text-[var(--gmpm-text-dim)] hover:text-[var(--gmpm-accent)] transition-colors">
        {item.label}
      </button>
      <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity absolute left-0 top-full pt-3 z-50">
        <div className="w-[min(90vw,520px)] max-h-[70vh] overflow-y-auto bg-[var(--gmpm-bg-raised)] border border-[var(--gmpm-line)] p-6 flex gap-x-8 shadow-2xl">
          <div className="w-48 shrink-0 space-y-4">
            {groups.map((g, i) => (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex items-center gap-2 text-sm text-left w-full transition-colors ${
                  i === activeIndex ? "gmpm-mono text-[var(--gmpm-accent)]" : "text-[var(--gmpm-text-dim)] hover:text-[var(--gmpm-accent)]"
                }`}
              >
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                    i === activeIndex ? "bg-[var(--gmpm-accent)]" : "bg-transparent"
                  }`}
                  aria-hidden="true"
                />
                {g.label}
              </button>
            ))}
          </div>
          <ul className="flex-1 space-y-2.5">
            {active.children.map((leaf, i) => (
              <li key={i}>
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
        </div>
      </div>
    </div>
  );
}

// Mobile counterpart to NavGroup - a tap-to-expand accordion instead of
// hover, since there's no hover state on touch. Nested one level deeper
// than the desktop mega-menu's 2-column layout (which doesn't fit a phone
// width), everything stacks instead.
function MobileNavItem({ item, onNavigate }: { item: MenuNode; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  if (!hasChildren) {
    return (
      <Link
        href={item.url}
        target={item.newTab ? "_blank" : undefined}
        onClick={onNavigate}
        className="block py-4 text-base border-b border-[var(--gmpm-line)]"
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div className="border-b border-[var(--gmpm-line)]">
      <button
        className="w-full flex items-center justify-between py-4 text-base text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{item.label}</span>
        <ModernAccordionToggleIcon open={open} />
      </button>
      {open && (
        <div className="pb-4 space-y-5">
          {item.children!.map((sub, i) => (
            <div key={i}>
              {sub.children && sub.children.length > 0 ? (
                <>
                  <div className="gmpm-mono text-[10px] uppercase text-[var(--gmpm-accent)] mb-2">{sub.label}</div>
                  <ul className="space-y-2.5">
                    {sub.children.map((leaf, j) => (
                      <li key={j}>
                        <Link
                          href={leaf.url}
                          target={leaf.newTab ? "_blank" : undefined}
                          onClick={onNavigate}
                          className="text-sm text-[var(--gmpm-text-dim)]"
                        >
                          {leaf.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <Link
                  href={sub.url}
                  target={sub.newTab ? "_blank" : undefined}
                  onClick={onNavigate}
                  className="text-sm text-[var(--gmpm-text-dim)]"
                >
                  {sub.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ModernHeader({
  menu,
  cityAbbr,
  siteSlug,
}: {
  menu?: MenuNode[] | null;
  cityAbbr?: string;
  siteSlug?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const fixedMenu = menu ? fixHomeLink(menu) : menu;
  const talkToUsHref = getTalkToUsHref(siteSlug);

  return (
    <header className="sticky top-0 z-50 bg-[var(--gmpm-bg)]/95 backdrop-blur border-b border-[var(--gmpm-line)]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-20 flex items-center justify-between gap-8">
        <Link href="/" className="gmpm-display text-lg font-bold shrink-0" onClick={() => setMobileOpen(false)}>
          GARNISH<span className="gmpm-logo-dot">█</span>
          {cityAbbr && (
            <span className="gmpm-mono text-[10px] align-top text-[var(--gmpm-text-dim)] ml-1">{cityAbbr}</span>
          )}
        </Link>

        <nav className="gmpm-hidden-until-lg items-center gap-8">
          {(fixedMenu || []).map((item, i) =>
            isTabbedGroupShape(item) ? <TabbedNavGroup key={i} item={item} /> : <NavGroup key={i} item={item} />
          )}
        </nav>

        <div className="flex items-center gap-4 shrink-0">
          <Link
            href={talkToUsHref}
            target={talkToUsHref.startsWith("http") ? "_blank" : undefined}
            rel={talkToUsHref.startsWith("http") ? "noopener" : undefined}
            className="gmpm-hidden-until-sm gmpm-mono text-xs uppercase px-4 py-2 border border-[var(--gmpm-accent)] text-[var(--gmpm-accent)] hover:bg-[var(--gmpm-accent)] hover:text-[var(--gmpm-accent-contrast)] transition-colors"
          >
            Talk to us
          </Link>

          {/* Hamburger / close toggle, mobile & tablet only - the desktop
              hover mega-menu (nav, above) is hidden below lg with no other
              way to reach navigation, so this is the only entry point there. */}
          <button
            className="lg:hidden relative w-8 h-8 flex flex-col items-center justify-center gap-1.5"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            <span
              className={`block h-0.5 w-6 bg-[var(--gmpm-text)] transition-transform duration-200 ${mobileOpen ? "translate-y-2 rotate-45" : ""}`}
            />
            <span
              className={`block h-0.5 w-6 bg-[var(--gmpm-text)] transition-opacity duration-200 ${mobileOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-0.5 w-6 bg-[var(--gmpm-text)] transition-transform duration-200 ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Sits directly under the sticky header (itself part of the sticky
          element, so it stays reachable while scrolling) and scrolls
          internally once it's taller than the remaining viewport height -
          this mega-menu has dozens of nested course links. */}
      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 max-h-[calc(100vh-5rem)] overflow-y-auto bg-[var(--gmpm-bg)] border-t border-[var(--gmpm-line)] px-6 shadow-2xl">
          {(fixedMenu || []).map((item, i) => (
            <MobileNavItem key={i} item={item} onNavigate={() => setMobileOpen(false)} />
          ))}
          <Link
            href={talkToUsHref}
            target={talkToUsHref.startsWith("http") ? "_blank" : undefined}
            rel={talkToUsHref.startsWith("http") ? "noopener" : undefined}
            onClick={() => setMobileOpen(false)}
            className="block sm:hidden my-6 text-center gmpm-mono text-xs uppercase px-4 py-3 border border-[var(--gmpm-accent)] text-[var(--gmpm-accent)]"
          >
            Talk to us
          </Link>
        </div>
      )}
    </header>
  );
}
