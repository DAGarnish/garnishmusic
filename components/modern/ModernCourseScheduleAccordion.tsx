"use client";

import PayPalHostedButtons, { type PayPalButton } from "../PayPalHostedButtons";
import { stripHardcodedWhiteText } from "../../lib/modern-course-content";
import ModernInlineAccordion from "./ModernInlineAccordion";

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
  return (
    <ModernInlineAccordion title="View Course Schedule & Details">
      <div className="text-center">
        <div
          className="prose-modern text-[var(--gmpm-text-dim)] leading-relaxed [&_p]:mb-4 [&_a]:text-[var(--gmpm-accent)] [&_strong]:text-[var(--gmpm-text)]"
          dangerouslySetInnerHTML={{ __html: stripHardcodedWhiteText(bodyHtml) }}
        />
        {paypalButtons && paypalButtons.length > 0 && <PayPalHostedButtons buttons={paypalButtons} />}
      </div>
    </ModernInlineAccordion>
  );
}
