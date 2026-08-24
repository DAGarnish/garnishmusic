import { getPayload } from "payload";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8").split("\n").forEach((line) => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  });
}

const APPLY = process.argv.includes("--apply");

function flatten(node: any): string {
  const parts: string[] = [];
  (function walk(n: any) {
    if (n.type === "text") parts.push(n.text || "");
    if (Array.isArray(n.children)) n.children.forEach(walk);
  })(node);
  return parts.join("");
}

function videoBlockNode(link: string) {
  return {
    format: "",
    type: "block",
    version: 2,
    fields: {
      id: crypto.randomUUID(),
      blockName: "",
      blockType: "video",
      link,
    },
  };
}

async function main() {
  const config = (await import(path.resolve("payload.config"))).default;
  const payload = await getPayload({ config });

  const res = await payload.find({
    collection: "posts",
    where: { slug: { equals: "360-degree-video-footage-of-a-class" } },
    limit: 1,
    depth: 0,
  });
  const p: any = res.docs[0];
  if (!p) throw new Error("post not found");

  const children = p.content.root.children;
  const arpeggiatorIdx = children.findIndex((n: any) => flatten(n).toLowerCase().includes("arpeggiator"));
  if (arpeggiatorIdx === -1) throw new Error('no paragraph containing "arpeggiator" found');

  const video1 = videoBlockNode("https://www.youtube.com/embed/uL4UKcVkDpI?si=a-l7qAphpZO5Wvhm");
  const video2 = videoBlockNode("https://www.youtube.com/embed/Z-7iz4VJV_M?si=jm3lNpD52PBdhtfW");

  const newChildren = [
    ...children.slice(0, arpeggiatorIdx + 1),
    video1,
    ...children.slice(arpeggiatorIdx + 1),
    video2,
  ];

  console.log(`Post ${p.id} "${p.title}"`);
  console.log(`Inserting video 1 after node ${arpeggiatorIdx} ("${flatten(children[arpeggiatorIdx]).slice(0, 60)}...")`);
  console.log(`Appending video 2 at the end (after ${children.length} existing nodes)`);

  if (APPLY) {
    const newContent = { ...p.content, root: { ...p.content.root, children: newChildren } };
    await payload.update({ collection: "posts", id: p.id, data: { content: newContent } as any });
    console.log("Applied.");
  } else {
    console.log("Dry run - pass --apply to write.");
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
