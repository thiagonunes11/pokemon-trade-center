import { UserAvatar } from "@/components/UserAvatar";
import { getAuthErrorMessage } from "@/features/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppTheme, type ThemeMode } from "@/theme";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string }> = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Sistema" },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.userId);
  const email = useAuthStore((s) => s.email);
  const username = useAuthStore((s) => s.username);
  const isLoading = useAuthStore((s) => s.isLoading);
  const updateDisplayName = useAuthStore((s) => s.updateDisplayName);
  const logout = useAuthStore((s) => s.logout);
  const { themeMode, setThemeMode } = useAppTheme();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(username ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSaveName = async () => {
    setError(null);
    try {
      await updateDisplayName(nameDraft);
      setEditingName(false);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Sair da conta neste navegador?")) return;
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  if (!userId) return null;

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-[var(--color-text)]">
          Ajustes
        </h1>
      </header>

      <section className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Conta
        </h2>
        <div className="flex items-center gap-4">
          <UserAvatar userId={userId} name={username} size={56} />
          <div className="min-w-0 flex-1">
            {editingName ? (
              <div className="space-y-2">
                <input
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => void handleSaveName()}
                    className="rounded-xl bg-[var(--color-accent)] px-3 py-1.5 text-sm font-bold text-[var(--color-on-accent)]"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingName(false);
                      setNameDraft(username ?? "");
                    }}
                    className="rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-secondary)]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="truncate font-semibold text-[var(--color-text)]">
                  {username || "Treinador"}
                </p>
                <button
                  type="button"
                  className="text-sm text-[var(--color-accent)] hover:underline"
                  onClick={() => {
                    setNameDraft(username ?? "");
                    setEditingName(true);
                  }}
                >
                  Editar nome
                </button>
              </>
            )}
          </div>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">
          <span className="text-[var(--color-text-muted)]">E-mail: </span>
          {email}
        </p>
        {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
        <button
          type="button"
          disabled={isLoading}
          onClick={() => void handleLogout()}
          className="rounded-lg border border-[var(--color-error)] px-4 py-2 text-sm font-medium text-[var(--color-error)] hover:bg-[var(--color-bg-elevated)]"
        >
          Sair da conta
        </button>
      </section>

      <section className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Aparência
        </h2>
        <div className="space-y-2">
          {THEME_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-[var(--color-bg-elevated)]"
            >
              <input
                type="radio"
                name="theme"
                checked={themeMode === opt.value}
                onChange={() => setThemeMode(opt.value)}
                className="accent-[var(--color-accent)]"
              />
              <span className="text-sm text-[var(--color-text)]">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Sobre
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Versão 1.0.0 · Dados via TCGdex (pt) · Série Megaevolução
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          Coleção salva neste navegador e sincronizada com a nuvem após o login.
        </p>
      </section>
    </div>
  );
}
