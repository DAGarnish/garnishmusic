import type { Metadata } from "next";
import Script from "next/script";
import "../globals.css";
import { getCurrentSite } from "../../lib/current-site";
import { Analytics } from "@vercel/analytics/react";
import ConsultationPopup from "../../components/ConsultationPopup";
import { CartProvider } from "../../components/CartContext";

// Loaded as plain blocking <script> tags in <head> (not next/script's
// beforeInteractive strategy) because that strategy's SSR-injection
// mechanism collides with the Suspense boundary that wraps not-found.js,
// silently dropping every theme script on any 404 page. Plain, non-async
// <script> tags in <head> are natively guaranteed to execute in document
// order before the body parses, which is the same ordering guarantee the
// jQuery plugin chain below needs, and are unaffected by Suspense/streaming.
export const themeScripts = [
  "/theme/js/jquery.min.js",
  "/theme/js/jquery-migrate.min.js",
  "/theme/js/modernizr.custom.js",
  "/theme/js/jquery-ui-core.min.js",
  "/theme/js/jquery-ui-tabs.min.js",
  "/theme/js/jquery-ui-accordion.min.js",
  "/theme/js/jquery.blockUI.min.js",
  "/theme/js/hoverIntent.min.js",
  "/theme/js/fluidvids.min.js",
  "/theme/js/jquery.prettyPhoto.min.js",
  "/theme/js/mediaelement-and-player.min.js",
  "/theme/js/mediaelement-migrate.min.js",
  "/theme/js/wp-mediaelement.min.js",
  "/theme/js/jquery.appear.js",
  "/theme/js/jquery.plugin.js",
  "/theme/js/jquery.countdown.min.js",
  "/theme/js/parallax.min.js",
  "/theme/js/easypiechart.js",
  "/theme/js/jquery.waypoints.min.js",
  "/theme/js/Chart.min.js",
  "/theme/js/counter.js",
  "/theme/js/jquery.nicescroll.min.js",
  "/theme/js/ScrollToPlugin.min.js",
  "/theme/js/TweenLite.min.js",
  "/theme/js/underscore.min.js",
  "/theme/js/jquery.mixitup.min.js",
  "/theme/js/jquery.waitforimages.js",
  "/theme/js/jquery.easing.1.3.js",
  "/theme/js/slick.min.js",
  "/theme/js/jquery.hoverdir.js",
];

export const themeScriptsAfterGlobals = ["/theme/js/buro-modules.min.js", "/theme/js/buro-like.min.js"];

// WordPress injects this via wp_localize_script() immediately before
// modules.min.js loads; the theme's JS reads window.mkdGlobalVars /
// mkdPerPageVars unconditionally and throws ReferenceError without it.
// Values are static (not content-specific) - confirmed identical across
// every production page checked.
export const MKD_GLOBAL_VARS_SCRIPT = `var mkdGlobalVars = {"vars":{"mkdAddForAdminBar":0,"mkdElementAppearAmount":-150,"mkdFinishedMessage":"No more posts","mkdLoadingMoreText":"Loading...","mkdMessage":"Loading new posts...","mkdLoadMoreText":"Show More","mkdAddingToCart":"Adding to Cart...","mkdFirstColor":"#ce1713","mkdTopBarHeight":0,"mkdStickyHeaderHeight":0,"mkdStickyHeaderTransparencyHeight":60,"mkdStickyScrollAmount":0,"mkdLogoAreaHeight":0,"mkdMenuAreaHeight":90,"mkdMobileHeaderHeight":100}};
var mkdPerPageVars = {"vars":{"mkdStickyScrollAmount":0,"mkdHeaderTransparencyHeight":90}};`;

export const metadata: Metadata = {
  title: "Garnish Music Production",
  description: "Migrated from WordPress multisite via Payload CMS",
};

// Order matches production's actual <link> sequence (verified against
// live HTML) - matters for cascade when rules share specificity.
// font-awesome.css (local) is deliberately omitted: CDN Font Awesome is
// already loaded above and no icon gap has been found that traces to it;
// adding a second, possibly version-mismatched copy risks new conflicts
// without evidence of benefit. elegant-icons/ionicons/linea-icons/
// linear-icons and buro-style.css were scraped but never wired in here -
// confirmed missing by comparing against production's stylesheet list.
export const themeStylesheets = [
  "/theme/css/buro-style.css",
  "/theme/css/buro-plugins.css",
  "/theme/css/buro-modules.css",
  "/theme/css/elegant-icons.css",
  "/theme/css/ionicons.css",
  "/theme/css/linea-icons.css",
  "/theme/css/linear-icons.css",
  "/theme/css/buro-blog.css",
  "/theme/css/buro-woocommerce.css",
  "/theme/css/buro-woocommerce-responsive.css",
  "/theme/css/buro-modules-responsive.css",
  "/theme/css/buro-blog-responsive.css",
  "/theme/css/buro-dynamic-responsive.css",
  "/theme/css/buro-dynamic.css",
  "/theme/css/js-composer.css",
];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = await getCurrentSite();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Prompt:100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic|Rubik:100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css"
        />
        {themeStylesheets.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
        {/* WordPress Customizer "Additional CSS" (theme_mods custom_css),
           rendered live as <style id="wp-custom-css"> - a per-site, network-
           wide override (e.g. reduced in-content heading sizes: h1-h4) that
           isn't part of any page's own content, so it can't come from
           wp-shortcode-render.ts. Placed right after the theme stylesheets
           to match production's own cascade position. */}
        {site?.customCss && (
          <style id="wp-custom-css" dangerouslySetInnerHTML={{ __html: site.customCss }} />
        )}
      </head>
      <body className="mkd-header-centered mkd-fixed-on-scroll mkd-default-mobile-header mkd-sticky-up-mobile-header mkd-dropdown-default mkd-dark-header mkd-header-style-on-scroll mkd-side-menu-slide-from-right">
        {themeScripts.map((src) => (
          <Script key={src} src={src} strategy="beforeInteractive" />
        ))}
        <Script id="mkd-globals" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: MKD_GLOBAL_VARS_SCRIPT }} />
        {themeScriptsAfterGlobals.map((src) => (
          <Script key={src} src={src} strategy="beforeInteractive" />
        ))}
        <div id="TEST-LAYOUT">HELLO HOT RELOAD</div>
        <CartProvider>
          {children}
          <ConsultationPopup />
          <div id="modal-root"></div>
        </CartProvider>
      </body>
    </html>
  );
}
// trigger rebuild for accordion fix
// trigger rebuild for partner logos scaling
// trigger rebuild for apple logo scaling
// trigger rebuild for centering apple logo
// trigger rebuild for taking out open house on tyo
// trigger rebuild for fixing accordion minus icon
