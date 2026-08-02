# AGENTS.md — Contexto para agentes de IA

Leia este arquivo **antes** de implementar mudanças. Documentação humana: [README.md](./README.md).

---

## 1. Visão geral

| Campo | Valor |
|-------|--------|
| **Nome** | Pokemon Trade Center |
| **Tipo** | SPA web (Vite / React) |
| **Domínio** | Pokémon TCG — catálogo, coleção/vitrine, mural de trocas, chat 1:1, WhatsApp por cidade |
| **UI** | Português (Brasil) · marketplace TCG (Outfit / amarelo Pokémon) |
| **Dados** | TCGdex locale `pt` |
| **Estágio** | MVP web: catálogo + coleção/vitrine + mural/chat/comunidade + Firebase Auth |
| **Repo** | `https://github.com/thiagonunes11/pokemon-trade-center.git` |

### Objetivo

1. Escolher expansão (série Megaevolução, `me01`–`me05`)
2. Navegar catálogo com binder (possuídas vs faltantes) e progresso
3. Detalhe da carta + adicionar/remover da coleção; pin na vitrine
4. Compartilhar perfil (`/u/:slug`: vitrine + anúncios/procuras); avatar = preset Pokémon (Spark; sem Storage)
5. Listas Anunciando / Procurando → mural público + chat 1:1 + grupo WhatsApp da cidade

**Auth:** Firebase Auth + `users/{uid}` no Firestore.  
**Coleção:** Zustand local + sync Firestore (`collections/{uid}/cards`) com debounce nas escritas e pull no login. Coleção do antigo app nativo **não migra** automaticamente.

---

## 2. Stack

| Camada | Tecnologia |
|--------|------------|
| Build | Vite 7 |
| UI | React 19 + Tailwind CSS 4 |
| Rotas | React Router 7 |
| API cartas | `@tcgdex/sdk` (`pt`) |
| Cache | TanStack Query + `safeStorage` / localStorage |
| Virtualização | `@tanstack/react-virtual` (CardGrid) |
| Estado | Zustand |
| Backend | Firebase Auth + Firestore (Spark) |
| Env | `VITE_FIREBASE_*` (`.env` gitignored) |
| UI/UX | Skill `.cursor/skills/ui-ux-pro-max` · regras em `design-system/pokemon-trade-center/MASTER.md` |

---

## 3. Estrutura

```
index.html
vite.config.ts
src/
  main.tsx              ← boot: Theme, auth listener, QueryClient, Router
  App.tsx               ← rotas
  index.css             ← Tailwind + tokens de tema
  layouts/              ← AppLayout (sidebar/bottom nav), AuthGuard
  pages/                ← Login, Catalog, CatalogSet, Collection, Trades, TradeChat, Settings, CardDetail
  features/
    auth/               ← authService, mapFirebaseUser, authErrors, userProfileService
    cards/              ← CardGrid, CardItem (binderMode), useSetCards/useCard/useSet
    sets/               ← CollectionPickerCard, useCollections
    collection/         ← firestoreSync, CollectionSync, add/remove/showcase sync
    trades/             ← TradeSync, listings, threads, Explore/Community panels
    share/              ← ShareProfileButton (copiar link /u/:uid)
    profile/            ← perfil público, avatarService (presets), avatarPresets
  components/           ← EnergyIcon, UserAvatar, ProgressFolio
  hooks/useOwnedSetCount.ts
  lib/                  ← firebase (Auth/Firestore), tcgdex, …
  store/                ← useAuthStore, useCollectionStore, useTradeStore
  theme/                ← colors, ThemeContext (matchMedia + classe .dark)
  assets/avatars/       ← sprites preset (bulbasaur…eevee)
  assets/images/energy/ ← PNGs de tipo
public/                 ← favicon, icon
docs/superpowers/       ← specs e planos de implementação
firestore.rules
firebase.json
```

---

## 4. Rotas

| Rota | Página |
|------|--------|
| `/login` | Entrar / Criar conta / Esqueci senha |
| `/` | → `/catalog` |
| `/catalog` | Lista de expansões |
| `/catalog/:setId` | Grid do set |
| `/collection` | Minha coleção (Todas / Por coleção / Vitrine) |
| `/trades` | Explorar / Anunciando / Procurando / Conversas / Comunidade |
| `/trades/chat/:threadId` | Chat texto 1:1 |
| `/u/:slug` | Perfil público por slug (ou UID legado) |
| `/settings` | Conta, tema, sobre |
| `/card/:id` | Detalhe |

Shell autenticado: sidebar desktop + bottom nav mobile. Guard: esperar `isAuthReady`; sem user → `/login`.

---

## 5. Dados — TCGdex

```ts
const tcgdex = new TCGdex("pt");
```

Sets em `SUPPORTED_SETS` + `COLLECTIONS` (`src/lib/collections.ts`): `me01`–`me05` (série Megaevolução). Disponibilidade via `getCollectionAvailability` (não flag manual). Progresso: `formatCollectionProgress` + hooks `useOwnedSetCount` / `useOwnedCountsBySet`.

Imagens no grid: `${card.image}/low.webp`. Detalhe/share: `/high.webp` (ou `/high.png`). IDs: `{setId}-{localId}` (setId pode ter ponto, ex. `me02.5`).

`CardGrid` virtualiza linhas com `@tanstack/react-virtual` (scroll de janela).

React Query keys: `['set-cards', setId]`, `['card', cardId]`, `['set', setId]`.

---

## 6. Coleção local + sync

`useCollectionStore` — `ownerId` = Firebase UID; persist `pokemon-collection-storage` via `safeStorage` (localStorage).

Sync (`src/features/collection/`):
- **Pull** no login (`CollectionSync` + `pullAndMergeCollection`) — sem listener permanente
- **Push** em add/remove via `addCardToCollection` / `removeCardFromCollection` com debounce (~800ms)
- Path: `collections/{uid}/cards/{cardId}` — `ownerId` implícito no path

**Não** usar selector de função solta do store para contagem — preferir hooks em `useOwnedSetCount.ts`.

Vitrine: `CollectionCard.inShowcase` + espelho `publicShowcases/{uid}/cards`. Perfil `/u/:slug` com handle único (`handles/{slug}` + `publicProfiles.handle`). Conversar no mural só em **Anúncios**.

---

## 6b. Trocas (listas + mural + chat + comunidade)

`useTradeStore` — `offering` / `wanted`; persist `pokemon-trades-storage`.

- Listas privadas: `trades/{uid}/offering|wanted/{cardId}`
- Mural público: `listings/{uid}_{kind}_{cardId}` (espelho no write + backfill no login)
- Perfil público: `publicProfiles/{uid}` (`displayName`, `cityId?`)
- Chat: `threads/{uidA_uidB}/messages` (texto só; nacional)
- Comunidade: `communities/{cityId}` (`name`, `whatsappUrl`) — **read-only** no cliente; seed no Console
- UI Trocas: Explorar (filtro opcional “só o que eu quero”), Conversas, Comunidade
- Sem FCM / geo GPS / WhatsApp pessoal no perfil nesta fatia

---

## 7. Tema

`ThemeMode = 'light' | 'dark' | 'system'`. `setThemeMode` + classe `dark` no `<html>`. Cores em `src/theme/colors.ts`; tokens CSS em `index.css` (`--color-*`). UI com classes Tailwind.

---

## 8. Firebase (web)

Contrato: `Firebase UID → useAuthStore.userId → CollectionCard.ownerId`.

Env obrigatório: `VITE_FIREBASE_API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID` (app **Web** no Console). Authorized domains: `localhost` + produção.

Auth: `getAuth` (persistência browser). Perfil privado: `userProfileService` → `users/{uid}`. Perfil público: `publicProfiles/{uid}` + UI `/u/:slug`. Coleção: `features/collection/*`. Trocas: `features/trades/*`. Regras: `firestore.rules` (**deploy obrigatório**).

**Avatar (Spark):** Ajustes → 5 presets Pokémon (`src/assets/avatars/`) em `publicProfiles` (`avatarType: preset`, `avatarPresetId`). Sem Firebase Storage / upload custom (exige Blaze). Fallback: inicial em `UserAvatar`.

### Roadmap Firebase restante

| Etapa | Status |
|-------|--------|
| 0–5 Auth + perfil + rules | Feito |
| 6 Migração UUID legado | Pendente / pouco relevante na web pura |
| 7 Sync `collections/{uid}/cards` | Feito (pull no login + writes com debounce) |
| 7b Listas `trades/{uid}/offering|wanted` | Feito |
| 7c Mural `listings` + chat + `communities` WA | Feito (deploy rules/indexes + seed cidades) |
| 7d Avatar presets Pokémon | Feito (Spark; upload custom adiado — Storage exige Blaze) |
| 8 FCM | Pendente |

---

## 9. Comandos

```bash
npm install
cp .env.example .env   # preencher VITE_FIREBASE_*
npm run dev
npm run build
npm run preview
npm run lint
firebase deploy --only firestore:rules
```

---

## 10. Diretrizes

1. Escopo mínimo; sem deps novas sem necessidade.
2. Textos de UI em PT-BR.
3. Commits só se o usuário pedir.
4. Atualizar README/AGENTS se mudar stack, rotas ou setup.
5. Nunca commitar `.env`.
6. Este projeto é **web-only** — não reintroduzir Expo/React Native.

---

## 11. Arquivos-chave

| Tarefa | Arquivos |
|--------|----------|
| Boot / providers | `main.tsx`, `App.tsx` |
| Auth | `features/auth/*`, `useAuthStore.ts`, `LoginPage.tsx` |
| Firebase | `lib/firebase.ts`, `lib/firestore.ts`, `.env.example` |
| Catálogo | `pages/CatalogPage.tsx`, `CatalogSetPage.tsx`, `features/sets/*` |
| Detalhe | `pages/CardDetailPage.tsx` |
| Coleção / vitrine | `pages/CollectionPage.tsx`, `useCollectionStore.ts`, `features/collection/*` |
| Perfil / avatar | `pages/UserProfilePage.tsx`, `features/profile/*`, `UserAvatar.tsx` |
| Trocas | `pages/TradesPage.tsx`, `TradeChatPage.tsx`, `useTradeStore.ts`, `features/trades/*` |
| Compartilhar | `features/share/*` (copiar link `/u/:slug`) |
| Tema | `theme/*`, `index.css`, `SettingsPage.tsx` |
| Shell / guard | `layouts/AppLayout.tsx`, `AuthGuard.tsx` |

_Última revisão: 2026-08-01 — avatar presets Pokémon (Spark, sem Storage)._
