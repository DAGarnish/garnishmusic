import { getPayload } from "payload";
import config from "../payload.config";
import { parseShortcodes, ShortcodeNode } from "./wp-shortcode-tree";

function mapNodeToBlocks(node: ShortcodeNode): any[] {
  if (node.type === "text") {
    const trimmed = node.content.trim();
    if (!trimmed) return [];
    return [{
      blockType: "rawHtml",
      html: trimmed,
    }];
  }

  const { tag, attrs, children } = node;
  const childBlocks = children.flatMap(mapNodeToBlocks);

  switch (tag) {
    case "vc_row":
    case "vc_row_inner":
      return [{
        blockType: "row",
        isGrid: attrs.content_width === "grid",
        columns: childBlocks,
      }];

    case "vc_column":
    case "vc_column_inner":
      return [{
        blockType: "column",
        width: attrs.width || "1/1",
        blocks: childBlocks,
      }];

    case "vc_column_text":
      return [{
        blockType: "rawHtml",
        html: children.filter(c => c.type === 'text').map((c: any) => c.content).join(""),
      }];

    case "vc_single_image":
      return [{
        blockType: "image",
        image: parseInt(attrs.image, 10),
      }];

    case "vc_btn":
    case "mkd_button":
      return [{
        blockType: "button",
        label: attrs.text || attrs.title || "Click Here",
        url: attrs.link || "#",
      }];
      
    case "mkd_accordion":
      const items = children.filter(c => c.type === "tag" && c.tag === "mkd_accordion_tab").map((tab: any) => {
         return {
            title: tab.attrs.title || "Accordion Tab",
            blocks: tab.children.flatMap(mapNodeToBlocks),
         }
      });
      return [{
        blockType: "accordion",
        items: items,
      }];

    case "mkd_separator":
      return [{
         blockType: "rawHtml",
         html: '<div class="vc_separator wpb_content_element vc_separator_align_center vc_sep_width_100 vc_sep_pos_align_center vc_sep_color_grey"><span class="vc_sep_holder vc_sep_holder_l"><span class="vc_sep_line"></span></span><span class="vc_sep_holder vc_sep_holder_r"><span class="vc_sep_line"></span></span></div>'
      }];

    case "vc_video":
      return [{
        blockType: "video",
        link: attrs.link,
      }];

    case "mkd_section_title":
      return [{
        blockType: "sectionTitle",
        title: attrs.title || "",
        type: attrs.type || "standard",
        titleColor: attrs.title_color || "",
      }];

    case "mkd_image_with_text":
      return [{
        blockType: "imageWithText",
        image: parseInt(attrs.image, 10),
        title: attrs.title || "",
        text: attrs.text || "",
      }];

    case "mkd_portfolio_slider":
      return [{
        blockType: "portfolioSlider",
        category: null, // Shortcode parsing might need category translation, keep simple for now
      }];

    case "mkd_blog_list":
      return [{
        blockType: "blogList",
        category: null,
      }];

    case "vc_empty_space":
       return [];

    default:
      return childBlocks;
  }
}

async function main() {
  const payload = await getPayload({ config });
  
  const pages = await payload.find({
    collection: "pages",
    where: { slug: { equals: "programs/ableton-producer-program" } }
  });
  
  for (const page of pages.docs) {
    console.log(`Processing page: ${page.slug} (ID: ${page.id})`);
    if (page.wpRawContent && typeof page.wpRawContent === 'string') {
      const ast = parseShortcodes(page.wpRawContent);
      const layout = ast.flatMap(mapNodeToBlocks);
      
      await payload.update({
        collection: "pages",
        id: page.id,
        data: {
          layout: layout,
        }
      });
      console.log(`Successfully migrated ${page.slug}`);
    }
  }

  process.exit(0);
}

main().catch(console.error);
