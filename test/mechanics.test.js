import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLevel, createState, step, setActive, findPath, solve, rotateLevel, gatesOpen, beePositions } from '../src/logic.js';

const make = (map, owned = [], extra = {}) => createState(parseLevel({ id: 't', pet: 'kitten', map, ...extra }), owned);
const idx = (s, x, y) => y * s.w + x;

test('ice: the rescuer slides until something stops them', () => {
  const s = make(['########', '#S***.@#', '#E######', '########']);
  const r = step(s, 'right');
  assert.equal(r.to, idx(s, 5, 1));
  assert.deepEqual(r.path, [idx(s, 2, 1), idx(s, 3, 1), idx(s, 4, 1), idx(s, 5, 1)]);
  assert.equal(r.slid, true);
  // Stops in front of the cage on the last ice tile.
  const t = make(['#######', '#S***@#', '#E#####', '#######']);
  assert.equal(step(t, 'right').to, idx(t, 4, 1));
});

test('ice: pushed boulders slide too and can sink at the end', () => {
  const s = make(['#########', '#SB***~.#', '#E####@##', '#########'], ['puppy']);
  const r = step(s, 'right');
  assert.equal(r.result, 'sink');
  assert.equal(r.boulderTo, idx(s, 6, 1));
  assert.equal(r.state.t[idx(s, 6, 1)], '=');
});

test('current: a swimming duck is carried downstream', () => {
  const s = make(['########', '#S~>>~.#', '#E####@#', '########'], ['duck']);
  let r = step(s, 'right');
  assert.equal(r.to, idx(s, 2, 1));
  r = step(r.state, 'right');
  assert.equal(r.to, idx(s, 5, 1));
  assert.equal(r.drifted, true);
  // Nobody else may enter current water.
  assert.equal(step(make(['######', '#S>.@#', '#E####', '######'], ['puppy']), 'right').need, 'swim');
});

test('plates open gates while pressed by a boulder or the rescuer', () => {
  const s = make(['#######', '#S.o..#', '#E##g@#', '#######'], ['puppy']);
  assert.equal(gatesOpen(s), false);
  let r = step(s, 'right');
  r = step(r.state, 'right');
  assert.equal(gatesOpen(r.state), true);
  // Stepping off the plate closes the gate again.
  const off = step(r.state, 'right');
  assert.equal(gatesOpen(off.state), false);
  assert.equal(step(off.state, 'down').reason, 'gate');

  const withBoulder = make(['#######', '#SBo.##', '#E##g##', '####@##', '#######'], ['puppy']);
  const pushed = step(withBoulder, 'right');
  assert.equal(gatesOpen(pushed.state), true);
});

test('crumbling bridge collapses after the rescuer crosses it once', () => {
  const s = make(['#######', '#S%.@#', '#E#####', '#######'].map((r) => r.padEnd(7, '#')));
  let r = step(s, 'right');
  assert.equal(r.state.t[idx(s, 2, 1)], '%');
  r = step(r.state, 'right');
  assert.deepEqual(r.collapsed, [idx(s, 2, 1)]);
  assert.equal(r.state.t[idx(s, 2, 1)], '_');
});

test('burrows teleport only with the mole leading', () => {
  const map = ['########', '#S(##)@#', '#E######', '########'];
  const withMole = step(make(map, ['mole']), 'right');
  assert.equal(withMole.teleport.to, idx(withMole.state, 5, 1));
  const noMole = step(make(map, ['puppy']), 'right');
  assert.equal(noMole.teleport, undefined);
  assert.equal(noMole.to, idx(noMole.state, 2, 1));
});

test('bees patrol and send the rescuer back to the start on contact', () => {
  const s = make(['#######', '#S...@#', '#E#####', '#######'], [], { bees: [[[3, 1], [3, 1], [3, 1], [3, 1]]] });
  let r = step(s, 'right');
  assert.equal(r.caught, undefined);
  r = step(r.state, 'right');
  assert.ok(r.caught);
  assert.equal(r.to, s.start);
  // A bee that blocks the corridor every other beat: waiting one beat breaks the rhythm.
  const timed = make(['#######', '#S...@#', '#E.####', '#######'], [], { bees: [[[3, 1], [3, 2]]] });
  assert.equal(beePositions(timed, 0)[0], idx(timed, 3, 1));
  const sol = solve(timed);
  assert.equal(sol.solved, true);
  assert.ok(sol.actions.includes('wait'), 'solution needs a wait');
  const path = findPath(timed, idx(timed, 5, 1));
  assert.ok(path, 'tap path times the bee');
  let st = timed;
  for (const d of path) {
    const r = step(st, d);
    assert.equal(r.caught, undefined);
    st = r.state;
  }
  assert.equal(step(make(['####', '#S@#', '#E##', '####']), 'wait').ok, false, 'no waiting without bees');
});

test('tap routes avoid collapsing a bridge when another way exists', () => {
  const s = make(['#######', '#S%.@##', '#....##', '#E#####', '#######'], ['frog']);
  const path = findPath(s, idx(s, 3, 1));
  let st = s;
  for (const d of path) st = step(st, d).state;
  assert.equal(st.t[idx(s, 2, 1)], '%', 'bridge still standing');
});

test('rotating a level keeps arrows and bees consistent', () => {
  const def = { id: 'r', pet: 'kitten', map: ['#######', '#S~>~.#', '#E###@#', '#######'], bees: [[[5, 1], [5, 2]]] };
  const a = solve(createState(parseLevel(def), ['duck']));
  const b = solve(createState(parseLevel(rotateLevel(def)), ['duck']));
  assert.equal(a.solved, true);
  assert.equal(b.solved, true);
  assert.equal(a.moves, b.moves);
});

test('switching companion is refused on current water too', () => {
  const s = make(['######', '#S>.@#', '#E####', '######'], ['duck', 'puppy']);
  const r = step(setActive(s, 'duck').state, 'right');
  assert.equal(setActive(r.state, 'puppy').reason, 'swimming');
});
