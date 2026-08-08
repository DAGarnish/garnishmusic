# Garnish Music Production School — Headless Site Overview

_Generated 2026-08-06_

## What this project is

**garnishmusic-headless** is a headless Payload CMS + Next.js multi-tenant site
network for "Garnish Music Production School," migrated from a WordPress
multisite install (WooCommerce + WPBakery + Revolution Slider). It is not a
single site — it is **21 sites sharing one database, one codebase, and one
Next.js frontend**, each served on its own subdomain.

## Content totals (from the local `garnishmusic.db` snapshot)

| Collection | Count |
|---|---|
| Pages | **2,246** |
| Posts (blog) | **805** |
| Products | 402 |
| Media | 3,871 |
| Testimonials | 1,863 |
| Tags | 2,010 |
| Categories | 476 |
| Redirects | 346 |
| Hero sliders | 50 |
| Sites | 21 |
| Customers / Orders / Form submissions | 0 (not yet migrated) |
| Users | 1 |

### Pages & posts per site (top few)

| Site | Pages | Posts |
|---|---|---|
| Nashville (nsh) | 170 | 39 |
| Singapore (sg) | 164 | 39 |
| Main site (www) | 154 | **276** |
| New York (ny) | 146 | 42 |
| LA (la) | 141 | 33 |
| Worldwide (edu) | 141 | 32 |
| AV, reportotosite, santé | 5–9 | 0–1 |

The main `www` site carries the bulk of blog content (276 of the 805 posts);
the regional subdomains mostly have pages (course/program pages) with a thin
trickle of posts.

## How the database relations work (Payload)

Everything runs on **Postgres** (via `@payloadcms/db-postgres`), with a
parallel SQLite copy (`garnishmusic.db`, via libSQL) used as the migration
source / dev snapshot. Two nearly-identical configs exist:
`payload.config.ts` (runtime, includes the `Partners` global + S3 media
storage) and `payload.config.postgres.ts` (migration-time twin, kept
manually in sync, used by `scripts/migrate-to-neon.ts` to run a
SQLite-source and Postgres-destination instance side by side).

### Core pattern: multi-tenancy via a `site` relationship

Every content collection carries a `relationship` field to `sites`:

```
sites (tenant root)
 ├─ pages            (site → required)
 ├─ posts            (site → required)
 ├─ products         (site → required)
 ├─ categories       (site → required)
 ├─ tags             (site → required)
 ├─ testimonials     (site → required)
 ├─ hero-sliders     (site → required)
 ├─ redirects        (site → required)
 ├─ customers        (site → optional)
 ├─ orders           (site → required)
 ├─ form-submissions (site → required)
 └─ media            (site → optional, provenance only)
```

### Other relations layered on top

- **posts** → `categories` (hasMany) and `tags` (hasMany) — WordPress
  taxonomy shape, but scoped per-site (each site has its own category/tag
  rows, not shared global taxonomies).
- **pages** → `portfolioCategories` (relationship to `categories`, hasMany)
  — drives course/instructor grid listings.
- **orders** → `customer` (relationship) and `lineItems[].product`
  (relationship to `products`) — WooCommerce-style order structure.
- **pages / posts / products / testimonials / hero-sliders** → `media` via
  `upload` fields (featured images, title-background images, gallery
  arrays).
- **sites** itself holds per-tenant config: `domain` (unique), `slug`
  (unique), `mainMenu` (JSON nav tree), `homepageWpId` (which Page is the
  homepage), `defaultTitleBackgroundImage`, custom CSS, footer copy — i.e.
  the site row is effectively a tenant config object, not just a label.
- **users** → `sites` (hasMany) — scopes which sites an admin/editor can
  manage.
- **Partners** is a Payload **global** (not per-site) — one shared logo
  strip reused across all 21 sites instead of 38 duplicated WordPress
  copies.

Almost every collection also carries `wp*` fields (`wpPostId`, `wpTermId`,
`wpUserId`, `wpAttachmentId`, `wpProductId`, `wpOrderId`, `wpBlogId`, …) —
these are migration-traceability breadcrumbs back to the original
WordPress multisite IDs, not part of the live relational model.

## How the frontend resolves tenants and routes

- `lib/current-site.ts` reads the `Host` request header, maps it to a
  production domain (with local-dev `*.localhost` mirroring), and looks up
  the matching `sites` row — that becomes "the current tenant" for the
  request.
- A single catch-all route, `app/(frontend)/[[...slug]]/page.tsx`, handles
  **every** page, post, and product URL for **every** site: given the
  resolved site + slug, it queries `pages` first, falls back to `posts`,
  then `products`, scoped by `site.equals(siteId)` — so the same route
  tree serves 21 different sites' worth of content, with slugs unique
  only within a site.
- The homepage is resolved via `sites.homepageWpId` matching a page's
  `wpPostId` (preserving WordPress's `page_on_front` setting per blog),
  falling back to a page slugged `home`.
