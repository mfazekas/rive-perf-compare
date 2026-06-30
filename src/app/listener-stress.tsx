import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
  useRive as useLegacyRive,
  useRiveNumber as useLegacyNumber,
} from 'rive-react-native';

import { ASSETS } from '../rive/assets';
import { BackendToggle, useBackend } from '../rive/Backend';
import { perfNow, delay } from '../bench/stats';
import { colors, spacing } from '../theme';
import { Button, Card, Caption, Row } from '../ui/widgets';

const STATE_MACHINE = 'State Machine 1';

// The .riv to drive and the output properties to listen on. With a single 'output'
// this loads ~N callbacks/frame (N = views). Author a file that drives output1..output8
// from `input`, drop it in, and switch ASSET + OUTPUT_NAMES to get 8×N callbacks/frame
// at the SAME render cost — that isolates the listen path at high volume.
const ASSET = ASSETS.reactiveMulti;
const OUTPUT_NAMES = ['output1', 'output2', 'output3', 'output4', 'output5', 'output6'];

const M = OUTPUT_NAMES.length;
const N_MAX = 40;
const LEVELS = [1, 5, 10, 20, 40];
// ~1/3 of a 16.7ms frame: synthetic JS-thread work to simulate an app that's already busy.
const JS_LOAD_MS = 5.5;

// Block the JS thread for `ms`, simulating app work competing for the same thread that
// legacy's useRiveNumber delivery (React reconciliation) needs but nitro's callback doesn't.
function burnJs(ms: number) {
  const end = perfNow() + ms;
  // eslint-disable-next-line no-empty
  while (perfNow() < end) {}
}

type Cell = { write: (v: number) => void; nudge: () => void };
type CellsRef = React.MutableRefObject<(Cell | null)[]>;
type OnDelivery = () => void;
type LevelRow = { n: number; fps: number; perSec: number; ratio: number };

export default function ListenerStress() {
  const { backend } = useBackend();
  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={styles.controls}>
        <BackendToggle />
        <Card>
          <Caption>
            Listener fan-in, <Text style={styles.em}>most-efficient documented API each</Text>: nitro
            uses the imperative `property.addListener` callback; legacy uses the documented
            `useRiveNumber` hook (React state). N views × {M} outputs change every frame. Measures
            callbacks/sec, deliv% (changes the developer&apos;s code actually observes), and FPS as
            N grows.
          </Caption>
        </Card>
      </View>
      {backend === 'nitro' ? <NitroFanIn /> : <LegacyFanIn />}
    </SafeAreaView>
  );
}

function NitroFanIn() {
  const cellsRef = useRef<(Cell | null)[]>([]);
  const onDeliveryRef = useRef<OnDelivery | null>(null);
  const onDelivery = useCallback(() => onDeliveryRef.current?.(), []);
  const cells = Array.from({ length: N_MAX }, (_, i) => (
    <NitroCell key={i} index={i} cellsRef={cellsRef} onDelivery={onDelivery} />
  ));
  return (
    <FanInRunner backendLabel={`nitro · property.addListener (imperative) · ${M}/view`} cellsRef={cellsRef} onDeliveryRef={onDeliveryRef}>
      {cells}
    </FanInRunner>
  );
}

function NitroCell({ index, cellsRef, onDelivery }: { index: number; cellsRef: CellsRef; onDelivery: OnDelivery }) {
  const { riveFile } = useRiveFile(ASSET.source);
  const { instance } = useViewModelInstance(riveFile ?? null);
  const { riveViewRef, setHybridRef } = useNitroRive();

  const inputProp = useMemo(() => (instance ? instance.numberProperty('input') : undefined), [instance]);
  const outProps = useMemo(
    () => (instance ? OUTPUT_NAMES.map((name) => instance.numberProperty(name)) : []),
    [instance],
  );
  useEffect(() => () => {
    (inputProp as any)?.dispose?.();
    outProps.forEach((p) => (p as any)?.dispose?.());
  }, [inputProp, outProps]);

  useEffect(() => {
    const removers = outProps.map((p) => (p ? (p as any).addListener(() => onDelivery()) : null));
    return () => {
      removers.forEach((r) => {
        try {
          r?.();
        } catch {
          // disposed
        }
      });
    };
  }, [outProps, onDelivery]);

  useEffect(() => {
    cellsRef.current[index] = {
      write: (v: number) => {
        if (inputProp) (inputProp as any).value = v;
      },
      nudge: () => {
        riveViewRef?.playIfNeeded();
      },
    };
    return () => {
      cellsRef.current[index] = null;
    };
  }, [index, inputProp, riveViewRef, cellsRef]);

  return riveFile ? (
    <RiveView
      file={riveFile}
      hybridRef={setHybridRef}
      stateMachineName={STATE_MACHINE}
      dataBind={instance ?? undefined}
      autoPlay
      fit={NitroFit.Contain}
      style={styles.cell}
    />
  ) : (
    <View style={styles.cell} />
  );
}

function LegacyFanIn() {
  const cellsRef = useRef<(Cell | null)[]>([]);
  const onDeliveryRef = useRef<OnDelivery | null>(null);
  const onDelivery = useCallback(() => onDeliveryRef.current?.(), []);
  const cells = Array.from({ length: N_MAX }, (_, i) => (
    <LegacyCell key={i} index={i} cellsRef={cellsRef} onDelivery={onDelivery} />
  ));
  return (
    <FanInRunner backendLabel={`legacy · useRiveNumber hook (React) · ${M}/view`} cellsRef={cellsRef} onDeliveryRef={onDeliveryRef}>
      {cells}
    </FanInRunner>
  );
}

// Documented legacy listening = the useRiveNumber hook, which delivers each change as a
// React state update. We count every committed value change as one delivery — that's what a
// developer's component actually observes (React may coalesce rapid changes into one commit).
function LegacyOutputListener({ riveRef, name, onDelivery }: { riveRef: any; name: string; onDelivery: OnDelivery }) {
  const [value] = useLegacyNumber(riveRef, name);
  useEffect(() => {
    if (value !== undefined) onDelivery();
  }, [value, onDelivery]);
  return null;
}

function LegacyCell({ index, cellsRef, onDelivery }: { index: number; cellsRef: CellsRef; onDelivery: OnDelivery }) {
  const [setRef, riveRef] = useLegacyRive();

  useEffect(() => {
    cellsRef.current[index] = {
      write: (v: number) => {
        riveRef?.setNumber('input', v);
      },
      nudge: () => {
        riveRef?.play(STATE_MACHINE, undefined, undefined, true);
      },
    };
    return () => {
      cellsRef.current[index] = null;
    };
  }, [index, riveRef, cellsRef]);

  return (
    <>
      <LegacyRive
        ref={setRef}
        source={ASSET.source}
        stateMachineName={STATE_MACHINE}
        dataBinding={AutoBind(true)}
        autoplay
        fit={LegacyFit.Contain}
        style={styles.cell}
      />
      {OUTPUT_NAMES.map((name) => (
        <LegacyOutputListener key={name} riveRef={riveRef} name={name} onDelivery={onDelivery} />
      ))}
    </>
  );
}

function FanInRunner({
  backendLabel,
  cellsRef,
  onDeliveryRef,
  children,
}: {
  backendLabel: string;
  cellsRef: CellsRef;
  onDeliveryRef: React.MutableRefObject<OnDelivery | null>;
  children: React.ReactNode;
}) {
  const counter = useRef(0);
  const base = useRef(1000);
  const [rows, setRows] = useState<LevelRow[] | null>(null);
  const [status, setStatus] = useState('');
  const [loadLabel, setLoadLabel] = useState('');
  const [, setRunning] = useState(false);

  useEffect(() => {
    onDeliveryRef.current = () => {
      counter.current += 1;
    };
    return () => {
      onDeliveryRef.current = null;
    };
  }, [onDeliveryRef]);

  const runRamp = useCallback(
    async (levels: number[], perLevelMs: number, burnMs = 0) => {
      setRunning(true);
      setRows(null);
      setLoadLabel(burnMs > 0 ? ` · +${burnMs}ms JS/frame` : '');
      const out: LevelRow[] = [];
      let target = base.current;
      for (const n of levels) {
        setStatus(`${n} view${n > 1 ? 's' : ''} × ${M} → ${n * M} callbacks/frame${burnMs ? ` · +${burnMs}ms JS load` : ''}…`);
        counter.current = 0;
        let frames = 0;
        const start = perfNow();
        await new Promise<void>((done) => {
          const frame = () => {
            if (perfNow() - start >= perLevelMs) {
              done();
              return;
            }
            for (let i = 0; i < n; i++) {
              const c = cellsRef.current[i];
              if (!c) continue;
              target += 1;
              c.write(target);
              c.nudge();
            }
            if (burnMs > 0) burnJs(burnMs);
            frames += 1;
            requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        });
        const drivingSec = (perfNow() - start) / 1000;
        await delay(600); // let late deliveries (legacy bridge lag) land before counting
        const delivered = counter.current;
        const expected = M * n * frames;
        out.push({
          n,
          fps: frames / drivingSec,
          perSec: delivered / drivingSec,
          ratio: Math.min(1, delivered / Math.max(1, expected)),
        });
        setRows([...out]);
        await delay(300);
      }
      base.current = target + 1;
      setStatus('');
      setRunning(false);
    },
    [cellsRef],
  );

  return (
    <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
      <View style={styles.backendTag}>
        <Text style={styles.backendTagText}>{backendLabel}</Text>
      </View>

      <Row>
        <Button title="Run fan-in ramp" tone="primary" onPress={() => runRamp(LEVELS, 1200, 0)} />
        <Button title={`+ JS load (~⅓ frame)`} onPress={() => runRamp(LEVELS, 1200, JS_LOAD_MS)} />
      </Row>
      {status ? <Text style={styles.dim}>{status}</Text> : null}

      {rows ? (
        <Card>
          <Text style={styles.cardTitle}>Delivery under fan-in ({M} listener{M > 1 ? 's' : ''}/view{loadLabel})</Text>
          <View style={[styles.kv, styles.thHead]}>
            <Text style={[styles.dim, styles.colN]}>views</Text>
            <Text style={[styles.dim, styles.col]}>cb/frame</Text>
            <Text style={[styles.dim, styles.col]}>cb/sec</Text>
            <Text style={[styles.dim, styles.col]}>deliv%</Text>
            <Text style={[styles.dim, styles.col]}>FPS</Text>
          </View>
          {rows.map((r) => {
            const lossy = r.ratio < 0.95;
            const janky = r.fps < 55;
            return (
              <View key={r.n} style={styles.kv}>
                <Text style={[styles.kvVal, styles.colN]}>{r.n}</Text>
                <Text style={[styles.kvVal, styles.col]}>{r.n * M}</Text>
                <Text style={[styles.kvVal, styles.col]}>{Math.round(r.perSec)}</Text>
                <Text style={[styles.kvVal, styles.col, lossy ? styles.bad : styles.good]}>
                  {Math.round(r.ratio * 100)}
                </Text>
                <Text style={[styles.kvVal, styles.col, janky ? styles.bad : styles.good]}>
                  {Math.round(r.fps)}
                </Text>
              </View>
            );
          })}
          <Text style={styles.dim}>
            cb/sec = output callbacks delivered per second. deliv% = received ÷ expected
            ({M}×views×frames) after a 600ms drain. FPS includes rendering {N_MAX} views (a fixed
            confound both backends share) — compare nitro vs legacy at the same row.
          </Text>
        </Card>
      ) : null}

      <Text style={styles.gridLabel}>{N_MAX} live views (each its own instance + {M} listener{M > 1 ? 's' : ''})</Text>
      <View style={styles.grid}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  controls: { padding: spacing.md, gap: spacing.md },
  em: { color: colors.accent, fontWeight: '700' },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
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
  kv: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
  thHead: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingBottom: spacing.xs },
  kvVal: { color: colors.text, fontSize: 14, fontVariant: ['tabular-nums'] },
  colN: { width: 52, textAlign: 'left', color: colors.textDim },
  col: { flex: 1, textAlign: 'right' },
  good: { color: colors.nitro, fontWeight: '700' },
  bad: { color: colors.danger, fontWeight: '700' },
  gridLabel: { color: colors.textDim, fontSize: 11, marginTop: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { width: 28, height: 28 },
});
