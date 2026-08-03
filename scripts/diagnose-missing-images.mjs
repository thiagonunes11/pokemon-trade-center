/**
 * Diagnóstico one-shot: cobertura de imagens TCGdex pt→en→Pokémon TCG.
 * Uso: node scripts/diagnose-missing-images.mjs [--limit N] [--series ID]
 */
const TCGDEX = "https://api.tcgdex.net/v2";
const PTCG = "https://api.pokemontcg.io/v2";
const PTCG_DATA =
  "https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master";

const args = process.argv.slice(2);
const limitIdx = args.indexOf("--limit");
const seriesIdx = args.indexOf("--series");
const LIMIT = limitIdx >= 0 ? Number(args[limitIdx + 1]) : Infinity;
const ONLY_SERIES = seriesIdx >= 0 ? args[seriesIdx + 1] : null;

function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/gi, "")
    .toLowerCase();
}

function normalizeNumber(value) {
  const compact = String(value).replace(/\s+/g, "").toLowerCase();
  const match = compact.match(/^([^0-9]*)(\d+)(.*)$/);
  if (!match) return compact;
  return `${match[1]}${Number(match[2])}${match[3]}`;
}

function probableSetIds(setId) {
  const ids = [setId];
  const scarletViolet = setId.match(/^sv0?(\d+)(?:\.5)?$/i);
  if (scarletViolet) {
    ids.push(
      `sv${Number(scarletViolet[1])}${setId.includes(".5") ? "pt5" : ""}`,
    );
  }
  return [...new Set(ids)];
}

async function fetchJson(url, { timeoutMs = 12_000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchSettled(url) {
  try {
    return await fetchJson(url);
  } catch {
    return null;
  }
}

let ptcgSetsCache = null;
async function loadPtcgSets() {
  if (ptcgSetsCache) return ptcgSetsCache;
  try {
    const payload = await fetchJson(`${PTCG}/sets?pageSize=250`);
    ptcgSetsCache = payload.data;
  } catch {
    ptcgSetsCache = await fetchJson(`${PTCG_DATA}/sets/en.json`);
  }
  return ptcgSetsCache;
}

function matchPtcgSet(sets, tcgdexSetId, englishName) {
  for (const candidate of probableSetIds(tcgdexSetId)) {
    const exact = sets.find((s) => s.id === candidate);
    if (exact) return { set: exact, how: `id:${candidate}` };
  }
  if (englishName) {
    const n = normalize(englishName);
    const byName = sets.filter((s) => normalize(s.name) === n);
    if (byName.length === 1) return { set: byName[0], how: "name" };
  }
  return { set: null, how: null };
}

const ptcgCardsCache = new Map();
async function loadPtcgCards(setId) {
  if (ptcgCardsCache.has(setId)) return ptcgCardsCache.get(setId);
  const promise = (async () => {
    try {
      const cards = [];
      let page = 1;
      let total = Infinity;
      while (cards.length < total) {
        const payload = await fetchJson(
          `${PTCG}/cards?q=set.id:${encodeURIComponent(setId)}&page=${page}&pageSize=250&select=id,number,images`,
        );
        cards.push(...payload.data);
        total = payload.totalCount;
        if (payload.count === 0) break;
        page += 1;
      }
      return cards;
    } catch {
      const raw = await fetchJson(
        `${PTCG_DATA}/cards/en/${encodeURIComponent(setId)}.json`,
      );
      return raw;
    }
  })();
  ptcgCardsCache.set(setId, promise);
  return promise;
}

async function diagnoseSet(setId, englishName, ptcgSets) {
  const [pt, en] = await Promise.all([
    fetchSettled(`${TCGDEX}/pt/sets/${encodeURIComponent(setId)}`),
    fetchSettled(`${TCGDEX}/en/sets/${encodeURIComponent(setId)}`),
  ]);
  if (!pt && !en) return null;

  const ptCards = pt?.cards ?? [];
  const enCards = en?.cards ?? [];
  const ptById = new Map(ptCards.map((c) => [c.id, c]));
  const enById = new Map(enCards.map((c) => [c.id, c]));
  const ids = [...new Set([...enById.keys(), ...ptById.keys()])];

  let enFill = 0;
  const missingAfterTcgdex = [];
  for (const id of ids) {
    const p = ptById.get(id);
    const e = enById.get(id);
    const image = p?.image ?? e?.image;
    if (!p?.image && e?.image) enFill += 1;
    if (!image) {
      const localId = id.startsWith(`${setId}-`)
        ? id.slice(setId.length + 1)
        : id.slice(id.lastIndexOf("-") + 1);
      missingAfterTcgdex.push({ id, localId });
    }
  }

  const match = matchPtcgSet(ptcgSets, setId, englishName ?? en?.name);
  let ptcgFill = 0;
  let stillMissing = missingAfterTcgdex.length;
  let sampleMissing = missingAfterTcgdex.slice(0, 8).map((m) => m.id);

  if (missingAfterTcgdex.length > 0 && match.set) {
    const ptcgCards = await loadPtcgCards(match.set.id);
    const byNumber = new Map(
      ptcgCards.map((c) => [normalizeNumber(c.number), c]),
    );
    const remaining = [];
    for (const card of missingAfterTcgdex) {
      const hit = byNumber.get(normalizeNumber(card.localId));
      if (hit?.images?.small || hit?.images?.large) {
        ptcgFill += 1;
      } else {
        remaining.push(card.id);
      }
    }
    stillMissing = remaining.length;
    sampleMissing = remaining.slice(0, 8);
  }

  return {
    setId,
    name: pt?.name ?? en?.name ?? setId,
    total: ids.length,
    enFill,
    missingAfterTcgdex: missingAfterTcgdex.length,
    ptcgMatch: match.set ? `${match.set.id} (${match.how})` : "NONE",
    ptcgFill,
    stillMissing,
    sampleMissing,
  };
}

async function main() {
  console.log("Carregando séries TCGdex + sets Pokémon TCG…");
  const [seriesList, ptcgSets] = await Promise.all([
    fetchJson(`${TCGDEX}/en/series`),
    loadPtcgSets(),
  ]);

  const series = seriesList.filter((s) => s.id !== "tcgp");
  const targetSeries = ONLY_SERIES
    ? series.filter((s) => s.id === ONLY_SERIES)
    : series;

  const work = [];
  for (const serie of targetSeries) {
    const detail = await fetchJson(
      `${TCGDEX}/en/series/${encodeURIComponent(serie.id)}`,
    );
    for (const set of detail.sets ?? []) {
      work.push({ setId: set.id, name: set.name, seriesId: serie.id });
    }
  }

  const slice = work.slice(0, LIMIT === Infinity ? work.length : LIMIT);
  console.log(
    `Diagnosticando ${slice.length}/${work.length} sets (séries físicas)…\n`,
  );

  const rows = [];
  const CONCURRENCY = 4;
  let i = 0;
  async function worker() {
    while (i < slice.length) {
      const idx = i++;
      const item = slice[idx];
      process.stderr.write(
        `\r[${idx + 1}/${slice.length}] ${item.setId}          `,
      );
      try {
        const row = await diagnoseSet(item.setId, item.name, ptcgSets);
        if (row) rows.push({ ...row, seriesId: item.seriesId });
      } catch (err) {
        rows.push({
          setId: item.setId,
          seriesId: item.seriesId,
          name: item.name,
          total: 0,
          enFill: 0,
          missingAfterTcgdex: -1,
          ptcgMatch: `ERROR: ${err.message}`,
          ptcgFill: 0,
          stillMissing: -1,
          sampleMissing: [],
        });
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  process.stderr.write("\n\n");

  const withGaps = rows
    .filter((r) => r.stillMissing > 0)
    .sort((a, b) => b.stillMissing - a.stillMissing);

  const unmatched = withGaps.filter((r) => r.ptcgMatch === "NONE");
  const matchedButGaps = withGaps.filter((r) => r.ptcgMatch !== "NONE");

  const totals = rows.reduce(
    (acc, r) => {
      if (r.stillMissing < 0) return acc;
      acc.sets += 1;
      acc.cards += r.total;
      acc.afterTcgdex += Math.max(0, r.missingAfterTcgdex);
      acc.ptcgFill += r.ptcgFill;
      acc.still += r.stillMissing;
      return acc;
    },
    { sets: 0, cards: 0, afterTcgdex: 0, ptcgFill: 0, still: 0 },
  );

  console.log("=== RESUMO ===");
  console.log(
    `Sets: ${totals.sets} | Cartas: ${totals.cards} | Sem img após TCGdex: ${totals.afterTcgdex} | Preenchidas Pokémon TCG: ${totals.ptcgFill} | Ainda sem img: ${totals.still}`,
  );
  console.log(
    `Sets com buraco residual: ${withGaps.length} (sem match de set: ${unmatched.length}; match OK mas número/imagem falha: ${matchedButGaps.length})`,
  );

  console.log("\n=== TOP sets ainda sem imagem (após fallback completo) ===");
  for (const r of withGaps.slice(0, 40)) {
    console.log(
      `${String(r.stillMissing).padStart(4)} / ${String(r.total).padStart(4)}  ${r.setId.padEnd(12)}  ptcg=${r.ptcgMatch.padEnd(28)}  ${r.name}`,
    );
    if (r.sampleMissing.length) {
      console.log(`         sample: ${r.sampleMissing.join(", ")}`);
    }
  }

  console.log("\n=== Sets sem match Pokémon TCG (amostra) ===");
  for (const r of unmatched.slice(0, 25)) {
    console.log(
      `${String(r.stillMissing).padStart(4)}  ${r.setId.padEnd(12)}  ${r.name}`,
    );
  }

  console.log("\n=== Match OK, mas cartas sem número/imagem (amostra) ===");
  for (const r of matchedButGaps.slice(0, 25)) {
    console.log(
      `${String(r.stillMissing).padStart(4)}  ${r.setId.padEnd(12)} → ${r.ptcgMatch}  sample: ${r.sampleMissing.join(", ")}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
