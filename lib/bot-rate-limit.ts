import { getPayloadClient } from "./get-payload";

// One admin's own mistake or a stolen Telegram account should only ever
// cost as much as this many Claude calls a day - not enough on its own to
// trip Dave's account-wide spend cap, and small enough that the damage
// from one bad actor stays contained to their own city.
const DAILY_MESSAGE_LIMIT = 50;

function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/**
 * Call this once per incoming message, before the Claude call - not before
 * the permission check (that one's free; this one guards the paid step).
 * Not perfectly race-proof under truly concurrent messages from the same
 * admin, which is an acceptable tradeoff at this scale rather than adding
 * database-level locking for it.
 */
export async function checkAndConsumeDailyLimit(
  botAdminId: string | number,
): Promise<{ allowed: true } | { allowed: false; limit: number }> {
  const payload = await getPayloadClient();
  const doc = await payload.findByID({ collection: "bot-admins", id: botAdminId });

  const now = new Date();
  const lastReset = doc.messageCountResetAt ? new Date(doc.messageCountResetAt) : null;
  const isNewDay = !lastReset || !isSameUtcDay(lastReset, now);

  const currentCount = isNewDay ? 0 : (doc.messageCountToday ?? 0);

  if (currentCount >= DAILY_MESSAGE_LIMIT) {
    return { allowed: false, limit: DAILY_MESSAGE_LIMIT };
  }

  await payload.update({
    collection: "bot-admins",
    id: botAdminId,
    data: {
      messageCountToday: currentCount + 1,
      ...(isNewDay ? { messageCountResetAt: now.toISOString() } : {}),
    },
  });

  return { allowed: true };
}
