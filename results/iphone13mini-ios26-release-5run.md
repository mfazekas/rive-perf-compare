# Rive perf — Nitro vs Legacy (standard suite)

- Device: **iPhone 13 mini** · ios 26.5 · **release** build
- Nitro `@rive-app/react-native` v0.4.10 · Legacy `rive-react-native` v9.8.3
- 5 runs per scenario · values are **mean ± sd**

| Scenario | Metric | Nitro | Legacy |
| --- | --- | --- | --- |
| Show graphics on 24 views (2.9 MB) | First view visible | 28.8 ± 3.4 ms | 2715 ± 83 ms |
|  | All 24 views visible | 28.8 ± 3.4 ms | 2716 ± 83 ms |
| Heap added · 6× heavy file | Heap added | 19.0 ± 0.1 MB | 31.5 ± 0.0 MB |
|  | Footprint added | 112 ± 3 MB | 525 ± 0 MB |
| Memory freed on unmount | Footprint → baseline | 257 ± 8 ms | 262 ± 1 ms |
|  | Footprint residual @1s | 2.32 ± 1.18 MB | 0.10 ± 0.05 MB |
|  | Footprint residual @5s | 2.27 ± 1.20 MB | 0.08 ± 0.06 MB |
|  | Footprint residual @10s | -0.03 ± 0.05 MB | 0.04 ± 0.05 MB |
|  | Heap → baseline | 257 ± 8 ms | 262 ± 1 ms |
|  | Hermes GCs during free | 0.00 ± 0.00  | 0.00 ± 0.00  |
| Data-bound property write | Per write | 6341 ± 382 ns | 20441 ± 232 ns |
|  | Throughput | 158166 ± 9803 /s | 48927 ± 562 /s |
| File load / dispose | Load | 5.30 ± 0.16 ms | 17.6 ± 0.8 ms |
|  | Dispose | 0.90 ± 0.02 ms | — |

<details><summary>Raw JSON</summary>

```json
{
  "device": "iPhone 13 mini",
  "os": "ios 26.5",
  "build": "release",
  "nitroVersion": "0.4.10",
  "legacyVersion": "9.8.3",
  "startedAt": 1782828937498,
  "runs": 5,
  "results": [
    {
      "scenario": "mount-latency-24",
      "title": "Show graphics on 24 views (2.9 MB)",
      "backend": "nitro",
      "params": {
        "asset": "jellyfish",
        "views": 24
      },
      "metrics": [
        {
          "key": "first",
          "label": "First view visible",
          "value": 34.75512498617172,
          "unit": "ms"
        },
        {
          "key": "all",
          "label": "All 24 views visible",
          "value": 34.77158397436142,
          "unit": "ms"
        }
      ],
      "run": 0,
      "ts": 1782828939232
    },
    {
      "scenario": "mount-latency-24",
      "title": "Show graphics on 24 views (2.9 MB)",
      "backend": "legacy",
      "params": {
        "asset": "jellyfish",
        "views": 24
      },
      "metrics": [
        {
          "key": "first",
          "label": "First view visible",
          "value": 2852.1190840005875,
          "unit": "ms"
        },
        {
          "key": "all",
          "label": "All 24 views visible",
          "value": 2853.0923749804497,
          "unit": "ms"
        }
      ],
      "run": 0,
      "ts": 1782828943602
    },
    {
      "scenario": "heap-added-6x",
      "title": "Heap added · 6× heavy file",
      "backend": "nitro",
      "params": {
        "asset": "jellyfish",
        "views": 6
      },
      "metrics": [
        {
          "key": "heapAdded",
          "label": "Heap added",
          "value": 19.088333129882812,
          "unit": "MB"
        },
        {
          "key": "footAdded",
          "label": "Footprint added",
          "value": 115.71886444091797,
          "unit": "MB"
        }
      ],
      "run": 0,
      "ts": 1782828948240
    },
    {
      "scenario": "heap-added-6x",
      "title": "Heap added · 6× heavy file",
      "backend": "legacy",
      "params": {
        "asset": "jellyfish",
        "views": 6
      },
      "metrics": [
        {
          "key": "heapAdded",
          "label": "Heap added",
          "value": 31.454269409179688,
          "unit": "MB"
        },
        {
          "key": "footAdded",
          "label": "Footprint added",
          "value": 524.8129119873047,
          "unit": "MB"
        }
      ],
      "run": 0,
      "ts": 1782828952891
    },
    {
      "scenario": "memory-freed",
      "title": "Memory freed on unmount",
      "backend": "nitro",
      "params": {
        "asset": "jellyfish",
        "views": 6
      },
      "metrics": [
        {
          "key": "footToBaseline",
          "label": "Footprint → baseline",
          "value": 253.45316702127457,
          "unit": "ms"
        },
        {
          "key": "footRes1s",
          "label": "Footprint residual @1s",
          "value": 0.203125,
          "unit": "MB"
        },
        {
          "key": "footRes5s",
          "label": "Footprint residual @5s",
          "value": 0.12497711181640625,
          "unit": "MB"
        },
        {
          "key": "footRes10s",
          "label": "Footprint residual @10s",
          "value": 0.04685211181640625,
          "unit": "MB"
        },
        {
          "key": "heapToBaseline",
          "label": "Heap → baseline",
          "value": 253.45316702127457,
          "unit": "ms"
        },
        {
          "key": "gcDuringFree",
          "label": "Hermes GCs during free",
          "value": 0,
          "unit": ""
        }
      ],
      "run": 0,
      "ts": 1782828967787
    },
    {
      "scenario": "memory-freed",
      "title": "Memory freed on unmount",
      "backend": "legacy",
      "params": {
        "asset": "jellyfish",
        "views": 6
      },
      "metrics": [
        {
          "key": "footToBaseline",
          "label": "Footprint → baseline",
          "value": 263.6826669573784,
          "unit": "ms"
        },
        {
          "key": "footRes1s",
          "label": "Footprint residual @1s",
          "value": 0.15627288818359375,
          "unit": "MB"
        },
        {
          "key": "footRes5s",
          "label": "Footprint residual @5s",
          "value": 0.15627288818359375,
          "unit": "MB"
        },
        {
          "key": "footRes10s",
          "label": "Footprint residual @10s",
          "value": 0.109375,
          "unit": "MB"
        },
        {
          "key": "heapToBaseline",
          "label": "Heap → baseline",
          "value": 263.6826669573784,
          "unit": "ms"
        },
        {
          "key": "gcDuringFree",
          "label": "Hermes GCs during free",
          "value": 0,
          "unit": ""
        }
      ],
      "run": 0,
      "ts": 1782828982484
    },
    {
      "scenario": "property-write",
      "title": "Data-bound property write",
      "backend": "nitro",
      "params": {
        "asset": "quick_start",
        "prop": "health",
        "writes": 2000
      },
      "metrics": [
        {
          "key": "ns",
          "label": "Per write",
          "value": 5776.500016450882,
          "unit": "ns"
        },
        {
          "key": "perSec",
          "label": "Throughput",
          "value": 173115.2076780234,
          "unit": "/s"
        }
      ],
      "run": 0,
      "ts": 1782828984357
    },
    {
      "scenario": "property-write",
      "title": "Data-bound property write",
      "backend": "legacy",
      "params": {
        "asset": "quick_start",
        "prop": "health",
        "writes": 2000
      },
      "metrics": [
        {
          "key": "ns",
          "label": "Per write",
          "value": 20048.770993947983,
          "unit": "ns"
        },
        {
          "key": "perSec",
          "label": "Throughput",
          "value": 49878.36911808034,
          "unit": "/s"
        }
      ],
      "run": 0,
      "ts": 1782828986875
    },
    {
      "scenario": "load-dispose",
      "title": "File load / dispose",
      "backend": "nitro",
      "params": {
        "asset": "counter",
        "runs": 10
      },
      "metrics": [
        {
          "key": "load",
          "label": "Load",
          "value": 5.243096095323563,
          "unit": "ms"
        },
        {
          "key": "dispose",
          "label": "Dispose",
          "value": 0.9007625102996826,
          "unit": "ms"
        }
      ],
      "run": 0,
      "ts": 1782828988575
    },
    {
      "scenario": "load-dispose",
      "title": "File load / dispose",
      "backend": "legacy",
      "params": {
        "asset": "counter",
        "runs": 10
      },
      "metrics": [
        {
          "key": "load",
          "label": "Load (mount→frame)",
          "value": 17.055541801452637,
          "unit": "ms"
        }
      ],
      "run": 0,
      "ts": 1782828990673
    },
    {
      "scenario": "mount-latency-24",
      "title": "Show graphics on 24 views (2.9 MB)",
      "backend": "nitro",
      "params": {
        "asset": "jellyfish",
        "views": 24
      },
      "metrics": [
        {
          "key": "first",
          "label": "First view visible",
          "value": 27.86337500810623,
          "unit": "ms"
        },
        {
          "key": "all",
          "label": "All 24 views visible",
          "value": 27.87941700220108,
          "unit": "ms"
        }
      ],
      "run": 1,
      "ts": 1782828992382
    },
    {
      "scenario": "mount-latency-24",
      "title": "Show graphics on 24 views (2.9 MB)",
      "backend": "legacy",
      "params": {
        "asset": "jellyfish",
        "views": 24
      },
      "metrics": [
        {
          "key": "first",
          "label": "First view visible",
          "value": 2701.145541012287,
          "unit": "ms"
        },
        {
          "key": "all",
          "label": "All 24 views visible",
          "value": 2702.1206250190735,
          "unit": "ms"
        }
      ],
      "run": 1,
      "ts": 1782828996606
    },
    {
      "scenario": "heap-added-6x",
      "title": "Heap added · 6× heavy file",
      "backend": "nitro",
      "params": {
        "asset": "jellyfish",
        "views": 6
      },
      "metrics": [
        {
          "key": "heapAdded",
          "label": "Heap added",
          "value": 18.9136962890625,
          "unit": "MB"
        },
        {
          "key": "footAdded",
          "label": "Footprint added",
          "value": 109.32819366455078,
          "unit": "MB"
        }
      ],
      "run": 1,
      "ts": 1782829001245
    },
    {
      "scenario": "heap-added-6x",
      "title": "Heap added · 6× heavy file",
      "backend": "legacy",
      "params": {
        "asset": "jellyfish",
        "views": 6
      },
      "metrics": [
        {
          "key": "heapAdded",
          "label": "Heap added",
          "value": 31.45574951171875,
          "unit": "MB"
        },
        {
          "key": "footAdded",
          "label": "Footprint added",
          "value": 524.6722412109375,
          "unit": "MB"
        }
      ],
      "run": 1,
      "ts": 1782829005901
    },
    {
      "scenario": "memory-freed",
      "title": "Memory freed on unmount",
      "backend": "nitro",
      "params": {
        "asset": "jellyfish",
        "views": 6
      },
      "metrics": [
        {
          "key": "footToBaseline",
          "label": "Footprint → baseline",
          "value": 250.55879098176956,
          "unit": "ms"
        },
        {
          "key": "footRes1s",
          "label": "Footprint residual @1s",
          "value": 2.859375,
          "unit": "MB"
        },
        {
          "key": "footRes5s",
          "label": "Footprint residual @5s",
          "value": 2.8125,
          "unit": "MB"
        },
        {
          "key": "footRes10s",
          "label": "Footprint residual @10s",
          "value": -0.01564788818359375,
          "unit": "MB"
        },
        {
          "key": "heapToBaseline",
          "label": "Heap → baseline",
          "value": 250.55879098176956,
          "unit": "ms"
        },
        {
          "key": "gcDuringFree",
          "label": "Hermes GCs during free",
          "value": 0,
          "unit": ""
        }
      ],
      "run": 1,
      "ts": 1782829020595
    },
    {
      "scenario": "memory-freed",
      "title": "Memory freed on unmount",
      "backend": "legacy",
      "params": {
        "asset": "jellyfish",
        "views": 6
      },
      "metrics": [
        {
          "key": "footToBaseline",
          "label": "Footprint → baseline",
          "value": 261.59591698646545,
          "unit": "ms"
        },
        {
          "key": "footRes1s",
          "label": "Footprint residual @1s",
          "value": 0.109375,
          "unit": "MB"
        },
        {
          "key": "footRes5s",
          "label": "Footprint residual @5s",
          "value": 0.04685211181640625,
          "unit": "MB"
        },
        {
          "key": "footRes10s",
          "label": "Footprint residual @10s",
          "value": 0.04685211181640625,
          "unit": "MB"
        },
        {
          "key": "heapToBaseline",
          "label": "Heap → baseline",
          "value": 261.59591698646545,
          "unit": "ms"
        },
        {
          "key": "gcDuringFree",
          "label": "Hermes GCs during free",
          "value": 0,
          "unit": ""
        }
      ],
      "run": 1,
      "ts": 1782829035499
    },
    {
      "scenario": "property-write",
      "title": "Data-bound property write",
      "backend": "nitro",
      "params": {
        "asset": "quick_start",
        "prop": "health",
        "writes": 2000
      },
      "metrics": [
        {
          "key": "ns",
          "label": "Per write",
          "value": 6492.853999137878,
          "unit": "ns"
        },
        {
          "key": "perSec",
          "label": "Throughput",
          "value": 154015.47611154974,
          "unit": "/s"
        }
      ],
      "run": 1,
      "ts": 1782829037375
    },
    {
      "scenario": "property-write",
      "title": "Data-bound property write",
      "backend": "legacy",
      "params": {
        "asset": "quick_start",
        "prop": "health",
        "writes": 2000
      },
      "metrics": [
        {
          "key": "ns",
          "label": "Per write",
          "value": 20423.395484685898,
          "unit": "ns"
        },
        {
          "key": "perSec",
          "label": "Throughput",
          "value": 48963.45471789112,
          "unit": "/s"
        }
      ],
      "run": 1,
      "ts": 1782829039892
    },
    {
      "scenario": "load-dispose",
      "title": "File load / dispose",
      "backend": "nitro",
      "params": {
        "asset": "counter",
        "runs": 10
      },
      "metrics": [
        {
          "key": "load",
          "label": "Load",
          "value": 5.091254311800003,
          "unit": "ms"
        },
        {
          "key": "dispose",
          "label": "Dispose",
          "value": 0.8684206008911133,
          "unit": "ms"
        }
      ],
      "run": 1,
      "ts": 1782829041591
    },
    {
      "scenario": "load-dispose",
      "title": "File load / dispose",
      "backend": "legacy",
      "params": {
        "asset": "counter",
        "runs": 10
      },
      "metrics": [
        {
          "key": "load",
          "label": "Load (mount→frame)",
          "value": 17.108654105663298,
          "unit": "ms"
        }
      ],
      "run": 1,
      "ts": 1782829043688
    },
    {
      "scenario": "mount-latency-24",
      "title": "Show graphics on 24 views (2.9 MB)",
      "backend": "nitro",
      "params": {
        "asset": "jellyfish",
        "views": 24
      },
      "metrics": [
        {
          "key": "first",
          "label": "First view visible",
          "value": 27.061833024024963,
          "unit": "ms"
        },
        {
          "key": "all",
          "label": "All 24 views visible",
          "value": 27.077832996845245,
          "unit": "ms"
        }
      ],
      "run": 2,
      "ts": 1782829045396
    },
    {
      "scenario": "mount-latency-24",
      "title": "Show graphics on 24 views (2.9 MB)",
      "backend": "legacy",
      "params": {
        "asset": "jellyfish",
        "views": 24
      },
      "metrics": [
        {
          "key": "first",
          "label": "First view visible",
          "value": 2658.1481249928474,
          "unit": "ms"
        },
        {
          "key": "all",
          "label": "All 24 views visible",
          "value": 2659.142458021641,
          "unit": "ms"
        }
      ],
      "run": 2,
      "ts": 1782829049581
    },
    {
      "scenario": "heap-added-6x",
      "title": "Heap added · 6× heavy file",
      "backend": "nitro",
      "params": {
        "asset": "jellyfish",
        "views": 6
      },
      "metrics": [
        {
          "key": "heapAdded",
          "label": "Heap added",
          "value": 18.948333740234375,
          "unit": "MB"
        },
        {
          "key": "footAdded",
          "label": "Footprint added",
          "value": 109.35942077636719,
          "unit": "MB"
        }
      ],
      "run": 2,
      "ts": 1782829054220
    },
    {
      "scenario": "heap-added-6x",
      "title": "Heap added · 6× heavy file",
      "backend": "legacy",
      "params": {
        "asset": "jellyfish",
        "views": 6
      },
      "metrics": [
        {
          "key": "heapAdded",
          "label": "Heap added",
          "value": 31.441421508789062,
          "unit": "MB"
        },
        {
          "key": "footAdded",
          "label": "Footprint added",
          "value": 524.6097183227539,
          "unit": "MB"
        }
      ],
      "run": 2,
      "ts": 1782829058873
    },
    {
      "scenario": "memory-freed",
      "title": "Memory freed on unmount",
      "backend": "nitro",
      "params": {
        "asset": "jellyfish",
        "views": 6
      },
      "metrics": [
        {
          "key": "footToBaseline",
          "label": "Footprint → baseline",
          "value": 264.82766604423523,
          "unit": "ms"
        },
        {
          "key": "footRes1s",
          "label": "Footprint residual @1s",
          "value": 2.8125,
          "unit": "MB"
        },
        {
          "key": "footRes5s",
          "label": "Footprint residual @5s",
          "value": 2.78125,
          "unit": "MB"
        },
        {
          "key": "footRes10s",
          "label": "Footprint residual @10s",
          "value": -0.0625457763671875,
          "unit": "MB"
        },
        {
          "key": "heapToBaseline",
          "label": "Heap → baseline",
          "value": 264.82766604423523,
          "unit": "ms"
        },
        {
          "key": "gcDuringFree",
          "label": "Hermes GCs during free",
          "value": 0,
          "unit": ""
        }
      ],
      "run": 2,
      "ts": 1782829073643
    },
    {
      "scenario": "memory-freed",
      "title": "Memory freed on unmount",
      "backend": "legacy",
      "params": {
        "asset": "jellyfish",
        "views": 6
      },
      "metrics": [
        {
          "key": "footToBaseline",
          "label": "Footprint → baseline",
          "value": 259.987625002861,
          "unit": "ms"
        },
        {
          "key": "footRes1s",
          "label": "Footprint residual @1s",
          "value": 0.10939788818359375,
          "unit": "MB"
        },
        {
          "key": "footRes5s",
          "label": "Footprint residual @5s",
          "value": 0.10939788818359375,
          "unit": "MB"
        },
        {
          "key": "footRes10s",
          "label": "Footprint residual @10s",
          "value": 0.03125,
          "unit": "MB"
        },
        {
          "key": "heapToBaseline",
          "label": "Heap → baseline",
          "value": 259.987625002861,
          "unit": "ms"
        },
        {
          "key": "gcDuringFree",
          "label": "Hermes GCs during free",
          "value": 0,
          "unit": ""
        }
      ],
      "run": 2,
      "ts": 1782829088409
    },
    {
      "scenario": "property-write",
      "title": "Data-bound property write",
      "backend": "nitro",
      "params": {
        "asset": "quick_start",
        "prop": "health",
        "writes": 2000
      },
      "metrics": [
        {
          "key": "ns",
          "label": "Per write",
          "value": 6175.478994846344,
          "unit": "ns"
        },
        {
          "key": "perSec",
          "label": "Throughput",
          "value": 161930.75886656492,
          "unit": "/s"
        }
      ],
      "run": 2,
      "ts": 1782829090286
    },
    {
      "scenario": "property-write",
      "title": "Data-bound property write",
      "backend": "legacy",
      "params": {
        "asset": "quick_start",
        "prop": "health",
        "writes": 2000
      },
      "metrics": [
        {
          "key": "ns",
          "label": "Per write",
          "value": 20547.646015882492,
          "unit": "ns"
        },
        {
          "key": "perSec",
          "label": "Throughput",
          "value": 48667.37529092339,
          "unit": "/s"
        }
      ],
      "run": 2,
      "ts": 1782829092804
    },
    {
      "scenario": "load-dispose",
      "title": "File load / dispose",
      "backend": "nitro",
      "params": {
        "asset": "counter",
        "runs": 10
      },
      "metrics": [
        {
          "key": "load",
          "label": "Load",
          "value": 5.491962498426437,
          "unit": "ms"
        },
        {
          "key": "dispose",
          "label": "Dispose",
          "value": 0.8843165934085846,
          "unit": "ms"
        }
      ],
      "run": 2,
      "ts": 1782829094504
    },
    {
      "scenario": "load-dispose",
      "title": "File load / dispose",
      "backend": "legacy",
      "params": {
        "asset": "counter",
        "runs": 10
      },
      "metrics": [
        {
          "key": "load",
          "label": "Load (mount→frame)",
          "value": 18.353858399391175,
          "unit": "ms"
        }
      ],
      "run": 2,
      "ts": 1782829096617
    },
    {
      "scenario": "mount-latency-24",
      "title": "Show graphics on 24 views (2.9 MB)",
      "backend": "nitro",
      "params": {
        "asset": "jellyfish",
        "views": 24
      },
      "metrics": [
        {
          "key": "first",
          "label": "First view visible",
          "value": 27.17900002002716,
          "unit": "ms"
        },
        {
          "key": "all",
          "label": "All 24 views visible",
          "value": 27.195333003997803,
          "unit": "ms"
        }
      ],
      "run": 3,
      "ts": 1782829098325
    },
    {
      "scenario": "mount-latency-24",
      "title": "Show graphics on 24 views (2.9 MB)",
      "backend": "legacy",
      "params": {
        "asset": "jellyfish",
        "views": 24
      },
      "metrics": [
        {
          "key": "first",
          "label": "First view visible",
          "value": 2722.429166972637,
          "unit": "ms"
        },
        {
          "key": "all",
          "label": "All 24 views visible",
          "value": 2723.4117089509964,
          "unit": "ms"
        }
      ],
      "run": 3,
      "ts": 1782829102572
    },
    {
      "scenario": "heap-added-6x",
      "title": "Heap added · 6× heavy file",
      "backend": "nitro",
      "params": {
        "asset": "jellyfish",
        "views": 6
      },
      "metrics": [
        {
          "key": "heapAdded",
          "label": "Heap added",
          "value": 18.936599731445312,
          "unit": "MB"
        },
        {
          "key": "footAdded",
          "label": "Footprint added",
          "value": 114.2187728881836,
          "unit": "MB"
        }
      ],
      "run": 3,
      "ts": 1782829107219
    },
    {
      "scenario": "heap-added-6x",
      "title": "Heap added · 6× heavy file",
      "backend": "legacy",
      "params": {
        "asset": "jellyfish",
        "views": 6
      },
      "metrics": [
        {
          "key": "heapAdded",
          "label": "Heap added",
          "value": 31.44970703125,
          "unit": "MB"
        },
        {
          "key": "footAdded",
          "label": "Footprint added",
          "value": 524.7034683227539,
          "unit": "MB"
        }
      ],
      "run": 3,
      "ts": 1782829111872
    },
    {
      "scenario": "memory-freed",
      "title": "Memory freed on unmount",
      "backend": "nitro",
      "params": {
        "asset": "jellyfish",
        "views": 6
      },
      "metrics": [
        {
          "key": "footToBaseline",
          "label": "Footprint → baseline",
          "value": 250.79654198884964,
          "unit": "ms"
        },
        {
          "key": "footRes1s",
          "label": "Footprint residual @1s",
          "value": 2.890625,
          "unit": "MB"
        },
        {
          "key": "footRes5s",
          "label": "Footprint residual @5s",
          "value": 2.8437271118164062,
          "unit": "MB"
        },
        {
          "key": "footRes10s",
          "label": "Footprint residual @10s",
          "value": -0.07819366455078125,
          "unit": "MB"
        },
        {
          "key": "heapToBaseline",
          "label": "Heap → baseline",
          "value": 250.79654198884964,
          "unit": "ms"
        },
        {
          "key": "gcDuringFree",
          "label": "Hermes GCs during free",
          "value": 0,
          "unit": ""
        }
      ],
      "run": 3,
      "ts": 1782829126636
    },
    {
      "scenario": "memory-freed",
      "title": "Memory freed on unmount",
      "backend": "legacy",
      "params": {
        "asset": "jellyfish",
        "views": 6
      },
      "metrics": [
        {
          "key": "footToBaseline",
          "label": "Footprint → baseline",
          "value": 261.1581249833107,
          "unit": "ms"
        },
        {
          "key": "footRes1s",
          "label": "Footprint residual @1s",
          "value": 0.015625,
          "unit": "MB"
        },
        {
          "key": "footRes5s",
          "label": "Footprint residual @5s",
          "value": 0.015625,
          "unit": "MB"
        },
        {
          "key": "footRes10s",
          "label": "Footprint residual @10s",
          "value": -0.03125,
          "unit": "MB"
        },
        {
          "key": "heapToBaseline",
          "label": "Heap → baseline",
          "value": 261.1581249833107,
          "unit": "ms"
        },
        {
          "key": "gcDuringFree",
          "label": "Hermes GCs during free",
          "value": 0,
          "unit": ""
        }
      ],
      "run": 3,
      "ts": 1782829141445
    },
    {
      "scenario": "property-write",
      "title": "Data-bound property write",
      "backend": "nitro",
      "params": {
        "asset": "quick_start",
        "prop": "health",
        "writes": 2000
      },
      "metrics": [
        {
          "key": "ns",
          "label": "Per write",
          "value": 6781.562507152557,
          "unit": "ns"
        },
        {
          "key": "perSec",
          "label": "Throughput",
          "value": 147458.6423033473,
          "unit": "/s"
        }
      ],
      "run": 3,
      "ts": 1782829143321
    },
    {
      "scenario": "property-write",
      "title": "Data-bound property write",
      "backend": "legacy",
      "params": {
        "asset": "quick_start",
        "prop": "health",
        "writes": 2000
      },
      "metrics": [
        {
          "key": "ns",
          "label": "Per write",
          "value": 20639.93749022484,
          "unit": "ns"
        },
        {
          "key": "perSec",
          "label": "Throughput",
          "value": 48449.75913679992,
          "unit": "/s"
        }
      ],
      "run": 3,
      "ts": 1782829145839
    },
    {
      "scenario": "load-dispose",
      "title": "File load / dispose",
      "backend": "nitro",
      "params": {
        "asset": "counter",
        "runs": 10
      },
      "metrics": [
        {
          "key": "load",
          "label": "Load",
          "value": 5.262862604856491,
          "unit": "ms"
        },
        {
          "key": "dispose",
          "label": "Dispose",
          "value": 0.9116334080696106,
          "unit": "ms"
        }
      ],
      "run": 3,
      "ts": 1782829147539
    },
    {
      "scenario": "load-dispose",
      "title": "File load / dispose",
      "backend": "legacy",
      "params": {
        "asset": "counter",
        "runs": 10
      },
      "metrics": [
        {
          "key": "load",
          "label": "Load (mount→frame)",
          "value": 18.6579873919487,
          "unit": "ms"
        }
      ],
      "run": 3,
      "ts": 1782829149653
    },
    {
      "scenario": "mount-latency-24",
      "title": "Show graphics on 24 views (2.9 MB)",
      "backend": "nitro",
      "params": {
        "asset": "jellyfish",
        "views": 24
      },
      "metrics": [
        {
          "key": "first",
          "label": "First view visible",
          "value": 26.9650000333786,
          "unit": "ms"
        },
        {
          "key": "all",
          "label": "All 24 views visible",
          "value": 26.981250047683716,
          "unit": "ms"
        }
      ],
      "run": 4,
      "ts": 1782829151361
    },
    {
      "scenario": "mount-latency-24",
      "title": "Show graphics on 24 views (2.9 MB)",
      "backend": "legacy",
      "params": {
        "asset": "jellyfish",
        "views": 24
      },
      "metrics": [
        {
          "key": "first",
          "label": "First view visible",
          "value": 2641.1851249933243,
          "unit": "ms"
        },
        {
          "key": "all",
          "label": "All 24 views visible",
          "value": 2642.1624590158463,
          "unit": "ms"
        }
      ],
      "run": 4,
      "ts": 1782829155525
    },
    {
      "scenario": "heap-added-6x",
      "title": "Heap added · 6× heavy file",
      "backend": "nitro",
      "params": {
        "asset": "jellyfish",
        "views": 6
      },
      "metrics": [
        {
          "key": "heapAdded",
          "label": "Heap added",
          "value": 18.911834716796875,
          "unit": "MB"
        },
        {
          "key": "footAdded",
          "label": "Footprint added",
          "value": 113.43754577636719,
          "unit": "MB"
        }
      ],
      "run": 4,
      "ts": 1782829160174
    },
    {
      "scenario": "heap-added-6x",
      "title": "Heap added · 6× heavy file",
      "backend": "legacy",
      "params": {
        "asset": "jellyfish",
        "views": 6
      },
      "metrics": [
        {
          "key": "heapAdded",
          "label": "Heap added",
          "value": 31.475799560546875,
          "unit": "MB"
        },
        {
          "key": "footAdded",
          "label": "Footprint added",
          "value": 524.9065704345703,
          "unit": "MB"
        }
      ],
      "run": 4,
      "ts": 1782829164828
    },
    {
      "scenario": "memory-freed",
      "title": "Memory freed on unmount",
      "backend": "nitro",
      "params": {
        "asset": "jellyfish",
        "views": 6
      },
      "metrics": [
        {
          "key": "footToBaseline",
          "label": "Footprint → baseline",
          "value": 266.6241250038147,
          "unit": "ms"
        },
        {
          "key": "footRes1s",
          "label": "Footprint residual @1s",
          "value": 2.828125,
          "unit": "MB"
        },
        {
          "key": "footRes5s",
          "label": "Footprint residual @5s",
          "value": 2.796875,
          "unit": "MB"
        },
        {
          "key": "footRes10s",
          "label": "Footprint residual @10s",
          "value": -0.03127288818359375,
          "unit": "MB"
        },
        {
          "key": "heapToBaseline",
          "label": "Heap → baseline",
          "value": 266.6241250038147,
          "unit": "ms"
        },
        {
          "key": "gcDuringFree",
          "label": "Hermes GCs during free",
          "value": 0,
          "unit": ""
        }
      ],
      "run": 4,
      "ts": 1782829179654
    },
    {
      "scenario": "memory-freed",
      "title": "Memory freed on unmount",
      "backend": "legacy",
      "params": {
        "asset": "jellyfish",
        "views": 6
      },
      "metrics": [
        {
          "key": "footToBaseline",
          "label": "Footprint → baseline",
          "value": 261.531750023365,
          "unit": "ms"
        },
        {
          "key": "footRes1s",
          "label": "Footprint residual @1s",
          "value": 0.109375,
          "unit": "MB"
        },
        {
          "key": "footRes5s",
          "label": "Footprint residual @5s",
          "value": 0.0625,
          "unit": "MB"
        },
        {
          "key": "footRes10s",
          "label": "Footprint residual @10s",
          "value": 0.03125,
          "unit": "MB"
        },
        {
          "key": "heapToBaseline",
          "label": "Heap → baseline",
          "value": 261.531750023365,
          "unit": "ms"
        },
        {
          "key": "gcDuringFree",
          "label": "Hermes GCs during free",
          "value": 0,
          "unit": ""
        }
      ],
      "run": 4,
      "ts": 1782829194444
    },
    {
      "scenario": "property-write",
      "title": "Data-bound property write",
      "backend": "nitro",
      "params": {
        "asset": "quick_start",
        "prop": "health",
        "writes": 2000
      },
      "metrics": [
        {
          "key": "ns",
          "label": "Per write",
          "value": 6480.437517166138,
          "unit": "ns"
        },
        {
          "key": "perSec",
          "label": "Throughput",
          "value": 154310.56890080083,
          "unit": "/s"
        }
      ],
      "run": 4,
      "ts": 1782829196321
    },
    {
      "scenario": "property-write",
      "title": "Data-bound property write",
      "backend": "legacy",
      "params": {
        "asset": "quick_start",
        "prop": "health",
        "writes": 2000
      },
      "metrics": [
        {
          "key": "ns",
          "label": "Per write",
          "value": 20543.72951388359,
          "unit": "ns"
        },
        {
          "key": "perSec",
          "label": "Throughput",
          "value": 48676.65334691022,
          "unit": "/s"
        }
      ],
      "run": 4,
      "ts": 1782829198840
    },
    {
      "scenario": "load-dispose",
      "title": "File load / dispose",
      "backend": "nitro",
      "params": {
        "asset": "counter",
        "runs": 10
      },
      "metrics": [
        {
          "key": "load",
          "label": "Load",
          "value": 5.4357167959213255,
          "unit": "ms"
        },
        {
          "key": "dispose",
          "label": "Dispose",
          "value": 0.9137208938598633,
          "unit": "ms"
        }
      ],
      "run": 4,
      "ts": 1782829200539
    },
    {
      "scenario": "load-dispose",
      "title": "File load / dispose",
      "backend": "legacy",
      "params": {
        "asset": "counter",
        "runs": 10
      },
      "metrics": [
        {
          "key": "load",
          "label": "Load (mount→frame)",
          "value": 17.040216505527496,
          "unit": "ms"
        }
      ],
      "run": 4,
      "ts": 1782829202635
    }
  ]
}
```
</details>
