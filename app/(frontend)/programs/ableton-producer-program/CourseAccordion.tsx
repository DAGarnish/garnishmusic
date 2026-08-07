"use client";

import React, { useState } from "react";

interface AccordionItem {
  title: string;
  content: string;
}

export default function CourseAccordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-gray-200 border-y border-gray-200">
      {items.map((item, i) => (
        <div key={i}>
          <button
            type="button"
            aria-expanded={openIndex === i}
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 py-5 px-1 text-left transition-colors hover:text-[#cc0000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc0000] focus-visible:ring-offset-2 rounded"
          >
            <span className="text-[1.05rem] font-semibold text-gray-900">
              {item.title}
            </span>
            <svg
              className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-300 ${
                openIndex === i ? "rotate-180 text-[#cc0000]" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <div
            className={`grid transition-all duration-300 ease-in-out ${
              openIndex === i
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div
                className="pb-5 px-1 text-gray-600 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mt-2 [&_ul]:space-y-1 [&_strong]:font-bold [&_strong]:text-gray-900 [&_a]:text-[#cc0000] [&_a]:underline [&_a:hover]:text-red-800"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
