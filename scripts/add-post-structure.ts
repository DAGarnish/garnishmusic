import { getPayload } from "payload";
import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8").split("\n").forEach((line) => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  });
}

const APPLY = process.argv.includes("--apply");

export function t(text: string, format = 0) {
  return { mode: "normal", text, type: "text", style: "", detail: 0, format, version: 1 };
}

export function link(text: string, url: string) {
  return {
    type: "link",
    version: 3,
    fields: { linkType: "custom", url, newTab: false },
    children: [t(text)],
    direction: "ltr",
    format: "",
    indent: 0,
  };
}

export function para(text: string, boldTerms: string[] = []) {
  let children: any[];
  if (boldTerms.length === 0) {
    children = [t(text)];
  } else {
    // Bold only the first occurrence of each term - purposeful emphasis on
    // first mention, not every repeat (matches normal editorial bolding).
    let remaining = text;
    children = [];
    while (remaining.length > 0) {
      let earliest: { idx: number; term: string } | null = null;
      for (const term of boldTerms) {
        const idx = remaining.indexOf(term);
        if (idx !== -1 && (earliest === null || idx < earliest.idx)) earliest = { idx, term };
      }
      if (!earliest) {
        children.push(t(remaining));
        break;
      }
      if (earliest.idx > 0) children.push(t(remaining.slice(0, earliest.idx)));
      children.push(t(earliest.term, 1));
      remaining = remaining.slice(earliest.idx + earliest.term.length);
      boldTerms = boldTerms.filter((x) => x !== earliest!.term);
    }
  }
  return {
    type: "paragraph",
    format: "",
    indent: 0,
    version: 1,
    children,
    direction: "ltr",
    textStyle: "",
    textFormat: 0,
  };
}

export function heading(text: string, tag: "h2" | "h3" = "h2") {
  return {
    type: "heading",
    tag,
    format: "",
    indent: 0,
    version: 1,
    children: [t(text)],
    direction: "ltr",
  };
}

export async function applyStructure(id: number, children: any[]) {
  const config = (await import(path.resolve("payload.config"))).default;
  const payload = await getPayload({ config });
  const p: any = await payload.findByID({ collection: "posts", id, depth: 0 });
  const newContent = { ...p.content, root: { ...p.content.root, children } };
  console.log(`${APPLY ? "APPLY" : "DRY"}: id=${id} "${p.title}" -> ${children.length} top-level nodes (${children.filter((c) => c.type === "heading").length} headings)`);
  if (APPLY) {
    await payload.update({ collection: "posts", id, data: { content: newContent } as any });
  }
  process.exit(0);
}
