import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getCurrentSite } from "../lib/current-site";
import {
  themeScripts,
  themeScriptsAfterGlobals,
  themeStylesheets,
  MKD_GLOBAL_VARS_SCRIPT,
} from "./(frontend)/layout";

// Handles truly unmatched URLs (see app/(frontend)/not-found.tsx for the
// route-level 404, used when notFound() is called from within a known
// site/page lookup). This file exists because the app has two separate
// root layouts ((frontend) and (payload)), so Next.js has no single layout
// to compose a normal global 404 from - it falls back to a minimal head
// and patches the real one in via client-side React, which silently drops
// every <script> tag (React never executes script elements it creates
// itself, only ones parsed by the browser from raw SSR HTML - see the
// themeScripts comment in (frontend)/layout.tsx). global-not-found.js
// bypasses that pipeline entirely and returns a real, complete document.

export const metadata: Metadata = {
  title: "Not Found",
  description: "The page you are looking for does not exist.",
};

export default async function GlobalNotFound() {
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
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        {themeStylesheets.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
        {themeScripts.map((src) => (
          <script key={src} src={src} />
        ))}
        <script dangerouslySetInnerHTML={{ __html: MKD_GLOBAL_VARS_SCRIPT }} />
        {themeScriptsAfterGlobals.map((src) => (
          <script key={src} src={src} />
        ))}
      </head>
      <body className="mkd-header-centered mkd-fixed-on-scroll mkd-default-mobile-header mkd-sticky-up-mobile-header mkd-dropdown-default mkd-dark-header mkd-header-style-on-scroll mkd-side-menu-slide-from-right">
        <Header menu={site?.mainMenu as any} />
        <main style={{ padding: "6rem 2rem", textAlign: "center" }}>
          <h1>404</h1>
          <p>This page could not be found.</p>
        </main>
        <Footer site={site} />
      </body>
    </html>
  );
}
