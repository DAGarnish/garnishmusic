import ModernInlineAccordion from "./ModernInlineAccordion";
import type { CurriculumModule } from "../../lib/modern-course-content";

// Renders extractIconBulletCardGroups's own module breakdown (see that
// function's comment in lib/modern-course-content.ts for the mia-only
// <h4>+[mkd_icon]-bulleted-paragraph card shape it reads) as one single
// accordion - each module keeps its own sub-heading and bullet list inside
// the shared body, rather than flattening every module's items into one
// undifferentiated list (there's real structure here worth keeping - e.g.
// ableton-live-course's four modules cover clearly different stages of the
// course).
export default function ModernCurriculumAccordion({
  title,
  modules,
}: {
  title: string;
  modules: CurriculumModule[];
}) {
  if (!modules.length) return null;
  return (
    <ModernInlineAccordion title={title}>
      <div className="space-y-8">
        {modules.map((mod, i) => (
          <div key={i}>
            <h3 className="gmpm-display font-bold text-base mb-3">{mod.heading}</h3>
            <ul className="space-y-1.5">
              {mod.items.map((item, j) => (
                <li key={j} className="text-sm text-[var(--gmpm-text-dim)] flex gap-2">
                  <span className="text-[var(--gmpm-accent)] shrink-0">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </ModernInlineAccordion>
  );
}
