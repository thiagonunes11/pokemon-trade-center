import { getHandleForUid } from "@/features/profile";
import { profilePathFor } from "@/lib/handle";
import { useAuthStore } from "@/store/useAuthStore";
import { useState } from "react";

export function ShareProfileButton() {
  const userId = useAuthStore((s) => s.userId);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyProfileLink = async () => {
    if (!userId) return;
    try {
      const handle = await getHandleForUid(userId);
      const slug = handle ?? userId;
      const url = `${window.location.origin}${profilePathFor(slug)}`;
      await navigator.clipboard.writeText(url);
      setError(null);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Não foi possível copiar o link.");
    }
  };

  return (
    <div className="w-full space-y-2">
      <button
        type="button"
        disabled={!userId}
        onClick={() => void copyProfileLink()}
        className="flex h-11 w-full items-center justify-center rounded-xl bg-[var(--color-accent)] px-4 text-sm font-bold text-[var(--color-on-accent)] transition hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
      >
        {copied ? "Link do perfil copiado" : "Copiar link do perfil"}
      </button>
      {error ? (
        <p className="text-center text-sm text-[var(--color-error)]">{error}</p>
      ) : null}
    </div>
  );
}
