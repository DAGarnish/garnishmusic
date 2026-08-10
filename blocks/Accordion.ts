import type { Block } from "payload";
import { RichTextBlock } from "./RichText";
import { ImageBlock } from "./Image";
import { ButtonBlock } from "./Button";
import { RawHTMLBlock } from "./RawHTML";

export const AccordionBlock: Block = {
  slug: "accordion",
  fields: [
    {
      name: "items",
      type: "array",
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "blocks",
          type: "blocks",
          blocks: [RichTextBlock, ImageBlock, ButtonBlock, RawHTMLBlock],
        },
      ],
    },
  ],
};
