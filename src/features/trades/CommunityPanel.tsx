import {
  fetchCommunities,
  getMyCityId,
  type Community,
} from "@/features/trades/communities";
import { updateUserProfile } from "@/features/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useMemo, useState } from "react";

export function CommunityPanel() {
  const userId = useAuthStore((s) => s.userId);
  const username = useAuthStore((s) => s.username);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [cityId, setCityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [list, mine] = await Promise.all([
          fetchCommunities(),
          getMyCityId(userId),
        ]);
        if (cancelled) return;
        setCommunities(list);
        setCityId(mine);
      } catch (err) {
        console.warn("[Comunidade]", err);
        if (!cancelled) setError("Não foi possível carregar comunidades.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const selected = useMemo(
    () => communities.find((c) => c.id === cityId) ?? null,
    [communities, cityId],
  );

  const handleCityChange = async (next: string) => {
    if (!userId) return;
    const value = next || null;
    setSaving(true);
    setError(null);
    try {
      await updateUserProfile(userId, {
        cityId: value,
        displayName: username ?? "Treinador",
      });
      setCityId(value);
    } catch (err) {
      console.warn("[Comunidade] save", err);
      setError("Não foi possível salvar a cidade.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">Carregando…</p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-text-secondary)]">
        Escolha sua cidade e entre no grupo de colecionadores no WhatsApp. O
        chat do app serve só para combinar trocas 1:1.
      </p>

      {communities.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
          Nenhuma comunidade cadastrada ainda. Em breve adicionamos cidades e
          links de grupo no Firebase Console.
        </p>
      ) : (
        <>
          <label className="block space-y-2">
            <span className="text-xs font-semibold tracking-wide text-[var(--color-text-muted)] uppercase">
              Sua cidade
            </span>
            <select
              value={cityId ?? ""}
              disabled={saving}
              onChange={(e) => void handleCityChange(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 text-[var(--color-text)]"
            >
              <option value="">Não definida</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          {selected ? (
            <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
              <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-text)]">
                Colecionadores — {selected.name}
              </h3>
              {selected.whatsappUrl ? (
                <a
                  href={selected.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center justify-center rounded-xl bg-[var(--color-accent)] px-4 text-sm font-bold text-[var(--color-on-accent)]"
                >
                  Entrar no grupo do WhatsApp
                </a>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">
                  Link do grupo em breve para esta cidade.
                </p>
              )}
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wide text-[var(--color-text-muted)] uppercase">
              Todas as cidades
            </p>
            <ul className="space-y-2">
              {communities.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-3"
                >
                  <span className="font-semibold text-[var(--color-text)]">
                    {c.name}
                  </span>
                  {c.whatsappUrl ? (
                    <a
                      href={c.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-[var(--color-accent)]"
                    >
                      WhatsApp
                    </a>
                  ) : (
                    <span className="text-xs text-[var(--color-text-muted)]">
                      Em breve
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {error ? (
        <p className="text-sm text-[var(--color-error)]">{error}</p>
      ) : null}
    </div>
  );
}
