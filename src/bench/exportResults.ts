import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import type { BenchResult, BenchSession } from './types';
import { meanStddev } from './stats';

const NITRO_VERSION = require('@rive-app/react-native/package.json').version;
const LEGACY_VERSION = require('rive-react-native/package.json').version;

export function buildSession(results: BenchResult[], startedAt: number, runs: number): BenchSession {
  return {
    device: Device.modelName ?? 'unknown',
    os: `${Platform.OS} ${Platform.Version}`,
    build: __DEV__ ? 'debug' : 'release',
    nitroVersion: NITRO_VERSION,
    legacyVersion: LEGACY_VERSION,
    startedAt,
    runs,
    results,
  };
}

/** A metric aggregated across the suite's runs. */
export type AggMetric = { key: string; label: string; unit: string; mean: number; sd: number; n: number };
export type ScenarioAgg = { scenario: string; title: string; nitro: AggMetric[]; legacy: AggMetric[] };

/** Group raw per-run results by scenario/backend and reduce each metric to mean ± sd. */
export function summarizeResults(results: BenchResult[]): ScenarioAgg[] {
  const order: string[] = [];
  const byScenario = new Map<string, { title: string; nitro: BenchResult[]; legacy: BenchResult[] }>();
  for (const r of results) {
    if (!byScenario.has(r.scenario)) {
      byScenario.set(r.scenario, { title: r.title, nitro: [], legacy: [] });
      order.push(r.scenario);
    }
    byScenario.get(r.scenario)![r.backend].push(r);
  }

  const aggBackend = (rs: BenchResult[]): AggMetric[] => {
    const keys: string[] = [];
    for (const r of rs) for (const m of r.metrics) if (!keys.includes(m.key)) keys.push(m.key);
    return keys.map((key) => {
      const values: number[] = [];
      let label = key;
      let unit = '';
      for (const r of rs) {
        const m = r.metrics.find((m) => m.key === key);
        if (m) {
          values.push(m.value);
          label = m.label;
          unit = m.unit;
        }
      }
      const { mean, sd, n } = meanStddev(values);
      return { key, label, unit, mean, sd, n };
    });
  };

  return order.map((id) => {
    const g = byScenario.get(id)!;
    return { scenario: id, title: g.title, nitro: aggBackend(g.nitro), legacy: aggBackend(g.legacy) };
  });
}

/** "34.7 ± 0.8 ms" — the ± term is dropped for single-run metrics. */
export function formatAgg(a: AggMetric | undefined): string {
  if (!a || a.n === 0) return '—';
  const abs = Math.abs(a.mean);
  const d = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  const mean = a.mean.toFixed(d);
  return a.n > 1 ? `${mean} ± ${a.sd.toFixed(d)} ${a.unit}` : `${mean} ${a.unit}`;
}

/** Pivot results into a backend-by-backend Markdown comparison, grouped by scenario. */
function toMarkdown(session: BenchSession): string {
  const lines: string[] = [];
  lines.push('# Rive perf — Nitro vs Legacy (standard suite)');
  lines.push('');
  lines.push(`- Device: **${session.device}** · ${session.os} · **${session.build}** build`);
  lines.push(`- Nitro \`@rive-app/react-native\` v${session.nitroVersion} · Legacy \`rive-react-native\` v${session.legacyVersion}`);
  lines.push(
    session.runs > 1
      ? `- ${session.runs} runs per scenario · values are **mean ± sd**`
      : `- Single run per scenario`
  );
  lines.push('');
  lines.push('| Scenario | Metric | Nitro | Legacy |');
  lines.push('| --- | --- | --- | --- |');

  for (const s of summarizeResults(session.results)) {
    const keys: string[] = [];
    for (const m of [...s.nitro, ...s.legacy]) if (!keys.includes(m.key)) keys.push(m.key);
    keys.forEach((key, i) => {
      const nm = s.nitro.find((m) => m.key === key);
      const lm = s.legacy.find((m) => m.key === key);
      const label = nm?.label ?? lm?.label ?? key;
      lines.push(`| ${i === 0 ? s.title : ''} | ${label} | ${formatAgg(nm)} | ${formatAgg(lm)} |`);
    });
  }

  lines.push('');
  lines.push('<details><summary>Raw JSON</summary>');
  lines.push('');
  lines.push('```json');
  lines.push(JSON.stringify(session, null, 2));
  lines.push('```');
  lines.push('</details>');
  lines.push('');
  return lines.join('\n');
}

/**
 * Write the session to a single Markdown file (human table + embedded raw JSON)
 * in the cache dir and open the iOS share sheet (AirDrop / Save to Files).
 * One file keeps the AirDrop to a single tap while staying machine-reusable.
 */
export async function exportSession(session: BenchSession): Promise<void> {
  const file = new File(Paths.cache, 'rive-bench-results.md');
  if (file.exists) file.delete();
  file.create();
  file.write(toMarkdown(session));

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/markdown',
    UTI: 'net.daringfireball.markdown',
    dialogTitle: 'Rive bench results',
  });
}
