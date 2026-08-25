import { MODERN_SITE_ROUTES } from "./modern-site-routes";

// Sites rendered through the modern (non-legacy) design system - see
// components/modern/. pdx was the pilot; hou and staging (an la content
// clone) are the network-wide rollout targets so far. Derived from
// MODERN_SITE_ROUTES's keys rather than a separate hardcoded list, so a
// site can't end up gated into the modern <html>/<body> shell (layout.tsx)
// and page routing (the [[...slug]] catch-all) without also having the
// per-site route slugs (contact/instructors/private-instruction/programs)
// those routes need - see modern-site-routes.ts for why those differ
// per site.
export const MODERN_SITE_SLUGS = new Set(Object.keys(MODERN_SITE_ROUTES));
