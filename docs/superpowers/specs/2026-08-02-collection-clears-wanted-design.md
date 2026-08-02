# Coleção limpa lista de procura

**Date:** 2026-08-02  
**Status:** Approved design

## Goal

Quando o usuário adiciona uma carta **nova** à coleção e ela estava em **Procurando**, removê-la automaticamente da lista de procura (local + Firestore/mural), com feedback leve na UI.

Espelha a regra já existente: remover da coleção → sai de **Anunciando**.

## Behavior

1. `addCardToCollection` adiciona à coleção como hoje (store + schedule Firestore).
2. Se a carta é nova na coleção **e** está em Procurando → `removeCardFromWanted` (mesmo path que a remoção manual: store + `scheduleDeleteTradeCard("wanted")`).
3. Se a carta já estava na coleção → no-op além do retorno (sem re-schedule, sem mexer na procura).
4. Remover da coleção **não** recoloca a carta na procura.

## API

```ts
addCardToCollection(card): { added: boolean; removedFromWanted: boolean }
```

- `added` — true só na primeira inclusão.
- `removedFromWanted` — true só se de fato saiu da procura neste add.

## UI feedback

Só quando `removedFromWanted` (ou contagem > 0 no lote):

| Call site | Feedback |
|-----------|----------|
| `CardDetailPage` | Texto curto na área de ações: “Removida da lista de procura.” |
| `CatalogSetPage` (`addSelected`) | Banner `wantedHint` existente: 1 → “1 carta removida da busca.” / N → “N cartas removidas da busca.” |

A regra vive em `addCardToCollection`; o feedback liga-se nos dois únicos call sites atuais (detalhe **e** catálogo do set).

## Error handling

Falha no delete Firestore da procura: mesmo padrão atual (`console.warn`; UI local já refletiu). Sem mudança em `firestore.rules`.

## Out of scope

- Toast/notificação global
- Re-adicionar à procura ao remover da coleção
- Novos call sites além de detalhe e catálogo do set
- Alterações de regras/indexes Firebase

## Follow-up (2026-08-02)

Overlap legado (carta já na coleção **e** na busca) é limpo por `pruneWantedOwnedCards` no login/sync. `addCardToWanted` recusa cartas já possuídas.

## Verification

1. Carta na procura → adicionar no detalhe → some da procura + aviso.
2. Carta(s) na procura → selecionar e adicionar no set → some + hint com contagem.
3. Já na coleção, ou sem estar na procura → comportamento atual, sem aviso de remoção da busca.
