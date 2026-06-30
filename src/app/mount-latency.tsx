import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  RiveView,
  useRive,
  useRiveFile,
  Fit as NitroFit,
  type RiveFile,
} from '@rive-app/react-native';
import LegacyRive, { Fit as LegacyFit } from 'rive-react-native';

import { ASSET_LIST, ASSETS, type RiveAsset } from '../rive/assets';
import { BackendToggle, useBackend } from '../rive/Backend';
import { colors, spacing } from '../theme';
import { Button, Card, Caption, Row, Stepper } from '../ui/widgets';

type Result = { first: number; all: number; n: number } | null;

export default function MountLatency() {
  const { backend } = useBackend();
  const [asset, setAsset] = useState<RiveAsset>(ASSETS.counter);
  const [count, setCount] = useState(12);
  const [runId, setRunId] = useState(0);
  const [mountedN, setMountedN] = useState(0);
  const [result, setResult] = useState<Result>(null);
  const [preload, setPreload] = useState(true);

  // When pre-loaded, the shared file is parsed once up-front, so timing covers
  // only per-view instantiation (the eager-load / reuse payoff — point 2).
  // When cold, nitro loads inside the timing like legacy does, isolating raw
  // load+display overhead (point 1).
  const { riveFile, isLoading } = useRiveFile(
    backend === 'nitro' && preload ? asset.source : undefined
  );

  const t0 = useRef(0);
  const firstMs = useRef(0);
  const readyCount = useRef(0);
  const runN = useRef(0);

  const onCellReady = useCallback(() => {
    readyCount.current += 1;
    const now = performance.now();
    if (readyCount.current === 1) firstMs.current = now - t0.current;
    if (readyCount.current === runN.current) {
      setResult({ first: firstMs.current, all: now - t0.current, n: readyCount.current });
    }
  }, []);

  const run = useCallback(() => {
    readyCount.current = 0;
    firstMs.current = 0;
    runN.current = count;
    setResult(null);
    setMountedN(0);
    // Defer the mount one tick so t0 is captured right before views attach.
    requestAnimationFrame(() => {
      t0.current = performance.now();
      setMountedN(count);
      setRunId((id) => id + 1);
    });
  }, [count]);

  const nitroReady =
    backend === 'legacy' || !preload || (!!riveFile && !isLoading);
  const columns = Math.min(4, Math.ceil(Math.sqrt(Math.max(1, mountedN))));

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={styles.controls}>
        <BackendToggle />
        <Card>
          <Caption>
            Time from mount until graphics appear on ALL N views. Pre-loaded: nitro shares one
            already-parsed RiveFile (point 2 — use a big file × many views). Cold: nitro loads inside
            the timing like legacy, isolating raw overhead (point 1 — use a tiny file, N=1). Ready =
            nitro awaitViewReady / legacy onPlay.
          </Caption>
          <ModeToggle preload={preload} onChange={setPreload} />
          <AssetPicker value={asset} onChange={setAsset} />
          <Stepper label="Views (N)" value={count} min={1} max={24} onChange={setCount} />
          <Row>
            <Button
              title={nitroReady ? `Mount ${count} views` : 'Loading file…'}
              tone="primary"
              onPress={nitroReady ? run : () => {}}
            />
          </Row>
        </Card>

        <Card>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>First view</Text>
            <Text style={styles.resultValue}>
              {result ? `${result.first.toFixed(0)} ms` : '—'}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={[styles.resultLabel, { color: colors.accent }]}>
              All {result?.n ?? count} views
            </Text>
            <Text style={[styles.resultValue, styles.resultBig]}>
              {result ? `${result.all.toFixed(0)} ms` : '—'}
            </Text>
          </View>
        </Card>
      </View>

      <View style={styles.stage}>
        <View style={styles.grid}>
          {mountedN > 0 &&
            Array.from({ length: mountedN }).map((_, i) => (
              <View
                key={`${runId}-${i}`}
                style={{ width: `${100 / columns}%`, aspectRatio: 1, padding: 3 }}
              >
                {backend === 'nitro' ? (
                  preload && riveFile ? (
                    <NitroTimedCell file={riveFile} onReady={onCellReady} />
                  ) : (
                    <NitroColdCell source={asset.source} onReady={onCellReady} />
                  )
                ) : (
                  <LegacyTimedCell source={asset.source} onReady={onCellReady} />
                )}
              </View>
            ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

function NitroTimedCell({ file, onReady }: { file: RiveFile; onReady: () => void }) {
  const { riveViewRef, setHybridRef } = useRive();
  const reported = useRef(false);
  useEffect(() => {
    if (riveViewRef && !reported.current) {
      reported.current = true;
      onReady();
    }
  }, [riveViewRef, onReady]);
  return (
    <RiveView
      file={file}
      hybridRef={setHybridRef}
      autoPlay
      fit={NitroFit.Contain}
      style={styles.fill}
    />
  );
}

/** Cold nitro cell: loads its own RiveFile inside the timing (no pre-load), so
 *  the measurement includes file load + display — comparable to legacy. */
function NitroColdCell({ source, onReady }: { source: number; onReady: () => void }) {
  const { riveFile } = useRiveFile(source);
  const { riveViewRef, setHybridRef } = useRive();
  const reported = useRef(false);
  useEffect(() => {
    if (riveViewRef && !reported.current) {
      reported.current = true;
      onReady();
    }
  }, [riveViewRef, onReady]);
  if (!riveFile) return <View style={styles.fill} />;
  return (
    <RiveView
      file={riveFile}
      hybridRef={setHybridRef}
      autoPlay
      fit={NitroFit.Contain}
      style={styles.fill}
    />
  );
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

function ModeToggle({
  preload,
  onChange,
}: {
  preload: boolean;
  onChange: (v: boolean) => void;
}) {
  const options: { value: boolean; label: string; hint: string }[] = [
    { value: true, label: 'Pre-loaded · shared', hint: 'reuse benefit' },
    { value: false, label: 'Cold load', hint: 'raw overhead' },
  ];
  return (
    <View style={styles.mode}>
      {options.map((o) => {
        const active = o.value === preload;
        return (
          <Pressable
            key={o.label}
            onPress={() => onChange(o.value)}
            style={[styles.modeItem, active && styles.modeItemActive]}
          >
            <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>{o.label}</Text>
            <Text style={[styles.modeHint, active && styles.modeLabelActive]}>{o.hint}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function AssetPicker({
  value,
  onChange,
}: {
  value: RiveAsset;
  onChange: (a: RiveAsset) => void;
}) {
  return (
    <View style={styles.picker}>
      {ASSET_LIST.map((a) => {
        const active = a.id === value.id;
        return (
          <Pressable
            key={a.id}
            onPress={() => onChange(a)}
            style={[styles.pickerItem, active && styles.pickerItemActive]}
          >
            <Text style={[styles.pickerText, active && styles.pickerTextActive]}>
              {a.id} · {a.sizeKB}KB
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  controls: { padding: spacing.md, gap: spacing.md },
  stage: { flex: 1, paddingHorizontal: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', margin: -3 },
  fill: { flex: 1 },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultLabel: { color: colors.textDim, fontSize: 14, fontWeight: '600' },
  resultValue: { color: colors.text, fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  resultBig: { fontSize: 22 },
  mode: { flexDirection: 'row', gap: spacing.sm },
  modeItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.cardAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  modeItemActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  modeLabel: { color: colors.text, fontSize: 13, fontWeight: '700' },
  modeHint: { color: colors.textDim, fontSize: 10, fontWeight: '600' },
  modeLabelActive: { color: '#06140a' },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pickerItem: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    backgroundColor: colors.cardAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pickerItemActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  pickerText: { color: colors.textDim, fontSize: 11, fontWeight: '600' },
  pickerTextActive: { color: '#06140a' },
});
