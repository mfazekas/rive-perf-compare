# Rive perf-compare app

Expo SDK **55** (RN 0.83, new arch). Pinned to 55 to match the Rive libs' tested config
(`@rive-app/react-native` nitro + `rive-react-native` legacy). Docs: https://docs.expo.dev/versions/v55.0.0/

Both Rive native libs depend on the same `RiveRuntime` pod / `app.rive:rive-android` AAR — a single
shared runtime version is pinned in `ios/Podfile.properties.json`. Native prebuild required (no Expo Go).

**Toolchain:** needs **Xcode 26** (16.x can't compile `expo-modules-core` — Swift 6.2). On Xcode
**26.3** the prebuilt React Native won't link (`Undefined symbol …Sealable`), so
`ios/Podfile.properties.json` sets `ios.buildReactNativeFromSource: true`. See README "Toolchain".
