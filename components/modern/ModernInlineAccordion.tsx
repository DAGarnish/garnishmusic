"use client";

import { useState } from "react";
import ModernAccordionToggleIcon from "./ModernAccordionToggleIcon";

// Shared shell for a single, self-contained accordion bar (accent-colored
// trigger + expand icon) that renders exactly where its caller places it in
// the JSX tree - no portal, no shared "eyebrow/heading" section label above
// it the way ModernAccordionSection's list of items has. Factored out once
// a second caller (ModernCurriculumAccordion) needed the identical shell
// ModernCourseScheduleAccordion already had, rather than duplicating the
// trigger/expand-state logic a second time.
export default function ModernInlineAccordion({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
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
          <span className="gmpm-mono text-xs uppercase">{title}</span>
          <ModernAccordionToggleIcon open={open} />
        </button>
        {open && <div className="p-5">{children}</div>}
      </div>
    </section>
  );
}
