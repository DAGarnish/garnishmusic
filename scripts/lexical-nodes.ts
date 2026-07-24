// Hand-built Payload Lexical JSON node constructors.
// Verified against @payloadcms/richtext-lexical 3.86.0 node exportJSON() shapes.

export const TEXT_FORMAT = {
  bold: 1,
  italic: 2,
  strikethrough: 4,
  underline: 8,
  code: 16,
  subscript: 32,
  superscript: 64,
};

let nodeIdCounter = 0;
function nextId(): string {
  nodeIdCounter += 1;
  return `mig_${nodeIdCounter}`;
}

export function textNode(text: string, format = 0) {
  return {
    type: "text",
    text,
    format,
    detail: 0,
    mode: "normal",
    style: "",
    version: 1,
  };
}

export function linebreakNode() {
  return { type: "linebreak", version: 1 };
}

export function paragraphNode(children: any[]) {
  return {
    type: "paragraph",
    children,
    direction: "ltr",
    format: "",
    indent: 0,
    version: 1,
    textFormat: 0,
    textStyle: "",
  };
}

export function headingNode(tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6", children: any[]) {
  return {
    type: "heading",
    tag,
    children,
    direction: "ltr",
    format: "",
    indent: 0,
    version: 1,
  };
}

export function quoteNode(children: any[]) {
  return {
    type: "quote",
    children,
    direction: "ltr",
    format: "",
    indent: 0,
    version: 1,
  };
}

export function listNode(tag: "ul" | "ol", children: any[]) {
  return {
    type: "list",
    tag,
    listType: tag === "ol" ? "number" : "bullet",
    start: 1,
    children,
    direction: "ltr",
    format: "",
    indent: 0,
    version: 1,
  };
}

export function listItemNode(children: any[], value: number) {
  return {
    type: "listitem",
    value,
    children,
    direction: "ltr",
    format: "",
    indent: 0,
    version: 1,
  };
}

export function linkNode(url: string, children: any[], newTab = false) {
  return {
    type: "link",
    version: 3,
    fields: {
      linkType: "custom",
      url,
      newTab,
    },
    children,
    direction: "ltr",
    format: "",
    indent: 0,
  };
}

export function uploadNode(mediaId: number | string) {
  return {
    type: "upload",
    version: 3,
    format: "",
    id: nextId(),
    relationTo: "media",
    value: mediaId,
    fields: {},
  };
}

export function horizontalRuleNode() {
  return { type: "horizontalrule", version: 1 };
}

export function rootDoc(children: any[]) {
  if (children.length === 0) {
    children = [paragraphNode([])];
  }
  return {
    root: {
      type: "root",
      children,
      direction: "ltr",
      format: "",
      indent: 0,
      version: 1,
    },
  };
}
