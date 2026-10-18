import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLevel, createState, step, setActive, findPath } from '../src/logic.js';

function make(map, owned = []) {
  return createState(parseLevel({ id: 't', map }), owned);
}

test('walking onto the cage rescues the pet; reaching home afterwards wins', () => {
  let s = make(['#####', '#SPE#', '#####']);
  let r = step(s, 'right');
  assert.equal(r.kind, 'open');
  assert.equal(r.gained, 'puppy');
  assert.equal(r.state.active, 'puppy');
  r = step(r.state, 'right');
  assert.equal(r.kind, 'win');
  assert.equal(r.state.won, true);
});

test('home does not win before the rescue', () => {
  const s = make(['#####', '#SEK#', '#####']);
  const r = step(s, 'right');
  assert.equal(r.kind, 'walk');
  assert.equal(r.state.won, false);
});

test('boulders need the puppy, roll on grass, sink in water and fill gaps', () => {
  const s = make(['#######', '#SB.~K#', '#E#####', '#######'], ['frog']);
  const blocked = step(s, 'right');
  assert.equal(blocked.ok, false);
  assert.equal(blocked.need, 'push');

  let st = setActive(make(['#######', '#SB.~K#', '#E#####', '#######'], ['puppy']), 'puppy').state;
  let r = step(st, 'right');
  assert.equal(r.result, 'roll');
  r = step(r.state, 'right');
  assert.equal(r.result, 'sink');
  assert.equal(r.state.t[4 + 7], '=');
  assert.equal(r.state.b.length, 0);

  st = make(['######', '#SB_K#', '#E####', '######'], ['puppy']);
  r = step(st, 'right');
  assert.equal(r.result, 'fill');
  assert.equal(r.state.t[3 + 6], '+');
});

test('a boulder cannot be pushed into trees, other boulders, the cage or home', () => {
  const cases = [
    ['#####', '#SB##', '#EK##', '#####'],
    ['######', '#SBB.#', '#EK###', '######'],
    ['#####', '#SBK#', '#E###', '#####'],
    ['#####', '#SBE#', '#K###', '#####'],
  ];
  for (const map of cases) {
    const r = step(make(map, ['puppy']), 'right');
    assert.equal(r.ok, false, map.join('/'));
    assert.equal(r.reason, 'stuck');
  }
});

test('frog hops exactly one gap onto a free tile', () => {
  const s = make(['#######', '#S_.K.#', '#E#####', '#######'], ['frog']);
  const r = step(s, 'right');
  assert.equal(r.kind, 'hop');
  assert.equal(r.to, 7 + 3);
  const wide = make(['#######', '#S__K.#', '#E#####', '#######'], ['frog']);
  assert.equal(step(wide, 'right').reason, 'landing');
  const noFrog = make(['#######', '#S_.K.#', '#E#####', '#######'], ['puppy']);
  assert.equal(step(noFrog, 'right').need, 'hop');
});

test('duck swims; nobody else can switch in while swimming', () => {
  let s = make(['######', '#S~.K#', '#E####', '######'], ['puppy', 'duck']);
  assert.equal(s.active, 'duck');
  const r = step(s, 'right');
  assert.equal(r.kind, 'swim');
  assert.equal(setActive(r.state, 'puppy').reason, 'swimming');
  s = setActive(s, 'puppy').state;
  assert.equal(step(s, 'right').need, 'swim');
});

test('mole digs a hedge into a permanent path', () => {
  const s = make(['######', '#SH.K#', '#E####', '######'], ['mole']);
  const r = step(s, 'right');
  assert.equal(r.kind, 'dig');
  assert.equal(r.state.t[6 + 2], ',');
  const back = step(r.state, 'left');
  assert.equal(back.kind, 'walk');
});

test('findPath walks around obstacles and ends with the action on the tapped tile', () => {
  const s = make(['######', '#S..##', '###.##', '###B##', '#EK..#', '######'], ['puppy']);
  // Tap the boulder from far away: path must end by pushing it.
  const boulder = s.b[0];
  const path = findPath(s, boulder);
  assert.deepEqual(path, ['right', 'right', 'down', 'down']);
  let st = s;
  for (const d of path) st = step(st, d).state;
  assert.equal(st.b.includes(boulder), false);
  // Taps that cannot be reached return null.
  const wall = 0;
  assert.equal(findPath(s, wall), null);
});

test('findPath never pushes a boulder on the way to somewhere else', () => {
  const s = make(['######', '#SB.K#', '#E####', '######'], ['puppy']);
  assert.equal(findPath(s, 4 + 6), null);
});

test('rotating a map keeps every level solvable', async () => {
  const { LEVELS } = await import('../src/levels.js');
  const { rotateMap, solve, COMPANIONS } = await import('../src/logic.js');
  for (const def of LEVELS) {
    const rotated = rotateMap(def.map);
    assert.equal(rotated.length, Math.max(...def.map.map((r) => r.length)));
    const st = createState(parseLevel({ id: def.id, map: rotated }), COMPANIONS);
    assert.equal(solve(st).solved, true, `level ${def.id} rotated`);
  }
});
