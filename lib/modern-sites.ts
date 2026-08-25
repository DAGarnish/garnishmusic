// Sites rendered through the modern (non-legacy) design system - see
// components/modern/. pdx was the pilot; hou is the first network-wide
// rollout target. Adding a site here alone isn't enough on its own - see
// this set's two call sites (app/(frontend)/layout.tsx for the stripped-
// down <html>/<body> shell, and the [[...slug]] catch-all route for the
// per-page component routing) - but every other pdx-only assumption in the
// modern-* components/libs is already keyed off real per-site data (site
// name/slug/mainMenu/content), not this list, so no other file needs a
// matching edit when a new site is added here.
export const MODERN_SITE_SLUGS = new Set(["pdx", "hou"]);
