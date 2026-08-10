import type { Block } from "payload";

export const PortfolioListBlock: Block = {
  slug: "portfolioList",
  fields: [
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
    },
  ],
};
