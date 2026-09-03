import { getPayloadClient } from "./get-payload";

export type BotField = "price" | "schedule" | "text";

export type BotPermission = {
  botAdminId: string | number;
  telegramUserId: string;
  telegramUsername: string | null;
  siteId: string | number;
  siteSlug: string;
  unrestrictedContentAccess: boolean;
  allowedFields: BotField[]; // ignored when unrestrictedContentAccess is true
  allowedPageIds: (string | number)[] | null; // null = all pages on this site, applies either way
};

/**
 * The single place the bot checks "is this allowed" - looked up fresh on
 * every message (no caching), so a revoke or scope change in the
 * bot-admins collection takes effect on the admin's very next message.
 * Never trust a field/city coming back from the model - only what this
 * function returns for the *sender's* telegramUserId.
 */
export async function lookupBotPermission(telegramUserId: string): Promise<BotPermission | null> {
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "bot-admins",
    where: {
      and: [{ telegramUserId: { equals: telegramUserId } }, { active: { equals: true } }],
    },
    depth: 1,
    limit: 1,
  });

  const doc = result.docs[0];
  if (!doc) return null;

  const site = doc.site as { id: string | number; slug: string } | string | number;
  if (!site || typeof site === "string" || typeof site === "number") return null;

  const allowedPages = Array.isArray(doc.allowedPages) ? doc.allowedPages : [];
  const allowedPageIds =
    allowedPages.length === 0
      ? null
      : allowedPages.map((p) => (typeof p === "object" && p !== null ? p.id : p));

  return {
    botAdminId: doc.id,
    telegramUserId: doc.telegramUserId,
    telegramUsername: doc.telegramUsername ?? null,
    siteId: site.id,
    siteSlug: site.slug,
    unrestrictedContentAccess: Boolean(doc.unrestrictedContentAccess),
    allowedFields: (doc.allowedFields ?? []) as BotField[],
    allowedPageIds,
  };
}

/**
 * Re-checked in the backend before every write, independent of whatever
 * the model proposed. This is the actual authorization boundary - not
 * the tool schema, not the model's own judgment.
 *
 * Site scoping happens earlier (the page/product lookup is itself scoped
 * to permission.siteId before this is even called) - this only decides
 * field and page scope within that already-confirmed site.
 */
export function isChangeAllowed(
  permission: BotPermission,
  request: { pageId: string | number; field: string },
): boolean {
  if (!permission.unrestrictedContentAccess && !permission.allowedFields.includes(request.field as BotField)) {
    return false;
  }
  if (permission.allowedPageIds === null) return true;
  return permission.allowedPageIds.some((id) => String(id) === String(request.pageId));
}
