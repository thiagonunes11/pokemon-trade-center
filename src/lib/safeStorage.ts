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
}

const memoryStorage = new MemoryStorage();

function getLocalStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // private mode / blocked
  }
  return null;
}

/** Persistência web com fallback em memória. */
export const safeStorage = {
  async getItem(key: string): Promise<string | null> {
    const ls = getLocalStorage();
    if (ls) {
      try {
        return ls.getItem(key);
      } catch {
        // fall through
      }
    }
    return memoryStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    const ls = getLocalStorage();
    if (ls) {
      try {
        ls.setItem(key, value);
        return;
      } catch {
        // fall through
      }
    }
    memoryStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    const ls = getLocalStorage();
    if (ls) {
      try {
        ls.removeItem(key);
        return;
      } catch {
        // fall through
      }
    }
    memoryStorage.removeItem(key);
  },
};
