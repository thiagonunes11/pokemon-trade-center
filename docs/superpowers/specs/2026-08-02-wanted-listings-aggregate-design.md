# Agregar procuras no mural por carta

**Date:** 2026-08-02  
**Status:** Approved design

## Goal

Na aba **Buscas** do Explorar, reduzir ruído visual: muitas pessoas procurando a mesma carta não geram N cards idênticos no feed. Agregar por carta e, ao tocar, listar quem procura com **Conversar** por pessoa.

## Context

Hoje `listings` é `1 doc = 1 usuário × 1 carta × kind`. Isso está ok para dados e chat 1:1, mas o feed de Buscas fica repetitivo. A preocupação é **UX** (achar sinal útil), não mudança de modelo Firestore neste momento.

## Scope

### In

- Aba **Buscas** (`kind === "wanted"`) em `ExploreBoard`
- Agregação **somente no cliente** sobre os `PublicListing` já carregados
- Drill-down: painel com pessoas + Conversar (`ensureThread` existente)
- Filtro “Só o que eu anuncio” continua; resultado também agregado
- Excluir o usuário logado dos grupos (como o feed já exclui o próprio listing)

### Out

- Alterar coleção `listings` / rules / indexes
- Cloud Functions ou docs agregados (`wantedByCard/…`)
- Mudar aba **Disponíveis** (anúncios): continua 1 card = 1 oferta (preço/condições)
- Perfil público `/u/:slug`, **Minha busca**, sync de trades

## Behavior

### Feed (Buscas)

1. Carregar páginas de `listings` wanted como hoje (`fetchListingsPage` / `fetchListingsForCardIds` no filtro).
2. Filtrar `ownerId !== userId`.
3. Agrupar por `cardId`.
4. Cada item do feed:
   - Imagem / nome da carta (metadados do listing mais recente do grupo)
   - Texto: `1 pessoa procura` / `N pessoas procuram`
   - Ação: abrir painel de seekers (toque no card ou CTA “Ver quem procura”)
5. Ordenação dos grupos: `updatedAt` do listing mais recente de cada grupo (desc).
6. “Carregar mais”: busca a próxima página, mescla nos grupos (contagens podem aumentar; novos grupos podem aparecer).

**Contagem:** número de seekers **já carregados** no cliente para aquele `cardId`, não o total global no Firestore. Copy sem prometer total mundial (`N pessoas` / `N pessoas procuram`).

**Um único seeker:** ainda usa o layout agregado (`1 pessoa procura`) + painel com uma linha — consistente.

### Painel (drill-down)

- Título: nome da carta
- Lista por seeker: `displayName` do listing (link para `/u/:ownerId` como no feed atual); botão **Conversar** por linha
- Avatar: `UserAvatar` com fallback de inicial — **sem** N fetches extras de `publicProfiles` nesta fatia (listing não carrega preset)
- Conversar: mesmo fluxo dos anúncios (`ensureThread` → `/trades/chat/:threadId`). Hoje a aba Buscas não tem Conversar no card solto; o painel **passa a oferecer** esse CTA por pessoa
- Fechar volta ao feed; sem “conversar com todos”

### Disponíveis

Sem mudança de UI/comportamento nesta fatia.

### Empty / loading / erro

Reutilizar padrões atuais do `ExploreBoard`. Empty copy de Buscas pode mencionar “procuras de outros treinadores” se o texto atual estiver genérico demais; ajuste mínimo opcional.

## Data

Nenhuma mudança de schema. Tipo derivado no cliente, por exemplo:

```ts
type WantedCardGroup = {
  cardId: string;
  name: string;
  imageUrl: string | null;
  latestUpdatedAt: Date;
  seekers: PublicListing[]; // um por ownerId
};
```

Helper puro (ex. `groupWantedListings(listings): WantedCardGroup[]`) testável / fácil de manter fora do JSX.

## Files (expected)

| Área | Arquivo |
|------|---------|
| UI mural | `src/features/trades/ExploreBoard.tsx` |
| Helper (opcional) | `src/features/trades/groupWantedListings.ts` (ou junto do board se ficar curto) |

Sem alterações em `firestore.rules`, `listingsSync`, stores.

## Error handling

Falha ao abrir chat: mesmo `chatError` atual. Falha ao carregar mural: inalterada.

## Verification

1. Vários listings wanted da mesma carta (outros users) → **um** card no feed com N ≥ 2.
2. Abrir painel → N linhas; Conversar abre thread com a pessoa certa.
3. “Carregar mais” com mais seekers da mesma carta → N sobe; painel atualiza.
4. Filtro “Só o que eu anuncio” → grupos só de cartas que você oferece.
5. Aba Disponíveis → layout 1:1 intacto (preço/condições).
6. Próprio usuário não aparece como seeker no grupo.
