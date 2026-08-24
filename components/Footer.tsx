import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getUrlRewriteContext, rewriteHtmlLinksForLocalDev } from "../lib/current-site";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const footerHtml = fs.readFileSync(path.join(dirname, "theme-html/footer.html"), "utf-8");

// Fallback text for sites with no scraped footerCopyright data (av, sante,
// reportotosite - unreachable/different template on production) matches
// what every site showed before per-site data existed.
const DEFAULT_TOP =
  '<p style="color: #fff; margin-left: 10px;">Copyright © Garnish Music Production School</p><p style="color: #fff; margin-left: 10px;">All rights reserved</p>';

type FooterSite = {
  footerCopyright?: string | null;
} | null;

export default async function Footer({ site }: { site?: FooterSite } = {}) {
  const ctx = await getUrlRewriteContext();
  // The theme's bottom copyright bar (footerCopyrightBottom, a separate
  // .mkd-footer-bottom-holder widget below the main footer columns) was
  // scraped from production with the same hardcoded "Garnish Music
  // Production School LA, 7600 Melrose Avenue..." text on nearly every
  // site regardless of which site it actually was - a stale/wrong address
  // duplicating the correct, per-site address already shown above it in
  // the main footer column. Removed outright rather than fixed per-site.
  let html = footerHtml.replace("__FOOTER_COPYRIGHT_TOP__", site?.footerCopyright || DEFAULT_TOP);
  html = rewriteHtmlLinksForLocalDev(html, ctx);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
// force rebuild
// force rebuild for footer margin
// trigger rebuild
// trigger rebuild
// trigger rebuild
// trigger rebuild css
// trigger rebuild after removing Bournemouth footer link
