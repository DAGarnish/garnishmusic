import type { Block } from "payload";

export const HeroSliderBlock: Block = {
  slug: "heroSlider",
  fields: [
    {
      name: "slider",
      type: "relationship",
      relationTo: "hero-sliders",
    },
  ],
};
