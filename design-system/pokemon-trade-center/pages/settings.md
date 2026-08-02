# Settings / Ajustes — page overrides

> Overrides `design-system/pokemon-trade-center/MASTER.md` for `/settings`.

## Layout
- Max width `max-w-lg`, stacked sections with `space-y-5`
- Order: header → alerts → profile summary → Perfil → Aparência → Comunidade → Conta → Sobre

## Patterns
- Profile summary: `ui-glass-strong` + avatar + CTA “Ver perfil”
- Sections: `ui-glass` + uppercase `h2` + optional description
- Theme: 3 large radio cards (not segment) with SVG icons (no emoji)
- Logout: `ConfirmDialog` (danger), never `window.confirm`
- Feedback: top `role="alert"` / `role="status"` banners after saves

## Forms
- Every editable field has `<label htmlFor>` (or `sr-only`)
- Primary actions `min-h-11` + `ui-btn-accent`
- Cancel / secondary: `ui-tool-btn`
