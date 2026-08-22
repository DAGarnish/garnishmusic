type MenuItem = {
  url?: string;
  label?: string;
  children?: MenuItem[] | null;
};

function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

// Every site in the network shares the same nav shape (confirmed against
// all 20 sites' mainMenu): a top-level "About" branch (city info + the
// cross-site "Locations" switcher - never actual course pages) and a
// top-level courses branch whose label always contains "Course" or
// "Program" ("Programs" on la, "Music Production Courses" on sf/tyo/bcn/...,
// "Music Production Programs" on nsh/mia/sg, "Music Production & DJ
// Programs" on ny, etc.) containing nested category groups ("Comprehensive
// Programs", "Express Classes", "DJ & More"...) whose leaves are the real
// course/program landing pages. Walking that one branch - rather than
// hardcoding a per-site path list or sniffing page content for a heading
// that turned out not to be present on every site's course pages (e.g. sf's
// /ableton-producer-program/ has no "Meet Our Instructors" section at all)
// - is the one signal that's both accurate and automatically stays in sync
// as courses are added, renamed, or removed from a site's own nav.
function collectCoursePagePaths(mainMenu: MenuItem[] | null | undefined, siteDomain: string): Set<string> {
  const paths = new Set<string>();
  const walk = (items: MenuItem[] | null | undefined) => {
    for (const item of items ?? []) {
      if (item.url && item.url !== "#") {
        try {
          const parsed = new URL(item.url, `https://${siteDomain}`);
          // Only count links that resolve to this same site - a course
          // menu can legitimately point at another site (e.g. every
          // network site's "Accredited" group links to la's own F1 visa
          // program page), which should count as a course page on LA, not
          // wherever the link happens to be clicked from.
          if (parsed.hostname === siteDomain) {
            paths.add(normalizePathname(parsed.pathname));
          }
        } catch {
          // Malformed href - ignore rather than crash the render.
        }
      }
      if (item.children && item.children.length) walk(item.children);
    }
  };
  for (const top of mainMenu ?? []) {
    if (top.label && /course|program/i.test(top.label)) {
      walk(top.children);
    }
  }
  return paths;
}

// slugPath: the current request's path with no leading/trailing slash (e.g.
// "programs/ableton-production-program"), matching how page.tsx already
// derives it via slug.join("/").
export function isCoursePagePath(
  mainMenu: MenuItem[] | null | undefined,
  siteDomain: string,
  slugPath: string
): boolean {
  const paths = collectCoursePagePaths(mainMenu, siteDomain);
  return paths.has(normalizePathname(`/${slugPath}`));
}
