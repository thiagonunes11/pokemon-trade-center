/**
 * Storage Polyfill for React Native
 * Provides localStorage and sessionStorage APIs for React Native/Expo environments
 */

class StoragePolyfill implements Storage {
  private data: Map<string, string> = new Map();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.data.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

// Initialize polyfills if not available
if (typeof window === "undefined") {
  // In React Native environment, window is undefined
  // Create a mock window object with storage
  (globalThis as any).window = {
    localStorage: new StoragePolyfill(),
    sessionStorage: new StoragePolyfill(),
  };
} else {
  // In browser environment, use real localStorage/sessionStorage
  if (!window.localStorage) {
    (window as any).localStorage = new StoragePolyfill();
  }
  if (!window.sessionStorage) {
    (window as any).sessionStorage = new StoragePolyfill();
  }
}

export default StoragePolyfill;
