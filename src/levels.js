// The campaign: six worlds of 50 levels each, plus the daily-puzzle pool.
// Levels are generated and solver-verified by scripts/generate-levels.mjs.
import { WORLDS as GENERATED, DAILY } from './levels/campaign.js';

// The mechanic each world introduces (shown on the world tab).
export const WORLD_MECHANIC = { meadow: null, river: 'current', snow: 'ice', farm: 'gate', canyon: 'bridge', woods: 'burrow' };

export const WORLDS = GENERATED.map((w, index) => ({ key: w.key, index, levels: w.levels }));

export const LEVELS = WORLDS.flatMap((w) =>
  w.levels.map((level, k) => ({ ...level, world: w.key, worldIndex: w.index, number: k + 1 })),
);

export const LEVEL_INDEX = new Map(LEVELS.map((l, i) => [l.id, i]));

export { DAILY };
