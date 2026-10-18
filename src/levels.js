// The campaign: 100 worlds of 50 levels, plus the daily-puzzle pool. Levels are generated and
// solver-verified by scripts/generate-levels.mjs.
// Worlds 1-6 (and the daily pool) ship in the main bundle. Worlds 7 onward are one small file
// each, loaded only when the player gets near them, so startup stays as fast as with 300 levels.
import { WORLDS as FIRST, DAILY } from './levels/campaign.js';
import { MORE_WORLDS, LOADERS } from './levels/worlds/index.js';

// The six visual themes, in order; each later world uses one of them.
export const THEMES = ['meadow', 'river', 'snow', 'farm', 'canyon', 'woods'];

// The mechanic each theme introduces (shown on the world tab and in teasers).
export const WORLD_MECHANIC = { meadow: null, river: 'current', snow: 'ice', farm: 'gate', canyon: 'bridge', woods: 'burrow' };

let offset = 0;
export const WORLDS = [
  ...FIRST.map((w) => ({ key: w.key, theme: w.key, count: w.levels.length, levels: w.levels })),
  ...MORE_WORLDS.map((w) => ({ key: w.key, theme: w.theme, count: w.count, levels: null })),
].map((w, index) => {
  const world = { ...w, index, first: offset, loaded: Boolean(w.levels) };
  offset += w.count;
  return world;
});

// Every level has an entry from the start (id, world, number), so progress, unlocking and the
// map work before a world's file is loaded. Loading a world fills in its maps.
export const LEVELS = WORLDS.flatMap((w) =>
  Array.from({ length: w.count }, (_, k) => ({
    id: `${w.key}-${k + 1}`,
    ...(w.levels ? w.levels[k] : {}),
    world: w.key,
    theme: w.theme,
    worldIndex: w.index,
    number: k + 1,
  })),
);

export const LEVEL_INDEX = new Map(LEVELS.map((l, i) => [l.id, i]));

/** The level entries of world `w`. */
export function worldLevels(w) {
  const world = WORLDS[w];
  return LEVELS.slice(world.first, world.first + world.count);
}

export function isLoaded(i) {
  return WORLDS[LEVELS[i].worldIndex].loaded;
}

const loading = new Map();

/** Loads world `w` (a no-op for worlds already loaded); resolves when its levels are playable. */
export function loadWorld(w) {
  const world = WORLDS[w];
  if (!world || world.loaded) return Promise.resolve(world);
  if (!loading.has(w)) {
    loading.set(
      w,
      LOADERS[world.key]().then(({ WORLD }) => {
        WORLD.levels.forEach((l, k) => Object.assign(LEVELS[world.first + k], l, { world: world.key, theme: world.theme }));
        world.loaded = true;
        return world;
      }),
    );
  }
  return loading.get(w);
}

export { DAILY };
