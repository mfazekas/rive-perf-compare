import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BackendProvider } from '../rive/Backend';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BackendProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.card },
              headerTintColor: colors.text,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="index" options={{ title: 'Rive Perf Compare' }} />
            <Stack.Screen name="run-all" options={{ title: 'Standard suite' }} />
            <Stack.Screen name="eager-release" options={{ title: 'Eager release on nav' }} />
            <Stack.Screen name="shared-file" options={{ title: 'Shared file · N views' }} />
            <Stack.Screen name="many-animations" options={{ title: 'Many animations · FPS' }} />
            <Stack.Screen name="mount-latency" options={{ title: 'Mount latency · N views' }} />
            <Stack.Screen name="property-update" options={{ title: 'Property update overhead' }} />
            <Stack.Screen name="binding-test" options={{ title: 'Binding test · input → output' }} />
            <Stack.Screen name="roundtrip-latency" options={{ title: 'Round-trip latency · set → output' }} />
            <Stack.Screen name="listener-stress" options={{ title: 'Listener fan-in · N views' }} />
            <Stack.Screen name="load-dispose" options={{ title: 'Load / dispose timing' }} />
          </Stack>
        </BackendProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
