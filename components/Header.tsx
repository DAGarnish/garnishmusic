import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { menuTreeToHtml, type ActiveMatch, type MenuNode } from "./menu-html";
import { getUrlRewriteContext, rewriteHtmlLinksForLocalDev } from "../lib/current-site";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const beforeNav = fs.readFileSync(path.join(dirname, "theme-html/header-before-nav.html"), "utf-8");
const afterNav = fs.readFileSync(path.join(dirname, "theme-html/header-after-nav.html"), "utf-8");



export default async function Header({
  menu,
  currentPath,
  siteDomain,
}: {
  menu?: MenuNode[] | null;
  currentPath?: string;
  siteDomain?: string;
}) {
  const ctx = await getUrlRewriteContext();
  const active: ActiveMatch | undefined =
    currentPath !== undefined && siteDomain ? { path: currentPath, domain: siteDomain } : undefined;
  
  // Hide cart on all sites
  let finalAfterNav = afterNav;
  finalAfterNav += "<style>.mkd-shopping-cart-outer { display: none !important; }</style>";

  const navHtml = menuTreeToHtml(menu || [], ctx, active);
  const fullHtml = rewriteHtmlLinksForLocalDev(beforeNav + navHtml + finalAfterNav, ctx);

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: fullHtml }} suppressHydrationWarning />
    </>
  );
}
