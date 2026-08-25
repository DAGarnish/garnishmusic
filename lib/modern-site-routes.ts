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
  // Curated instructor bio page slugs for the Instructors page - real
  // bios/photos, picked for strong, substantive content (see each site's
  // entry below for the specific reasoning).
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
  staging: {
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
    ],
    // la's own site doesn't carry Dave Garnish or Loren Moore's bio pages
    // (its nav links those two out to the edu site instead) - picked from
    // la's real instructor roster by richest bio content, requiring a real
    // photo (this design's grayscale headshot is a core visual element).
    // Appu Krishnan is the one overlap with pdx/hou's picks - also
    // independently linked from la's own nav, confirming he's a real,
    // active LA instructor and not just a network-wide placeholder.
    instructorSlugs: [
      "courses/appu-krishnan",
      "courses/cameron-neilson",
      "courses/irving-victoria",
      "courses/maggie-szabo",
    ],
  },
};
