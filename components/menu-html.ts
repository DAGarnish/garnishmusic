import { rewriteUrlForLocalDev, type UrlRewriteContext } from "../lib/current-site";

export type MenuNode = {
  label: string;
  url: string;
  newTab: boolean;
  children: MenuNode[];
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Which page is currently being rendered, so the nav can mark the active
// item the same way WordPress's own menu walker does (current-menu-item /
// current-menu-ancestor / current-menu-parent) - confirmed against
// production's raw HTML for e.g. bcn's /ba-pathway-courses/, whose active
// chain is li.current-menu-item (the leaf link) -> li.current-menu-ancestor
// current-menu-parent (its immediate parent column) -> li.current-menu-
// ancestor.mkd-active-item with a.current (the top-level item), each level
// styled by its own selector in buro-modules.css/buro-dynamic.css.
export type ActiveMatch = { path: string; domain: string };

function normalizePath(pathname: string): string {
  return pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
}

function isSelf(node: MenuNode, active: ActiveMatch | undefined): boolean {
  if (!active || node.url === "#") return false;
  try {
    const u = new URL(node.url);
    return u.hostname === active.domain && normalizePath(u.pathname) === normalizePath(active.path);
  } catch {
    return false;
  }
}

function containsActive(node: MenuNode, active: ActiveMatch | undefined): boolean {
  if (!active) return false;
  if (isSelf(node, active)) return true;
  return node.children.some((c) => containsActive(c, active));
}

function linkAttrs(node: MenuNode, ctx: UrlRewriteContext, extraClass?: string): string {
  if (node.url === "#") {
    const classes = ["mkd-no-link", extraClass].filter(Boolean).join(" ");
    return `href="#" class="${classes}" style="cursor: default;" onclick="JavaScript: return false;"`;
  }
  const url = rewriteUrlForLocalDev(node.url, ctx);
  const target = node.newTab ? ` target="_blank" rel="external noopener noreferrer"` : "";
  const classAttr = extraClass ? ` class="${extraClass}"` : "";
  return `href="${esc(url)}"${classAttr}${target}`;
}

function renderNode(node: MenuNode, depth: number, ctx: UrlRewriteContext, active?: ActiveMatch, isWideParent: boolean = true): string {
  const hasChildren = node.children.length > 0;
  const label = esc(node.label);
  const self = isSelf(node, active);
  const activeBranch = containsActive(node, active);

  if (depth === 0) {
    // "About" and mia's "DJ & More" both use the theme's narrow-dropdown
    // style (a small, auto-width box near the trigger) instead of the
    // full-header-width mega-menu bar every other top-level item gets -
    // the right fit for a short flat link list with no column groupings.
    const isWide = !["about", "dj & more"].includes(node.label.toLowerCase());
    let liClass = `menu-item menu-item-type-custom menu-item-object-custom${isWide ? " mkd-wide-background" : ""}${
      hasChildren ? ` menu-item-has-children mkd-has-sub${isWide ? " mkd-menu-wide" : " mkd-menu-narrow"}` : ""
    }`;
    if (self) liClass += " current-menu-item";
    else if (activeBranch) liClass += " current-menu-ancestor";
    if (activeBranch) liClass += " mkd-active-item";
    const childrenHtml = hasChildren
      ? `<div class="mkd-menu-second"><div class="mkd-menu-inner"><ul>${node.children
          .map((c) => renderNode(c, 1, ctx, active, isWide))
          .join("")}</ul></div></div>`
      : "";
    return `<li class="${liClass}"><a ${linkAttrs(node, ctx, activeBranch ? "current" : undefined)}><span class="mkd-item-outer"><span class="mkd-item-inner"><span class="mkd-item-text">${label}</span></span>${
      hasChildren ? '<span class="plus"></span>' : ""
    }</span></a>${childrenHtml}</li>`;
  }

  if (depth === 1) {
    let liClass = `menu-item menu-item-type-custom menu-item-object-custom${isWideParent ? " mkd-wide-background" : ""}${
      hasChildren ? " menu-item-has-children mkd-sub" : ""
    }`;
    if (self) liClass += " current-menu-item";
    else if (activeBranch) liClass += " current-menu-ancestor current-menu-parent";
    const childrenHtml = hasChildren
      ? `<ul>${node.children.map((c) => renderNode(c, 2, ctx, active, isWideParent)).join("")}</ul>`
      : "";
    return `<li class="${liClass}"><a ${linkAttrs(node, ctx)}><span class="mkd-item-outer"><span class="mkd-item-inner"><span class="mkd-item-text">${label}</span></span>${
      hasChildren ? '<span class="plus"></span><i class="mkd-menu-arrow fa fa-angle-right"></i>' : ""
    }</span></a>${childrenHtml}</li>`;
  }

  const liClass = `menu-item menu-item-type-custom menu-item-object-custom${isWideParent ? " mkd-wide-background" : ""}${
    self ? " current-menu-item" : ""
  }`;
  return `<li class="${liClass}"><a ${linkAttrs(
    node,
    ctx
  )}><span class="mkd-item-outer"><span class="mkd-item-inner"><span class="mkd-item-text">${label}</span></span></span></a></li>`;
}

export function menuTreeToHtml(items: MenuNode[], ctx: UrlRewriteContext, active?: ActiveMatch): string {
  const itemsHtml = items.map((item) => renderNode(item, 0, ctx, active)).join("");
  return `<nav class="mkd-main-menu mkd-drop-down mkd-default-nav"><ul id="menu-main-menu" class="clearfix">${itemsHtml}</ul></nav>`;
}

// buro-modules.min.js's mobile menu handler (function k() in that bundle)
// wires up two independent click targets by fixed selector, so this markup
// has to hit both exactly to be interactive at all - not just visually
// resemble a mobile nav:
//   1. ".mkd-mobile-header .mkd-mobile-menu-opener" slideToggles
//      ".mkd-mobile-header .mkd-mobile-nav" (the hamburger button).
//   2. ".mkd-mobile-nav .mobile_arrow, .mkd-mobile-nav h4, .mkd-mobile-nav
//      a[href*=\"#\"]" each slideToggle their own next <ul> sibling and
//      toggle "mkd-opened" on the parent <li> (submenu expand/collapse).
// Every branch node in this network's menus (confirmed against the LA
// site's mainMenu) uses url:"#" as a category placeholder with real
// children, never a real link *and* children together, so rendering
// branches as <h4> (already in the JS's toggle selector - no extra
// .mobile_arrow markup needed) and leaves as <a> covers every case.
function renderMobileNode(node: MenuNode, ctx: UrlRewriteContext, active?: ActiveMatch): string {
  const hasChildren = node.children.length > 0;
  const label = esc(node.label);
  const self = isSelf(node, active);
  const activeBranch = containsActive(node, active);
  let liClass = hasChildren ? "menu-item-has-children" : "";
  if (self) liClass += " current-menu-item";
  else if (activeBranch) liClass += " current-menu-ancestor";
  const classAttr = liClass.trim() ? ` class="${liClass.trim()}"` : "";

  const label_ = hasChildren ? `<h4>${label}</h4>` : `<a ${linkAttrs(node, ctx)}>${label}</a>`;
  // Pre-expand (inline style, not a class - the theme has no CSS rule that
  // reveals a nested <ul> from a class alone, only jQuery's slideDown/Up)
  // the branch containing the current page, so a visitor several levels
  // deep in the menu doesn't land on a fully collapsed list. The click
  // handler still works normally afterward: it toggles based on jQuery's
  // :visible check, which correctly reads this inline style.
  const childrenStyle = hasChildren && activeBranch ? ` style="display: block;"` : "";
  const childrenHtml = hasChildren
    ? `<ul${childrenStyle}>${node.children.map((c) => renderMobileNode(c, ctx, active)).join("")}</ul>`
    : "";
  return `<li${classAttr}>${label_}${childrenHtml}</li>`;
}

export function menuTreeToMobileHtml(items: MenuNode[], ctx: UrlRewriteContext, active?: ActiveMatch): string {
  const itemsHtml = items.map((item) => renderMobileNode(item, ctx, active)).join("");
  return `<ul>${itemsHtml}</ul>`;
}
