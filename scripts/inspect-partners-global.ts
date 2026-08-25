import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const global = await payload.findGlobal({ slug: "partners", depth: 1 });
  const logos = (global as any)?.logos || [];
  console.log(`${logos.length} partner logos:`);
  for (const l of logos) {
    console.log({
      name: l.name,
      link: l.link,
      imageUrl: typeof l.image === "object" ? l.image?.url : l.image,
      width: typeof l.image === "object" ? l.image?.width : undefined,
      height: typeof l.image === "object" ? l.image?.height : undefined,
    });
  }
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
