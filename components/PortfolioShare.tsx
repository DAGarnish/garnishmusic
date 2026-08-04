"use client";

// Buro theme's per-portfolio-item (course/instructor) social share widget -
// template-level chrome, not part of the shortcode content, so it's built
// here from the doc's own title/url/image rather than coming through
// wpContentToStyledHtml. Confirmed against production (hk's /courses/vocal-
// production/): the exact same six share-popup links, built from the page's
// own title, canonical URL, and featured image.
function encode(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

export default function PortfolioShare({
  title,
  url,
  imageUrl,
}: {
  title: string;
  url: string;
  imageUrl?: string;
}) {
  const t = encode(title);
  const u = encode(url);
  const img = imageUrl ? encode(imageUrl) : "";

  const links: Array<{ className: string; icon: string; open: () => void }> = [
    {
      className: "mkd-facebook-share",
      icon: "social_facebook",
      open: () =>
        window.open(
          `http://www.facebook.com/sharer.php?s=100&p[title]=${t}&p[url]=${u}&p[images][0]=${imageUrl || ""}&p[summary]=`,
          "sharer",
          "toolbar=0,status=0,width=620,height=280"
        ),
    },
    {
      className: "mkd-twitter-share",
      icon: "social_twitter",
      open: () => window.open(`http://twitter.com/home?status=${url}`, "popupwindow", "scrollbars=yes,width=800,height=400"),
    },
    {
      className: "mkd-google_plus-share",
      icon: "social_googleplus",
      open: () => window.open(`https://plus.google.com/share?url=${u}`, "popupwindow", "scrollbars=yes,width=800,height=400"),
    },
    {
      className: "mkd-linkedin-share",
      icon: "social_linkedin",
      open: () =>
        window.open(
          `http://linkedin.com/shareArticle?mini=true&url=${u}&title=${t}`,
          "popupwindow",
          "scrollbars=yes,width=800,height=400"
        ),
    },
    {
      className: "mkd-tumblr-share",
      icon: "social_tumblr",
      open: () =>
        window.open(
          `http://www.tumblr.com/share/link?url=${u}&name=${t}&description=`,
          "popupwindow",
          "scrollbars=yes,width=800,height=400"
        ),
    },
    {
      className: "mkd-pinterest-share",
      icon: "social_pinterest",
      open: () =>
        window.open(
          `http://pinterest.com/pin/create/button/?url=${u}&description=${title}&media=${img}`,
          "popupwindow",
          "scrollbars=yes,width=800,height=400"
        ),
    },
  ];

  return (
    <div className="mkd-portfolio-social">
      <div className="mkd-social-share-holder mkd-list">
        <span className="mkd-social-share-title">Share</span>
        <ul>
          {links.map((link) => (
            <li key={link.className} className={link.className}>
              <a
                className="mkd-share-link"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  link.open();
                }}
              >
                <span className={`mkd-social-network-icon ${link.icon}`}></span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
