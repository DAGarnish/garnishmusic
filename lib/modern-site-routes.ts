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

// la's real site route config. Was keyed directly under "staging" here -
// staging.garnishmusicproduction.com was an la content clone used to
// preview this modern rebuild before la's own domain got pointed at it.
// Needs to stay reachable under BOTH the "la" and "staging" slugs for one
// deploy: the CMS site doc now live at la.garnishmusicproduction.com still
// has slug "staging" until that gets renamed to "la" too, and this code has
// to already recognize "la" *before* that DB rename happens, or the live
// site would drop back to the legacy theme for the gap between deploying
// this and renaming the DB row. Drop the "staging" key (and this comment)
// once that rename is confirmed done and nothing depends on it any more.
const LA_ROUTES: ModernSiteRoutes = {
  contactSlug: "music-production-school-los-angeles-contact",
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
MODERN_SITE_ROUTES.staging = LA_ROUTES;
