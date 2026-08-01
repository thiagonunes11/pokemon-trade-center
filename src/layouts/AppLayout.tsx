import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/catalog", label: "Catálogo" },
  { to: "/collection", label: "Coleção" },
  { to: "/trades", label: "Trocas", soon: true },
  { to: "/settings", label: "Ajustes" },
] as const;

function navClass({ isActive }: { isActive: boolean }) {
  return `block border-l-2 px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "border-[var(--color-accent)] text-[var(--color-accent)]"
      : "border-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border)] hover:text-[var(--color-text)]"
  }`;
}

export function AppLayout() {
  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <aside className="hidden w-56 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 md:flex md:flex-col">
        <div className="mb-8 px-1">
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold leading-tight text-[var(--color-text)]">
            Pokemon Trade Center
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Sua vitrine de colecionador
          </p>
        </div>
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass}>
              {item.label}
              {"soon" in item && item.soon ? (
                <span className="ml-2 text-[10px] font-normal uppercase tracking-wide text-[var(--color-text-muted)]">
                  Em breve
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--color-border)] bg-[var(--color-bg-card)] md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center border-t-2 py-2 text-[11px] font-medium ${
                isActive
                  ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                  : "border-transparent text-[var(--color-text-muted)]"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
