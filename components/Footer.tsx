import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getUrlRewriteContext, rewriteHtmlLinksForLocalDev } from "../lib/current-site";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const footerHtml = fs.readFileSync(path.join(dirname, "theme-html/footer.html"), "utf-8");

// Fallback text for sites with no scraped footerCopyright(Bottom) data
// (av, sante, reportotosite - unreachable/different template on production)
// matches what every site showed before per-site data existed.
const DEFAULT_TOP =
  '<p style="color: #fff; margin-left: 10px;">Copyright © Garnish Music Production School</p><p style="color: #fff; margin-left: 10px;">All rights reserved</p>';
const DEFAULT_BOTTOM =
  "<p>Copyright © Garnish Music Production School LA, 7600 Melrose Avenue, Los Angeles, California, 90046, USA</p><p>All rights reserved</p>";

type FooterSite = {
  footerCopyright?: string | null;
  footerCopyrightBottom?: string | null;
} | null;

export default async function Footer({ site }: { site?: FooterSite } = {}) {
  const ctx = await getUrlRewriteContext();
  let html = footerHtml
    .replace("__FOOTER_COPYRIGHT_TOP__", site?.footerCopyright || DEFAULT_TOP)
    .replace("__FOOTER_COPYRIGHT_BOTTOM__", site?.footerCopyrightBottom || DEFAULT_BOTTOM);
  html = rewriteHtmlLinksForLocalDev(html, ctx);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
