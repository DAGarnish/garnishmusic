import type { Block } from "payload";

export const SectionTitleBlock: Block = {
  slug: "sectionTitle",
  fields: [
    {
      name: "title",
      type: "text",
    },
    {
      name: "type",
      type: "select",
      options: [
        { label: "Standard", value: "standard" },
        { label: "Two Colors", value: "two_colors_text" },
      ],
      defaultValue: "standard",
    },
    {
      name: "titleColor",
      type: "text",
    },
  ],
};
