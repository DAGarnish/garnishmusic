"use client";

import { useState } from "react";
import type { Faq } from "../../lib/modern-course-content";

function FaqItem({ faq }: { faq: Faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--gmpm-line)]">
      <button
        className="w-full flex items-center justify-between gap-6 py-5 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="gmpm-display font-bold">{faq.question}</span>
        <span className="gmpm-mono text-[var(--gmpm-accent)] shrink-0">{open ? "−" : "+"}</span>
      </button>
      {open && <p className="pb-5 text-sm text-[var(--gmpm-text-dim)] leading-relaxed">{faq.answer}</p>}
    </div>
  );
}

export default function ModernFaqAccordion({ faqs }: { faqs: Faq[] }) {
  if (!faqs.length) return null;
  return (
    <section className="max-w-[900px] mx-auto px-6 md:px-10 py-16 border-t border-[var(--gmpm-line)]">
      <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-3">FAQ</div>
      <h2 className="gmpm-display font-bold text-2xl md:text-3xl mb-8">Frequently asked questions.</h2>
      <div>
        {faqs.map((faq, i) => (
          <FaqItem key={i} faq={faq} />
        ))}
      </div>
    </section>
  );
}
