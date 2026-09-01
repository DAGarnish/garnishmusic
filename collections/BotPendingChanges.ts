import type { CollectionConfig } from "payload";

export const BotPendingChanges: CollectionConfig = {
  slug: "bot-pending-changes",
  admin: {
    useAsTitle: "id",
    defaultColumns: ["createdAt", "telegramUserId", "documentCollection", "field", "status"],
    description:
      "A proposed edit waiting on the admin's Yes/No confirmation in Telegram. Stored here (not in server memory) because serverless functions don't share memory between requests - the confirm/cancel button tap can land on a different instance than the one that sent the proposal.",
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => false,
  },
  fields: [
    {
      name: "telegramUserId",
      type: "text",
      required: true,
    },
    {
      name: "telegramChatId",
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
      name: "documentCollection",
      type: "select",
      required: true,
      options: [
        { label: "Page", value: "pages" },
        { label: "Product", value: "products" },
      ],
      admin: { description: "Which collection the edited document belongs to." },
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
      required: true,
      admin: { description: "Free-text label for what kind of content this is, e.g. price, schedule, description." },
    },
    {
      name: "oldSnippet",
      type: "textarea",
      required: true,
      admin: { description: "Exact current text being replaced - verified again at confirm time." },
    },
    {
      name: "newSnippet",
      type: "textarea",
      required: true,
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Confirmed", value: "confirmed" },
        { label: "Cancelled", value: "cancelled" },
        { label: "Expired", value: "expired" },
        { label: "Failed", value: "failed" },
      ],
    },
  ],
};
