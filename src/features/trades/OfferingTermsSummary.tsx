import {
  hasValidOfferingTerms,
  type OfferingTerms,
} from "@/features/trades/offeringTerms";

export function OfferingTermsSummary({ terms }: { terms: OfferingTerms }) {
  const wantedNames = terms.wantCards
    .slice(0, 2)
    .map((card) => card.name)
    .join(", ");
  const extraWanted = Math.max(terms.wantCards.length - 2, 0);

  return (
    <div className="flex flex-wrap gap-1.5">
      {terms.priceBRL ? (
        <span className="rounded-full bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] px-2 py-1 text-xs font-bold text-[var(--color-text)]">
          R$ {terms.priceBRL.toFixed(2).replace(".", ",")}
        </span>
      ) : null}
      {terms.wantCards.length ? (
        <span
          title={terms.wantCards.map((card) => card.name).join(", ")}
          className="line-clamp-2 rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text-secondary)]"
        >
          Troca por: {wantedNames}
          {extraWanted ? ` +${extraWanted}` : ""}
        </span>
      ) : null}
      {!hasValidOfferingTerms(terms) ? (
        <span className="rounded-full bg-[color-mix(in_srgb,var(--color-error)_14%,transparent)] px-2 py-1 text-xs font-bold text-[var(--color-error)]">
          Completar condições
        </span>
      ) : null}
    </div>
  );
}
