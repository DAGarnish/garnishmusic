import type { Block } from "payload";
import { RichTextBlock } from "./RichText";
import { ImageBlock } from "./Image";
import { ButtonBlock } from "./Button";
import { RawHTMLBlock } from "./RawHTML";
import { PortfolioListBlock } from "./PortfolioList";
import { TestimonialsBlock } from "./Testimonials";
import { HeroSliderBlock } from "./HeroSlider";
import { AccordionBlock } from "./Accordion";
import { BlogListBlock } from "./BlogList";
import { VideoBlock } from "./Video";
import { SectionTitleBlock } from "./SectionTitle";
import { ImageWithTextBlock } from "./ImageWithText";
import { PortfolioSliderBlock } from "./PortfolioSlider";

export const ColumnBlock: Block = {
  slug: "column",
  fields: [
    {
      name: "width",
      type: "select",
      defaultValue: "1/1",
      options: [
        { label: "1/1 (Full)", value: "1/1" },
        { label: "1/2 (Half)", value: "1/2" },
        { label: "1/3 (Third)", value: "1/3" },
        { label: "2/3 (Two Thirds)", value: "2/3" },
        { label: "1/4 (Quarter)", value: "1/4" },
        { label: "3/4 (Three Quarters)", value: "3/4" },
      ],
    },
    {
      name: "blocks",
      type: "blocks",
      blocks: [
        RichTextBlock,
        ImageBlock,
        ButtonBlock,
        RawHTMLBlock,
        PortfolioListBlock,
        TestimonialsBlock,
        HeroSliderBlock,
        AccordionBlock,
        BlogListBlock,
        VideoBlock,
        SectionTitleBlock,
        ImageWithTextBlock,
        PortfolioSliderBlock,
      ],
    },
  ],
};
