import { NavLink, Outlet } from "react-router-dom";

function IconCatalog({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function IconCollection({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="5" width="14" height="16" rx="2" />
      <path d="M8 5V3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2" />
    </svg>
  );
}

function IconTrades({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 3h5v5" />
      <path d="M8 21H3v-5" />
      <path d="M21 3 14 10" />
      <path d="m3 21 7-7" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </svg>
  );
}

const navItems = [
  { to: "/catalog", label: "Catálogo", Icon: IconCatalog },
  { to: "/collection", label: "Coleção", Icon: IconCollection },
  { to: "/trades", label: "Trocas", Icon: IconTrades },
  { to: "/settings", label: "Ajustes", Icon: IconSettings },
];

function navClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
    isActive
      ? "bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-[0_8px_24px_-10px_color-mix(in_srgb,var(--color-accent)_70%,transparent)]"
      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text)]"
  }`;
}

export function AppLayout() {
  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <a href="#main-content" className="ui-skip-link">
        Pular para o conteúdo
      </a>
      <aside className="ui-glass hidden w-60 shrink-0 border-r border-[var(--color-border)] p-4 md:flex md:flex-col">
        <div className="mb-8 px-1">
          <p className="font-[family-name:var(--font-display)] text-lg font-extrabold leading-tight text-[var(--color-text)]">
            Pokemon{" "}
            <span className="text-[var(--color-accent)] drop-shadow-[0_0_18px_color-mix(in_srgb,var(--color-accent)_55%,transparent)]">
              Trade
            </span>{" "}
            Center
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Vitrine · coleção · trocas
          </p>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass}>
              <item.Icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-[4.5rem] md:pb-0">
        <main
          id="main-content"
          tabIndex={-1}
          className="ui-page mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none sm:px-6"
        >
          <Outlet />
        </main>
      </div>

      <nav className="ui-glass fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)] md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold transition ${
                isActive
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-text-muted)]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <span
                    className="absolute top-1 h-1 w-6 rounded-full bg-[var(--color-accent)] shadow-[0_0_12px_var(--color-accent)]"
                    aria-hidden
                  />
                ) : null}
                <item.Icon className="h-5 w-5" />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
