# Trocas — listas, mural, chat e comunidade

**Date:** 2026-08-01  
**Status:** Implemented (mural + chat simples + WhatsApp por cidade)

## Goal

Listas Anunciando/Procurando, mural público de todos os anúncios (filtro opcional), chat texto 1:1 nacional, e links de grupos WhatsApp por cidade.

## Data

- `trades/{uid}/offering|wanted/{cardId}` — listas privadas
- `listings/{uid}_{kind}_{cardId}` — mural
- `publicProfiles/{uid}` — `displayName`, `cityId?`
- `threads/{threadId}/messages` — texto
- `communities/{cityId}` — `name`, `whatsappUrl` (seed no Console)

## UI

- Trocas: Explorar | Anunciando | Procurando | Conversas | Comunidade
- `/trades/chat/:threadId` — chat mínimo
- Filtro Explorar: “Só o que eu quero” (off por padrão)

## Out of scope

- Geo GPS, FCM, proposta estruturada, WhatsApp pessoal no perfil, admin de comunidades no app
