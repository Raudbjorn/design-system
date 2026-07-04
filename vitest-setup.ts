import '@testing-library/jest-dom/vitest';

// Node ships a localStorage global that is nonfunctional without
// --localstorage-file, and it shadows jsdom's real Storage in the test
// environment (window === globalThis under vitest's jsdom pool). Replace it
// with a spec-shaped in-memory implementation so storage-dependent paths
// (theme mode persistence, world-theme boot cache) are actually exercised.
class MemoryStorage implements Storage {
  #data = new Map<string, string>();
  get length(): number {
    return this.#data.size;
  }
  clear(): void {
    this.#data.clear();
  }
  getItem(key: string): string | null {
    return this.#data.get(String(key)) ?? null;
  }
  key(index: number): string | null {
    return [...this.#data.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.#data.delete(String(key));
  }
  setItem(key: string, value: string): void {
    this.#data.set(String(key), String(value));
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: new MemoryStorage()
});
