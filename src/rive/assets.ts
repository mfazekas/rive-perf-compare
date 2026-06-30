export type RiveAsset = {
  id: string;
  label: string;
  /** Approximate on-disk size of the .riv, in KB. */
  sizeKB: number;
  /** Whether the file contains state machines / scripting / data binding. */
  scripted: boolean;
  /** require()'d module id, accepted by both libs (nitro `source`, legacy `source`). */
  source: number;
};

export const ASSETS: Record<string, RiveAsset> = {
  reactive: {
    id: 'reactive',
    label: 'Reactive (formula: input → output)',
    sizeKB: 1,
    scripted: true,
    source: require('../../assets/rive/reactive-binding.riv'),
  },
  reactiveSm: {
    id: 'reactiveSm',
    label: 'Reactive (state-machine transitions)',
    sizeKB: 1,
    scripted: true,
    source: require('../../assets/rive/reactive-binding-sm.riv'),
  },
  reactiveMulti: {
    id: 'reactiveMulti',
    label: 'Reactive (1 input → 6 outputs)',
    sizeKB: 1,
    scripted: true,
    source: require('../../assets/rive/reactive-binding-multi.riv'),
  },
  jellyfish: {
    id: 'jellyfish',
    label: 'Jellyfish (heavy, 2.9 MB · no scripting)',
    sizeKB: 2986,
    scripted: false,
    source: require('../../assets/rive/jellyfish.riv'),
  },
  paper: {
    id: 'paper',
    label: 'Paper (heavy, 2.3 MB · no scripting)',
    sizeKB: 2348,
    scripted: false,
    source: require('../../assets/rive/paper.riv'),
  },
  blinko: {
    id: 'blinko',
    label: 'Blinko (heavy, 2.6 MB · 8 state machines + databinding)',
    sizeKB: 2625,
    scripted: true,
    source: require('../../assets/rive/blinko.riv'),
  },
  counter: {
    id: 'counter',
    label: 'Counter (857 KB · databinding)',
    sizeKB: 857,
    scripted: true,
    source: require('../../assets/rive/counter.riv'),
  },
  rewards: {
    id: 'rewards',
    label: 'Rewards (212 KB)',
    sizeKB: 212,
    scripted: true,
    source: require('../../assets/rive/rewards.riv'),
  },
  quick_start: {
    id: 'quick_start',
    label: 'Quick start (190 KB)',
    sizeKB: 190,
    scripted: true,
    source: require('../../assets/rive/quick_start.riv'),
  },
  rating: {
    id: 'rating',
    label: 'Rating (16 KB)',
    sizeKB: 16,
    scripted: true,
    source: require('../../assets/rive/rating.riv'),
  },
};

export const ASSET_LIST = Object.values(ASSETS);
