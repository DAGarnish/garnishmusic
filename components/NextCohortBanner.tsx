"use client";

import { useEffect } from "react";

const BANNER_TEXT = "Next Cohorts 👇 Now Enrolling";
const BANNER_CLASS = "next-cohort-banner";

// Schedule rows are tagged with data-cohort-start="YYYY-MM-DD" (see
// add-ableton-cohort-dates.ts) rather than the banner text being placed at a
// fixed spot in the content: this finds whichever row is the next one that
// hasn't started yet at render time, so the banner keeps moving down to the
// next cohort on its own as each start date passes, with no manual edits.
function placeBanner(): boolean {
  const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-cohort-start]"));
  if (rows.length === 0) return false;

  document.querySelectorAll(`.${BANNER_CLASS}`).forEach((el) => el.remove());

  const todayIso = new Date().toISOString().slice(0, 10);
  const nextRow = rows.find((row) => (row.dataset.cohortStart as string) >= todayIso);
  if (!nextRow) return true;

  const banner = document.createElement("p");
  banner.className = BANNER_CLASS;
  banner.style.textAlign = "center";
  banner.style.fontWeight = "bold";
  banner.style.color = "#ce1713";
  banner.style.fontSize = "1.2rem";
  banner.textContent = BANNER_TEXT;
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
