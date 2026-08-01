import { useRef, useState } from "react";
import {
  ShareSetBinder,
  type ShareBinderCard,
} from "./ShareSetBinder";
import { downloadSetBinderPng } from "./shareSetPng";

interface ShareSetButtonProps {
  setId: string;
  setName: string;
  cards: ShareBinderCard[];
  ownedIds: Set<string>;
  owned: number;
  total: number;
  disabled?: boolean;
  /** primary = CTA full width; icon = 44px; link = text action */
  variant?: "primary" | "icon" | "link";
}

function IconShare({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  );
}

export function ShareSetButton({
  setId,
  setName,
  cards,
  ownedIds,
  owned,
  total,
  disabled = false,
  variant = "primary",
}: ShareSetButtonProps) {
  const binderRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mountBinder, setMountBinder] = useState(false);

  const canShare = !disabled && total > 0 && cards.length > 0;

  const handleShare = async () => {
    if (!canShare) return;
    setBusy(true);
    setError(null);
    setMountBinder(true);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    await new Promise((r) => setTimeout(r, 120));

    try {
      if (!binderRef.current) {
        throw new Error("Binder not mounted");
      }
      await downloadSetBinderPng(
        binderRef.current,
        `vitrine-${setId}.png`,
      );
    } catch {
      setError("Não foi possível gerar a imagem. Tente de novo.");
    } finally {
      setBusy(false);
      setMountBinder(false);
    }
  };

  const binderPortal = mountBinder ? (
    <div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[-1] -translate-x-full opacity-0"
    >
      <ShareSetBinder
        ref={binderRef}
        setName={setName}
        cards={cards}
        ownedIds={ownedIds}
        owned={owned}
        total={total}
      />
    </div>
  ) : null;

  if (variant === "icon") {
    return (
      <div className="shrink-0">
        <button
          type="button"
          disabled={!canShare || busy}
          onClick={() => void handleShare()}
          aria-label={busy ? "Gerando imagem" : "Compartilhar vitrine"}
          title="Compartilhar vitrine"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50"
        >
          <IconShare className={`h-5 w-5 ${busy ? "animate-pulse" : ""}`} />
        </button>
        {error ? (
          <p className="mt-1 max-w-[9rem] text-right text-[10px] text-[var(--color-error)]">
            {error}
          </p>
        ) : null}
        {binderPortal}
      </div>
    );
  }

  if (variant === "link") {
    return (
      <div>
        <button
          type="button"
          disabled={!canShare || busy}
          onClick={() => void handleShare()}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent)] transition hover:underline disabled:opacity-50"
        >
          <IconShare className="h-3.5 w-3.5" />
          {busy ? "Gerando…" : "Compartilhar"}
        </button>
        {error ? (
          <p className="mt-1 text-xs text-[var(--color-error)]">{error}</p>
        ) : null}
        {binderPortal}
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <button
        type="button"
        disabled={!canShare || busy}
        onClick={() => void handleShare()}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 text-sm font-bold text-[var(--color-on-accent)] transition hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
      >
        <IconShare className="h-4 w-4" />
        {busy ? "Gerando…" : "Compartilhar vitrine"}
      </button>
      <p className="text-center text-xs text-[var(--color-text-muted)]">
        Link público{" "}
        <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          Em breve
        </span>
      </p>
      {error ? (
        <p className="text-center text-sm text-[var(--color-error)]">{error}</p>
      ) : null}
      {binderPortal}
    </div>
  );
}
