"use client";

import { useEffect } from "react";

const BANNER_TEXT = "Next Cohorts 👇 Now Enrolling";
const BANNER_CLASS = "next-cohort-banner";

// Schedule rows are tagged with data-cohort-start="YYYY-MM-DD" (see
// add-ableton-cohort-dates.ts) rather than the banner text being placed at a
// fixed spot in the content: this finds whichever row is the next one that
// hasn't started yet at render time, so the banner keeps moving down to the
// next cohort on its own as each start date passes, with no manual edits.
//
// A row can optionally carry data-cohort-banner-html to override the banner
// markup just for that page (see product/electronic-dj-class's "Next 👇🏽
// Class" - add-dj-class-cohort-dates.ts tags every row with the same
// override so whichever one ends up "next" still shows it), without
// changing BANNER_TEXT/BANNER_CLASS's default for every other page using
// this component.
function placeBanner(): boolean {
  const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-cohort-start]"));
  if (rows.length === 0) return false;

  document.querySelectorAll(`.${BANNER_CLASS}`).forEach((el) => el.remove());

  // Pick whichever upcoming row starts soonest, not the first upcoming one
  // in document order - some course pages don't list cohorts in
  // chronological order (letters get reused and re-sorted across years).
  const todayIso = new Date().toISOString().slice(0, 10);
  const nextRow = rows
    .filter((row) => (row.dataset.cohortStart as string) >= todayIso)
    .sort((a, b) => (a.dataset.cohortStart as string).localeCompare(b.dataset.cohortStart as string))[0];
  if (!nextRow) return true;

  const banner = document.createElement("p");
  banner.className = BANNER_CLASS;
  banner.style.fontWeight = "bold";
  banner.style.color = "#ce1713";
  banner.style.fontSize = "1.2rem";
  const overrideHtml = nextRow.dataset.cohortBannerHtml;
  if (overrideHtml) {
    banner.style.textAlign = nextRow.style.textAlign || "left";
    banner.innerHTML = overrideHtml;
  } else {
    banner.style.textAlign = "center";
    banner.textContent = BANNER_TEXT;
  }
  nextRow.before(banner);
  return true;
}

export default function NextCohortBanner() {
  useEffect(() => {
    if (placeBanner()) return;

    // The schedule rows aren't always in the initial DOM: on course pages
    // (as opposed to the product page itself) they arrive via
    // CourseScheduleDisclosure's client-side portal, which only exists
    // after its own effect resolves the portal target one render later.
    // Watch for that instead of assuming either timing.
    const observer = new MutationObserver(() => {
      if (placeBanner()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
