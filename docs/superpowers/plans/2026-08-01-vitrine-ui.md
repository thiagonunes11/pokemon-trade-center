# Vitrine UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the SPA as an editorial collector showcase with set progress (owned/total · missing) and PNG binder share per set; public link and trades remain stubs.

**Architecture:** Update design tokens and fonts first, then shared progress/binder UI primitives, restyle shell and pages, finally add a share composition + PNG export. Auth and Firestore sync stay untouched.

**Tech Stack:** Vite 7, React 19, Tailwind CSS 4, React Router 7, existing Zustand/Query/Firebase; add `html-to-image` for PNG export.

## Global Constraints

- UI copy in PT-BR
- Keep light / dark / system theme
- No deck builder, no regional trades, no public profile routes
- Do not break collection sync (`features/collection/*`)
- Prefer extending existing components over parallel systems
- Spec: `docs/superpowers/specs/2026-08-01-vitrine-ui-design.md`

---

### Task 1: Design tokens and fonts

**Files:**
- Modify: `src/index.css`
- Modify: `index.html` (font preconnect + stylesheet)
- Modify: `src/theme/colors.ts` (align palette comments/values with tokens)

**Interfaces:**
- Produces: CSS variables `--color-*`, `--font-display`, `--font-sans`, `--font-serif`, `--font-mono` usable as Tailwind/`var()` across the app

- [ ] **Step 1: Add Google Fonts to `index.html`**

In `index.html` `<head>`, add:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap"
  rel="stylesheet"
/>
```

- [ ] **Step 2: Replace `@theme` and `.dark` tokens in `src/index.css`**

Set editorial palette from the spec; map fonts:

```css
@theme {
  --color-bg: #f7f4ef;
  --color-bg-secondary: #efebe4;
  --color-bg-card: #fffcfa;
  --color-bg-elevated: #e8e2d9;
  --color-text: #1a1a1a;
  --color-text-secondary: #5c5a56;
  --color-text-muted: #8a8680;
  --color-accent: #c45c26;
  --color-accent-hover: #a34a1e;
  --color-border: #d9d2c8;
  --color-success: #16a34a;
  --color-error: #dc2626;
  --font-sans: "DM Sans", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Fraunces", Georgia, "Times New Roman", serif;
  --font-serif: "Source Serif 4", Georgia, serif;
  --font-mono: "DM Mono", ui-monospace, monospace;
}
```

Mirror dark values from the spec under `.dark { ... }`. Keep `body` using `var(--font-sans)`.

Add reduced-motion helper:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 3: Align `src/theme/colors.ts` light/dark background/text/accent with the same hex values** (keep `types.*` unchanged).

- [ ] **Step 4: Verify**

Run: `npm run build`  
Expected: success (no TS/CSS errors).

- [ ] **Step 5: Commit** (only if user asked for commits; otherwise skip)

---

### Task 2: Progress folio helper + component

**Files:**
- Modify: `src/lib/formatCollectionProgress.ts` (or add sibling helper)
- Create: `src/components/ProgressFolio.tsx`

**Interfaces:**
- Produces: `formatMissingCount(owned: number, total: number): string` → e.g. `"faltam 12"` / `"completa"`
- Produces: `<ProgressFolio owned={n} total={n|undefined} isLoading?: boolean />` showing mono counts + thin accent bar

- [ ] **Step 1: Extend progress formatting**

Ensure helpers return PT-BR strings used by folio:

```ts
export function formatMissingLabel(owned: number, total: number): string {
  if (total <= 0) return "";
  const missing = Math.max(total - owned, 0);
  if (missing === 0) return "completa";
  return missing === 1 ? "falta 1" : `faltam ${missing}`;
}
```

Keep existing `formatCollectionProgress` working for callers; folio may compose both.

- [ ] **Step 2: Implement `ProgressFolio`**

Props: `owned: number`, `total: number | undefined`, `isLoading?: boolean`, `className?: string`.

UI: DM Mono line `owned/total · missingLabel`; progress bar width `min(100, owned/total*100)%` in `var(--color-accent)`; loading shows “Carregando…”.

- [ ] **Step 3: Verify**

Run: `npm run build`  
Expected: success.

---

### Task 3: Binder slot on `CardItem`

**Files:**
- Modify: `src/features/cards/components/CardItem.tsx`
- Modify: `src/features/cards/components/CardGrid.tsx` (pass new props if needed)

**Interfaces:**
- Consumes: existing `CardItem` props
- Produces: optional `binderMode?: boolean` — when true and `isInCollection` is false, render muted/silhouette treatment; when owned, full color (drop green ring in binder mode; use hairline border)

- [ ] **Step 1: Add binder visuals**

When `binderMode`:
- owned: full opacity image, subtle border
- missing: `opacity-40 grayscale` (or similar), hairline border, still clickable to detail

When not `binderMode`, preserve previous collection ring behavior for Collection page if desired, or migrate Collection to binder-owned-only grid without missing slots.

- [ ] **Step 2: Wire `CatalogSetPage` grid to `binderMode` + `isInCollection={ownedIds.has(id)}`**

- [ ] **Step 3: Verify build**

---

### Task 4: Restyle shell (`AppLayout`)

**Files:**
- Modify: `src/layouts/AppLayout.tsx`

- [ ] Brand in `font-[family-name:var(--font-display)]` (or Tailwind theme font if mapped)
- [ ] Active nav: accent text + bottom/left border, not solid filled cobalt button
- [ ] Trocas label includes muted “Em breve” (span)
- [ ] Verify build + spot-check mobile bottom nav

---

### Task 5: Restyle pages (Login, Catalog, Set, Collection, Detail, Settings, Trades)

**Files:**
- Modify: `src/pages/LoginPage.tsx`
- Modify: `src/pages/CatalogPage.tsx`
- Modify: `src/features/sets/components/CollectionPickerCard.tsx`
- Modify: `src/pages/CatalogSetPage.tsx`
- Modify: `src/pages/CollectionPage.tsx`
- Modify: `src/pages/CardDetailPage.tsx`
- Modify: `src/pages/SettingsPage.tsx`
- Modify: `src/pages/TradesPage.tsx`

**Requirements:**
- Page `h1` uses display font
- Catalog cards show `ProgressFolio`
- Set page header shows `ProgressFolio` + placeholder slot for Share button (wired in Task 6)
- Collection empty/header copy editorial but clear
- Trades page states regional trades coming later (PT-BR), no fake CTAs

- [ ] Implement page restyles
- [ ] `npm run build` + `npm run lint`

---

### Task 6: Share binder PNG + link stub

**Files:**
- Create: `src/features/share/ShareSetBinder.tsx` (off-screen/fixed composition for capture)
- Create: `src/features/share/shareSetPng.ts` (`export async function downloadSetBinderPng(node: HTMLElement, fileName: string): Promise<void>`)
- Create: `src/features/share/ShareSetButton.tsx`
- Modify: `src/pages/CatalogSetPage.tsx` (and Collection group header if present)
- Modify: `package.json` — add `html-to-image`

**Interfaces:**
- `ShareSetButton` props: `setId`, `setName`, `cards: Array<{ id, name, localId, image }>`, `ownedIds: Set<string>`, `owned`, `total`
- On click: render/capture binder → PNG download named `vitrine-{setId}.png`
- Secondary control: “Link público · Em breve” `disabled`

- [ ] `npm install html-to-image`
- [ ] Implement capture helper with `toPng` from `html-to-image`
- [ ] Implement binder layout (~square or 9:16 padded) with brand, title, ProgressFolio, dense grid
- [ ] Wire button on set page
- [ ] Error toast/text PT-BR if capture fails
- [ ] `npm run build`

---

### Task 7: Docs touch-up

**Files:**
- Modify: `AGENTS.md` — note vitrine UI + share PNG; roadmap stub for public link / trades
- Modify: `README.md` — one short bullet on compartilhar vitrine do set

- [ ] Update docs
- [ ] Final `npm run build` && `npm run lint`

---

## Execution

User requested start immediately → **Inline execution** in this session (executing-plans style), skipping commit steps unless the user asks to commit.
