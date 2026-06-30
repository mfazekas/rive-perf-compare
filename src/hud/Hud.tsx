import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BACKEND_META, useBackend } from '../rive/Backend';
import { colors, spacing } from '../theme';
import { useFps } from './useFps';
import { useMemorySampler, type MemorySample } from './useMemorySampler';

// Minimum MB the chart spans top-to-bottom. Keeps idle jitter (~1-2 MB) looking
// flat instead of being auto-stretched to full height, while real deltas (tens
// of MB) still rise clearly.
const SPARK_MIN_SPAN_MB = 32;

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return <View style={styles.spark} />;
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const span = Math.max(hi - lo, SPARK_MIN_SPAN_MB);
  return (
    <View style={styles.spark}>
      {data.map((v, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: `${4 + ((v - lo) / span) * 92}%`,
            backgroundColor: colors.accent,
            marginHorizontal: 0.5,
            borderRadius: 1,
          }}
        />
      ))}
    </View>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : undefined]}>{value}</Text>
    </View>
  );
}

/**
 * Floating performance HUD. The primary number is HEAP = live malloc bytes,
 * which drops on free() and therefore reveals eager release; footprint (MEM)
 * is shown secondary because it does not shrink promptly. Pass a shared sampler
 * so the numbers persist across the screen's own controls.
 */
export function Hud({ sampler }: { sampler?: MemorySample }) {
  const fallback = useMemorySampler();
  const mem = sampler ?? fallback;
  const fps = useFps();
  const { backend } = useBackend();
  const meta = BACKEND_META[backend];

  const delta = mem.baselineHeapMb ? mem.heapMb - mem.baselineHeapMb : 0;
  const deltaColor =
    delta > 1 ? colors.danger : delta < -1 ? colors.nitro : colors.textDim;

  return (
    <View style={styles.hud}>
      <View style={styles.row}>
        <View style={[styles.chip, { backgroundColor: meta.color }]}>
          <Text style={styles.chipText}>{meta.label}</Text>
        </View>
        <Stat label="HEAP" value={`${mem.heapMb.toFixed(1)} MB`} />
        <Stat
          label="Δ BASE"
          value={`${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`}
          color={deltaColor}
        />
        <Stat label="PEAK" value={`${mem.peakHeapMb.toFixed(1)}`} />
        <Stat
          label="FPS"
          value={`${fps}`}
          color={fps >= 55 ? colors.nitro : fps >= 40 ? colors.legacy : colors.danger}
        />
      </View>
      <Sparkline data={mem.history} />
      <View style={styles.row}>
        <Text style={styles.footnote}>
          footprint {mem.mb.toFixed(0)} MB · heap drops on release; footprint does not
        </Text>
        <Pressable style={styles.btn} onPress={mem.setBaseline}>
          <Text style={styles.btnText}>Set baseline</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hud: {
    backgroundColor: 'rgba(13,17,23,0.94)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 6 },
  chipText: { color: '#06140a', fontWeight: '700', fontSize: 12 },
  stat: { alignItems: 'flex-start' },
  statLabel: { color: colors.textDim, fontSize: 9, fontWeight: '600', letterSpacing: 0.5 },
  statValue: { color: colors.text, fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  spark: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 28,
    backgroundColor: colors.cardAlt,
    borderRadius: 4,
    overflow: 'hidden',
  },
  footnote: { flex: 1, color: colors.textDim, fontSize: 10, lineHeight: 13 },
  btn: {
    backgroundColor: colors.cardAlt,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  btnText: { color: colors.accent, fontWeight: '600', fontSize: 13 },
});
