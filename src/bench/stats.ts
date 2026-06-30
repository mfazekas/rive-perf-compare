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

/** Sample mean and standard deviation (Bessel-corrected; sd is 0 for n ≤ 1). */
export function meanStddev(values: number[]): { mean: number; sd: number; n: number } {
  const n = values.length;
  if (!n) return { mean: 0, sd: 0, n: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = n > 1 ? values.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1) : 0;
  return { mean, sd: Math.sqrt(variance), n };
}
