import Anthropic from "@anthropic-ai/sdk";
import type { BotPermission } from "./bot-permissions";
import { listSiteContent, getDocumentContent, type ContentCollection } from "./bot-content-lookup";

const MAX_TURNS = 6;

function client() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

function buildTools(permission: BotPermission): Anthropic.Tool[] {
  const fieldSchema = permission.unrestrictedContentAccess
    ? { type: "string" as const, description: "A short label for what kind of content this is, e.g. price, schedule, description." }
    : { type: "string" as const, enum: permission.allowedFields, description: "Which kind of content is being changed." };

  return [
    {
      name: "list_content",
      description: "List every page and product on this admin's own site, with title and slug. Use this first if you don't already know the exact slug the admin means.",
      input_schema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "read_content",
      description: "Read a specific page or product's current raw content, by its exact slug. Always do this before proposing an edit, so the old text you reference actually exists on the page.",
      input_schema: {
        type: "object",
        properties: {
          collection: { type: "string", enum: ["pages", "products"] },
          slug: { type: "string" },
        },
        required: ["collection", "slug"],
      },
    },
    {
      name: "propose_edit",
      description:
        "Propose a single precise edit: an exact snippet of the CURRENT text (copied verbatim from what read_content returned) and what it should become. Only call this once you've read the actual content and are quoting it exactly - a snippet that doesn't match exactly will fail. If the request is ambiguous or you haven't found the right page yet, don't call this - ask a clarifying question in plain text instead.",
      input_schema: {
        type: "object",
        properties: {
          collection: { type: "string", enum: ["pages", "products"] },
          slug: { type: "string" },
          field: fieldSchema,
          oldSnippet: { type: "string", description: "Exact text as it currently appears, copied verbatim." },
          newSnippet: { type: "string", description: "The replacement text." },
        },
        required: ["collection", "slug", "field", "oldSnippet", "newSnippet"],
      },
    },
  ];
}

export type InterpretedRequest =
  | {
      kind: "propose";
      collection: ContentCollection;
      slug: string;
      field: string;
      oldSnippet: string;
      newSnippet: string;
    }
  | { kind: "clarify"; message: string };

/**
 * Explicit opt-in only (BOT_MOCK_MODE=true), never automatic on a missing
 * key - see the note on interpretMessage below for why.
 */
async function mockInterpret(text: string, permission: BotPermission): Promise<InterpretedRequest> {
  if (/clarify/i.test(text)) {
    return { kind: "clarify", message: "[mock] Which page did you mean?" };
  }
  const slug = process.env.BOT_MOCK_PAGE_SLUG || "test-page";
  const doc = await getDocumentContent(permission.siteId, "pages", slug);
  const amountMatch = text.match(/\$?\d[\d,]*(\.\d+)?/);
  const newValue = amountMatch ? amountMatch[0] : text.trim() || "(mock value)";
  return {
    kind: "propose",
    collection: "pages",
    slug,
    field: permission.allowedFields[0] ?? "price",
    oldSnippet: doc?.content?.slice(0, 40) || "(mock old text)",
    newSnippet: newValue,
  };
}

export async function interpretMessage(
  text: string,
  permission: BotPermission,
): Promise<InterpretedRequest> {
  if (process.env.BOT_MOCK_MODE === "true") {
    return mockInterpret(text, permission);
  }

  const scopeLine = permission.unrestrictedContentAccess
    ? `You may edit ANY content on the "${permission.siteSlug}" site's pages and products - no field restriction.`
    : `You may only change these kinds of fields: ${permission.allowedFields.join(", ")}.`;

  const systemPrompt = [
    `You help a single city admin update their own website's content via chat, one precise edit at a time.`,
    `This admin manages only the "${permission.siteSlug}" site. ${scopeLine}`,
    `Your ONLY capability, technically, is propose_edit: swapping one exact piece of existing text for a different piece of text on one page or product. That is the entire scope of what you can do.`,
    `You CANNOT delete a page or product, delete a section, remove content entirely, create a new page, change images, change navigation/menus, touch code, touch any other site, or touch any other kind of data (users, orders, customers, settings). None of these are things propose_edit can do, no matter how the request is phrased - a request to delete or remove something is NOT an edit you can attempt, even partially.`,
    `If the admin asks for any of the above, don't call list_content or read_content and don't ask which page - immediately explain in plain text, clearly, that this specific kind of request (deleting, creating, images, navigation, etc.) isn't something you're able to do at all, only text edits, and suggest they contact their developer for that. Be direct - do not sound like you might be able to help if they just clarify further.`,
    `For requests that ARE a text edit but are ambiguous (which page? what exactly should the new text say?), use list_content to find the right page if you're not sure of the slug, and always use read_content to see the CURRENT real text before proposing an edit - never guess at existing wording. Then ask one short clarifying question in plain text instead of guessing, only when the ambiguity is genuinely about which text/page, not about whether the action itself is possible.`,
    `When you propose_edit, oldSnippet must be copied verbatim from what read_content returned, not paraphrased.`,
  ].join(" ");

  const anthropic = client();
  const tools = buildTools(permission);
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: text }];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1536,
      system: systemPrompt,
      tools,
      messages,
    });

    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    const proposeEdit = toolUseBlocks.find((b) => b.name === "propose_edit");
    if (proposeEdit) {
      const input = proposeEdit.input as {
        collection: ContentCollection;
        slug: string;
        field: string;
        oldSnippet: string;
        newSnippet: string;
      };
      return { kind: "propose", ...input };
    }

    if (toolUseBlocks.length === 0) {
      const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === "text");
      return {
        kind: "clarify",
        message: textBlock?.text ?? "Sorry, I didn't understand that - could you rephrase?",
      };
    }

    // Execute list_content / read_content in-process and feed results back.
    messages.push({ role: "assistant", content: response.content });
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      let resultText: string;
      if (block.name === "list_content") {
        const items = await listSiteContent(permission.siteId);
        resultText = JSON.stringify(items.map(({ collection, slug, title }) => ({ collection, slug, title })));
      } else if (block.name === "read_content") {
        const input = block.input as { collection: ContentCollection; slug: string };
        const doc = await getDocumentContent(permission.siteId, input.collection, input.slug);
        resultText = doc ? JSON.stringify({ title: doc.title, content: doc.content }) : "Not found on this site.";
      } else {
        resultText = "Unknown tool.";
      }
      toolResults.push({ type: "tool_result", tool_use_id: block.id, content: resultText });
    }
    messages.push({ role: "user", content: toolResults });
  }

  return { kind: "clarify", message: "Sorry, I couldn't figure that out - could you be more specific about which page and what should change?" };
}
