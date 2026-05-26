# Reaproveitamento — Deckmanager (PTCG Collector)

Referência: repositório do Rafael em `Deckmanager/` (WebView Android + `index.html` offline).

O Deckmanager **não** integra preços em R$, LigaPokemon nem MYP. Ele é forte em **códigos de set da Liga**, **decks**, **reprints na coleção** e **links Limitless**. O Trade Center usa **TCGdex** (`me01`, `me02`, …) — qualquer porte exige uma camada de **mapeamento de IDs**.

---

## Vale a pena reaproveitar

### Alta prioridade

| # | Item | Origem no Deckmanager | Uso no Trade Center |
|---|------|----------------------|---------------------|
| 1 | **Mapa TCGdex ↔ sigla Liga** | `PFL`, `MEG`, `ASC`, `POR` em `SET_COLLECTIONS` | Montar URL LigaPokemon (`ed`, `num`, `card`) a partir de `card.set.id` + `localId` + nome |
| 2 | **URL LigaPokemon** | Padrão validado: `?view=cards/card&card=Meowth (106/094)&ed=PFL&num=106` | Botão “Ver na Liga” no detalhe da carta |
| 3 | **URL Limitless (PT)** | `openCardPage(set, number)` → `limitlesstcg.com/cards/pt/{set}/{num}` | Botão “Ver no Limitless” (referência global; preços no site) |
| 4 | **Parser de lista de deck** | `parseInput` — `4 Nome SIGLA 040` | Importar wishlist / lista de troca / deck sem UI manual |
| 5 | **Reprints na coleção** | `getOwnedQty` — soma por **nome** além do ID exato | “Tenho em outro set?” e progresso de deck/troca |

### Média prioridade

| # | Item | Origem no Deckmanager | Uso no Trade Center |
|---|------|----------------------|---------------------|
| 6 | **Metas de set (básico vs completo)** | `SET_THRESHOLDS` por sigla | Barra de progresso além de `owned/total` bruto da API |
| 7 | **Progresso de deck** | `calcProgress`, `calcMissing`, filtro “só o que falta” | Aba Trocas ou futura tela “Meu deck” |
| 8 | **Import/export interoperável** | CSV `id,name,set,number,qty` + JSON backup v2 | Migrar coleção Deckmanager ↔ Trade Center com conversor `PFL_106` → `me02-106` |
| 9 | **`resolveCardName`** | Normaliza ID/número contra catálogo embutido | Inspirar validação após import (resolver via TCGdex por set + número) |

### Baixa prioridade / escopo futuro

| # | Item | Origem no Deckmanager | Uso no Trade Center |
|---|------|----------------------|---------------------|
| 10 | **Pool Tools da Liga** | Lista de trainers/EX + `prints` multi-set | Referência para jogadores de Liga (nova aba ou seção) |
| 11 | **Decks preset Liga** | `PRESET_DECKS` (ex. Mega Diancie, Mega Gengar) | Importar listas prontas na aba Trocas |
| 12 | **Pokédex 151 / Johto / Hoenn** | Slots + vínculo manual | Fora do MVP atual |
| 13 | **Botão “Atualizar PT”** | Sincroniza nomes da coleção com nomes dos decks | Menos relevante — TCGdex já entrega PT |

### Preços (não vem do Deckmanager)

| # | Item | Notas |
|---|------|--------|
| 14 | **TCGdex `pricing`** | EUR (Cardmarket) + USD (TCGPlayer) no JSON da carta — exibir na UI com aviso |
| 15 | **Estimativa em R$** | Conversão cambial (ex. PTAX) — estimativa, não mercado BR |
| 16 | **MYP Cards** | Tabela `tcgdexId → mypProductId` (ex. `me02-106` → `300712`); sem API pública |
| 17 | **LigaPokemon preços** | Mesma URL do item 2; usuário vê lojas BR no navegador |

---

## Mapa de sets (referência)

| Sigla Liga | ID TCGdex | Nome (app) |
|------------|-----------|------------|
| `MEG` | `me01` | Megaevolução |
| `PFL` | `me02` | Fogo Fantasmagórico |
| `ASC` | `me02.5` | Heróis Excelsos |
| `POR` | `me03` | Equilíbrio Perfeito |

Outros sets existem no Deckmanager (`DRI`, `PRE`, `BLK`, …) mas ainda não estão em `SUPPORTED_SETS` do Trade Center.

---

## Não portar

- Catálogo embutido `SET_COLLECTIONS` (~1.7k cartas no HTML) — duplica manutenção; manter TCGdex.
- App inteiro em um `index.html` — stack diferente (Expo / React Native).
- WebView bridges (`AndroidStorage`, `AndroidExport`) — usar Zustand + `expo-sharing` / `expo-document-picker` quando necessário.

---

## Exemplo de IDs (Meowth)

| Sistema | Valor |
|---------|--------|
| TCGdex | `me02-106` |
| Liga | `ed=PFL`, `num=106`, `card=Meowth (106/094)` |
| MYP | `produto/300712/meowth` (ID opaco) |
| Deckmanager | `PFL_106` |

---

_Ver também: [AGENTS.md](../AGENTS.md) § Roadmap de produto._
