import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  RiveView,
  useRiveFile,
  useViewModelInstance,
  Fit as NitroFit,
  type ViewModelInstance,
} from '@rive-app/react-native';
import LegacyRive, { AutoBind, Fit as LegacyFit, type RiveRef } from 'rive-react-native';

import { ASSETS } from '../rive/assets';
import { BackendToggle, useBackend } from '../rive/Backend';
import { colors, spacing } from '../theme';
import { Button, Card, Caption, Row, Stepper } from '../ui/widgets';

const ASSET = ASSETS.quick_start; // has data-bound number property "health"
const PROP = 'health';

type Result = { totalMs: number; perUs: number; perSec: number; n: number } | null;

export default function PropertyUpdate() {
  const { backend } = useBackend();
  const [updates, setUpdates] = useState(2000);
  const [result, setResult] = useState<Result>(null);

  const { riveFile } = useRiveFile(backend === 'nitro' ? ASSET.source : undefined);
  const instanceRef = useRef<ViewModelInstance | null>(null);
  const { instance } = useViewModelInstance(
    backend === 'nitro' ? riveFile : null,
    { onInit: (vmi) => (instanceRef.current = vmi) }
  );
  if (instance) instanceRef.current = instance;

  const legacyRef = useRef<RiveRef>(null);

  const run = () => {
    const n = updates;
    let dt = 0;
    if (backend === 'nitro') {
      const inst = instanceRef.current;
      const prop = inst?.numberProperty(PROP);
      if (!prop) return;
      const t0 = performance.now();
      for (let i = 0; i < n; i++) prop.set(i % 100); // synchronous JSI write
      dt = performance.now() - t0;
    } else {
      const ref = legacyRef.current;
      if (!ref) return;
      const t0 = performance.now();
      for (let i = 0; i < n; i++) ref.setNumber(PROP, i % 100); // async bridge enqueue
      dt = performance.now() - t0;
    }
    setResult({ totalMs: dt, perUs: (dt * 1000) / n, perSec: n / (dt / 1000), n });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={styles.controls}>
        <BackendToggle />
        <Card>
          <Caption>
            Cost of writing a data-bound number property ({PROP}) N times in a tight loop. Nitro’s
            set() is a synchronous JSI call (applied immediately); legacy’s setNumber() is an async
            bridge enqueue (applied later on the native side). Lower per-update time is better.
          </Caption>
          <Stepper label="Updates (N)" value={updates} min={100} max={20000} step={100} onChange={setUpdates} />
          <Row>
            <Button title={`Run ${updates} updates · ${backend}`} tone="primary" onPress={run} />
          </Row>
        </Card>

        <Card>
          <Big
            label="per update"
            value={result ? `${Math.round(result.perUs * 1000).toLocaleString('en-US')} ns` : '—'}
          />
          <View style={styles.line}>
            <Text style={styles.lkey}>total</Text>
            <Text style={styles.lval}>{result ? `${result.totalMs.toFixed(1)} ms / ${result.n}` : '—'}</Text>
          </View>
          <View style={styles.line}>
            <Text style={styles.lkey}>throughput</Text>
            <Text style={styles.lval}>
              {result ? `${Math.round(result.perSec).toLocaleString('en-US')} updates/s` : '—'}
            </Text>
          </View>
          <Text style={styles.semantics}>
            {backend === 'nitro'
              ? 'synchronous — value is applied & readable immediately after the loop'
              : 'async enqueue — native applies the queue after the loop (flooding adds latency)'}
          </Text>
        </Card>
      </View>

      <View style={styles.stage}>
        {backend === 'nitro' && riveFile && instanceRef.current ? (
          <RiveView
            file={riveFile}
            dataBind={instanceRef.current}
            autoPlay
            fit={NitroFit.Contain}
            style={styles.fill}
          />
        ) : backend === 'legacy' ? (
          <LegacyRive
            ref={legacyRef}
            source={ASSET.source}
            dataBinding={AutoBind(true)}
            autoplay
            fit={LegacyFit.Contain}
            style={styles.fill}
          />
        ) : (
          <View style={styles.fill} />
        )}
      </View>
    </SafeAreaView>
  );
}

function Big({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <Text style={styles.lkey}>{label}</Text>
      <Text style={styles.big}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  controls: { padding: spacing.md, gap: spacing.md },
  stage: { flex: 1, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  fill: { flex: 1 },
  line: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  lkey: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  lval: { color: colors.text, fontSize: 14, fontVariant: ['tabular-nums'] },
  big: { color: colors.accent, fontSize: 26, fontWeight: '800', fontVariant: ['tabular-nums'] },
  semantics: { color: colors.textDim, fontSize: 11.5, lineHeight: 16, marginTop: 2 },
});
