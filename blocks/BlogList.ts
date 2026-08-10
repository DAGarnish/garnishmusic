import type { Block } from "payload";

export const BlogListBlock: Block = {
  slug: "blogList",
  fields: [
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
    },
  ],
};
