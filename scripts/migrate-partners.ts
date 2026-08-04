import { getPayload } from "payload";
import config from "../payload.config";

// Source: edu's own /partners/ page content, the canonical copy of the
// "Some of our partners" block that was otherwise duplicated onto 38 pages
// network-wide (all with the identical 12 logos, in this same order -
// confirmed against every instance found). The images themselves were
// already migrated as part of edu's normal media migration (they're WP
// attachment IDs from that site), so this just references the existing
// media docs by their wpAttachmentId rather than re-downloading anything.
const PARTNERS: { wpAttachmentId: number; name: string; link: string }[] = [
  { wpAttachmentId: 25589, name: "Ableton", link: "https://www.ableton.com/" },
  { wpAttachmentId: 25625, name: "iZotope", link: "https://izotope.com/" },
  { wpAttachmentId: 25591, name: "Beatport", link: "https://www.beatport.com/" },
  { wpAttachmentId: 25621, name: "Arturia", link: "https://www.arturia.com/" },
  { wpAttachmentId: 25611, name: "Pioneer DJ", link: "https://www.pioneerdj.com/en-gb/" },
  { wpAttachmentId: 25610, name: "AlphaTheta", link: "https://alphatheta.com/" },
  { wpAttachmentId: 25603, name: "Soundtoys", link: "https://www.soundtoys.com/" },
  { wpAttachmentId: 25604, name: "Antares (Auto-Tune)", link: "https://www.antarestech.com/" },
  { wpAttachmentId: 25617, name: "Image-Line (FL Studio)", link: "https://www.image-line.com/" },
  { wpAttachmentId: 25607, name: "Pitch Innovations", link: "https://www.pitchinnovations.com/" },
  { wpAttachmentId: 25605, name: "Native Instruments", link: "https://www.native-instruments.com/en/" },
  { wpAttachmentId: 25618, name: "Apple Music", link: "https://music.apple.com/us/new" },
];
const SOURCE_SITE_SLUG = "edu";

async function main() {
  const payload = await getPayload({ config });

  const site = await payload.find({
    collection: "sites",
    where: { slug: { equals: SOURCE_SITE_SLUG } },
    limit: 1,
  });
  const siteId = site.docs[0]?.id;
  if (!siteId) throw new Error(`Source site "${SOURCE_SITE_SLUG}" not found`);

  const logos: { image: number | string; name: string; link: string }[] = [];
  for (const p of PARTNERS) {
    const media = await payload.find({
      collection: "media",
      where: { and: [{ site: { equals: siteId } }, { wpAttachmentId: { equals: p.wpAttachmentId } }] },
      limit: 1,
    });
    const doc = media.docs[0];
    if (!doc) {
      console.log(`  SKIP ${p.name}: no media found for wpAttachmentId ${p.wpAttachmentId}`);
      continue;
    }
    logos.push({ image: doc.id, name: p.name, link: p.link });
  }

  await payload.updateGlobal({ slug: "partners", data: { logos } });
  console.log(`DONE. Partners global set with ${logos.length}/${PARTNERS.length} logos.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
