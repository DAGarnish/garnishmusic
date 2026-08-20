"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Accordion, type AccordionItemData } from "./ui/Accordion";

type Target = {
  container: HTMLElement;
  items: AccordionItemData[];
  variant: "light" | "onDark";
  defaultOpenIds: string[];
};

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}

// The legacy WPBakery [mkd_accordion] shortcode (see wp-shortcode-render.ts)
// renders a jQuery-UI-driven accordion whose title bar is a fixed
// height:60px/line-height:60px box (buro-modules.css) with no responsive
// override - a title long enough to wrap to two lines on a narrow viewport
// overflows that fixed box and visually overlaps the panel below it. Rather
// than patching the shared legacy CSS/JS (used by every page still on the
// old shortcode), this progressively enhances just the pages it's mounted
// on: it reads the already-rendered legacy markup for its title/content
// pairs once mounted, then swaps in the accessible, responsive Accordion
// component in place - the underlying wpRawContent and shared rendering
// pipeline are untouched.
//
// Mounted sitewide (see layout.tsx) - a no-op wherever no
// .mkd-accordion-holder markup exists.
export default function LegacyAccordionUpgrade() {
  const [targets, setTargets] = useState<Target[]>([]);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const usedSlugs = new Set<string>();
    const holders = Array.from(document.querySelectorAll<HTMLElement>(".mkd-accordion-holder"));
    const found: Target[] = holders.map((holder) => {
      const titleEls = Array.from(holder.querySelectorAll<HTMLElement>(":scope > .mkd-title-holder"));
      const defaultOpenIds: string[] = [];
      const items: AccordionItemData[] = titleEls.map((titleEl) => {
        const contentEl = titleEl.nextElementSibling as HTMLElement | null;
        const title = titleEl.querySelector(".mkd-tab-title-inner")?.textContent?.trim() ?? "";
        const innerHtml = contentEl?.querySelector(".mkd-accordion-content-inner")?.innerHTML ?? "";
        // A slug per tab (e.g. "Schedules" -> "schedules") rather than a
        // plain positional index, so a URL fragment like #schedules can
        // link straight to - and auto-open - a specific tab (see the hash
        // check below). Deduped page-wide (not just within this holder) in
        // case two tabs anywhere on the page share a title.
        let id = slugify(title);
        while (usedSlugs.has(id)) id = `${id}-2`;
        usedSlugs.add(id);
        if (id === hash) defaultOpenIds.push(id);
        return {
          id,
          title,
          content: <div dangerouslySetInnerHTML={{ __html: innerHtml }} />,
        };
      });
      // [mkd_accordion color_style="white"] (see wp-shortcode-render.ts) is
      // the dark/photo-background variant - read the marker class before
      // it's cleared below, so the swapped-in Accordion keeps light text
      // instead of defaulting to the light-background dark-gray title color.
      const variant: "light" | "onDark" = holder.classList.contains("mkd-accordion-white") ? "onDark" : "light";
      return { container: holder, items, variant, defaultOpenIds };
    });

    // Clear the legacy markup now that its content has been read out, so
    // the portal below replaces it instead of appending alongside it.
    found.forEach(({ container }) => {
      container.innerHTML = "";
      container.className = "";
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: see CourseScheduleDisclosure for why this must happen post-mount, not during render.
    setTargets(found);
  }, []);

  // The browser's own "scroll to #hash on load" pass runs before this
  // upgrade has mounted anything with that id, so it finds nothing - redo it
  // once the matching tab's trigger button actually exists in the DOM.
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const trigger = document.getElementById(`${hash}-trigger`);
    trigger?.scrollIntoView({ block: "start" });
  }, [targets]);

  return (
    <>
      {targets.map(
        ({ container, items, variant, defaultOpenIds }, i) =>
          items.length > 0 &&
          createPortal(
            <Accordion key={i} items={items} mode="single" variant={variant} defaultOpenIds={defaultOpenIds} />,
            container
          )
      )}
    </>
  );
}
