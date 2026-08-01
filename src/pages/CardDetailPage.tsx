import { EnergyIconRow } from "@/components/EnergyIcon";
import {
  addCardToCollection,
  removeCardFromCollection,
} from "@/features/collection";
import { useCard } from "@/features/cards";
import { useAuthStore } from "@/store/useAuthStore";
import { useCollectionStore } from "@/store/useCollectionStore";
import { Link, useNavigate, useParams } from "react-router-dom";

export function CardDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: card, isLoading, error } = useCard(id);
  const userId = useAuthStore((s) => s.userId);
  const isInCollection = useCollectionStore((s) =>
    s.cards.some(
      (c) => c.id === id && (c.ownerId ?? null) === (userId ?? null),
    ),
  );

  const handleToggle = () => {
    if (!card) return;
    if (isInCollection) {
      removeCardFromCollection(id);
    } else {
      addCardToCollection({
        id,
        name: card.name,
        imageUrl: card.image ? `${card.image}/high.webp` : null,
        setId: card.set?.id ?? id.split("-")[0],
      });
    }
  };

  if (isLoading) {
    return (
      <p className="text-[var(--color-text-secondary)]">Carregando carta…</p>
    );
  }

  if (error || !card) {
    return (
      <div className="space-y-3">
        <p className="text-[var(--color-error)]">Carta não encontrada</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-[var(--color-accent)] hover:underline"
        >
          Voltar
        </button>
      </div>
    );
  }

  const imageUrl = card.image ? `${card.image}/high.png` : null;
  const types = (card.types ?? []) as string[];
  const attacks = (card.attacks ?? []) as Array<{
    name: string;
    damage?: string | number;
    effect?: string;
    cost?: string[];
  }>;
  const weaknesses = (card.weaknesses ?? []) as Array<{
    type: string;
    value?: string;
  }>;
  const resistances = (card.resistances ?? []) as Array<{
    type: string;
    value?: string;
  }>;

  return (
    <div className="space-y-6">
      <Link
        to={card.set?.id ? `/catalog/${card.set.id}` : "/catalog"}
        className="text-sm text-[var(--color-accent)] hover:underline"
      >
        ← Voltar
      </Link>

      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        <div className="mx-auto w-full max-w-[280px]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={card.name}
              className="w-full rounded-xl shadow-md"
            />
          ) : (
            <div className="flex aspect-[0.72] items-center justify-center rounded-xl bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]">
              Sem imagem disponível
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-text)]">
              {card.name}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {card.id}
              {card.hp != null ? ` · PS ${card.hp}` : ""}
            </p>
            {types.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  Tipo
                </span>
                <EnergyIconRow types={types} size={22} />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleToggle}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${
              isInCollection
                ? "bg-[var(--color-error)] hover:opacity-90"
                : "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]"
            }`}
          >
            {isInCollection ? "Remover da coleção" : "Adicionar à coleção"}
          </button>

          {attacks.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Ataques
              </h2>
              {attacks.map((atk) => (
                <div
                  key={atk.name}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {atk.cost && atk.cost.length > 0 && (
                        <EnergyIconRow types={atk.cost} size={16} />
                      )}
                      <span className="font-medium text-[var(--color-text)]">
                        {atk.name}
                      </span>
                    </div>
                    {atk.damage != null && atk.damage !== "" && (
                      <span className="font-semibold text-[var(--color-text)]">
                        {atk.damage}
                      </span>
                    )}
                  </div>
                  {atk.effect && (
                    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                      {atk.effect}
                    </p>
                  )}
                </div>
              ))}
            </section>
          )}

          {(weaknesses.length > 0 || resistances.length > 0) && (
            <section className="flex flex-wrap gap-6">
              {weaknesses.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                    Fraqueza
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <EnergyIconRow
                      types={weaknesses.map((w) => w.type)}
                      size={18}
                    />
                    <span className="text-[var(--color-text-secondary)]">
                      {weaknesses.map((w) => w.value).filter(Boolean).join(" ")}
                    </span>
                  </div>
                </div>
              )}
              {resistances.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                    Resistência
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <EnergyIconRow
                      types={resistances.map((r) => r.type)}
                      size={18}
                    />
                    <span className="text-[var(--color-text-secondary)]">
                      {resistances
                        .map((r) => r.value)
                        .filter(Boolean)
                        .join(" ")}
                    </span>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
