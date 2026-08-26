"use client";

import { useEffect, useState } from "react";
import type { TestimonialItem } from "../../scripts/wp-shortcode-render";

const AUTO_ADVANCE_MS = 6000;

// Sits under the "Our Students Say..." row's own single hand-picked quote
// (Paris Hilton) - the real [mkd_testimonials] widget behind it pulls many
// more reviews than that one card has room for, so this auto-advances
// through them one at a time (cross-fading, like the rest of this design's
// other animated pieces - see ModernTypewriterHeading) rather than listing
// every one out flat.
export default function ModernTestimonialCarousel({ items }: { items: TestimonialItem[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (items.length < 2) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % items.length);
        setVisible(true);
      }, 300);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(interval);
  }, [items.length]);

  if (!items.length) return null;
  const current = items[index];

  function goTo(i: number) {
    setVisible(false);
    setTimeout(() => {
      setIndex(i);
      setVisible(true);
    }, 300);
  }

  return (
    <div className="mt-8 pt-8 border-t border-[var(--gmpm-line)]">
      <div
        className="transition-opacity duration-300 min-h-[140px]"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <p className="text-lg text-[var(--gmpm-text-dim)] leading-relaxed">&ldquo;{current.text.trim()}&rdquo;</p>
        <p className="mt-4 gmpm-mono text-xs uppercase text-[var(--gmpm-accent)]">{current.author}</p>
      </div>
      {items.length > 1 && (
        <div className="flex gap-2 mt-8">
          {items.map((_, i) => (
            <button
              key={i}
              aria-label={`Show testimonial ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-1.5 w-6 transition-colors ${
                i === index ? "bg-[var(--gmpm-accent)]" : "bg-[var(--gmpm-line)]"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
