import { getPayload } from "payload";
import config from "../payload.config";
import { htmlToLexical } from "./html-to-lexical";

async function main() {
  const payload = await getPayload({ config });

  const sites = await payload.find({ collection: "sites", limit: 1 });
  const siteId = sites.docs[0].id;

  const html = `
    <p>This is a <strong>bold</strong> and <em>italic</em> test with a <a href="https://example.com" target="_blank">link</a>.</p>
    <h2>A heading</h2>
    <ul><li>First item</li><li>Second <b>item</b></li></ul>
    <blockquote>A quote here.</blockquote>
  `;

  const richText = htmlToLexical(html);

  const doc = await payload.create({
    collection: "pages",
    data: {
      title: "Lexical Converter Test",
      slug: "lexical-converter-test",
      site: siteId,
      content: richText,
    },
  });

  console.log("Created test page with ID:", doc.id);
  console.log(JSON.stringify(richText, null, 2));

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
