const API_BASE = "https://api.telegram.org";

function botToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return token;
}

export type InlineButton = { text: string; callback_data: string };

async function callTelegram(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/bot${botToken()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    console.error(`Telegram API ${method} failed:`, data);
  }
  return data;
}

export async function sendMessage(
  chatId: string | number,
  text: string,
  options?: { buttons?: InlineButton[][] },
) {
  return callTelegram("sendMessage", {
    chat_id: chatId,
    text,
    ...(options?.buttons
      ? { reply_markup: { inline_keyboard: options.buttons } }
      : {}),
  });
}

export async function editMessageText(
  chatId: string | number,
  messageId: number,
  text: string,
) {
  return callTelegram("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
  });
}

export async function sendTyping(chatId: string | number) {
  return callTelegram("sendChatAction", { chat_id: chatId, action: "typing" });
}

/**
 * Telegram's "typing..." indicator only lasts ~5 seconds, so it needs
 * refreshing while a slow operation (the multi-turn Claude loop) runs -
 * otherwise it disappears partway through and the wait looks broken
 * again. Call the returned stop() once the real work is done.
 */
export function startTypingIndicator(chatId: string | number): { stop: () => void } {
  void sendTyping(chatId);
  const interval = setInterval(() => void sendTyping(chatId), 4000);
  return { stop: () => clearInterval(interval) };
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
) {
  return callTelegram("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    ...(text ? { text } : {}),
  });
}

// Minimal shape of what we read from a Telegram update - not the full API.
export type TelegramUpdate = {
  message?: {
    message_id: number;
    text?: string;
    chat: { id: number };
    from: { id: number; username?: string };
  };
  callback_query?: {
    id: string;
    data?: string;
    message: { message_id: number; chat: { id: number } };
    from: { id: number; username?: string };
  };
};
