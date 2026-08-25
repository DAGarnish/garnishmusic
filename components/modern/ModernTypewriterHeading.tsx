"use client";

import { useEffect, useState } from "react";

// Teleprinter-style reveal for landing-page H1s: monospace, one character at
// a time, with a blinking block cursor - matches the technical/DAW-readout
// language the rest of the design system already uses (JetBrains Mono
// labels, the → bullet lists) rather than a generic fade-in.
// Renders the revealed slice of `text`, recoloring whatever part of it
// falls within `highlight` (if given) once that substring has been typed -
// keeps pages like the homepage/contact page's emphasized word (e.g.
// "boutique") accent-colored through the animation instead of losing that
// styling to get the typewriter effect.
function renderRevealed(text: string, count: number, highlight?: string) {
  // A regular trailing space (typing mid-way between two words) is a valid
  // line-break point, and the cursor span right after it has nothing else
  // holding it to the line above - the browser can wrap that space, leaving
  // the cursor alone at the start of the next line. Swapping it for a
  // non-breaking space removes that break opportunity so the cursor always
  // stays glued to the end of the last typed word.
  let revealed = text.slice(0, count);
  if (revealed.endsWith(" ")) revealed = revealed.slice(0, -1) + " ";
  const start = highlight ? text.indexOf(highlight) : -1;
  if (start === -1) return revealed;
  const end = start + (highlight as string).length;
  const before = revealed.slice(0, start);
  const mid = revealed.slice(start, end);
  const after = revealed.slice(end);
  return (
    <>
      {before}
      {mid && <span className="text-[var(--gmpm-accent)]">{mid}</span>}
      {after}
    </>
  );
}

export default function ModernTypewriterHeading({
  text,
  highlight,
  as: Tag = "h1",
  className,
}: {
  text: string;
  highlight?: string;
  as?: "h1" | "h2";
  className?: string;
}) {
  // Resets automatically when `text` changes because callers key this
  // component on the text itself (see ModernCoursePage) - a fresh mount
  // starts count at 0 on its own, so the effect only needs to own the
  // interval, not also assign state synchronously on every run.
  const [count, setCount] = useState(0);

  // The block cursor is itself the visual terminator (it stays lit after
  // the last flash - see .gmpm-typewriter-cursor), so a literal "." right
  // before it reads as a redundant round dot sitting next to the oblong
  // cursor. Dropped from what's actually typed/rendered; the sr-only span
  // below keeps the real, grammatically complete text for screen readers.
  const displayText = text.endsWith(".") ? text.slice(0, -1) : text;

  useEffect(() => {
    if (!displayText) return;
    const interval = setInterval(() => {
      setCount((c) => {
        if (c >= displayText.length) {
          clearInterval(interval);
          return c;
        }
        return c + 1;
      });
    }, 32);
    return () => clearInterval(interval);
  }, [displayText]);

  return (
    <Tag className={`relative ${className ?? ""}`} style={{ fontFamily: "var(--gmpm-font-mono)" }}>
      {/* Reserves the fully-typed text's line count/wrap up front (in-flow,
          same font/size/width), so the animated overlay filling in on top of
          it doesn't reflow the box - and doesn't shift anything below it on
          the page - as the line count grows during typing. Without this, the
          H1 wraps from one line to two mid-animation, a real Cumulative
          Layout Shift. */}
      <span aria-hidden="true" style={{ visibility: "hidden" }}>
        {displayText}
      </span>
      <span aria-hidden="true" className="absolute inset-0">
        {renderRevealed(displayText, count, highlight)}
        <span className="gmpm-typewriter-cursor">█</span>
      </span>
      <span className="sr-only">{text}</span>
    </Tag>
  );
}
