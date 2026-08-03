# Pokédex nacional (progresso por espécie)

**Date:** 2026-08-03  
**Status:** Approved design  
**Branch context:** feature nova (pode seguir em branch dedicada ou na de catálogo)

## Goal

Nova aba **Pokédex** no app: progresso da Pokédex nacional (total / tenho / faltam), marcado **automaticamente** quando a coleção TCG contém qualquer carta daquela espécie. Sem detalhe ao tocar nesta fatia.

## Decisions (from brainstorming)

| Tópico | Escolha |
|--------|---------|
| Modelo | Por espécie (nacional), não por printing TCG |
| Cobertura | Nacional completa (~1025 espécies) |
| Toque | Só visual tenho/falta — sem drill-down |
| “Tenho” | Automático via coleção TCG |
| Matching | Preferir `dexId` TCGdex; fallback de nome |

## Scope

### In

- Rota `/pokedex` no shell autenticado
- Item na sidebar desktop + bottom nav mobile
- Header com `Tenho X · Faltam Y · Total Z` + barra de progresso
- Grade/lista virtualizada de espécies (`#001`…): sprite, nome, estado tenho/falta
- Busca local por nome ou número
- Filtro: Todas / Tenho / Faltam
- Lista nacional via PokéAPI (species) com cache
- Resolução `cardId → dexId[]` via TCGdex com cache
- Docs: `AGENTS.md` / `README` (rota + escopo)

### Out

- Detalhe da espécie / lista de cartas / link para `/card/:id`
- Override manual (marcar sem carta / desmarcar)
- Entradas separadas para Mega, regional, Gigantamax (contam no `dexId` da espécie base)
- Sync Firestore dedicado da Pokédex (deriva da coleção já sincronizada)
- FCM / compartilhar Pokédex pública

## UX

1. Usuário abre **Pokédex** na nav.
2. Vê contadores e grade nacional.
3. Espécies “tenho” com destaque (cor/opacidade); “faltam” mais apagadas.
4. Filtros e busca só reordenam/escondem localmente.
5. Toque na célula **não** navega (opcional: sem `button` de navegação; pode ser `div`/não-interativo além do filtro).

UI em PT-BR; nomes de espécie em PT quando a PokéAPI tiver `pt`/`pt-BR`, senão EN.

## Data

### National species list

- `GET https://pokeapi.co/api/v2/pokemon-species?limit=2000` (ou paginado até `count`)
- Para nomes PT: sob demanda ou batch leve de species por id (avaliar na implementação: preferir listagem + fetch de nomes em background / cache)
- Sprite (sem request extra por espécie na grade):  
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{dexId}.png`
- Tipo derivado na app:

```ts
type NationalSpecies = {
  dexId: number;
  name: string; // display (PT se houver)
  nameEn: string;
  spriteUrl: string;
};
```

### Owned set

1. Cartas de `useCollectionStore` do usuário logado.
2. Para cada `card.id`, obter TCGdex card (cache React Query `['card-dex', cardId]` ou equivalente) e ler `dexId: number[]` quando existir.
3. Ignorar cartas sem `dexId` e que falhem no fallback de nome (Trainer/Energy tipicamente).
4. `ownedDexIds = Set` da união dos dexIds.
5. Espécie `owned` ↔ `ownedDexIds.has(species.dexId)`.

**Fallback de nome** (só sem `dexId`): normalizar nome da carta (remover sufixos `ex`, `V`, `VMAX`, `VSTAR`, prefixo `Mega ` quando aplicável) e comparar com `nameEn` / `name` da species — best-effort; documentar imprecisão.

### Counters

- `total = national.length`
- `ownedCount = national.filter(s => ownedDexIds.has(s.dexId)).length`
- `missingCount = total - ownedCount`

### Persistence

- Sem checklist Firestore.
- Cache: species list + `cardId → dexId[]` (TanStack Query + persister existente se couber).

## Architecture / files

| Peça | Responsabilidade |
|------|------------------|
| `App.tsx` | Rota `/pokedex` |
| `AppLayout.tsx` | Nav item Pokédex |
| `PokedexPage.tsx` | Layout, filtros, contadores, grid |
| `features/pokedex/pokeApi.ts` | Cliente listagem species / nomes |
| `features/pokedex/matchDexIds.ts` | Normalização de nome + helpers |
| `features/pokedex/useNationalDex.ts` | Query da lista nacional |
| `features/pokedex/useOwnedDexIds.ts` | Deriva owned a partir da coleção + TCGdex |

Virtualização: reutilizar abordagem de `@tanstack/react-virtual` (padrão CardGrid).

## Error handling

| Caso | Comportamento |
|------|----------------|
| PokéAPI offline/erro | Empty state + botão tentar de novo |
| TCGdex falha para um cardId | Pula essa carta; demais seguem |
| Sprite 404 | Placeholder neutro / inicial do nome |
| Coleção vazia | Todos “faltam”; contadores 0 / total |

## Testing / verification

1. Coleção vazia → owned 0, missing = total.
2. Adicionar `me01-003` (Mega Venusaur ex, `dexId: [3]`) → `#003` em Tenho.
3. Remover a carta → volta a Faltam.
4. Filtros Todas / Tenho / Faltam e busca por “pika” / “25”.
5. Nav com 4 destinos no mobile e desktop.
6. `npm run lint` + `npm run build`.

## Success criteria

- Aba Pokédex utilizável com progresso nacional automático.
- Match principal via `dexId` TCGdex.
- Sem drill-down; sem sync novo.
- Docs de rota atualizados.
