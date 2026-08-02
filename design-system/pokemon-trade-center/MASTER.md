# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Pokemon Trade Center  
**Generated:** 2026-08-02 (ui-ux-pro-max)  
**Category:** Gaming / TCG collection marketplace  
**Design Dials:** Motion 6/10 (Standard) | Density 6/10 (Standard)

---

## Brand overrides (fonte de verdade do app)

O gerador sugeriu verde/ouro + Inter. **Não aplicar** — o produto já tem marca definida:

| Role | Token / valor |
|------|----------------|
| Accent/CTA | `--color-accent` `#ffcb05` (Pokémon yellow) |
| On accent | `--color-on-accent` `#0b0d12` |
| Light bg | `--color-bg` `#f5f6fa` |
| Dark bg | `--color-bg` `#0b0d12` |
| Success / Error | `--color-success` / `--color-error` |
| Fonts | Outfit (UI) + DM Mono (IDs) — ver `src/index.css` |

**Estilo do app:** Glassmorphism leve + sheen/spotlight + tilt 3D na carta (React Bits / 21st), não 3D WebGL pesado.

**Stack:** Vite + React 19 + Tailwind 4 + React Router 7.

---

## UX rules (UI/UX Pro Max checklist)

- Touch targets ≥ 44×44px (`min-h-11 min-w-11`)
- `cursor-pointer` on clickable controls (global in `index.css`)
- Visible `:focus-visible` rings (accent)
- Errors use `role="alert"`; success may use `role="status"`
- Skip link → `#main-content`
- No emoji as icons — use SVG (`IconStar`, etc.)
- Modals: focus trap + Escape + restore focus (`ConfirmDialog`)
- `prefers-reduced-motion` respected
- `touch-action: manipulation` on interactive controls
- Hover/tap feedback 150–300ms; don’t rely on hover-only for primary actions

---

## Spacing (Density 6/10)

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight gaps |
| sm | 8px | Icon gaps |
| md | 16px | Standard padding |
| lg | 24px | Section padding |
| xl | 32px | Large gaps |

Prefer Tailwind scale (`p-4`, `gap-3`, `gap-4`) aligned to these.

---

## Pre-Delivery Checklist

- [x] No emojis used as icons (showcase star → SVG)
- [x] `cursor-pointer` on clickable elements
- [x] Focus states visible for keyboard navigation
- [x] `prefers-reduced-motion` respected
- [x] Skip to main content link
- [x] Confirm dialog focus management
- [ ] Manual pass: 375 / 768 / 1024 / 1440
- [ ] Manual contrast audit light mode 4.5:1

---

## Anti-Patterns

- ❌ Trocar marca por paleta genérica do gerador
- ❌ Emojis as icons
- ❌ Missing cursor:pointer
- ❌ Invisible focus states
- ❌ Instant state changes without transition
- ❌ Touch targets &lt; 44px on primary controls
