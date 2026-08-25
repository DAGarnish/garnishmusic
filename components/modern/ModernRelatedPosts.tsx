import type { RelatedPost } from "../../lib/modern-related-posts";

// Every post lives on edu (see lib/modern-related-posts.ts), so every link
// here leaves the current site - opened in a new tab rather than navigating
// the visitor away from the course page they're on.
export default function ModernRelatedPosts({ posts, eduDomain }: { posts: RelatedPost[]; eduDomain: string }) {
  if (!posts.length) return null;
  return (
    <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24 border-t border-[var(--gmpm-line)]">
      <div className="gmpm-mono text-xs uppercase text-[var(--gmpm-accent)] mb-3">From the blog</div>
      <h2 className="gmpm-display font-bold text-2xl md:text-4xl max-w-2xl mb-12">Related reading.</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--gmpm-line)] border border-[var(--gmpm-line)]">
        {posts.map((post, i) => (
          <a
            key={i}
            href={`https://${eduDomain}/${post.slug}/`}
            target="_blank"
            rel="noopener"
            className="bg-[var(--gmpm-bg)] p-6 flex flex-col hover:bg-[var(--gmpm-bg-raised)] transition-colors"
          >
            <h3 className="gmpm-display font-bold text-lg mb-3">{post.title}</h3>
            {post.excerpt && (
              <p className="text-sm text-[var(--gmpm-text-dim)] leading-relaxed line-clamp-3 mb-4">{post.excerpt}</p>
            )}
            <span className="gmpm-mono text-[11px] uppercase text-[var(--gmpm-accent)] mt-auto">Read on edu →</span>
          </a>
        ))}
      </div>
    </section>
  );
}
