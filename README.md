# rive-perf-compare

Side-by-side performance & memory comparison of the two React Native Rive runtimes,
both installed in **one** Expo app and switchable with an in-app toggle:

| Backend | Package | Architecture |
| --- | --- | --- |
| **Nitro** | `@rive-app/react-native` (0.4.10) | Nitro modules, shared `RiveFile` primitive, eager dispose |
| **Legacy** | `rive-react-native` (9.8.3) | Old-arch view manager (runs via RN new-arch interop) |

Expo SDK **55** (RN 0.83, new arch, Hermes). iOS-first. Native build required (no Expo Go).

## Run

```bash
npm install            # postinstall applies the coexistence fixups (see below)
npx expo run:ios       # builds both native libs + RiveRuntime, launches on a simulator
```

### Toolchain (important)

SDK 55 / RN 0.83 **requires Xcode 26** ([Expo SDK 55 changelog](https://expo.dev/changelog/sdk-55));
Xcode 16.x can't compile `expo-modules-core` (Swift 6.2 / `MainActor` errors,
[expo#42525](https://github.com/expo/expo/issues/42525)). On **Xcode 26.3** the *prebuilt* React
Native artifacts fail to link (`Undefined symbol facebook::react::Sealable…` from `ExpoModulesCore`,
plus `SwiftUICore`/`CoreAudioTypes` `ld` errors) — they were built against an older Xcode. Fix:
build RN from source, already set in `ios/Podfile.properties.json`:

```json
{ "ios.buildReactNativeFromSource": "true" }
```

This makes the first build slower but links cleanly on 26.3. If a future SDK 55 point release ships
26.3-compatible prebuilt artifacts, this flag can be removed.

The vendored **fmt 11.0.2** also won't compile under Xcode 26's Apple clang 21 — its consteval
`FMT_STRING` call sites are no longer accepted as constant expressions
([fmtlib/fmt#4740](https://github.com/fmtlib/fmt/issues/4740)). The `plugins/withFmtConsteval.js`
config plugin builds *only* the `fmt` pod as C++17, where fmt falls back to runtime format-string
validation. It runs during prebuild, so the fix survives `expo prebuild` regenerating the Podfile.

## Scenarios

Each screen has a Nitro/Legacy toggle and a floating HUD (memory footprint, Δ vs baseline,
peak, JS FPS, sparkline).

1. **Eager release on nav** — mount a heavy Rive grid, then unmount; watch how fast memory
   drops back to baseline. Nitro disposes the `RiveFile` + view eagerly; legacy relies on
   native view teardown.
2. **Shared file · N views** — one `.riv` in N views. Nitro loads **one** shared `RiveFile`;
   legacy loads it **per view**. Memory grows with N much faster on legacy.
   *(Observed: 9× rewards.riv → nitro ~220 MB vs legacy ~245 MB.)*
3. **Many animations · FPS** — a grid of many simultaneously-animating instances; watch FPS
   and jank as the count rises.
4. **Load / dispose timing** — Nitro times `RiveFileFactory.fromSource()` + `file.dispose()`
   programmatically; legacy has no file API, so it measures mount → first frame as a proxy.
   *(Observed: nitro load ~8 ms / dispose ~0.4 ms vs legacy mount→frame ~21 ms.)*

## Standard suite & capturing results

The **Run standard suite** screen (top of the home list, `src/app/run-all.tsx`) runs the 5 headline
scenarios — 24-view mount latency, heap added, memory freed, property write, load/dispose — for
**both** backends back to back (~60–90 s), accumulating results in-app. Tap **Export** to write a
Markdown + embedded-JSON file (`rive-bench-results.md`) and open the iOS share sheet — **AirDrop** it
to your Mac (or Save to Files). The Markdown table is paste-ready; the JSON is for regenerating
`report.html`. Each run is stamped with device / OS / debug-vs-release / lib versions.

> For citable numbers run a **Release** build (`npx expo run:ios --device --configuration Release`).
> Memory figures are JS-side heap/footprint **deltas** (the metric the comparison relies on, since
> the dual-lib build inflates the absolute floor — see below). Measurement harnesses live in
> `src/bench/`.

## Measuring memory

The HUD reads the process **physical footprint** (`task_vm_info.phys_footprint` on iOS — the
same metric Xcode's memory gauge shows) via a small local Expo module in `modules/perf-memory`.
For deep dives, attach Xcode Instruments (Allocations / Leaks) to the running app.

> The toggle approach keeps **both** native libs loaded, so the absolute baseline is inflated
> vs a single-lib app. Compare **deltas** between backends, not absolute numbers, for the
> cleanest memory story.

## Coexistence fixups

Both libraries embed the Rive runtime, which causes two conflicts in a single binary. Both are
patched idempotently by `scripts/postinstall-fixups.js` (wired to `postinstall`):

1. **RiveRuntime pod version** — nitro pins 6.20.4, legacy pins 6.18.2 → CocoaPods conflict.
   The newer runtime keeps the APIs legacy uses, so legacy is pinned **up** to nitro's version.
2. **`RCTSwiftLog` duplicate symbol** — both vendor an identical ObjC logging class. The legacy
   copy is renamed to `RiveLegacySwiftLog` (class + Swift call sites only; imports untouched).

> Note: local Expo modules are filtered by deployment target — `modules/perf-memory` must
> declare an iOS min ≤ the app's (15.1), or expo autolinking silently drops it.

## Project layout

```
src/
  app/                 expo-router screens (index + 4 scenarios)
  rive/                Backend toggle, asset registry, nitro/legacy adapters
  hud/                 memory sampler, FPS hook, HUD overlay
  ui/                  shared widgets
modules/perf-memory/   local Expo native module: phys_footprint readout
assets/rive/           sample .riv files (blinko, counter, rewards, quick_start, rating)
```
