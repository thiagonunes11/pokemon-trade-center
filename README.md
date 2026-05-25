# Pokemon Trade Center

App mobile para explorar cartas do Pokémon TCG, montar sua coleção e preparar trocas com outros jogadores. Feito com **Expo** e **React Native**.

> **Trabalho em andamento** — funcionalidades novas entram aos poucos; o app ainda não representa a versão final.

**Agentes de IA:** leia [AGENTS.md](./AGENTS.md) antes de alterar código.

---

## O que o app faz hoje

### Primeiro acesso

1. **Login local** — informe um nome; o app cria uma conta só neste dispositivo (sem servidor)
2. Os dados da coleção e preferências ficam salvos localmente

### Aba Catálogo

1. **Coleções** — escolha a expansão (logo oficial + progresso `005/188 cartas`)
2. **Grid** — todas as cartas do set (pull-to-refresh)
3. **Detalhe** — imagem, informações e botão para adicionar/remover da sua coleção

### Aba Coleção

- Lista das cartas que você salvou
- Modos: **Todas**, **Por coleção** ou **Recentes**
- Toque em uma carta para abrir o detalhe

### Aba Trocas

Placeholder — fluxo de troca ainda não implementado.

### Outros

- **Tema claro/escuro** (toggle no header da tela Coleções)
- **Cache da API** — consultas TCGdex persistidas para abrir mais rápido na próxima vez

---

## Expansões (série Megaevolução)

Dados via [TCGdex](https://tcgdex.dev/) em português.

| Expansão | ID | Status |
|----------|-----|--------|
| Megaevolução | `me01` | Disponível |
| Fogo Fantasmagórico | `me02` | Disponível |
| Heróis Excelsos | `me02.5` | Disponível |
| Equilíbrio Perfeito | `me03` | Disponível |
| Caos Ascendente | `me04` | Catálogo em breve (API sem cartas ainda) |

---

## Pré-requisitos

1. [Node.js](https://nodejs.org/) 20 LTS+
2. [Git](https://git-scm.com/)
3. Android: [Android Studio](https://developer.android.com/studio) + emulador, ou dispositivo com USB debug
4. iOS (macOS): Xcode

---

## Como rodar

```bash
git clone https://github.com/thiagonunes11/pokemon-trade-center.git
cd pokemon-trade-center
npm install
npm start
```

| Tecla | Ação |
|-------|------|
| `a` | Android |
| `i` | iOS |
| `r` | Recarregar |
| `m` | Menu dev |

```bash
npm run android          # build nativo + emulador
npx expo start --android # só Metro + emulador
npx expo start --clear   # limpar cache
```

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm start` | Metro / Expo |
| `npm run android` | Run Android nativo |
| `npm run ios` | Run iOS |
| `npm run web` | Web |
| `npm run lint` | ESLint |

---

## Estrutura

```
src/app/           # Rotas (Expo Router)
  login.tsx
  (tabs)/catalog/  # Coleções → catálogo por set
  (tabs)/collection.tsx
  card/[id].tsx
src/features/      # cards, sets
src/hooks/         # useOwnedSetCount, tema
src/store/         # auth + coleção (persist)
src/lib/           # TCGdex, cache, collections
src/theme/         # claro/escuro
AGENTS.md          # Contexto para IAs
```

Telas em **`src/app`**, não em `/app` na raiz.

---

## Tecnologias

Expo 56 · React Native 0.85 · Expo Router · Tamagui · TanStack Query · TCGdex SDK · Zustand · AsyncStorage

---

## Problemas comuns

**Metro / cache:** `npx expo start --clear`

**Emulador:** Android Studio → Device Manager → iniciar AVD → `a` no Expo

**Erro `getSetCardCount`:** reload com `--clear`; ver [AGENTS.md](./AGENTS.md)

**Expansão desabilitada:** normal para `me04` até a TCGdex publicar cartas

---

## Roadmap

- [ ] Fluxo de trocas
- [ ] Conta/sync na nuvem
- [ ] Promos (`mep`) e mais sets
- [ ] Busca no catálogo

Contribuições via Issues e Pull Requests.

---

## Licença

Ver [LICENSE](./LICENSE).

## Links

- [Expo](https://docs.expo.dev/)
- [TCGdex](https://tcgdex.dev/)
- [Sets Megaevolução (API)](https://api.tcgdex.net/v2/pt/series/me)
