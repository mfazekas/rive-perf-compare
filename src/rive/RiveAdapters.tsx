import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import {
  RiveView,
  useRiveFile,
  Fit as NitroFit,
} from '@rive-app/react-native';
import LegacyRive, { Fit as LegacyFit } from 'rive-react-native';

import { colors } from '../theme';
import type { Backend } from './Backend';
import type { RiveAsset } from './assets';

type SingleProps = {
  backend: Backend;
  asset: RiveAsset;
  style?: ViewStyle;
  fit?: 'contain' | 'cover';
};

function Loading({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.center, style]}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

function ErrorBox({ style, message }: { style?: ViewStyle; message: string }) {
  return (
    <View style={[styles.center, style]}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

/** Nitro: loads its own RiveFile then renders a single view. */
function NitroSingle({ asset, style, fit = 'contain' }: Omit<SingleProps, 'backend'>) {
  const { riveFile, isLoading, error } = useRiveFile(asset.source);
  if (error) return <ErrorBox style={style} message={error.message} />;
  if (isLoading || !riveFile) return <Loading style={style} />;
  return (
    <RiveView
      file={riveFile}
      autoPlay
      fit={fit === 'cover' ? NitroFit.Cover : NitroFit.Contain}
      style={style}
    />
  );
}

/** Legacy: loads independently from `source`. */
function LegacySingle({ asset, style, fit = 'contain' }: Omit<SingleProps, 'backend'>) {
  return (
    <LegacyRive
      source={asset.source}
      autoplay
      fit={fit === 'cover' ? LegacyFit.Cover : LegacyFit.Contain}
      style={style}
    />
  );
}

export function RiveSingle({ backend, ...rest }: SingleProps) {
  return backend === 'nitro' ? (
    <NitroSingle {...rest} />
  ) : (
    <LegacySingle {...rest} />
  );
}

type GridProps = {
  backend: Backend;
  asset: RiveAsset;
  count: number;
  columns: number;
  gap?: number;
};

/**
 * Nitro grid: loads the file ONCE and shares the single RiveFile across all
 * N views — this is the nitro-specific advantage (one parse, one GPU upload).
 */
function NitroGrid({ asset, count, columns, gap = 6 }: Omit<GridProps, 'backend'>) {
  const { riveFile, isLoading, error } = useRiveFile(asset.source);
  if (error) return <ErrorBox message={error.message} />;
  if (isLoading || !riveFile) return <Loading />;
  return (
    <GridLayout columns={columns} gap={gap}>
      {Array.from({ length: count }).map((_, i) => (
        <CellAuto key={i} columns={columns} gap={gap}>
          <RiveView file={riveFile} autoPlay fit={NitroFit.Contain} style={styles.fill} />
        </CellAuto>
      ))}
    </GridLayout>
  );
}

/** Legacy grid: every view loads the file independently (no shared primitive). */
function LegacyGrid({ asset, count, columns, gap = 6 }: Omit<GridProps, 'backend'>) {
  return (
    <GridLayout columns={columns} gap={gap}>
      {Array.from({ length: count }).map((_, i) => (
        <CellAuto key={i} columns={columns} gap={gap}>
          <LegacyRive source={asset.source} autoplay fit={LegacyFit.Contain} style={styles.fill} />
        </CellAuto>
      ))}
    </GridLayout>
  );
}

export function RiveGrid({ backend, ...rest }: GridProps) {
  return backend === 'nitro' ? <NitroGrid {...rest} /> : <LegacyGrid {...rest} />;
}

function GridLayout({
  children,
  gap,
}: {
  children: React.ReactNode;
  columns: number;
  gap: number;
}) {
  return (
    <View style={[styles.grid, { margin: -gap / 2 }]}>{children}</View>
  );
}

function CellAuto({
  children,
  columns,
  gap,
}: {
  children: React.ReactNode;
  columns: number;
  gap: number;
}) {
  return (
    <View style={{ width: `${100 / columns}%`, aspectRatio: 1, padding: gap / 2 }}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  fill: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  errorText: { color: colors.danger, fontSize: 12, textAlign: 'center', padding: 8 },
});
