import type { Block } from "payload";

export const PortfolioSliderBlock: Block = {
  slug: "portfolioSlider",
  fields: [
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
    },
  ],
};
