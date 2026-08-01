import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { CollectionSync } from "./features/collection";
import { queryClient } from "./lib/queryClient";
import {
  restoreQueryCache,
  setupQueryCachePersistence,
} from "./lib/queryPersister";
import { initAuthListener } from "./store/useAuthStore";
import { ThemeProvider } from "./theme";
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
        <p className="text-[var(--color-text-secondary)]">Carregando…</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CollectionSync />
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  </StrictMode>,
);
