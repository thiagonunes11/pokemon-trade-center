import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { CollectionSync } from "./features/collection";
import { TradeSync } from "./features/trades";
import { queryClient } from "./lib/queryClient";
import {
  restoreQueryCache,
  setupQueryCachePersistence,
} from "./lib/queryPersister";
import { initAuthListener } from "./store/useAuthStore";
import { ThemeProvider } from "./theme";
import { BrandMark } from "./components/BrandMark";
import "./index.css";

function Root() {
  const [bootReady, setBootReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const stopAuth = initAuthListener();
    const stopPersist = setupQueryCachePersistence(queryClient);

    void restoreQueryCache(queryClient).finally(() => {
      if (!cancelled) setBootReady(true);
    });

    return () => {
      cancelled = true;
      stopAuth();
      stopPersist();
    };
  }, []);

  if (!bootReady) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[var(--color-accent)] opacity-20 blur-xl" />
            <BrandMark className="relative h-14 w-14 animate-[uiPulseSoft_1.4s_ease-in-out_infinite]" label="" />
          </div>
          <div className="text-center">
            <p className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--color-text)]">
              Preparando seu binder
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">Carregando coleção…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CollectionSync />
        <TradeSync />
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <Root />
      </MotionConfig>
    </ThemeProvider>
  </StrictMode>,
);
