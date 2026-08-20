"use client";

import { useEffect } from "react";
import Script from "next/script";

const PAYPAL_CLIENT_ID =
  "BAAUzaMgehCedeDyvY7WIsJ-mSWxROvI_RSV4gW-rZm3CrnRZmZTc0_G2PZsDwr5M9qONFqpuCWU2Pfibg";

const PAYPAL_SDK_SRC = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&components=hosted-buttons&enable-funding=venmo&currency=USD`;

export type PayPalButton = { id: string; title: string };

function renderHostedButtons(buttons: PayPalButton[], checkoutOnly: boolean) {
  const paypal = (window as any).paypal;
  if (!paypal?.HostedButtons) return;
  for (const { id } of buttons) {
    const container = document.getElementById(`paypal-container-${id}`);
    if (container && !container.hasChildNodes()) {
      const rendered = paypal.HostedButtons({ hostedButtonId: id }).render(`#paypal-container-${id}`);
      if (checkoutOnly) {
        rendered.then(() => {
          // The "Checkout" button (the only one left visible once
          // checkoutOnly hides the "Pay with PayPal" smart button - see the
          // per-container iframe[title="PayPal-paypal"] rule below) is a
          // real <form method="POST" target="_top"> submit button, not SDK-
          // internal navigation - target="_blank" is native, standard form
          // behavior and doesn't touch how PayPal builds/submits the order
          // itself, it only changes which browsing context the response
          // opens in.
          const form = container.querySelector("form");
          if (form) form.target = "_blank";
        });
      }
    }
  }
}

export default function PayPalHostedButtons({
  buttons,
  // Only NY's product/electronic-dj-class buttons should hide "Pay with
  // PayPal" and open Checkout in a new tab (by request) - every other page
  // using this shared component (MIA's course-schedule disclosures, other
  // product pages) keeps PayPal's default two-button, same-tab behavior.
  checkoutOnly = false,
}: {
  buttons: PayPalButton[];
  checkoutOnly?: boolean;
}) {
  useEffect(() => {
    // PayPal's SDK logs this via console.error on button "commit" as internal
    // telemetry, not an actual failure — it fires because Pay Later is
    // deliberately disabled (disable-funding=paylater) above. Patching here,
    // in a real React effect, guarantees it runs on every mount (hard load
    // or client-side navigation), unlike a <script> tag injected via
    // dangerouslySetInnerHTML, which browsers never execute.
    if ((window as any)._paypalConsolePatched) return;
    (window as any)._paypalConsolePatched = true;
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === "string" && args[0].includes("ncps_standalone_paylater_ineligible")) {
        return;
      }
      originalError.apply(console, args as []);
    };
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px 20px", width: "100%" }}>
      {/* PayPal's hosted-button widget renders its own item title above the
          price, duplicating the <h3> title we already render above the
          widget - hide just that title span (not .price-container, which
          shares the same .item-header) so the price and buttons stay put. */}
      <style>{`
        [id^="paypal-container-"] .item-title { display: none; }
        /* DJ Class Early Bird button (id HN8269LYEWPSG, used on both NY's
           product/electronic-dj-class and MIA's courses/electronic-dj-course)
           has a PayPal-configured description ("Enroll more than 14 days
           before class to receive $100 off") that's the only one of its
           kind across every hosted button on the site - hidden by request. */
        #paypal-container-HN8269LYEWPSG .item-description { display: none; }
        ${
          checkoutOnly
            ? buttons
                .map(
                  ({ id }) =>
                    // The "Pay with PayPal" smart button lives in
                    // #js-sdk-container-${id} (a Zoid-managed wrapper around
                    // its own cross-origin iframe, title "PayPal-paypal" -
                    // not something CSS can reach into since it's a
                    // different origin). Hiding the whole wrapper - not just
                    // the iframe inside it - matters because the wrapper
                    // itself carries a ~25px reserved height independent of
                    // its now-hidden child, which otherwise left a dead gap
                    // between the schedule-letter textarea and Checkout.
                    // Scoped to this instance's own container ids (not every
                    // [id^="paypal-container-"] on the page) so only
                    // checkoutOnly instances (NY) hide it. !important
                    // because Zoid actively manages this element's own
                    // inline style (sizing/visibility), which otherwise wins
                    // over a plain display:none here.
                    `#paypal-container-${id} #js-sdk-container-${id} { display: none !important; }
        /* .paypal-buttons-layout's declared margin-top: 32px looks right in
           isolation, but PayPal's own form fields above it (the
           schedule-letter textarea plus a couple of empty, negative-margin
           error-label spans) collapse against it per normal CSS margin-
           collapsing rules, landing the actual visible gap around 51.5px
           instead of 32px. 12.5px here is not a real spacing value - it's
           reverse-engineered so that after collapsing with those fixed
           siblings, the rendered gap comes out to exactly 32px (confirmed
           empirically); it isn't derived from a formula, so if PayPal ever
           changes that surrounding markup this will need re-tuning against
           the live page. */
        #paypal-container-${id} .paypal-buttons-layout.vertical { margin-top: 12.5px !important; }`
                )
                .join("\n")
            : ""
        }
      `}</style>
      <div style={{ width: "100%", maxWidth: "800px" }}>
        <div style={{ display: "flex", gap: 40, flexWrap: "wrap", justifyContent: "center", width: "100%" }}>
          {buttons.map(({ id, title }) => (
            <div
              key={id}
              style={{
                flex: 1,
                minWidth: 250,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>{title}</h3>
              <div id={`paypal-container-${id}`} style={{ width: "100%" }} />
            </div>
          ))}
        </div>
      </div>
      <Script
        src={PAYPAL_SDK_SRC}
        strategy="afterInteractive"
        onLoad={() => renderHostedButtons(buttons, checkoutOnly)}
        onReady={() => renderHostedButtons(buttons, checkoutOnly)}
      />
    </div>
  );
}
