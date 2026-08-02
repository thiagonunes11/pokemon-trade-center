import { getAuthErrorMessage } from "@/features/auth";
import { BrandMark } from "@/components/BrandMark";
import { SegmentTabs } from "@/components/SegmentTabs";
import { isFirebaseConfigured } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";

type AuthMode = "login" | "register" | "forgot";

/**
 * Layout inspirado em:
 * - 21st.dev Sign In Split Screen
 * - 21st.dev Premium Auth (glass + tabs)
 * - 21st.dev Login Form (fundo atmosférico)
 * Adaptado ao tema Pokémon Trade Center.
 */

function IconEye({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-3.3 4.4" />
      <path d="M6.1 6.1A17.4 17.4 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 4.2-.9" />
    </svg>
  );
}

export function LoginPage() {
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? "/catalog";

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const isLoading = useAuthStore((s) => s.isLoading);
  const userId = useAuthStore((s) => s.userId);
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  const firebaseReady = isFirebaseConfigured();

  useEffect(() => {
    setError(null);
    setSuccess(null);
    setShowPassword(false);
  }, [mode]);

  if (isAuthReady && userId) {
    return <Navigate to={from.startsWith("/") ? from : "/catalog"} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!firebaseReady) {
      setError(
        "Firebase não configurado. Preencha o .env conforme .env.example.",
      );
      return;
    }

    const trimmedEmail = email.trim();

    if (mode === "forgot") {
      if (!trimmedEmail) {
        setError("Informe o e-mail da sua conta.");
        return;
      }
      try {
        await resetPassword(trimmedEmail);
        setSuccess(
          "Enviamos um link de recuperação para o seu e-mail. Verifique a caixa de entrada e o spam.",
        );
      } catch (err) {
        setError(getAuthErrorMessage(err));
      }
      return;
    }

    if (!trimmedEmail || !password) {
      setError("Informe e-mail e senha.");
      return;
    }

    if (mode === "register" && !displayName.trim()) {
      setError("Informe um nome para exibir no app.");
      return;
    }

    try {
      if (mode === "register") {
        await register(trimmedEmail, password, displayName.trim());
      } else {
        await login(trimmedEmail, password);
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  const title =
    mode === "login"
      ? "Bem-vindo de volta"
      : mode === "register"
        ? "Crie sua conta"
        : "Recuperar senha";

  const subtitle =
    mode === "login"
      ? "Entre para montar sua vitrine e trocar cartas."
      : mode === "register"
        ? "Comece sua coleção Megaevolução em minutos."
        : "Enviaremos um link de redefinição para o seu e-mail.";

  const submitLabel =
    mode === "login"
      ? "Entrar"
      : mode === "register"
        ? "Criar conta"
        : "Enviar link";

  return (
    <div className="relative flex min-h-full overflow-hidden bg-[var(--color-bg)]">
      {/* Fundo atmosférico (Login Form / Premium Auth) */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute -top-24 -left-20 h-72 w-72 rounded-full blur-3xl"
          style={{
            background:
              "color-mix(in srgb, var(--color-accent) 28%, transparent)",
          }}
        />
        <div
          className="absolute top-1/3 -right-16 h-80 w-80 rounded-full blur-3xl"
          style={{
            background: "color-mix(in srgb, #3b82f6 18%, transparent)",
          }}
        />
        <div
          className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full blur-3xl"
          style={{
            background: "color-mix(in srgb, #ef4444 12%, transparent)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 items-stretch p-4 sm:p-6 lg:p-8">
        <div className="ui-glass-strong grid w-full overflow-hidden rounded-3xl lg:grid-cols-2">
          {/* Painel de marca — Split Screen */}
          <aside className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,color-mix(in_srgb,var(--color-accent)_22%,#11141c),#0b0d12_55%,#151822)] p-8 text-[var(--color-text)] lg:flex">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--color-accent) 35%, transparent), transparent 40%), radial-gradient(circle at 80% 70%, color-mix(in srgb, #ef4444 20%, transparent), transparent 35%)",
              }}
            />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-wide text-[var(--color-accent)] uppercase backdrop-blur">
                Megaevolução
              </div>
              <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-extrabold leading-tight tracking-tight">
                Pokemon{" "}
                <span className="text-[var(--color-accent)]">Trade</span>{" "}
                Center
              </h1>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Catálogo, coleção, vitrine e trocas — tudo no mesmo lugar para
                os treinadores da série Megaevolução.
              </p>
            </div>

            <div className="relative flex flex-col items-start gap-6">
              <BrandMark className="h-28 w-28 drop-shadow-[0_20px_40px_rgba(238,21,21,0.35)]" />
              <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                  Binder com progresso por expansão
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                  Lista de busca e mural de trocas
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                  Perfil compartilhável com vitrine
                </li>
              </ul>
            </div>
          </aside>

          {/* Formulário */}
          <section className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <BrandMark className="h-10 w-10" />
              <div>
                <p className="font-[family-name:var(--font-display)] text-lg font-extrabold text-[var(--color-text)]">
                  Pokemon{" "}
                  <span className="text-[var(--color-accent)]">Trade</span>{" "}
                  Center
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Vitrine · coleção · trocas
                </p>
              </div>
            </div>

            {mode !== "forgot" ? (
              <SegmentTabs
                layoutId="login-auth-tab"
                aria-label="Modo"
                className="mb-6"
                value={mode === "register" ? "register" : "login"}
                onChange={(next) => setMode(next)}
                options={[
                  { key: "login", label: "Entrar" },
                  { key: "register", label: "Criar conta" },
                ]}
              />
            ) : null}

            <div className="space-y-1">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-[var(--color-text)]">
                {title}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {subtitle}
              </p>
            </div>

            {!firebaseReady && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-[var(--color-error)]/30 bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] px-3 py-2 text-sm text-[var(--color-error)]"
              >
                Firebase não configurado. Copie .env.example → .env e preencha
                VITE_FIREBASE_*.
              </p>
            )}

            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => void handleSubmit(e)}
            >
              {mode === "register" && (
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                    Nome
                  </span>
                  <input
                    className="ui-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoComplete="nickname"
                    placeholder="Como quer ser chamado"
                  />
                </label>
              )}

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                  E-mail
                </span>
                <input
                  type="email"
                  className="ui-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="voce@email.com"
                />
              </label>

              {mode !== "forgot" && (
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                    Senha
                  </span>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="ui-input !pr-11"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={
                        mode === "register" ? "new-password" : "current-password"
                      }
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      aria-label={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute top-1/2 right-1 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text)]"
                    >
                      <IconEye open={showPassword} />
                    </button>
                  </div>
                </label>
              )}

              {mode === "login" ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center text-sm font-medium text-[var(--color-accent)] hover:underline"
                    onClick={() => setMode("forgot")}
                  >
                    Esqueci a senha
                  </button>
                </div>
              ) : null}

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-[var(--color-error)]/25 bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)] px-3 py-2 text-sm text-[var(--color-error)]"
                >
                  {error}
                </p>
              )}
              {success && (
                <p
                  role="status"
                  className="rounded-xl border border-[var(--color-success)]/25 bg-[color-mix(in_srgb,var(--color-success)_8%,transparent)] px-3 py-2 text-sm text-[var(--color-success)]"
                >
                  {success}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="ui-btn-accent min-h-12 w-full px-4 text-base"
              >
                {isLoading ? "Aguarde…" : submitLabel}
              </button>
            </form>

            {mode === "forgot" ? (
              <button
                type="button"
                className="mt-5 text-sm font-medium text-[var(--color-accent)] hover:underline"
                onClick={() => setMode("login")}
              >
                ← Voltar ao login
              </button>
            ) : (
              <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
                Ao continuar, você usa a conta neste dispositivo com sync na
                nuvem.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
