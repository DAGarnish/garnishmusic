import { getPayload } from "payload";
import config from "../payload.config";

const PAGE_ID = 1451;

async function main() {
  const payload = await getPayload({ config });
  const page = await payload.findByID({ collection: "pages", id: PAGE_ID });
  const raw = page.wpRawContent as string;

  const target =
    '[vc_row disable_element="yes" css=".vc_custom_1779995521523{margin-top: -30px !important;}"][vc_column][mkd_portfolio_list';
  if (!raw.includes(target)) {
    throw new Error("Expected disable_element vc_row not found - content may have changed");
  }

  const reverted = raw.replace(
    '[vc_row disable_element="yes" css=".vc_custom_1779995521523{margin-top: -30px !important;}"]',
    '[vc_row css=".vc_custom_1779995521523{margin-top: -30px !important;}"]'
  );

  await payload.update({
    collection: "pages",
    id: PAGE_ID,
    data: { wpRawContent: reverted },
  });

  console.log("Reverted page", PAGE_ID, "- locations gallery re-enabled");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
