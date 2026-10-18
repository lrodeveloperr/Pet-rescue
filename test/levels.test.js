import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../src/levels.js';
import { parseLevel, createState, solve, COMPANIONS, FRIENDS } from '../src/logic.js';

// Companions the player has rescued before reaching each level for the first time.
function ownedBefore(index) {
  const owned = [];
  for (const def of LEVELS.slice(0, index)) {
    const { pet } = parseLevel(def);
    if (COMPANIONS.includes(pet) && !owned.includes(pet)) owned.push(pet);
  }
  return owned;
}

test('level ids are 1..n in order', () => {
  assert.deepEqual(LEVELS.map((l) => l.id), LEVELS.map((_, i) => i + 1));
});

test('each companion is introduced exactly once, before the friends', () => {
  const pets = LEVELS.map((d) => parseLevel(d).pet);
  assert.deepEqual(pets.slice(0, COMPANIONS.length), COMPANIONS);
  for (const p of pets.slice(COMPANIONS.length)) assert.ok(FRIENDS.includes(p), `${p} is a friend`);
});

LEVELS.forEach((def, i) => {
  const level = parseLevel(def);
  const owned = ownedBefore(i);

  test(`level ${def.id}: solvable with the companions rescued so far`, () => {
    const r = solve(createState(level, owned));
    assert.equal(r.solved, true, `unsolvable (nodes=${r.nodes}, exhausted=${r.exhausted})`);
  });

  test(`level ${def.id}: solvable when replayed with every companion`, () => {
    assert.equal(solve(createState(level, COMPANIONS)).solved, true);
  });

  if (COMPANIONS.includes(level.pet) && i > 0) {
    test(`level ${def.id}: escape needs the newly rescued ${level.pet}`, () => {
      const r = solve(createState(level, owned), { grantOnRescue: false });
      assert.equal(r.solved, false);
      assert.equal(r.exhausted, false);
    });
  }

  if (i >= 1) {
    test(`level ${def.id}: every previously rescued companion is not optional decoration`, () => {
      // Introduction levels need the companion from the level before; combination levels need at least two.
      const needed = owned.filter((c) => !solve(createState(level, owned.filter((o) => o !== c))).solved);
      const minimum = i < COMPANIONS.length ? 1 : 2;
      assert.ok(needed.length >= minimum, `needs only [${needed}]`);
    });
  }
});
