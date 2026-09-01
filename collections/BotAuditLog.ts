import type { CollectionConfig } from "payload";

export const BotAuditLog: CollectionConfig = {
  slug: "bot-audit-log",
  admin: {
    useAsTitle: "id",
    defaultColumns: ["createdAt", "telegramUsername", "site", "field", "outcome"],
    description:
      "Every message the bot acted on or refused - allowed writes and denied attempts alike. Old/new values are kept so a change can be reverted by hand.",
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: "telegramUserId",
      type: "text",
      required: true,
    },
    {
      name: "telegramUsername",
      type: "text",
    },
    {
      name: "site",
      type: "relationship",
      relationTo: "sites",
    },
    {
      name: "documentCollection",
      type: "select",
      options: [
        { label: "Page", value: "pages" },
        { label: "Product", value: "products" },
      ],
    },
    {
      name: "page",
      type: "relationship",
      relationTo: "pages",
      admin: { description: "Set when documentCollection is Page." },
    },
    {
      name: "product",
      type: "relationship",
      relationTo: "products",
      admin: { description: "Set when documentCollection is Product." },
    },
    {
      name: "field",
      type: "text",
      admin: { description: "e.g. price, schedule, text" },
    },
    {
      name: "oldValue",
      type: "textarea",
    },
    {
      name: "newValue",
      type: "textarea",
    },
    {
      name: "outcome",
      type: "select",
      required: true,
      options: [
        { label: "Applied", value: "applied" },
        { label: "Denied - not permitted", value: "denied_permission" },
        { label: "Denied - anchor not found", value: "denied_anchor_mismatch" },
        { label: "Denied - daily message limit reached", value: "denied_rate_limit" },
        { label: "Denied - other error", value: "denied_error" },
      ],
    },
    {
      name: "note",
      type: "textarea",
      admin: { description: "Free-text detail - e.g. which field/page was requested, or the error message." },
    },
  ],
};
