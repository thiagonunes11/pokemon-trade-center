import { dehydrate, hydrate, type QueryClient } from "@tanstack/react-query";
import { safeStorage } from "./safeStorage";

const CACHE_KEY = "REACT_QUERY_PERSISTENT_CACHE";
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 1500;

function getCircularReplacer() {
  const seen = new WeakSet();
  return (_key: string, value: unknown) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return undefined;
      }
      seen.add(value);
    }
    return value;
  };
}

export async function saveQueryCache(queryClient: QueryClient): Promise<void> {
  try {
    const dehydratedState = dehydrate(queryClient, {
      shouldDehydrateQuery: (query) => query.state.status === "success",
    });
    const serializedState = JSON.stringify(
      dehydratedState,
      getCircularReplacer(),
    );
    await safeStorage.setItem(CACHE_KEY, serializedState);
  } catch (error) {
    console.error("[QueryPersister] Erro ao salvar o cache:", error);
  }
}

export async function restoreQueryCache(
  queryClient: QueryClient,
): Promise<boolean> {
  try {
    const serializedState = await safeStorage.getItem(CACHE_KEY);
    if (!serializedState) {
      return false;
    }
    const dehydratedState = JSON.parse(serializedState) as unknown;
    hydrate(queryClient, dehydratedState as Parameters<typeof hydrate>[1]);
    return true;
  } catch (error) {
    console.error("[QueryPersister] Erro ao restaurar o cache:", error);
    return false;
  }
}

export function setupQueryCachePersistence(
  queryClient: QueryClient,
): () => void {
  const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
    if (event.type === "updated" && event.action.type === "success") {
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        void saveQueryCache(queryClient);
      }, DEBOUNCE_MS);
    }
  });

  return () => {
    unsubscribe();
    if (saveTimeout) clearTimeout(saveTimeout);
  };
}
