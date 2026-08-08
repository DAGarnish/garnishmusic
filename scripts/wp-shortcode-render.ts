import { parseShortcodes, type ShortcodeNode } from "./wp-shortcode-tree";
import { decodeHTML } from "entities";

export type ImageUrlResolver = (wpAttachmentId: string) => string | undefined;

export type PortfolioItem = {
  title: string;
  href: string;
  imageUrl?: string;
  categoryLabel?: string;
};
export type PortfolioListResolver = (categorySlug: string) => PortfolioItem[];

export type TestimonialItem = {
  author: string;
  text: string;
  imageUrl?: string;
};
export type TestimonialsResolver = (categorySlug: string) => TestimonialItem[];

export type HeroSlideLayer = {
  text?: string;
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: string;
  padding?: string;
};
export type HeroSlide = {
  imageUrl?: string;
  layers?: HeroSlideLayer[];
};
export type HeroSliderResolver = (alias: string) => HeroSlide[];

export type BlogListItem = {
  title: string;
  href: string;
  categoryLabels: string[];
  dateLabel?: string;
  excerpt?: string;
};
export type BlogListResolver = (categoryCsv: string) => BlogListItem[];

export type PartnerItem = {
  imageUrl: string;
  name?: string;
  link?: string;
};

type RenderContext = {
  resolveImage: ImageUrlResolver;
  resolvePortfolioList: PortfolioListResolver;
  resolveTestimonials: TestimonialsResolver;
  resolveHeroSlider: HeroSliderResolver;
  resolveBlogList: BlogListResolver;
  partners: PartnerItem[];
};

// WPBakery's link-picker widget (used by vc_btn and others) stores its
// value as "url:ENCODED|title:ENCODED|target:VALUE", not a bare URL.
function parseWpLink(link: string | undefined): { url?: string; title?: string; target?: string } {
  if (!link) return {};
  const result: Record<string, string> = {};
  for (const part of link.split("|")) {
    const i = part.indexOf(":");
    if (i === -1) continue;
    const key = part.slice(0, i);
    const value = part.slice(i + 1);
    try {
      result[key] = decodeURIComponent(value);
    } catch {
      result[key] = value;
    }
  }
  return result;
}

function widthAttrToCols(width: string | undefined): number {
  if (!width) return 12;
  const m = width.match(/^(\d+)\/(\d+)$/);
  if (!m) return 12;
  const [, num, den] = m;
  return Math.round((12 * parseInt(num, 10)) / parseInt(den, 10));
}

// WPBakery shortcode attribute values (title_text, text, alt, etc.) are
// often already HTML-entity-encoded in the WP database. Decode first so a
// literal "&" doesn't get re-escaped into "&amp;amp;".
function esc(s: string): string {
  return decodeHTML(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderChildren(nodes: ShortcodeNode[], ctx: RenderContext): string {
  return nodes.map((n) => renderNode(n, ctx)).join("");
}

// Covers every YouTube URL shape found in this network's [vc_video link=]
// attributes: watch?v=ID, youtu.be/ID, youtube.com/embed/ID, and
// youtube.com/shorts/ID.
function extractYouTubeId(url: string): string | undefined {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/
  );
  return m ? m[1] : undefined;
}

// Tags WordPress's own wpautop() treats as already block-level, so it
// never wraps them (or their contents) in a <p>.
const AUTOP_BLOCK_TAGS =
  "table|thead|tfoot|caption|col|colgroup|tbody|tr|td|th|div|dl|dd|dt|ul|ol|li|pre|form|blockquote|address|style|p|h[1-6]|hr|fieldset|legend|section|article|aside|header|footer|nav|figure|figcaption|details|summary";
const AUTOP_OPEN_RE = new RegExp(`<(?:${AUTOP_BLOCK_TAGS})(?:\\s[^>]*)?>`, "gi");
const AUTOP_CLOSE_RE = new RegExp(`</(?:${AUTOP_BLOCK_TAGS})>`, "gi");
const AUTOP_STARTS_BLOCK_RE = new RegExp(`^(?:<(?:${AUTOP_BLOCK_TAGS})(?:[\\s>])|</(?:${AUTOP_BLOCK_TAGS})>)`, "i");

// A minimal port of WordPress's wpautop(): raw post_content is exactly
// what a WP author typed in the editor - block tags they added by hand,
// plus plain paragraphs separated by blank lines, relying on WordPress to
// turn a blank line into a paragraph break and a lone newline into a <br>
// at render time. Nothing in this migration replicated that, so every such
// block collapsed into one run-on paragraph with all its internal breaks
// lost (confirmed against production, e.g. /privacy-policy/'s numbered
// sections and lettered sub-points, which are each their own <p> live).
//
// Must run on the whole raw string BEFORE shortcode parsing, exactly like
// WordPress's own filter order (wpautop runs before do_shortcode) - not
// per already-split text node. A single WPBakery <p> commonly wraps a run
// of inline [mkd_icon] shortcodes with plain text between them (e.g. the
// "Shake hands with Ableton / How to Create with MIDI..." bullet lists);
// each in-between text fragment only sees its own tiny slice with no idea
// it's still inside that already-open <p>, so autop'ing per-fragment wraps
// every slice in its own nested <p>, corrupting the layout (confirmed
// against production - courses/logic-pro's bullet list renders as one
// flowing <p> with inline icons and <br>s, not one box per line).
// [shortcode] brackets aren't recognized HTML tags so they never trigger
// the block-tag isolation below, matching how they're inert text to real
// wpautop too - do_shortcode() (i.e. parseShortcodes()) still finds and
// expands them wherever they end up, same as WordPress.
function wpautop(input: string): string {
  let text = input.replace(/\r\n?/g, "\n");
  if (text.trim().length === 0) return "";

  // Blank-line-isolate existing block tags so they split into their own
  // chunk below, instead of getting swallowed into a neighboring <p>.
  text = text.replace(AUTOP_OPEN_RE, (m) => `\n\n${m}`);
  text = text.replace(AUTOP_CLOSE_RE, (m) => `${m}\n\n`);
  text = text.replace(/\n{3,}/g, "\n\n");

  const chunks = text
    .split(/\n[ \t]*\n/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  return chunks
    .map((chunk) => {
      const withBreaks = chunk.replace(/\n/g, "<br />\n");
      return AUTOP_STARTS_BLOCK_RE.test(chunk) ? withBreaks : `<p>${withBreaks}</p>`;
    })
    .join("\n");
}

// WPBakery's "css" attribute holds a full CSS rule the visual builder
// generated, e.g. css=".vc_custom_1753771623607{background-color: #CE1713
// !important;}" - only the declarations inside the {...} are relevant here,
// so extract and apply them as an inline style rather than reproducing the
// auto-generated class name and a separate <style> block.
function vcCssDeclarations(cssAttr: string | undefined): string {
  if (!cssAttr) return "";
  const match = cssAttr.match(/\{([^}]*)\}/);
  return match ? match[1].trim() : "";
}

// Shared by mkd_icon and mkd_icon_with_text - both wrap a font-awesome icon
// in the same .mkd-icon-shortcode/<i> markup, just with different attribute
// names for size/type (mkd_icon: size/type; mkd_icon_with_text:
// icon_size/icon_type) and mkd_icon alone supports icon_color (rendered as
// both a style and a data-color attribute - confirmed against production's
// /ba-pathway-courses/ arrow-icon bullets).
function renderIconMarkup(attrs: Record<string, string>, sizeAttr: string, typeAttr: string): string {
  const iconPack = attrs.icon_pack === "font_awesome" ? "mkd-icon-font-awesome" : "";
  const size = attrs[sizeAttr] || "mkd-icon-medium";
  const type = attrs[typeAttr] || "normal";
  const color = attrs.icon_color;
  const dataColor = color ? ` data-color="${esc(color)}"` : "";
  const iconStyle = color ? `color: ${esc(color)}` : "";
  return `<span class="mkd-icon-shortcode ${esc(type)} ${esc(size)}" ${dataColor}>

        <i class="${iconPack} fa ${esc(attrs.fa_icon || "")} mkd-icon-element" style="${iconStyle}"></i>
            </span>`;
}

function vcCustomStyle(cssAttr: string | undefined): string {
  const declarations = vcCssDeclarations(cssAttr);
  return declarations ? ` style="${esc(declarations)}"` : "";
}

function renderPortfolioList(categorySlug: string | undefined, ctx: RenderContext): string {
  if (!categorySlug) return "";
  const items = ctx.resolvePortfolioList(categorySlug);
  if (items.length === 0) return "";

  const cards = items
    .map((item) => {
      const img = item.imageUrl
        ? `<img loading="lazy" decoding="async" class="attachment-full size-full wp-post-image" src="${esc(item.imageUrl)}" alt="${esc(item.title)}"/>`
        : "";
      const category = item.categoryLabel
        ? `<div class="mkd-ptf-category-holder"><div class="mkd-ptf-category-inner"><h6 class="mkd-ptf-category">${esc(item.categoryLabel)}</h6></div></div>`
        : "";
      return `<article class="mkd-portfolio-item mix">
  <div class="mkd-portfolio-item-inner">
    <a class="mkd-portfolio-link" href="${esc(item.href)}"></a>
    <div class="mkd-item-image-holder"><div class="mkd-item-image-holder-inner">${img}</div></div>
    <div class="mkd-item-text-overlay"><div class="mkd-item-text-overlay-inner"><div class="mkd-item-text-holder">
      <h3 class="mkd-item-title"><a class="mkd-portfolio-title-link" href="${esc(item.href)}">${esc(item.title)}</a></h3>
      ${category}
    </div></div></div>
  </div>
</article>`;
    })
    .join("");

  return `<div class="mkd-portfolio-list-holder-outer mkd-ptf-gallery mkd-ptf-no-space mkd-ptf-hover-follow mkd-ptf-four-columns"><div class="mkd-portfolio-list-holder clearfix">${cards}</div></div>`;
}

// A distinct shortcode from mkd_portfolio_list, not a variant of it - takes
// a comma-separated "category" list (resolved via the same
// PortfolioListResolver, which already splits/dedupes). "portfolios_shown"
// is NOT a total cap despite the name - it's slidesToShow for a real Slick
// carousel: buro-modules.min.js (already loaded via themeScripts, no extra
// wiring needed) auto-inits any ".mkd-portfolio-list-holder-outer.mkd-
// portfolio-slider-holder" it finds, calling .slick() on its
// ".mkd-portfolio-list-holder" child with slidesToShow read straight off
// this wrapper's data-items attribute (confirmed by reading that function
// directly out of the shipped, unminified-by-us buro-modules.min.js). The
// raw shortcode's own server-rendered DOM never has slick-slider/arrow
// markup or a wrapping-grid layout at all - those only exist post-init,
// which is why curl/no-JS inspection of production looks like a bare list.
// Matching that exact class+data-attribute signature is the only thing
// needed to get the same real, working carousel here - no reimplementation.
function renderPortfolioSlider(attrs: Record<string, string>, ctx: RenderContext): string {
  const categoryAttr = attrs.category;
  if (!categoryAttr) return "";
  const slugs = categoryAttr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (slugs.length === 0) return "";

  const seen = new Set<string>();
  const items: PortfolioItem[] = [];
  for (const slug of slugs) {
    for (const item of ctx.resolvePortfolioList(slug)) {
      if (seen.has(item.href)) continue;
      seen.add(item.href);
      items.push(item);
    }
  }
  if (items.length === 0) return "";

  const cards = items
    .map((item) => {
      const img = item.imageUrl
        ? `<img loading="lazy" decoding="async" class="attachment-full size-full wp-post-image" src="${esc(item.imageUrl)}" alt="${esc(item.title)}"/>`
        : "";
      return `<article class="mkd-portfolio-item mix">
  <div class="mkd-portfolio-item-inner">
    <a class="mkd-portfolio-link" href="${esc(item.href)}"></a>
    <div class="mkd-item-image-holder"><div class="mkd-item-image-holder-inner">${img}</div></div>
    <div class="mkd-item-text-overlay"><div class="mkd-item-text-overlay-inner"><div class="mkd-item-text-holder">
      <h3 class="mkd-item-title"><a class="mkd-portfolio-title-link" href="${esc(item.href)}">${esc(item.title)}</a></h3>
    </div></div></div>
  </div>
</article>`;
    })
    .join("");

  // The theme's own CSS only styles the hover text-overlay background under
  // a "-dark"/"-light" suffixed variant of this class (e.g.
  // .mkd-ptf-hover-zoom-out-simple-dark) - production's own server HTML
  // uses the bare, unsuffixed class and relies on the same init JS to add
  // the suffix at runtime. Hardcoding "-dark" here means the overlay is
  // readable even if that particular piece of JS doesn't run, without
  // affecting the slick carousel init (a separate function) either way.
  const items_attr = esc(String(items.length < 4 ? items.length : parseInt(attrs.portfolios_shown || "4", 10) || 4));
  return `<div class="mkd-portfolio-list-holder-outer mkd-ptf-gallery mkd-ptf-no-space mkd-ptf-hover-zoom-out-simple-dark mkd-portfolio-slider-holder" data-items="${items_attr}"><div class="mkd-portfolio-list-holder clearfix">${cards}</div></div>`;
}

// The "Some of our partners" logo strip was copy-pasted as raw WPBakery
// content onto 38 separate pages network-wide, all with the identical 12
// logos/links/order (confirmed against every instance found) - meaning any
// fix or update had to be repeated 38 times, and easily drifted (that's how
// the vc_video center-alignment bug above only showed up on some pages).
// Rendered here from one shared Partners global instead, reusing the exact
// markup shape vc_column_text/vc_row_inner/vc_single_image already produce
// elsewhere in this file, so it matches the theme CSS identically to a
// hand-authored WPBakery row.
function renderPartners(ctx: RenderContext): string {
  if (ctx.partners.length === 0) return "";

  // The real WordPress source (still present verbatim in wpRawContent on
  // every one of the 38 pages this was copy-pasted onto) splits the 12
  // logos across three separate [vc_row_inner el_class="alignment-of-
  // images"] blocks of 4 each, not one row of 12 - confirmed by pulling the
  // raw shortcode source directly (bcn's homepage, the same content bytes
  // this global replaces). That distinction matters here specifically
  // because .alignment-of-images .mkd-section-inner-margin carries a
  // site/page-level custom-CSS rule (display:flex, no wrap) meant to
  // vertically-center exactly 4 same-width flex items per row. Flattening
  // all 12 into one such flex row (as this function used to) doesn't just
  // look different - flex's default no-wrap means those 12 items each
  // claiming 25% width (1200% of the row) get shrunk down to ~8% each
  // instead, visibly crushing all 12 logos into a single illegible strip.
  const rows: string[] = [];
  for (let i = 0; i < ctx.partners.length; i += 4) {
    const rowLogos = ctx.partners
      .slice(i, i + 4)
      .map((p) => {
        const isApple = (p.name || "").toLowerCase().includes("apple") || p.imageUrl.toLowerCase().includes("apple");
        const maxWidth = isApple ? "52%" : "75%";
        const img = `<figure class="wpb_wrapper vc_figure" style="text-align: center; margin: 0;"><img src="${esc(p.imageUrl)}" alt="${esc(p.name || "")}" class="vc_single_image-img" style="max-width: ${maxWidth}; height: auto; margin: 0 auto; display: block;"/></figure>`;
        const linked = p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener noreferrer">${img}</a>` : img;
        return `<div class="wpb_column vc_column_container vc_col-sm-3"><div class="vc_column-inner"><div class="wpb_wrapper">${linked}</div></div></div>`;
      })
      .join("");
    rows.push(
      `<div class="vc_row wpb_row vc_inner vc_row-fluid mkd-section mkd-grid-section mkd-content-aligment-center alignment-of-images"><div class="clearfix mkd-section-inner"><div class="mkd-section-inner-margin clearfix">${rowLogos}</div></div></div>`
    );
  }

  return `<div class="wpb_column vc_column_container vc_col-sm-12"><div class="vc_column-inner"><div class="wpb_wrapper">
  <div class="wpb_text_column wpb_content_element"><div class="wpb_wrapper"><h2 style="text-align:center">Some of our partners</h2></div></div>
  ${rows.join("")}
</div></div></div>`;
}

function renderTestimonials(categoryAttr: string | undefined, ctx: RenderContext): string {
  // The category attribute can itself be a comma-separated list (confirmed
  // against production, e.g. la's /courses/fl-studio-production/ has a
  // second mkd_testimonials instance with
  // category="hit-songwriting,songwriting-music-producer") - each slug is
  // looked up individually via the resolver (which already splits/dedupes
  // multi-instance category sets the same way wp-portfolio-resolver.ts
  // does) and merged into one slide list.
  const slugs = (categoryAttr || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const items: TestimonialItem[] = [];
  for (const slug of slugs.length > 0 ? slugs : [""]) {
    for (const item of ctx.resolveTestimonials(slug)) {
      const key = `${item.author}::${item.text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
    }
  }
  if (items.length === 0) return "";

  // Previously used the wrong heading tag (h2, which inherits the theme's
  // generic 55px heading size instead of h4's ~22px body-copy size) and the
  // wrong wrapper class (.mkd-testimonial-text-outer, which matches no real
  // CSS rule) - confirmed against production's real markup, which renders
  // testimonial quotes as unassumingly-sized body text, not giant headings.
  const slides = items
    .map(
      (item, i) => `<div class="mkd-testimonial-content mkd-testimonials${i}">
    <div class="mkd-testimonial-content-inner">
        <div class="mkd-testimonial-text-holder">
            <div class="mkd-testimonial-text-inner">
                <h4 class="mkd-testimonial-text">${esc(item.text)}</h4>
                <div class="mkd-testimonial-author">
                    <h5 class="mkd-testimonial-author-text">${esc(item.author)}</h5>
                </div>
            </div>
        </div>
    </div>
</div>`
    )
    .join("");

  return `<div class="mkd-testimonials-holder clearfix"><div class="mkd-slick-slider-navigation-style mkd-testimonials mkd-testimonials-type-standard" data-arrows-navigation="false">${slides}</div></div>`;
}

// Wasn't implemented at all - mkd_blog_list (WPBakery's "recent posts from
// these categories" grid) fell through to the default case (render
// children, drop the tag), and since it has no closing tag in this
// theme's usage (it's now in VOID_TAGS, see wp-shortcode-tree.ts) it was
// also silently swallowing whatever content came after it on the page as
// bogus unrendered children. number_of_columns only sets the CSS grid's
// column count - confirmed against production it does NOT cap the number
// of posts shown, every matching post renders. Production also shows every
// category the post itself belongs to, not just whichever one(s) matched
// this widget's own category filter.
function renderBlogList(attrs: Record<string, string>, ctx: RenderContext): string {
  const items = ctx.resolveBlogList(attrs.category || "");
  if (items.length === 0) return "";

  const order = (attrs.order || "ASC").toUpperCase() === "DESC" ? -1 : 1;
  const orderBy = attrs.order_by || "title";
  // WordPress's own posts_per_page default (10) applies whenever this
  // instance doesn't set number_of_posts explicitly - confirmed against
  // production on /courses/mixing-sound-design-film-tv/, whose widget has
  // no number_of_posts attribute at all yet still caps at exactly 10 posts
  // even though its category filter matches 16 in this network's content.
  const postLimit = parseInt(attrs.number_of_posts || "10", 10) || 10;
  const sorted = [...items]
    .sort((a, b) => {
      const av = orderBy === "date" ? a.dateLabel || "" : a.title;
      const bv = orderBy === "date" ? b.dateLabel || "" : b.title;
      return av < bv ? -order : av > bv ? order : 0;
    })
    .slice(0, postLimit);

  // "0" means "don't truncate at all" - confirmed against production on
  // /courses/songwriting/ (text_length="0"), whose excerpts render at full
  // length, not empty. Any positive value truncates as normal.
  const textLength = parseInt(attrs.text_length || "150", 10);
  const columns = attrs.number_of_columns || "4";
  const titleTag = /^h[1-6]$/.test(attrs.title_tag || "") ? attrs.title_tag : "h5";
  // A distinct, much simpler layout from the default "simple" grid - no
  // category/date row, no circular read-more button, no column-count class,
  // just a stacked title+excerpt list - confirmed against production on
  // /courses/songwriting/'s sidebar "From the Blog" widget.
  const isMinimal = attrs.type === "minimal";

  const columnWords: Record<string, string> = { "1": "one", "2": "two", "3": "three", "4": "four" };

  const listItems = sorted
    .map((item) => {
      const excerpt = item.excerpt || "";
      const trimmed =
        textLength > 0 && excerpt.length > textLength ? `${excerpt.slice(0, textLength).trimEnd()}...` : excerpt;
      if (isMinimal) {
        return `<li class="mkd-blog-list-item clearfix">
	<div class="mkd-blog-list-item-inner">
		<div class="mkd-item-text-holder">
			<${titleTag} class="mkd-item-title">
				<a href="${esc(item.href)}">
					${esc(item.title)}				</a>
			</${titleTag}>
							<p class="mkd-excerpt">${esc(trimmed)}</p>
					</div>
	</div>
</li>`;
      }
      return `<li class="mkd-blog-list-item clearfix">
	<div class="mkd-blog-list-item-inner">
				<div class="mkd-item-text-holder">
			<div class="mkd-item-info-section">
				<div class="mkd-post-info-category">
	${item.categoryLabels.map((c) => esc(c)).join(", ")}</div>				<div class="mkd-post-info-date">
			${esc(item.dateLabel || "")}	</div>			</div>

			<${titleTag} class="mkd-item-title">
				<a href="${esc(item.href)}">
					${esc(item.title)}				</a>
			</${titleTag}>

							<p class="mkd-excerpt">${esc(trimmed)}</p>

			<div class="mkd-item-read-more">
				<a href="${esc(item.href)}" target="_self" class="mkd-btn mkd-btn-medium mkd-btn-circled mkd-btn-icon mkd-btn-bckg-hover">	    		<span class="mkd-btn-icon-holder" >			<span aria-hidden="true" class="mkd-icon-font-elegant arrow_right " ></span>		</span>	</a>			</div>
		</div>
	</div>
</li>`;
    })
    .join("");

  const holderClass = isMinimal
    ? "mkd-blog-list-holder mkd-minimal "
    : `mkd-blog-list-holder mkd-simple mkd-${columnWords[columns] || "four"}-columns`;

  return `<div class="${holderClass}">
	<ul class="mkd-blog-list">
	${listItems}</ul>
</div>`;
}

// A pure-CSS crossfade carousel (no JS dependency) using @keyframes with a
// per-slide animation-delay, replacing the commercial Slider Revolution/SR7
// JS engine this content was originally built with. On production the SR7
// module is deferred by WP Rocket until the first user interaction (or a
// long fallback timeout), so a fresh pageview often shows nothing here for
// several seconds - but real visitors do eventually see it, with the exact
// images/text captured in the migrated hero-sliders collection, so it
// renders immediately here rather than trying to reproduce that delay.
// Keyframe percentages depend on slide count, and CSS custom properties
// can't drive keyframe step positions, so we embed a small scoped <style>
// block per instance.
function renderHeroSlider(alias: string | undefined, ctx: RenderContext): string {
  if (!alias) return "";
  const slides = ctx.resolveHeroSlider(alias).filter((s) => s.imageUrl);
  if (slides.length === 0) return "";

  const n = slides.length;
  const slideDuration = 5; // seconds each slide is fully visible
  const fadeDuration = 1; // seconds of crossfade between slides
  const cycle = slideDuration * n;
  const visiblePct = (slideDuration / cycle) * 100;
  const fadeEndPct = ((slideDuration + fadeDuration) / cycle) * 100;
  // Derived from the alias (stable per shortcode instance) rather than a
  // shared mutable counter - a module-level counter produces a different
  // name on each render pass of the same request (Next renders the HTML
  // shell and the RSC payload separately), which caused a hydration
  // mismatch since the two passes disagreed on the animation name.
  const animName = `mkd-hero-fade-${alias.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const slidesHtml = slides
    .map((slide, i) => {
      const delay = i * slideDuration;
      const layersHtml = (slide.layers || [])
        .filter((l) => l.text)
        .map((l) => {
          const text = decodeHTML(l.text!);
          const styleParts = [
            l.color && `color:${esc(l.color)}`,
            l.fontFamily && `font-family:${esc(l.fontFamily)}`,
            l.fontSize && `font-size:${esc(l.fontSize)}`,
            l.backgroundColor && `background-color:${esc(l.backgroundColor)}`,
            l.backgroundColor && `padding:${esc(l.padding || "10px")}`,
          ].filter(Boolean);
          const style = styleParts.length > 0 ? ` style="${styleParts.join("; ")}"` : "";
          return `<div class="mkd-hero-slide-line"${style}>${text}</div>`;
        })
        .join("");
      return `<div class="mkd-hero-slide" style="background-image:url(${esc(slide.imageUrl!)}); animation-name:${animName}; animation-duration:${cycle}s; animation-delay:-${delay}s;">
  ${layersHtml ? `<div class="mkd-hero-slide-text">${layersHtml}</div>` : ""}
</div>`;
    })
    .join("");

  const style = `<style>@keyframes ${animName} { 0% { opacity: 1; } ${visiblePct}% { opacity: 1; } ${fadeEndPct}% { opacity: 0; } 100% { opacity: 0; } }</style>`;

  return `${style}<div class="mkd-hero-slider">${slidesHtml}</div>`;
}

function renderNode(node: ShortcodeNode, ctx: RenderContext): string {
  if (node.type === "text") {
    return node.content;
  }

  const { tag, attrs, children } = node;

  // WPBakery's "Disable this element" toggle keeps the shortcode in
  // post_content (so the client can re-enable it later) but hides it from
  // the live render entirely - confirmed against production, where e.g. the
  // edu homepage's "Categories by Topic" [vc_row disable_element="yes"]
  // gallery block never appears, even though it's still in wpRawContent.
  if (attrs.disable_element === "yes") {
    return "";
  }

  switch (tag) {
    case "vc_row": {
      // WPBakery rows render one of two inner-wrapper structures depending
      // on content_width: the default (full width, edge-to-edge) uses
      // .mkd-full-section-inner with no width constraint; content_width=
      // "grid" (boxed) adds .mkd-grid-section to the row and wraps children
      // in .mkd-section-inner (centered, 1300px) + .mkd-section-inner-margin.
      // Matches the real theme CSS exactly, rather than an ad-hoc guess.
      const isGrid = attrs.content_width === "grid";
      let rowClass = `vc_row wpb_row vc_row-fluid mkd-section${isGrid ? " mkd-grid-section" : ""}`;
      // Visual Composer/WPBakery defaults content_aligment to "left" when the
      // attribute is omitted from the shortcode entirely (confirmed against
      // production: /tc/'s [vc_row] has no content_aligment attribute at all,
      // yet still renders with .mkd-content-aligment-left) - omitting the
      // class outright here left the theme's in-content type scale
      // (h1/h3 sized for a heading badge, not a hero) unapplied, so page
      // headings rendered at the global default hero size instead.
      rowClass += ` mkd-content-aligment-${attrs.content_aligment || "left"}`;
      if (attrs.el_class) rowClass += ` ${attrs.el_class}`;
      // This row is copy-pasted, byte-for-byte, onto 38 pages network-wide
      // as the "Some of our partners" logo strip - render it from the
      // shared Partners global instead of this page's own duplicated
      // children, so every instance stays in sync (see renderPartners).
      const isPartnersRow = (attrs.el_class || "").includes("heading-some-of-our-partners");
      const rowContent = isPartnersRow ? renderPartners(ctx) : renderChildren(children, ctx);
      if (!rowContent.trim()) return "";
      const inner = isGrid
        ? `<div class="clearfix mkd-section-inner"><div class="mkd-section-inner-margin clearfix">${rowContent}</div></div>`
        : `<div class="clearfix mkd-full-section-inner">${rowContent}</div>`;

      // row_type="parallax" rows carry their background as a separate
      // parallax_background_image (media ID) attribute, not through the
      // generic css attribute - confirmed against production's rendered
      // markup (mkd-parallax-section-holder classes + data-mkd-parallax-speed
      // + inline background-image), which our renderer previously ignored
      // entirely, leaving ~49 pages' parallax hero sections blank.
      let extraAttrs = "";
      const declarations = [vcCssDeclarations(attrs.css)];
      if (attrs.row_type === "parallax" && attrs.parallax_background_image) {
        const bgUrl = ctx.resolveImage(attrs.parallax_background_image);
        if (bgUrl) {
          rowClass += " mkd-content-aligment-left mkd-parallax-section-holder mkd-parallax-section-holder-touch-disabled";
          extraAttrs = ` data-mkd-parallax-speed="1"`;
          declarations.push(`background-image:url(${bgUrl})`);
        }
      }
      const style = declarations.filter(Boolean).join(";");

      return `<div class="${rowClass}"${extraAttrs}${style ? ` style="${esc(style)};"` : ""}>${inner}</div>`;
    }

    case "vc_row_inner": {
      // Was previously a stub that ignored content_width="grid", el_class,
      // and content_aligment entirely - unlike vc_row, which already
      // handles grid boxing correctly. Nested grid rows (e.g. the "Our
      // partners" logo grid, [vc_row_inner content_width="grid"
      // content_aligment="center" el_class="alignment-of-images"]) rendered
      // without the .mkd-section-inner/.mkd-grid-section wrapper the theme
      // CSS (and per-page custom CSS keyed off el_class) requires, producing
      // a ragged left-aligned stack instead of the real evenly-spaced grid.
      const rendered = renderChildren(children, ctx);
      if (!rendered.trim()) return "";
      const isGrid = attrs.content_width === "grid";
      let rowClass = `vc_row wpb_row vc_inner vc_row-fluid mkd-section${isGrid ? " mkd-grid-section" : ""}`;
      // Same default as vc_row above - VC/WPBakery defaults to "left" when
      // content_aligment is omitted, it isn't a signal for "no class".
      rowClass += ` mkd-content-aligment-${attrs.content_aligment || "left"}`;
      if (attrs.el_class) rowClass += ` ${attrs.el_class}`;
      const inner = isGrid
        ? `<div class="clearfix mkd-section-inner"><div class="mkd-section-inner-margin clearfix">${rendered}</div></div>`
        : `<div class="clearfix mkd-full-section-inner">${rendered}</div>`;
      return `<div class="${rowClass}"${vcCustomStyle(attrs.css)}>${inner}</div>`;
    }

    case "vc_column":
    case "vc_column_inner": {
      const rendered = renderChildren(children, ctx);
      if (!rendered.trim()) return "";
      const cols = widthAttrToCols(attrs.width);
      // WPBakery's "offset" attribute carries space-separated
      // vc_hidden-xs/sm/md/lg classes for the builder's per-breakpoint
      // "hide on this device" toggle (all four together means hidden at
      // every breakpoint, i.e. unconditionally). This app ships the same
      // theme CSS (js-composer.css) that defines those classes, so passing
      // the attribute straight through as extra classes reproduces
      // WordPress's own hiding behavior - confirmed against production,
      // where courses/ableton-live's superseded old-copy column carries
      // all four classes and never renders, while our migration previously
      // dropped the attribute entirely and showed it as duplicate content.
      const offsetClass = attrs.offset ? ` ${attrs.offset}` : "";
      // el_class was previously dropped entirely - confirmed against
      // production (la's /courses/pro-tools-course/ "Course Highlights"/
      // "Prerequisites" section) that a column's el_class is how page-level
      // custom CSS (e.g. .img-bg-1 p{background-color:white;border-radius:
      // 25px} from the "Simple Custom CSS and JS" plugin output, see
      // backfill-simple-custom-css-js.ts) selects it - without it, the
      // column got its background-image style fine (that comes from the
      // css attribute) but none of the classed rules that give its text a
      // readable background box. vc_col-has-fill mirrors WPBakery's own
      // behavior of auto-adding it whenever a background is set via Design
      // Options (only affects .vc_column-inner's top padding).
      const elClass = attrs.el_class ? ` ${attrs.el_class}` : "";
      const hasFillClass = attrs.css ? " vc_col-has-fill" : "";
      return `<div class="wpb_column vc_column_container vc_col-sm-${cols}${offsetClass}${elClass}${hasFillClass}"${vcCustomStyle(attrs.css)}><div class="vc_column-inner"><div class="wpb_wrapper">${rendered}</div></div></div>`;
    }

    case "vc_column_text": {
      // Real WPBakery output always wraps column text in
      // .wpb_text_column.wpb_content_element > .wpb_wrapper - the theme's
      // CSS keys sizing rules (e.g. img.aligncenter.size-full width) off
      // this wrapper specifically. Previously this rendered bare children
      // with no wrapper at all, so any image dropped straight into a
      // vc_column_text (e.g. the "CONNECT" button on course pages) fell
      // back to a generic img rule that stretches it to 100% of the
      // column's width instead of its natural size - confirmed against
      // production, where the wrapper is always present.
      const rendered = renderChildren(children, ctx);
      if (!rendered.trim()) return "";
      let cls = "wpb_text_column wpb_content_element";
      if (attrs.el_class) cls += ` ${attrs.el_class}`;
      return `<div class="${cls}"${vcCustomStyle(attrs.css)}><div class="wpb_wrapper">${rendered}</div></div>`;
    }

    case "vc_empty_space": {
      // Many pages stack multiple [vc_empty_space] shortcodes between headings.
      // Default height changed from 20px to 0px to prevent huge unintended gaps.
      const height = attrs.height || "0px";
      return `<div class="vc_empty_space" style="height: ${esc(height)}"><span class="vc_empty_space_inner"></span></div>`;
    }

    case "vc_video": {
      // Wasn't handled at all - vc_video is a void tag (see
      // wp-shortcode-tree.ts), so falling through to the default case
      // (render children, drop the wrapper) rendered nothing whatsoever,
      // silently dropping the video (confirmed against production -
      // /electronic-dj-course/'s YouTube embed). WPBakery's "link" attr
      // accepts several YouTube URL shapes (watch?v=, youtu.be/, embed/,
      // and shorts/, seen in this network's own content) - all 553
      // [vc_video] uses sitewide are YouTube, no Vimeo, so only that's
      // handled.
      const videoId = extractYouTubeId(attrs.link || "");
      if (!videoId) return "";
      const aspect = attrs.el_aspect || "169";
      const widthPct = attrs.el_width || "100";
      // WPBakery's real attribute is "align", not "el_align" (which doesn't
      // exist) - the wrong name meant this always fell back to "left",
      // silently dropping every vc_video's actual alignment (confirmed
      // against production: bcn's homepage YouTube embed uses align="center"
      // and .vc_video-align-center's margin:0 auto, from the theme's own
      // bundled js-composer.css, is what centers it there).
      const align = attrs.align || "left";
      return `<div class="wpb_video_widget wpb_content_element vc_clearfix   vc_video-aspect-ratio-${esc(
        aspect
      )} vc_video-el-width-${esc(widthPct)} vc_video-align-${esc(align)}"${vcCustomStyle(
        attrs.css
      )}><div class="wpb_wrapper"><div class="wpb_video_wrapper"><iframe title="YouTube video player" width="500" height="281" src="https://www.youtube.com/embed/${esc(
        videoId
      )}?feature=oembed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div></div></div>`;
    }

    case "vc_btn": {
      // Was entirely unhandled and, worse, not in VOID_TAGS - since vc_btn
      // never has a real closing tag in this theme's usage (its label
      // lives in the "title" attribute, not child content), the parser
      // treated it as an open container, silently absorbing whatever
      // content followed as its own unrendered children until the next
      // enclosing row/column closed. 5,144 uses network-wide - by far the
      // most common shortcode gap found in the whole migration.
      const link = parseWpLink(attrs.link);
      const size = attrs.size || "md";
      const shape = attrs.shape || "rounded";
      const style = attrs.style || "modern";
      const color = attrs.color || "default";
      const target = link.target === "_blank" ? ' target="_blank" rel="noopener noreferrer"' : "";
      const title = link.title || attrs.title || "";
      return `<div class="vc_btn3-container vc_btn3-inline vc_do_btn"><a class="vc_general vc_btn3 vc_btn3-size-${esc(
        size
      )} vc_btn3-shape-${esc(shape)} vc_btn3-style-${esc(style)} vc_btn3-color-${esc(
        color
      )}" href="${esc(link.url || "#")}" title="${esc(title)}"${target}>${esc(
        attrs.title || link.title || ""
      )}</a></div>`;
    }

    case "mkd_button": {
      const bg = attrs.background_color ? ` style="background-color: ${esc(attrs.background_color)}"` : "";
      const target = attrs.target === "_blank" ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${esc(attrs.link || "#")}"${target} class="mkd-btn mkd-btn-medium mkd-btn-solid mkd-btn-bckg-hover"${bg}><span class="mkd-btn-text">${esc(
        attrs.text || ""
      )}</span></a>`;
    }

    case "mkd_section_title": {
      const styleParts: string[] = [];
      if (attrs.text_size) styleParts.push(`font-size: ${attrs.text_size}px`);
      if (attrs.text_align) styleParts.push(`text-align: ${attrs.text_align}`);
      const style = styleParts.length ? ` style="${esc(styleParts.join("; "))}"` : "";
      return `<h2 class="mkd-section-title"${style}>${esc(attrs.title_text || "")}</h2>`;
    }

    case "vc_single_image": {
      const imageId = attrs.image;
      if (!imageId) return "";
      const url = ctx.resolveImage(imageId);
      if (!url) return "";
      const img = `<img src="${esc(url)}" alt="${esc(attrs.title || "")}" class="vc_single_image-img"/>`;
      const wrapped = `<figure class="wpb_wrapper vc_figure">${img}</figure>`;
      if (attrs.link) {
        const target = attrs.img_link_target === "_blank" ? ' target="_blank" rel="noopener noreferrer"' : "";
        return `<a href="${esc(attrs.link)}"${target}>${wrapped}</a>`;
      }
      return wrapped;
    }

    // A distinct shortcode from vc_single_image, not a variant of it -
    // confirmed against production's DOM (e.g. hk's /programs/ableton-
    // producer-program/): renders a static image by default, but reveals a
    // colored ::after overlay + the "title" attribute as text on hover
    // (buro-modules.css owns the hover mechanics network-wide; sites can
    // recolor the overlay via their own customCss, e.g. hk's
    // ".mkd-image-with-text::after{background-color:#CE1713}"). The "link"
    // attribute is optional - the anchor wrapper is omitted entirely when
    // absent (confirmed: the six programme-step icons on this same page
    // have no link, only the sidebar's Yelp widget does).
    case "mkd_image_with_text": {
      const imageId = attrs.image;
      if (!imageId) return "";
      const url = ctx.resolveImage(imageId);
      if (!url) return "";
      const styleParts = [`color: ${attrs.title_color || "#ffffff"}`];
      if (attrs.font_size) styleParts.push(`font-size: ${attrs.font_size}`);
      const linkHtml = attrs.link
        ? `<a class="mkd-iwt-link" href="${esc(attrs.link)}"${
            attrs.target === "_blank" ? ' target="_blank" rel="external noopener noreferrer"' : ""
          }></a>`
        : "";
      return `<div class="mkd-image-with-text">${linkHtml}<div class="mkd-iwt-text"><span class="mkd-iwt-title" style="${esc(
        styleParts.join(";")
      )}">${esc(attrs.title || "")}</span></div><div class="mkd-iwt-image"><img src="${esc(url)}" alt=""/></div></div>`;
    }

    case "mkd_elements_holder": {
      // buro-modules.css natively styles this shortcode as display:table /
      // table-cell (not flex) keyed off a mkd-{number_of_columns} modifier
      // class (e.g. "two-columns" -> "mkd-two-columns") - that's what makes
      // columns stretch to equal height for free. No inline style needed;
      // adding our own flex layout here just fights the theme's own rule.
      const colClass = attrs.number_of_columns ? ` mkd-${esc(attrs.number_of_columns)}` : "";
      return `<div class="mkd-elements-holder${colClass}">${renderChildren(children, ctx)}</div>`;
    }

    case "mkd_elements_holder_item": {
      // The theme sets background-size:cover directly on this element via
      // .mkd-elements-holder-item{background-size:cover} - background_image
      // is meant to be a CSS background-image on the div itself (table-cell
      // display), not an absolutely-positioned <img> child.
      const bgId = attrs.background_image;
      const bgUrl = bgId ? ctx.resolveImage(bgId) : undefined;
      const bgStyle = bgUrl ? ` style="background-image: url(${esc(bgUrl)}); background-position: center;"` : "";
      // item_padding is "top right bottom left" in percent (WPBakery/Mikado
      // convention - percentages are of the column's own width, giving the
      // generous, viewport-scaling gutters production actually has). Only
      // the desktop value is handled; the responsive item_padding_W_H
      // variants would need real media queries to do properly, so at
      // narrower widths content just falls back to no padding rather than
      // the wrong desktop spacing.
      const padding = attrs.item_padding;
      const content = renderChildren(children, ctx);
      const paddedContent = padding
        ? `<div style="padding: ${esc(padding)};">${content}</div>`
        : content;
      return `<div class="mkd-elements-holder-item"${bgStyle}>${paddedContent}</div>`;
    }

    case "vc_raw_html": {
      // WPBakery stores this shortcode's body as base64(urlencode(html)).
      const text = children.map((c) => (c.type === "text" ? c.content : "")).join("");
      let decoded: string;
      try {
        decoded = decodeURIComponent(Buffer.from(text.trim(), "base64").toString("utf-8"));
      } catch {
        return "";
      }
      // Was previously returned bare, with no wrapper at all - confirmed
      // against production this always renders inside .wpb_raw_code
      // .wpb_raw_html.wpb_content_element > .wpb_wrapper, the same
      // .wpb_content_element convention every other WPBakery content module
      // uses (see vc_column_text). Missing it isn't just a markup nicety:
      // globals.css's full-bleed :has() exclusions for hero sliders/
      // portfolio grids key off a module's own wrapper class the same way,
      // so an embed with no wrapper class silently falls through to the
      // generic 1300px "readable article text" max-width rule instead
      // (confirmed against production, ny homepage's full-bleed hero video).
      return `<div class="wpb_raw_code wpb_raw_html wpb_content_element"><div class="wpb_wrapper">${decoded}</div></div>`;
    }

    case "mkd_icon": {
      // Standalone icon (e.g. the red arrow bullets on /ba-pathway-courses/)
      // - previously unhandled and fell to the default case, which renders
      // no children for a void tag, so every one of these ~4,400 icons
      // sitewide simply vanished. Optionally wrapped in a link, per the
      // shortcode's own "link" attribute.
      const icon = renderIconMarkup(attrs, "size", "type");
      return attrs.link
        ? `<a href="${esc(attrs.link)}"${attrs.target === "_blank" ? ' target="_blank" rel="noopener noreferrer"' : ""}>${icon}</a>`
        : icon;
    }

    case "mkd_icon_with_text": {
      // Previously dropped everything but the bare icon - title, the
      // icon's containing markup, and the entire text/bullet-list body
      // (WPBakery stores it as a single "text" attribute with "\n"-joined
      // "• "-prefixed lines, not real <ul><li> children) were all silently
      // lost. Confirmed against production's real markup (e.g. the "Private
      // Instruction" / "In person option" pricing callouts on
      // /private-instruction/) - mkd-iwt-* class suffixes come directly
      // from the icon_position and icon_size attributes.
      const iconSizeSuffix = (attrs.icon_size || "mkd-icon-medium").replace(/^mkd-/, "");
      const positionClass = attrs.icon_position ? ` mkd-iwt-${attrs.icon_position}` : "";
      const text = (attrs.text || "")
        .split("\n")
        .map((line) => esc(line))
        .join("<br />\n");
      return `<div class="mkd-iwt clearfix${positionClass} mkd-iwt-${iconSizeSuffix}">
    <div class="mkd-iwt-content-holder">
        <div class="mkd-iwt-icon-title-holder">
            <div class="mkd-iwt-icon-holder">
    ${renderIconMarkup(attrs, "icon_size", "icon_type")}
            </div>
            <div class="mkd-iwt-title-holder">
                <h5>${esc(attrs.title || "")}</h5>
            </div>
        </div>
        <div class="mkd-iwt-text-holder">
            <p>${text}</p>
        </div>
    </div>
</div>`;
    }

    case "mkd_icon_list_item": {
      // Unlike mkd_icon/mkd_icon_with_text's renderIconMarkup, this
      // shortcode's icon is a single bare <span> (no nested <i>, no
      // "mkd-icon-shortcode" wrapper, no named size class - icon_size is a
      // raw pixel number) - confirmed against production's real markup on
      // www's /contact-map/ address pin icon.
      const iconClass =
        attrs.icon_pack === "font_awesome"
          ? `mkd-icon-font-awesome fa ${esc(attrs.fa_icon || "")}`
          : `mkd-icon-font-elegant ${esc(attrs.fe_icon || "")}`;
      const styleParts: string[] = [];
      if (attrs.icon_color) styleParts.push(`color:${attrs.icon_color}`);
      if (attrs.icon_size) styleParts.push(`font-size:${attrs.icon_size}px`);
      const style = styleParts.length ? ` style="${esc(styleParts.join(";"))}"` : "";
      return `<div class="mkd-icon-list-item">
	<div class="mkd-icon-list-icon-holder">
        <div class="mkd-icon-list-icon-holder-inner clearfix">
			<span aria-hidden="true" class="${iconClass} "${style}></span>		</div>
	</div>
	<p class="mkd-icon-list-text"  > ${esc(attrs.title || "")}</p>
</div>`;
    }

    case "mkd_banner": {
      // item_image is a WP attachment ID resolved the same way as every
      // other image reference in this migration (resolveImage), not a
      // direct URL - confirmed against production, where two of the three
      // banners on www's /shop-home/ have a missing/deleted attachment and
      // render with no image at all even live, so an unresolvable ID here
      // legitimately means no image, matching that page's own real state.
      const imageUrl = attrs.item_image ? ctx.resolveImage(attrs.item_image) : undefined;
      const imageStyle = imageUrl ? ` style="background-image: url('${esc(imageUrl)}')"` : "";
      const vAlign = attrs.vertical_alignment || "bottom";
      const hAlign = attrs.horizontal_alignment || "left";
      const hover = attrs.image_hover ? ` mkd-bih-${esc(attrs.image_hover)}` : "";
      const titleStyle = attrs.custom_size
        ? ` style="font-size: ${esc(attrs.custom_size)}"`
        : "";
      const target = attrs.link_target === "_blank" ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<div class="mkd-banner vertical-alignment-${esc(vAlign)} horizontal-alignment-${esc(
        hAlign
      )}${hover}">
			<a href="${esc(attrs.link || "#")}"${target}>
			<div class="mkd-banner-image-inner">
							<div class="mkd-banner-image"${imageStyle}>
									</div>

			<div class="mkd-banner-info">
				<div class="mkd-banner-info-table">
					<div class="mkd-banner-info-table-cell">
													<div class="mkd-banner-title-holder">
								<h2 class="mkd-banner-title"${titleStyle}>
									${esc(attrs.banner_title || "")}								</h2>
							</div>
											</div>
				</div>
			</div>
		</div>
			</a>
	</div>`;
    }

    case "mkd_progress_bar": {
      const percent = parseInt(attrs.percent || "0", 10) || 0;
      return `<div class="mkd-progress-bar mkd-progress-bar-dark">
	<h6 class="mkd-progress-title-holder clearfix">
		<span class="mkd-progress-title">${esc(attrs.title || "")}</span>
		<span class="mkd-progress-number-wrapper mkd-floating " >
			<span class="mkd-progress-number">
				<span class="mkd-percent">0</span>
			</span>
		</span>
	</h6>
	<div class="mkd-progress-content-outer ">
		<div data-percentage=${percent} class="mkd-progress-content" ></div>
	</div>
</div>`;
    }

    case "mkd_custom_font": {
      const styleParts: string[] = [];
      if (attrs.font_family) styleParts.push(`font-family: ${attrs.font_family}`);
      if (attrs.font_size) styleParts.push(`font-size: ${attrs.font_size}px`);
      if (attrs.line_height) styleParts.push(`line-height: ${attrs.line_height}px`);
      if (attrs.font_weight) styleParts.push(`font-weight: ${attrs.font_weight}`);
      if (attrs.text_align) styleParts.push(`text-align: ${attrs.text_align}`);
      if (attrs.color) styleParts.push(`color: ${attrs.color}`);
      const text = (attrs.content_custom_font || "")
        .split("\n")
        .map((line) => esc(line))
        .join("<br />\n");
      return `<div class="mkd-custom-font-holder" style="${esc(
        styleParts.join(";")
      )}" data-font-size=${esc(attrs.font_size || "")} data-line-height=${esc(
        attrs.line_height || ""
      )}>
	${text}	</div>`;
    }

    case "mkd_section_subtitle":
      return `<div class="mkd-section-subtitle"${
        attrs.text_color ? ` style="color: ${esc(attrs.text_color)}"` : ""
      }>${esc(attrs.subtitle_text || "")}</div>`;

    // Static decorative divider - WPBakery's own core shortcode, not
    // theme-specific, and its zigzag pattern SVG never varies with any
    // shortcode attribute in this network's usage (confirmed - every
    // instance is a bare [vc_zigzag] with no attrs), so the encoded SVG
    // background is reproduced verbatim from production rather than
    // rebuilt from parameters that don't exist here.
    case "vc_zigzag":
      return `<div class="vc-zigzag-wrapper vc-zigzag-align-center"><div class="vc-zigzag-inner" style="width: 100%;min-height: 14px;background: 0 repeat-x url('data:image/svg+xml;utf-8,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22utf-8%22%3F%3E%3C%21DOCTYPE%20svg%20PUBLIC%20%22-%2F%2FW3C%2F%2FDTD%20SVG%201.1%2F%2FEN%22%20%22http%3A%2F%2Fwww.w3.org%2FGraphics%2FSVG%2F1.1%2FDTD%2Fsvg11.dtd%22%3E%3Csvg%20width%3D%2214px%22%20height%3D%2212px%22%20viewBox%3D%220%200%2018%2015%22%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%3E%3Cpolygon%20id%3D%22Combined-Shape%22%20fill%3D%22%23ebebeb%22%20points%3D%228.98762301%200%200%209.12771969%200%2014.519983%209%205.40479869%2018%2014.519983%2018%209.12771969%22%3E%3C%2Fpolygon%3E%3C%2Fsvg%3E');"></div></div>`;

    // Not implemented: this is a named, curated set of items (e.g.
    // carousel="shop-home") with no attribute identifying WHICH
    // products/content belong to it - unlike every other data-driven
    // shortcode here (testimonials/portfolio/blog list), there's no
    // category or other queryable key in the shortcode itself to resolve
    // against, so there's no way to know what content this specific
    // instance should show without a mapping this migration was never
    // given. Falls through to the default case (render children, which is
    // empty since it's void) rather than guessing.

    // Real WPBakery output is a flat run of sibling <h5>/.mkd-accordion-content
    // pairs inside one .mkd-accordion-holder wrapper (not one wrapper per
    // tab) - the theme's own accordion JS (already loaded via
    // buro-modules.min.js) toggles siblings on click by class, so matching
    // this exact structure is enough to get working click-to-expand
    // behavior with no custom JS of our own. Previously mkd_accordion and
    // mkd_accordion_tab were unhandled, so they fell through to the default
    // case (render children, drop the tag) - the tab body text still
    // rendered, but the clickable title header and expand/collapse markup
    // were silently dropped entirely (confirmed on e.g. the academy page's
    // 9-tab curriculum accordion).
    case "mkd_accordion":
      return `<div class="mkd-accordion-holder clearfix mkd-accordion mkd-initial ">${renderChildren(
        children,
        ctx
      )}</div>`;

    case "mkd_accordion_tab": {
      const titleTag = /^h[1-6]$/.test(attrs.title_tag || "") ? attrs.title_tag : "h5";
      return `<${titleTag} class="clearfix mkd-title-holder">
	<span class="mkd-tab-title">
		<span class="mkd-tab-title-inner">
			${esc(attrs.title || "")}		</span>
	</span>
	<span class="mkd-accordion-mark">
		<span class="mkd-accordion-mark-icon">
			<span class="icon_plus"></span>
			<span class="icon_minus-06"></span>
		</span>
	</span>
</${titleTag}><div class="mkd-accordion-content"><div class="mkd-accordion-content-inner">${renderChildren(
        children,
        ctx
      )}</div></div>`;
    }

    case "mkd_portfolio_list":
      return renderPortfolioList(attrs.category, ctx);

    case "mkd_portfolio_slider":
      return renderPortfolioSlider(attrs, ctx);

    case "mkd_testimonials":
      return renderTestimonials(attrs.category, ctx);

    case "mkd_blog_list":
      return renderBlogList(attrs, ctx);

    case "rev_slider":
    case "sr7":
      return renderHeroSlider(attrs.alias, ctx);

    default:
      // Unknown shortcode: render children only, dropping the wrapper tag,
      // so nested content isn't lost even without specific styling support.
      return renderChildren(children, ctx);
  }
}

// wpautop() is a blind text transform with no concept of shortcode
// boundaries, so running it over the raw string as-is also rewrites
// newlines that happen to fall INSIDE a shortcode tag's own attribute
// values - e.g. mkd_icon_with_text's text="line one\nline two" attribute,
// which that shortcode's own renderer already turns into <br /> itself.
// Autop'ing it first turns those newlines into a literal "<br />" INSIDE
// the attribute string, which the renderer then HTML-escapes as if it
// were user-typed text, showing up as literal "<br />" on the page
// (confirmed against production - /private-instruction/'s pricing lists
// render real line breaks, not the text "<br />"). Swap every [shortcode]
// tag out for a plain placeholder token before autop'ing, then swap the
// real tag text back in - wpautop only ever sees content outside of tags.
const SHORTCODE_TAG_RE = /\[[^\]]*\]/g;

// Production does not actually run core wpautop() on this content -
// js_composer disables it and substitutes its own shortcode-aware variant
// (wpb_js_remove_wpautop()) that treats its own row/column container tags as
// block-level line separators, on top of the plain-HTML block tags vanilla
// wpautop already knows about. Our plain port above only knows the latter, so
// a text run that starts right after e.g. [vc_column_text] with no manual
// <p> of its own (a common authoring gap - confirmed against production,
// la's /courses/pro-tools-course/ "Prerequisites" column has no manual <p>,
// unlike its sibling "Course Highlights" column) never got one: nothing here
// treated [vc_column_text] as a paragraph boundary, so wpautop's
// chunk-splitter merged it into one enormous run stretching to the next
// literal HTML block tag anywhere later in the page, and the resulting
// single <p>...</p> landed in the wrong place entirely once real shortcode
// expansion split that text back apart into separate divs.
const VC_AUTOP_BLOCK_TAGS = new Set([
  "vc_row",
  "vc_row_inner",
  "vc_column",
  "vc_column_inner",
  "vc_column_text",
  // Void (self-closing), always used standalone on its own line - never
  // legitimately inline within a sentence, so isolating it too avoids it
  // getting swept into a neighboring chunk's <p> wrap (e.g. a lone
  // [vc_empty_space] sitting between two now-isolated column/row
  // boundaries would otherwise become the entire content of its own
  // one-token chunk and get wrapped as <p><div class="vc_empty_space">
  // ...</div></p> - invalid nesting the browser silently "fixes" by
  // auto-closing the <p> early, but still not what production emits).
  "vc_empty_space",
]);

// [vc_raw_html]'s body is a base64(urlencode(html)) blob (see renderNode's
// "vc_raw_html" case) - never real prose, and NOT itself made of [shortcode]
// tags, so the generic per-tag placeholder substitution below leaves it
// exposed as plain text between two separate open/close placeholders. If
// isolated the same way VC_AUTOP_BLOCK_TAGS isolates a tag (blank lines
// around each boundary), that exposed base64 blob becomes an isolated
// wpautop chunk of its own and gets <p>-wrapped like any bare text run -
// splicing literal "<p>"/"</p>" characters into the middle of the base64
// string BEFORE it's decoded, corrupting every byte after that point
// (confirmed by trying exactly that: ny homepage's hero video rendered as
// garbled binary text instead of a video). The whole block - open tag,
// body, and close tag together - must become a single opaque unit instead.
const VC_RAW_HTML_BLOCK_RE = /\[vc_raw_html\][\s\S]*?\[\/vc_raw_html\]/g;
const SHORTCODE_TAG_NAME_RE = /^\[\/?([a-zA-Z_][a-zA-Z0-9_]*)/;

function wpautopPreservingShortcodes(rawContent: string): string {
  const placeholders: string[] = [];

  // Whole-block protection for vc_raw_html (see VC_RAW_HTML_BLOCK_RE above)
  // runs first, before the generic per-tag pass below, so its base64 body
  // is captured as part of the SAME placeholder as its open/close tags
  // rather than left exposed as its own separately-autop'd text run.
  const rawHtmlProtected = rawContent.replace(VC_RAW_HTML_BLOCK_RE, (match) => {
    const idx = placeholders.length;
    placeholders.push(match);
    return `<div data-sc="${idx}"></div>`;
  });

  const protectedContent = rawHtmlProtected.replace(SHORTCODE_TAG_RE, (match) => {
    const idx = placeholders.length;
    placeholders.push(match);
    const tagName = match.match(SHORTCODE_TAG_NAME_RE)?.[1] ?? "";
    if (VC_AUTOP_BLOCK_TAGS.has(tagName)) {
      // Masquerade as a self-closing block-level element (div is already in
      // AUTOP_BLOCK_TAGS) purely so wpautop's own block-tag isolation
      // treats it as a paragraph boundary - swapped back below. Must NOT
      // apply this to every shortcode indiscriminately: inline ones (e.g.
      // [mkd_icon]) need to stay inert, or a run of icons mixed with plain
      // text inside one real, manually-typed <p> would each get isolated
      // into their own separate <p> instead of flowing together (confirmed
      // against production - courses/logic-pro's bullet list renders as one
      // flowing paragraph with inline icons and <br>s, not one box per line).
      return `<div data-sc="${idx}"></div>`;
    }
    return ` SC${idx} `;
  });
  const autopped = wpautop(protectedContent);
  return autopped
    .replace(/<div data-sc="(\d+)">\s*<\/div>/g, (_m, idx) => placeholders[Number(idx)])
    .replace(/ SC(\d+) /g, (_m, idx) => placeholders[Number(idx)]);
}

export function wpContentToStyledHtml(
  rawContent: string,
  resolveImage: ImageUrlResolver,
  resolvePortfolioList: PortfolioListResolver = () => [],
  resolveTestimonials: TestimonialsResolver = () => [],
  resolveHeroSlider: HeroSliderResolver = () => [],
  resolveBlogList: BlogListResolver = () => [],
  partners: PartnerItem[] = []
): string {
  const tree = parseShortcodes(wpautopPreservingShortcodes(rawContent || ""));
  return renderChildren(tree, {
    resolveImage,
    resolvePortfolioList,
    resolveTestimonials,
    resolveHeroSlider,
    resolveBlogList,
    partners,
  });
}
// force rebuild for accordion revert
// force rebuild Next
