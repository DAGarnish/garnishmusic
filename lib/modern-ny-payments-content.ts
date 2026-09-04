import type { LegalSection } from "./modern-legal-content";

const S3 = "https://s3.us-east-2.amazonaws.com/garnishmusic-media/";
// Real link everywhere ny's own real pages point "terms" at - ny has no
// /tc/ page of its own (that only exists on edu, see the site.slug ===
// "edu" ["tc", "privacy-policy"] branch in [[...slug]]/page.tsx), so this
// stays an absolute cross-site link exactly as the real site has it,
// same reasoning as "F1 USA Visa Eligible (LA)"'s own absolute la link.
const TERMS_LINK = `<a href="https://edu.garnishmusicproduction.com/tc" target="_blank" rel="noopener">terms</a>`;

// ny's three real payment pages (ids 1480/1494/1457 on ny, site 14) -
// hand-transcribed straight from each page's own real wpRawContent
// (scripts/dump-ny-payment-pages.ts), including the real Zelle/Venmo QR
// code image URLs and the two real, live buy.stripe.com Payment Link URLs.
// None of these fit ModernCoursePage's own shape (no curriculum/pricing-
// card/instructors, just a flat run of heading+paragraph blocks - some with
// an inline QR image), so they render through ModernLegalPage instead, same
// reasoning as edu's /tc/ and /privacy-policy/.
export const NY_PAYMENTS: Record<string, { title: string; heroImageUrl?: string; sections: LegalSection[] }> = {
  payments: {
    title: "Payments",
    sections: [
      {
        heading: "Pay by Zelle",
        bodyHtml: `<p>By paying, you agree to our ${TERMS_LINK}.</p><p><strong>We'd rather give less to big banks and more value to you—so we use Zelle to keep fees lower.</strong></p><p>If you'd prefer to pay by card, you still can through a third-party processor, though they'll add a 3% fee.</p><p>To pay via Zelle, just use the email or QR code below.<br />Questions? Just reach out—we're happy to help.</p><p>ny@garnishmusicproduction.com</p><p><img src="${S3}NY-Zelle-Pay.png" alt="NY Zelle payment QR code" width="260" /></p>`,
      },
      {
        heading: "Prefer to pay by cash or check?",
        bodyHtml:
          "<p>You can deposit directly at any Bank of America branch. Just contact us for our routing and account number if you'd like to go this route.</p>",
      },
      {
        heading: "Need a payment plan?",
        bodyHtml:
          "<p>We offer installment options through a third-party provider. A credit check is required, and a 10% admin fee applies. Get in touch if you're interested.</p>",
      },
      {
        heading: "Important",
        bodyHtml:
          "<p>For legal and logistical reasons, we <em>cannot</em> accept checks, or cash in-person on the day. All payments must be made online or at a Bank of America branch.</p>",
      },
    ],
  },
  pay: {
    title: "Card Payments",
    heroImageUrl: `${S3}KSD_2017.06_Garnish_015-e1579443532851.jpg`,
    sections: [
      {
        heading: "Pay by Venmo",
        bodyHtml: `<p>By paying, you agree to our ${TERMS_LINK}.</p><p>To pay with a credit card, please use our Venmo QR code below or @garnish</p><p><img src="${S3}Venmo-Garnish-Ent.jpg" alt="Venmo QR code, @garnish" width="220" /></p>`,
      },
      {
        heading: "Payment plans",
        bodyHtml: "<p>Contact us if you wish to pay in installments on a payment plan. A 10% admin charge will be added.</p>",
      },
    ],
  },
  "payments-stripe": {
    title: "Payments",
    sections: [
      {
        heading: "Pay by Stripe",
        bodyHtml: `<p>By paying, you agree to our ${TERMS_LINK}.</p><p>For <strong>Early Bird payments</strong> using Stripe, click <a href="https://buy.stripe.com/eVq00lgHJdGc0Eb0KPgnK00" target="_blank" rel="nofollow noopener">here</a>.<br />For <strong>Regular Price payments</strong> using Stripe, click <a href="https://buy.stripe.com/14A14pbnpeKg86D8dhgnK01" target="_blank" rel="nofollow noopener">here</a>.</p>`,
      },
      {
        heading: "Refund Policy",
        bodyHtml:
          "<p>As noted in our terms, cancellations made up to 72 hours before your class start time are subject to a 10% processing fee. No refunds are available within 72 hours of the class start.</p>",
      },
      {
        heading: "Want to save $20?",
        bodyHtml: `<p>We'd rather pass savings to you than to big banks—pay with <strong>Zelle</strong> and take <strong>$20 off</strong> your total!<br />Simply send payment to the email or scan the QR code below.</p><p>ny@garnishmusicproduction.com</p><p><img src="${S3}NY-Zelle-Pay.png" alt="NY Zelle payment QR code" width="260" /></p>`,
      },
      {
        heading: "Prefer to pay by cash or check?",
        bodyHtml:
          "<p>You can deposit directly at any Bank of America branch. Just contact us for our routing and account number if you'd like to go this route.</p>",
      },
      {
        heading: "Need a payment plan?",
        bodyHtml:
          "<p>We offer installment options through a third-party provider. A credit check is required, and a 10% admin fee applies. Get in touch if you're interested.</p>",
      },
      {
        heading: "Important",
        bodyHtml:
          "<p>For legal and logistical reasons, we <em>cannot</em> accept checks, or cash in-person on the day. All payments must be made online or at a Bank of America branch.</p>",
      },
    ],
  },
};
