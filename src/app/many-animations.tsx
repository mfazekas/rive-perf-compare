import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Hud } from '../hud/Hud';
import { useMemorySampler } from '../hud/useMemorySampler';
import { ASSETS } from '../rive/assets';
import { BackendToggle, useBackend } from '../rive/Backend';
import { RiveGrid } from '../rive/RiveAdapters';
import { colors, spacing } from '../theme';
import { Card, Caption, Stepper } from '../ui/widgets';

const ANIMATED = ASSETS.rewards;

export default function ManyAnimations() {
  const { backend } = useBackend();
  const sampler = useMemorySampler();
  const [count, setCount] = useState(16);
  const [columns, setColumns] = useState(4);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={styles.controls}>
        <BackendToggle />
        <Card>
          <Caption>
            A grid of {count} simultaneously-animating instances ({ANIMATED.label}). Raise the count
            and watch the FPS readout for jank. Nitro shares one file across the grid; legacy loads
            each independently.
          </Caption>
          <Stepper label="Instances" value={count} min={1} max={64} step={4} onChange={setCount} />
          <Stepper label="Columns" value={columns} min={2} max={8} onChange={setColumns} />
        </Card>
      </View>

      <View style={styles.stage}>
        <RiveGrid backend={backend} asset={ANIMATED} count={count} columns={columns} gap={4} />
      </View>

      <Hud sampler={sampler} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  controls: { padding: spacing.md, gap: spacing.md },
  stage: { flex: 1, paddingHorizontal: spacing.md },
});
