# Pokemon Trade Center

App **web** para montar sua vitrine de Pokémon TCG, acompanhar expansões, anunciar/procurar cartas, conversar 1:1 e entrar no grupo WhatsApp da cidade. Feito com **Vite**, **React** e **TypeScript**.

> **Trabalho em andamento** — notificações push ainda não existem.

**Agentes de IA:** leia [AGENTS.md](./AGENTS.md) antes de alterar código.

---

## O que o app faz hoje

1. **Login** — e-mail e senha (Firebase Auth)
2. **Catálogo** — séries físicas da TCGdex, expansões antigas e promos + binder com progresso
3. **Coleção** — sync Firestore; abas Todas / Por coleção / Vitrine (★)
4. **Pokédex** — progresso nacional por espécie (automático via cartas da coleção)
5. **Compartilhar** — link do perfil (`/u/slug`: vitrine, Anunciando, Procurando)
6. **Trocas** — listas próprias, **mural** (Explorar; Conversar só em anúncios), **chat** 1:1, **Comunidade** (WhatsApp por cidade)
7. **Ajustes** — avatar (5 Pokémon), slug, nome, tema, logout

> A coleção do antigo app nativo **não migra** automaticamente.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Build | Vite |
| UI | React 19 + Tailwind CSS + Motion |
| Rotas | React Router |
| Dados cartas | TCGdex (`pt → en`) + Pokémon TCG API sem chave |
| Cache | TanStack React Query |
| Virtualização | `@tanstack/react-virtual` |
| Estado | Zustand |
| Auth / sync | Firebase Auth + Firestore |

---

## Pré-requisitos

1. [Node.js](https://nodejs.org/) 20 LTS+
2. Conta [Firebase](https://console.firebase.google.com/) (Spark) — Auth e-mail/senha + app **Web**

---

## Setup

```bash
npm install
cp .env.example .env
# Preencha VITE_FIREBASE_*
npm run dev
```

```bash
npm run build
npm run preview
npm run lint
```

---

## Firebase (Web)

1. Auth e-mail/senha + app Web → `.env` com `VITE_FIREBASE_*`
2. Authorized domains: `localhost` + Vercel
3. Deploy rules + indexes:

```bash
firebase deploy --only firestore --project SEU_PROJECT_ID
```

4. **Seed de comunidades** (Console → Firestore → coleção `communities`):

| Document ID | Campos |
|-------------|--------|
| `campinas` | `name`: `"Campinas"`, `whatsappUrl`: `"https://chat.whatsapp.com/..."`, `updatedAt`: timestamp |
| `sao-paulo` | idem |

Sem `whatsappUrl` (ou vazio), o app mostra “Em breve” para aquela cidade. Escrita de `communities` é só pelo Console (rules bloqueiam o cliente).

---

## Catálogo TCGdex

O catálogo descobre dinamicamente as séries e expansões físicas disponíveis na
TCGdex. Pokémon TCG Pocket não entra nessa listagem. A navegação é feita por
série → expansão, incluindo coleções antigas e conjuntos promocionais como
`smp`, `swshp`, `svp` e `mep`.

Os dados em português têm prioridade. Quando uma fonte não possui todas as
cartas ou imagens, o app usa a ordem TCGdex `pt` → TCGdex `en` → Pokémon TCG
API sem chave:

- set sem cartas em português: conteúdo exibido em inglês;
- tradução parcial: cartas ausentes são complementadas em inglês;
- imagem ausente em português: imagem internacional do mesmo ID;
- imagem ainda ausente na TCGdex: Pokémon TCG API por set + número;
- imagem inexistente nas três fontes: cartão “Sem imagem” e aviso no set.

A terceira fonte não altera o ID canônico da TCGdex. Ela é chamada apenas ao
abrir um set ou detalhe com lacunas; a busca global por nome usa o endpoint de
cartas da própria TCGdex nos idiomas `pt` e `en`, sem abrir cada expansão e sem
fallback em massa. Sem chave, a API externa limita o cliente a 1.000
requisições/dia e 30/minuto. Se o endpoint REST responder com erro, o app lê o
JSON equivalente no repositório oficial `PokemonTCG/pokemon-tcg-data`. Não
adicionar chave em variável `VITE_*`.

Os IDs persistidos continuam no formato `{setId}-{localId}`, portanto coleção,
vitrine e listas de troca não precisam de migração. A lista de séries e os
resumos dos sets são carregados primeiro; as cartas completas só são buscadas
ao abrir uma expansão. A pesquisa do catálogo abrange todas as séries físicas,
independentemente da série selecionada para navegação.

---

## Rotas

| Rota | Tela |
|------|------|
| `/login` | Auth |
| `/catalog` | Expansões |
| `/catalog/:setId` | Grid do set |
| `/collection` | Coleção / vitrine |
| `/pokedex` | Pokédex nacional |
| `/trades` | Explorar / listas / conversas / comunidade |
| `/trades/chat/:threadId` | Chat 1:1 |
| `/u/:slug` | Perfil (slug ou UID) |
| `/settings` | Conta e tema |
| `/card/:id` | Detalhe |

---

## Licença

Ver [LICENSE](./LICENSE).
