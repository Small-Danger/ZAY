const store = new Map<string, unknown>();

export function memoryGet<T>(key: string): T | undefined {
  if (!store.has(key)) return undefined;
  return store.get(key) as T;
}

export function memorySet<T>(key: string, value: T): void {
  store.set(key, value);
}

export function memoryInvalidate(prefix: string): void {
  for (const key of [...store.keys()]) {
    if (key === prefix || key.startsWith(`${prefix}:`) || key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}
