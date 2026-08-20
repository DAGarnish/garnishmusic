"use client";

import { useEffect } from "react";

const MOBILE_QUERY = "(max-width: 767px)";
const MOBILE_SIDE_MARGIN = "12px";
const SHRINK_THRESHOLD = 24; // px - below this, a row's own margin isn't worth touching

// WPBakery rows carrying their own background-image "card" styling (e.g.
// the curriculum sections on MIA's courses/ableton-live-course, class
// "blured-images-row-inner") get their left/right spacing as inline
// `style="margin-left: 50px !important; margin-right: 50px !important;
// ..."`, copied verbatim from the row's WPBakery css="..." attribute by
// wp-shortcode-render.ts. That's a reasonable "framed card" inset on
// desktop, but there's no responsive variant, and inline !important can't
// be beaten by any stylesheet rule regardless of specificity or its own
// !important (inline declarations sit above every selector-based
// specificity within the same origin/importance tier) - so on a narrow
// phone screen that fixed 50px+50px eats a disproportionate slice of the
// already-scarce width instead of the intended near-edge-to-edge mobile
// layout (see also the .mkd-grid-section .mkd-section-inner fix in
// globals.css, which handles the *outer* container's own equivalent bug -
// this handles the *inner* row's, which is inline and CSS genuinely can't
// touch). Only margin-left/margin-right are touched - vertical spacing and
// everything else on the row (background, border-radius, etc.) is
// untouched, and wp-shortcode-render.ts already separately clamps
// oversized margin-top/margin-bottom for every viewport.
function applyForViewport(isMobile: boolean) {
  const rows = document.querySelectorAll<HTMLElement>(".vc_row[style], .wpb_row[style]");
  for (const row of rows) {
    if (row.dataset.rrmTouched === undefined) {
      const left = parseFloat(row.style.marginLeft) || 0;
      const right = parseFloat(row.style.marginRight) || 0;
      if (left < SHRINK_THRESHOLD && right < SHRINK_THRESHOLD) {
        row.dataset.rrmTouched = "0";
        continue;
      }
      row.dataset.rrmTouched = "1";
      row.dataset.rrmOrigLeft = row.style.marginLeft;
      row.dataset.rrmOrigRight = row.style.marginRight;
    }
    if (row.dataset.rrmTouched !== "1") continue;
    if (isMobile) {
      row.style.setProperty("margin-left", MOBILE_SIDE_MARGIN, "important");
      row.style.setProperty("margin-right", MOBILE_SIDE_MARGIN, "important");
    } else {
      row.style.marginLeft = row.dataset.rrmOrigLeft ?? "";
      row.style.marginRight = row.dataset.rrmOrigRight ?? "";
    }
  }
}

export default function ResponsiveRowMargins() {
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const apply = () => applyForViewport(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    // Some rows arrive later via client-rendered portals (same reasoning as
    // LegacyAccordionUpgrade) - an observer catches those too. Doesn't
    // re-trigger itself: only styles are mutated here, not attributes
    // being watched (childList/subtree only).
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      mq.removeEventListener("change", apply);
      observer.disconnect();
    };
  }, []);

  return null;
}
