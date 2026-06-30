# Results & scenario reference

Companion to [`README.md`](./README.md) (which covers setup, coexistence fixups, and how memory
is measured). This file records **what each scenario measures** and the **numbers observed so far**,
so the data isn't trapped only in `report.html`.

## Test configuration

| | |
| --- | --- |
| Nitro runtime | `@rive-app/react-native` **0.4.10** |
| Legacy runtime | `rive-react-native` **9.8.3** (old-arch view manager via new-arch interop) |
| Platform | Expo SDK 55 · RN 0.83 · new arch · Hermes |
| Device | iPhone 16 Pro **simulator**, **debug** build |
| Memory metric | process physical footprint (`task_vm_info.phys_footprint`) + live malloc heap |

> **Read these as directional.** Simulator + debug build, so trust the **ratios and trends**, not
> the absolute ms/MB. Both libraries are installed in the same binary, so the memory floor is
> inflated — compare the **delta between backends**, not absolute numbers. Device + Instruments
> numbers still to come.

## Methodology

Both runtimes live in **one** app and are swapped with an in-app toggle, so every test exercises
identical JS and app code — only the native library changes. Measurement harnesses live in
[`src/bench/`](./src/bench); each scenario screen drives one harness.

| Aspect | Approach | Where |
| --- | --- | --- |
| **Suite aggregation** | The standard suite runs **N passes** (default 5, set by the *Runs* stepper). Each metric is reported as **mean ± sd** across passes; every raw per-pass sample is kept in the exported JSON. | [`run-all.tsx`](./src/app/run-all.tsx), [`exportResults.ts`](./src/bench/exportResults.ts) |
| **Statistics** | `min / median / p95 / mean` for in-harness sample sets; `meanStddev` for cross-pass aggregation. | [`src/bench/stats.ts`](./src/bench/stats.ts) |
| **Warm-up** | First sample discarded as cold before timing (covers JIT / first-call cost). | `roundtrip-latency.tsx` |
| **Round-trip latency** | 50 samples (`set` → native `output` listener fires); also a 2 s @ 60 Hz stress run. | `roundtrip-latency.tsx` |
| **Property write** | Tight loop of **2,000** writes, total ÷ N → µs/write. Measures **JS-side write cost**: Nitro's synchronous JSI `set()` (applied immediately) vs legacy's async bridge **enqueue** (`setNumber()`, applied later natively). End-to-end set→output is the *round-trip* test, not this one. | `harnesses.tsx` (`PROP_WRITES`) |
| **File load / dispose** | 10 runs, yielding between iterations. Legacy has no file API — its "load" is mount → first frame. | `harnesses.tsx` (`LOAD_RUNS`) |
| **Mount latency** | Measured **warm** (file already parsed and shared — each view just instantiates an artboard) *and* **cold** (Nitro parses inside the timing, like legacy, isolating raw overhead). The headline N-view numbers are the warm/shared path. | `mount-latency.tsx` |
| **Memory** | Process **physical footprint** (`task_vm_info.phys_footprint` — the figure Xcode's memory gauge shows, where GPU/texture memory lands) via the [`perf-memory`](./modules/perf-memory) native module, reported as a **delta over baseline** (`footAdded = footprint − base`). Footprint is laggy/GPU-heavy, so a ±15 MB tolerance is used and the value is sampled after settling. | `harnesses.tsx` (`FOOT_THRESHOLD_MB`) |
| **Leak vs release** | Memory-freed polls footprint for up to ~12 s after unmount and watches the Hermes GC count ([`gcWatcher.ts`](./src/bench/gcWatcher.ts)) to distinguish "released after GC" from a real leak. | `harnesses.tsx` |

Why deltas for memory: with both libraries in one binary the absolute floor is inflated, but the
*added* footprint per runtime is clean — so compare deltas, not absolutes.

Run-to-run spread (5 passes, iPhone 13 mini, release) is small relative to the gaps it measures —
sd is **0–5 %** of the mean on most metrics. The two exceptions are mount latency on Nitro
(**~12 %**, dominated by the first cold parse before the shared `RiveFile` warms up) and the Nitro
property-write loop (**~6 %**); both are still negligible beside the 3–94× backend gaps.

## Headline numbers

| Scenario | Nitro | Legacy | Ratio |
| --- | --- | --- | --- |
| Mount → all visible · 2.9 MB file × 24 views | **130 ms** | 3953 ms | ~30× |
| Mount → all visible · 857 KB × 1 view | **48 ms** | 111 ms | 2.3× |
| Mount → all visible · 857 KB × 2 views | **71 ms** | 268 ms | 3.8× |
| Footprint · same file in 9 views (rewards) | **220.7 MB** | 245.3 MB | ~25 MB less |
| Heap added · mount 6× jellyfish | **19 MB** | 38 MB | ~2× |
| Memory freed after unmount | **< 1 s** to baseline | ~10 s drain | — |
| Data-bound property write | **~1.0 µs** | ~17.5 µs | ~17× |
| Property-write throughput | **~1,000 k/s** | ~57 k/s | ~17× |
| File load | **7.8 ms** | 21 ms\* | — |
| File dispose | **0.4 ms** | n/a\* | — |

<sub>\*Legacy exposes no programmatic file API; "load" is measured as mount → first frame, and
dispose is implicit.</sub>

### Eager-release heap trace (6× jellyfish, MB)

| phase | baseline | mounted | unmount +1s | +8s |
| --- | --- | --- | --- | --- |
| Nitro | 135 | 155 | **135** | 135 |
| Legacy | 135 | 173 | 154 | 141 |

Nitro calls native `dispose()` on unmount and snaps back to baseline immediately; legacy waits for
deferred cleanup / GC and bleeds down slowly. Neither leaks.

## Why the gaps exist

- **Shared file vs per-view copy** — Nitro loads one `RiveFile` and shares it across views (each view
  instantiates an artboard); legacy re-parses the whole file inside every view. Drives both the
  mount-latency and memory results.
- **Sync JSI vs async bridge** — a Nitro property write is a synchronous JSI call; a legacy write is an
  async bridge round-trip. Drives the property-write results.
- **Eager dispose vs GC** — Nitro `HybridObject`s have a deterministic `dispose()` (called by the hooks
  on unmount); legacy relies on native view teardown + GC.

## Scenario screens (`src/app/`)

| Screen | Title | What it measures |
| --- | --- | --- |
| `eager-release.tsx` | Eager release on nav | Mount a heavy screen, unmount, watch how fast memory is reclaimed. |
| `shared-file.tsx` | Shared file · N views | One `.riv` across N views; Nitro shares a single `RiveFile`, legacy loads per view. Memory vs N. |
| `many-animations.tsx` | Many animations · FPS | Grid of many animating instances; JS FPS and jank under render load. |
| `mount-latency.tsx` | Mount latency · N views | Time until graphics appear on all N views (mount → visible). |
| `binding-test.tsx` | Binding test · input → output | Set the view-model input, watch output react via the `.riv` state machine. Validates the reactive file before timing. |
| `roundtrip-latency.tsx` | Round-trip latency · set → output | Write `input`, time until the `output` change is delivered through each native listener. Median/p95 + 60 Hz stress. |
| `listener-stress.tsx` | Listener fan-in · N views | N views each with its own output listener; drive all inputs per frame → N callbacks/frame. Loads the listen path (JSI vs bridge emitter). |
| `property-update.tsx` | Property update overhead | Write a data-bound property N times. Nitro = sync JSI call; legacy = async bridge round-trip. µs/update. |
| `load-dispose.tsx` | Load / dispose timing | File load and dispose latency across repeated runs, both backends. |

## Rendered report

`report.html` (and `summary.html`) render these numbers as charts (dark theme, SVG). Open in a
browser; export/screenshot for embedding. The eager-release line chart is the clearest single
visual — it shows Nitro both peaking lower and returning to baseline immediately.
