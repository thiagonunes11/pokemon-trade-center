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
}

export function ShareSetButton({
  setId,
  setName,
  cards,
  ownedIds,
  owned,
  total,
  disabled = false,
}: ShareSetButtonProps) {
  const binderRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canShare = !disabled && total > 0 && cards.length > 0;

  const handleShare = async () => {
    if (!binderRef.current || !canShare) return;
    setBusy(true);
    setError(null);
    try {
      await downloadSetBinderPng(
        binderRef.current,
        `vitrine-${setId}.png`,
      );
    } catch {
      setError("Não foi possível gerar a imagem. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!canShare || busy}
          onClick={() => void handleShare()}
          className="rounded-sm bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
        >
          {busy ? "Gerando…" : "Compartilhar"}
        </button>
        <button
          type="button"
          disabled
          title="Em breve"
          className="cursor-not-allowed rounded-sm border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] opacity-70"
        >
          Link público · Em breve
        </button>
      </div>
      {error ? (
        <p className="text-sm text-[var(--color-error)]">{error}</p>
      ) : null}

      {/* Off-screen capture target */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 left-[-10000px] z-[-1]"
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
    </div>
  );
}
