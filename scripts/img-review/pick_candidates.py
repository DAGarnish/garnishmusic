#!/usr/bin/env python3
"""Score media-library candidates for a post and build a labeled contact
sheet so relevance can be judged visually in one glance instead of N
separate image reads. Usage: pick_candidates.py <post_id> [n]"""
import json
import os
import re
import sys
import subprocess
from PIL import Image, ImageDraw, ImageFont

SCRATCH = "/private/tmp/claude-501/-Users-garnish-Documents-GMP-garnishmusic/0c224173-4a49-4956-8f88-267644b75faf/scratchpad/img-review"
BASE_URL = "http://edu.localhost:3000"

STOPWORDS = {
    "a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "with", "your", "you",
    "is", "are", "how", "what", "why", "do", "does", "at", "it", "its", "part", "1", "2",
    "3", "vs", "our", "we", "i", "my", "this", "that", "from", "by", "as", "be", "up",
    # "Devious Soul" and "Featured" are column/byline categories (an author's
    # pen name and a promotion flag), not topic descriptors - matching on
    # "soul" or "featured" pollutes results with unrelated soul-food-studio
    # photos etc.
    "devious", "soul", "featured", "diaries", "team", "rob", "mills",
}

def tokenize(s):
    return {w for w in re.split(r"[^a-z0-9]+", s.lower()) if w and w not in STOPWORDS and len(w) > 2}


def main():
    post_id = int(sys.argv[1])
    rest = sys.argv[2:]
    override_query = None
    if "--query" in rest:
        qi = rest.index("--query")
        override_query = rest[qi + 1]
        rest = rest[:qi] + rest[qi + 2 :]
    n = int(rest[0]) if rest else 9

    posts = json.load(open(f"{SCRATCH}/posts-needing-images.json"))
    post = next(p for p in posts if p["id"] == post_id)
    if override_query:
        query = tokenize(override_query)
    else:
        query = set()
        query |= tokenize(post["title"])
        for c in post.get("categories", []):
            query |= tokenize(c)
        for t in post.get("tags", []):
            query |= tokenize(t)

    media = json.load(open(f"{SCRATCH}/media-cache.json"))
    scored = []
    for m in media:
        if m["mimeType"] not in ("image/jpeg", "image/png", "image/webp"):
            continue
        w, h = m.get("width") or 0, m.get("height") or 0
        if w < 400 or h < 300:
            continue
        if w / max(h, 1) > 4 or h / max(w, 1) > 4:
            continue
        fn_tokens = tokenize(re.sub(r"-?\d{2,4}x\d{2,4}|-scaled|-e\d+", "", m["filename"]))
        alt_tokens = tokenize(m.get("alt") or "")
        overlap = len(query & (fn_tokens | alt_tokens))
        if overlap > 0:
            scored.append((overlap, m))

    scored.sort(key=lambda x: -x[0])
    top = scored[:n]

    print(f"Post {post_id}: \"{post['title']}\" (categories={post.get('categories')}, tags={post.get('tags')})")
    print(f"Query tokens: {sorted(query)}")
    print(f"Found {len(scored)} candidates with any overlap, showing top {len(top)}:")
    for i, (score, m) in enumerate(top):
        print(f"  [{i}] score={score} id={m['id']} {m['filename']} ({m['width']}x{m['height']})")

    if not top:
        print("NO CANDIDATES FOUND")
        return

    # Download and build contact sheet
    cell = 300
    cols = 3
    rows = (len(top) + cols - 1) // cols
    sheet = Image.new("RGB", (cell * cols, cell * rows), "white")
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 28)
    except Exception:
        font = ImageFont.load_default()

    for i, (score, m) in enumerate(top):
        local_path = f"{SCRATCH}/cand_{m['id']}.jpg"
        if not os.path.exists(local_path):
            subprocess.run(["curl", "-sL", f"{BASE_URL}{m['url']}", "-o", local_path], check=False)
        try:
            img = Image.open(local_path).convert("RGB")
            img.thumbnail((cell - 20, cell - 60))
            x = (i % cols) * cell + (cell - img.width) // 2
            y = (i // cols) * cell + 10
            sheet.paste(img, (x, y))
            label = f"[{i}] id={m['id']}"
            draw.rectangle([(i % cols) * cell, (i // cols) * cell + cell - 45, (i % cols) * cell + cell, (i // cols) * cell + cell], fill="black")
            draw.text(((i % cols) * cell + 10, (i // cols) * cell + cell - 40), label, fill="white", font=font)
        except Exception as e:
            print(f"  (failed to load candidate {i}: {e})")

    out_path = f"{SCRATCH}/sheet_{post_id}.png"
    sheet.save(out_path)
    print(f"Contact sheet: {out_path}")


if __name__ == "__main__":
    main()
