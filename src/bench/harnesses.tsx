import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  RiveView,
  useRive,
  useRiveFile,
  useViewModelInstance,
  Fit as NitroFit,
  RiveFileFactory,
  type RiveFile,
  type ViewModelInstance,
} from '@rive-app/react-native';
import LegacyRive, { AutoBind, Fit as LegacyFit, type RiveRef } from 'rive-react-native';

import { mallocInUseMB, memoryFootprintMB } from '../../modules/perf-memory';
import { ASSETS } from '../rive/assets';
import { RiveGrid } from '../rive/RiveAdapters';
import { gcCount, jsHeapMb } from './gcWatcher';
import { perfNow } from './stats';
import type { BenchMetric, HarnessProps } from './types';

// Tuning. Memory needs a generous settle so the file finishes parsing + GPU upload
// before we sample; the mount/timing harnesses are bounded by their own ready callbacks.
const MEM_SETTLE_MS = 2500;
const FREE_POLL_MS = 250;
const FREE_TIMEOUT_MS = 15000; // long enough to capture the @10s residual
const HEAP_THRESHOLD_MB = 3; // malloc "back to baseline" tolerance
const FOOT_THRESHOLD_MB = 15; // phys_footprint is laggy & GPU-heavy → wider tolerance

const heapMb = () => Math.max(0, mallocInUseMB());
const footprintMb = () => Math.max(0, memoryFootprintMB());

// ── 1. Mount latency · 24 views (2.9 MB jellyfish) ──────────────────────────
const MOUNT_N = 24;

function NitroTimedCell({ file, onReady }: { file: RiveFile; onReady: () => void }) {
  const { riveViewRef, setHybridRef } = useRive();
  const reported = useRef(false);
  useEffect(() => {
    if (riveViewRef && !reported.current) {
      reported.current = true;
      onReady();
    }
  }, [riveViewRef, onReady]);
  return <RiveView file={file} hybridRef={setHybridRef} autoPlay fit={NitroFit.Contain} style={styles.fill} />;
}

function LegacyTimedCell({ source, onReady }: { source: number; onReady: () => void }) {
  const reported = useRef(false);
  return (
    <LegacyRive
      source={source}
      autoplay
      fit={LegacyFit.Contain}
      style={styles.fill}
      onPlay={() => {
        if (!reported.current) {
          reported.current = true;
          onReady();
        }
      }}
    />
  );
}

function MountLatencyHarness({ backend, onDone }: HarnessProps) {
  const asset = ASSETS.jellyfish;
  // Nitro shares one preloaded file across views; legacy parses per view.
  const { riveFile, isLoading } = useRiveFile(backend === 'nitro' ? asset.source : undefined);
  const [mounted, setMounted] = useState(0);
  const t0 = useRef(0);
  const firstMs = useRef(0);
  const ready = useRef(0);
  const started = useRef(false);
  const done = useRef(false);

  const nitroReady = backend === 'legacy' || (!!riveFile && !isLoading);

  useEffect(() => {
    if (!nitroReady || started.current) return;
    started.current = true;
    requestAnimationFrame(() => {
      t0.current = perfNow();
      setMounted(MOUNT_N);
    });
  }, [nitroReady]);

  const onCellReady = () => {
    ready.current += 1;
    const now = perfNow();
    if (ready.current === 1) firstMs.current = now - t0.current;
    if (ready.current === MOUNT_N && !done.current) {
      done.current = true;
      const metrics: BenchMetric[] = [
        { key: 'first', label: 'First view visible', value: firstMs.current, unit: 'ms' },
        { key: 'all', label: 'All 24 views visible', value: now - t0.current, unit: 'ms' },
      ];
      onDone(metrics);
    }
  };

  const columns = 4;
  return (
    <View style={[styles.grid, { margin: -3 }]}>
      {Array.from({ length: mounted }).map((_, i) => (
        <View key={i} style={{ width: `${100 / columns}%`, aspectRatio: 1, padding: 3 }}>
          {backend === 'nitro' && riveFile ? (
            <NitroTimedCell file={riveFile} onReady={onCellReady} />
          ) : (
            <LegacyTimedCell source={asset.source} onReady={onCellReady} />
          )}
        </View>
      ))}
    </View>
  );
}

// ── 2. Heap added · 6× heavy file ───────────────────────────────────────────
const HEAVY_N = 6;

function HeapAddedHarness({ backend, onDone }: HarnessProps) {
  const [phase, setPhase] = useState<'baseline' | 'mounted'>('baseline');
  const base = useRef({ heap: 0, foot: 0 });
  const done = useRef(false);

  useEffect(() => {
    if (phase !== 'baseline') return;
    const id = setTimeout(() => {
      base.current = { heap: heapMb(), foot: footprintMb() };
      setPhase('mounted');
    }, 600);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'mounted') return;
    const id = setTimeout(() => {
      if (done.current) return;
      done.current = true;
      onDone([
        { key: 'heapAdded', label: 'Heap added', value: heapMb() - base.current.heap, unit: 'MB' },
        { key: 'footAdded', label: 'Footprint added', value: footprintMb() - base.current.foot, unit: 'MB' },
      ]);
    }, MEM_SETTLE_MS);
    return () => clearTimeout(id);
  }, [phase, onDone]);

  if (phase !== 'mounted') return <View style={styles.fill} />;
  return <RiveGrid backend={backend} asset={ASSETS.jellyfish} count={HEAVY_N} columns={3} />;
}

// ── 3. Memory freed on unmount ──────────────────────────────────────────────
// Tracks BOTH metrics through unmount: malloc heap (drops on free()) and
// phys_footprint (where Rive's GPU/texture memory lives — the metric that matters
// for the eager-release story). Also samples Hermes GC count so we can tell whether
// the native free is driven by a collection (Nitro's NativeState-destructor fallback)
// or happens deterministically via dispose().
function MemoryFreedHarness({ backend, onDone }: HarnessProps) {
  const [phase, setPhase] = useState<'baseline' | 'mounted' | 'freeing'>('baseline');
  const baseHeap = useRef(0);
  const baseFoot = useRef(0);
  const gcAtUnmount = useRef(0);
  const freeStart = useRef(0);
  const heapToBase = useRef(-1);
  const footToBase = useRef(-1);
  const footRes = useRef<Record<number, number>>({});
  const done = useRef(false);

  useEffect(() => {
    if (phase !== 'baseline') return;
    const id = setTimeout(() => {
      baseHeap.current = heapMb();
      baseFoot.current = footprintMb();
      console.log(`[mem-freed] ${backend} baseline heap=${baseHeap.current.toFixed(1)} foot=${baseFoot.current.toFixed(1)} gc=${gcCount()}`);
      setPhase('mounted');
    }, 600);
    return () => clearTimeout(id);
  }, [phase, backend]);

  useEffect(() => {
    if (phase !== 'mounted') return;
    const id = setTimeout(() => {
      console.log(`[mem-freed] ${backend} mounted/peak heap=${heapMb().toFixed(1)} foot=${footprintMb().toFixed(1)} gc=${gcCount()} → unmounting`);
      gcAtUnmount.current = gcCount();
      setPhase('freeing');
    }, MEM_SETTLE_MS);
    return () => clearTimeout(id);
  }, [phase, backend]);

  useEffect(() => {
    if (phase !== 'freeing') return;
    freeStart.current = perfNow();
    const id = setInterval(() => {
      const elapsed = perfNow() - freeStart.current;
      const h = heapMb();
      const f = footprintMb();
      for (const t of [1000, 5000, 10000]) {
        if (footRes.current[t] === undefined && elapsed >= t) {
          footRes.current[t] = f - baseFoot.current;
          console.log(`[mem-freed] ${backend} +${t / 1000}s heap=${h.toFixed(1)} foot=${f.toFixed(1)} (Δfoot=${(f - baseFoot.current).toFixed(1)}) gc=${gcCount()}`);
        }
      }
      if (heapToBase.current < 0 && h <= baseHeap.current + HEAP_THRESHOLD_MB) heapToBase.current = elapsed;
      if (footToBase.current < 0 && f <= baseFoot.current + FOOT_THRESHOLD_MB) footToBase.current = elapsed;

      const settled = footToBase.current >= 0 && elapsed >= 10000;
      if ((settled || elapsed >= FREE_TIMEOUT_MS) && !done.current) {
        done.current = true;
        clearInterval(id);
        const gcDuringFree = gcCount() - gcAtUnmount.current;
        console.log(`[mem-freed] ${backend} done footToBase=${footToBase.current} heapToBase=${heapToBase.current} gcDuringFree=${gcDuringFree} jsHeap=${jsHeapMb().toFixed(1)}`);
        onDone([
          { key: 'footToBaseline', label: 'Footprint → baseline', value: footToBase.current < 0 ? FREE_TIMEOUT_MS : footToBase.current, unit: 'ms' },
          { key: 'footRes1s', label: 'Footprint residual @1s', value: footRes.current[1000] ?? 0, unit: 'MB' },
          { key: 'footRes5s', label: 'Footprint residual @5s', value: footRes.current[5000] ?? 0, unit: 'MB' },
          { key: 'footRes10s', label: 'Footprint residual @10s', value: footRes.current[10000] ?? 0, unit: 'MB' },
          { key: 'heapToBaseline', label: 'Heap → baseline', value: heapToBase.current < 0 ? FREE_TIMEOUT_MS : heapToBase.current, unit: 'ms' },
          { key: 'gcDuringFree', label: 'Hermes GCs during free', value: gcDuringFree, unit: '' },
        ]);
      }
    }, FREE_POLL_MS);
    return () => clearInterval(id);
  }, [phase, backend, onDone]);

  if (phase !== 'mounted') return <View style={styles.fill} />;
  return <RiveGrid backend={backend} asset={ASSETS.jellyfish} count={HEAVY_N} columns={3} />;
}

// ── 4. Data-bound property write ────────────────────────────────────────────
const PROP_ASSET = ASSETS.quick_start;
const PROP = 'health';
const PROP_WRITES = 2000;

function PropertyWriteHarness({ backend, onDone }: HarnessProps) {
  const { riveFile } = useRiveFile(backend === 'nitro' ? PROP_ASSET.source : undefined);
  const instanceRef = useRef<ViewModelInstance | null>(null);
  const { instance } = useViewModelInstance(backend === 'nitro' ? riveFile : null, {
    onInit: (vmi) => (instanceRef.current = vmi),
  });
  if (instance) instanceRef.current = instance;
  const legacyRef = useRef<RiveRef>(null);
  const done = useRef(false);

  const report = (dt: number) => {
    if (done.current) return;
    done.current = true;
    onDone([
      { key: 'ns', label: 'Per write', value: (dt * 1e6) / PROP_WRITES, unit: 'ns' },
      { key: 'perSec', label: 'Throughput', value: PROP_WRITES / (dt / 1000), unit: '/s' },
    ]);
  };

  const runLegacy = () => {
    const ref = legacyRef.current;
    if (!ref) return;
    const t0 = perfNow();
    for (let i = 0; i < PROP_WRITES; i++) ref.setNumber(PROP, i % 100); // async bridge enqueue
    const dt = perfNow() - t0;
    // Let the enqueued bridge commands drain against the still-mounted view before
    // onDone tears it down — otherwise they target a dead view tag ("view with tag" error).
    setTimeout(() => report(dt), 600);
  };

  useEffect(() => {
    if (backend !== 'nitro') return;
    if (!riveFile || !instanceRef.current) return;
    const id = setTimeout(() => {
      const prop = instanceRef.current?.numberProperty(PROP);
      if (!prop) return;
      const t0 = perfNow();
      for (let i = 0; i < PROP_WRITES; i++) prop.set(i % 100); // synchronous JSI write
      const dt = perfNow() - t0;
      if (done.current) return;
      done.current = true;
      onDone([
        { key: 'ns', label: 'Per write', value: (dt * 1e6) / PROP_WRITES, unit: 'ns' },
        { key: 'perSec', label: 'Throughput', value: PROP_WRITES / (dt / 1000), unit: '/s' },
      ]);
    }, 300);
    return () => clearTimeout(id);
  }, [riveFile, instance, backend, onDone]);

  if (backend === 'nitro') {
    return riveFile && instanceRef.current ? (
      <RiveView file={riveFile} dataBind={instanceRef.current} autoPlay fit={NitroFit.Contain} style={styles.fill} />
    ) : (
      <View style={styles.fill} />
    );
  }
  return (
    <LegacyRive
      ref={legacyRef}
      source={PROP_ASSET.source}
      dataBinding={AutoBind(true)}
      autoplay
      fit={LegacyFit.Contain}
      style={styles.fill}
      onPlay={() => {
        // First frame → binding is live; defer one tick so the queue is settled.
        setTimeout(runLegacy, 300);
      }}
    />
  );
}

// ── 5. File load / dispose ──────────────────────────────────────────────────
const LOAD_RUNS = 10;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function LoadDisposeHarness({ backend, onDone }: HarnessProps) {
  const asset = ASSETS.counter;
  const [legacyIndex, setLegacyIndex] = useState<number | null>(null);
  const legacyIdx = useRef(0);
  const legacyStart = useRef(0);
  const legacyResults = useRef<number[]>([]);
  const done = useRef(false);

  useEffect(() => {
    if (backend !== 'nitro' || done.current) return;
    let cancelled = false;
    (async () => {
      const loads: number[] = [];
      const disposes: number[] = [];
      for (let i = 0; i < LOAD_RUNS; i++) {
        const t0 = perfNow();
        const file = await RiveFileFactory.fromSource(asset.source, undefined);
        loads.push(perfNow() - t0);
        const t1 = perfNow();
        (file as any).dispose?.();
        disposes.push(perfNow() - t1);
        await new Promise((r) => setTimeout(r, 0));
      }
      if (cancelled || done.current) return;
      done.current = true;
      onDone([
        { key: 'load', label: 'Load', value: avg(loads), unit: 'ms' },
        { key: 'dispose', label: 'Dispose', value: avg(disposes), unit: 'ms' },
      ]);
    })();
    return () => {
      cancelled = true;
    };
  }, [backend, onDone, asset.source]);

  useEffect(() => {
    if (backend !== 'legacy') return;
    legacyResults.current = [];
    legacyIdx.current = 0;
    legacyStart.current = perfNow();
    setLegacyIndex(0);
  }, [backend]);

  const onLegacyLoaded = () => {
    legacyResults.current = [...legacyResults.current, perfNow() - legacyStart.current];
    const next = legacyIdx.current + 1;
    legacyIdx.current = next;
    if (next >= LOAD_RUNS) {
      setLegacyIndex(null);
      if (!done.current) {
        done.current = true;
        // Defer so onDone (parent setState) never runs during this render, and the
        // unmounted legacy view's queued native commands drain first.
        // Legacy has no file API; mount → first frame is the closest proxy.
        setTimeout(
          () => onDone([{ key: 'load', label: 'Load (mount→frame)', value: avg(legacyResults.current), unit: 'ms' }]),
          400
        );
      }
      return;
    }
    legacyStart.current = perfNow();
    setLegacyIndex(next);
  };

  if (backend !== 'legacy' || legacyIndex === null) return <View style={styles.fill} />;
  return (
    <View style={styles.offscreen} pointerEvents="none">
      <LegacyRive key={legacyIndex} source={asset.source} autoplay onPlay={onLegacyLoaded} style={StyleSheet.absoluteFill} />
    </View>
  );
}

export type HarnessSpec = {
  scenario: string;
  title: string;
  params: Record<string, string | number>;
  Component: (props: HarnessProps) => React.ReactNode;
};

export const HARNESSES: HarnessSpec[] = [
  {
    scenario: 'mount-latency-24',
    title: 'Show graphics on 24 views (2.9 MB)',
    params: { asset: 'jellyfish', views: MOUNT_N },
    Component: MountLatencyHarness,
  },
  {
    scenario: 'heap-added-6x',
    title: 'Heap added · 6× heavy file',
    params: { asset: 'jellyfish', views: HEAVY_N },
    Component: HeapAddedHarness,
  },
  {
    scenario: 'memory-freed',
    title: 'Memory freed on unmount',
    params: { asset: 'jellyfish', views: HEAVY_N },
    Component: MemoryFreedHarness,
  },
  {
    scenario: 'property-write',
    title: 'Data-bound property write',
    params: { asset: PROP_ASSET.id, prop: PROP, writes: PROP_WRITES },
    Component: PropertyWriteHarness,
  },
  {
    scenario: 'load-dispose',
    title: 'File load / dispose',
    params: { asset: 'counter', runs: LOAD_RUNS },
    Component: LoadDisposeHarness,
  },
];

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  offscreen: { width: 1, height: 1, position: 'absolute', left: -10, bottom: 0, opacity: 0.01 },
});
