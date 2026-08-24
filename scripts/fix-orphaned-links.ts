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

function text(t: string, format = 0) {
  return { mode: "normal", text: t, type: "text", style: "", detail: 0, format, version: 1 };
}

function link(t: string, url: string) {
  return {
    type: "link",
    version: 3,
    fields: { linkType: "custom", url, newTab: false },
    children: [text(t)],
    direction: "ltr",
    format: "",
    indent: 0,
  };
}

function paragraph(children: any[]) {
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

function flatten(node: any): string {
  const parts: string[] = [];
  (function walk(n: any) {
    if (n.type === "text") parts.push(n.text || "");
    if (Array.isArray(n.children)) n.children.forEach(walk);
  })(node);
  return parts.join("");
}

type Edit =
  | { kind: "replace"; match: string; children: any[] }
  | { kind: "delete"; match: string };

const EDITS: Record<number, Edit[]> = {
  762: [{ kind: "delete", match: "You can watch the video HERE" }],
  710: [
    {
      kind: "replace",
      match: "see what our recent learners had to say HERE",
      children: [
        text("For the best Logic Pro training in the country, look no further that Garnish School Of Sound. But don’t just take our word for it, see "),
        link("our testimonials", "/testimonials/"),
        text(" from past learners!"),
      ],
    },
  ],
  685: [{ kind: "delete", match: "Watch the video HERE" }],
  675: [{ kind: "delete", match: "Watch the video HERE" }],
  673: [
    {
      kind: "replace",
      match: "I have made a video here so you can get a feel of them",
      children: [
        text(
          "Download free drum samples: At Garnish School of Sound, we not only share the knowledge but we share the sample love too, and I decided some time ago that when we get to 173 Facebook fans, I will dish out some free drum samples. Samples I've been collecting and swapping with producers, engineers and programmers from all over the world for over 17 years now. My first of many giveaway free drum samples is a collection of unusual glitchy percussive sounds. I have made a video so you can get a feel of them before you download or map them out if you're not using an EXS 24 compatible sampler. There are a few little EQ tips and tricks for them too. They may not be everyone's cup of tea but they are quite nice quirky sounds, downloadable as wav files. I'd love to know what you think. Next free drum samples up are the horn samples we used in 'Albondigas' You can't hear any horns on the track so I'll tell you where we used them and why we used them and of course, they will be yours to download."
        ),
      ],
    },
    {
      kind: "replace",
      match: "Visit our Facebook page to grab your goodies HERE",
      children: [
        text(
          "Visit our Facebook page to grab your goodies! I have some amazing Kick, snare, hat and shaker I'm thinking about giving away too. I can't say where I got them originally but I have 'made them my own' by processing them through Urei compression and Neve EQ. I'll do a similar video when I have some time and will probably ask you to do me a little favor in return. Watch this space..."
        ),
      ],
    },
  ],
  645: [{ kind: "delete", match: "Watch the video HERE" }],
  639: [
    {
      kind: "replace",
      match: "You can see our Logic classes",
      children: [
        text("You can see "),
        link("our Logic classes and all our other diploma music production courses", "/courses/logic-pro/"),
        text(" here."),
      ],
    },
  ],
  638: [
    {
      kind: "replace",
      match: "Watch how Spectral Blur",
      children: [
        text("Watch how Spectral Blur in Ableton's free sample pack works, and learn more about "),
        link("Sound Design and Synthesis", "/courses/sound-design-synthesis/"),
        text(" in our course."),
      ],
    },
  ],
  633: [
    {
      kind: "replace",
      match: "Audition pre-record performance HERE",
      children: [
        text(
          "I listened to both the pre-recorded audition performance and the live final performance, one after the other, trying not to analyse the vocal tuning too much. The first thing I realise is that overall the performance from the live final seemed to be much better than the pre-recorded and allegedly tampered with audition. Because Auto-tune can tune in real time, why the accusations only for the pre-recorded shows? The performance was so much better in the final so there's more chance they were using it then than the audition anyway! Having said that, Autotune doesn't cope well with vibrato and this big old bird loves a bit of vib. I put the improvement down to her being more relaxed and used to singing in front of an audience. I'm assuming there are endless rounds where everyone has to sing and each week one gets knocked out each week until just a few are left in the final. Does she sing the same song every single week?"
        ),
      ],
    },
  ],
  565: [{ kind: "delete", match: "See a video of Yerosha here." }],
  553: [{ kind: "delete", match: "More on this article, and the opinion of Pro Tools and Ableton user Al Riley here." }],
  177: [
    {
      kind: "replace",
      match: "we just say check out what our past and present learners are up to here",
      children: [
        text(
          "So the question of how we are different is that we tell it like it is and not promise the earth; we don't have a magic wand and nor does anyone else. We don't waffle on about industry connections, we just say check out "
        ),
        link("our testimonials", "/testimonials/"),
        text(" to see what our past and present learners are up to."),
      ],
    },
  ],
};

async function main() {
  const config = (await import(path.resolve("payload.config"))).default;
  const payload = await getPayload({ config });

  for (const [idStr, edits] of Object.entries(EDITS)) {
    const id = Number(idStr);
    const p: any = await payload.findByID({ collection: "posts", id, depth: 0 });
    const children = p.content.root.children;
    let modified = false;

    for (const edit of edits) {
      const idx = children.findIndex((n: any) => n.type === "paragraph" && flatten(n).includes(edit.match));
      if (idx === -1) {
        console.log(`WARN: id=${id} could not find match "${edit.match}"`);
        continue;
      }
      modified = true;
      if (edit.kind === "delete") {
        console.log(`${APPLY ? "APPLY" : "DRY"}: id=${id} delete paragraph matching "${edit.match}"`);
        children.splice(idx, 1);
      } else {
        console.log(`${APPLY ? "APPLY" : "DRY"}: id=${id} replace paragraph matching "${edit.match}"`);
        children[idx] = paragraph(edit.children);
      }
    }

    if (modified && APPLY) {
      await payload.update({ collection: "posts", id, data: { content: p.content } as any });
    }
  }

  console.log(`\n${APPLY ? "Applied" : "Dry run - pass --apply to write"}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
