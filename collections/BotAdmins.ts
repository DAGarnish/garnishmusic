import type { CollectionConfig } from "payload";

export const BotAdmins: CollectionConfig = {
  slug: "bot-admins",
  admin: {
    useAsTitle: "telegramUsername",
    defaultColumns: ["telegramUsername", "site", "allowedFields", "active"],
    description:
      "Who may talk to the content bot, which single city they may edit, and either which fields (Price/Schedule/Text) or full unrestricted content access on that city's pages and products. This is the only source of truth the bot checks before writing anything - it is looked up fresh on every message, not cached, so a change here takes effect on the admin's very next message.",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "telegramUserId",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description:
          "The numeric Telegram user ID (not the @username, which can change). Ask the admin to message @userinfobot to get theirs.",
      },
    },
    {
      name: "telegramUsername",
      type: "text",
      admin: {
        description: "@handle at the time this record was created, for display only - not used for matching.",
      },
    },
    {
      name: "site",
      type: "relationship",
      relationTo: "sites",
      required: true,
      admin: {
        description: "The single city this admin may edit. One admin, one city.",
      },
    },
    {
      name: "unrestrictedContentAccess",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description:
          "Check to let this admin edit ANY content on their site's pages/products via plain-language prompts (no field restriction) - for a fast, broad rollout. Leave unchecked to use the safer Allowed Fields list below instead. Either way, the admin is still limited to their one site, and every change is still confirmed before writing and logged.",
      },
    },
    {
      name: "allowedFields",
      type: "select",
      hasMany: true,
      options: [
        { label: "Price", value: "price" },
        { label: "Schedule / dates", value: "schedule" },
        { label: "Short text blocks", value: "text" },
      ],
      admin: {
        description:
          "Ignored if Unrestricted Content Access above is checked. Otherwise, only these kinds of edits are allowed - anything else is declined, never attempted.",
        condition: (_data, siblingData) => !siblingData?.unrestrictedContentAccess,
      },
    },
    {
      name: "allowedPages",
      type: "relationship",
      relationTo: "pages",
      hasMany: true,
      admin: {
        description:
          "Leave empty to allow all of this site's pages. Set specific pages to restrict this admin further, e.g. to a single course page. Applies whether or not Unrestricted Content Access is checked.",
      },
    },
    {
      name: "active",
      type: "checkbox",
      defaultValue: true,
      admin: {
        description: "Uncheck to revoke access instantly without deleting the record.",
      },
    },
    {
      name: "messageCountToday",
      type: "number",
      defaultValue: 0,
      admin: {
        readOnly: true,
        description:
          "Bookkeeping for the daily rate limit - managed automatically by the bot, resets each day. Not meant to be edited by hand.",
      },
    },
    {
      name: "messageCountResetAt",
      type: "date",
      admin: {
        readOnly: true,
        description: "When the counter above last reset.",
      },
    },
  ],
};
