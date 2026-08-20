"use client";

import { useEffect } from "react";
import Script from "next/script";

const PAYPAL_CLIENT_ID =
  "BAAUzaMgehCedeDyvY7WIsJ-mSWxROvI_RSV4gW-rZm3CrnRZmZTc0_G2PZsDwr5M9qONFqpuCWU2Pfibg";

const PAYPAL_SDK_SRC = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&components=hosted-buttons&enable-funding=venmo&currency=USD`;

export type PayPalButton = { id: string; title: string };

function renderHostedButtons(buttons: PayPalButton[]) {
  const paypal = (window as any).paypal;
  if (!paypal?.HostedButtons) return;
  for (const { id } of buttons) {
    const container = document.getElementById(`paypal-container-${id}`);
    if (container && !container.hasChildNodes()) {
      paypal.HostedButtons({ hostedButtonId: id }).render(`#paypal-container-${id}`);
    }
  }
}

export default function PayPalHostedButtons({ buttons }: { buttons: PayPalButton[] }) {
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
      <style>{`[id^="paypal-container-"] .item-title { display: none; }`}</style>
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
        onLoad={() => renderHostedButtons(buttons)}
        onReady={() => renderHostedButtons(buttons)}
      />
    </div>
  );
}
