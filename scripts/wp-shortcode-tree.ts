// A minimal recursive-descent parser for WPBakery Page Builder shortcodes,
// producing a tree so nested rows/columns can be rendered with the real
// theme's HTML structure (and therefore styled correctly by the real CSS).

export type ShortcodeNode =
  | { type: "tag"; tag: string; attrs: Record<string, string>; children: ShortcodeNode[] }
  | { type: "text"; content: string };

// Tags with no matching closing tag in this theme's shortcode usage.
const VOID_TAGS = new Set([
  "vc_empty_space",
  "mkd_button",
  "vc_single_image",
  "mkd_image_with_text",
  "mkd_section_title",
  "mkd_separator",
  "vc_video",
  "mkd_icon",
  "mkd_portfolio_list",
  "mkd_testimonials",
  "mkd_icon_with_text",
  "rev_slider",
  "sr7",
]);

function parseAttrs(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_][a-zA-Z0-9_]*)="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrString))) {
    attrs[m[1]] = m[2];
  }
  return attrs;
}

const TOKEN_RE = /\[(\/?)([a-zA-Z_][a-zA-Z0-9_]*)([^\]]*)\]/g;

export function parseShortcodes(content: string): ShortcodeNode[] {
  const root: ShortcodeNode = { type: "tag", tag: "__root__", attrs: {}, children: [] };
  const stack: ShortcodeNode[] = [root];

  let lastIndex = 0;
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;

  const pushText = (text: string) => {
    if (text.length === 0) return;
    const parent = stack[stack.length - 1];
    (parent as any).children.push({ type: "text", content: text });
  };

  while ((m = TOKEN_RE.exec(content))) {
    const [full, closingSlash, tag, attrString] = m;
    pushText(content.slice(lastIndex, m.index));
    lastIndex = m.index + full.length;

    if (closingSlash) {
      // closing tag: pop back to matching open tag if found
      for (let i = stack.length - 1; i > 0; i--) {
        if ((stack[i] as any).tag === tag) {
          stack.length = i;
          break;
        }
      }
      continue;
    }

    const node: ShortcodeNode = { type: "tag", tag, attrs: parseAttrs(attrString), children: [] };
    const parent = stack[stack.length - 1];
    (parent as any).children.push(node);

    if (!VOID_TAGS.has(tag)) {
      stack.push(node);
    }
  }
  pushText(content.slice(lastIndex));

  return (root as any).children;
}
