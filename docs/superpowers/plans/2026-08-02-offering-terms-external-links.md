# Ofertas com condições + links externos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ofertas com `priceBRL` e/ou `wantCards` (obrigatório pelo menos um), espelhadas no mural/perfil, mais links Liga Pokémon e MYP Cards no detalhe da carta.

**Architecture:** Estender `TradeListCard` / listing payloads com termos só em `kind === "offering"`. Validação compartilhada no cliente; `firestore.rules` aceita os novos campos. UI: painel de condições ao publicar/editar; chips no Explorar/perfil. Links externos são helpers puros no detalhe (sem Firestore).

**Tech Stack:** Vite 7, React 19, Zustand, Firebase Auth/Firestore, React Router 7. Sem framework de teste — `npm run build` / `npm run lint` + checklist manual.

## Global Constraints

- UI copy in PT-BR
- Spec: `docs/superpowers/specs/2026-08-02-offering-terms-external-links-design.md`
- Publicar exige `priceBRL > 0` **ou** `wantCards.length >= 1`
- Cartas desejadas só do catálogo (sets suportados); máx. 20
- Sem pagamento in-app; sem auto-texto no chat; Minha busca global intacta
- Deploy `firestore.rules` obrigatório após Task 2
- Sem deps novas

## File map

| File | Responsibility |
|------|----------------|
| `src/features/trades/offeringTerms.ts` | Tipos auxiliares, `hasValidOfferingTerms`, normalize |
| `src/store/useTradeStore.ts` | Campos + `updateOfferingTerms` / addOffering com termos |
| `src/features/trades/tradeActions.ts` | API publicar/atualizar termos |
| `src/features/trades/firestoreSync.ts` | Persistência private path |
| `src/features/trades/listingsSync.ts` | Espelho público + terms |
| `src/features/trades/listingsQuery.ts` | Parse `PublicListing` com terms |
| `firestore.rules` | Allowlists + validação |
| `src/features/trades/OfferingTermsPanel.tsx` | Sheet condições |
| `src/pages/TradesPage.tsx` | Wire add/edit/display |
| `src/features/trades/ExploreBoard.tsx` | Chips + filtrar incompletas |
| `src/pages/UserProfilePage.tsx` | Chips em Anunciando |
| `src/lib/externalCardLinks.ts` | URLs Liga / MYP |
| `src/pages/CardDetailPage.tsx` | Botões externos |
| `AGENTS.md` | Nota breve no modelo de trades |

---

### Task 1: Tipos, validação e store

**Files:**
- Create: `src/features/trades/offeringTerms.ts`
- Modify: `src/store/useTradeStore.ts`
- Modify: `src/features/trades/index.ts` (re-export helpers se já exporta trades)

**Interfaces:**
- Produces:
  - `export type WantCardRef = { id: string; name: string; imageUrl: string | null; setId: string }`
  - `export type OfferingTerms = { priceBRL: number | null; wantCards: WantCardRef[] }`
  - `export function hasValidOfferingTerms(terms: OfferingTerms): boolean`
  - `export function normalizeOfferingTerms(raw: unknown): OfferingTerms`
  - Store: `TradeListCard` inclui `priceBRL?: number | null; wantCards?: WantCardRef[]`
  - `updateOfferingTerms(cardId: string, terms: OfferingTerms): void`
  - `addOffering` aceita termos opcionais no input (obrigatórios na action layer)

- [ ] **Step 1: Criar `offeringTerms.ts`**

```ts
export type WantCardRef = {
  id: string;
  name: string;
  imageUrl: string | null;
  setId: string;
};

export type OfferingTerms = {
  priceBRL: number | null;
  wantCards: WantCardRef[];
};

const MAX_WANT = 20;

export function hasValidOfferingTerms(terms: OfferingTerms): boolean {
  const priceOk =
    terms.priceBRL != null &&
    Number.isFinite(terms.priceBRL) &&
    terms.priceBRL > 0;
  const wantsOk = Array.isArray(terms.wantCards) && terms.wantCards.length > 0;
  return priceOk || wantsOk;
}

export function normalizeOfferingTerms(raw: unknown): OfferingTerms {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  let priceBRL: number | null = null;
  if (typeof obj.priceBRL === "number" && Number.isFinite(obj.priceBRL) && obj.priceBRL > 0) {
    priceBRL = obj.priceBRL;
  }
  const wantCards: WantCardRef[] = [];
  if (Array.isArray(obj.wantCards)) {
    for (const item of obj.wantCards.slice(0, MAX_WANT)) {
      if (!item || typeof item !== "object") continue;
      const c = item as Record<string, unknown>;
      if (typeof c.id !== "string" || typeof c.name !== "string" || typeof c.setId !== "string") continue;
      wantCards.push({
        id: c.id,
        name: c.name,
        imageUrl: c.imageUrl === null || typeof c.imageUrl === "string" ? c.imageUrl : null,
        setId: c.setId,
      });
    }
  }
  return { priceBRL, wantCards };
}
```

- [ ] **Step 2: Estender store**

Em `TradeListCard`, adicionar `priceBRL?: number | null` e `wantCards?: WantCardRef[]`.

Alterar `addOffering` para copiar `priceBRL` / `wantCards` quando presentes.

Adicionar:

```ts
updateOfferingTerms: (cardId: string, terms: OfferingTerms) => void;
```

Implementação: atualiza o card do owner atual com `priceBRL`, `wantCards`, `updatedAt: new Date()`.

Em `replaceList` / normalize do persist, usar `normalizeOfferingTerms` ao hidratar offering cards.

- [ ] **Step 3: Build**

Run: `npm run build`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/trades/offeringTerms.ts src/store/useTradeStore.ts src/features/trades/index.ts
git commit -m "$(cat <<'EOF'
feat: tipos e store para condições da oferta

EOF
)"
```

---

### Task 2: Sync Firestore + rules

**Files:**
- Modify: `src/features/trades/tradeActions.ts`
- Modify: `src/features/trades/firestoreSync.ts`
- Modify: `src/features/trades/listingsSync.ts`
- Modify: `src/features/trades/listingsQuery.ts`
- Modify: `firestore.rules`

**Interfaces:**
- Consumes: `OfferingTerms`, `hasValidOfferingTerms`, `normalizeOfferingTerms`
- Produces:
  - `addCardToOffering(card, terms: OfferingTerms)` — no-op/warn se inválido
  - `updateOfferingTermsAndSync(cardId, terms: OfferingTerms)`
  - Listing + private docs incluem `priceBRL`, `wantCards` quando `kind === "offering"`
  - `PublicListing` com `priceBRL: number | null` e `wantCards: WantCardRef[]` (wanted → sempre null/[])

- [ ] **Step 1: Actions**

```ts
export function addCardToOffering(card: TradeCardInput, terms: OfferingTerms) {
  if (!hasValidOfferingTerms(terms)) {
    console.warn("[Trades] Oferta exige preço ou cartas desejadas.");
    return false;
  }
  // owned check como hoje...
  useTradeStore.getState().addOffering({ ...card, ...terms });
  scheduleSaved("offering", card.id);
  return true;
}

export function updateOfferingTermsAndSync(cardId: string, terms: OfferingTerms) {
  if (!hasValidOfferingTerms(terms)) return false;
  if (!useTradeStore.getState().hasOffering(cardId)) return false;
  useTradeStore.getState().updateOfferingTerms(cardId, terms);
  scheduleSaved("offering", cardId);
  return true;
}
```

- [ ] **Step 2: Persist payloads**

`scheduleUpsertTradeCard` / writers: para offering, gravar `priceBRL` (number ou omit/null) e `wantCards` array.

`upsertListing`: se `kind === "offering"`, merge fields de terms; se `wanted`, não incluir (ou `priceBRL: null`, `wantCards: []`).

`parseListing`: popular terms via `normalizeOfferingTerms`; wanted listings forçam terms vazios.

Pull merge: mapear campos remotos com `normalizeOfferingTerms`.

Backfill: só espelhar offerings com `hasValidOfferingTerms`; incompletas não sobem ao mural (ou delete listing se inválida).

- [ ] **Step 3: Rules**

Estender `isValidTradeCard` allowedFields com `priceBRL`, `wantCards`.

Para listing offering, same. Validar:

- `priceBRL` ausente ou null ou number > 0
- `wantCards` ausente ou list size ≤ 20 de maps com id/name/setId strings
- Em **create/update de offering** (private + listing kind offering): `(priceBRL is number && priceBRL > 0) || (wantCards is list && wantCards.size() > 0)`

Wanted path: não exigir terms; se campos presentes, preferir rejeitar extras em wanted **ou** permitir null/[] only.

- [ ] **Step 4: Build**

Run: `npm run build`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/trades/tradeActions.ts src/features/trades/firestoreSync.ts src/features/trades/listingsSync.ts src/features/trades/listingsQuery.ts firestore.rules
git commit -m "$(cat <<'EOF'
feat: sync e rules para preço e cartas desejadas na oferta

EOF
)"
```

Reminder for human/agent after merge: `firebase deploy --only firestore:rules`

---

### Task 3: Painel de condições + Minhas ofertas

**Files:**
- Create: `src/features/trades/OfferingTermsPanel.tsx`
- Modify: `src/pages/TradesPage.tsx`

**Interfaces:**
- Consumes: `addCardToOffering`, `updateOfferingTermsAndSync`, `hasValidOfferingTerms`, existing set picker patterns from `TradePickerModal`
- Produces: modal/sheet `OfferingTermsPanel` com props:

```ts
type OfferingTermsPanelProps = {
  open: boolean;
  mode: "create" | "edit";
  card: { id: string; name: string; imageUrl: string | null; setId: string } | null;
  initialTerms?: OfferingTerms;
  onCancel: () => void;
  onSave: (terms: OfferingTerms) => void;
};
```

- [ ] **Step 1: Implementar painel**

UI PT-BR:

- Título: “Condições da oferta”
- Input `Preço (R$)` (type text/inputMode decimal; parse BR `50` / `50,00` → number)
- Seção “Aceito em troca”: lista `wantCards` + botão “Adicionar carta” abrindo nested picker de sets/cards (reusar lógica do modal de wanted no mesmo arquivo ou extrair mínimo)
- Botões Cancelar / Publicar|Salvar; Salvar disabled se `!hasValidOfferingTerms`

- [ ] **Step 2: Wire TradesPage**

Fluxo create: picker coleção seleciona card → **não** chama `addCardToOffering` direto → abre `OfferingTermsPanel` mode create → onSave chama `addCardToOffering(card, terms)` e fecha.

Fluxo edit: botão “Editar condições” no card → panel mode edit → `updateOfferingTermsAndSync`.

Display sob cada oferta:

- chip `R$ {price.toFixed(2).replace('.', ',')}` se price
- texto/chips “Troca por: …” se wantCards
- badge “Completar condições” se inválida (legado)

- [ ] **Step 3: Build + lint**

Run: `npm run build && npm run lint`  
Expected: PASS (warnings preexistentes ok)

- [ ] **Step 4: Commit**

```bash
git add src/features/trades/OfferingTermsPanel.tsx src/pages/TradesPage.tsx src/features/trades/index.ts
git commit -m "$(cat <<'EOF'
feat: painel de condições ao publicar e editar ofertas

EOF
)"
```

---

### Task 4: Explorar + perfil público

**Files:**
- Modify: `src/features/trades/ExploreBoard.tsx`
- Modify: `src/pages/UserProfilePage.tsx`
- Modify: `src/features/profile/publicProfile.ts` se tipar listings

**Interfaces:**
- Consumes: `PublicListing.priceBRL`, `PublicListing.wantCards`
- Produces: UI chips; filter client-side `kind !== 'offering' || hasValidOfferingTerms(listing)`

- [ ] **Step 1: ExploreBoard**

Após carregar items, filtrar offerings incompletas. Em cada card offering, renderizar resumo de terms (mesmo estilo visual da lista privada, compacto).

- [ ] **Step 2: UserProfilePage Anunciando**

Mesmo resumo sob cada listing offering.

- [ ] **Step 3: Build**

Run: `npm run build`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/trades/ExploreBoard.tsx src/pages/UserProfilePage.tsx src/features/profile/publicProfile.ts
git commit -m "$(cat <<'EOF'
feat: exibir condições da oferta no mural e perfil

EOF
)"
```

---

### Task 5: Links Liga Pokémon + MYP Cards no detalhe

**Files:**
- Create: `src/lib/externalCardLinks.ts`
- Modify: `src/pages/CardDetailPage.tsx`

**Interfaces:**
- Produces:

```ts
export function ligaPokemonSearchUrl(cardName: string): string;
export function mypCardsSearchUrl(cardName: string): string;
```

```ts
export function ligaPokemonSearchUrl(cardName: string): string {
  const q = encodeURIComponent(cardName.trim());
  return `https://www.ligapokemon.com.br/?view=cards/search&card=${q}`;
}

export function mypCardsSearchUrl(cardName: string): string {
  const q = encodeURIComponent(cardName.trim());
  return `https://mypcards.com/pokemon?busca=${q}`;
}
```

- [ ] **Step 1: Helpers + UI**

Abaixo dos botões de coleção/vitrine, grupo:

```tsx
<div className="flex flex-wrap gap-2">
  <a href={ligaPokemonSearchUrl(card.name)} target="_blank" rel="noopener noreferrer" className="ui-tool-btn ...">
    Liga Pokémon
  </a>
  <a href={mypCardsSearchUrl(card.name)} target="_blank" rel="noopener noreferrer" className="ui-tool-btn ...">
    MYP Cards
  </a>
</div>
```

- [ ] **Step 2: Build**

Run: `npm run build`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/externalCardLinks.ts src/pages/CardDetailPage.tsx
git commit -m "$(cat <<'EOF'
feat: links Liga Pokémon e MYP Cards no detalhe da carta

EOF
)"
```

---

### Task 6: Docs + verificação

**Files:**
- Modify: `AGENTS.md` (seção trocas — mencionar priceBRL/wantCards + links detalhe)

- [ ] **Step 1: Atualizar AGENTS.md** (1–3 linhas no bloco de trocas)

- [ ] **Step 2: Checklist manual**

1. Oferta só preço → mural/perfil/lista  
2. Oferta só wantCards → idem  
3. Ambos → idem  
4. Sem termos → não publica  
5. Legado incompleto → completar  
6. Detalhe → links abrem busca  
7. Remover oferta limpa listing  
8. `firebase deploy --only firestore:rules`

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "$(cat <<'EOF'
docs: documentar condições da oferta e links externos

EOF
)"
```

---

## Spec coverage (self-review)

| Spec item | Task |
|-----------|------|
| priceBRL + wantCards no modelo | 1–2 |
| Validação obrigatória | 1–3 |
| Painel publicar/editar | 3 |
| Explorar + perfil | 4 |
| Legacy incompleto | 2–3 |
| Links detalhe | 5 |
| Rules deploy | 2 + checklist 6 |
| Fora de escopo (pagamento/chat) | nenhuma task |
