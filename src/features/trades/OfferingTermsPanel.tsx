import { CardItem } from "@/features/cards";
import { useSetCards } from "@/features/cards";
import {
  hasValidOfferingTerms,
  type OfferingTerms,
  type WantCardRef,
} from "@/features/trades/offeringTerms";
import { COLLECTIONS, getCollectionById } from "@/lib/collections";
import { compareByLocalId } from "@/lib/cardOrder";
import { useEffect, useId, useMemo, useRef, useState } from "react";

type OfferingCard = {
  id: string;
  name: string;
  imageUrl: string | null;
  setId: string;
};

type OfferingTermsPanelProps = {
  open: boolean;
  mode: "create" | "edit";
  card: OfferingCard | null;
  initialTerms?: OfferingTerms;
  onCancel: () => void;
  onSave: (terms: OfferingTerms) => void;
};

type PickerStep = null | { setId?: string };

function parsePriceBRL(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, "");
  if (!normalized) return null;
  const decimal = normalized.includes(",")
    ? normalized.replace(/\./g, "").replace(",", ".")
    : normalized;
  const price = Number(decimal);
  return Number.isFinite(price) && price > 0 ? price : null;
}

function toHighImage(image: string | null): string | null {
  if (!image) return null;
  const lower = image.toLowerCase();
  return lower.endsWith(".webp") || lower.endsWith(".png")
    ? image
    : `${image}/high.webp`;
}

export function OfferingTermsPanel({
  open,
  mode,
  card,
  initialTerms,
  onCancel,
  onSave,
}: OfferingTermsPanelProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const addCardRef = useRef<HTMLButtonElement>(null);
  const pickerWasOpen = useRef(false);
  const [priceInput, setPriceInput] = useState("");
  const [wantCards, setWantCards] = useState<WantCardRef[]>([]);
  const [picker, setPicker] = useState<PickerStep>(null);
  const pickerSetId = picker?.setId ?? "";
  const { data: setData, isLoading } = useSetCards(pickerSetId);

  const pickerCards = useMemo(
    () => [...(setData?.cards ?? [])].sort(compareByLocalId),
    [setData?.cards],
  );
  const terms = useMemo<OfferingTerms>(
    () => ({ priceBRL: parsePriceBRL(priceInput), wantCards }),
    [priceInput, wantCards],
  );
  const valid = hasValidOfferingTerms(terms);

  useEffect(() => {
    if (!open) return;
    setPriceInput(
      initialTerms?.priceBRL != null
        ? String(initialTerms.priceBRL).replace(".", ",")
        : "",
    );
    setWantCards(initialTerms?.wantCards ?? []);
    setPicker(null);
    requestAnimationFrame(() => priceRef.current?.focus());
  }, [card?.id, initialTerms, open]);

  useEffect(() => {
    if (!open) {
      pickerWasOpen.current = false;
      return;
    }
    if (picker) {
      requestAnimationFrame(() => {
        const focusable = pickerRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        focusable?.[0]?.focus();
      });
      pickerWasOpen.current = true;
    } else if (pickerWasOpen.current) {
      requestAnimationFrame(() => addCardRef.current?.focus());
      pickerWasOpen.current = false;
    }
  }, [open, picker]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (picker) setPicker(null);
        else onCancel();
        return;
      }
      if (event.key !== "Tab") return;
      const activePanel = picker ? pickerRef.current : panelRef.current;
      if (!activePanel) return;
      const focusable = activePanel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus?.();
    };
  }, [onCancel, open, picker]);

  if (!open || !card) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        role="presentation"
        onClick={onCancel}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-hidden={picker ? true : undefined}
          inert={picker ? true : undefined}
          className="ui-glass-strong ui-dialog-panel max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl p-5 sm:max-w-lg sm:rounded-3xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2
                id={titleId}
                className="font-[family-name:var(--font-display)] text-xl font-extrabold text-[var(--color-text)]"
              >
                Condições da oferta
              </h2>
              <p className="mt-1 truncate text-sm text-[var(--color-text-secondary)]">
                {card.name}
              </p>
            </div>
            <button type="button" onClick={onCancel} className="ui-tool-btn">
              Fechar
            </button>
          </div>

          <div className="mt-5 space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-bold text-[var(--color-text)]">
                Preço (R$)
              </span>
              <input
                ref={priceRef}
                type="text"
                inputMode="decimal"
                value={priceInput}
                onChange={(event) => setPriceInput(event.target.value)}
                placeholder="Ex.: 50,00"
                className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
              />
              <span className="block text-xs text-[var(--color-text-muted)]">
                Opcional se você escolher ao menos uma carta para troca.
              </span>
            </label>

            <section aria-labelledby={`${titleId}-wants`} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3
                    id={`${titleId}-wants`}
                    className="text-sm font-bold text-[var(--color-text)]"
                  >
                    Aceito em troca
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Até 20 cartas do catálogo.
                  </p>
                </div>
                <button
                  ref={addCardRef}
                  type="button"
                  onClick={() => setPicker({})}
                  disabled={wantCards.length >= 20}
                  className="ui-tool-btn disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Adicionar carta
                </button>
              </div>

              {wantCards.length ? (
                <ul className="space-y-2">
                  {wantCards.map((wanted) => (
                    <li
                      key={wanted.id}
                      className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-2"
                    >
                      {wanted.imageUrl ? (
                        <img
                          src={wanted.imageUrl}
                          alt=""
                          className="h-14 w-10 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="h-14 w-10 shrink-0 rounded bg-[var(--color-bg-card)]" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--color-text)]">
                        {wanted.name}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remover ${wanted.name}`}
                        onClick={() =>
                          setWantCards((current) =>
                            current.filter((item) => item.id !== wanted.id),
                          )
                        }
                        className="ui-tool-btn min-w-11"
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl border border-dashed border-[var(--color-border)] p-4 text-center text-sm text-[var(--color-text-muted)]">
                  Nenhuma carta selecionada.
                </p>
              )}
            </section>
          </div>

          <p
            className="mt-5 text-xs text-[var(--color-text-muted)]"
            role={!valid ? "status" : undefined}
          >
            Informe um preço válido ou escolha ao menos uma carta.
          </p>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-11 rounded-xl border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-elevated)]"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!valid}
              onClick={() => onSave(terms)}
              className="ui-btn-accent min-h-11 px-5 text-sm disabled:cursor-not-allowed disabled:opacity-45"
            >
              {mode === "create" ? "Publicar" : "Salvar"}
            </button>
          </div>
        </div>
      </div>

      {picker ? (
        <div
          ref={pickerRef}
          className="fixed inset-0 z-[70] flex flex-col bg-[var(--color-bg)]"
          role="dialog"
          aria-modal="true"
          aria-label="Escolher carta para troca"
        >
          <div className="ui-glass-strong flex items-center justify-between gap-3 border-x-0 border-t-0 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              {picker.setId ? (
                <button
                  type="button"
                  onClick={() => setPicker({})}
                  className="min-h-11 text-sm font-semibold text-[var(--color-accent)]"
                >
                  ← Expansões
                </button>
              ) : null}
              <h2 className="truncate font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-text)]">
                {picker.setId
                  ? (getCollectionById(picker.setId)?.name ?? picker.setId)
                  : "Escolher expansão"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setPicker(null)}
              className="ui-tool-btn"
            >
              Voltar à oferta
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {!picker.setId ? (
              <div className="space-y-2">
                {COLLECTIONS.map((collection) => (
                  <button
                    key={collection.id}
                    type="button"
                    onClick={() => setPicker({ setId: collection.id })}
                    className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3 text-left transition hover:border-[var(--color-accent)]"
                  >
                    <img
                      src={collection.logoUrl}
                      alt=""
                      className="h-10 w-16 object-contain"
                    />
                    <span className="font-semibold text-[var(--color-text)]">
                      {collection.name}
                    </span>
                  </button>
                ))}
              </div>
            ) : isLoading ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                Carregando cartas…
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {pickerCards.map((pickerCard) => {
                  const selected = wantCards.some(
                    (wanted) => wanted.id === pickerCard.id,
                  );
                  return (
                    <div key={pickerCard.id} className="relative">
                      {selected ? (
                        <span className="absolute top-2 left-2 z-10 rounded-md bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-on-accent)]">
                          Selecionada
                        </span>
                      ) : null}
                      <CardItem
                        id={pickerCard.id}
                        name={pickerCard.name}
                        localId={String(pickerCard.localId)}
                        image={pickerCard.image ?? null}
                        compact
                        onPress={() => {
                          if (selected || wantCards.length >= 20) return;
                          setWantCards((current) => [
                            ...current,
                            {
                              id: pickerCard.id,
                              name: pickerCard.name,
                              imageUrl: toHighImage(pickerCard.image ?? null),
                              setId: picker.setId!,
                            },
                          ]);
                          setPicker(null);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
