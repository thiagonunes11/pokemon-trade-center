# Progresso — catálogo multifonte e busca global

Data da consolidação: 3 de agosto de 2026.

## Objetivo

Ampliar o catálogo, antes concentrado nas expansões de Megaevolução, para as
séries físicas antigas e promocionais disponíveis, complementando dados e
imagens ausentes sem exigir chave de API. A busca por nome também deveria
abranger todo o catálogo, independentemente da série selecionada.

## Entregas concluídas

### Links externos de cartas

- A busca da MYP Cards usa os parâmetros esperados pelo site:
  `ProdutoSearch[marca]=pokemon` e `ProdutoSearch[query]=nome da carta`.
- O comportamento é genérico para qualquer carta, não específico para Dawn.
- A Liga Pokémon permanece disponível como segunda busca externa no detalhe.

Essa correção já está no histórico da `main`, no commit `94a4d7c`.

### Catálogo dinâmico

- As séries e expansões deixaram de depender de uma lista fixa `me01`–`me05`.
- A TCGdex fornece dinamicamente as séries e os sets disponíveis.
- A navegação agora segue série → expansão.
- Sets antigos e promocionais entram no catálogo quando disponibilizados pela
  fonte.
- A série `tcgp`, referente ao Pokémon TCG Pocket, é excluída porque o projeto
  representa cartas físicas.
- O ID canônico continua no formato TCGdex `{setId}-{localId}`, preservando a
  compatibilidade com coleção, vitrine, anúncios e lista de busca existentes.

### Estratégia multifonte

Prioridade de dados implementada:

1. TCGdex em português;
2. TCGdex em inglês;
3. Pokémon TCG API sem chave;
4. JSON do repositório oficial `PokemonTCG/pokemon-tcg-data` quando o endpoint
   REST da terceira fonte estiver indisponível.

O pareamento da terceira fonte usa set e número local da carta. Ela somente
complementa conteúdo ausente e nunca troca o ID persistido da TCGdex.

Para respeitar os limites anônimos da Pokémon TCG API, essa fonte é consultada
somente ao abrir um set ou o detalhe de uma carta que ainda tenha lacunas após
os fallbacks TCGdex. A listagem de séries, a busca e a leitura de metadados da
coleção não disparam requisições em massa nessa API.

### Imagens

- URLs-base da TCGdex continuam recebendo a qualidade/extensão solicitada.
- URLs completas de terceiros (`.png`, `.webp`, `.jpg`) são aceitas sem serem
  modificadas incorretamente.
- A resolução comum de imagens é usada no grid, detalhe, coleção e seletores de
  troca.
- O detalhe informa quando a imagem foi complementada pela Pokémon TCG API.
- A página do set mostra quantas imagens vieram da TCGdex em inglês, quantas
  vieram da terceira fonte e quantas continuam indisponíveis.

### Busca global por nome

A busca anterior percorria somente os sets da série selecionada. Por isso uma
busca por `Pikachu` na série Megaevolução retornava apenas uma ocorrência.

A implementação atual:

- consulta o endpoint global de cartas da TCGdex em `pt` e `en`;
- espera 300 ms após a digitação antes de consultar;
- combina e deduplica resultados pelo ID canônico;
- exclui resultados do Pokémon TCG Pocket;
- busca em todas as séries físicas, mesmo quando outra série está selecionada
  para navegação;
- mantém os filtros “Todas”, “Tenho” e “Faltam”;
- permite restringir os resultados a um set da série atualmente selecionada.

Validação com dados reais em 3 de agosto de 2026: a busca por `pikachu`
retornou 188 IDs físicos únicos após combinar os locales, sem resultados do
Pokémon TCG Pocket.

## Arquivos principais

| Área | Arquivos |
|------|----------|
| Catálogo e merge de fontes | `src/lib/tcgdex.ts` |
| Cliente sem chave e contingência JSON | `src/lib/pokemonTcgApi.ts` |
| Normalização de imagens | `src/lib/cardImages.ts` |
| Hooks e cache do catálogo | `src/features/sets/hooks/useCollections.ts`, `src/features/cards/hooks/useCards.ts` |
| Navegação e busca global | `src/pages/CatalogPage.tsx` |
| Grid e detalhe do set | `src/pages/CatalogSetPage.tsx`, `src/features/cards/components/CardItem.tsx` |
| Detalhe da carta | `src/pages/CardDetailPage.tsx` |
| Coleção e trocas | `src/pages/CollectionPage.tsx`, `src/pages/TradesPage.tsx`, `src/features/trades/OfferingTermsPanel.tsx` |
| Contrato e setup | `README.md`, `AGENTS.md` |

## Cache e consultas

Principais chaves do TanStack Query:

- `['catalog-series']`;
- `['series-sets', seriesId]`;
- `['catalog-card-search-v1', termo]`;
- `['set-cards-v2', setId]`;
- `['set-metadata-v2', setId]`;
- `['card-v2', cardId]`;
- `['set-v2', setId]`.

As versões novas evitam reaproveitar payloads antigos persistidos com formato
incompatível.

## Validação executada

- `npm run lint`: concluído sem erros; permanecem três avisos preexistentes de
  Fast Refresh em `main.tsx` e `ThemeContext.tsx`.
- `npm run build`: concluído com sucesso; permanece o aviso conhecido de chunk
  JavaScript acima de 500 kB.
- `git diff --check`: concluído sem problemas de whitespace.
- Teste real do fallback no set `smp`: 181 imagens da TCGdex em inglês e 67
  imagens da Pokémon TCG API, totalizando 248 cartas sem imagem ausente.
- Teste real da busca global por `pikachu`: 188 resultados físicos únicos.

## Limitações conhecidas

- Um set continuará sem imagem quando nenhuma das fontes possuir o ativo. O
  set `mep` foi observado nessa situação durante os testes.
- Cartas complementadas podem aparecer em inglês quando não há tradução em
  português.
- A Pokémon TCG API sem chave informa limite anônimo de 1.000 requisições por
  dia e 30 por minuto; por isso ela não participa da busca global.
- O endpoint REST complementar apresentou respostas `500` intermitentes nos
  testes. O fallback para o repositório de dados reduz o impacto, mas continua
  sujeito à disponibilidade de rede e à cobertura desse catálogo.

## Como testar localmente

1. Execute `npm install`, caso as dependências ainda não estejam instaladas.
2. Configure o `.env` com as variáveis Firebase descritas no `README.md`.
3. Execute `npm run dev`.
4. Entre no aplicativo e abra `/catalog`.
5. Troque entre séries e confirme a presença de expansões antigas e promos.
6. Pesquise `pikachu` e confirme que o total independe da série selecionada.
7. Abra cartas de sets antigos e valide grid, detalhe, coleção e seletores de
   troca.

## Próximos passos sugeridos

- Criar testes automatizados para merge por ID, correspondência por número e
  exclusão de Pokémon TCG Pocket.
- Adicionar paginação ou limite visual caso buscas muito genéricas retornem
  milhares de cartas.
- Monitorar a cobertura de sets sem imagens e manter um mapa explícito apenas
  para divergências de IDs comprovadas entre as fontes.
- Avaliar divisão do bundle principal para remover o aviso de chunk acima de
  500 kB.
