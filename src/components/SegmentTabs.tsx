import type { ReactNode } from "react";
import { motion } from "motion/react";
import { tabSpring } from "@/lib/motion";

export type SegmentTabOption<T extends string> = {
  key: T;
  label: string;
  /** Conteúdo extra (ex.: contagem) renderizado ao lado do label. */
  trailing?: ReactNode;
  /** Classes extras no botão (layout flex da contagem, etc.). */
  className?: string;
};

type SegmentTabsProps<T extends string> = {
  value: T;
  options: SegmentTabOption<T>[];
  onChange: (key: T) => void;
  /** Id único do layoutId — um por tablist na tela. */
  layoutId: string;
  "aria-label": string;
  className?: string;
};

/**
 * Segment control com pill animado (`layoutId`).
 * Substitui o fundo estático de `.ui-segment-item[data-active]`.
 */
export function SegmentTabs<T extends string>({
  value,
  options,
  onChange,
  layoutId,
  "aria-label": ariaLabel,
  className = "",
}: SegmentTabsProps<T>) {
  return (
    <div
      className={`ui-segment ui-segment--motion ${className}`}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.key)}
            className={`ui-segment-item relative px-1 text-xs sm:text-sm ${
              active
                ? "text-[var(--color-text)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            } ${opt.className ?? ""}`}
          >
            {active ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 z-0 rounded-lg bg-[var(--color-bg-elevated)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_55%,transparent),0_6px_16px_-10px_color-mix(in_srgb,var(--color-accent)_50%,transparent)]"
                transition={tabSpring}
              />
            ) : null}
            <span className="relative z-[1]">{opt.label}</span>
            {opt.trailing != null ? (
              <span className="relative z-[1]">{opt.trailing}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
