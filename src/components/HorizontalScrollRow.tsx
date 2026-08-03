import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type HorizontalScrollRowProps = {
  children: ReactNode;
  className?: string;
  /** Rótulo acessível do grupo de botões de scroll. */
  label?: string;
};

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 6 9 12l6 6"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Faixa horizontal com setas no desktop e scroll pela roda do mouse.
 * Em touch, o swipe nativo continua funcionando.
 */
export function HorizontalScrollRow({
  children,
  className = "",
  label = "Navegar opções",
}: HorizontalScrollRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(max > 2 && el.scrollLeft < max - 2);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener("scroll", updateEdges, { passive: true });
    const onWheel = (event: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      el.scrollLeft += event.deltaY;
      event.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      el.removeEventListener("wheel", onWheel);
      ro.disconnect();
    };
  }, [updateEdges, children]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = Math.min(280, Math.max(160, el.clientWidth * 0.65));
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div className={`group/scroll relative ${className}`}>
      {canLeft ? (
        <button
          type="button"
          aria-label={`${label}: anteriores`}
          onClick={() => scrollByDir(-1)}
          className="absolute top-1/2 left-0 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/95 text-[var(--color-text)] shadow-md backdrop-blur transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] md:flex"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      ) : null}
      {canRight ? (
        <button
          type="button"
          aria-label={`${label}: próximas`}
          onClick={() => scrollByDir(1)}
          className="absolute top-1/2 right-0 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/95 text-[var(--color-text)] shadow-md backdrop-blur transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] md:flex"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : null}

      <div
        ref={scrollerRef}
        className={`flex gap-2 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          canLeft ? "md:pl-11" : ""
        } ${canRight ? "md:pr-11" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
