import { safeStorage } from './safeStorage';
import { dehydrate, hydrate, QueryClient } from '@tanstack/react-query';

const CACHE_KEY = 'REACT_QUERY_PERSISTENT_CACHE';
let saveTimeout: any = null;
const DEBOUNCE_MS = 1500;

function getCircularReplacer() {
  const seen = new WeakSet();
  return (key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return undefined;
      }
      seen.add(value);
    }
    return value;
  };
}

/**
 * Salva o estado atual do cache do React Query no AsyncStorage.
 */
export async function saveQueryCache(queryClient: QueryClient): Promise<void> {
  try {
    const dehydratedState = dehydrate(queryClient, {
      shouldDehydrateQuery: (query) => {
        // Apenas persistir queries bem sucedidas e que não tenham erros
        return query.state.status === 'success';
      },
    });
    const serializedState = JSON.stringify(dehydratedState, getCircularReplacer());
    await safeStorage.setItem(CACHE_KEY, serializedState);
  } catch (error) {
    console.error('[QueryPersister] Erro ao salvar o cache:', error);
  }
}

/**
 * Restaura o cache do React Query a partir do AsyncStorage.
 */
export async function restoreQueryCache(queryClient: QueryClient): Promise<boolean> {
  try {
    const serializedState = await safeStorage.getItem(CACHE_KEY);
    if (!serializedState) {
      console.log('[QueryPersister] Nenhum cache anterior encontrado.');
      return false;
    }

    const dehydratedState = JSON.parse(serializedState);
    hydrate(queryClient, dehydratedState);
    console.log('[QueryPersister] Cache restaurado com sucesso.');
    return true;
  } catch (error) {
    console.error('[QueryPersister] Erro ao restaurar o cache:', error);
    return false;
  }
}

/**
 * Configura o salvamento automático do cache sempre que novas queries forem bem sucedidas,
 * com mecanismo de debounce para evitar concorrência de escritas no armazenamento.
 */
export function setupQueryCachePersistence(queryClient: QueryClient): () => void {
  const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
    // Escuta eventos de sucesso de queries para salvar o cache atualizado
    if (event.type === 'updated' && event.action.type === 'success') {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      saveTimeout = setTimeout(() => {
        saveQueryCache(queryClient);
      }, DEBOUNCE_MS);
    }
  });

  return () => {
    unsubscribe();
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
  };
}
