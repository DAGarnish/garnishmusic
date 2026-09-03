// Per-site slugs for the modern design system's hand-built routes (see
// app/(frontend)/[[...slug]]/page.tsx). pdx and hou happen to share
// identical slugs for all of these (both migrated from the same theme
// template), but la/staging's real site uses entirely different ones
// (e.g. its Contact page is "music-production-school-los-angeles-contact",
// not "contact-map") - hardcoding pdx's slugs network-wide would 404 every
// one of these routes on staging. Keyed off site.slug, same convention as
// the existing COURSE_SCHEDULE_PAGES per-site override table.
export type ModernSiteRoutes = {
  contactSlug: string;
  // Null when the site's private-instruction page doesn't fit
  // ModernPrivateInstructionPage's shape (nested accordion + pricing list)
  // - la's real page turned out to use the identical [mkd_section_title]
  // shape as its course pages, so it's listed in programSlugs instead and
  // rendered through ModernCoursePage like any other course.
  privateInstructionSlug: string | null;
  instructorsSlug: string;
  // "Comprehensive/Production Programs" pages - in addition to whatever
  // /courses/* links collectNavCourseSlugs already finds in the nav.
  programSlugs: string[];
  // Instructor bio page slugs - both the curated set shown in full on the
  // Instructors listing page when the site has no real directory of its
  // own (pdx/hou), and the set of courses/{slug} pages that should route
  // through ModernInstructorBioPage instead of falling through to the
  // legacy theme (see each site's entry below for the specific reasoning).
  instructorSlugs: string[];
};

export const MODERN_SITE_ROUTES: Record<string, ModernSiteRoutes> = {
  pdx: {
    contactSlug: "contact-map",
    privateInstructionSlug: "private-instruction",
    instructorsSlug: "instructors",
    programSlugs: ["academy", "ableton-producer", "logic-producer"],
    // Dave Garnish is the founder; Loren Moore, Appu Krishnan and Zack
    // Johnson have the richest bios of the group, and Zack is the same
    // instructor already named on the Ableton Producer Program page's
    // Mellotron sample pack story.
    instructorSlugs: [
      "courses/dave-garnish",
      "courses/loren-moore",
      "courses/appu-krishnan",
      "courses/zack-johnson",
    ],
  },
  hou: {
    contactSlug: "contact-map",
    privateInstructionSlug: "private-instruction",
    instructorsSlug: "instructors",
    programSlugs: ["academy", "ableton-producer", "logic-producer"],
    instructorSlugs: [
      "courses/dave-garnish",
      "courses/loren-moore",
      "courses/appu-krishnan",
      "courses/zack-johnson",
    ],
  },
};

// la's real site route config.
const LA_ROUTES: ModernSiteRoutes = {
  // Was "music-production-school-los-angeles-contact" - that page is now at
  // "contact-map" (2026-09-03 request), with a 301 redirect left in place
  // from the old URL (see scripts/make-contact-map-la-contact-page.ts). The
  // dozens of internal links across la's own pages/nav that still hardcode
  // the old absolute URL are deliberately left as-is - the redirect covers
  // them; this comment isn't a TODO to rewrite them.
  contactSlug: "contact-map",
  privateInstructionSlug: null,
  instructorsSlug: "music-production-instructors-los-angeles",
  programSlugs: [
    "la-music-production-academy",
    "programs/ableton-production-program",
    "programs/logic-production-program",
    "songcraft-production-program",
    "dj-production-program",
    "music-production-private-instruction",
    "certificate-music-production-songwriting",
    "social-media-and-branding-for-artists",
    "garnish-la-artist-services",
  ],
  // Every instructor actually listed on la's own real instructors
  // directory (extractInstructorDirectory finds this page has real
  // content, so the curated-set fallback these slugs would otherwise
  // feed never runs - this list's job here is purely to gate which
  // courses/{slug} pages get the modern bio template, matching the
  // network's own current roster exactly. Deliberately not the broader
  // ~60-page courses/* roster network-wide - e.g. courses/maggie-szabo
  // exists but isn't linked from la's own directory anymore, so it's
  // left off rather than resurfacing a no-longer-featured instructor.
  instructorSlugs: [
    "courses/baddluck",
    "courses/shuba",
    "courses/laureli",
    "courses/cole-nystrom",
    "courses/th3ory",
    "courses/lvma-black",
    "courses/k-sotomayor",
    "courses/marianna-matyja",
    "courses/ethan-ziemba",
    "courses/matthew-engst",
    "courses/matt-bang",
    "courses/irving-victoria",
    "courses/will-kast",
    "courses/cameron-neilson",
    "courses/dj-jes-danz",
    "courses/chinsaku",
    "courses/marie-klausmeyer",
    "courses/joseph-immanuel",
    "courses/sandra-cucho",
    "courses/cameron-colley",
    "courses/cairo",
    "courses/nic-ten-grotenhuis",
    "courses/paola-gladys",
    "courses/dj-flossy",
    "courses/zhou",
    "courses/taylor-dubray",
    "courses/orion-navaille",
    "courses/igor-krasnienko",
    "courses/appu-krishnan",
  ],
};

MODERN_SITE_ROUTES.la = LA_ROUTES;

// mia's real site route config - site doc id 24 (originally cloned under
// slug "staging" for a preview-then-cutover, same shape la's own "staging"
// clone used) was promoted to the live "mia" slug once the preview was
// approved; the pre-cutover content moved to "mia-old" (see the site.slug
// "mia"/"mia-old" pairing in app/(frontend)/[[...slug]]/page.tsx, kept in
// sync for the legacy content both now carry) rather than being deleted, so
// this stays keyed "mia" rather than "staging" going forward. mia's raw
// content uses a different WPBakery authoring dialect than la's - plain <h2> section
// headings instead of [mkd_section_title], [mkd_button] instead of a raw
// <a class="btn-grand"> CTA, and [mkd_portfolio_list category="..."] widgets
// (resolved via lib/wp-portfolio-resolver.ts, not inline page text) for both
// its homepage course grid and its instructors directory - so only the
// pages confirmed to already fit the existing course-page shape
// ([mkd_section_title] + [mkd_accordion]) are listed here; mia's shop,
// affiliate, Apple-certification, blog, calendar, and a few not-yet-fitting
// program-shaped pages (the ba-* degree pathways, empty academy stub pages)
// are deliberately left off and fall through to the legacy theme. private-
// tuition was in that same left-off list originally (its content didn't fit
// extractPrivateInstructionContent's la-tuned shape at all), but that
// extractor now has a real mia fallback (see its own comment) so this page
// wires up properly.
const MIA_ROUTES: ModernSiteRoutes = {
  contactSlug: "contact-miami",
  privateInstructionSlug: "private-tuition",
  instructorsSlug: "instructors",
  programSlugs: [
    "academy/emp-electronic-music-producer",
    "programs/ableton-producer-program",
    "programs/logic-producer-program",
  ],
  // mia's real /instructors page's own [mkd_portfolio_list
  // category="instructors"] widget turned out to be dormant - no
  // "instructors" category exists anywhere in mia's data at all (confirmed:
  // only Dave Garnish's own courses/dave-garnish page has any
  // portfolioCategories tag, "founder" - every other instructor bio page
  // has none), so buildPortfolioListResolver always finds zero, same as it
  // would on mia's real live site today. This list is the actual, real
  // courses/{slug} instructor bio pages instead (confirmed against every
  // courses/* page on the site - these 27 are personal-name bio pages, the
  // ~30 other courses/* slugs are real course/event pages, not
  // instructors) - getInstructorDirectoryCached falls back to building
  // directory cards straight from these pages' own title/featuredImage
  // when both the parsed-markup and portfolio-category routes find
  // nothing, same as la's own instructorSlugs list gates which bio pages
  // get the modern template, just also the source of the roster itself
  // here since mia has no other way to enumerate it.
  instructorSlugs: [
    "courses/dave-garnish",
    "courses/nico-luminous",
    "courses/matthew-engst",
    "courses/dan-goodman",
    "courses/jamaal-taylor",
    "courses/loren-moore",
    "courses/appu-krishnan",
    "courses/cosmic-quest",
    "courses/zack-johnson",
    "courses/michael-hatsis",
    "courses/casey-k",
    "courses/darryl-swann",
    "courses/matthew-kratz-aka-kraddy",
    "courses/darren-burgos",
    "courses/daniel-rosenwald",
    "courses/vasco-ispirian",
    "courses/josh-brooks-pzb",
    "courses/joe-coloreo",
    "courses/michael-cupino",
    "courses/angelo-fajardo",
    "courses/kiva",
    "courses/dito-godwin",
    "courses/adam-moseley",
    "courses/robert-dante",
    "courses/joe-cruz",
    "courses/pete-griffin",
    "courses/mark-v-sheldon-a-k-a-havoc-razor",
  ],
};

MODERN_SITE_ROUTES.mia = MIA_ROUTES;

// "staging"'s real site route config - a preview of a redesigned edu
// homepage (see ModernEduHomePage), not a per-city clone like the previous
// three "staging" tenants (pdx/la/mia all promoted out of this same slug in
// turn - see MIA_ROUTES's own comment). edu is the network-wide hub, not a
// single school, so it has no real instructors/program pages of its own -
// contactSlug points at edu's own real "/connect/" page (confirmed live);
// the rest are harmless placeholders since this preview is homepage-only.
const STAGING_ROUTES: ModernSiteRoutes = {
  contactSlug: "connect",
  privateInstructionSlug: null,
  instructorsSlug: "instructors",
  // edu's own real "Comprehensive Programs" pages (see [[...slug]]
  // page.tsx's coursePageSiteId, which fetches these from edu - site 15 -
  // instead of staging's own id, since staging clones edu's nav only, not
  // its pages). Confirmed these 3 use the identical [mkd_section_title]
  // shape ModernCoursePage/modern-course-content.ts already handles for
  // pdx/hou's own academy/ableton-producer/logic-producer pages.
  programSlugs: ["academy", "programs/ableton-producer", "programs/logic-producer"],
  instructorSlugs: [],
};

MODERN_SITE_ROUTES.staging = STAGING_ROUTES;
