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

function linkAttrs(node: MenuNode, ctx: UrlRewriteContext): string {
  if (node.url === "#") {
    return `href="#" class="mkd-no-link" style="cursor: default;" onclick="JavaScript: return false;"`;
  }
  const url = rewriteUrlForLocalDev(node.url, ctx);
  const target = node.newTab ? ` target="_blank" rel="external noopener noreferrer"` : "";
  return `href="${esc(url)}"${target}`;
}

function renderNode(node: MenuNode, depth: number, ctx: UrlRewriteContext): string {
  const hasChildren = node.children.length > 0;
  const label = esc(node.label);

  if (depth === 0) {
    const liClass = `menu-item menu-item-type-custom menu-item-object-custom mkd-wide-background${
      hasChildren ? " menu-item-has-children mkd-has-sub mkd-menu-wide" : ""
    }`;
    const childrenHtml = hasChildren
      ? `<div class="mkd-menu-second"><div class="mkd-menu-inner"><ul>${node.children
          .map((c) => renderNode(c, 1, ctx))
          .join("")}</ul></div></div>`
      : "";
    return `<li class="${liClass}"><a ${linkAttrs(node, ctx)}><span class="mkd-item-outer"><span class="mkd-item-inner"><span class="mkd-item-text">${label}</span></span>${
      hasChildren ? '<span class="plus"></span>' : ""
    }</span></a>${childrenHtml}</li>`;
  }

  if (depth === 1) {
    const liClass = `menu-item menu-item-type-custom menu-item-object-custom mkd-wide-background${
      hasChildren ? " menu-item-has-children mkd-sub" : ""
    }`;
    const childrenHtml = hasChildren
      ? `<ul>${node.children.map((c) => renderNode(c, 2, ctx)).join("")}</ul>`
      : "";
    return `<li class="${liClass}"><a ${linkAttrs(node, ctx)}><span class="mkd-item-outer"><span class="mkd-item-inner"><span class="mkd-item-text">${label}</span></span>${
      hasChildren ? '<span class="plus"></span><i class="mkd-menu-arrow fa fa-angle-right"></i>' : ""
    }</span></a>${childrenHtml}</li>`;
  }

  return `<li class="menu-item menu-item-type-custom menu-item-object-custom mkd-wide-background"><a ${linkAttrs(
    node,
    ctx
  )}><span class="mkd-item-outer"><span class="mkd-item-inner"><span class="mkd-item-text">${label}</span></span></span></a></li>`;
}

export function menuTreeToHtml(items: MenuNode[], ctx: UrlRewriteContext): string {
  const itemsHtml = items.map((item) => renderNode(item, 0, ctx)).join("");
  return `<nav class="mkd-main-menu mkd-drop-down mkd-default-nav"><ul id="menu-main-menu" class="clearfix">${itemsHtml}</ul></nav>`;
}
