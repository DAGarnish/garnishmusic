'use client';

import React, { useState } from 'react';

// ---------------------------------------------------------------------------
// RAW HTML
// ---------------------------------------------------------------------------
function RawHtmlBlock({ block }: { block: any }) {
  return (
    <div className="mx-auto max-w-3xl w-full">
      <div
        className="raw-html-block text-gray-800"
        dangerouslySetInnerHTML={{ __html: block.html }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ACCORDION
// ---------------------------------------------------------------------------
function AccordionItem({ item }: { item: any }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200">
      <button
        className="group w-full flex items-center justify-between py-5 px-4 text-left font-semibold text-gray-900 transition-colors hover:bg-gray-50 focus:outline-none"
        onClick={() => setOpen(!open)}
      >
        <span className="text-base">{item.title}</span>
        <svg
          className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180 text-[#cc0000]' : 'group-hover:text-[#cc0000]'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-4 pb-6 pt-2 text-gray-700">
          <BlockRenderer blocks={item.blocks} />
        </div>
      </div>
    </div>
  );
}

function AccordionBlock({ block }: { block: any }) {
  return (
    <div className="mx-auto max-w-3xl w-full">
      <div className="my-8 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-200">
          {block.items?.map((item: any, idx: number) => (
            <AccordionItem key={idx} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VIDEO
// ---------------------------------------------------------------------------
function VideoBlock({ block }: { block: any }) {
  return (
    <div className="my-4 aspect-video w-full overflow-hidden rounded-lg">
      <iframe
        className="h-full w-full"
        src={block.link}
        frameBorder="0"
        allowFullScreen
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SECTION TITLE
// ---------------------------------------------------------------------------
function SectionTitleBlock({ block }: { block: any }) {
  return (
    <div className="my-6">
      <h2
        className="text-2xl font-bold text-gray-900"
        style={block.titleColor ? { color: block.titleColor } : {}}
      >
        {block.title}
      </h2>
    </div>
  );
}

// ---------------------------------------------------------------------------
// IMAGE WITH TEXT
// ---------------------------------------------------------------------------
function ImageWithTextBlock({ block }: { block: any }) {
  return (
    <div className="flex flex-col sm:flex-row gap-6 my-6">
      {block.image && (
        <div className="sm:w-1/3 flex-shrink-0">
          <img
            src={`https://s3.us-east-2.amazonaws.com/garnishmusic-media/${block.image}`}
            alt={block.title || ''}
            className="w-full rounded-lg object-cover"
          />
        </div>
      )}
      <div className="flex-1">
        {block.title && (
          <h4 className="text-lg font-bold text-gray-900 mb-2">{block.title}</h4>
        )}
        {block.text && (
          <div
            className="prose prose-sm text-gray-700"
            dangerouslySetInnerHTML={{ __html: block.text }}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PORTFOLIO SLIDER (stub)
// ---------------------------------------------------------------------------
function PortfolioSliderBlock({ block }: { block: any }) {
  return (
    <div className="my-4 rounded-lg bg-gray-100 p-8 text-center text-sm text-gray-500">
      Portfolio Slider
    </div>
  );
}

// ---------------------------------------------------------------------------
// BLOG LIST (stub)
// ---------------------------------------------------------------------------
function BlogListBlock({ block }: { block: any }) {
  return (
    <div className="my-4 rounded-lg bg-gray-100 p-8 text-center text-sm text-gray-500">
      Blog List
    </div>
  );
}

// ---------------------------------------------------------------------------
// COLUMN
// ---------------------------------------------------------------------------
function ColumnBlock({ block }: { block: any }) {
  const widthMap: Record<string, string> = {
    '1/1': 'w-full',
    '1/2': 'w-full sm:w-1/2',
    '1/3': 'w-full sm:w-1/3',
    '2/3': 'w-full sm:w-2/3',
    '1/4': 'w-full sm:w-1/4',
    '3/4': 'w-full sm:w-3/4',
  };
  const widthClass = widthMap[block.width] ?? 'w-full';

  return (
    <div className={`${widthClass} px-4`}>
      <BlockRenderer blocks={block.blocks} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ROW
// ---------------------------------------------------------------------------
function RowBlock({ block }: { block: any }) {
  // Check if this row is practically empty (e.g. only contains empty rawHtml)
  const isPracticallyEmpty = block.columns?.every((col: any) => 
    col.blocks?.every((b: any) => 
      b.blockType === 'rawHtml' && (!b.html || !b.html.trim().replace(/<[^>]*>?/gm, ''))
    )
  );

  if (isPracticallyEmpty) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <div className="flex flex-wrap -mx-4">
        <BlockRenderer blocks={block.columns} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN RENDERER
// ---------------------------------------------------------------------------
export function BlockRenderer({ blocks }: { blocks?: any[] }) {
  if (!blocks || !Array.isArray(blocks)) return null;

  return (
    <>

      {blocks.map((block, i) => {
        switch (block.blockType) {
          case 'row':
            return <RowBlock key={i} block={block} />;
          case 'column':
            return <ColumnBlock key={i} block={block} />;
          case 'rawHtml':
            return <RawHtmlBlock key={i} block={block} />;
          case 'accordion':
            return <AccordionBlock key={i} block={block} />;
          case 'video':
            return <VideoBlock key={i} block={block} />;
          case 'sectionTitle':
            return <SectionTitleBlock key={i} block={block} />;
          case 'imageWithText':
            return <ImageWithTextBlock key={i} block={block} />;
          case 'portfolioSlider':
            return <PortfolioSliderBlock key={i} block={block} />;
          case 'blogList':
            return <BlogListBlock key={i} block={block} />;
          default:
            return (
              <div key={i} className="my-2 rounded border border-red-400 p-2 text-xs text-red-600">
                Unknown block: {block.blockType}
              </div>
            );
        }
      })}
    </>
  );
}
