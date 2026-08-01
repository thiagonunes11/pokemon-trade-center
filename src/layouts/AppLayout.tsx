import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/catalog", label: "Catálogo" },
  { to: "/collection", label: "Coleção" },
  { to: "/trades", label: "Trocas" },
  { to: "/settings", label: "Ajustes" },
];

function navClass({ isActive }: { isActive: boolean }) {
  return `block rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-[var(--color-accent)] text-white"
      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text)]"
  }`;
}

export function AppLayout() {
  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <aside className="hidden w-56 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 md:flex md:flex-col">
        <div className="mb-6 px-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Pokemon Trade Center
          </p>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass}>
              {item.label}
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
              `flex flex-1 flex-col items-center justify-center py-2 text-xs font-medium ${
                isActive
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-text-muted)]"
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
