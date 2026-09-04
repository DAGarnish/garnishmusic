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
// too in a later rollout. edu (its own homepage-redesign preview, previewed
// under "staging" before its own cutover - see ModernEduHomePage and
// scripts/promote-staging-to-edu.ts) is on it too, at the user's request
// (2026-09-03) - matches la/mia's cream + red/terracotta look, EDU's header
// mark using --gmpm-accent for its "." same as every other modern site.
// Shared here rather than left as a literal `site.slug === "pdx"` check in
// each consumer (layout.tsx's <body> class, ModernHomePage's lime-vs-red
// partner logo pick, ...) - that pattern is exactly how the partner logos
// stayed lime-green on staging after the theme rollout: the theme rolled
// out, but a second, separate "is this site cream-themed" check elsewhere
// didn't get updated along with it. ny's own from-scratch homepage rebuild
// (previewed under "staging" again - see ModernNYHomePage and
// MODERN_SITE_ROUTES' own NY_ROUTES comment) follows suit too.
export function isCreamThemeSite(slug: string): boolean {
  return slug === "pdx" || slug === "mia" || slug === "la" || slug === "edu" || slug === "staging";
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

// F1's real program (the accredited certificate) only exists on la - user
// request (2026-09-04) to put it in every redesigned site's own footer
// anyway, always pointing at la's real page rather than each site getting
// its own copy (same absolute-cross-site-link precedent as ModernHeader's
// own CROSS_SITE_ONLY_URLS for this exact page). Labeled the same way the
// nav already does network-wide ("F1 USA Visa Eligible (LA)") rather than
// la's own real page title ("Certificate in Music Production and
// Songwriting") - "F1" is the recognizable hook, not the formal name, and
// this exact label is already an established real label elsewhere in the
// network for this exact page.
const F1_LINK: FooterCourseLink = {
  label: "F1 USA Visa Eligible (LA)",
  href: "https://la.garnishmusicproduction.com/certificate-music-production-songwriting/",
};

// Footer's "Courses" column, network-wide: F1 (la's real accredited
// program, see F1_LINK above), 360 (this site's own real Academy program),
// DJ (this site's own real DJ course/product), and Private Instruction
// (this site's own real private-instruction page) - user request
// (2026-09-04), replacing the previous Ableton Live/Logic Pro/DJ Course/
// Producer Program set. Each label is that real page's own actual title
// (site-name suffix dropped, e.g. "| Portland" - redundant on that site's
// own footer), not a shorthand - confirmed against each site's own DB
// title field directly, not guessed.
const DEFAULT_FOOTER_COURSE_LINKS: FooterCourseLink[] = [
  { label: "360° Garnish Music Academy", href: "/academy" },
  { label: "Electronic Music DJ Course", href: "/courses/electronic-dj-course" },
  { label: "Music Production Private Instruction", href: "/private-instruction" },
  F1_LINK,
];

// la's real course/program slugs (and titles) differ from pdx/hou's (see
// LA_ROUTES in modern-site-routes.ts) - the shared ModernFooter's pdx-tuned
// course links above 404 on la. F1 stays first here, deliberately - la is
// F1's own real home site, unlike every other site's footer (user request
// 2026-09-04 to move F1 last everywhere else, but not la).
const LA_FOOTER_COURSE_LINKS: FooterCourseLink[] = [
  F1_LINK,
  { label: "360° Music Production Academy", href: "/la-music-production-academy" },
  { label: "DJ Course", href: "/courses/dj-course" },
  { label: "1-on-1 Private Instruction", href: "/music-production-private-instruction" },
];

// mia's real course/program slugs (and titles) also differ from pdx/hou's.
const MIA_FOOTER_COURSE_LINKS: FooterCourseLink[] = [
  { label: "Electronic Music Academy", href: "/academy/emp-electronic-music-producer" },
  { label: "Electronic Music DJ Class", href: "/courses/electronic-dj-course" },
  { label: "Music Production Private Instruction", href: "/private-tuition" },
  F1_LINK,
];

// edu's real slugs and titles (its own Academy/DJ/private-instruction
// pages, see MODERN_SITE_ROUTES.edu's own programSlugs/
// privateInstructionSlug).
const STAGING_FOOTER_COURSE_LINKS: FooterCourseLink[] = [
  { label: "360° Garnish Music Academy", href: "/academy" },
  { label: "Electronic Music DJ Course", href: "/electronic-dj-course" },
  { label: "Private Instruction, Tuition & Artist Development", href: "/private-instruction" },
  F1_LINK,
];

// ny's real slugs and titles, confirmed against its own live nav
// (2026-09-04) - DJ points at ny's real DJ Class product
// (product/electronic-dj-class, the one page in this whole rebuild with
// real working PayPal checkout - see NY_DJ_CLASS_PAYPAL_BUTTONS), not a
// courses/* page; its label matches that product's own real title (see
// modern-ny-classes-content.ts).
const NY_FOOTER_COURSE_LINKS: FooterCourseLink[] = [
  { label: "360° Garnish Music Academy", href: "/music-production-academy" },
  { label: "Electronic Music DJ Program", href: "/product/electronic-dj-class" },
  { label: "Music Production & DJ Private Instruction", href: "/private-instruction" },
  F1_LINK,
];

export function getFooterCourseLinks(slug: string | undefined | null): FooterCourseLink[] {
  if (slug === "la") return LA_FOOTER_COURSE_LINKS;
  if (slug === "mia") return MIA_FOOTER_COURSE_LINKS;
  if (slug === "edu") return STAGING_FOOTER_COURSE_LINKS;
  if (slug === "staging") return NY_FOOTER_COURSE_LINKS;
  return DEFAULT_FOOTER_COURSE_LINKS;
}
