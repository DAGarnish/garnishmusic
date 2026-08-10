import type { Block } from "payload";
import { ColumnBlock } from "./Column";

export const RowBlock: Block = {
  slug: "row",
  fields: [
    {
      name: "isGrid",
      type: "checkbox",
      defaultValue: true,
      label: "Constrain width to grid?",
    },
    {
      name: "parallaxImage",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "columns",
      type: "blocks",
      blocks: [ColumnBlock],
    },
  ],
};
