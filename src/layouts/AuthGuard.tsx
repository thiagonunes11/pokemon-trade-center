import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";

export function AuthGuard() {
  const userId = useAuthStore((s) => s.userId);
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  const location = useLocation();

  if (!isAuthReady) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[var(--color-bg)]">
        <p className="text-[var(--color-text-secondary)]">Carregando…</p>
      </div>
    );
  }

  if (!userId) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
