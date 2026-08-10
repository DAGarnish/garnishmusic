import type { Block } from "payload";

export const ButtonBlock: Block = {
  slug: "button",
  fields: [
    {
      name: "label",
      type: "text",
      required: true,
    },
    {
      name: "url",
      type: "text",
      required: true,
    },
    {
      name: "newTab",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "variant",
      type: "select",
      defaultValue: "primary",
      options: [
        { label: "Primary", value: "primary" },
        { label: "Secondary", value: "secondary" },
      ],
    },
  ],
};
