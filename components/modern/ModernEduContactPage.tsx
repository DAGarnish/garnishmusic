import "../../app/modern-globals.css";
import ModernHeader from "./ModernHeader";
import ModernFooter from "./ModernFooter";
import ModernTypewriterHeading from "./ModernTypewriterHeading";
import { getCityName, getCityAbbr } from "../../lib/modern-site-meta";
import type { MenuNode } from "../menu-html";

// edu's real /connect/ page ("Hello!") - a network-wide inquiry form, not a
// per-city studio address/phone/map like every other modern site's contact
// page (ModernContactPage), so it gets its own component rather than one
// more shape bolted into that one. See extractGoogleFormSrc's own comment
// for what the rest of that page's raw content is (just a "Some of our
// partners" block, already covered elsewhere by ModernPartners on the
// homepage - not repeated here).
export default function ModernEduContactPage({
  site,
  googleFormSrc,
}: {
  site: any;
  googleFormSrc: string | null;
}) {
  return (
    <div className="gmpm-root min-h-screen">
      <ModernHeader menu={site.mainMenu as MenuNode[] | null} cityAbbr={getCityAbbr(site)} siteSlug={site.slug} />

      <section className="gmpm-grid-bg">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-24 pb-16 md:pt-32 md:pb-20">
          <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-6 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-[var(--gmpm-accent)]" />
            Get in touch
          </div>
          <ModernTypewriterHeading
            text="Let's talk music."
            highlight="music"
            className="font-bold text-[13vw] leading-[0.95] md:text-[6vw] md:leading-[0.95] max-w-3xl"
          />
          <p className="mt-6 text-lg text-[var(--gmpm-text-dim)] max-w-xl">
            Tell us a bit about yourself and what you're looking for - one of our placement experts will follow up.
          </p>
        </div>
      </section>

      <section className="max-w-[900px] mx-auto px-6 md:px-10 pb-24">
        {googleFormSrc ? (
          <div className="gmpm-corner">
            <iframe
              src={googleFormSrc}
              width="100%"
              // Google's own embed markup (the raw <iframe> on edu's real
              // page) hardcodes height="3000", padded well past this
              // particular form's real length (confirmed by scrolling the
              // rendered embed - its Submit button lands ~2200px in) -
              // trimmed rather than copied verbatim to avoid a few hundred
              // px of dead space below the button before the footer.
              height="2300"
              // Cross-origin (docs.google.com) - no way to reach into the
              // form's own stylesheet, but mix-blend-multiply still works
              // on the rendered iframe as a whole, the same trick used for
              // reality-dj-class's Paris Hilton screenshot: the form's own
              // white background blends down to this page's real --gmpm-bg
              // cream, while its darker UI (text, the red Submit button,
              // gray borders) keeps its own color. Experimental - untested
              // on a live, interactive embed rather than a static image
              // before this.
              className="mix-blend-multiply"
              style={{ border: 0, display: "block" }}
              title="Contact form"
            >
              Loading…
            </iframe>
          </div>
        ) : (
          <p className="text-[var(--gmpm-text-dim)]">The contact form isn't available right now.</p>
        )}
      </section>

      <ModernFooter siteName={site.name} cityName={getCityName(site)} siteSlug={site.slug} />
    </div>
  );
}
