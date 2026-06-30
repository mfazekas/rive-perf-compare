import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../theme';

export type Backend = 'nitro' | 'legacy';

type BackendContextValue = {
  backend: Backend;
  setBackend: (b: Backend) => void;
};

const BackendContext = createContext<BackendContextValue | null>(null);

export function BackendProvider({ children }: { children: ReactNode }) {
  const [backend, setBackend] = useState<Backend>('nitro');
  return (
    <BackendContext.Provider value={{ backend, setBackend }}>
      {children}
    </BackendContext.Provider>
  );
}

export function useBackend(): BackendContextValue {
  const ctx = useContext(BackendContext);
  if (!ctx) throw new Error('useBackend must be used within BackendProvider');
  return ctx;
}

export const BACKEND_META: Record<
  Backend,
  { label: string; pkg: string; color: string }
> = {
  nitro: {
    label: 'Nitro',
    pkg: '@rive-app/react-native',
    color: colors.nitro,
  },
  legacy: {
    label: 'Legacy',
    pkg: 'rive-react-native',
    color: colors.legacy,
  },
};

/** Segmented control to switch the active backend. */
export function BackendToggle() {
  const { backend, setBackend } = useBackend();
  return (
    <View style={styles.toggle}>
      {(['nitro', 'legacy'] as Backend[]).map((b) => {
        const active = backend === b;
        const meta = BACKEND_META[b];
        return (
          <Pressable
            key={b}
            onPress={() => setBackend(b)}
            style={[
              styles.segment,
              active && { backgroundColor: meta.color },
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                active ? styles.segmentTextActive : undefined,
              ]}
            >
              {meta.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.cardAlt,
    borderRadius: 10,
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  segment: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  segmentText: {
    color: colors.textDim,
    fontWeight: '600',
    fontSize: 14,
  },
  segmentTextActive: {
    color: '#06140a',
  },
});
