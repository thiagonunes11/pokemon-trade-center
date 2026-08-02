# Coleção limpa lista de procura — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ao adicionar uma carta nova à coleção, removê-la automaticamente de Procurando (local + Firestore) e mostrar feedback leve no detalhe e no catálogo do set.

**Architecture:** Centralizar a regra em `addCardToCollection` (espelho de `removeCardFromCollection` → `removeCardFromOffering`). A função retorna `{ added, removedFromWanted }`; `CardDetailPage` e `CatalogSetPage` usam o retorno para o aviso. Sem toast global nem mudanças em rules/indexes.

**Tech Stack:** Vite 7, React 19, Zustand (`useCollectionStore` / `useTradeStore`), sync existente em `features/trades/tradeActions` + `firestoreSync`. Sem framework de teste no repo — verificação via `npm run build` / `npm run lint` + checklist manual do spec.

## Global Constraints

- UI copy in PT-BR
- Spec: `docs/superpowers/specs/2026-08-02-collection-clears-wanted-design.md`
- Sem deps novas; sem toast global; sem alterar `firestore.rules`
- Remover da coleção **não** recoloca na procura
- Call sites atuais: só `CardDetailPage` e `CatalogSetPage`

## File map

| File | Responsibility |
|------|----------------|
| `src/features/collection/collectionActions.ts` | Regra: add novo → `removeCardFromWanted`; retorno tipado |
| `src/pages/CardDetailPage.tsx` | Aviso “Removida da lista de procura.” |
| `src/pages/CatalogSetPage.tsx` | Contagem no `addSelected` → `wantedHint` |

---

### Task 1: `addCardToCollection` limpa procura e retorna flags

**Files:**
- Modify: `src/features/collection/collectionActions.ts`

**Interfaces:**
- Consumes: `removeCardFromWanted(cardId: string)` de `@/features/trades/tradeActions`; `useTradeStore.getState().hasWanted(cardId)`
- Produces: `addCardToCollection(card: NewCard): { added: boolean; removedFromWanted: boolean }`

- [ ] **Step 1: Importar `removeCardFromWanted` e ajustar `addCardToCollection`**

Em `src/features/collection/collectionActions.ts`, alterar o import de trades:

```ts
import {
  removeCardFromOffering,
  removeCardFromWanted,
} from "@/features/trades/tradeActions";
import { useTradeStore } from "@/store/useTradeStore";
```

Substituir `addCardToCollection` por:

```ts
/** Adiciona localmente e agenda escrita no Firestore.
 *  Carta nova que estava em Procurando sai da busca automaticamente. */
export function addCardToCollection(card: NewCard): {
  added: boolean;
  removedFromWanted: boolean;
} {
  const before = useCollectionStore.getState().hasCard(card.id);
  useCollectionStore.getState().addCard(card);
  if (before) {
    return { added: false, removedFromWanted: false };
  }
  scheduleSavedCard(card.id);

  const wasWanted = useTradeStore.getState().hasWanted(card.id);
  if (wasWanted) {
    removeCardFromWanted(card.id);
  }
  return { added: true, removedFromWanted: wasWanted };
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npm run build`  
Expected: PASS (call sites atuais ignoram o retorno — válido em TS).

- [ ] **Step 3: Commit**

```bash
git add src/features/collection/collectionActions.ts
git commit -m "$(cat <<'EOF'
feat: limpar procura ao adicionar carta à coleção

EOF
)"
```

---

### Task 2: Feedback no detalhe da carta

**Files:**
- Modify: `src/pages/CardDetailPage.tsx`

**Interfaces:**
- Consumes: retorno de `addCardToCollection` → `removedFromWanted: boolean`
- Produces: estado local de aviso sob a área de ações

- [ ] **Step 1: Estado + handler**

Em `CardDetailPage.tsx`, mudar o import de React:

```ts
import { useEffect, useMemo, useState } from "react";
```

Dentro de `CardDetailPage`, após os hooks de coleção existentes, adicionar:

```ts
const [wantedClearHint, setWantedClearHint] = useState(false);
```

Limpar o aviso ao trocar de carta (quando `id` muda):

```ts
useEffect(() => {
  setWantedClearHint(false);
}, [id]);
```

Atualizar `handleToggle`:

```ts
const handleToggle = () => {
  if (!card) return;
  if (isInCollection) {
    removeCardFromCollection(id);
    setWantedClearHint(false);
  } else {
    const { removedFromWanted } = addCardToCollection({
      id,
      name: card.name,
      imageUrl: card.image ? `${card.image}/high.webp` : null,
      setId: card.set?.id ?? id.split("-")[0],
    });
    setWantedClearHint(removedFromWanted);
  }
};
```

- [ ] **Step 2: Render do aviso**

Imediatamente após o `</div>` do bloco `flex flex-col gap-2 sm:flex-row` dos botões (por volta da linha 294), inserir:

```tsx
{wantedClearHint ? (
  <p className="text-sm text-[var(--color-text-secondary)]">
    Removida da lista de procura.{" "}
    <Link
      to="/trades?tab=wanted"
      className="font-semibold text-[var(--color-accent)] hover:underline"
    >
      Ver busca
    </Link>
  </p>
) : null}
```

(`Link` já está importado neste arquivo.)

- [ ] **Step 3: Build**

Run: `npm run build`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/pages/CardDetailPage.tsx
git commit -m "$(cat <<'EOF'
feat: avisar remoção da procura no detalhe da carta

EOF
)"
```

---

### Task 3: Feedback no catálogo do set (`addSelected`)

**Files:**
- Modify: `src/pages/CatalogSetPage.tsx` (`addSelected` ~linhas 166–178)

**Interfaces:**
- Consumes: retorno de `addCardToCollection` por carta no lote
- Produces: `setWantedHint` com contagem de removidas da busca

- [ ] **Step 1: Contar `removedFromWanted` em `addSelected`**

Substituir `addSelected` por:

```ts
const addSelected = () => {
  let removedFromWantedCount = 0;
  for (const id of selectedIds) {
    const card = gridCards.find((c) => c.id === id);
    if (!card || ownedIds.has(id)) continue;
    const result = addCardToCollection({
      id: card.id,
      name: card.name,
      imageUrl: card.image ? `${card.image}/high.webp` : null,
      setId,
    });
    if (result.removedFromWanted) removedFromWantedCount += 1;
  }
  setSelectedIds(new Set());
  if (removedFromWantedCount === 1) {
    setWantedHint("1 carta removida da busca.");
  } else if (removedFromWantedCount > 1) {
    setWantedHint(`${removedFromWantedCount} cartas removidas da busca.`);
  }
};
```

O banner `wantedHint` existente (com link “Ver busca”) já renderiza a mensagem — não criar UI nova.

- [ ] **Step 2: Build + lint**

Run: `npm run build && npm run lint`  
Expected: PASS

- [ ] **Step 3: Verificação manual (checklist do spec)**

1. Carta na procura → detalhe → Adicionar à coleção → some em `/trades?tab=wanted` + texto “Removida da lista de procura.”
2. Uma ou mais cartas na procura → no set, selecionar e adicionar → hint com contagem correta
3. Carta já na coleção / sem estar na procura → sem aviso de remoção da busca
4. Remover da coleção → **não** volta para procura

- [ ] **Step 4: Commit**

```bash
git add src/pages/CatalogSetPage.tsx
git commit -m "$(cat <<'EOF'
feat: avisar limpeza da procura ao adicionar no set

EOF
)"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Add novo + estava em procura → `removeCardFromWanted` | Task 1 |
| Já na coleção → sem mexer na procura | Task 1 (`added: false`) |
| Remover coleção não recoloca procura | Task 1 (não altera `removeCardFromCollection`) + checklist Task 3 |
| Retorno `{ added, removedFromWanted }` | Task 1 |
| Feedback detalhe | Task 2 |
| Feedback CatalogSet / `wantedHint` | Task 3 |
| Sem rules Firebase / sem toast global | Nenhuma task adiciona isso |
