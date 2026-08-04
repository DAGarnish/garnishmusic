import { getPayloadClient } from "./get-payload";
import type { PartnerItem } from "../scripts/wp-shortcode-render";

export async function resolvePartners(rawContent: string): Promise<PartnerItem[]> {
  if (!(rawContent || "").includes("heading-some-of-our-partners")) return [];

  const payload = await getPayloadClient();
  const global = await payload.findGlobal({ slug: "partners", depth: 1 });
  const logos = (global?.logos || []) as any[];

  return logos
    .map((l) => ({
      imageUrl: typeof l.image === "object" ? l.image?.url : undefined,
      name: l.name || undefined,
      link: l.link || undefined,
    }))
    .filter((l): l is PartnerItem => Boolean(l.imageUrl));
}
