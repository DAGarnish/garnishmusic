import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getUrlRewriteContext, rewriteHtmlLinksForLocalDev } from "../lib/current-site";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const footerHtml = fs.readFileSync(path.join(dirname, "theme-html/footer.html"), "utf-8");

export default async function Footer() {
  const ctx = await getUrlRewriteContext();
  const html = rewriteHtmlLinksForLocalDev(footerHtml, ctx);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
