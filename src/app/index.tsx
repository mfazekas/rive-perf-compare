import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackendToggle, BACKEND_META, useBackend } from '../rive/Backend';
import { colors, spacing } from '../theme';

const NITRO_VERSION = require('@rive-app/react-native/package.json').version;
const LEGACY_VERSION = require('rive-react-native/package.json').version;

type Scenario = {
  href: string;
  title: string;
  blurb: string;
  metric: string;
};

const SCENARIOS: Scenario[] = [
  {
    href: '/run-all',
    title: 'Run standard suite',
    blurb:
      'Auto-run all 5 standard scenarios × Nitro/Legacy back to back, then export the results (AirDrop / Save to Files).',
    metric: 'Automated · export',
  },
  {
    href: '/eager-release',
    title: 'Eager release on nav',
    blurb:
      'Mount a heavy Rive screen, then unmount / navigate back. Watch how fast memory is reclaimed.',
    metric: 'Memory reclaim',
  },
  {
    href: '/shared-file',
    title: 'Shared file · N views',
    blurb:
      'Display one .riv across N views. Nitro shares a single RiveFile; legacy loads it per view.',
    metric: 'Memory vs N',
  },
  {
    href: '/many-animations',
    title: 'Many animations · FPS',
    blurb:
      'A grid of many animating instances. Measure JS FPS and jank under render load.',
    metric: 'FPS under load',
  },
  {
    href: '/mount-latency',
    title: 'Mount latency · N views',
    blurb:
      'Time until graphics appear on all N views. Nitro shares a pre-loaded file (instant); legacy parses per view.',
    metric: 'Mount → visible ms',
  },
  {
    href: '/binding-test',
    title: 'Binding test · input → output',
    blurb:
      'Set the view-model input and watch output react (driven by the .riv state machine). Validates the reactive file before timing it.',
    metric: 'reactive check',
  },
  {
    href: '/roundtrip-latency',
    title: 'Round-trip latency · set → output',
    blurb:
      'Write `input`, time until the `output` change is delivered via each native listener. Median/p95 + a 60Hz stress run.',
    metric: 'set → output ms',
  },
  {
    href: '/listener-stress',
    title: 'Listener fan-in · N views',
    blurb:
      'N views, each with its own output listener. Drive all inputs per frame → N callbacks/frame. Loads the listen path (JSI vs bridge emitter).',
    metric: 'deliver % · latency · FPS',
  },
  {
    href: '/property-update',
    title: 'Property update overhead',
    blurb:
      'Write a data-bound property N times. Nitro = synchronous JSI call; legacy = async bridge round-trip.',
    metric: 'µs per update',
  },
  {
    href: '/load-dispose',
    title: 'Load / dispose timing',
    blurb:
      'Time file load and dispose latency across repeated runs for both backends.',
    metric: 'Load & dispose ms',
  },
];

export default function Home() {
  const { backend } = useBackend();
  const meta = BACKEND_META[backend];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.intro}>
        Side-by-side performance & memory comparison of the new Nitro Rive runtime
        vs the legacy bridge runtime. Pick a backend, then run a scenario.
      </Text>

      <View style={styles.toggleRow}>
        <BackendToggle />
      </View>

      <View style={styles.versions}>
        <VersionPill label="Nitro" version={NITRO_VERSION} color={colors.nitro} active={backend === 'nitro'} />
        <VersionPill label="Legacy" version={LEGACY_VERSION} color={colors.legacy} active={backend === 'legacy'} />
      </View>
      <Text style={styles.activeNote}>
        Active: <Text style={{ color: meta.color }}>{meta.pkg}</Text>
      </Text>

      <View style={styles.list}>
        {SCENARIOS.map((s) => (
          <Link key={s.href} href={s.href as any} asChild>
            <Pressable style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{s.title}</Text>
                <View style={styles.metricChip}>
                  <Text style={styles.metricText}>{s.metric}</Text>
                </View>
              </View>
              <Text style={styles.cardBlurb}>{s.blurb}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

function VersionPill({
  label,
  version,
  color,
  active,
}: {
  label: string;
  version: string;
  color: string;
  active: boolean;
}) {
  return (
    <View style={[styles.pill, active && { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillVersion}>v{version}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  intro: { color: colors.textDim, fontSize: 14, lineHeight: 20 },
  toggleRow: { alignItems: 'center', marginVertical: spacing.sm },
  versions: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  pillLabel: { color: colors.text, fontWeight: '700', fontSize: 13 },
  pillVersion: { color: colors.textDim, fontSize: 12, fontVariant: ['tabular-nums'] },
  activeNote: { color: colors.textDim, fontSize: 12 },
  list: { gap: spacing.md, marginTop: spacing.sm },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '700', flexShrink: 1 },
  metricChip: {
    backgroundColor: colors.cardAlt,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  metricText: { color: colors.accent, fontSize: 11, fontWeight: '600' },
  cardBlurb: { color: colors.textDim, fontSize: 13, lineHeight: 19 },
});
