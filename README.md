# Pokemon Trade Center

App mobile para explorar cartas do Pokémon TCG, montar sua coleção e preparar trocas com outros jogadores. Feito com **Expo** e **React Native**.

> **Trabalho em andamento** — funcionalidades novas entram aos poucos; o app ainda não representa a versão final.

**Agentes de IA:** leia [AGENTS.md](./AGENTS.md) antes de alterar código.

---

## O que o app faz hoje

### Primeiro acesso

1. **Login local** — informe um nome; o app cria uma conta só neste dispositivo (sem servidor)
2. Coleção, tema e cache da API ficam salvos localmente no aparelho

### Aba Catálogo

1. **Coleções** — escolha a expansão (logo oficial + progresso `005/188 cartas`)
2. **Grid** — todas as cartas do set (pull-to-refresh)
3. **Detalhe** — imagem, tipos com ícones de energia, ataques, fraquezas e botão para adicionar/remover da coleção

### Aba Coleção

- Grade **4×4** com as cartas que você salvou (imagem em tela cheia)
- Toque em uma carta para abrir o detalhe
- **Botão circular** no canto inferior direito mostra só o **número** de cartas; ao tocar, abre o filtro **Todas** ou **Por coleção**

### Aba Trocas

Placeholder — fluxo de troca ainda não implementado.

### Outros

- **Tema claro/escuro** — alternância no header da tela **Coleções** (catálogo)
- **Cache da TCGdex** — consultas persistidas para abrir mais rápido na próxima vez

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
5. Conta [Firebase](https://console.firebase.google.com/) (plano **Spark**, gratuito) — para auth na nuvem (em implementação)

---

## Firebase (configuração inicial)

> **Repositório aberto:** `google-services.json`, `GoogleService-Info.plist` e `.env` **não** são versionados. Use os arquivos `*.example` e o passo **Setup local** abaixo. Se esses arquivos já foram commitados no passado, remova-os do histórico ou restrinja as API keys no [Google Cloud Console](https://console.cloud.google.com/).

Depois de criar o projeto no Console:

### 1. Authentication

1. **Build** → **Authentication** → **Começar**
2. Aba **Sign-in method** → **E-mail/senha** → **Ativar** → Salvar

### 2. Registrar os apps (Android + iOS + Web)

Um **projeto** Firebase, **três apps** no Console (mesmo `project_id`):

| Plataforma | Identificador no Console | Arquivo local (raiz, gitignored) |
|------------|--------------------------|----------------------------------|
| **Android** | `com.pokemontradecenter.app` | `google-services.json` (template: `google-services.json.example`) |
| **iOS** | `com.pokemontradecenter.app` (Bundle ID) | `GoogleService-Info.plist` (template: `GoogleService-Info.plist.example`) |
| **Web** (recomendado) | nickname qualquer | sem arquivo — só o `firebaseConfig` no `.env` |

Passos:

1. **Configurações do projeto** → **Seus apps**
2. **Android** — pacote `com.pokemontradecenter.app` → `google-services.json` na raiz (`app.json` → `android.googleServicesFile`)
3. **iOS** — Bundle ID `com.pokemontradecenter.app` → baixar `GoogleService-Info.plist` na raiz e adicionar em `app.json`:
   ```json
   "ios": {
     "bundleIdentifier": "com.pokemontradecenter.app",
     "googleServicesFile": "./GoogleService-Info.plist"
   }
   ```
4. **Web** — copie `apiKey`, `authDomain`, `projectId`, etc. para o `.env` (melhor opção para o **mesmo** `.env` em Android, iOS e Expo Web com o SDK JS)

O Expo copia os arquivos nativos para `android/app/` e o target iOS no `prebuild` / `expo run:android` / `expo run:ios`.

### Android + iOS: como funciona na prática

```text
                    ┌─────────────────────────────────────┐
                    │     Firebase (1 projeto Spark)      │
                    │  Auth · Firestore · FCM (futuro)    │
                    └─────────────────────────────────────┘
                           ▲                    ▲
           google-services.json          GoogleService-Info.plist
           (só Android)                  (só iOS)
                           ▲                    ▲
              ┌────────────┴──────┐   ┌────────┴────────────┐
              │  Build Android    │   │  Build iOS (Mac/EAS)  │
              │  npm run android  │   │  npm run ios          │
              └────────────┬──────┘   └────────┬────────────┘
                           │                    │
                           └────────┬───────────┘
                                    ▼
                    ┌─────────────────────────────────────┐
                    │  Código JS: src/lib/firebase.ts     │
                    │  .env EXPO_PUBLIC_FIREBASE_*        │
                    │  (Auth e-mail/senha — igual nos 2)  │
                    └─────────────────────────────────────┘
```

- **Arquivos nativos** (`google-services.json` / `.plist`): usados na **compilação** de cada plataforma (FCM nativo, integração Google no app nativo). Baixe do Console e coloque na raiz (não vão para o Git).
- **SDK JavaScript** (`firebase` no React Native): usa o **`.env`** em runtime. O `projectId`, `apiKey` e `authDomain` são iguais em todo o projeto. O campo `EXPO_PUBLIC_FIREBASE_APP_ID` é o único que muda entre app Android, iOS ou Web no Console.

**Recomendação para um único `.env` em ambas as lojas:** cadastre o app **Web** no Firebase e use o `appId` do Web no `.env` (funciona com o SDK JS no Expo em Android e iOS). Mantenha mesmo assim os arquivos nativos de cada loja para build de produção e push futuro.

**Build iOS:** precisa de Mac com Xcode, ou [EAS Build](https://docs.expo.dev/build/introduction/) na nuvem (funciona no Windows para gerar o `.ipa`). Comando local: `npm run ios` (após `GoogleService-Info.plist` e `ios.googleServicesFile`).

### Pode ignorar no Console: SPM, CocoaPods e Swift `AppDelegate`

O assistente do Firebase mostra instalação via **Swift Package Manager** e `FirebaseApp.configure()` no `AppDelegate`. Isso é para apps **nativos Swift/SwiftUI**.

Este projeto usa **Expo + React Native** com o SDK **JavaScript** (`firebase` no npm). Você **não** precisa:

- Abrir o Xcode só para adicionar o pacote `firebase-ios-sdk`
- Colar o `AppDelegate` em Swift
- Instalar CocoaPods manualmente para Firebase

O Expo faz a parte nativa ao gerar o projeto:

- `google-services.json` → Android (`android.googleServicesFile`)
- `GoogleService-Info.plist` → iOS (`ios.googleServicesFile`)
- `src/lib/firebase.ts` → `initializeApp()` em JavaScript (com `apiKey` / `appId` por plataforma no `.env`)

**Usuários e login são os mesmos** no Android e iOS (mesmo `project_id` no Firebase).

### 3. Setup local (obrigatório após clone)

```bash
# 1. Arquivos nativos — Firebase Console → Configurações → Seus apps → baixar
#    Coloque na raiz do projeto (nomes exatos):
#      google-services.json
#      GoogleService-Info.plist

# 2. Variáveis JS para o SDK (runtime)
cp .env.example .env
```

Preencha o `.env` com os valores do Console (prefixo `EXPO_PUBLIC_`). Dica: `API_KEY` / `GOOGLE_APP_ID` do `.plist` e `current_key` / `mobilesdk_app_id` do `.json` correspondem às variáveis iOS e Android no `.env.example`.

Reinicie o Metro com cache limpo:

```bash
npx expo start --clear
```

O bootstrap está em `src/lib/firebase.ts` (`getFirebaseAuth()`). A tela de login com Firebase vem na **Etapa 4** do [AGENTS.md](./AGENTS.md) §8.3.

### 4. Firestore (pode ser depois)

Quando for sincronizar a coleção: **Build** → **Firestore** → criar banco (modo produção, região próxima, ex. `southamerica-east1`).

### 5. Build na nuvem (EAS, opcional)

Sem os arquivos no Git, configure [variáveis de ambiente no EAS](https://docs.expo.dev/eas/environment-variables/) (tipo **file**) com o conteúdo de `google-services.json` e `GoogleService-Info.plist`, ou injete os arquivos no job de build. O `app.json` continua apontando para `./google-services.json` e `./GoogleService-Info.plist` na raiz — eles precisam existir **no ambiente de build**, não no repositório público.

---

## Como rodar

```bash
git clone https://github.com/thiagonunes11/pokemon-trade-center.git
cd pokemon-trade-center
npm install

# Firebase (só na sua máquina — ver README § Firebase)
cp .env.example .env
# Baixar google-services.json e GoogleService-Info.plist do Console → raiz do projeto

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
src/app/
  login.tsx
  (tabs)/catalog/       # Coleções → catálogo por set
  (tabs)/collection.tsx # Minha coleção (grid 4×4 + FAB filtro)
  card/[id].tsx         # Detalhe da carta
src/features/           # CardGrid, CardItem, sets
src/components/         # ThemeToggle, EnergyIcon
src/lib/                # TCGdex, energyIcons, collections
src/store/              # auth + coleção (persist)
assets/images/energy/   # Ícones de tipo (PNG)
AGENTS.md               # Contexto para IAs
```

Telas em **`src/app`**, não em `/app` na raiz.

---

## Tecnologias

Expo 56 · React Native 0.85 · Expo Router · Tamagui · TanStack Query · TCGdex SDK · Zustand · Reanimated · AsyncStorage

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
- [ ] Variante de carta na coleção (holo / reverse — metadados já existem na API)

Contribuições via Issues e Pull Requests.

---

## Licença

Ver [LICENSE](./LICENSE).

## Links

- [Expo](https://docs.expo.dev/)
- [TCGdex](https://tcgdex.dev/)
- [Sets Megaevolução (API)](https://api.tcgdex.net/v2/pt/series/me)
