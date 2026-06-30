// Hermes GC instrumentation. `HermesInternal.getInstrumentedStats()` exposes a
// running `js_numGCs` counter (plus heap sizes) — Hermes has no GC callback, so
// polling this counter is how we detect that a collection happened and correlate
// it with unmount / native memory release.

type HermesStats = Record<string, number | undefined>;

const getStats = (): HermesStats => {
  const hi = (global as any).HermesInternal;
  return hi?.getInstrumentedStats?.() ?? {};
};

/** Total Hermes collections since process start (-1 if instrumentation unavailable). */
export const gcCount = (): number => {
  const v = getStats().js_numGCs;
  return typeof v === 'number' ? v : -1;
};

/** Current Hermes JS heap size, MiB (0 if unavailable). */
export const jsHeapMb = (): number => {
  const v = getStats().js_heapSize;
  return typeof v === 'number' ? v / 1048576 : 0;
};

/** Cumulative GC CPU time in seconds (0 if unavailable). */
export const gcCpuSec = (): number => {
  const v = getStats().js_gcCPUTime;
  return typeof v === 'number' ? v : 0;
};
