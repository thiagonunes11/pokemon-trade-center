# Pokemon Trade Center

App mobile para explorar cartas do Pokémon TCG, montar sua coleção e preparar trocas com outros jogadores. Feito com **Expo** e **React Native**.

> **Trabalho em andamento** — este app ainda está em desenvolvimento ativo. Várias telas e funções existem de forma parcial ou como placeholder; novas funcionalidades estão sendo implementadas e serão adicionadas em atualizações futuras. O que você vê hoje não representa a versão final do produto.

---

## Status do projeto

| Situação | Detalhe |
|----------|---------|
| **Estágio** | MVP / protótipo em evolução |
| **Funcionalidades** | Em construção — algumas já funcionam, outras estão planejadas |
| **Expectativa** | Comportamentos, layout e fluxos podem mudar sem aviso prévio |

Se você clonar o repositório, espere encontrar código e telas em constante mudança. Sugestões e contribuições são bem-vindas enquanto o projeto amadurece.

---

## O que o app faz hoje

| Tela | Descrição |
|------|-----------|
| **Catálogo** | Lista cartas do set *Megaevolução — Fogo Fantasmagórico* (API em português) |
| **Detalhe da carta** | Imagem em alta, informações (HP, tipo, ataques, etc.) e botão para coleção |
| **Coleção** | Guarda cartas localmente no dispositivo (Zustand) |
| **Trocas** | Apenas layout inicial — funcionalidade completa será adicionada futuramente |

---

## Pré-requisitos

Antes de começar, instale:

1. **[Node.js](https://nodejs.org/)** — versão **20 LTS** ou superior (recomendado)
2. **[Git](https://git-scm.com/)**
3. Para **Android**:
   - [Android Studio](https://developer.android.com/studio) com um emulador (AVD) criado, **ou**
   - Celular Android com [modo desenvolvedor](https://developer.android.com/studio/debug/dev-options) e USB/debug ativo
4. Para **iOS** (apenas macOS): Xcode e simulador iOS

> **Dica:** na primeira vez no Android, o comando `npm run android` pode demorar alguns minutos (download do Gradle e build nativo).

---

## Como rodar o projeto

Siga os passos na ordem:

### 1. Clonar o repositório

```bash
git clone https://github.com/thiagonunes11/pokemon-trade-center.git
cd pokemon-trade-center
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Iniciar o servidor de desenvolvimento

```bash
npm start
```

O terminal do Expo abrirá com um menu. Atalhos úteis:

| Tecla | Ação |
|-------|------|
| `a` | Abrir no emulador/dispositivo **Android** |
| `i` | Abrir no simulador **iOS** (macOS) |
| `w` | Abrir no **navegador** |
| `r` | Recarregar o app |
| `m` | Abrir menu de desenvolvedor |

### 4. Atalho direto para Android

Com o emulador já ligado:

```bash
npm run android
```

Equivale a `expo run:android` — compila e instala o app nativo (pasta `android/` já existe no projeto).

Ou, só para abrir no emulador sem build completo:

```bash
npx expo start --android
```

---

## Scripts disponíveis

| Comando | O que faz |
|---------|-----------|
| `npm start` | Inicia o Metro Bundler (Expo) |
| `npm run android` | Build nativo + execução no Android |
| `npm run ios` | Build nativo + execução no iOS (macOS) |
| `npm run web` | Abre a versão web |
| `npm run lint` | Verifica o código com ESLint do Expo |

---

## Estrutura do projeto

```
pokemon-trade-center/
├── src/
│   ├── app/                 # Rotas (Expo Router)
│   │   ├── (tabs)/          # Abas: Catálogo, Coleção, Trocas
│   │   └── card/[id].tsx    # Detalhe da carta
│   ├── features/cards/      # Grid, hooks e integração TCGdex
│   ├── store/               # Estado da coleção (Zustand)
│   ├── lib/                 # API TCGdex, React Query, polyfills
│   └── theme/               # Cores e tipografia
├── assets/                  # Ícones e imagens do app
├── android/                 # Projeto nativo Android
├── app.json                 # Configuração do Expo
└── tamagui.config.ts        # Tema visual (Tamagui)
```

O código das telas fica em **`src/app`**, não na pasta `app` na raiz (configuração deste template).

---

## Tecnologias

- [Expo SDK 56](https://docs.expo.dev/) + [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Native](https://reactnative.dev/) 0.85 + [React](https://react.dev/) 19
- [Tamagui](https://tamagui.dev/) — UI e tema escuro *phantom*
- [TanStack Query](https://tanstack.com/query) — cache e requisições
- [TCGdex SDK](https://tcgdex.dev/) — dados das cartas em **pt-BR**
- [Zustand](https://zustand.docs.pmnd.dev/) — coleção local

---

## Problemas comuns

### Metro não inicia ou porta ocupada

```bash
npx expo start --clear
```

### Emulador Android não aparece

1. Abra o **Android Studio** → **Device Manager**
2. Inicie um AVD (ex.: Pixel com API 34+)
3. Rode de novo `npm run android` ou pressione `a` no terminal do Expo

### Erro após mudar dependências

```bash
rm -rf node_modules
npm install
npx expo start --clear
```

No Windows (PowerShell):

```powershell
Remove-Item -Recurse -Force node_modules
npm install
npx expo start --clear
```

### App não atualiza após editar código

No terminal do Expo, pressione **`r`** para reload. Se persistir, reinicie com `--clear`.

---

## Funcionalidades planejadas

Itens abaixo estão no radar e serão inseridos aos poucos — não há prazo fixo:

- [ ] Listar e filtrar cartas da coleção
- [ ] Fluxo completo de trocas entre jogadores
- [ ] Suporte a mais sets além do *Fogo Fantasmagórico*
- [ ] Persistência da coleção com AsyncStorage
- [ ] Melhorias de UI/UX e performance

A lista pode crescer conforme o desenvolvimento avança. Acompanhe os commits e as **Issues** do repositório para ver o que entrou em cada versão.

Contribuições e sugestões são bem-vindas via **Issues** e **Pull Requests**.

---

## Licença

Este projeto utiliza dependências open source. Consulte o arquivo [LICENSE](./LICENSE) no repositório.

---

## Links úteis

- [Documentação Expo](https://docs.expo.dev/)
- [TCGdex — API de cartas](https://tcgdex.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
