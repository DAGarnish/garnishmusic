import { getPayload } from "payload";
import config from "../payload.config";

// migrate-redirects.ts didn't handle the Redirection plugin's "server
// passthrough" action type (match_type: "server", action_data shaped as
// {server, url_from, url_notfrom} instead of {url}), so it stored the raw
// PHP-serialized action_data as the destination text. Extracted the real
// url_from values by hand from the raw export and confirmed both live on
// production.

const fixes: Record<string, string> = {
  "/courses/underground-dj-course": "https://ny.garnishmusicproduction.com/courses/electronic-dj-course/",
  "/contact-us-manhattan": "https://ny.garnishmusicproduction.com/contact-map/",
};

async function main() {
  const payload = await getPayload({ config });

  for (const [source, destination] of Object.entries(fixes)) {
    const found = await payload.find({
      collection: "redirects",
      where: { source: { equals: source } },
      limit: 10,
    });
    for (const r of found.docs as any[]) {
      await payload.update({ collection: "redirects", id: r.id, data: { destination } });
      console.log(`FIXED id=${r.id} source=${source} -> ${destination}`);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
