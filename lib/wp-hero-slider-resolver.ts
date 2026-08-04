import { getPayloadClient } from "./get-payload";
import type { HeroSliderResolver, HeroSlide } from "../scripts/wp-shortcode-render";

export async function buildHeroSliderResolver(
  siteId: number | string,
  rawContent: string
): Promise<HeroSliderResolver> {
  const aliases = new Set<string>();
  for (const m of (rawContent || "").matchAll(/\[(?:rev_slider|sr7)[^\]]*\balias="([^"]*)"/g)) {
    if (m[1]) aliases.add(m[1]);
  }

  const map = new Map<string, HeroSlide[]>();
  if (aliases.size > 0) {
    const payload = await getPayloadClient();
    const sliders = await payload.find({
      collection: "hero-sliders",
      where: { and: [{ site: { equals: siteId } }, { alias: { in: [...aliases] } }] },
      limit: 100,
      depth: 1,
    });
    for (const slider of sliders.docs) {
      const slides: HeroSlide[] = (slider.slides || []).map((s: any) => ({
        imageUrl: typeof s.image === "object" ? s.image?.url : undefined,
        layers: (s.layers || []).map((l: any) => ({
          text: l.text,
          color: l.color ?? undefined,
          backgroundColor: l.backgroundColor ?? undefined,
          fontFamily: l.fontFamily ?? undefined,
          fontSize: l.fontSize ?? undefined,
          padding: l.padding ?? undefined,
        })),
      }));
      map.set(slider.alias as string, slides);
    }
  }

  return (alias: string) => map.get(alias) || [];
}
