import type { Block } from "payload";

export const RawHTMLBlock: Block = {
  slug: "rawHtml",
  fields: [
    {
      name: "html",
      type: "textarea",
      required: true,
    },
  ],
};
