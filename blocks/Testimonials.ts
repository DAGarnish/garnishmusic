import type { Block } from "payload";

export const TestimonialsBlock: Block = {
  slug: "testimonials",
  fields: [
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
    },
  ],
};
