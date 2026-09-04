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

// edu's real site route config - a redesigned edu homepage (see
// ModernEduHomePage), not a per-city clone like the previous three
// "staging" tenants (pdx/la/mia all promoted out of that same slug in turn
// - see MIA_ROUTES's own comment). This one was built and previewed under
// the "staging" slug too (site id 28) before being promoted to the live
// "edu" slug/domain, archiving the pre-cutover real edu content at "edu-2"
// (site id 15) rather than deleting it - same rollback pattern as
// mia-old/la-old (see scripts/promote-staging-to-edu.ts). edu is the
// network-wide hub, not a single school, so it has no real instructors page
// of its own (still a placeholder) - but its own real Comprehensive
// Programs/Express Classes/Others pages are wired up below (see
// [[...slug]] page.tsx's own coursePageSiteId/privateInstructionSiteId,
// which fetch these from "edu-2" instead of edu's own id, since edu itself
// only ever cloned the old edu's nav, not its ~100 pages). contactSlug
// points at edu-2's own real "/connect/" page (confirmed live).
const STAGING_ROUTES: ModernSiteRoutes = {
  contactSlug: "connect",
  // edu's real page (id 1395) uses the older bare-<h2>/[vc_column_text]
  // shape extractPrivateInstructionContent was built for - same shape
  // pdx/hou's own private-instruction page uses (see their own entries
  // above).
  privateInstructionSlug: "private-instruction",
  instructorsSlug: "instructors",
  // academy/programs/ableton-producer/programs/logic-producer are
  // Comprehensive Programs; electronic-dj-course and reality-dj-class are
  // two of the "Others" nav section's five items (private-instruction
  // above and the courses/* ones - Post Production, K-pop Songwriting -
  // are covered by collectNavCourseSlugs auto-picking up any "courses/*"
  // nav link, same as every Express Classes item). All 3 confirmed to use
  // the identical [mkd_section_title] shape ModernCoursePage/
  // modern-course-content.ts already handles for pdx/hou's own academy/
  // ableton-producer/logic-producer pages.
  programSlugs: [
    "academy",
    "programs/ableton-producer",
    "programs/logic-producer",
    "electronic-dj-course",
    "reality-dj-class",
  ],
  instructorSlugs: [],
};

MODERN_SITE_ROUTES.edu = STAGING_ROUTES;

// ny's real site route config - a from-scratch modern rebuild of its real
// homepage (see ModernNYHomePage), previewed under the "staging" slug
// (site id 29) the same way pdx/hou/la/mia/edu each cycled through it in
// turn before their own promotions (see MIA_ROUTES/STAGING_ROUTES' own
// comments above), and promoted to the live "ny" slug in turn (2026-09-04,
// archiving the real previous "ny" site as "ny-2"). Unlike edu's own
// staging build, this one deliberately does NOT clone or reference any of
// ny-2's real WPBakery-authored page content - every real value (copy,
// images, testimonials, course cards, programs, classes, instructor bios,
// payments, contact) was hand-transcribed once into ModernNYHomePage and
// the various lib/modern-ny-*.ts files instead, per explicit request
// (2026-09-04) to leave all of that legacy markup behind. programSlugs/
// instructorSlugs stay empty since those pages are matched directly by
// exact slug against NY_PROGRAMS/NY_CLASSES/NY_INSTRUCTOR_BIOS in
// page.tsx instead of going through the generic modernTemplatedSlugs path
// those two arrays feed - not a gap, just a different lookup mechanism.
const NY_ROUTES: ModernSiteRoutes = {
  contactSlug: "contact-map",
  privateInstructionSlug: "private-instruction",
  instructorsSlug: "instructors",
  programSlugs: [],
  instructorSlugs: [],
};

MODERN_SITE_ROUTES.ny = NY_ROUTES;

// sf's real site route config - previewed under the "staging" slug (site
// id freed up by ny's own promotion above), same cycle every previous
// tenant of that slug went through. Unlike ny's own rebuild, sf's real
// wpRawContent fits the network's existing generic extractors well (its
// homepage uses the same real [mkd_elements_holder] offering-card shape
// la's own homepage does - see ModernHomePage's own extractHomepageOfferings
// comment), so this one goes back to the "extract real content, leave the
// shortcodes behind" default every site except ny/edu uses, rather than
// hand-transcribing fresh data files.
const SF_ROUTES: ModernSiteRoutes = {
  contactSlug: "contact-map",
  // sf's real page lives at "courses/private-instruction" (nested, unlike
  // pdx/hou/mia's flat "private-instruction") - confirmed via its own real
  // nav link under "DJ & More".
  privateInstructionSlug: "courses/private-instruction",
  instructorsSlug: "instructors",
  // sf's real "Comprehensive Programs" pages - none of these use a
  // "courses/*" path, so collectNavCourseSlugs (which only auto-picks up
  // /courses/* nav links) doesn't find them on its own. "ableton-music-
  // producer-program" (no "| San Francisco" title suffix, not linked from
  // sf's own real nav) is an older orphaned duplicate of
  // "ableton-producer-program" - confirmed by content diff - deliberately
  // left off here so it doesn't get a second, redundant modern page.
  programSlugs: ["emp-electronic-music-producer", "ableton-producer-program", "logic-producer-program"],
  // sf's own real 17-person roster (site id 5, slug prefix
  // "instructor-portfolio/", not "courses/" like every other site so far) -
  // confirmed against every real instructor-portfolio/* page (portfolioCategories
  // exists on each). "instructor-portfolio/ibiza-dj-bootcamp" and
  // "instructor-portfolio/songwriting" are real pages under this same path
  // prefix but aren't people - left off this list, same principle as la's
  // own comment about not resurfacing no-longer-featured pages.
  instructorSlugs: [
    "instructor-portfolio/alex-scammon-is-the-co-founder-of-soul-graffiti-productions",
    "instructor-portfolio/ben-wiley-logic-pro",
    "instructor-portfolio/cello-joe",
    "instructor-portfolio/danny-x",
    "instructor-portfolio/dave-garnish",
    "instructor-portfolio/isaac-cotec",
    "instructor-portfolio/justin-ancheta",
    "instructor-portfolio/kevin-njikam",
    "instructor-portfolio/kristian-sharpe",
    "instructor-portfolio/kyle-boydstun-logicpro-teacher",
    "instructor-portfolio/lorenzo-gordon-low-lite",
    "instructor-portfolio/mike-cochran",
    "instructor-portfolio/moldover",
    "instructor-portfolio/nathan-bauld-engineer",
    "instructor-portfolio/oz-fritz",
    "instructor-portfolio/roan-gibson-protools-logic",
    "instructor-portfolio/sam-ward",
    "instructor-portfolio/will-magid",
  ],
};

MODERN_SITE_ROUTES.staging = SF_ROUTES;
