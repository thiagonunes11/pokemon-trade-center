# AGENTS.md — Contexto para agentes de IA

Leia este arquivo **antes** de implementar mudanças. Documentação humana: [README.md](./README.md).

---

## 1. Visão geral

| Campo | Valor |
|-------|--------|
| **Nome** | Pokemon Trade Center |
| **Tipo** | SPA web (Vite / React) |
| **Domínio** | Pokémon TCG — vitrine de coleção, catálogo, compartilhar binder, trocas (futuro) |
| **UI** | Português (Brasil) · marketplace TCG (Outfit / amarelo Pokémon) |
| **Dados** | TCGdex locale `pt` |
| **Estágio** | MVP web: catálogo + coleção/vitrine + listas de troca + Firebase Auth |
| **Repo** | `https://github.com/thiagonunes11/pokemon-trade-center.git` |

### Objetivo

1. Escolher expansão (série Megaevolução)
2. Navegar catálogo com binder (possuídas vs faltantes) e progresso
3. Detalhe da carta + adicionar/remover da coleção
4. Compartilhar vitrine do set (PNG); link público e trocas regionais (futuro)

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
| Export vitrine | `html-to-image` (PNG do binder por set) |
| Env | `VITE_FIREBASE_*` (`.env` gitignored) |

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
  pages/                ← Login, Catalog, CatalogSet, Collection, Trades, Settings, CardDetail
  features/
    auth/               ← authService, mapFirebaseUser, authErrors, userProfileService
    cards/              ← CardGrid, CardItem (binderMode), useSetCards/useCard/useSet
    sets/               ← CollectionPickerCard, useCollections
    collection/         ← firestoreSync, CollectionSync, add/remove/showcase sync
    trades/             ← TradeSync, offering/wanted actions + Firestore
    share/              ← ShareShowcaseBinder / PNG (html-to-image)
  components/           ← EnergyIcon, UserAvatar, ProgressFolio
  hooks/useOwnedSetCount.ts
  lib/                  ← firebase, firestore, tcgdex, collections, safeStorage, query*, formatCollectionProgress
  store/                ← useAuthStore, useCollectionStore, useTradeStore
  theme/                ← colors, ThemeContext (matchMedia + classe .dark)
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
| `/trades` | Anunciando (coleção) + Procurando (catálogo) |
| `/settings` | Conta, tema, sobre |
| `/card/:id` | Detalhe |

Shell autenticado: sidebar desktop + bottom nav mobile. Guard: esperar `isAuthReady`; sem user → `/login`.

---

## 5. Dados — TCGdex

```ts
const tcgdex = new TCGdex("pt");
```

Sets em `SUPPORTED_SETS` + `COLLECTIONS` (`src/lib/collections.ts`): `me01`–`me05` (série Megaevolução). Disponibilidade via `getCollectionAvailability` (não flag manual). Progresso: `formatCollectionProgress` + hooks `useOwnedSetCount` / `useOwnedCountsBySet`.

Imagens: `${card.image}/high.webp` ou `/high.png`. IDs: `{setId}-{localId}` (setId pode ter ponto, ex. `me02.5`).

React Query keys: `['set-cards', setId]`, `['card', cardId]`, `['set', setId]`.

---

## 6. Coleção local + sync

`useCollectionStore` — `ownerId` = Firebase UID; persist `pokemon-collection-storage` via `safeStorage` (localStorage).

Sync (`src/features/collection/`):
- **Pull** no login (`CollectionSync` + `pullAndMergeCollection`) — sem listener permanente
- **Push** em add/remove via `addCardToCollection` / `removeCardFromCollection` com debounce (~800ms)
- Path: `collections/{uid}/cards/{cardId}` — `ownerId` implícito no path

**Não** usar selector de função solta do store para contagem — preferir hooks em `useOwnedSetCount.ts`.

Vitrine: `CollectionCard.inShowcase` + `setCardInShowcase` / `toggleCardInShowcase`. Campo permitido nas rules.

---

## 6b. Trocas (listas)

`useTradeStore` — `offering` / `wanted`; persist `pokemon-trades-storage`.

- **Anunciando** (`offering`): só cartas da coleção → `trades/{uid}/offering/{cardId}`
- **Procurando** (`wanted`): qualquer carta do catálogo → `trades/{uid}/wanted/{cardId}`
- Pull no login (`TradeSync`); push com debounce; remover da coleção também tira de offering
- Sem matching/região nesta fatia — só as duas listas do usuário

---

## 7. Tema

`ThemeMode = 'light' | 'dark' | 'system'`. `setThemeMode` + classe `dark` no `<html>`. Cores em `src/theme/colors.ts`; tokens CSS em `index.css` (`--color-*`). UI com classes Tailwind.

---

## 8. Firebase (web)

Contrato: `Firebase UID → useAuthStore.userId → CollectionCard.ownerId`.

Env obrigatório: `VITE_FIREBASE_API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID` (app **Web** no Console). Authorized domains: `localhost` + produção.

Auth: `getAuth` (persistência browser). Perfil: `userProfileService` → `users/{uid}`. Coleção: `features/collection/*`. Trocas: `features/trades/*`. Regras: `firestore.rules` (**deploy obrigatório** para `inShowcase` + paths `trades/`).

### Roadmap Firebase restante

| Etapa | Status |
|-------|--------|
| 0–5 Auth + perfil + rules | Feito |
| 6 Migração UUID legado | Pendente / pouco relevante na web pura |
| 7 Sync `collections/{uid}/cards` | Feito (pull no login + writes com debounce) |
| 7b Listas `trades/{uid}/offering|wanted` | Feito (pull + debounce; matching futuro) |
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
| Trocas | `pages/TradesPage.tsx`, `useTradeStore.ts`, `features/trades/*` |
| Compartilhar | `features/share/*` (vitrine PNG) |
| Tema | `theme/*`, `index.css`, `SettingsPage.tsx` |
| Shell / guard | `layouts/AppLayout.tsx`, `AuthGuard.tsx` |

_Última revisão: 2026-08-01 — coleção/vitrine + listas de troca Firestore._
