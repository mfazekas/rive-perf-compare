import type { Backend } from '../rive/Backend';

export type BenchMetric = {
  /** Stable key, e.g. 'all' or 'heapAdded'. */
  key: string;
  /** Human label for tables, e.g. 'All views visible'. */
  label: string;
  value: number;
  unit: string;
};

export type BenchResult = {
  /** Scenario id, e.g. 'mount-latency-24'. */
  scenario: string;
  /** Human title shown in the report, e.g. 'Show graphics on 24 views (2.9 MB)'. */
  title: string;
  backend: Backend;
  params: Record<string, string | number>;
  metrics: BenchMetric[];
  ts: number;
};

export type BenchSession = {
  device: string;
  os: string;
  build: 'debug' | 'release';
  nitroVersion: string;
  legacyVersion: string;
  startedAt: number;
  results: BenchResult[];
};

export type HarnessProps = {
  backend: Backend;
  onDone: (metrics: BenchMetric[]) => void;
};
