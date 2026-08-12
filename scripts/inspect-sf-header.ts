import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });

  const sites = await payload.find({ collection: "sites", where: { domain: { contains: "sf" } }, limit: 10 });
  const sfSite = sites.docs.find((s: any) => s.domain?.includes("sf")) as any;
  if (!sfSite) { console.error("No SF site found"); process.exit(1); }

  const pages = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: sfSite.id } }, { wpPostId: { equals: 5271 } }] },
    limit: 1,
    depth: 0,
  });

  const page = pages.docs[0] as any;
  if (!page) { console.error("SF homepage not found"); process.exit(1); }

  let rawContent: string = page.wpRawContent;

  // Replace the broken attempt with row_type="parallax" + parallax_background_image which the renderer already supports
  const oldRow = '[vc_row header_style="mkd-dark-header" background_image="999303" css=".vc_custom_sf_hero{background-position: center center !important;background-repeat: no-repeat !important;background-size: cover !important;}"][vc_column][vc_empty_space height="60px"][vc_column_text css=""]';
  const newRow = '[vc_row header_style="mkd-dark-header" row_type="parallax" parallax_background_image="999303"][vc_column][vc_empty_space height="60px"][vc_column_text css=""]';

  if (rawContent.includes(oldRow)) {
    rawContent = rawContent.replace(oldRow, newRow);
    await payload.update({
      collection: "pages",
      id: page.id,
      data: { wpRawContent: rawContent },
    });
    console.log("Done! Updated to use parallax row type with San Francisco 303 image.");
  } else {
    console.log("Could not find expected row pattern. Content starts with:", rawContent.substring(0, 400));
  }

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
