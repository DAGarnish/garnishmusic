import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { menuTreeToHtml, menuTreeToMobileHtml, type ActiveMatch, type MenuNode } from "./menu-html";
import { getUrlRewriteContext, rewriteHtmlLinksForLocalDev } from "../lib/current-site";

const dirname = path.dirname(fileURLToPath(import.meta.url));
// Read fresh on every render (not cached at module scope) - these theme
// shell files aren't part of webpack's module graph, so Next.js dev's
// file watcher doesn't reload this module when only they change, and a
// stale module-scope read would keep serving pre-edit HTML all session.
function readThemeHtml(name: string): string {
  return fs.readFileSync(path.join(dirname, "theme-html", name), "utf-8");
}



export default async function Header({
  menu,
  currentPath,
  siteDomain,
}: {
  menu?: MenuNode[] | null;
  currentPath?: string;
  siteDomain?: string;
}) {
  const beforeNav = readThemeHtml("header-before-nav.html");
  const afterNav = readThemeHtml("header-after-nav.html");

  const ctx = await getUrlRewriteContext();
  const active: ActiveMatch | undefined =
    currentPath !== undefined && siteDomain ? { path: currentPath, domain: siteDomain } : undefined;
  
  // Hide cart and logo on all sites; remove gap between partners and footer
  let finalAfterNav = afterNav;
  finalAfterNav +=
    "<style>.mkd-shopping-cart-outer { display: none !important; } .mkd-logo-wrapper { display: none !important; } .heading-some-of-our-partners { margin-bottom: 0 !important; } footer { margin-top: 0 !important; }" +
    // The mobile hamburger bar doesn't actually stay put while scrolling.
    // The theme's own CSS (buro-modules.css) already marks
    // .mkd-mobile-header-inner as position:fixed, but only reveals it via
    // a translateY(-100%) -> translateY(0) transform toggled by legacy
    // jQuery scroll-direction JS (buro-modules.min.js's "sticky up" mobile
    // header behavior, driven by the mkd-sticky-up-mobile-header body
    // class) - that JS doesn't reliably initialize against this app's
    // React-rendered DOM, so the header just sits translated off-screen.
    // A plain `position: sticky` on the outer .mkd-mobile-header (the
    // previous attempt here) doesn't work either: buro-modules.css sets
    // `body { overflow-x: hidden !important }` (needed to stop the many
    // absolutely/wide-positioned legacy elements from causing horizontal
    // scroll), and per the CSS spec, setting only overflow-x on an element
    // forces its computed overflow-y to "auto" too - which makes body a
    // scroll container in its own right and breaks position:sticky's
    // scroll-anchor detection. `position: fixed` on the inner bar sidesteps
    // both problems (unaffected by ancestor overflow, no JS dependency) and
    // is the standard approach for an always-visible mobile nav bar - the
    // matching padding-top on the outer header reserves the same 100px the
    // inner bar's own CSS already gives it, so fixing it out of flow
    // doesn't cover the content that follows.
    // .mkd-mobile-nav (the slide-down menu the hamburger opens) has no
    // positioning rule of its own in buro-modules.css - it's plain
    // position:static, a normal-flow sibling of .mkd-mobile-header-inner
    // sitting right after the page's own masthead near the very top of the
    // document. That was fine when the header wasn't sticky (the page was
    // always scrolled to top when it opened), but now that the header is
    // pinned via position:fixed above, opening the menu while scrolled down
    // still toggles it open correctly - it just renders far above the
    // current scroll position, off-screen, which looks like the hamburger
    // "doesn't work". Anchoring it as fixed too, directly under the 100px
    // header bar, keeps it under the tap target regardless of scroll.
    "@media only screen and (max-width: 1024px) { .mkd-mobile-header { padding-top: 100px !important; } .mkd-mobile-header-inner { position: fixed !important; transform: none !important; top: 0 !important; left: 0 !important; right: 0 !important; width: 100% !important; z-index: 1000 !important; } .mkd-mobile-nav { position: fixed !important; top: 100px !important; left: 0 !important; right: 0 !important; z-index: 999 !important; max-height: calc(100vh - 100px) !important; overflow-y: auto !important; } }</style>";

  // header-after-nav.html's .mkd-mobile-header shell has a placeholder
  // comment where the mobile nav list goes - see menuTreeToMobileHtml for
  // why it can't just reuse menuTreeToHtml's output (buro-modules.min.js's
  // mobile menu JS expects a different, flatter markup shape: <h4> for
  // expandable branches instead of an <a><ul class="mkd-menu-second">...).
  const mobileNavHtml = menuTreeToMobileHtml(menu || [], ctx, active);
  finalAfterNav = finalAfterNav.replace("<!--MKD_MOBILE_NAV-->", mobileNavHtml);

  const navHtml = menuTreeToHtml(menu || [], ctx, active);
  const fullHtml = rewriteHtmlLinksForLocalDev(beforeNav + navHtml + finalAfterNav, ctx);

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: fullHtml }} suppressHydrationWarning />
    </>
  );
}
