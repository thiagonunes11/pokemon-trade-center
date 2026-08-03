# Pokédex nacional — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aba `/pokedex` com progresso nacional automático (total / tenho / faltam) derivado da coleção TCG via `dexId` TCGdex.

**Architecture:** Lista nacional via PokéAPI (species + sprites estáticos). `ownedDexIds` derivado das cartas da coleção com lookup leve TCGdex (`card.get` → `dexId`) + fallback de nome. UI virtualizada, filtros locais, sem drill-down e sem sync Firestore novo.

**Tech Stack:** Vite 7, React 19, TanStack Query (+ persister existente), `@tanstack/react-virtual`, TCGdex SDK, PokéAPI REST. Sem deps novas. Sem framework de teste — `npm run lint` / `npm run build` + checklist manual.

## Global Constraints

- UI copy in PT-BR
- Spec: `docs/superpowers/specs/2026-08-03-pokedex-national-progress-design.md`
- Sem detalhe ao tocar; sem override manual; sem checklist Firestore
- Match: preferir `dexId`; fallback de nome best-effort
- Sem deps novas; web-only
- Atualizar `AGENTS.md` + `README.md` (rota)

## File map

| File | Responsibility |
|------|----------------|
| `src/features/pokedex/types.ts` | `NationalSpecies`, filtros |
| `src/features/pokedex/matchDexIds.ts` | Normalizar nome de carta + match por nome |
| `src/features/pokedex/pokeApi.ts` | Fetch lista nacional + nomes PT |
| `src/features/pokedex/tcgdexDexIds.ts` | Lookup leve `cardId → number[]` |
| `src/features/pokedex/useNationalDex.ts` | React Query da lista |
| `src/features/pokedex/useOwnedDexIds.ts` | Deriva `Set` a partir da coleção |
| `src/features/pokedex/PokedexGrid.tsx` | Grade virtualizada |
| `src/features/pokedex/index.ts` | Re-exports |
| `src/pages/PokedexPage.tsx` | Página (contadores, busca, filtros, grid) |
| `src/App.tsx` | Rota `/pokedex` |
| `src/layouts/AppLayout.tsx` | Item de nav Pokédex |
| `AGENTS.md` / `README.md` | Documentar rota |

---

### Task 1: Matching puro + tipos

**Files:**
- Create: `src/features/pokedex/types.ts`
- Create: `src/features/pokedex/matchDexIds.ts`

**Interfaces:**
- Produces:
  - `export type NationalSpecies = { dexId: number; name: string; nameEn: string; spriteUrl: string }`
  - `export type PokedexFilter = "all" | "owned" | "missing"`
  - `export function normalizePokemonCardName(name: string): string`
  - `export function matchDexIdsByCardName(cardName: string, species: NationalSpecies[]): number[]`
  - `export function spriteUrlForDexId(dexId: number): string`

- [ ] **Step 1: Criar tipos e helpers**

```ts
// types.ts
export type NationalSpecies = {
  dexId: number;
  name: string;
  nameEn: string;
  spriteUrl: string;
};

export type PokedexFilter = "all" | "owned" | "missing";
```

```ts
// matchDexIds.ts
import type { NationalSpecies } from "./types";

const SUFFIX_RE =
  /\s+(ex|EX|gx|GX|v|V|vmax|VMAX|vstar|VSTAR|lv\.?\s*x|LV\.?\s*X|δ)$/i;
const MEGA_RE = /^mega\s+/i;
const SPACE_RE = /\s+/g;

export function spriteUrlForDexId(dexId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexId}.png`;
}

export function normalizePokemonCardName(name: string): string {
  return name
    .trim()
    .replace(MEGA_RE, "")
    .replace(SUFFIX_RE, "")
    .replace(SPACE_RE, " ")
    .trim()
    .toLocaleLowerCase("en-US");
}

export function matchDexIdsByCardName(
  cardName: string,
  species: NationalSpecies[],
): number[] {
  const needle = normalizePokemonCardName(cardName);
  if (!needle) return [];
  const hits = species.filter((s) => {
    const en = normalizePokemonCardName(s.nameEn);
    const display = normalizePokemonCardName(s.name);
    return en === needle || display === needle;
  });
  return hits.map((s) => s.dexId);
}
```

- [ ] **Step 2: Smoke check no Node**

Run:

```bash
node --input-type=module -e "
import { createRequire } from 'module';
// functions are TS — after Task 5 build validates; for now assert regex mentally:
const name = 'Mega Venusaur ex'.replace(/^mega\s+/i,'').replace(/\s+(ex|v|vmax|vstar)$/i,'').trim().toLowerCase();
if (name !== 'venusaur') throw new Error(name);
console.log('ok');
"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add src/features/pokedex/types.ts src/features/pokedex/matchDexIds.ts
git commit -m "feat(pokedex): helpers de match por nome e tipos"
```

---

### Task 2: Cliente PokéAPI + TCGdex dexId leve

**Files:**
- Create: `src/features/pokedex/pokeApi.ts`
- Create: `src/features/pokedex/tcgdexDexIds.ts`

**Interfaces:**
- Consumes: `NationalSpecies`, `spriteUrlForDexId`
- Produces:
  - `export async function fetchNationalSpecies(): Promise<NationalSpecies[]>`
  - `export async function fetchCardDexIds(cardId: string): Promise<{ dexIds: number[]; cardName: string | null }>`

- [ ] **Step 1: Implementar `pokeApi.ts`**

Comportamento:
1. `GET https://pokeapi.co/api/v2/pokemon-species?limit=2000` (paginar com `next` se necessário até esgotar).
2. Para cada result: `dexId` = número no final da `url`; `nameEn` = capitalizar `name` (slug → `Bulbasaur`).
3. Em seguida enriquecer nomes PT: buscar species em lotes de 40 (`GET .../pokemon-species/{id}`), ler `names` com `language.name === "pt-BR"` ou `"pt"`, senão manter EN.
4. Ordenar por `dexId` ascendente.
5. `spriteUrl = spriteUrlForDexId(dexId)`.

```ts
const POKEAPI = "https://pokeapi.co/api/v2";

type SpeciesListItem = { name: string; url: string };
type SpeciesListResponse = {
  count: number;
  next: string | null;
  results: SpeciesListItem[];
};

function capitalizeSlug(slug: string): string {
  return slug
    .split("-")
    .map((p) => (p ? p[0]!.toUpperCase() + p.slice(1) : p))
    .join(" ");
}

function dexIdFromUrl(url: string): number | null {
  const m = url.match(/\/pokemon-species\/(\d+)\/?$/);
  return m ? Number(m[1]) : null;
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]!);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return out;
}

export async function fetchNationalSpecies(): Promise<NationalSpecies[]> {
  const all: SpeciesListItem[] = [];
  let url: string | null = `${POKEAPI}/pokemon-species?limit=200`;
  while (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`PokéAPI species list failed: ${res.status}`);
    const data = (await res.json()) as SpeciesListResponse;
    all.push(...data.results);
    url = data.next;
  }

  const base = all
    .map((item) => {
      const dexId = dexIdFromUrl(item.url);
      if (dexId == null) return null;
      const nameEn = capitalizeSlug(item.name);
      return {
        dexId,
        name: nameEn,
        nameEn,
        spriteUrl: spriteUrlForDexId(dexId),
      } satisfies NationalSpecies;
    })
    .filter((s): s is NationalSpecies => s != null)
    .sort((a, b) => a.dexId - b.dexId);

  const enriched = await mapPool(base, 40, async (species) => {
    try {
      const res = await fetch(`${POKEAPI}/pokemon-species/${species.dexId}`);
      if (!res.ok) return species;
      const data = (await res.json()) as {
        names?: Array<{ name: string; language: { name: string } }>;
      };
      const pt =
        data.names?.find((n) => n.language.name === "pt-BR")?.name ??
        data.names?.find((n) => n.language.name === "pt")?.name;
      if (!pt) return species;
      return { ...species, name: pt };
    } catch {
      return species;
    }
  });

  return enriched.sort((a, b) => a.dexId - b.dexId);
}
```

- [ ] **Step 2: Implementar `tcgdexDexIds.ts`**

Lookup **leve** (não usar `fetchCardWithFallback` — evita Pokémon TCG API em massa):

```ts
import { tcgdexEn, tcgdexPt } from "@/lib/tcgdex";

function settled<T>(r: PromiseSettledResult<T>): T | null {
  return r.status === "fulfilled" ? r.value : null;
}

export async function fetchCardDexIds(
  cardId: string,
): Promise<{ dexIds: number[]; cardName: string | null }> {
  const [ptResult, enResult] = await Promise.allSettled([
    tcgdexPt.card.get(cardId),
    tcgdexEn.card.get(cardId),
  ]);
  const pt = settled(ptResult);
  const en = settled(enResult);
  const card = pt ?? en;
  if (!card) return { dexIds: [], cardName: null };
  const dexIds = Array.isArray(card.dexId)
    ? card.dexId.filter((n) => Number.isFinite(n))
    : [];
  const cardName = (pt?.name || en?.name || null) as string | null;
  return { dexIds, cardName };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/pokedex/pokeApi.ts src/features/pokedex/tcgdexDexIds.ts
git commit -m "feat(pokedex): clientes PokéAPI e lookup dexId TCGdex"
```

---

### Task 3: Hooks React Query

**Files:**
- Create: `src/features/pokedex/useNationalDex.ts`
- Create: `src/features/pokedex/useOwnedDexIds.ts`
- Create: `src/features/pokedex/index.ts`

**Interfaces:**
- Consumes: `fetchNationalSpecies`, `fetchCardDexIds`, `matchDexIdsByCardName`, `useCollectionStore`, `useAuthStore`
- Produces:
  - `useNationalDex()` → `{ species, isLoading, isError, refetch }`
  - `useOwnedDexIds(species: NationalSpecies[] | undefined)` → `{ ownedDexIds: Set<number>; isResolving: boolean }`

- [ ] **Step 1: `useNationalDex`**

```ts
import { useQuery } from "@tanstack/react-query";
import { fetchNationalSpecies } from "./pokeApi";

export function useNationalDex() {
  const query = useQuery({
    queryKey: ["national-dex-v1"],
    queryFn: fetchNationalSpecies,
    staleTime: 7 * 24 * 60 * 60 * 1000,
  });
  return {
    species: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
```

- [ ] **Step 2: `useOwnedDexIds`**

```ts
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCollectionStore } from "@/store/useCollectionStore";
import { matchDexIdsByCardName } from "./matchDexIds";
import { fetchCardDexIds } from "./tcgdexDexIds";
import type { NationalSpecies } from "./types";

export function useOwnedDexIds(species: NationalSpecies[] | undefined) {
  const userId = useAuthStore((s) => s.userId);
  const cards = useCollectionStore((s) => s.cards);
  const ownedCards = useMemo(
    () => cards.filter((c) => (c.ownerId ?? null) === (userId ?? null)),
    [cards, userId],
  );
  const cardIds = useMemo(
    () => ownedCards.map((c) => c.id),
    [ownedCards],
  );

  const queries = useQueries({
    queries: cardIds.map((cardId) => ({
      queryKey: ["card-dex-v1", cardId] as const,
      queryFn: () => fetchCardDexIds(cardId),
      staleTime: 7 * 24 * 60 * 60 * 1000,
      enabled: cardIds.length > 0,
    })),
  });

  const ownedDexIds = useMemo(() => {
    const set = new Set<number>();
    if (!species?.length) {
      // ainda assim aplica dexIds diretos enquanto a lista carrega
    }
    queries.forEach((q, i) => {
      if (!q.data) return;
      const { dexIds, cardName } = q.data;
      if (dexIds.length > 0) {
        dexIds.forEach((id) => set.add(id));
        return;
      }
      if (cardName && species?.length) {
        matchDexIdsByCardName(cardName, species).forEach((id) => set.add(id));
        return;
      }
      // fallback: nome da coleção local
      const localName = ownedCards[i]?.name;
      if (localName && species?.length) {
        matchDexIdsByCardName(localName, species).forEach((id) => set.add(id));
      }
    });
    return set;
  }, [queries, species, ownedCards]);

  const isResolving =
    ownedCards.length > 0 && queries.some((q) => q.isLoading || q.isPending);

  return { ownedDexIds, isResolving };
}
```

Nota: `useQueries` retorna array novo a cada render — o `useMemo` depende de `queries`; se isso oscilar demais, derivar de `queries.map(q => q.dataUpdatedAt + status + JSON)` ou `queries.map(q => q.data)`. Preferir dependência estável:

```ts
const resolved = queries.map((q) => q.data);
// useMemo deps: [resolved, species, ownedCards] — resolved ainda é novo.
// Melhor: serializar:
const fingerprint = queries
  .map((q) =>
    q.data
      ? `${q.data.dexIds.join(",")}:${q.data.cardName ?? ""}`
      : q.status,
  )
  .join("|");
```

Usar `fingerprint` + `species` + `ownedCards` nas deps do `useMemo`.

- [ ] **Step 3: `index.ts` re-exports**

```ts
export type { NationalSpecies, PokedexFilter } from "./types";
export { useNationalDex } from "./useNationalDex";
export { useOwnedDexIds } from "./useOwnedDexIds";
```

- [ ] **Step 4: Commit**

```bash
git add src/features/pokedex/
git commit -m "feat(pokedex): hooks da lista nacional e ownedDexIds"
```

---

### Task 4: Grid virtualizado + página + nav + rota

**Files:**
- Create: `src/features/pokedex/PokedexGrid.tsx`
- Create: `src/pages/PokedexPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/layouts/AppLayout.tsx`
- Modify: `src/features/pokedex/index.ts` (export grid se útil)

**Interfaces:**
- Consumes: hooks Task 3, `ProgressFolio`, `SegmentTabs`, `EmptyState`, `normalizeSearch`
- Produces: página utilizável em `/pokedex`

- [ ] **Step 1: `PokedexGrid`**

Espelhar o padrão de colunas de `CardGrid` (`useWindowVirtualizer`), células **não clicáveis**:

- Mostrar `#001`, sprite (`onError` → esconder img / mostrar inicial), nome
- `owned`: opacidade 100% + leve ring accent; `missing`: `opacity-40` / `grayscale`
- `aria-label`: `"#001 Bulbasaur, na Pokédex"` / `"faltando"`

- [ ] **Step 2: `PokedexPage`**

Layout:
1. Título `Pokédex`
2. `ProgressFolio` com `owned=ownedCount`, `total=species.length` (ownedCount = species filtradas por `ownedDexIds.has`)
3. Texto auxiliar opcional: `Tenho X · Faltam Y · Total Z` (ProgressFolio já cobre parcialmente — alinhar labels; se ProgressFolio usar copy de coleção, usar contadores explícitos acima)
4. Input busca (nome ou número)
5. `SegmentTabs` Todas / Tenho / Faltam (`layoutId="pokedex-filter"`)
6. Estados: loading lista, erro + `Tentar de novo`, grid vazia do filtro
7. `useScrollMemory()` como nas outras páginas

Filtro local:

```ts
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
```

- [ ] **Step 3: Rota + nav**

Em `App.tsx`:

```tsx
import { PokedexPage } from "@/pages/PokedexPage";
// ...
<Route path="/pokedex" element={<PokedexPage />} />
```

Em `AppLayout.tsx`: inserir após Coleção:

```ts
{ to: "/pokedex", label: "Pokédex", Icon: IconPokedex },
```

Ícone SVG simples (pokébola estilizada stroke 24×24), mesmo padrão dos outros ícones.

Nav final: Catálogo · Coleção · Pokédex · Trocas · Ajustes.

- [ ] **Step 4: `npm run lint` e `npm run build`**

Expected: exit 0

- [ ] **Step 5: Commit**

```bash
git add src/features/pokedex src/pages/PokedexPage.tsx src/App.tsx src/layouts/AppLayout.tsx
git commit -m "feat(pokedex): aba nacional com progresso da coleção"
```

---

### Task 5: Docs

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md`

- [ ] **Step 1: Atualizar rotas e estrutura**

`AGENTS.md`:
- Tabela de rotas: `/pokedex` → Pokédex nacional (progresso)
- Estrutura: `features/pokedex/`
- Arquivos-chave: linha Pokédex
- Objetivo / MVP: mencionar aba Pokédex se couber numa linha

`README.md`:
- Lista de features + tabela de rotas

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md README.md
git commit -m "docs: documenta rota e escopo da Pokédex"
```

---

### Task 6: Verificação manual

- [ ] Coleção vazia → Tenho 0, Faltam = total
- [ ] Adicionar carta com `dexId` (ex. Venusaur / Mega Venusaur ex) → espécie correspondente em Tenho
- [ ] Remover → volta a Faltam
- [ ] Filtros + busca `"pika"` / `"25"`
- [ ] Nav mobile/desktop com Pokédex
- [ ] Toque na célula não navega
- [ ] `npm run lint` && `npm run build`

---

## Self-review (plan vs spec)

| Spec | Task |
|------|------|
| Rota `/pokedex` + nav | 4 |
| Contadores + progresso | 4 (`ProgressFolio` / labels) |
| Grid virtualizada | 4 |
| Busca + filtros | 4 |
| PokéAPI + cache | 2–3 |
| `dexId` + fallback nome | 1–3 |
| Sem drill-down / sem Firestore checklist | 4 (células não-nav) |
| Docs | 5 |
| Erro PokéAPI / sprite 404 | 4 |
| Trainer/Energy ignorados | 2–3 (sem dexId + sem match) |
