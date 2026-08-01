export function formatCollectionProgress(owned: number, total: number): string {
  const padLength = Math.max(String(total).length, 3);
  const ownedPadded = String(owned).padStart(padLength, "0");
  return `${ownedPadded}/${total} cartas`;
}

export function formatMissingLabel(owned: number, total: number): string {
  if (total <= 0) return "";
  const missing = Math.max(total - owned, 0);
  if (missing === 0) return "completa";
  return missing === 1 ? "falta 1" : `faltam ${missing}`;
}

export function formatFolioCounts(owned: number, total: number): string {
  return `${owned}/${total}`;
}
