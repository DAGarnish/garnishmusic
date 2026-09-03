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

// The site's own real contact page, per MODERN_SITE_ROUTES.contactSlug -
// the single source of truth every "Contact"/"Talk to us" link should defer
// to instead of each hardcoding "/contact-map" (only actually correct for
// pdx/hou; mia's real page is "/contact-miami" - confirmed 404 audit,
// 2026-09-03).
export function getContactHref(slug: string | undefined | null): string {
  const contactSlug = slug ? MODERN_SITE_ROUTES[slug]?.contactSlug : undefined;
  return `/${contactSlug ?? "contact-map"}`;
}

// ModernHeader's persistent "Talk to us" button used to default to a
// hardcoded "/contact-map", correct for pdx/hou but not mia (whose real
// contactSlug is "contact-miami") - now resolved per-site via
// getContactHref instead. la's real contact page is at "/contact-map" too
// (moved there 2026-09-03 from music-production-school-los-angeles-contact
// - see scripts/make-contact-map-la-contact-page.ts), but this override
// predates that move: the explicit request at the time was to point la's
// header CTA at edu's own central /connect/ page instead of la's own
// contact page, and that choice hasn't been revisited - scoped to la only.
export function getTalkToUsHref(slug: string | undefined | null): string {
  if (slug === "la") return "https://edu.garnishmusicproduction.com/connect/";
  return getContactHref(slug);
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

// mia's real course/program slugs also differ from pdx/hou's - confirmed by
// audit (2026-09-03) that 3 of the 4 default links 404 on mia (DJ Course
// happens to already match). Producer Program has two real mia candidates
// (ableton-producer-program and logic-producer-program); Ableton confirmed
// by request rather than assumed to mirror la's Logic choice.
const MIA_FOOTER_COURSE_LINKS: FooterCourseLink[] = [
  { label: "Ableton Live", href: "/courses/ableton-live-course" },
  { label: "Logic Pro", href: "/courses/logic-course" },
  { label: "DJ Course", href: "/courses/electronic-dj-course" },
  { label: "Producer Program", href: "/programs/ableton-producer-program" },
];

export function getFooterCourseLinks(slug: string | undefined | null): FooterCourseLink[] {
  if (slug === "la") return LA_FOOTER_COURSE_LINKS;
  if (slug === "mia") return MIA_FOOTER_COURSE_LINKS;
  return DEFAULT_FOOTER_COURSE_LINKS;
}
