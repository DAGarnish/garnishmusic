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

// ModernHeader's persistent "Talk to us" button defaults to "/contact-map",
// correct for pdx/hou (that really is their own contactSlug - see
// modern-site-routes.ts) but not for any other modern site. la's real
// contact page is now at "/contact-map" too (moved there 2026-09-03 from
// music-production-school-los-angeles-contact - see
// scripts/make-contact-map-la-contact-page.ts), but this override predates
// that move: the explicit request at the time was to point la's header CTA
// at edu's own central /connect/ page instead of la's own contact page, and
// that choice hasn't been revisited - scoped to la only, so mia (which
// currently has this exact same "/contact-map" 404 bug on its header) is
// left as-is rather than silently changed along with it.
export function getTalkToUsHref(slug: string | undefined | null): string {
  if (slug === "la") return "https://edu.garnishmusicproduction.com/connect/";
  return "/contact-map";
}

export type FooterCourseLink = { label: string; href: string };

const DEFAULT_FOOTER_COURSE_LINKS: FooterCourseLink[] = [
  { label: "Ableton Live", href: "/courses/ableton-live" },
  { label: "Logic Pro", href: "/courses/logic-pro" },
  { label: "DJ Course", href: "/courses/electronic-dj-course" },
  { label: "Producer Program", href: "/ableton-producer" },
];

// la's real course/program slugs differ from pdx/hou's (see LA_ROUTES in
// modern-site-routes.ts) - the shared ModernFooter's pdx-tuned course links
// above 404 on la. Real destinations confirmed by request (2026-09-03).
const LA_FOOTER_COURSE_LINKS: FooterCourseLink[] = [
  { label: "Ableton Live", href: "/courses/ableton-live-course" },
  { label: "Logic Pro", href: "/courses/logic-pro-course" },
  { label: "DJ Course", href: "/courses/dj-course" },
  { label: "Producer Program", href: "/programs/logic-production-program" },
];

export function getFooterCourseLinks(slug: string | undefined | null): FooterCourseLink[] {
  if (slug === "la") return LA_FOOTER_COURSE_LINKS;
  return DEFAULT_FOOTER_COURSE_LINKS;
}
