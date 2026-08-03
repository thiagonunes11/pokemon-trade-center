# Sintetizar URLs do CDN TCGdex quando `image` estiver ausente

**Date:** 2026-08-03  
**Status:** Approved design  
**Branch context:** `feat/catalogo-multifonte-busca-global`

## Goal

Reduzir cartas “Sem imagem” quando a API TCGdex omite o campo `image`, mas o arquivo ainda existe em `assets.tcgdex.net`. Maximizar cobertura global sem nova fonte externa nem mapa manual TCGdex↔Pokémon TCG.

## Context

Diagnóstico em 203 sets físicos (~20.964 cartas):

| Etapa | Cartas |
|-------|--------|
| Sem imagem após TCGdex pt→en | 1.372 |
| Preenchidas pela Pokémon TCG | 770 |
| Ainda sem imagem | 602 |

Parte do residual é “órfão de metadado”: API sem `image`, CDN com 200. Ex.: `mep` (~40/60 assets existem); `ex5.5` responde com `localId` padded (`001`). Outros buracos (Trainer Kits, McDonald’s 2023/24, etc.) não têm ativo no CDN nem na Pokémon TCG — ficam fora do ganho desta fatia.

Abordagem escolhida: **B** (sintetizar CDN), sem overrides curados nem expansão do mapa Pokémon TCG nesta spec.

## Scope

### In

- Etapa nova no pipeline de set e detalhe, entre TCGdex en e Pokémon TCG
- Helper puro de candidatas de URL-base
- Probe HEAD com cache em memória e concorrência limitada
- Contador / `imageSource` para imagens vindas do CDN
- Script de diagnóstico estendido (opcional na implementação, desejável na verificação)
- UI: sem regressão; aviso de `missingImageCount` continua correto

### Out

- Mapa explícito TCGdex → Pokémon TCG set IDs
- Normalização avançada de números só para Pokémon TCG (`CC001`, etc.)
- Arquivo de overrides manuais / terceira CDN (Limitless, etc.)
- HEAD na busca global por nome
- Mudança de schema Firestore / IDs persistidos

## Pipeline

Ordem em `fetchSetWithFallback` e `fetchCardWithFallback`:

1. Campo `image` TCGdex `pt`
2. Campo `image` TCGdex `en`
3. **CDN sintetizado** (esta fatia)
4. Pokémon TCG API / JSON oficial (já existente)

ID canônico da carta permanece TCGdex (`{setId}-{localId}`).

## CDN URL

Formato da URL-base (sem qualidade/extensão):

```text
https://assets.tcgdex.net/{lang}/{seriesId}/{setId}/{localIdCandidate}
```

`resolveCardImageUrl` continua acrescentando `/{quality}.webp`.

- `lang`: tentar `en` primeiro quando o campo API já falhou nos dois locales (assets PT costumam faltar); opcionalmente `pt` só se quisermos uma segunda passagem — **nesta fatia: apenas `en`**, suficiente para o caso `mep` e alinhado ao fallback de texto EN.
- `seriesId`: `ptSet.serie.id ?? enSet.serie.id` no set; no detalhe, série do card/set carregado. Sem série → pular etapa CDN.
- `localIdCandidate` (ordem):
  1. `localId` cru
  2. se só dígitos: `padStart(3, "0")`
  3. se só dígitos: `String(Number(localId))` (sem zeros à esquerda)

Parar no primeiro HEAD 200. Não inventar outros padrões de path nesta fatia.

## Probe

- `HEAD` na URL completa de prova: `{base}/low.webp` (mesmo asset que o grid usa).
- Timeout curto (~4s); abort → trata como miss e tenta próxima candidata.
- Cache em memória: chave = URL de prova (ou base); valor = base válida | `null` (404 confirmado).
- Concorrência no set: ~8 probes em paralelo, só para cartas ainda sem `image` após pt→en.
- Falha de rede/timeout: não quebra o load do set; carta segue para Pokémon TCG.

## Tipos e métricas

- `imageSource` inclui `"tcgdex-cdn"`.
- `CatalogSet` ganha `cdnImageCount` (cartas cuja imagem veio só do probe CDN).
- `missingImageCount` = cartas ainda sem `image` após todas as etapas.
- Detalhe (`CatalogCard`): espelhar com flag equivalente (ex. `usesTcgdexCdnImage`) ou reutilizar `imageSource` se o detalhe passar a expor a mesma união — manter consistência mínima com `usesEnglishImage` / `usesPokemonTcgImage` sem inflar a UI.

## UI

- Grid / detalhe: se `image` preenchida pelo CDN, comportamento idêntico às outras fontes.
- Página do set: manter aviso quando `missingImageCount > 0`. Mencionar CDN no copy **somente** se já existir menção a EN / Pokémon TCG no mesmo bloco; caso contrário, não adicionar ruído.
- Sem novos badges no card do grid.

## Error handling

| Situação | Comportamento |
|----------|----------------|
| HEAD 404 em todas candidatas | Segue para Pokémon TCG |
| Timeout / rede | Miss → próxima candidata → Pokémon TCG |
| Sem `seriesId` | Pula CDN |
| Asset CDN 200 mas imagem quebrada no browser (raro) | Fora de escopo; placeholder atual se `onError` já existir; não obrigatório nesta fatia |

## Testing / verification

1. Unitário (puro): candidatas de `localId` para `001` / `1` / `CC001` / `SWSH301` (não numérico → só cru).
2. Manual: abrir set `mep` — `cdnImageCount` sobe, `missingImageCount` cai (~40 residual esperado se 20 sem asset).
3. Manual: `ex5.5` — cartas com `localId` `1` resolvem via padding.
4. Manual: set sem assets órfãos (ex. Trainer Kit) — CDN não inventa imagem; Pokémon TCG ou “Sem imagem”.
5. `npm run lint` + `npm run build`.
6. Ideal: estender `scripts/diagnose-missing-images.mjs` com etapa CDN e comparar totais.

## Files (expected)

| Área | Arquivo |
|------|---------|
| Candidatas URL | `src/lib/tcgdexAssetUrl.ts` (novo) |
| Probe HEAD + cache | `src/lib/tcgdexAssetProbe.ts` (novo) ou junto do helper se ficar pequeno |
| Orquestração | `src/lib/tcgdex.ts` |
| Copy/métricas UI set | `src/pages/CatalogSetPage.tsx` (só se necessário) |
| Diagnóstico | `scripts/diagnose-missing-images.mjs` (opcional) |
| Contrato | `AGENTS.md` / `README.md` se documentar a ordem das fontes |

## Success criteria

- Pipeline documentado e implementado: pt → en → **cdn** → pokemontcg.
- Sets com assets órfãos no CDN (`mep`, `ex5.5`) passam a exibir a maioria das imagens sem chave de API.
- Busca global não dispara HEAD em massa.
- Lint/build verdes; sem mudança de IDs persistidos.
