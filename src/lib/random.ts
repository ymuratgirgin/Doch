// Unbiased partial Fisher–Yates: n distinct random items from `items`.
export function pickRandom<T>(items: T[], n: number): T[] {
  const pool = items.slice();
  const count = Math.min(n, pool.length);
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
