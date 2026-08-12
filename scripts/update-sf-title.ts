import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  await payload.update({
    collection: "pages",
    id: 1961,
    data: {
      title: "SF Garnish Music Production",
    },
  });

  console.log("Updated title of page 1961 to SF Garnish Music Production.");
  process.exit(0);
}

main().catch(console.error);
