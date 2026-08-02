# Ofertas com preço/troca + links externos

**Date:** 2026-08-02  
**Status:** Approved design

## Goal

1. Em **Minhas ofertas**, cada carta anunciada declara condições: preço em R$ e/ou cartas do catálogo aceitas em troca (obrigatório pelo menos um).
2. As mesmas condições aparecem no mural **Explorar** e no **perfil público**.
3. No **detalhe da carta** (`/card/:id`), atalhos para buscar a carta na **Liga Pokémon** e no **MYP Cards**.

## Decisions

| Tema | Escolha |
|------|---------|
| Preço e cartas desejadas | Podem coexistir (qualquer combinação válida) |
| Cartas desejadas | Seleção no catálogo (sets suportados), não texto livre |
| Onde mostrar condições | Minhas ofertas + Explorar + perfil |
| Obrigatoriedade | Publicar exige `priceBRL > 0` **ou** `wantCards.length >= 1` |
| Modelo | Campos na própria oferta / listing (não doc separado) |
| Links externos | Só no detalhe da carta; busca por nome (sem ID de produto externo) |

## Data

Extend offering documents and public listings:

```ts
priceBRL: number | null; // null se só troca por cartas
wantCards: Array<{
  id: string;
  name: string;
  imageUrl: string | null;
  setId: string;
}>;
```

Paths (unchanged roots):

- `trades/{uid}/offering/{cardId}` — private + terms
- `listings/{uid}_offering_{cardId}` — public mirror including terms

Zustand `TradeListCard` (offering only) gains the same fields. Wanted list (`trades/.../wanted`) unchanged.

**Validation (client + `firestore.rules`):**

- If `priceBRL` is set: must be a finite number `> 0`
- `wantCards` array of valid card-shaped objects (cap reasonable, e.g. ≤ 20)
- At least one of: valid price **or** non-empty `wantCards`

**Legacy offerings** without terms: still visible in Minhas ofertas with CTA to complete; omitted from Explorar until valid (or filtered client-side / not backfilled as public until complete).

## UI — Minhas ofertas

1. After picking a collection card to announce → sheet/panel **Condições da oferta**:
   - Preço (R$) optional input
   - Aceito em troca: catalog picker (same expansions as app); chips/list with remove
   - **Publicar** disabled until validation passes
2. Offering grid: under each card show `R$ …` chip and/or want-card summary; **Editar condições**; remove (×) as today
3. Editing reuses the same panel and re-syncs private + listing docs

## UI — Explorar e perfil

Under each offering listing: price chip and/or “Troca por: …” (names or thumbnails). No change to Conversar beyond existing thread open (no auto message in this slice).

## UI — Detalhe da carta

Two external links (new tab, `rel="noopener noreferrer"`):

| Label | URL pattern |
|-------|-------------|
| Liga Pokémon | `https://www.ligapokemon.com.br/?view=cards/search&card={encodeURIComponent(name)}` |
| MYP Cards | `https://mypcards.com/pokemon?busca={encodeURIComponent(name)}` |

No price scraping; display-only shortcuts. If MYP query param proves ineffective at implement time, switch to the site’s documented search param without changing UX (same two buttons).

## Sync

- Extend `scheduleUpsertTradeCard` / listing upsert payloads with `priceBRL` + `wantCards`
- Pull/merge preserves new fields
- Update `isValidTradeCard` / `isValidListing` in `firestore.rules` (deploy required)
- AGENTS.md / README note if public listing shape changes

## Out of scope

- In-app payments / escrow
- Structured trade proposals in chat / auto-seeded chat text
- Free-text want lists
- Changing global **Minha busca** semantics
- Exact MYP product deep links (internal IDs unknown)
- Offering shortcuts from catalog set grid

## Verification

1. Announce with only price → appears in Minhas ofertas, Explorar, perfil with R$
2. Announce with only want cards → same places show troca
3. Announce with both → both shown
4. Cannot publish with neither
5. Legacy incomplete offering: complete flow works; not shown on Explorar until valid
6. Card detail: Liga + MYP open searchable pages for the card name
7. Remove offering still clears private + listing
