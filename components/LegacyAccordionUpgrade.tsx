"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Accordion, type AccordionItemData } from "./ui/Accordion";

type Target = { container: HTMLElement; items: AccordionItemData[] };

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
// Currently only mounted on the EMP academy page (see page.tsx). Other
// pages still rendering through [mkd_accordion] (course curriculum
// accordions, e.g.) have the same overlap bug and are candidates for the
// same treatment later.
export default function LegacyAccordionUpgrade() {
  const [targets, setTargets] = useState<Target[]>([]);

  useEffect(() => {
    const holders = Array.from(document.querySelectorAll<HTMLElement>(".mkd-accordion-holder"));
    const found: Target[] = holders.map((holder) => {
      const titleEls = Array.from(holder.querySelectorAll<HTMLElement>(":scope > .mkd-title-holder"));
      const items: AccordionItemData[] = titleEls.map((titleEl, i) => {
        const contentEl = titleEl.nextElementSibling as HTMLElement | null;
        const title = titleEl.querySelector(".mkd-tab-title-inner")?.textContent?.trim() ?? "";
        const innerHtml = contentEl?.querySelector(".mkd-accordion-content-inner")?.innerHTML ?? "";
        return {
          id: `${i}`,
          title,
          content: <div dangerouslySetInnerHTML={{ __html: innerHtml }} />,
        };
      });
      return { container: holder, items };
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

  return (
    <>
      {targets.map(
        ({ container, items }, i) =>
          items.length > 0 &&
          createPortal(<Accordion key={i} items={items} mode="single" />, container)
      )}
    </>
  );
}
