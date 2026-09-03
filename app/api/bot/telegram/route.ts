import { NextResponse } from "next/server";
import { getPayloadClient } from "../../../../lib/get-payload";
import { lookupBotPermission, isChangeAllowed } from "../../../../lib/bot-permissions";
import { checkAndConsumeDailyLimit } from "../../../../lib/bot-rate-limit";
import { interpretMessage } from "../../../../lib/bot-claude";
import { applyContentChange } from "../../../../lib/bot-content-writer";
import type { ContentCollection } from "../../../../lib/bot-content-lookup";
import {
  sendMessage,
  editMessageText,
  answerCallbackQuery,
  startTypingIndicator,
  type TelegramUpdate,
} from "../../../../lib/telegram";

const PENDING_TTL_MS = 10 * 60 * 1000;

async function findDocumentBySlug(siteId: string | number, collection: ContentCollection, slug: string) {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection,
    where: { and: [{ site: { equals: siteId } }, { slug: { equals: slug } }] },
    limit: 1,
  });
  return result.docs[0] ?? null;
}

function docTitle(collection: ContentCollection, doc: any, fallbackSlug: string): string {
  if (collection === "pages") return doc?.title ?? fallbackSlug;
  return doc?.name ?? fallbackSlug;
}

async function logAudit(data: {
  telegramUserId: string;
  telegramUsername?: string | null;
  site?: string | number;
  documentCollection?: ContentCollection;
  page?: string | number;
  product?: string | number;
  field?: string;
  oldValue?: string;
  newValue?: string;
  outcome: "applied" | "denied_permission" | "denied_anchor_mismatch" | "denied_rate_limit" | "denied_error";
  note?: string;
}) {
  const payload = await getPayloadClient();
  await payload.create({ collection: "bot-audit-log", data });
}

async function handleMessage(msg: NonNullable<TelegramUpdate["message"]>) {
  const telegramUserId = String(msg.from.id);
  const telegramUsername = msg.from.username ?? null;
  const chatId = msg.chat.id;
  const text = msg.text ?? "";

  const permission = await lookupBotPermission(telegramUserId);
  if (!permission) {
    await sendMessage(chatId, "You're not set up as an admin yet - ask Dave to add you.");
    await logAudit({
      telegramUserId,
      telegramUsername,
      outcome: "denied_permission",
      note: "no active bot-admins record for this Telegram user",
    });
    return;
  }

  const rateLimit = await checkAndConsumeDailyLimit(permission.botAdminId);
  if (!rateLimit.allowed) {
    await sendMessage(
      chatId,
      `You've reached today's limit of ${rateLimit.limit} messages - please try again tomorrow, or ask Dave to raise it.`,
    );
    await logAudit({
      telegramUserId,
      telegramUsername,
      site: permission.siteId,
      outcome: "denied_rate_limit",
      note: `daily limit of ${rateLimit.limit} messages reached`,
    });
    return;
  }

  const typing = startTypingIndicator(chatId);
  const interpreted = await interpretMessage(text, permission);
  typing.stop();

  if (interpreted.kind === "clarify") {
    await sendMessage(chatId, interpreted.message);
    return;
  }

  const { collection, slug, field, oldSnippet, newSnippet } = interpreted;
  const doc = await findDocumentBySlug(permission.siteId, collection, slug);

  if (!doc || !isChangeAllowed(permission, { pageId: doc?.id ?? "", field })) {
    await sendMessage(
      chatId,
      `Sorry, you're not able to change that. If this seems wrong, ask Dave to check your access.`,
    );
    await logAudit({
      telegramUserId,
      telegramUsername,
      site: permission.siteId,
      documentCollection: collection,
      ...(collection === "pages" ? { page: doc?.id } : { product: doc?.id }),
      field,
      outcome: "denied_permission",
      note: `requested collection="${collection}" slug="${slug}" field="${field}"`,
    });
    return;
  }

  const payload = await getPayloadClient();
  const pending = await payload.create({
    collection: "bot-pending-changes",
    data: {
      telegramUserId,
      telegramChatId: String(chatId),
      site: permission.siteId,
      documentCollection: collection,
      ...(collection === "pages" ? { page: doc.id } : { product: doc.id }),
      field,
      oldSnippet,
      newSnippet,
      status: "pending",
    },
  });

  const title = docTitle(collection, doc, slug);
  await sendMessage(
    chatId,
    `Change ${field} on "${title}":\n\n"${oldSnippet}"\n→\n"${newSnippet}"\n\nConfirm?`,
    {
      buttons: [
        [
          { text: "Yes, apply it", callback_data: `confirm:${pending.id}` },
          { text: "No, cancel", callback_data: `cancel:${pending.id}` },
        ],
      ],
    },
  );
}

async function handleCallback(cb: NonNullable<TelegramUpdate["callback_query"]>) {
  const telegramUserId = String(cb.from.id);
  const telegramUsername = cb.from.username ?? null;
  const chatId = cb.message.chat.id;
  const messageId = cb.message.message_id;
  const data = cb.data ?? "";

  await answerCallbackQuery(cb.id);

  const [action, pendingId] = data.split(":");
  if (!pendingId) return;

  const payload = await getPayloadClient();
  const pending = await payload.findByID({ collection: "bot-pending-changes", id: pendingId }).catch(() => null);

  if (!pending || pending.status !== "pending") {
    await editMessageText(chatId, messageId, "This request is no longer available.");
    return;
  }

  const isExpired = Date.now() - new Date(pending.createdAt).getTime() > PENDING_TTL_MS;
  if (isExpired) {
    await payload.update({ collection: "bot-pending-changes", id: pendingId, data: { status: "expired" } });
    await editMessageText(chatId, messageId, "This request expired - please ask again.");
    return;
  }

  if (action === "cancel") {
    await payload.update({ collection: "bot-pending-changes", id: pendingId, data: { status: "cancelled" } });
    await editMessageText(chatId, messageId, "Cancelled - nothing was changed.");
    return;
  }

  if (action !== "confirm") return;

  const documentCollection = pending.documentCollection as ContentCollection;
  const documentRef = documentCollection === "pages" ? pending.page : pending.product;
  const documentId = typeof documentRef === "object" ? documentRef.id : documentRef;
  const field = pending.field as string;

  // Re-check permission here too - it may have been revoked between the
  // proposal and this confirmation tap.
  const permission = await lookupBotPermission(telegramUserId);

  if (!permission || !isChangeAllowed(permission, { pageId: documentId, field })) {
    await payload.update({ collection: "bot-pending-changes", id: pendingId, data: { status: "cancelled" } });
    await editMessageText(chatId, messageId, "Your access has changed since this was proposed - not applied.");
    await logAudit({
      telegramUserId,
      telegramUsername,
      documentCollection,
      ...(documentCollection === "pages" ? { page: documentId } : { product: documentId }),
      field,
      outcome: "denied_permission",
      note: "permission revoked between proposal and confirmation",
    });
    return;
  }

  try {
    const result = await applyContentChange({
      collection: documentCollection,
      documentId,
      oldSnippet: pending.oldSnippet,
      newSnippet: pending.newSnippet,
    });
    await payload.update({ collection: "bot-pending-changes", id: pendingId, data: { status: "confirmed" } });
    await logAudit({
      telegramUserId,
      telegramUsername,
      site: permission.siteId,
      documentCollection,
      ...(documentCollection === "pages" ? { page: documentId } : { product: documentId }),
      field,
      oldValue: result.oldValue,
      newValue: result.newValue,
      outcome: "applied",
    });
    await editMessageText(chatId, messageId, `Done - ${field} updated.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await payload.update({ collection: "bot-pending-changes", id: pendingId, data: { status: "failed" } });
    await logAudit({
      telegramUserId,
      telegramUsername,
      site: permission.siteId,
      documentCollection,
      ...(documentCollection === "pages" ? { page: documentId } : { product: documentId }),
      field,
      newValue: pending.newSnippet,
      outcome: "denied_error",
      note: message,
    });
    await editMessageText(chatId, messageId, `Sorry, I couldn't make that change: ${message}`);
  }
}

export async function POST(req: Request) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (!secret || secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const update = (await req.json()) as TelegramUpdate;

  try {
    if (update.message) {
      await handleMessage(update.message);
    } else if (update.callback_query) {
      await handleCallback(update.callback_query);
    }
  } catch (err) {
    console.error("Telegram webhook error:", err);
    // Still 200 - Telegram retries on non-2xx, and errors are already
    // communicated back to the user via chat where possible.
  }

  return NextResponse.json({ ok: true });
}
