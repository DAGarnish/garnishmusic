import { getPayloadClient } from "./get-payload";
import type { ContentCollection } from "./bot-content-lookup";

export type ContentChangeRequest = {
  collection: ContentCollection;
  documentId: string | number;
  oldSnippet: string;
  newSnippet: string;
};

export type ContentChangeResult = {
  oldValue: string;
  newValue: string;
};

/**
 * The safe-patch write: find-and-replace a specific, exact substring
 * inside wpRawContent, never a full-field overwrite composed by the
 * model. Two checks make this safe rather than a blind string swap:
 *
 *   1. The old snippet must appear in the CURRENT content, verified at
 *      write time (not just when Claude read it) - if someone edited the
 *      page in between, this throws instead of writing something stale.
 *   2. The old snippet must appear EXACTLY ONCE - if it's ambiguous
 *      (matches more than one spot), this refuses rather than guessing
 *      which occurrence was meant.
 *
 * Everything else on the page passes through unchanged, byte for byte.
 */
export async function applyContentChange(request: ContentChangeRequest): Promise<ContentChangeResult> {
  const { collection, documentId, oldSnippet, newSnippet } = request;
  const payload = await getPayloadClient();

  const doc = await payload.findByID({ collection, id: documentId });
  const current = (doc.wpRawContent as string) || "";

  const occurrences = oldSnippet.length === 0 ? 0 : current.split(oldSnippet).length - 1;

  if (occurrences === 0) {
    throw new Error(
      "I couldn't find that exact text on the page anymore - it may have changed since I looked at it. Please try again.",
    );
  }
  if (occurrences > 1) {
    throw new Error(
      "That text appears more than once on the page, so I can't be sure which one you mean. Please be more specific.",
    );
  }

  const updated = current.replace(oldSnippet, newSnippet);

  await payload.update({
    collection,
    id: documentId,
    data: { wpRawContent: updated },
  });

  return { oldValue: oldSnippet, newValue: newSnippet };
}
