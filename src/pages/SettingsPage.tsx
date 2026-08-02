import { ConfirmDialog } from "@/components/ConfirmDialog";
import { UserAvatar } from "@/components/UserAvatar";
import { getAuthErrorMessage } from "@/features/auth";
import {
  AVATAR_PRESETS,
  claimHandle,
  clearAvatar,
  getHandleForUid,
  HandleInvalidError,
  HandleTakenError,
  setAvatarPreset,
  type AvatarPresetId,
  type PublicAvatar,
} from "@/features/profile";
import { getPublicProfile } from "@/features/trades/threadsService";
import {
  HANDLE_MAX,
  HANDLE_MIN,
  handleValidationMessage,
  normalizeHandle,
  validateHandle,
} from "@/lib/handle";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppTheme, type ThemeMode } from "@/theme";
import { useEffect, useId, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

const THEME_OPTIONS: Array<{
  value: ThemeMode;
  label: string;
  hint: string;
}> = [
  { value: "light", label: "Claro", hint: "Fundo claro" },
  { value: "dark", label: "Escuro", hint: "Fundo escuro" },
  { value: "system", label: "Sistema", hint: "Segue o aparelho" },
];

function emptyAvatar(): PublicAvatar {
  return { avatarType: null, avatarPresetId: null, avatarUrl: null };
}

function IconSun({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function IconMoon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5Z" />
    </svg>
  );
}

function IconMonitor({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

function ThemeIcon({ mode, className }: { mode: ThemeMode; className?: string }) {
  if (mode === "light") return <IconSun className={className} />;
  if (mode === "dark") return <IconMoon className={className} />;
  return <IconMonitor className={className} />;
}

function SectionCard({
  title,
  description,
  children,
  spotlight = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  spotlight?: boolean;
}) {
  return (
    <section
      className={`ui-glass space-y-4 rounded-2xl p-4 sm:p-5 ${spotlight ? "ui-spotlight" : ""}`}
      onMouseMove={
        spotlight
          ? (e) => {
              const el = e.currentTarget;
              const r = el.getBoundingClientRect();
              el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
              el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
            }
          : undefined
      }
    >
      <header className="space-y-1">
        <h2 className="text-xs font-semibold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.userId);
  const email = useAuthStore((s) => s.email);
  const username = useAuthStore((s) => s.username);
  const isLoading = useAuthStore((s) => s.isLoading);
  const updateDisplayName = useAuthStore((s) => s.updateDisplayName);
  const logout = useAuthStore((s) => s.logout);
  const { themeMode, setThemeMode } = useAppTheme();

  const nameInputId = useId();
  const handleInputId = useId();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(username ?? "");
  const [handle, setHandle] = useState<string | null>(null);
  const [editingHandle, setEditingHandle] = useState(false);
  const [handleDraft, setHandleDraft] = useState("");
  const [handleBusy, setHandleBusy] = useState(false);
  const [avatar, setAvatar] = useState<PublicAvatar>(emptyAvatar());
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void Promise.all([getHandleForUid(userId), getPublicProfile(userId)]).then(
      ([h, profile]) => {
        if (cancelled) return;
        setHandle(h);
        setHandleDraft(h ?? "");
        if (profile) {
          setAvatar({
            avatarType: profile.avatarType,
            avatarPresetId: profile.avatarPresetId,
            avatarUrl: profile.avatarUrl,
          });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const flashSuccess = (msg: string) => {
    setSuccess(msg);
    setError(null);
  };

  const handleSaveName = async () => {
    setError(null);
    try {
      await updateDisplayName(nameDraft);
      setEditingName(false);
      flashSuccess("Nome atualizado.");
    } catch (err) {
      setSuccess(null);
      setError(getAuthErrorMessage(err));
    }
  };

  const handleSaveHandle = async () => {
    if (!userId) return;
    setError(null);
    setSuccess(null);
    const checked = validateHandle(handleDraft);
    if (!checked.ok) {
      setError(handleValidationMessage(checked.error));
      return;
    }
    setHandleBusy(true);
    try {
      const next = await claimHandle(userId, checked.handle);
      setHandle(next);
      setHandleDraft(next);
      setEditingHandle(false);
      flashSuccess(`Slug salvo. Perfil em /u/${next}`);
    } catch (err) {
      if (err instanceof HandleTakenError) {
        setError("Esse nome de usuário já está em uso.");
      } else if (err instanceof HandleInvalidError) {
        setError(err.message);
      } else {
        setError("Não foi possível salvar o nome de usuário.");
      }
    } finally {
      setHandleBusy(false);
    }
  };

  const pickPreset = async (presetId: AvatarPresetId) => {
    if (!userId) return;
    setError(null);
    setAvatarBusy(true);
    try {
      await setAvatarPreset(userId, presetId);
      setAvatar({
        avatarType: "preset",
        avatarPresetId: presetId,
        avatarUrl: null,
      });
      flashSuccess("Ícone atualizado.");
    } catch {
      setSuccess(null);
      setError("Não foi possível salvar o ícone.");
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeAvatar = async () => {
    if (!userId) return;
    setError(null);
    setAvatarBusy(true);
    try {
      await clearAvatar(userId);
      setAvatar(emptyAvatar());
      flashSuccess("Ícone removido.");
    } catch {
      setSuccess(null);
      setError("Não foi possível remover o ícone.");
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleLogout = async () => {
    setLogoutOpen(false);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setSuccess(null);
      setError(getAuthErrorMessage(err));
    }
  };

  if (!userId) return null;

  const displayName = username || "Treinador";
  const profilePath = handle ? `/u/${handle}` : `/u/${userId}`;

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-4">
      <header className="space-y-1">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
          Ajustes
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Conta, aparência e perfil público.
        </p>
      </header>

      {(error || success) && (
        <div className="space-y-2">
          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-[var(--color-error)]/30 bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] px-3 py-2.5 text-sm text-[var(--color-error)]"
            >
              {error}
            </p>
          ) : null}
          {success ? (
            <p
              role="status"
              className="rounded-xl border border-[var(--color-success)]/30 bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] px-3 py-2.5 text-sm text-[var(--color-success)]"
            >
              {success}
            </p>
          ) : null}
        </div>
      )}

      {/* Resumo do perfil */}
      <section className="ui-glass-strong ui-spotlight relative overflow-hidden rounded-2xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(ellipse at 20% 0%, color-mix(in srgb, var(--color-accent) 18%, transparent), transparent 55%)",
          }}
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
          <UserAvatar
            userId={userId}
            name={username}
            size={72}
            avatar={avatar}
          />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-text)]">
              {displayName}
            </p>
            <p className="truncate font-[family-name:var(--font-mono)] text-sm text-[var(--color-text-muted)]">
              {handle ? `@${handle}` : "Slug ainda não definido"}
            </p>
            <p className="truncate text-xs text-[var(--color-text-secondary)]">
              {email}
            </p>
          </div>
          <Link
            to={profilePath}
            className="ui-tool-btn min-h-11 shrink-0 self-start sm:self-center"
          >
            Ver perfil
          </Link>
        </div>
      </section>

      <SectionCard
        title="Perfil"
        description="Como você aparece para outros treinadores."
        spotlight
      >
        {/* Nome */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              Nome de exibição
            </h3>
            {!editingName ? (
              <button
                type="button"
                className="ui-tool-btn !px-3 text-xs"
                onClick={() => {
                  setNameDraft(username ?? "");
                  setEditingName(true);
                  setSuccess(null);
                }}
              >
                Editar
              </button>
            ) : null}
          </div>
          {editingName ? (
            <div className="space-y-2">
              <label className="sr-only" htmlFor={nameInputId}>
                Nome de exibição
              </label>
              <input
                id={nameInputId}
                className="ui-input"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                autoComplete="nickname"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isLoading || !nameDraft.trim()}
                  onClick={() => void handleSaveName()}
                  className="ui-btn-accent min-h-11 flex-1 px-3 text-sm disabled:opacity-50"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingName(false);
                    setNameDraft(username ?? "");
                  }}
                  className="ui-tool-btn min-h-11 flex-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60 px-3 py-2.5 text-sm text-[var(--color-text)]">
              {displayName}
            </p>
          )}
        </div>

        {/* Avatar */}
        <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              Ícone
            </h3>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              Escolha um Pokémon. Sem upload (plano Spark).
            </p>
          </div>
          <div
            className="grid grid-cols-5 gap-2"
            role="listbox"
            aria-label="Ícones de perfil"
          >
            {AVATAR_PRESETS.map((preset) => {
              const selected =
                avatar.avatarType === "preset" &&
                avatar.avatarPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  role="option"
                  disabled={avatarBusy}
                  title={preset.label}
                  aria-label={preset.label}
                  aria-selected={selected}
                  onClick={() => void pickPreset(preset.id)}
                  className={`flex aspect-square min-h-11 items-center justify-center rounded-xl border-2 bg-[var(--color-bg)] p-1.5 transition disabled:opacity-50 ${
                    selected
                      ? "border-[var(--color-accent)] shadow-[0_0_16px_-6px_color-mix(in_srgb,var(--color-accent)_60%,transparent)] ring-1 ring-[var(--color-accent)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-accent)]"
                  }`}
                >
                  <img
                    src={preset.src}
                    alt=""
                    className="h-full w-full object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                </button>
              );
            })}
          </div>
          {avatar.avatarType ? (
            <button
              type="button"
              disabled={avatarBusy}
              onClick={() => void removeAvatar()}
              className="ui-tool-btn min-h-11 disabled:opacity-50"
            >
              Remover ícone
            </button>
          ) : null}
        </div>

        {/* Handle */}
        <div className="space-y-2 border-t border-[var(--color-border)] pt-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">
                Nome de usuário
              </h3>
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                Único · {HANDLE_MIN}–{HANDLE_MAX} caracteres · link do perfil
              </p>
            </div>
            {!editingHandle ? (
              <button
                type="button"
                className="ui-tool-btn !px-3 text-xs"
                onClick={() => {
                  setHandleDraft(handle ?? "");
                  setEditingHandle(true);
                  setSuccess(null);
                }}
              >
                {handle ? "Alterar" : "Definir"}
              </button>
            ) : null}
          </div>

          {editingHandle ? (
            <div className="space-y-2">
              <label className="sr-only" htmlFor={handleInputId}>
                Nome de usuário
              </label>
              <div className="ui-input flex items-center gap-1 !py-0">
                <span className="text-[var(--color-text-muted)]" aria-hidden>
                  @
                </span>
                <input
                  id={handleInputId}
                  className="min-w-0 flex-1 bg-transparent py-3 font-[family-name:var(--font-mono)] text-[var(--color-text)] outline-none"
                  value={handleDraft}
                  maxLength={HANDLE_MAX}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  onChange={(e) => {
                    setHandleDraft(normalizeHandle(e.target.value));
                    setError(null);
                  }}
                  placeholder="treinador-sonambulo"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={handleBusy}
                  onClick={() => void handleSaveHandle()}
                  className="ui-btn-accent min-h-11 flex-1 px-3 text-sm disabled:opacity-50"
                >
                  {handleBusy ? "Salvando…" : "Salvar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingHandle(false);
                    setHandleDraft(handle ?? "");
                    setError(null);
                  }}
                  className="ui-tool-btn min-h-11 flex-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60 px-3 py-2.5 font-[family-name:var(--font-mono)] text-sm text-[var(--color-text)]">
              {handle ? `@${handle}` : "Ainda não definido"}
            </p>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Aparência" description="Tema da interface.">
        <div
          className="grid grid-cols-3 gap-2"
          role="radiogroup"
          aria-label="Tema"
        >
          {THEME_OPTIONS.map((opt) => {
            const active = themeMode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setThemeMode(opt.value)}
                className={`flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-center transition ${
                  active
                    ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] text-[var(--color-text)] shadow-[0_8px_20px_-12px_color-mix(in_srgb,var(--color-accent)_55%,transparent)]"
                    : "border-[var(--color-border)] bg-[var(--color-bg-elevated)]/40 text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-text)]"
                }`}
              >
                <ThemeIcon mode={opt.value} className="h-5 w-5" />
                <span className="text-xs font-bold">{opt.label}</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  {opt.hint}
                </span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Comunidade"
        description="Cidade e WhatsApp ficam em Trocas."
      >
        <button
          type="button"
          onClick={() => navigate("/trades")}
          className="ui-tool-btn min-h-11 w-full justify-between gap-2"
        >
          <span>Abrir Trocas → Comunidade</span>
          <span aria-hidden className="text-[var(--color-accent)]">
            →
          </span>
        </button>
      </SectionCard>

      <SectionCard title="Conta">
        <div className="space-y-3">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 px-3 py-3">
            <p className="text-[11px] font-semibold tracking-wide text-[var(--color-text-muted)] uppercase">
              E-mail
            </p>
            <p className="mt-1 break-all text-sm text-[var(--color-text)]">
              {email}
            </p>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setLogoutOpen(true)}
            className="min-h-11 w-full rounded-xl border border-[var(--color-error)] px-4 text-sm font-bold text-[var(--color-error)] transition hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] disabled:opacity-50"
          >
            Sair da conta
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Sobre">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-text-muted)]">Versão</dt>
            <dd className="font-[family-name:var(--font-mono)] text-[var(--color-text)]">
              1.0.0
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-text-muted)]">Dados</dt>
            <dd className="text-right text-[var(--color-text-secondary)]">
              TCGdex (pt)
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-text-muted)]">Série</dt>
            <dd className="text-right text-[var(--color-text-secondary)]">
              Megaevolução
            </dd>
          </div>
        </dl>
        <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
          Coleção salva neste navegador e sincronizada com a nuvem após o login.
        </p>
      </SectionCard>

      <ConfirmDialog
        open={logoutOpen}
        title="Sair da conta?"
        message="Você precisará entrar de novo neste navegador. A coleção local permanece até limpar os dados do site."
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        danger
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => void handleLogout()}
      />
    </div>
  );
}
