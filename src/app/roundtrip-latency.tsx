import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { findNodeHandle, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  RiveView,
  useRive as useNitroRive,
  useRiveFile,
  useViewModelInstance,
  Fit as NitroFit,
} from '@rive-app/react-native';
import LegacyRive, {
  AutoBind,
  Fit as LegacyFit,
  PropertyType,
  useRive as useLegacyRive,
} from 'rive-react-native';

import { ASSETS } from '../rive/assets';
import { BackendToggle, useBackend } from '../rive/Backend';
import { perfNow, delay, summarize, type Stats } from '../bench/stats';
import { colors, spacing } from '../theme';
import { Button, Card, Caption, Row } from '../ui/widgets';

const STATE_MACHINE = 'State Machine 1';
const ASSET = ASSETS.reactive;

type OutputCb = (value: number) => void;
type Pending = { t0: number; resolve?: (latency: number) => void };

export default function RoundtripLatency() {
  const { backend } = useBackend();
  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={styles.controls}>
        <BackendToggle />
        <Card>
          <Caption>
            Round-trip latency: write the view-model `input`, then time until the `output`
            change is delivered through each backend&apos;s native listener. Nitro uses a JSI
            property listener; legacy uses the bridge event emitter. Both are timed at the raw
            native callback (no React in the timing path). The .riv binds output ≈ input.
          </Caption>
        </Card>
      </View>
      {backend === 'nitro' ? <NitroHarness /> : <LegacyHarness />}
    </SafeAreaView>
  );
}

function NitroHarness() {
  const { riveFile } = useRiveFile(ASSET.source);
  const { instance } = useViewModelInstance(riveFile ?? null);
  const { riveViewRef, setHybridRef } = useNitroRive();

  const inputProp = useMemo(() => (instance ? instance.numberProperty('input') : undefined), [instance]);
  const outputProp = useMemo(() => (instance ? instance.numberProperty('output') : undefined), [instance]);
  useEffect(() => () => {
    (inputProp as any)?.dispose?.();
    (outputProp as any)?.dispose?.();
  }, [inputProp, outputProp]);

  const onOutput = useRef<OutputCb | null>(null);
  useEffect(() => {
    if (!outputProp) return;
    const remove = (outputProp as any).addListener((v: number) => onOutput.current?.(v));
    return () => {
      try {
        remove();
      } catch {
        // property may already be disposed
      }
    };
  }, [outputProp]);

  const write = useCallback(
    (v: number) => {
      if (inputProp) (inputProp as any).value = v;
    },
    [inputProp],
  );
  const nudge = useCallback(() => {
    riveViewRef?.playIfNeeded();
  }, [riveViewRef]);

  return (
    <Runner
      ready={!!instance && !!riveFile}
      backendLabel="nitro · JSI property listener"
      write={write}
      nudge={nudge}
      onOutputRef={onOutput}
      rive={
        riveFile ? (
          <RiveView
            file={riveFile}
            hybridRef={setHybridRef}
            stateMachineName={STATE_MACHINE}
            dataBind={instance ?? undefined}
            autoPlay
            fit={NitroFit.Contain}
            style={styles.rive}
          />
        ) : null
      }
    />
  );
}

function LegacyHarness() {
  const [setRef, riveRef] = useLegacyRive();
  const onOutput = useRef<OutputCb | null>(null);

  useEffect(() => {
    if (!riveRef) return; // non-null only after the native "loaded" event → viewTag valid
    const emitter = riveRef.internalNativeEmitter();
    const tag = findNodeHandle(riveRef.viewTag());
    if (!emitter || !tag) return;
    const cb = (v: unknown) => onOutput.current?.(typeof v === 'number' ? v : Number(v));
    emitter.addListener('output', PropertyType.Number, tag, cb);
    return () => {
      try {
        emitter.removeListener('output', PropertyType.Number, tag, cb);
      } catch {
        // view may already be torn down
      }
    };
  }, [riveRef]);

  const write = useCallback(
    (v: number) => {
      riveRef?.setNumber('input', v);
    },
    [riveRef],
  );
  const nudge = useCallback(() => {
    riveRef?.play(STATE_MACHINE, undefined, undefined, true);
  }, [riveRef]);

  return (
    <Runner
      ready={!!riveRef}
      backendLabel="legacy · bridge event emitter"
      write={write}
      nudge={nudge}
      onOutputRef={onOutput}
      rive={
        <LegacyRive
          ref={setRef}
          source={ASSET.source}
          stateMachineName={STATE_MACHINE}
          dataBinding={AutoBind(true)}
          autoplay
          fit={LegacyFit.Contain}
          style={styles.rive}
        />
      }
    />
  );
}

const THROUGHPUT_LEVELS = [100, 500, 1000, 2000];
type ThroughputRow = { writesPerFrame: number; jsMsPerFrame: number; fps: number; writesPerSec: number };

function Runner({
  ready,
  backendLabel,
  write,
  nudge,
  onOutputRef,
  rive,
}: {
  ready: boolean;
  backendLabel: string;
  write: (v: number) => void;
  nudge: () => void;
  onOutputRef: React.MutableRefObject<OutputCb | null>;
  rive: React.ReactNode;
}) {
  const pending = useRef(new Map<number, Pending>());
  const stressRecord = useRef<((latency: number) => void) | null>(null);
  const base = useRef(1000);

  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [single, setSingle] = useState<{ stats: Stats; misses: number } | null>(null);
  const [stress, setStress] = useState<{ sent: number; delivered: number; stats: Stats | null } | null>(null);
  const [throughput, setThroughput] = useState<ThroughputRow[] | null>(null);

  const setInput = useCallback(
    (v: number) => {
      write(v);
      nudge();
    },
    [write, nudge],
  );

  useEffect(() => {
    onOutputRef.current = (value: number) => {
      const key = Math.round(value);
      const e = pending.current.get(key);
      if (!e) return;
      pending.current.delete(key);
      const latency = perfNow() - e.t0;
      if (e.resolve) e.resolve(latency);
      else stressRecord.current?.(latency);
    };
    return () => {
      onOutputRef.current = null;
    };
  }, [onOutputRef]);

  const oneRoundTrip = useCallback(
    (target: number) =>
      new Promise<number>((resolve) => {
        const t0 = perfNow();
        pending.current.set(target, { t0, resolve });
        setInput(target);
        setTimeout(() => {
          if (pending.current.delete(target)) resolve(-1); // missed → never delivered
        }, 1000);
      }),
    [setInput],
  );

  const runSingle = useCallback(
    async (n: number) => {
      setRunning(true);
      setSingle(null);
      setStress(null);
      setThroughput(null);
      setStatus('warming up…');
      await oneRoundTrip(base.current++); // discard first (cold)
      const lats: number[] = [];
      let misses = 0;
      for (let i = 0; i < n; i++) {
        if (i % 10 === 0) setStatus(`round-trip ${i + 1}/${n}`);
        const l = await oneRoundTrip(base.current++);
        if (l < 0) misses++;
        else lats.push(l);
        await delay(30); // let the state machine settle before the next write
      }
      const stats = summarize(lats);
      if (stats) setSingle({ stats, misses });
      setStatus('');
      setRunning(false);
    },
    [oneRoundTrip],
  );

  const runStress = useCallback(
    async (durationMs: number) => {
      setRunning(true);
      setSingle(null);
      setStress(null);
      setThroughput(null);
      setStatus('stress: firing one write per frame…');
      const lats: number[] = [];
      stressRecord.current = (l) => lats.push(l);
      let sent = 0;
      let target = base.current + 10000;
      const start = perfNow();
      await new Promise<void>((done) => {
        const frame = () => {
          if (perfNow() - start >= durationMs) {
            setTimeout(() => {
              stressRecord.current = null;
              done();
            }, 500); // drain in-flight deliveries
            return;
          }
          target += 1;
          sent += 1;
          pending.current.set(target, { t0: perfNow() });
          setInput(target);
          requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });
      base.current = target + 1;
      pending.current.clear();
      setStress({ sent, delivered: lats.length, stats: summarize(lats) });
      setStatus('');
      setRunning(false);
    },
    [setInput],
  );

  // Measures the JS-thread cost of issuing writes faster than the frame can drain.
  // Delivery is frame-gated, so instead of latency we measure how much of the frame
  // budget the writes consume and the FPS that results. Each level issues K writes
  // per frame (the per-call cost is what differs: ~1µs JSI vs ~17µs bridge) and one
  // nudge per frame. Latency/delivery is irrelevant here, so we don't track pending.
  const runThroughput = useCallback(
    async (levels: number[], perLevelMs: number) => {
      setRunning(true);
      setSingle(null);
      setStress(null);
      setThroughput(null);
      const rows: ThroughputRow[] = [];
      let target = base.current + 100000;
      for (const k of levels) {
        setStatus(`throughput: ${k} writes/frame…`);
        await new Promise<void>((done) => {
          let frames = 0;
          let writes = 0;
          let jsTime = 0;
          const start = perfNow();
          const frame = () => {
            const t0 = perfNow();
            for (let i = 0; i < k; i++) {
              target += 1;
              write(target);
            }
            nudge();
            jsTime += perfNow() - t0;
            frames += 1;
            writes += k;
            if (perfNow() - start >= perLevelMs) {
              const elapsed = (perfNow() - start) / 1000;
              rows.push({
                writesPerFrame: k,
                jsMsPerFrame: jsTime / Math.max(1, frames),
                fps: frames / elapsed,
                writesPerSec: writes / elapsed,
              });
              done();
              return;
            }
            requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        });
        setThroughput([...rows]);
        await delay(150); // breathe between levels
      }
      base.current = target + 1;
      setStatus('');
      setRunning(false);
    },
    [write, nudge],
  );

  return (
    <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
      <View style={styles.backendTag}>
        <Text style={styles.backendTagText}>{backendLabel}</Text>
      </View>

      <Row>
        <Button title="Run 50 round-trips" tone="primary" onPress={() => runSingle(50)} />
        <Button title="Stress 2s @60Hz" onPress={() => runStress(2000)} />
      </Row>
      <Row>
        <Button
          title="Throughput ramp (writes/frame → FPS)"
          tone="primary"
          onPress={() => runThroughput(THROUGHPUT_LEVELS, 1200)}
        />
      </Row>

      {!ready ? <Text style={styles.dim}>loading reactive file…</Text> : null}
      {status ? <Text style={styles.dim}>{status}</Text> : null}

      <View style={styles.stageRow}>
        <View style={styles.riveBox}>{rive}</View>
      </View>

      {single ? (
        <Card>
          <Text style={styles.cardTitle}>Single round-trip (set → output delivered)</Text>
          <StatRow label="median" value={single.stats.median} bold />
          <StatRow label="p95" value={single.stats.p95} />
          <StatRow label="min" value={single.stats.min} />
          <StatRow label="max" value={single.stats.max} />
          <StatRow label="mean" value={single.stats.mean} />
          <Text style={styles.dim}>
            {single.stats.n} samples{single.misses ? ` · ${single.misses} missed` : ''}
          </Text>
        </Card>
      ) : null}

      {stress ? (
        <Card>
          <Text style={styles.cardTitle}>Stress · one write per frame for 2s</Text>
          <View style={styles.kv}>
            <Text style={styles.dim}>sent</Text>
            <Text style={styles.kvVal}>{stress.sent}</Text>
          </View>
          <View style={styles.kv}>
            <Text style={styles.dim}>delivered</Text>
            <Text style={styles.kvVal}>
              {stress.delivered} ({Math.round((stress.delivered / Math.max(1, stress.sent)) * 100)}%)
            </Text>
          </View>
          {stress.stats ? (
            <>
              <StatRow label="median" value={stress.stats.median} />
              <StatRow label="p95" value={stress.stats.p95} />
            </>
          ) : null}
          <Text style={styles.dim}>
            Drops = writes whose output never arrived (coalesced / not advanced).
          </Text>
        </Card>
      ) : null}

      {throughput ? (
        <Card>
          <Text style={styles.cardTitle}>Throughput · JS cost of writes per frame</Text>
          <View style={[styles.kv, styles.thHead]}>
            <Text style={[styles.dim, styles.thCol]}>writes/frame</Text>
            <Text style={[styles.dim, styles.thCol]}>JS ms/frame</Text>
            <Text style={[styles.dim, styles.thCol]}>FPS</Text>
          </View>
          {throughput.map((r) => {
            const janky = r.fps < 55;
            return (
              <View key={r.writesPerFrame} style={styles.kv}>
                <Text style={[styles.kvVal, styles.thCol]}>{r.writesPerFrame}</Text>
                <Text style={[styles.kvVal, styles.thCol]}>{r.jsMsPerFrame.toFixed(1)}</Text>
                <Text style={[styles.kvVal, styles.thCol, janky ? styles.fpsBad : styles.fpsGood]}>
                  {Math.round(r.fps)}
                </Text>
              </View>
            );
          })}
          <Text style={styles.dim}>
            Each write is a data-binding set. JS ms/frame is time spent issuing the writes; when it
            exceeds the ~16.7ms frame budget, FPS drops. Delivery is frame-gated either way — this
            isolates per-call cost (sync JSI vs async bridge).
          </Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}

function StatRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <View style={styles.kv}>
      <Text style={[styles.dim, bold && styles.kvKeyBold]}>{label}</Text>
      <Text style={[styles.kvVal, bold && styles.kvValBold]}>{value.toFixed(2)} ms</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  controls: { padding: spacing.md, gap: spacing.md },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  stageRow: { alignItems: 'center' },
  riveBox: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rive: { width: 140, height: 140 },
  backendTag: {
    alignSelf: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  backendTagText: { color: colors.accent, fontSize: 11, fontWeight: '600' },
  dim: { color: colors.textDim, fontSize: 12 },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: spacing.xs },
  kv: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  kvKeyBold: { color: colors.text, fontWeight: '700' },
  kvVal: { color: colors.text, fontSize: 14, fontVariant: ['tabular-nums'] },
  kvValBold: { color: colors.nitro, fontSize: 20, fontWeight: '800' },
  thHead: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingBottom: spacing.xs },
  thCol: { flex: 1, textAlign: 'right' },
  fpsGood: { color: colors.nitro, fontWeight: '700' },
  fpsBad: { color: colors.danger, fontWeight: '700' },
});
