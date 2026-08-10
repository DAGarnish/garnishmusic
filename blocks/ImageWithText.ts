import type { Block } from "payload";

export const ImageWithTextBlock: Block = {
  slug: "imageWithText",
  fields: [
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    {
      name: "title",
      type: "text",
    },
    {
      name: "text",
      type: "textarea",
    },
  ],
};
