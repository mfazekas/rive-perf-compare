import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RiveFileFactory } from '@rive-app/react-native';
import LegacyRive from 'rive-react-native';

import { ASSETS } from '../rive/assets';
import { BackendToggle, useBackend } from '../rive/Backend';
import { colors, spacing } from '../theme';
import { Button, Card, Caption, Row, Stepper } from '../ui/widgets';

const RUNS = 10;

type Stats = { n: number; avg: number; min: number; max: number } | null;

function stats(xs: number[]): Stats {
  if (xs.length === 0) return null;
  const sum = xs.reduce((a, b) => a + b, 0);
  return {
    n: xs.length,
    avg: sum / xs.length,
    min: Math.min(...xs),
    max: Math.max(...xs),
  };
}

export default function LoadDispose() {
  const { backend } = useBackend();
  const asset = ASSETS.counter;
  const [runs, setRuns] = useState(RUNS);
  const [busy, setBusy] = useState(false);
  const [loadMs, setLoadMs] = useState<number[]>([]);
  const [disposeMs, setDisposeMs] = useState<number[]>([]);

  // Legacy mount→first-frame proxy timing.
  const [legacyIndex, setLegacyIndex] = useState<number | null>(null);
  const legacyStart = useRef(0);
  const legacyResults = useRef<number[]>([]);

  const reset = () => {
    setLoadMs([]);
    setDisposeMs([]);
  };

  const runNitro = useCallback(async () => {
    setBusy(true);
    reset();
    const loads: number[] = [];
    const disposes: number[] = [];
    for (let i = 0; i < runs; i++) {
      const t0 = performance.now();
      const file = await RiveFileFactory.fromSource(asset.source, undefined);
      loads.push(performance.now() - t0);
      const t1 = performance.now();
      (file as any).dispose?.();
      disposes.push(performance.now() - t1);
      // Yield so we don't starve the JS thread between iterations.
      await new Promise((r) => setTimeout(r, 0));
    }
    setLoadMs(loads);
    setDisposeMs(disposes);
    setBusy(false);
  }, [asset, runs]);

  const runLegacy = useCallback(() => {
    setBusy(true);
    reset();
    legacyResults.current = [];
    legacyStart.current = performance.now();
    setLegacyIndex(0);
  }, []);

  const onLegacyLoaded = useCallback(() => {
    const elapsed = performance.now() - legacyStart.current;
    legacyResults.current = [...legacyResults.current, elapsed];
    setLegacyIndex((idx) => {
      const next = (idx ?? 0) + 1;
      if (next >= runs) {
        setLoadMs(legacyResults.current);
        setBusy(false);
        return null;
      }
      legacyStart.current = performance.now();
      return next;
    });
  }, [runs]);

  const loadStats = stats(loadMs);
  const disposeStats = stats(disposeMs);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={styles.controls}>
        <BackendToggle />
        <Card>
          <Caption>
            {backend === 'nitro'
              ? 'Nitro exposes a programmatic file API. Each run times RiveFileFactory.fromSource() (load) and file.dispose() (release).'
              : 'Legacy has no programmatic file/dispose API — files load implicitly inside a view. This measures mount → first frame (onPlay) as a proxy; dispose is implicit on unmount.'}
          </Caption>
          <Stepper label="Runs" value={runs} min={1} max={50} onChange={setRuns} />
          <Row>
            <Button
              title={busy ? 'Running…' : `Run ${runs}× ${backend}`}
              tone="primary"
              onPress={backend === 'nitro' ? runNitro : runLegacy}
            />
          </Row>
        </Card>

        <Card>
          <ResultRow label="Load" stat={loadStats} color={colors.accent} />
          {backend === 'nitro' && (
            <ResultRow label="Dispose" stat={disposeStats} color={colors.nitro} />
          )}
        </Card>
      </View>

      {/* Offscreen-ish legacy timing host: one view at a time. */}
      {legacyIndex !== null && (
        <View style={styles.legacyHost} pointerEvents="none">
          <LegacyRive
            key={legacyIndex}
            source={asset.source}
            autoplay
            onPlay={onLegacyLoaded}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function ResultRow({ label, stat, color }: { label: string; stat: Stats; color: string }) {
  return (
    <View style={styles.resultRow}>
      <Text style={[styles.resultLabel, { color }]}>{label}</Text>
      {stat ? (
        <Text style={styles.resultValue}>
          avg {stat.avg.toFixed(1)} · min {stat.min.toFixed(1)} · max {stat.max.toFixed(1)} ms (n={stat.n})
        </Text>
      ) : (
        <Text style={styles.resultEmpty}>—</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  controls: { padding: spacing.md, gap: spacing.md },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultLabel: { fontSize: 14, fontWeight: '700' },
  resultValue: { color: colors.text, fontSize: 12, fontVariant: ['tabular-nums'] },
  resultEmpty: { color: colors.textDim, fontSize: 13 },
  legacyHost: { width: 1, height: 1, position: 'absolute', left: -10, bottom: 0, opacity: 0.01 },
});
