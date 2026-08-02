# Pokemon Trade Center

App **web** para montar sua vitrine de Pokémon TCG, acompanhar expansões, anunciar/procurar cartas, conversar 1:1 e entrar no grupo WhatsApp da cidade. Feito com **Vite**, **React** e **TypeScript**.

> **Trabalho em andamento** — notificações push ainda não existem.

**Agentes de IA:** leia [AGENTS.md](./AGENTS.md) antes de alterar código.

---

## O que o app faz hoje

1. **Login** — e-mail e senha (Firebase Auth)
2. **Catálogo** — expansões Megaevolução (`me01`–`me05`) + binder com progresso
3. **Coleção** — sync Firestore; abas Todas / Por coleção / Vitrine (★)
4. **Compartilhar** — link do perfil (`/u/slug`: vitrine, Anunciando, Procurando)
5. **Trocas** — listas próprias, **mural** (Explorar; Conversar só em anúncios), **chat** 1:1, **Comunidade** (WhatsApp por cidade)
6. **Ajustes** — avatar (5 Pokémon), slug, nome, tema, logout

> A coleção do antigo app nativo **não migra** automaticamente.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Build | Vite |
| UI | React 19 + Tailwind CSS + Motion |
| Rotas | React Router |
| Dados cartas | `@tcgdex/sdk` (locale `pt`) |
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

## Expansões

| Expansão | ID | Status |
|----------|-----|--------|
| Megaevolução | `me01` | Disponível |
| Fogo Fantasmagórico | `me02` | Disponível |
| Heróis Excelsos | `me02.5` | Disponível |
| Equilíbrio Perfeito | `me03` | Disponível |
| Caos Ascendente | `me04` | Disponível |
| Escuridão Absoluta | `me05` | Disponível |

---

## Rotas

| Rota | Tela |
|------|------|
| `/login` | Auth |
| `/catalog` | Expansões |
| `/catalog/:setId` | Grid do set |
| `/collection` | Coleção / vitrine |
| `/trades` | Explorar / listas / conversas / comunidade |
| `/trades/chat/:threadId` | Chat 1:1 |
| `/u/:slug` | Perfil (slug ou UID) |
| `/settings` | Conta e tema |
| `/card/:id` | Detalhe |

---

## Licença

Ver [LICENSE](./LICENSE).
