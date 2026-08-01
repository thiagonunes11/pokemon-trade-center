import { useRef, useState } from "react";
import {
  ShareShowcaseBinder,
  type ShowcaseShareCard,
} from "./ShareShowcaseBinder";
import { downloadSetBinderPng } from "./shareSetPng";

interface ShareShowcaseButtonProps {
  cards: ShowcaseShareCard[];
  ownerLabel?: string | null;
  disabled?: boolean;
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

export function ShareShowcaseButton({
  cards,
  ownerLabel,
  disabled = false,
}: ShareShowcaseButtonProps) {
  const binderRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mountBinder, setMountBinder] = useState(false);

  const canShare = !disabled && cards.length > 0;

  const handleShare = async () => {
    if (!canShare) return;
    setBusy(true);
    setError(null);
    setMountBinder(true);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    await new Promise((r) => setTimeout(r, 150));

    try {
      if (!binderRef.current) throw new Error("Binder not mounted");
      await downloadSetBinderPng(binderRef.current, "minha-vitrine.png");
    } catch {
      setError("Não foi possível gerar a imagem. Tente de novo.");
    } finally {
      setBusy(false);
      setMountBinder(false);
    }
  };

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
      {error ? (
        <p className="text-center text-sm text-[var(--color-error)]">{error}</p>
      ) : null}
      {mountBinder ? (
        <div
          aria-hidden
          className="pointer-events-none fixed top-0 left-0 z-[-1] -translate-x-full opacity-0"
        >
          <ShareShowcaseBinder
            ref={binderRef}
            cards={cards}
            ownerLabel={ownerLabel}
          />
        </div>
      ) : null}
    </div>
  );
}
