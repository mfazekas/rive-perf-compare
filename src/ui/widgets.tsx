import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, spacing } from '../theme';

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Stepper({
  label,
  value,
  min = 0,
  max = 999,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable style={styles.stepBtn} onPress={() => onChange(clamp(value - step))}>
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{value}</Text>
        <Pressable style={styles.stepBtn} onPress={() => onChange(clamp(value + step))}>
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function Button({
  title,
  onPress,
  tone = 'default',
}: {
  title: string;
  onPress: () => void;
  tone?: 'default' | 'primary' | 'danger';
}) {
  const toneColor =
    tone === 'primary' ? colors.accent : tone === 'danger' ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      android_ripple={{ color: colors.border }}
    >
      <Text style={[styles.buttonText, { color: toneColor }]}>{title}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Caption({ children }: { children: React.ReactNode }) {
  return <Text style={styles.caption}>{children}</Text>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  stepperLabel: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  stepBtnText: { color: colors.accent, fontSize: 20, fontWeight: '700' },
  stepperValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  button: {
    flex: 1,
    backgroundColor: colors.cardAlt,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  buttonPressed: { backgroundColor: colors.accent, borderColor: colors.accent, opacity: 0.9 },
  buttonText: { fontSize: 14, fontWeight: '700' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  caption: { color: colors.textDim, fontSize: 12, lineHeight: 17 },
});
