import type { CollectionConfig } from "payload";
import { adminOnly } from "../lib/access-control";

export const HeroSliders: CollectionConfig = {
  slug: "hero-sliders",
  admin: {
    useAsTitle: "alias",
    defaultColumns: ["alias", "site"],
  },
  access: {
    read: () => true,
    // Admin-only, even for a site's own editor (explicit user request,
    // 2026-09-03 - editors are scoped to Pages/Products only).
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: "alias",
      type: "text",
      required: true,
      admin: {
        description: "Revolution Slider/SR7 alias referenced by [rev_slider alias=\"...\"] or [sr7 alias=\"...\"]",
      },
    },
    {
      name: "site",
      type: "relationship",
      relationTo: "sites",
      required: true,
    },
    {
      name: "slides",
      type: "array",
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
        },
        {
          name: "layers",
          type: "array",
          admin: {
            description: "Stacked Slider Revolution text layers for this slide, in on-screen order, each with its own captured style",
          },
          fields: [
            {
              name: "text",
              type: "text",
              admin: {
                description: "Layer caption text (may contain <br> line breaks, migrated as-is)",
              },
            },
            { name: "color", type: "text" },
            { name: "backgroundColor", type: "text" },
            { name: "fontFamily", type: "text" },
            { name: "fontSize", type: "text" },
            { name: "padding", type: "text" },
          ],
        },
      ],
    },
  ],
};
