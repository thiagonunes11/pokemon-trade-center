# Pokemon Trade Center

App **web** para montar sua vitrine de Pokémon TCG, acompanhar o progresso das expansões e (em breve) trocar cartas na região. Feito com **Vite**, **React** e **TypeScript**.

> **Trabalho em andamento** — trocas regionais e link público da vitrine ainda são stubs.

**Agentes de IA:** leia [AGENTS.md](./AGENTS.md) antes de alterar código.

---

## O que o app faz hoje

1. **Login** — e-mail e senha (Firebase Auth): Entrar / Criar conta / Esqueci senha
2. **Catálogo** — expansões Megaevolução (TCGdex em português) + binder com progresso (possuídas / faltam N)
3. **Coleção** — cartas salvas neste navegador e **sincronizadas no Firestore** após o login
4. **Compartilhar** — exportar PNG da vitrine de um set (possuídas coloridas, faltantes em cinza); link público em breve
5. **Ajustes** — avatar, nome, tema (claro / escuro / sistema), logout
6. **Trocas** — placeholder (região / matching depois)

> A coleção do antigo app nativo **não migra** automaticamente. Cartas adicionadas na web sobem para `collections/{uid}/cards`.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Build | Vite |
| UI | React 19 + Tailwind CSS |
| Rotas | React Router |
| Dados cartas | `@tcgdex/sdk` (locale `pt`) |
| Cache | TanStack React Query (persistido em `localStorage`) |
| Estado | Zustand |
| Auth / perfil | Firebase Auth + Firestore (`users/{uid}`) |

---

## Pré-requisitos

1. [Node.js](https://nodejs.org/) 20 LTS+
2. Conta [Firebase](https://console.firebase.google.com/) (plano Spark) — Auth e-mail/senha + app **Web**

---

## Setup

```bash
npm install
cp .env.example .env
# Preencha VITE_FIREBASE_* (ver abaixo)
npm run dev
```

Abra a URL do Vite (em geral `http://localhost:5173`).

```bash
npm run build    # gera dist/
npm run preview  # serve o build localmente
npm run lint
```

---

## Firebase (Web)

1. No Console: **Authentication** → e-mail/senha ativado
2. **Adicionar app → Web** → copiar o `firebaseConfig`
3. Preencher `.env`:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

4. Authentication → **Authorized domains** → incluir `localhost` e o domínio do Vercel
5. Reinicie o `npm run dev` após mudar o `.env`

### Deploy (Vercel)

1. Conecte o repositório (branch `main`)
2. Framework: **Vite** — build `npm run build`, output `dist`
3. Environment Variables: as mesmas `VITE_FIREBASE_*` do `.env`
4. No Firebase Auth → Authorized domains, adicione o host `*.vercel.app` (e domínio customizado, se houver)

Repos `firestore.rules` / `firebase.json` continuam válidos para o perfil `users/{uid}` e coleção. Deploy de regras: `firebase deploy --only firestore:rules`.

**Não** versionar `.env`. Arquivos nativos (`google-services.json`, etc.) não são mais usados.

---

## Expansões

| Expansão | ID | Status |
|----------|-----|--------|
| Megaevolução | `me01` | Disponível |
| Fogo Fantasmagórico | `me02` | Disponível |
| Heróis Excelsos | `me02.5` | Disponível |
| Equilíbrio Perfeito | `me03` | Disponível |
| Caos Ascendente | `me04` | Catálogo em breve (API sem cartas) |

---

## Rotas

| Rota | Tela |
|------|------|
| `/login` | Auth |
| `/catalog` | Lista de expansões |
| `/catalog/:setId` | Grid do set |
| `/collection` | Minha coleção |
| `/trades` | Placeholder |
| `/settings` | Conta e tema |
| `/card/:id` | Detalhe |

---

## Licença

Ver [LICENSE](./LICENSE).
