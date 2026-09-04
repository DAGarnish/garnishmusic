import type { ContactDetails } from "./modern-contact-content";

// ny's two real studio locations - hand-transcribed directly off
// ny.garnishmusicproduction.com's own real /contact-map/ and /brooklyn/
// pages (confirmed live, 2026-09-04, before its own cutover archived that
// content as ny-2), including each page's own real Google Maps embed src.
// Both are now rendered together on ny's single /contact-map/ page
// (Manhattan first, then Brooklyn) - see the site.slug === "ny" contact-map
// branch in [[...slug]]/page.tsx.
export const NY_CONTACTS: Record<string, ContactDetails> = {
  "contact-map": {
    address: "421 7th Ave, New York, NY 10001 (Visits by appointment only - direct access from inside Penn Station)",
    phone: "(929) 430-7904",
    ctaText: "Send us a message",
    ctaLink: "https://edu.garnishmusicproduction.com/connect",
    mapEmbedSrc:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.5310591084526!2d-73.99325918945995!3d40.7503430712685!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259bb9dfe871d%3A0x27762c3a92b28750!2s421%207th%20Ave%2C%20New%20York%2C%20NY%2010001%2C%20USA!5e0!3m2!1sen!2suk!4v1696085492853!5m2!1sen!2suk",
  },
  brooklyn: {
    address:
      "342 Livingston Street, Brooklyn, New York, 11217 (Visits by appointment only - short walk from 2, 3, 4, 5, A, C, B, D, F, G, N, Q, R & W trains)",
    phone: "(929) 430-7904",
    ctaText: "Send us a message",
    ctaLink: "https://edu.garnishmusicproduction.com/connect",
    mapEmbedSrc:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3025.381116974657!2d-73.9812302!3d40.6876033!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25bb2e5d5cf51%3A0xb4e5d8a7adb4470a!2s342%20Livingston%20St%2C%20Brooklyn%2C%20NY%2011217%2C%20USA!5e0!3m2!1sen!2suk!4v1668090317026!5m2!1sen!2suk",
  },
};
