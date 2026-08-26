// Shared +/- toggle used by every accordion in this design (FAQ, curriculum
// modules, ...) - a square outline that spins into a filled diamond and
// glows on open, its vertical bar collapsing away to leave a minus, all on
// one transition rather than a plain text "+"/"−" glyph swap.
export default function ModernAccordionToggleIcon({ open }: { open: boolean }) {
  return (
    <span
      className={`relative shrink-0 w-7 h-7 border flex items-center justify-center transition-all duration-300 ease-out ${
        open
          ? "rotate-45 bg-[var(--gmpm-accent)] border-[var(--gmpm-accent)] shadow-[0_0_14px_var(--gmpm-accent)]"
          : "rotate-0 bg-transparent border-[var(--gmpm-line)]"
      }`}
    >
      <span
        className={`absolute h-[1.5px] w-3.5 transition-colors duration-300 ${
          open ? "bg-black" : "bg-[var(--gmpm-accent)]"
        }`}
      />
      <span
        className={`absolute h-3.5 w-[1.5px] transition-transform duration-300 ease-out origin-center ${
          open ? "scale-y-0" : "scale-y-100"
        } ${open ? "bg-black" : "bg-[var(--gmpm-accent)]"}`}
      />
    </span>
  );
}
