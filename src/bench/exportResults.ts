import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import type { BenchMetric, BenchResult, BenchSession } from './types';

const NITRO_VERSION = require('@rive-app/react-native/package.json').version;
const LEGACY_VERSION = require('rive-react-native/package.json').version;

export function buildSession(results: BenchResult[], startedAt: number): BenchSession {
  return {
    device: Device.modelName ?? 'unknown',
    os: `${Platform.OS} ${Platform.Version}`,
    build: __DEV__ ? 'debug' : 'release',
    nitroVersion: NITRO_VERSION,
    legacyVersion: LEGACY_VERSION,
    startedAt,
    results,
  };
}

function fmt(m: BenchMetric): string {
  const v = m.value;
  const abs = Math.abs(v);
  const decimals = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return `${v.toFixed(decimals)} ${m.unit}`;
}

/** Pivot results into a backend-by-backend Markdown comparison, grouped by scenario. */
function toMarkdown(session: BenchSession): string {
  const lines: string[] = [];
  lines.push('# Rive perf — Nitro vs Legacy (standard suite)');
  lines.push('');
  lines.push(`- Device: **${session.device}** · ${session.os} · **${session.build}** build`);
  lines.push(`- Nitro \`@rive-app/react-native\` v${session.nitroVersion} · Legacy \`rive-react-native\` v${session.legacyVersion}`);
  lines.push('');
  lines.push('| Scenario | Metric | Nitro | Legacy |');
  lines.push('| --- | --- | --- | --- |');

  // Preserve scenario order from first appearance.
  const order: string[] = [];
  const byScenario = new Map<string, { title: string; nitro?: BenchResult; legacy?: BenchResult }>();
  for (const r of session.results) {
    if (!byScenario.has(r.scenario)) {
      byScenario.set(r.scenario, { title: r.title });
      order.push(r.scenario);
    }
    byScenario.get(r.scenario)![r.backend] = r;
  }

  for (const id of order) {
    const { title, nitro, legacy } = byScenario.get(id)!;
    const keys: string[] = [];
    for (const r of [nitro, legacy]) {
      for (const m of r?.metrics ?? []) if (!keys.includes(m.key)) keys.push(m.key);
    }
    keys.forEach((key, i) => {
      const nm = nitro?.metrics.find((m) => m.key === key);
      const lm = legacy?.metrics.find((m) => m.key === key);
      const label = nm?.label ?? lm?.label ?? key;
      lines.push(
        `| ${i === 0 ? title : ''} | ${label} | ${nm ? fmt(nm) : '—'} | ${lm ? fmt(lm) : '—'} |`
      );
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
