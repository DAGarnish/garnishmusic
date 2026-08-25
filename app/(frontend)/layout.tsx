import type { Metadata } from "next";
import "../globals.css";
import { getCurrentSite } from "../../lib/current-site";
import { Analytics } from "@vercel/analytics/react";
import ConsultationPopup from "../../components/ConsultationPopup";
import { CartProvider } from "../../components/CartContext";
import LegacyAccordionUpgrade from "../../components/LegacyAccordionUpgrade";
import ResponsiveRowMargins from "../../components/ResponsiveRowMargins";

// Loaded as plain blocking <script> tags (not next/script's beforeInteractive
// strategy) because that strategy's SSR-injection mechanism collides with the
// Suspense boundary that wraps not-found.js, silently dropping every theme
// script on any 404 page. Plain, non-async <script> tags are natively
// guaranteed to execute in document order as the browser's own HTML parser
// reaches them (unaffected by Suspense/streaming), which is the ordering
// guarantee the jQuery plugin chain below needs.
//
// Placed at the end of <body> (not in <head>): buro-modules.min.js reads
// `mkd.body = jQuery("body")` synchronously at parse time, not inside a
// document-ready handler. A <head>-placed script runs before the browser has
// parsed <body> at all, so that line captures an empty, permanently-stale
// jQuery selection - silently breaking every feature gated on body classes
// (sticky-on-scroll header, dark-header detection, boxed layout width, etc).
// Running the scripts after <body>'s content has been parsed keeps document
// order intact while guaranteeing document.body already exists.
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

  // pdx is the pilot for a from-scratch design system with none of the
  // migrated WordPress theme's weight: no jQuery/jQuery-UI/Slick/parallax
  // script chain, no buro-*.css, no mkd-* body classes. Scoped to this one
  // site (currently unused by real traffic) so the other 17 sites - which
  // still depend on all of the below for their header/footer/accordion
  // behavior - are completely unaffected.
  if (site?.slug === "pdx") {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Prompt:100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic|Rubik:100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic&display=swap"
        />
        {/* Site's icon rendering (renderIconMarkup in wp-shortcode-render.ts)
           always emits bare v4-style classes ("fa fa-x"), and the static
           scraped header content only uses v4 classes too (fa-angle-right,
           fa-shopping-cart). The footer's social icons block
           (mkd_social_icon_widget in footer.html) is the exception: it uses
           v6 "brands" classes (fa-brands fa-x-twitter, fa-brands
           fa-bluesky, etc.), including icons that don't exist in v4 at all
           (X/Twitter's new glyph, Bluesky) - so the v6 stylesheet must stay
           loaded alongside v4 or those icons render as tofu boxes. */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
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
        <CartProvider>
          {children}
          <ConsultationPopup />
          {/* Progressively upgrades every legacy [mkd_accordion] section
             (any site, any page) into the accessible Accordion component -
             see LegacyAccordionUpgrade for why. Mounted once here rather
             than per-page since it's a no-op wherever no
             .mkd-accordion-holder markup exists. */}
          <LegacyAccordionUpgrade />
          {/* Shrinks WPBakery rows' own oversized inline left/right margins
             (e.g. background-image "card" rows' 50px+50px inset) on narrow
             viewports - see ResponsiveRowMargins for why this can only be
             done in JS, not CSS. Mounted sitewide, a no-op wherever no row
             has a large enough inline margin to touch. */}
          <ResponsiveRowMargins />
          <div id="modal-root"></div>
        </CartProvider>
        {/* eslint-disable @next/next/no-sync-scripts -- intentional: see
           themeScripts' own comment above for why these must block parsing
           in document order rather than load async. */}
        {themeScripts.map((src) => (
          <script key={src} src={src} />
        ))}
        <script id="mkd-globals" dangerouslySetInnerHTML={{ __html: MKD_GLOBAL_VARS_SCRIPT }} />
        {themeScriptsAfterGlobals.map((src) => (
          <script key={src} src={src} />
        ))}
        {/* eslint-enable @next/next/no-sync-scripts */}
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
