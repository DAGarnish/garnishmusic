export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "../../../../components/Header";
import Footer from "../../../../components/Footer";
import { getCurrentSite } from "../../../../lib/current-site";
import { getPayloadClient } from "../../../../lib/get-payload";
import CourseAccordion from "./CourseAccordion";

/* -------------------------------------------------------------------------- */
/*  Data fetching                                                              */
/* -------------------------------------------------------------------------- */

async function getPageData() {
  const site = await getCurrentSite();
  if (!site) return null;

  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "pages",
    where: {
      and: [
        { site: { equals: site.id } },
        { slug: { equals: "programs/ableton-producer-program" } },
      ],
    },
    limit: 1,
    depth: 2,
  });

  const doc = result.docs[0];
  if (!doc) return null;
  return { site, doc };
}

/* -------------------------------------------------------------------------- */
/*  Extract accordion data from the Payload layout blocks                      */
/* -------------------------------------------------------------------------- */

function extractAccordionItems(doc: any): { title: string; content: string }[] {
  const layout = doc.layout;
  if (!Array.isArray(layout)) return [];

  for (const row of layout) {
    if (row.blockType !== "row") continue;
    for (const col of row.columns || []) {
      for (const block of col.blocks || []) {
        if (block.blockType === "accordion" && Array.isArray(block.items)) {
          return block.items.map((item: any) => ({
            title: item.title || "",
            content: item.blocks
              ?.map((b: any) => (b.blockType === "rawHtml" ? b.html : ""))
              .join("") || "",
          }));
        }
      }
    }
  }
  return [];
}

/* -------------------------------------------------------------------------- */
/*  Extract the "Why choose Garnish?" content block from layout                */
/* -------------------------------------------------------------------------- */

function extractMainContent(doc: any): string | null {
  const layout = doc.layout;
  if (!Array.isArray(layout)) return null;

  for (const row of layout) {
    if (row.blockType !== "row") continue;
    for (const col of row.columns || []) {
      for (const block of col.blocks || []) {
        if (
          block.blockType === "rawHtml" &&
          typeof block.html === "string" &&
          block.html.includes("Why choose Garnish")
        ) {
          return block.html;
        }
      }
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*  SEO metadata                                                               */
/* -------------------------------------------------------------------------- */

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPageData();
  if (!data) return {};
  const { site, doc } = data;

  const title = `${doc.title} - ${site.name}`;
  const description =
    "A 120-hour Ableton Live music production program. World-class training and mentoring in small groups.";

  return {
    title,
    description,
    metadataBase: new URL(`https://${site.domain}`),
    alternates: {
      canonical: `https://${site.domain}/programs/ableton-producer-program/`,
    },
    openGraph: {
      title,
      description,
      url: `https://${site.domain}/programs/ableton-producer-program/`,
      siteName: site.name,
      type: "website",
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Page component                                                             */
/* -------------------------------------------------------------------------- */

export default async function AbletonProducerProgramPage() {
  const data = await getPageData();
  if (!data) notFound();
  const { site, doc } = data;

  // Hero image: page-level → site default fallback
  const ownImage =
    "titleBackgroundImage" in doc &&
    doc.titleBackgroundImage &&
    typeof doc.titleBackgroundImage === "object"
      ? doc.titleBackgroundImage
      : undefined;
  const siteDefaultImage =
    site.defaultTitleBackgroundImage &&
    typeof site.defaultTitleBackgroundImage === "object"
      ? site.defaultTitleBackgroundImage
      : undefined;
  const heroImage = ownImage ?? siteDefaultImage;

  // Dynamic data from Payload layout blocks
  const accordionItems = extractAccordionItems(doc);
  const mainContentHtml = extractMainContent(doc);

  return (
    <>
      <Header
        menu={site.mainMenu as any}
        currentPath="programs/ableton-producer-program"
        siteDomain={site.domain}
      />

      <main className="w-full min-h-screen bg-white">
        {/* ----------------------------------------------------------------- */}
        {/*  HERO                                                              */}
        {/* ----------------------------------------------------------------- */}
        {heroImage && (
          <section className="relative w-full overflow-hidden bg-black">
            <div className="relative w-full" style={{ aspectRatio: "21/9", minHeight: "320px", maxHeight: "560px" }}>
              <img
                src={(heroImage as any).url}
                alt={doc.title || ""}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: 0.6 }}
              />
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-center leading-tight max-w-4xl drop-shadow-lg">
                  <span
                    className="text-white px-4 py-1 md:px-6 md:py-2 inline"
                    style={{
                      backgroundColor: "#cc0000",
                      boxDecorationBreak: "clone",
                      WebkitBoxDecorationBreak: "clone",
                    }}
                  >
                    {doc.title}
                  </span>
                </h1>
              </div>
            </div>
          </section>
        )}

        {/* ----------------------------------------------------------------- */}
        {/*  MAIN CONTENT                                                      */}
        {/* ----------------------------------------------------------------- */}
        <article className="mx-auto max-w-3xl px-6 py-16 md:py-20">
          {/* "Why choose Garnish?" — rendered from Payload data */}
          {mainContentHtml ? (
            <section
              className="prose prose-lg prose-gray max-w-none
                [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-0 [&_h3]:mb-4
                [&_p]:text-gray-600 [&_p]:leading-relaxed [&_p]:text-[1.05rem]
                [&_strong]:font-bold [&_strong]:text-gray-900
                [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-gray-600 [&_ul]:space-y-1 [&_ul]:text-[1.05rem]
                [&_li]:leading-relaxed
                [&_a]:text-[#cc0000] [&_a]:no-underline hover:[&_a]:underline"
              dangerouslySetInnerHTML={{ __html: mainContentHtml }}
            />
          ) : (
            /* Static fallback if no layout data */
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Why choose Garnish?
              </h2>
              <p className="text-gray-600 leading-relaxed text-[1.05rem]">
                At Garnish, our primary emphasis is on equipping you with the
                essential skills and hands-on experience necessary for a
                successful career in music production.
              </p>
            </section>
          )}

          {/* Divider */}
          <hr className="my-12 border-gray-200" />

          {/* Course Information heading */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8">
            Course Information
          </h2>

          {/* Accordion */}
          {accordionItems.length > 0 && (
            <CourseAccordion items={accordionItems} />
          )}

          {/* CTA */}
          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-6">
              Use the &lsquo;Connect&rsquo; button below to request schedule and
              pricing information. One of our placement experts will follow up
              within a business day.
            </p>
            <a
              href="https://edu.garnishmusicproduction.com/connect"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded bg-[#cc0000] px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#a80000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc0000] focus-visible:ring-offset-2"
            >
              Connect with us
            </a>
            <p className="mt-6 text-sm text-gray-500">
              For one-to-one lessons, see our{" "}
              <a
                href="/courses/private-instruction/"
                className="text-[#cc0000] underline hover:text-red-800"
              >
                Music Production Private Instruction
              </a>{" "}
              page.
            </p>
          </div>
        </article>
      </main>

      <Footer site={site} />
    </>
  );
}
