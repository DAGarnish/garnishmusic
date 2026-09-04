"use client";

import { useState } from "react";
import { stripHardcodedWhiteText, type AccordionModule } from "../../lib/modern-course-content";
import ModernAccordionToggleIcon from "./ModernAccordionToggleIcon";

// Unlike ModernFaqAccordion (plain-text answers, fixed "FAQ" framing), this
// renders real HTML per item (lists, links) under a caller-supplied
// eyebrow/heading - built for la's academy page "Modules" accordion (10
// real curriculum modules, each a bullet list), which isn't a FAQ and
// shouldn't be labeled as one.
function AccordionItem({ item }: { item: AccordionModule }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--gmpm-line)]">
      <button
        className="w-full flex items-center justify-between gap-6 py-5 text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="gmpm-display font-bold">{item.title}</span>
        <ModernAccordionToggleIcon open={open} />
      </button>
      {open && (
        <div
          className="pb-5 prose-modern text-sm text-[var(--gmpm-text-dim)] leading-relaxed [&_a]:text-[var(--gmpm-accent)] [&_strong]:text-[var(--gmpm-text)]"
          dangerouslySetInnerHTML={{ __html: stripHardcodedWhiteText(item.bodyHtml) }}
        />
      )}
    </div>
  );
}

export default function ModernAccordionSection({
  eyebrow,
  heading,
  items,
}: {
  eyebrow: string;
  heading?: string;
  items: AccordionModule[];
}) {
  if (!items.length) return null;
  return (
    <section className="max-w-[900px] mx-auto px-6 md:px-10 py-16 border-t border-[var(--gmpm-line)]">
      <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-3">{eyebrow}</div>
      {heading && <h2 className="gmpm-display font-bold text-2xl md:text-3xl mb-8">{heading}</h2>}
      <div>
        {items.map((item, i) => (
          <AccordionItem key={i} item={item} />
        ))}
      </div>
    </section>
  );
}
