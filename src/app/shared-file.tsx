import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Hud } from '../hud/Hud';
import { useMemorySampler } from '../hud/useMemorySampler';
import { ASSET_LIST, ASSETS, type RiveAsset } from '../rive/assets';
import { BackendToggle, useBackend } from '../rive/Backend';
import { RiveGrid } from '../rive/RiveAdapters';
import { colors, spacing } from '../theme';
import { Card, Caption, Stepper } from '../ui/widgets';

export default function SharedFile() {
  const { backend } = useBackend();
  const sampler = useMemorySampler();
  const [asset, setAsset] = useState<RiveAsset>(ASSETS.rewards);
  const [count, setCount] = useState(9);

  const loadsLabel =
    backend === 'nitro' ? '1 file · shared' : `${count} files · per view`;

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={styles.controls}>
        <BackendToggle />
        <Card>
          <Caption>
            Same .riv shown in N views. Nitro loads one RiveFile and shares it; legacy loads the file
            independently in every view. Compare MEM as you raise N.
          </Caption>
          <AssetPicker value={asset} onChange={setAsset} />
          <Stepper label="Views (N)" value={count} min={1} max={36} onChange={setCount} />
          <View style={styles.loadsRow}>
            <Text style={styles.loadsLabel}>Native loads:</Text>
            <Text style={[styles.loadsValue, { color: backend === 'nitro' ? colors.nitro : colors.legacy }]}>
              {loadsLabel}
            </Text>
          </View>
        </Card>
      </View>

      <View style={styles.stage}>
        <RiveGrid backend={backend} asset={asset} count={count} columns={Math.min(4, Math.ceil(Math.sqrt(count)))} />
      </View>

      <Hud sampler={sampler} />
    </SafeAreaView>
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
  loadsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  loadsLabel: { color: colors.textDim, fontSize: 12 },
  loadsValue: { fontSize: 13, fontWeight: '700' },
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
