import { BrandMark } from "@/components/BrandMark";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuthStore } from "@/store/useAuthStore";
import { useCollectionStore } from "@/store/useCollectionStore";
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
  return `group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
    isActive
      ? "bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-[0_8px_24px_-10px_color-mix(in_srgb,var(--color-accent)_70%,transparent)]"
      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text)]"
  }`;
}

export function AppLayout() {
  const userId = useAuthStore((s) => s.userId);
  const username = useAuthStore((s) => s.username);
  const email = useAuthStore((s) => s.email);
  const collectionCards = useCollectionStore((s) => s.cards);
  const ownedCount = collectionCards.filter(
    (card) => (card.ownerId ?? null) === (userId ?? null),
  ).length;

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <a href="#main-content" className="ui-skip-link">
        Pular para o conteúdo
      </a>
      <aside className="ui-glass sticky top-0 hidden h-dvh w-60 shrink-0 overflow-hidden border-r border-[var(--color-border)] p-4 md:flex md:flex-col">
        <div className="pointer-events-none absolute -top-16 -left-16 h-40 w-40 rounded-full bg-[var(--color-accent)] opacity-10 blur-3xl" aria-hidden />
        <div className="relative mb-8 flex items-center gap-3 px-1">
          <BrandMark className="h-10 w-10 shrink-0 drop-shadow-[0_10px_18px_rgba(238,21,21,0.22)]" />
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-display)] text-base font-extrabold leading-tight text-[var(--color-text)]">
              Pokemon <span className="text-[var(--color-accent)]">Trade</span>
            </p>
            <p className="text-[11px] font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
              Central do treinador
            </p>
          </div>
        </div>
        <p className="mb-2 px-3 font-[family-name:var(--font-mono)] text-[10px] font-medium tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
          Navegação
        </p>
        <nav className="relative flex flex-col gap-1" aria-label="Navegação principal">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass}>
              <item.Icon className="h-5 w-5 shrink-0 transition-transform group-hover:scale-105" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {userId ? (
          <NavLink
            to="/settings"
            className="ui-glass-strong relative mt-auto flex items-center gap-3 overflow-hidden rounded-2xl p-3 transition hover:border-[color-mix(in_srgb,var(--color-accent)_40%,var(--color-border))]"
            aria-label="Abrir ajustes da conta"
          >
            <UserAvatar userId={userId} name={username} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[var(--color-text)]">
                {username || "Treinador"}
              </p>
              <p className="truncate text-[11px] text-[var(--color-text-muted)]">
                {ownedCount} carta{ownedCount === 1 ? "" : "s"} · {email}
              </p>
            </div>
            <span className="text-[var(--color-text-muted)]" aria-hidden>›</span>
          </NavLink>
        ) : null}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-[4.5rem] md:pb-0">
        <main
          id="main-content"
          tabIndex={-1}
          className="ui-page mx-auto w-full max-w-6xl flex-1 px-4 py-5 outline-none sm:px-6 sm:py-7"
        >
          <Outlet />
        </main>
      </div>

      <nav className="ui-glass fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--color-border)] px-1 pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Navegação principal">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `relative my-1 flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold transition ${
                isActive
                  ? "bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] text-[color-mix(in_srgb,var(--color-accent)_82%,var(--color-text))]"
                  : "text-[var(--color-text-muted)] active:bg-[var(--color-bg-elevated)]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.Icon className={`h-5 w-5 ${isActive ? "drop-shadow-[0_0_8px_color-mix(in_srgb,var(--color-accent)_55%,transparent)]" : ""}`} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
