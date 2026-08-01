export function TradesPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-10 text-center">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">Trocas</h1>
      <p className="text-[var(--color-text-secondary)]">
        Encontre outros jogadores e troque cartas Pokémon TCG. Negocie
        diretamente e construa o deck dos seus sonhos!
      </p>
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 text-left">
        <p className="font-semibold text-[var(--color-text)]">
          Funcionalidades planejadas
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[var(--color-text-muted)]">
          <li>Publicar cartas para troca</li>
          <li>Buscar cartas disponíveis</li>
          <li>Chat com outros jogadores</li>
          <li>Sistema de avaliação</li>
        </ul>
      </div>
      <p className="text-sm text-[var(--color-text-muted)]">
        Em desenvolvimento — em breve
      </p>
    </div>
  );
}
