export function TradesPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6 py-10">
      <header className="space-y-2 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-text)]">
          Trocas
        </h1>
        <p className="font-[family-name:var(--font-serif)] text-[var(--color-text-secondary)]">
          Em breve você poderá buscar cartas com colecionadores na sua região.
        </p>
      </header>
      <div className="border border-dashed border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
        <p className="text-sm font-medium text-[var(--color-text)]">
          O que vem depois
        </p>
        <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-muted)]">
          <li>Publicar cartas da sua vitrine para troca</li>
          <li>Filtrar por região</li>
          <li>Combinar com outros colecionadores</li>
        </ul>
        <p className="mt-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wide text-[var(--color-accent)]">
          Em breve
        </p>
      </div>
    </div>
  );
}
