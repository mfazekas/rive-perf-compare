export type Stats = { n: number; min: number; max: number; median: number; p95: number; mean: number };

export const perfNow = (): number => (global as any).performance?.now?.() ?? Date.now();
export const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function summarize(lats: number[]): Stats | null {
  if (!lats.length) return null;
  const s = [...lats].sort((a, b) => a - b);
  const q = (p: number) => s[Math.min(s.length - 1, Math.round(p * (s.length - 1)))];
  const mean = s.reduce((a, b) => a + b, 0) / s.length;
  return { n: s.length, min: s[0], max: s[s.length - 1], median: q(0.5), p95: q(0.95), mean };
}
