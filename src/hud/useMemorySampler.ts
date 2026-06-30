import { useCallback, useEffect, useRef, useState } from 'react';

import { mallocInUseMB, memoryFootprintMB } from '../../modules/perf-memory';

const HISTORY_LEN = 60;

export type MemorySample = {
  /** Current physical footprint, MiB (does NOT shrink on free). */
  mb: number;
  /** Live malloc heap, MiB (DROPS on free — reveals eager release). */
  heapMb: number;
  /** Peak footprint observed since last reset, MiB. */
  peakMb: number;
  /** Peak live heap observed since last reset, MiB. */
  peakHeapMb: number;
  /** Baseline footprint captured via setBaseline(), MiB (0 until set). */
  baselineMb: number;
  /** Baseline live heap captured via setBaseline(), MiB (0 until set). */
  baselineHeapMb: number;
  /** Recent live-heap history (oldest → newest), MiB. */
  history: number[];
  /** Capture current values as the baseline and reset peaks. */
  setBaseline: () => void;
};

export function useMemorySampler(intervalMs = 500): MemorySample {
  const [mb, setMb] = useState(0);
  const [heapMb, setHeapMb] = useState(0);
  const [peakMb, setPeakMb] = useState(0);
  const [peakHeapMb, setPeakHeapMb] = useState(0);
  const [baselineMb, setBaselineMb] = useState(0);
  const [baselineHeapMb, setBaselineHeapMb] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const peakRef = useRef(0);
  const peakHeapRef = useRef(0);

  useEffect(() => {
    const tick = () => {
      const footprint = memoryFootprintMB();
      const heap = mallocInUseMB();
      if (footprint >= 0) {
        setMb(footprint);
        if (footprint > peakRef.current) {
          peakRef.current = footprint;
          setPeakMb(footprint);
        }
      }
      if (heap >= 0) {
        setHeapMb(heap);
        if (heap > peakHeapRef.current) {
          peakHeapRef.current = heap;
          setPeakHeapMb(heap);
        }
        setHistory((h) => {
          const next = h.length >= HISTORY_LEN ? h.slice(1) : h.slice();
          next.push(heap);
          return next;
        });
      }
    };
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  const setBaseline = useCallback(() => {
    const footprint = memoryFootprintMB();
    const heap = mallocInUseMB();
    const f = footprint < 0 ? 0 : footprint;
    const h = heap < 0 ? 0 : heap;
    setBaselineMb(f);
    setBaselineHeapMb(h);
    peakRef.current = f;
    peakHeapRef.current = h;
    setPeakMb(f);
    setPeakHeapMb(h);
  }, []);

  return {
    mb,
    heapMb,
    peakMb,
    peakHeapMb,
    baselineMb,
    baselineHeapMb,
    history,
    setBaseline,
  };
}
