import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  RiveView,
  useRive as useNitroRive,
  useRiveFile,
  useRiveNumber as useNitroNumber,
  useViewModelInstance,
  Fit as NitroFit,
} from '@rive-app/react-native';
import LegacyRive, {
  AutoBind,
  Fit as LegacyFit,
  useRive as useLegacyRive,
  useRiveNumber as useLegacyNumber,
} from 'rive-react-native';

import { ASSETS, type RiveAsset } from '../rive/assets';
import { BackendToggle, useBackend } from '../rive/Backend';
import { colors, spacing } from '../theme';
import { Button, Card, Caption, Row } from '../ui/widgets';

const REACTIVE_ASSETS: RiveAsset[] = [ASSETS.reactive, ASSETS.reactiveSm];

// Both .riv files embed a state machine with this name. It must run for data
// binding to re-evaluate when `input` changes — otherwise `output` is frozen.
const STATE_MACHINE = 'State Machine 1';

export default function BindingTest() {
  const { backend } = useBackend();
  const [asset, setAsset] = useState<RiveAsset>(REACTIVE_ASSETS[0]);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={styles.controls}>
        <BackendToggle />
        <Card>
          <Caption>
            Sets the view-model `input` and reads `output`, which the .riv&apos;s state machine drives.
            If output reacts when you change input, the reactive binding works. The view must be mounted
            &amp; playing for the state machine to advance.
          </Caption>
          <FilePicker value={asset} onChange={setAsset} />
        </Card>
      </View>
      {backend === 'nitro' ? (
        <NitroBindingTest key={asset.id} asset={asset} />
      ) : (
        <LegacyBindingTest key={asset.id} asset={asset} />
      )}
    </SafeAreaView>
  );
}

function NitroBindingTest({ asset }: { asset: RiveAsset }) {
  const { riveFile, error } = useRiveFile(asset.source);
  const { instance } = useViewModelInstance(riveFile ?? null);
  const { riveViewRef, setHybridRef } = useNitroRive();
  const { value: inputEcho, setValue: setInputProp, error: inErr } = useNitroNumber('input', instance);
  const { value: output } = useNitroNumber('output', instance);

  // Show the value we commanded (optimistic). Nitro's hook only refreshes the
  // displayed value when the property's listener fires; a manual write doesn't
  // echo back, so `inputEcho` stays at its first read. Track our own writes.
  const [sent, setSent] = useState<number | undefined>(undefined);

  return (
    <Stage
      error={error?.message ?? inErr?.message}
      input={sent ?? inputEcho}
      output={output}
      onSet={(v) => {
        setSent(v);
        setInputProp(v);
        // The view settles (stops advancing) once the state machine reaches rest.
        // A data-binding write isn't applied until the next advance, so nudge it.
        riveViewRef?.playIfNeeded();
      }}
      rive={
        riveFile ? (
          <RiveView
            file={riveFile}
            hybridRef={setHybridRef}
            stateMachineName={STATE_MACHINE}
            dataBind={instance ?? undefined}
            autoPlay
            fit={NitroFit.Contain}
            style={styles.rive}
          />
        ) : null
      }
    />
  );
}

function LegacyBindingTest({ asset }: { asset: RiveAsset }) {
  const [setRef, riveRef] = useLegacyRive();
  const [inputEcho, setInputProp] = useLegacyNumber(riveRef, 'input');
  const [output] = useLegacyNumber(riveRef, 'output');

  const [sent, setSent] = useState<number | undefined>(undefined);

  return (
    <Stage
      input={sent ?? inputEcho}
      output={output}
      onSet={(v) => {
        setSent(v);
        setInputProp(v);
        // Legacy has no playIfNeeded(); resume the settled state machine via play()
        // so the data-binding write is advanced & rendered (4th arg = isStateMachine).
        riveRef?.play(STATE_MACHINE, undefined, undefined, true);
      }}
      rive={
        <LegacyRive
          ref={setRef}
          source={asset.source}
          stateMachineName={STATE_MACHINE}
          dataBinding={AutoBind(true)}
          autoplay
          fit={LegacyFit.Contain}
          style={styles.rive}
        />
      }
    />
  );
}

function FilePicker({
  value,
  onChange,
}: {
  value: RiveAsset;
  onChange: (a: RiveAsset) => void;
}) {
  return (
    <View style={styles.picker}>
      {REACTIVE_ASSETS.map((a) => {
        const active = a.id === value.id;
        return (
          <Pressable
            key={a.id}
            onPress={() => onChange(a)}
            style={[styles.pickerItem, active && styles.pickerItemActive]}
          >
            <Text style={[styles.pickerText, active && styles.pickerTextActive]}>{a.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Stage({
  input,
  output,
  onSet,
  rive,
  error,
}: {
  input: number | undefined;
  output: number | undefined;
  onSet: (v: number) => void;
  rive: React.ReactNode;
  error?: string;
}) {
  const cur = input ?? 0;
  const set = (v: number) => onSet(v);
  return (
    <View style={styles.stage}>
      <View style={styles.values}>
        <Value label="input" value={input} color={colors.accent} />
        <Text style={styles.arrow}>→</Text>
        <Value label="output" value={output} color={colors.nitro} />
      </View>

      <Row>
        <Button title="−1" onPress={() => set(cur - 1)} />
        <Button title="+1" tone="primary" onPress={() => set(cur + 1)} />
        <Button title="+10" tone="primary" onPress={() => set(cur + 10)} />
        <Button title="random" onPress={() => set(Math.round((cur * 7 + 13) % 100))} />
      </Row>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.riveBox}>{rive}</View>
    </View>
  );
}

function Value({
  label,
  value,
  color,
}: {
  label: string;
  value: number | undefined;
  color: string;
}) {
  return (
    <View style={styles.valueCol}>
      <Text style={styles.valueLabel}>{label}</Text>
      <Text style={[styles.valueNum, { color }]}>
        {value === undefined ? '—' : value.toFixed(2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  controls: { padding: spacing.md, gap: spacing.md },
  stage: { flex: 1, paddingHorizontal: spacing.md, gap: spacing.lg },
  values: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  valueCol: { alignItems: 'center' },
  valueLabel: { color: colors.textDim, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  valueNum: { fontSize: 40, fontWeight: '800', fontVariant: ['tabular-nums'] },
  arrow: { color: colors.textDim, fontSize: 28, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 12, textAlign: 'center' },
  riveBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rive: { width: 160, height: 160 },
  picker: { flexDirection: 'row', gap: spacing.sm },
  pickerItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.cardAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pickerItemActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  pickerText: { color: colors.textDim, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  pickerTextActive: { color: '#06140a' },
});
