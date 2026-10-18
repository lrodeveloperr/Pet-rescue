import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, WORLDS, DAILY, WORLD_MECHANIC } from '../src/levels.js';
import { parseLevel, createState, solve, COMPANIONS } from '../src/logic.js';
import { ALL_ANIMALS, WORLD_FRIENDS } from '../src/species.js';
import { canonical } from '../scripts/levelgen/core.mjs';

// Companions the player has rescued before reaching each level for the first time.
function ownedBefore(index) {
  const owned = [];
  for (const def of LEVELS.slice(0, index)) {
    const { pet } = parseLevel(def);
    if (COMPANIONS.includes(pet) && !owned.includes(pet)) owned.push(pet);
  }
  return owned;
}

const MECHANIC_TILES = { current: /[<>^v]/, ice: /\*/, gate: /g/, bridge: /%/, burrow: /[()[\]]/ };

test('six worlds of fifty levels with unique ids', () => {
  assert.equal(WORLDS.length, 6);
  for (const w of WORLDS) assert.equal(w.levels.length, 50, w.key);
  assert.equal(new Set(LEVELS.map((l) => l.id)).size, LEVELS.length);
});

test('no two campaign or daily levels are the same map, even rotated or mirrored', () => {
  const seen = new Set();
  for (const def of [...LEVELS, ...DAILY]) {
    const c = canonical(def.map);
    assert.ok(!seen.has(c), `${def.id} duplicates another level`);
    seen.add(c);
  }
});

test('the four companions are introduced in order on the first four levels', () => {
  assert.deepEqual(LEVELS.slice(0, 4).map((l) => parseLevel(l).pet), COMPANIONS);
  for (const l of LEVELS.slice(4)) assert.ok(ALL_ANIMALS.includes(l.pet) && !COMPANIONS.includes(l.pet), `${l.id} rescues a friend`);
});

test('each world rescues its own friends and uses its mechanic', () => {
  WORLDS.forEach((w, k) => {
    const pets = new Set(w.levels.slice(4).map((l) => l.pet));
    for (const p of pets) assert.ok(WORLD_FRIENDS[k].includes(p), `${p} belongs to ${w.key}`);
    const mech = WORLD_MECHANIC[w.key];
    if (!mech) return;
    for (const l of w.levels) {
      const uses = MECHANIC_TILES[mech].test(l.map.join('')) || (w.key === 'woods' && l.bees?.length);
      assert.ok(uses, `${l.id} uses the ${w.key} mechanic`);
    }
  });
});

const HANDMADE_LONG = [8, 11, 12];

test('the long hand-made levels (33–39 moves) left the campaign for the daily pool', async () => {
  const { HANDMADE } = await import('../src/levels/handmade.js');
  const maps = new Set(LEVELS.map((l) => canonical(l.map)));
  for (const n of HANDMADE_LONG) {
    assert.ok(!maps.has(canonical(HANDMADE[n - 1].map)), `hand-made ${n} is not in the campaign`);
    assert.ok(DAILY.some((d) => canonical(d.map) === canonical(HANDMADE[n - 1].map)), `hand-made ${n} is a daily puzzle`);
  }
});

test('the first session stays short', () => {
  for (const l of LEVELS.slice(0, 12)) assert.ok(l.par <= 28, `${l.id} par ${l.par}`);
});

test('worlds 2–6 open with two lesson levels that introduce their mechanic', () => {
  for (const w of WORLDS.slice(1)) {
    const mech = WORLD_MECHANIC[w.key];
    assert.deepEqual(w.levels[0].intro, [mech], `${w.key} level 1 introduces ${mech}`);
    for (const l of w.levels.slice(0, 2)) assert.ok(l.lesson, `${l.id} is a lesson`);
    for (const l of w.levels.slice(0, 2)) assert.ok(l.dead <= 0.35, `${l.id} lesson has few dead positions`);
  }
  const beeLesson = LEVELS.find((l) => l.intro?.includes('bees'));
  assert.ok(beeLesson && beeLesson.worldIndex === 0 && beeLesson.bees?.length, 'bees are introduced in the meadow');
});

test('something new (an element or a mix) arrives regularly in every world after the first', () => {
  for (const w of WORLDS.slice(1)) {
    const at = w.levels.map((l, k) => (l.intro ? k : -1)).filter((k) => k >= 0);
    assert.ok(at.length >= 3, `${w.key} has ${at.length} intros`);
  }
});

test('dead positions are rare outside spike levels', () => {
  for (const l of LEVELS) {
    // Lessons have their own cap, checked above (bridge lessons allow more: every crossing breaks one).
    if (l.handmade || l.spike || l.lesson || l.dead === undefined) continue;
    assert.ok(l.dead <= 0.3, `${l.id} dead fraction ${l.dead}`);
  }
});

test('the core choice survives: many generated levels need two or more companions', () => {
  const later = LEVELS.filter((l) => l.worldIndex > 0 && Array.isArray(l.needs));
  const two = later.filter((l) => l.needs.length >= 2).length;
  assert.ok(two / later.length >= 0.4, `${two} of ${later.length} levels in worlds 2–6 need two or more companions`);
});

// Every fifth level: each companion recorded as needed really is needed.
LEVELS.filter((l, i) => i % 5 === 0 && Array.isArray(l.needs) && l.needs.length).forEach((def) => {
  test(`${def.id}: needs ${def.needs.join(' + ')}`, () => {
    for (const c of def.needs) {
      const r = solve(createState(parseLevel(def), COMPANIONS.filter((o) => o !== c)), { maxNodes: 400000 });
      assert.equal(r.solved, false, `solvable without ${c}`);
    }
  });
});

test('the daily pool lasts more than a year', () => {
  assert.ok(DAILY.length >= 366, `${DAILY.length} daily puzzles`);
});

LEVELS.forEach((def, i) => {
  test(`${def.id}: solvable in exactly par (${def.par}) moves with the companions available`, () => {
    const owned = def.worldIndex === 0 ? ownedBefore(i) : COMPANIONS;
    const r = solve(createState(parseLevel(def), owned));
    assert.equal(r.solved, true, `unsolvable (nodes=${r.nodes}, exhausted=${r.exhausted})`);
    assert.equal(r.moves, def.par);
  });
});

LEVELS.slice(1, 4).forEach((def, k) => {
  test(`${def.id}: escape needs the newly rescued ${parseLevel(def).pet}`, () => {
    const r = solve(createState(parseLevel(def), ownedBefore(k + 1)), { grantOnRescue: false });
    assert.equal(r.solved, false);
    assert.equal(r.exhausted, false);
  });
});

test('every daily puzzle is solvable in par moves', () => {
  for (const def of DAILY) {
    const r = solve(createState(parseLevel(def), COMPANIONS));
    assert.equal(r.solved, true, def.id);
    assert.equal(r.moves, def.par, def.id);
  }
});
