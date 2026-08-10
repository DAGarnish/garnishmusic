import type { Block } from "payload";

export const VideoBlock: Block = {
  slug: "video",
  fields: [
    {
      name: "link",
      type: "text",
      required: true,
    },
  ],
};
