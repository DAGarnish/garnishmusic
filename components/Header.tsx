import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { menuTreeToHtml, type MenuNode } from "./menu-html";
import { getUrlRewriteContext, rewriteHtmlLinksForLocalDev } from "../lib/current-site";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const beforeNav = fs.readFileSync(path.join(dirname, "theme-html/header-before-nav.html"), "utf-8");
const afterNav = fs.readFileSync(path.join(dirname, "theme-html/header-after-nav.html"), "utf-8");

export default async function Header({ menu }: { menu?: MenuNode[] | null }) {
  const ctx = await getUrlRewriteContext();
  const navHtml = menuTreeToHtml(menu || [], ctx);
  const fullHtml = rewriteHtmlLinksForLocalDev(beforeNav + navHtml + afterNav, ctx);

  return <div dangerouslySetInnerHTML={{ __html: fullHtml }} suppressHydrationWarning />;
}
