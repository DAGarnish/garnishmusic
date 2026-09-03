import "../../app/modern-globals.css";
import { RichText } from "@payloadcms/richtext-lexical/react";
import ModernHeader from "./ModernHeader";
import ModernFooter from "./ModernFooter";
import { EMPTY_RICHTEXT, postRichTextConverters } from "./modern-post-richtext";
import type { MenuNode } from "../menu-html";

// A single real blog post, rendered on "staging" (and eventually edu
// itself) in the modern cream/red design instead of opening out to edu's
// legacy WP theme - see [[...slug]]/page.tsx's findStagingBlogPostCached
// for how a post slug routes here.
export default function ModernBlogPostPage({ site, post }: { site: any; post: any }) {
  const categories = Array.isArray(post.categories) ? post.categories : [];
  const categoryLabel = categories
    .map((c: any) => (typeof c === "object" ? c.name : null))
    .filter(Boolean)
    .join(", ");
  const dateLabel = post.publishedDate
    ? new Date(post.publishedDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;
  const imageUrl = typeof post.featuredImage === "object" ? post.featuredImage?.url : undefined;

  return (
    <div className="gmpm-root min-h-screen">
      <ModernHeader menu={site.mainMenu as MenuNode[] | null} cityAbbr="EDU" siteSlug={site.slug} />

      <section className="relative overflow-hidden gmpm-grid-bg">
        <div className="max-w-[900px] mx-auto px-6 md:px-10 pt-16 pb-12 md:pt-20 md:pb-16">
          <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-6 flex items-center gap-2 flex-wrap">
            <span className="inline-block w-2 h-2 bg-[var(--gmpm-accent)]" />
            {categoryLabel || "From the Blog"}
          </div>
          <h1 className="gmpm-display font-bold text-[9vw] leading-[1.05] md:text-[3.5vw] md:leading-[1.05]">
            {post.title}
          </h1>
          <div className="mt-6 flex items-center gap-4 text-sm text-[var(--gmpm-text-dim)]">
            {post.author && <span>{post.author}</span>}
            {post.author && dateLabel && <span>·</span>}
            {dateLabel && <span>{dateLabel}</span>}
          </div>
        </div>
      </section>

      <article className="max-w-[900px] mx-auto px-6 md:px-10 pb-16 md:pb-24">
        {imageUrl && (
          <div className="aspect-[16/9] overflow-hidden mb-12 border border-[var(--gmpm-line)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div
          className="prose-modern text-[var(--gmpm-text)] leading-relaxed max-w-none
            [&_p]:mb-5 [&_p]:text-[var(--gmpm-text)]
            [&_h2]:gmpm-display [&_h2]:font-bold [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:mt-12 [&_h2]:mb-4
            [&_h3]:gmpm-display [&_h3]:font-bold [&_h3]:text-xl [&_h3]:md:text-2xl [&_h3]:mt-10 [&_h3]:mb-3
            [&_a]:text-[var(--gmpm-accent)] [&_a]:underline [&_a]:underline-offset-2
            [&_strong]:text-[var(--gmpm-text)] [&_strong]:font-bold
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-5 [&_ul]:space-y-1
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-5 [&_ol]:space-y-1
            [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--gmpm-accent)] [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-[var(--gmpm-text-dim)] [&_blockquote]:my-6
            [&_img]:my-6 [&_img]:border [&_img]:border-[var(--gmpm-line)]"
        >
          <RichText data={post.content || EMPTY_RICHTEXT} converters={postRichTextConverters} />
        </div>
      </article>

      <ModernFooter siteName={site.name} cityName="Worldwide" siteSlug={site.slug} />
    </div>
  );
}
