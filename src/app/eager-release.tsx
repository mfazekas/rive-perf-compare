import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Hud } from '../hud/Hud';
import { useMemorySampler } from '../hud/useMemorySampler';
import { ASSETS, type RiveAsset } from '../rive/assets';
import { BackendToggle, useBackend } from '../rive/Backend';
import { RiveGrid } from '../rive/RiveAdapters';
import { colors, spacing } from '../theme';
import { Button, Card, Caption, Row, Stepper } from '../ui/widgets';

// Heavy candidates: two big files WITHOUT scripting/databinding (clean memory
// control) plus Blinko, which is logic-heavy and a known leak-repro suspect.
const HEAVY_ASSETS: RiveAsset[] = [ASSETS.jellyfish, ASSETS.paper, ASSETS.blinko];

export default function EagerRelease() {
  const { backend } = useBackend();
  const sampler = useMemorySampler();
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(6);
  const [asset, setAsset] = useState<RiveAsset>(ASSETS.jellyfish);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={styles.controls}>
        <BackendToggle />
        <Card>
          <Caption>
            1. Set baseline · 2. Mount · 3. Note PEAK · 4. Unmount and watch how quickly MEM drops
            back toward baseline. Nitro disposes the RiveFile + view memory eagerly; legacy relies on
            native view teardown. Use a no-scripting file to rule out content-side retention.
          </Caption>
          <HeavyPicker value={asset} onChange={setAsset} />
          <Stepper label="Heavy instances" value={count} min={1} max={24} onChange={setCount} />
          <Row>
            <Button
              title={mounted ? 'Unmount heavy screen' : 'Mount heavy screen'}
              tone={mounted ? 'danger' : 'primary'}
              onPress={() => setMounted((m) => !m)}
            />
          </Row>
        </Card>
      </View>

      <View style={styles.stage}>
        {mounted ? (
          <RiveGrid backend={backend} asset={asset} count={count} columns={3} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Heavy screen unmounted</Text>
          </View>
        )}
      </View>

      <Hud sampler={sampler} />
    </SafeAreaView>
  );
}

function HeavyPicker({
  value,
  onChange,
}: {
  value: RiveAsset;
  onChange: (a: RiveAsset) => void;
}) {
  return (
    <View style={styles.picker}>
      {HEAVY_ASSETS.map((a) => {
        const active = a.id === value.id;
        return (
          <Pressable
            key={a.id}
            onPress={() => onChange(a)}
            style={[styles.pickerItem, active && styles.pickerItemActive]}
          >
            <Text style={[styles.pickerText, active && styles.pickerTextActive]}>{a.id}</Text>
            <Text style={[styles.pickerSub, active && styles.pickerTextActive]}>
              {a.scripted ? 'scripted' : 'plain'}
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
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  placeholderText: { color: colors.textDim, fontSize: 14 },
  picker: { flexDirection: 'row', gap: spacing.sm },
  pickerItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.cardAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pickerItemActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  pickerText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  pickerSub: { color: colors.textDim, fontSize: 10, fontWeight: '600' },
  pickerTextActive: { color: '#06140a' },
});
