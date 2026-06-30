import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { exportSession, buildSession, summarizeResults, formatAgg } from '../bench/exportResults';
import { HARNESSES } from '../bench/harnesses';
import type { BenchMetric, BenchResult } from '../bench/types';
import { BACKEND_META, type Backend } from '../rive/Backend';
import { colors, spacing } from '../theme';
import { Button, Card, Caption, Stepper } from '../ui/widgets';

type Step = {
  scenario: string;
  title: string;
  params: Record<string, string | number>;
  backend: Backend;
  Component: (typeof HARNESSES)[number]['Component'];
};

// Harness-major, backend-minor so the export table pivots cleanly per scenario.
const STEPS: Step[] = HARNESSES.flatMap((h) =>
  (['nitro', 'legacy'] as Backend[]).map((backend) => ({
    scenario: h.scenario,
    title: h.title,
    params: h.params,
    backend,
    Component: h.Component,
  }))
);

const DEFAULT_RUNS = 5;
// Let memory settle and prior views tear down between steps.
const SETTLE_MS = 1500;
// Generous ceiling — memory-freed alone runs settle + up to 12s of polling.
const STEP_TIMEOUT_MS = 30000;

type Status = 'idle' | 'settling' | 'measuring' | 'done';

export default function RunAll() {
  const [status, setStatus] = useState<Status>('idle');
  const [runs, setRuns] = useState(DEFAULT_RUNS);
  // Absolute step index across all passes: pass = floor(n / STEPS.length), step = n % STEPS.length.
  const [n, setN] = useState(0);
  const [results, setResults] = useState<BenchResult[]>([]);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef(0);
  const stepDone = useRef(false);
  const total = runs * STEPS.length;

  const start = useCallback(() => {
    setError(null);
    setResults([]);
    startedAt.current = Date.now();
    setN(0);
    setStatus('settling');
  }, []);

  const complete = useCallback(
    (metrics: BenchMetric[] | null) => {
      if (stepDone.current) return;
      stepDone.current = true;
      const step = STEPS[n % STEPS.length];
      setResults((r) => [
        ...r,
        {
          scenario: step.scenario,
          title: step.title,
          backend: step.backend,
          params: step.params,
          metrics: metrics ?? [],
          run: Math.floor(n / STEPS.length),
          ts: Date.now(),
        },
      ]);
      setN((i) => i + 1);
      setStatus('settling');
    },
    [n]
  );

  useEffect(() => {
    if (status !== 'settling') return;
    const id = setTimeout(() => {
      setStatus(n < total ? 'measuring' : 'done');
    }, SETTLE_MS);
    return () => clearTimeout(id);
  }, [status, n, total]);

  useEffect(() => {
    if (status !== 'measuring') return;
    stepDone.current = false;
    const id = setTimeout(() => complete(null), STEP_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [status, n, complete]);

  const onExport = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      await exportSession(buildSession(results, startedAt.current, runs));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn('[run-all] export failed:', msg);
      setError(msg);
    } finally {
      setExporting(false);
    }
  }, [results, runs]);

  const running = status === 'settling' || status === 'measuring';
  const current = STEPS[n % STEPS.length];
  const passNo = Math.min(Math.floor(n / STEPS.length) + 1, runs);
  const stepNo = (n % STEPS.length) + 1;
  const summary = summarizeResults(results);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Caption>
            Runs the standard suite — {STEPS.length / 2} scenarios × Nitro/Legacy — {runs}× back to
            back, then exports a Markdown + JSON file (mean ± sd) you can AirDrop to your Mac. Run a
            Release build for citable numbers; memory figures are JS-side heap/footprint deltas.
          </Caption>
          {status === 'idle' && (
            <>
              <Stepper label="Runs" value={runs} min={1} max={20} onChange={setRuns} />
              <Button title="Run standard suite" tone="primary" onPress={start} />
            </>
          )}
          {running && (
            <Text style={styles.progress}>
              Run {passNo} / {runs} · Step {stepNo} / {STEPS.length}
              {status === 'settling' ? ' · settling…' : current ? ` · ${current.title} · ${current.backend}` : ''}
            </Text>
          )}
          {status === 'done' && (
            <View style={styles.doneRow}>
              <Button
                title={exporting ? 'Opening share sheet…' : 'Export (AirDrop)'}
                tone="primary"
                onPress={exporting ? () => {} : onExport}
              />
              <Button title="Run again" onPress={start} />
            </View>
          )}
          {error && <Text style={styles.error}>Export failed: {error}</Text>}
        </Card>

        {summary.length > 0 && (
          <Card>
            {summary.map((s) => (
              <View key={s.scenario} style={styles.resultRow}>
                <Text style={styles.resultTitle}>{s.title}</Text>
                {(['nitro', 'legacy'] as Backend[]).map((b) =>
                  s[b].length ? (
                    <View key={b} style={styles.backendLine}>
                      <Text style={[styles.backend, { color: BACKEND_META[b].color }]}>
                        {BACKEND_META[b].label}
                      </Text>
                      <Text style={styles.metrics}>
                        {s[b].map((m) => `${m.label} ${formatAgg(m)}`).join(' · ')}
                      </Text>
                    </View>
                  ) : null
                )}
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      {/* Live measurement stage — views must be laid out & visible to render frames. */}
      <View style={styles.stage}>
        {status === 'measuring' && current && (
          <current.Component key={n} backend={current.backend} onDone={complete} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md },
  progress: { color: colors.accent, fontSize: 14, fontWeight: '600', marginTop: spacing.sm },
  doneRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  error: { color: colors.danger, fontSize: 12, marginTop: spacing.sm },
  resultRow: { paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: 4 },
  resultTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  backendLine: { flexDirection: 'row', gap: spacing.sm, alignItems: 'baseline' },
  backend: { fontSize: 12, fontWeight: '700', minWidth: 48 },
  metrics: { color: colors.textDim, fontSize: 12, flexShrink: 1, fontVariant: ['tabular-nums'] },
  stage: { height: 320, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
});
