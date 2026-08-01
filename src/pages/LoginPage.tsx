import { getAuthErrorMessage } from "@/features/auth";
import { isFirebaseConfigured } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";

type AuthMode = "login" | "register" | "forgot";

export function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
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
  }, [mode]);

  if (isAuthReady && userId) {
    return <Navigate to="/catalog" replace />;
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

  const subtitle =
    mode === "login"
      ? "Entre com seu e-mail e senha"
      : mode === "register"
        ? "Crie sua conta com e-mail e senha"
        : "Informe o e-mail para receber o link de redefinição";

  const submitLabel =
    mode === "login"
      ? "Entrar"
      : mode === "register"
        ? "Criar conta"
        : "Enviar link";

  return (
    <div className="flex min-h-full items-center justify-center bg-[var(--color-bg)] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-sm sm:p-8">
        <h1 className="text-center text-2xl font-bold text-[var(--color-text)]">
          Pokemon Trade Center
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--color-text-secondary)]">
          {subtitle}
        </p>

        {!firebaseReady && (
          <p className="mt-4 rounded-lg bg-[var(--color-bg-elevated)] px-3 py-2 text-sm text-[var(--color-error)]">
            Firebase não configurado. Copie .env.example → .env e preencha
            VITE_FIREBASE_*.
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          {mode === "register" && (
            <label className="block space-y-1.5">
              <span className="text-sm text-[var(--color-text-secondary)]">
                Nome
              </span>
              <input
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="nickname"
              />
            </label>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm text-[var(--color-text-secondary)]">
              E-mail
            </span>
            <input
              type="email"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          {mode !== "forgot" && (
            <label className="block space-y-1.5">
              <span className="text-sm text-[var(--color-text-secondary)]">
                Senha
              </span>
              <input
                type="password"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
              />
            </label>
          )}

          {error && (
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          )}
          {success && (
            <p className="text-sm text-[var(--color-success)]">{success}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2.5 font-semibold text-white transition hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
          >
            {isLoading ? "Aguarde…" : submitLabel}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-2 text-center text-sm">
          {mode !== "login" && (
            <button
              type="button"
              className="text-[var(--color-accent)] hover:underline"
              onClick={() => setMode("login")}
            >
              Já tenho conta
            </button>
          )}
          {mode !== "register" && (
            <button
              type="button"
              className="text-[var(--color-accent)] hover:underline"
              onClick={() => setMode("register")}
            >
              Criar conta
            </button>
          )}
          {mode !== "forgot" && (
            <button
              type="button"
              className="text-[var(--color-text-muted)] hover:underline"
              onClick={() => setMode("forgot")}
            >
              Esqueci a senha
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
