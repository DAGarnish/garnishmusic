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

export type HeroSlide = {
  imageUrl?: string;
  text?: string;
};
export type HeroSliderResolver = (alias: string) => HeroSlide[];

type RenderContext = {
  resolveImage: ImageUrlResolver;
  resolvePortfolioList: PortfolioListResolver;
  resolveTestimonials: TestimonialsResolver;
  resolveHeroSlider: HeroSliderResolver;
};

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

function renderTestimonials(categorySlug: string | undefined, ctx: RenderContext): string {
  const items = ctx.resolveTestimonials(categorySlug || "");
  if (items.length === 0) return "";

  const slides = items
    .map(
      (item, i) => `<div class="mkd-testimonial-content mkd-testimonials${i}">
    <div class="mkd-testimonial-content-inner">
        <div class="mkd-testimonial-text-outer">
            <h2 class="mkd-testimonial-text">${esc(item.text)}</h2>
        </div>
        <h5 class="mkd-testimonial-author">
            - <span class="mkd-testimonial-author-text"> ${esc(item.author)} </span>
        </h5>
    </div>
</div>`
    )
    .join("");

  return `<div class="mkd-testimonials-holder clearfix"><div class="mkd-slick-slider-navigation-style mkd-testimonials mkd-testimonials-type-buro" data-dots-navigation="false">${slides}</div></div>`;
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
      const text = slide.text ? decodeHTML(slide.text) : "";
      return `<div class="mkd-hero-slide" style="background-image:url(${esc(slide.imageUrl!)}); animation-name:${animName}; animation-duration:${cycle}s; animation-delay:-${delay}s;">
  ${text ? `<div class="mkd-hero-slide-text">${text}</div>` : ""}
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
      if (attrs.content_aligment) rowClass += ` mkd-content-aligment-${attrs.content_aligment}`;
      if (attrs.el_class) rowClass += ` ${attrs.el_class}`;
      const inner = isGrid
        ? `<div class="clearfix mkd-section-inner"><div class="mkd-section-inner-margin clearfix">${renderChildren(children, ctx)}</div></div>`
        : `<div class="clearfix mkd-full-section-inner">${renderChildren(children, ctx)}</div>`;

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
      const isGrid = attrs.content_width === "grid";
      let rowClass = `vc_row wpb_row vc_inner vc_row-fluid mkd-section${isGrid ? " mkd-grid-section" : ""}`;
      if (attrs.content_aligment) rowClass += ` mkd-content-aligment-${attrs.content_aligment}`;
      if (attrs.el_class) rowClass += ` ${attrs.el_class}`;
      const inner = isGrid
        ? `<div class="clearfix mkd-section-inner"><div class="mkd-section-inner-margin clearfix">${renderChildren(children, ctx)}</div></div>`
        : `<div class="clearfix mkd-full-section-inner">${renderChildren(children, ctx)}</div>`;
      return `<div class="${rowClass}"${vcCustomStyle(attrs.css)}>${inner}</div>`;
    }

    case "vc_column":
    case "vc_column_inner": {
      const cols = widthAttrToCols(attrs.width);
      return `<div class="wpb_column vc_column_container vc_col-sm-${cols}"${vcCustomStyle(attrs.css)}><div class="vc_column-inner"><div class="wpb_wrapper">${renderChildren(
        children,
        ctx
      )}</div></div></div>`;
    }

    case "vc_column_text":
      return attrs.css ? `<div${vcCustomStyle(attrs.css)}>${renderChildren(children, ctx)}</div>` : renderChildren(children, ctx);

    case "vc_empty_space": {
      const height = attrs.height || "20px";
      return `<div class="vc_empty_space" style="height: ${esc(height)}"><span class="vc_empty_space_inner"></span></div>`;
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

    case "vc_single_image":
    case "mkd_image_with_text": {
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
      try {
        return decodeURIComponent(Buffer.from(text.trim(), "base64").toString("utf-8"));
      } catch {
        return "";
      }
    }

    case "mkd_icon_with_text": {
      const iconClass = attrs.fa_icon ? `fa ${attrs.fa_icon}` : "";
      return iconClass
        ? `<div class="mkd-icon-with-text-holder"><i class="${esc(iconClass)}"></i></div>`
        : "";
    }

    case "mkd_portfolio_list":
      return renderPortfolioList(attrs.category, ctx);

    case "mkd_testimonials":
      return renderTestimonials(attrs.category, ctx);

    case "rev_slider":
    case "sr7":
      return renderHeroSlider(attrs.alias, ctx);

    default:
      // Unknown shortcode: render children only, dropping the wrapper tag,
      // so nested content isn't lost even without specific styling support.
      return renderChildren(children, ctx);
  }
}

export function wpContentToStyledHtml(
  rawContent: string,
  resolveImage: ImageUrlResolver,
  resolvePortfolioList: PortfolioListResolver = () => [],
  resolveTestimonials: TestimonialsResolver = () => [],
  resolveHeroSlider: HeroSliderResolver = () => []
): string {
  const tree = parseShortcodes(rawContent || "");
  return renderChildren(tree, { resolveImage, resolvePortfolioList, resolveTestimonials, resolveHeroSlider });
}
