"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PayPalHostedButtons from "./PayPalHostedButtons";

// Portals into a slot marked by id inside a larger dangerouslySetInnerHTML
// blob, rather than splicing this markup directly into that raw HTML
// string: splitting a legacy WPBakery-shortcode-converted HTML string mid-
// stream into separate dangerouslySetInnerHTML fragments produces
// unbalanced tags (the split point sits inside several still-open <div>s),
// which the browser silently re-balances differently than the server did -
// a hydration mismatch. Rendering nothing on the server and portaling in
// once mounted sidesteps that entirely.
//
// The portal must wait for a post-mount effect rather than computing the
// target during render (e.g. a useState lazy initializer): the server
// always renders null here (no `document`), so producing the portal
// synchronously on the client's first render - even though the target node
// already exists in the DOM by then - makes that first client render
// disagree with what the server sent, which is itself a hydration mismatch.
// Deferring to an effect guarantees the mismatched first paint has already
// finished reconciling before this ever calls setState.
export default function CourseScheduleDisclosure({ targetId, html }: { targetId: string; html: string }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: see comment above.
    setTarget(document.getElementById(targetId));
  }, [targetId]);

  if (!target) return null;

  return createPortal(
    <details style={{ margin: "0 auto 1rem", maxWidth: 800 }}>
      <summary
        style={{
          cursor: "pointer",
          textAlign: "center",
          fontSize: "1.5rem",
          fontWeight: "bold",
          marginBottom: "1rem",
          color: "#ce1713",
        }}
      >
        View Course Schedule & Details
      </summary>
      <div style={{ padding: "1rem", background: "rgba(0,0,0,0.02)", borderRadius: "8px" }}>
        <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />
        <PayPalHostedButtons />
      </div>
    </details>,
    target
  );
}
