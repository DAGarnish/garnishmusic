import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const PAGE_ID = 2264;

  const doc = (await payload.findByID({ collection: "pages", id: PAGE_ID, depth: 0 })) as any;
  const marker = '[mkd_icon_list_item icon_pack="font_elegant" fe_icon="icon_phone" icon_color="#e9003f" title="(818) 280 9913" icon_size="32" title_size="24" title_color="#000000"]';
  if (!doc.wpRawContent.includes(marker)) {
    console.error("marker not found - aborting");
    process.exit(1);
  }
  const button = '[mkd_button text="Send Us a Message" link="https://edu.garnishmusicproduction.com/connect/"]';
  const updated = doc.wpRawContent.replace(marker, marker + button);

  await payload.update({ collection: "pages", id: PAGE_ID, data: { wpRawContent: updated } });
  console.log("updated page", PAGE_ID);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
