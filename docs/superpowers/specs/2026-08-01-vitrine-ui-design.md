# Vitrine UI — Design Spec

**Date:** 2026-08-01  
**Status:** Approved  
**Product:** Pokemon Trade Center (Vite / React SPA)

## Goal

Refazer a UI como **vitrine do colecionador**: sensação editorial, progressão clara (quantas faltam para completar cada set) e compartilhamento da coleção por set (imagem PNG primeiro; link público como stub). Trocas regionais e montagem de baralho ficam fora desta fatia.

## Decisions locked

| Topic | Choice |
|-------|--------|
| Aesthetic | Editorial / revista de colecionador |
| Progress | Always visible: owned / total · faltam N |
| Share artifact | Binder por set: possuídas coloridas, faltantes silhueta/cinza |
| Share delivery | PNG first; public link stub (“Em breve”) |
| Approach | Visual system first, then share layer |
| Theme | Keep light / dark / system |
| Out of scope | Deck builder, regional trade matching, public profile URLs |

## Visual system

### Typography

- Display: Fraunces (page titles, set names, share header)
- Body (long copy): Source Serif 4
- UI (nav, labels, dense controls): DM Sans
- Counts / IDs: DM Mono

Load via Google Fonts (or equivalent) with `font-display: swap`. Fallbacks: Georgia / system-ui / ui-monospace.

### Color tokens

| Token | Light | Dark |
|-------|-------|------|
| bg | `#F7F4EF` | `#121212` |
| bg-secondary | `#EFEBE4` | `#1C1C1C` |
| bg-card | `#FFFCFA` | `#1C1C1C` |
| bg-elevated | `#E8E2D9` | `#2A2A2A` |
| text | `#1A1A1A` | `#F5F2EC` |
| text-secondary | `#5C5A56` | `#A8A59E` |
| text-muted | `#8A8680` | `#6E6B66` |
| accent (progress / CTA) | `#C45C26` | `#E07A45` |
| accent-hover | `#A34A1E` | `#F09060` |
| border | `#D9D2C8` | `#2A2A2A` |
| success / error | keep current semantic greens/reds |

Single accent (âmbar). Do not add purple neon or second competing brand color.

### Signature gesture

- **Binder slot:** owned card in full color; missing card as muted silhouette (desaturated/opacity + hairline border).
- **Progress folio** in set headers: `possuídas / total · faltam N` with a thin progress bar in accent.

### Motion

- Grid stagger ~80ms on set open.
- Subtle hover lift on cards.
- Honor `prefers-reduced-motion: reduce` (no stagger).

## Shell

- Keep routes: Catálogo, Coleção, Trocas, Ajustes.
- Sidebar brand in Fraunces (“Pokemon Trade Center”).
- Active nav: accent underline / text, not solid cobalt block.
- Trocas: “Em breve” badge only.

## Screens

### Login

Editorial composition: brand as hero-level signal + auth form. Preserve existing auth modes (login / register / forgot).

### Catalog

Set list as magazine covers: logo, subtitle, progress folio per set (owned/total · missing).

### Catalog set

- Header: set name, progress folio, **Compartilhar** CTA.
- Grid: binder slots for every card in the set (owned vs missing).
- Click → card detail (unchanged routing).

### Collection

- Showcase of owned cards.
- Group-by-set keeps mini progress + share affordance per set when grouped.
- Empty state copy stays clear (PT-BR).

### Card detail

Editorial type hierarchy; add/remove collection behavior unchanged (Firestore sync stays as today).

### Settings

Same account/theme/about content; new tokens/typography only.

## Share flow (product slice)

1. User opens a set (catalog or from collection grouping) and taps **Compartilhar**.
2. App builds an off-screen (or modal) binder composition: brand, set name, progress folio, grid of owned (color) + missing (silhouette).
3. Export to **PNG** (download; use Web Share API with file when available).
4. **Link público:** control visible but disabled / labeled “Em breve” — no public route in this slice.

Large sets: share layout may use a denser grid and smaller slots than the in-app grid so the PNG stays usable for Stories (~1080×1920 target aspect when practical; otherwise fit content with padding).

## Non-goals

- Firebase Auth / Firestore collection sync changes
- Migrating legacy native collection
- Implementing trades or deck builder
- New public Firestore read rules for stranger profiles

## Technical constraints

- Stack stays: Vite 7, React 19, Tailwind 4, React Router 7, Zustand, TanStack Query, Firebase.
- UI copy in PT-BR.
- Prefer extending `CardItem` / set pages over a parallel card system.
- PNG export may add one small dependency (e.g. `html-to-image`) if canvas hand-roll is impractical.
- Update `AGENTS.md` / README only if user-facing setup or IA structure changes materially.

## Success criteria

1. App reads as editorial vitrine in light and dark.
2. On catalog and set views, user always sees how many cards remain for that set.
3. User can export a PNG binder for a set showing owned vs missing.
4. Public link and Trocas remain explicit stubs without fake functionality.
5. Existing login and collection sync still work.
