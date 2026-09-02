import { MODERN_SITE_ROUTES } from "./modern-site-routes";

// Sites rendered through the modern (non-legacy) design system - see
// components/modern/. pdx was the pilot; hou, la, and mia (each promoted
// from its own "staging"-slugged preview clone once approved) are the
// network-wide rollout so far. Derived from MODERN_SITE_ROUTES's keys rather
// than a separate hardcoded list, so a site can't end up gated into the
// modern <html>/<body> shell (layout.tsx) and page routing (the [[...slug]]
// catch-all) without also having the per-site route slugs (contact/
// instructors/private-instruction/programs) those routes need - see
// modern-site-routes.ts for why those differ per site.
export const MODERN_SITE_SLUGS = new Set(Object.keys(MODERN_SITE_ROUTES));

// Sites on the warm cream + terracotta look (.gmpm-theme-cream in
// modern-globals.css) rather than the network-wide dark/lime default - pdx
// originated it, la and mia (site id 24, promoted from its own "staging"
// preview clone slug once approved - see modern-site-routes.ts) both got it
// too in a later rollout. Shared here rather than left as a literal
// `site.slug === "pdx"` check in each consumer (layout.tsx's <body> class,
// ModernHomePage's lime-vs-red partner logo pick, ...) - that pattern is
// exactly how the partner logos stayed lime-green on staging after the
// theme rollout: the theme rolled out, but a second, separate "is this site
// cream-themed" check elsewhere didn't get updated along with it.
export function isCreamThemeSite(slug: string): boolean {
  return slug === "pdx" || slug === "mia" || slug === "la";
}

// The course-schedule/pricing-disclosure widget and Add-to-Cart suppression
// (see page.tsx) both need to apply everywhere mia's own course/product
// pages can still render through the legacy styledHtml path (any courses/*
// page id 24 doesn't already cover via MODERN_SITE_ROUTES' programSlugs/
// instructorSlugs), not just id 24's own live "mia" slug: id 17, the
// pre-cutover site the live "mia" slug pointed at until it was demoted to
// "mia-old" for rollback, carries byte-identical legacy content and needs
// the exact same treatment while parked there.
export function isLegacyMiaContentSite(slug: string | undefined | null): boolean {
  return slug === "mia" || slug === "mia-old";
}
