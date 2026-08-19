"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type AccordionItemData = {
  id?: string;
  title: ReactNode;
  content: ReactNode;
};

// WAI-ARIA "Accordion" pattern: each panel toggles from a native <button>
// (free Enter/Space activation + focus handling), plus Up/Down/Home/End to
// move focus between headers without opening them - matches how a sighted
// mouse user can already skim titles before picking one.
export function Accordion({
  items,
  mode = "single",
  defaultOpenIds,
  className,
}: {
  items: AccordionItemData[];
  mode?: "single" | "multiple";
  defaultOpenIds?: string[];
  className?: string;
}) {
  const baseId = useId();
  const ids = items.map((item, i) => item.id ?? `${baseId}-${i}`);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(defaultOpenIds ?? []));
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      if (mode === "single") return prev.has(id) ? new Set() : new Set([id]);
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const focusTrigger = (index: number) => {
    const count = triggerRefs.current.length;
    triggerRefs.current[(index + count) % count]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusTrigger(index + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusTrigger(index - 1);
        break;
      case "Home":
        e.preventDefault();
        focusTrigger(0);
        break;
      case "End":
        e.preventDefault();
        focusTrigger(items.length - 1);
        break;
    }
  };

  return (
    <div className={`divide-y divide-gray-200 ${className ?? ""}`}>
      {items.map((item, i) => {
        const id = ids[i];
        const open = openIds.has(id);
        const panelId = `${id}-panel`;
        const triggerId = `${id}-trigger`;
        return (
          <div key={id}>
            <h3 className="m-0">
              <button
                type="button"
                id={triggerId}
                ref={(el) => {
                  triggerRefs.current[i] = el;
                }}
                className="group flex w-full items-center justify-between gap-4 py-5 px-4 text-left font-semibold text-gray-900 transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cc0000]"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggle(id)}
                onKeyDown={(e) => onKeyDown(e, i)}
              >
                <span className="text-base">{item.title}</span>
                <svg
                  aria-hidden="true"
                  className={`h-5 w-5 flex-shrink-0 text-gray-500 transition-transform duration-200 ${
                    open ? "rotate-180 text-[#cc0000]" : "group-hover:text-[#cc0000]"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              className="grid transition-[grid-template-rows] duration-300 ease-in-out"
              style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <div className="px-4 pb-6 pt-2 text-gray-700">{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
