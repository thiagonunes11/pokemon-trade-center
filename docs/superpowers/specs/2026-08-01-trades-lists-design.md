# Trocas — listas Anunciando / Procurando

**Date:** 2026-08-01  
**Status:** Approved

## Goal

Permitir que o usuário monte e salve duas listas de troca: cartas que **anuncia** (da coleção) e cartas que **procura** (do catálogo). Sem matching/região nesta fatia.

## Data

- `trades/{uid}/offering/{cardId}`
- `trades/{uid}/wanted/{cardId}`
- Fields: `id`, `name`, `imageUrl`, `setId`, `updatedAt`
- Zustand + local persist + pull on login + debounced writes

## UI

- Trades tab: Anunciando | Procurando
- Add from collection (offering) / catalog (wanted)
- Remove from list
- Matching/region: stub copy only

## Out of scope

- Geo, matching, chat, card-detail shortcuts
