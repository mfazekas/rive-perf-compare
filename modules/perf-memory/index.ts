import PerfMemory from './src/PerfMemoryModule';

/** Physical memory footprint of the app process, in bytes. Returns -1 if unavailable. */
export function memoryFootprint(): number {
  return PerfMemory.memoryFootprint();
}

/** Physical memory footprint in mebibytes (MiB). Returns -1 if unavailable. */
export function memoryFootprintMB(): number {
  const bytes = memoryFootprint();
  return bytes < 0 ? -1 : bytes / (1024 * 1024);
}

/**
 * Live heap currently allocated by malloc, in bytes. Drops immediately on
 * free() — the metric that reveals deterministic (eager) release, unlike
 * footprint. Excludes GPU/Metal memory (allocated outside malloc).
 */
export function mallocInUse(): number {
  return PerfMemory.mallocInUse();
}

/** Live malloc heap in mebibytes (MiB). Returns -1 if unavailable. */
export function mallocInUseMB(): number {
  const bytes = mallocInUse();
  return bytes < 0 ? -1 : bytes / (1024 * 1024);
}
