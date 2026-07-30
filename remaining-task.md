# Remaining Tasks — Pixel-Perfect Parity Audit

Context: goal is to make the migrated Next.js/Payload site match the original
WordPress multisite network (garnishmusicproduction.com and its ~18
subdomains) as closely as possible. This tracks what's left after the fixes
already completed (see conversation history / git log for what's done).

## 1. Media-mapping audit follow-up

- [ ] Review the ~194 "ambiguous" media mismatches from the audit
      (`/tmp/media-audit-report.json` minus the 120 high-confidence ones in
      `/tmp/media-audit-highconfidence.json`). These share a partial filename
      match with the real WordPress source and couldn't be auto-confirmed as
      wrong - need a visual/manual check per case.
- [ ] Fix the ~20 isolated wrong-image cases on the other 17 sites (only
      `www`'s ~99 confirmed cases were fixed so far). Same approach as
      `scripts/fix-www-media-bugs.ts`, scoped per-site.

## 2. Unaudited content types

- [ ] Blog posts (the `posts` collection) - not yet spot-checked against
      production at all.
- [ ] WooCommerce products (the `products` collection) - not yet spot-checked.
- [ ] Any other shortcode/module types not yet encountered. Every new content
      type checked so far (plain pages, instructor bios, homepage, course
      pages) revealed its own previously-unseen bug class - expect more here.

## 3. Responsive / mobile

- [ ] Nothing has been checked at mobile or tablet breakpoints yet - only
      desktop width was verified throughout this session.

## 4. Known small cosmetic gaps (spotted but not fixed)

- [ ] Missing list bullets on some in-content pages (e.g. seen on `/tc/`'s
      "Cancellation and Refund Policy" list - production renders `<ul><li>`
      with bullets, ours renders as plain lines).
- [ ] Per-site logo variants not rendering (e.g. production's BCN header shows
      a two-line "GARNISH / BARCELONA" logo, local shows plain "GARNISH").
- [ ] Header variant differences noticed early on (social icons vs
      cart/hamburger icons, active-nav-link color) - not yet root-caused.

## Reference

- Full media audit data: `/tmp/media-audit-report.json` (all 314 flagged),
  `/tmp/media-audit-highconfidence.json` (the 120 confirmed).
- Fix script pattern to reuse per-site: `scripts/fix-www-media-bugs.ts`.
- SEO backfill script (already run network-wide, no more action needed):
  `scripts/backfill-seo-meta.ts`.
- Per-site Additional CSS backfill (already run network-wide):
  `scripts/backfill-site-custom-css.ts`.
