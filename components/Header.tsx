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
  finalAfterNav += "<style>.mkd-shopping-cart-outer { display: none !important; } .mkd-logo-wrapper { display: none !important; } .heading-some-of-our-partners { margin-bottom: 0 !important; } footer { margin-top: 0 !important; } .mkd-mobile-header { position: sticky !important; top: 0 !important; z-index: 1000 !important; background-color: #fff !important; }</style>";

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
