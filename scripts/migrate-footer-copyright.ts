import { getPayload } from "payload";
import config from "../payload.config";

// Scraped directly from each site's live production homepage (the two
// footer copyright widgets: the site-specific "top" one and the largely
// shared/uncustomized "bottom bar" one). Migrated as-is, including known
// production oddities (pdx shows Berlin's address, sea shows Hong Kong's,
// most sites' bottom bar still has LA's old Melrose Ave address even
// though LA's own top widget has since been updated to a different
// address) - not corrected here, since the goal is parity with what's
// actually live, not what "should" be there.
//
// av, sante, reportotosite: no usable data (av uses a different footer
// template entirely with no split top/bottom; sante and reportotosite
// don't even resolve in DNS) - left null, Footer.tsx falls back to the
// generic default text for these.

const P_STYLE = 'style="color: #fff; margin-left: 10px;"';

function top(inner: string): string {
  return inner;
}

const DATA: Record<string, { top?: string; bottom?: string }> = {
  "bcn.garnishmusicproduction.com": {
    top: `<p ${P_STYLE}>Copyright © Garnish Music Production School Barcelona | Sant Ildefons 52 08030 Barcelona, España</p><p ${P_STYLE}>All rights reserved</p>`,
    bottom: `<p>Copyright © Garnish Music Production School LA, 7600 Melrose Avenue, Los Angeles, California, 90046, USA</p><p>All rights reserved</p>`,
  },
  "ber.garnishmusicproduction.com": {
    top: `<p ${P_STYLE}>Copyright © Garnish Music Production School Berlin | Leuschnerdamm 31. 10999 Berlin, Germany</p><p ${P_STYLE}>All rights reserved</p>`,
    bottom: `<p>Copyright © Garnish Music Production School LA, 7600 Melrose Avenue, Los Angeles, California, 90046, USA</p><p>All rights reserved</p>`,
  },
  "bh.garnishmusicproduction.com": {
    top: `<p ${P_STYLE}>Copyright © Garnish Music Production School, Solent | River Studios, 32 Winsor Road, Bournemouth, Hampshire, SO40 9HQ</p><p ${P_STYLE}>All rights reserved</p>`,
    bottom: `<p>Copyright © Garnish Music Production School LA, 7600 Melrose Avenue, Los Angeles, California, 90046, USA</p><p>All rights reserved</p>`,
  },
  "edu.garnishmusicproduction.com": {
    top: `<p ${P_STYLE}>Copyright © Garnish Music Production School</p><p ${P_STYLE}>All rights reserved</p>`,
    bottom: `<p>Copyright © Garnish Music Production School LA, 7600 Melrose Avenue, Los Angeles, California, 90046, USA</p><p>All rights reserved</p>`,
  },
  "hk.garnishmusicproduction.com": {
    top: `<p ${P_STYLE}>Copyright © Garnish Music Production School HK| 10th floor, Yuen Fat Industrial Building, 25 Wang Chiu Rd., Kowloon Bay, Hong Kong</p><p ${P_STYLE}>All rights reserved</p>`,
    bottom: `<p>Copyright © Garnish Music Production School LA, 7600 Melrose Avenue, Los Angeles, California, 90046, USA</p><p>All rights reserved</p>`,
  },
  "hou.garnishmusicproduction.com": {
    top: `<p ${P_STYLE}>Copyright © Garnish Music Production School</p><p ${P_STYLE}>All rights reserved</p>`,
    bottom: `<p>Copyright © Garnish Music Production School LA, 7600 Melrose Avenue, Los Angeles, California, 90046, USA</p><p>All rights reserved</p>`,
  },
  "la.garnishmusicproduction.com": {
    top: `<p ${P_STYLE}>Copyright © Garnish Music Production School LA | 12435 OXNARD ST, NORTH HOLLYWOOD, CA 91606</p><p ${P_STYLE}>All rights reserved</p>`,
    bottom: `<p>Copyright © Garnish Music Production School LA, 7600 Melrose Avenue, Los Angeles, California, 90046, USA</p><p>All rights reserved</p>`,
  },
  "lis.garnishmusicproduction.com": {
    top: `<p ${P_STYLE}>Copyright © Garnish Music Production School Lisbon | Praceta Domingos Rodrigues 2, 2685-327, Lisboa</p><p ${P_STYLE}>All rights reserved</p>`,
    bottom: `<p>Copyright © Garnish Music Production School LA, 7600 Melrose Avenue, Los Angeles, California, 90046, USA</p><p>All rights reserved</p>`,
  },
  "mia.garnishmusicproduction.com": {
    top: `<p ${P_STYLE}>Copyright © Garnish Music Production School Miami | 1958 NE 147th Terrace, Miami, FL, 33181, USA</p><p ${P_STYLE}>All rights reserved</p>`,
    bottom: `<p>Copyright © Garnish Music Production School LA, 7600 Melrose Avenue, Los Angeles, California, 90046, USA</p><p>All rights reserved</p>`,
  },
  "nsh.garnishmusicproduction.com": {
    top: `<p ${P_STYLE}>Copyright © Garnish Music Production School</p><p ${P_STYLE}>All rights reserved</p>`,
    bottom: `<p>Copyright © Garnish Music Production School</p><p>All rights reserved</p>`,
  },
  "ny.garnishmusicproduction.com": {
    top: `<p ${P_STYLE}>Copyright © Garnish Music Production School.</p><p ${P_STYLE}>All rights reserved</p>`,
    bottom: `<p>Copyright © Garnish Music Production School LA, 7600 Melrose Avenue, Los Angeles, California, 90046, USA</p><p>All rights reserved</p>`,
  },
  "pdx.garnishmusicproduction.com": {
    top: `<p ${P_STYLE}>Copyright © Garnish Music Production School</p><p ${P_STYLE}>All rights reserved</p>`,
    bottom: `<p>Copyright © Garnish Music Production School LA, 7600 Melrose Avenue, Los Angeles, California, 90046, USA</p><p>All rights reserved</p>`,
  },
  "sea.garnishmusicproduction.com": {
    top: `<p ${P_STYLE}>Copyright © Garnish Music Production School HK| 10th floor, Yuen Fat Industrial Building, 25 Wang Chiu Rd., Kowloon Bay, Hong Kong</p><p ${P_STYLE}>All rights reserved</p>`,
    bottom: `<p>Copyright © Garnish Music Production School LA, 7600 Melrose Avenue, Los Angeles, California, 90046, USA</p><p>All rights reserved</p>`,
  },
  "sf.garnishmusicproduction.com": {
    top: `<p ${P_STYLE}>Copyright © Garnish Music Production Sсhool,</p><p ${P_STYLE}>1190 Mission St #902, San Francisco, CA 94103</p><p ${P_STYLE}>All rights reserved</p>`,
    bottom: `<p>Copyright © Garnish Music Production School SF 1190 Mission St #902, San Francisco, CA 94103</p><p>All rights reserved</p>`,
  },
  "sg.garnishmusicproduction.com": {
    top: `<p ${P_STYLE}>Copyright © Garnish Music Production School</p><p ${P_STYLE}>All rights reserved</p>`,
    bottom: `<p>Copyright © Garnish Music Production School</p><p>All rights reserved</p>`,
  },
  "syd.garnishmusicproduction.com": {
    top: `<p style="color: #fff;">Copyright © Garnish Music Production School</p><p style="color: #fff;">All rights reserved</p>`,
    // No bottom-bar widget found on production for syd - left unset.
  },
  "tyo.garnishmusicproduction.com": {
    top: `<p ${P_STYLE}>Copyright © Garnish Music Production School TYO | SeaNestle Inc. 6th floor, 3rd Tamaya Building, 2-15-26 Shinjuku, Shinjuku-ku, Tokyo. JAPAN 〒160-0022</p><p ${P_STYLE}>All rights reserved</p>`,
    bottom: `<p>Copyright © Garnish Music Production School LA, 7600 Melrose Avenue, Los Angeles, California, 90046, USA</p><p>All rights reserved</p>`,
  },
  "www.garnishmusicproduction.com": {
    top: `<p ${P_STYLE}>Copyright © Garnish Music Production School</p><p ${P_STYLE}>All rights reserved</p>`,
    bottom: `<p>Copyright © Garnish Music Production School LA, 7600 Melrose Avenue, Los Angeles, California, 90046, USA</p><p>All rights reserved</p>`,
  },
};

async function main() {
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });

  let updated = 0;
  for (const site of sites.docs as any[]) {
    const data = DATA[site.domain];
    if (!data) {
      console.log(`SKIP ${site.domain} (no scraped data)`);
      continue;
    }
    await payload.update({
      collection: "sites",
      id: site.id,
      data: {
        footerCopyright: data.top ? top(data.top) : undefined,
        footerCopyrightBottom: data.bottom,
      },
    });
    console.log(`UPDATED ${site.domain}`);
    updated++;
  }

  console.log(`\nDONE. Updated: ${updated}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
