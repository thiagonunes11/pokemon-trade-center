export function formatCollectionProgress(owned: number, total: number): string {
  const padLength = Math.max(String(total).length, 3);
  const ownedPadded = String(owned).padStart(padLength, "0");
  return `${ownedPadded}/${total} cartas`;
}
