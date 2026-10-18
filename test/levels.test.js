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
