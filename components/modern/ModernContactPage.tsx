import "../../app/modern-globals.css";
import Link from "next/link";
import ModernHeader from "./ModernHeader";
import ModernFooter from "./ModernFooter";
import ModernTypewriterHeading from "./ModernTypewriterHeading";
import { getCityName, getCityAbbr } from "../../lib/modern-site-meta";
import type { MenuNode } from "../menu-html";
import type { ContactDetails } from "../../lib/modern-contact-content";

// One location's "studio info + map" panel. Extracted so a page can stack
// more than one (see `secondContact` below) without duplicating markup.
function ContactLocationBlock({ contact, label }: { contact: ContactDetails; label?: string }) {
  return (
    <section className="max-w-[1400px] mx-auto px-6 md:px-10 pb-24 grid md:grid-cols-2 gap-px bg-[var(--gmpm-line)] border border-[var(--gmpm-line)]">
      <div className="gmpm-corner bg-[var(--gmpm-bg)] p-8 md:p-12 flex flex-col justify-between">
        <div className="space-y-8">
          {contact.address && (
            <div>
              <div className="gmpm-mono text-[10px] uppercase text-[var(--gmpm-text-dim)] mb-2">
                {label || "Studio"}
              </div>
              <div className="text-xl gmpm-display">{contact.address}</div>
            </div>
          )}
          {contact.phone && (
            <div>
              <div className="gmpm-mono text-[10px] uppercase text-[var(--gmpm-text-dim)] mb-2">Phone</div>
              <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="text-xl gmpm-display hover:text-[var(--gmpm-accent)] transition-colors">
                {contact.phone}
              </a>
            </div>
          )}
        </div>

        {contact.ctaLink && (
          <Link
            href={contact.ctaLink}
            target={contact.ctaLink.startsWith("http") ? "_blank" : undefined}
            className="mt-12 inline-block w-fit gmpm-mono text-xs uppercase px-6 py-3 bg-[var(--gmpm-accent)] text-[var(--gmpm-accent-contrast)] font-medium hover:bg-[var(--gmpm-accent-dim)] transition-colors"
          >
            {contact.ctaText || "Send us a message"}
          </Link>
        )}
      </div>

      <div className="bg-[var(--gmpm-bg)] min-h-[360px] min-w-0">
        {contact.mapEmbedSrc && (
          <iframe
            src={contact.mapEmbedSrc}
            className="block w-full h-full min-h-[360px] grayscale invert-[92%] hue-rotate-180"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
      </div>
    </section>
  );
}

export default function ModernContactPage({
  site,
  contact,
  contactLabel,
  secondContact,
  secondContactLabel,
  heroLocationsLabel,
}: {
  site: any;
  contact: ContactDetails;
  // Optional per-location labels (e.g. "Manhattan"/"Brooklyn") - only used
  // when there's a second location to tell apart; single-location callers
  // (every real per-city site) leave these unset and get the original
  // "Studio" label, unchanged.
  contactLabel?: string;
  secondContact?: ContactDetails;
  secondContactLabel?: string;
  // Optional short line shown above the "Let's talk music." heading (e.g.
  // "NYC Locations in Brooklyn & Manhattan") - only used by multi-location
  // pages; unset for every single-location caller, unchanged.
  heroLocationsLabel?: string;
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
          {heroLocationsLabel && (
            <div className="text-lg text-[var(--gmpm-text-dim)] mb-2">{heroLocationsLabel}</div>
          )}
          <ModernTypewriterHeading
            text="Let's talk music."
            highlight="music"
            className="font-bold text-[13vw] leading-[0.95] md:text-[6vw] md:leading-[0.95] max-w-3xl"
          />
        </div>
      </section>

      <ContactLocationBlock contact={contact} label={contactLabel} />
      {secondContact && <ContactLocationBlock contact={secondContact} label={secondContactLabel} />}

      <ModernFooter siteName={site.name} cityName={getCityName(site)} siteSlug={site.slug} />
    </div>
  );
}
