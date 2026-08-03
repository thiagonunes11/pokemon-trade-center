import { EmptyState } from "@/components/EmptyState";
import { ProgressFolio } from "@/components/ProgressFolio";
import { SegmentTabs } from "@/components/SegmentTabs";
import {
  PokedexGrid,
  useNationalDex,
  useOwnedDexIds,
  type NationalSpecies,
  type PokedexFilter,
} from "@/features/pokedex";
import { useScrollMemory } from "@/hooks/useScrollMemory";
import { normalizeSearch } from "@/lib/cardOrder";
import { useDeferredValue, useMemo, useState } from "react";

const filterOptions: Array<{ key: PokedexFilter; label: string }> = [
  { key: "all", label: "Todas" },
  { key: "owned", label: "Tenho" },
  { key: "missing", label: "Faltam" },
];

function filterSpecies(
  species: NationalSpecies[],
  owned: Set<number>,
  filter: PokedexFilter,
  needle: string,
): NationalSpecies[] {
  return species.filter((s) => {
    if (filter === "owned" && !owned.has(s.dexId)) return false;
    if (filter === "missing" && owned.has(s.dexId)) return false;
    if (!needle) return true;
    const num = String(s.dexId);
    const padded = num.padStart(3, "0");
    return (
      normalizeSearch(s.name).includes(needle) ||
      normalizeSearch(s.nameEn).includes(needle) ||
      num.includes(needle) ||
      padded.includes(needle)
    );
  });
}

export function PokedexPage() {
  const { species, isLoading, isError, refetch } = useNationalDex();
  const { ownedDexIds, isResolving } = useOwnedDexIds(species);
  const [filter, setFilter] = useState<PokedexFilter>("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const needle = normalizeSearch(deferredSearch);

  const total = species?.length ?? 0;
  const ownedCount = useMemo(() => {
    if (!species?.length) return 0;
    let count = 0;
    for (const s of species) {
      if (ownedDexIds.has(s.dexId)) count += 1;
    }
    return count;
  }, [species, ownedDexIds]);
  const missingCount = Math.max(total - ownedCount, 0);

  const visible = useMemo(
    () =>
      species ? filterSpecies(species, ownedDexIds, filter, needle) : [],
    [species, ownedDexIds, filter, needle],
  );

  useScrollMemory(!isLoading && !isError && total > 0);

  return (
    <div className="space-y-5">
      <header className="space-y-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-3xl">
            Pokédex
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Progresso nacional automático a partir da sua coleção TCG.
          </p>
        </div>

        <p className="text-sm text-[var(--color-text-secondary)]">
          <span className="font-semibold text-[var(--color-text)]">
            Tenho {ownedCount}
          </span>
          <span className="text-[var(--color-text-muted)]">
            {" "}
            · Faltam {missingCount} · Total {total || "—"}
          </span>
          {isResolving ? (
            <span className="text-[var(--color-text-muted)]">
              {" "}
              · atualizando…
            </span>
          ) : null}
        </p>

        <ProgressFolio
          owned={ownedCount}
          total={isLoading ? undefined : total}
          isLoading={isLoading}
        />
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Buscar espécie</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou número…"
            className="ui-input w-full"
            autoComplete="off"
          />
        </label>
        <SegmentTabs
          value={filter}
          options={filterOptions}
          onChange={setFilter}
          layoutId="pokedex-filter"
          aria-label="Filtrar Pokédex"
          className="w-full sm:w-auto"
        />
      </div>

      {isError ? (
        <EmptyState
          title="Não foi possível carregar a Pokédex"
          description="Verifique a conexão e tente de novo."
          action={
            <button
              type="button"
              className="ui-btn-accent"
              onClick={() => void refetch()}
            >
              Tentar de novo
            </button>
          }
        />
      ) : null}

      {!isError && isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          Carregando espécies…
        </p>
      ) : null}

      {!isError && !isLoading && visible.length === 0 ? (
        <EmptyState
          title={
            needle || filter !== "all"
              ? "Nenhuma espécie neste filtro"
              : "Pokédex vazia"
          }
          description={
            needle || filter !== "all"
              ? "Ajuste a busca ou o filtro Todas / Tenho / Faltam."
              : undefined
          }
        />
      ) : null}

      {!isError && !isLoading && visible.length > 0 ? (
        <PokedexGrid species={visible} ownedDexIds={ownedDexIds} />
      ) : null}
    </div>
  );
}
