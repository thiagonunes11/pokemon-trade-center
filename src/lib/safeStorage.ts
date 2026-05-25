import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory storage fallback when everything else fails or is unlinked
class MemoryStorage {
  private data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }
}

const memoryStorage = new MemoryStorage();

// Detect web environment
const isWeb = typeof window !== 'undefined' && !!window.localStorage;

/**
 * Invólucro de armazenamento robusto que previne travamentos e erros de inicialização.
 * Se o módulo nativo do AsyncStorage for nulo (ex: falta rodar 'npm run android' para compilar dependências),
 * ele faz fallback gracioso para o localStorage do navegador (se na Web) ou armazenamento em memória volátil.
 */
export const safeStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      // 1. Tentar usar AsyncStorage
      return await AsyncStorage.getItem(key);
    } catch (error: any) {
      console.warn('[SafeStorage] AsyncStorage indisponível, usando fallback:', error.message);
      
      // 2. Fallback para localStorage se estiver na Web
      if (isWeb) {
        try {
          return window.localStorage.getItem(key);
        } catch (webError) {
          // Ignora
        }
      }
      
      // 3. Fallback para memória
      return memoryStorage.getItem(key);
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      // 1. Tentar usar AsyncStorage
      await AsyncStorage.setItem(key, value);
    } catch (error: any) {
      console.warn('[SafeStorage] Erro ao gravar no AsyncStorage, usando fallback:', error.message);
      
      // 2. Fallback para localStorage se estiver na Web
      if (isWeb) {
        try {
          window.localStorage.setItem(key, value);
          return;
        } catch (webError) {
          // Ignora
        }
      }
      
      // 3. Fallback para memória
      memoryStorage.setItem(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      // 1. Tentar usar AsyncStorage
      await AsyncStorage.removeItem(key);
    } catch (error: any) {
      console.warn('[SafeStorage] Erro ao remover do AsyncStorage, usando fallback:', error.message);
      
      // 2. Fallback para localStorage se estiver na Web
      if (isWeb) {
        try {
          window.localStorage.removeItem(key);
          return;
        } catch (webError) {
          // Ignora
        }
      }
      
      // 3. Fallback para memória
      memoryStorage.removeItem(key);
    }
  }
};
