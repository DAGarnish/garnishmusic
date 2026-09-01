"use client";

import { useState } from "react";
import PayPalHostedButtons, { type PayPalButton } from "../PayPalHostedButtons";
import { stripHardcodedWhiteText } from "../../lib/modern-course-content";
import ModernAccordionToggleIcon from "./ModernAccordionToggleIcon";

// Modern-theme counterpart to CourseScheduleDisclosure (see that component's
// own comment for why the legacy version needs a client-side portal at
// all - it splices into a raw dangerouslySetInnerHTML blob mid-stream,
// which this design never produces). ModernCoursePage controls exactly
// where this renders in its own JSX tree, so it's just a normal inline
// accordion item - no portal, no target-id slot marker.
//
// bodyHtml comes from the same `products` doc CourseScheduleDisclosure
// reads (courseScheduleConfig.productSlug, see app/(frontend)/[[...slug]]/
// page.tsx), but built with extractParagraphs instead of the legacy
// wpContentToStyledHtml pipeline - that produces wpb_*/mkd-* legacy CSS
// classes with no matching styles loaded on a modern page, so it needs the
// same paragraph extractor every other course-page body section already
// uses instead, not a themed re-skin of the legacy output.
export default function ModernCourseScheduleAccordion({
  bodyHtml,
  paypalButtons,
}: {
  bodyHtml: string;
  paypalButtons?: PayPalButton[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="max-w-[900px] mx-auto px-6 md:px-10 pt-4">
      <div className="border border-[var(--gmpm-line)]">
        <button
          type="button"
          className="w-full flex items-center justify-between gap-4 py-4 px-5 text-left bg-[var(--gmpm-accent)] text-[var(--gmpm-accent-contrast)] font-semibold hover:opacity-90 transition-opacity"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          <span className="gmpm-mono text-xs uppercase">View Course Schedule &amp; Details</span>
          <ModernAccordionToggleIcon open={open} />
        </button>
        {open && (
          <div className="p-5 text-center">
            <div
              className="prose-modern text-[var(--gmpm-text-dim)] leading-relaxed [&_p]:mb-4 [&_a]:text-[var(--gmpm-accent)] [&_strong]:text-[var(--gmpm-text)]"
              dangerouslySetInnerHTML={{ __html: stripHardcodedWhiteText(bodyHtml) }}
            />
            {paypalButtons && paypalButtons.length > 0 && <PayPalHostedButtons buttons={paypalButtons} />}
          </div>
        )}
      </div>
    </section>
  );
}
