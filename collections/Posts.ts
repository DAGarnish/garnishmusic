import type { CollectionConfig } from "payload";
import { BlocksFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import { VideoBlock } from "../blocks/Video";

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "site", "status", "publishedDate"],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
    },
    {
      name: "site",
      type: "relationship",
      relationTo: "sites",
      required: true,
    },
    {
      name: "status",
      type: "select",
      defaultValue: "published",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
    },
    {
      name: "author",
      type: "text",
      admin: {
        description: "Author display name, extracted from WordPress",
      },
    },
    {
      name: "publishedDate",
      type: "date",
    },
    {
      name: "featuredImage",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "titleBackgroundImage",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "content",
      type: "richText",
      // Blog post bodies otherwise have no way to embed a playable video -
      // BlocksFeature adds the same "video" block already used by the
      // pages `layout` field (blocks/Video.ts, rendered by
      // components/blocks/BlockRenderer.tsx's VideoBlock) so a post's
      // Lexical content can embed one inline between paragraphs.
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures, BlocksFeature({ blocks: [VideoBlock] })],
      }),
    },
    {
      name: "excerpt",
      type: "textarea",
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
    },
    {
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
    },
    {
      name: "seo",
      type: "group",
      fields: [
        { name: "metaTitle", type: "text" },
        { name: "metaDescription", type: "textarea" },
        { name: "noindex", type: "checkbox", defaultValue: false },
      ],
    },
    {
      name: "wpPostId",
      type: "number",
    },
  ],
};
