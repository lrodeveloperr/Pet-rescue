// Pure game rules: no rendering, no DOM. Shared by the game, the hint system, the level
// generator and the tests.

export const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
export const DIR_NAMES = Object.keys(DIRS);

// Companions lend one ability each while they are the active companion.
export const COMPANIONS = ['puppy', 'frog', 'duck', 'mole'];
export const ABILITY = { puppy: 'push', frog: 'hop', duck: 'swim', mole: 'dig' };

// Cage letters used by the hand-made levels. Generated levels use '@' plus a `pet` field.
const CAGE_CHARS = {
  P: 'puppy', F: 'frog', D: 'duck', M: 'mole',
  K: 'kitten', N: 'bunny', G: 'piglet', C: 'chick',
  A: 'hamster', L: 'lamb', X: 'fox', Y: 'panda',
};

// Terrain characters:
//   .  grass            #  tree (blocks)        ~  water (duck swims)
//   _  gap (frog hops)  H  hedge (mole digs)    E  home
//   =  boulder sunk in water   +  boulder filling a gap   ,  dug hedge
//   *  ice: anything moving onto it slides until stopped
//   > < ^ v  river current: water that carries a swimmer downstream
//   o  pressure plate   g  gate, open while any plate is pressed (boulder or rescuer)
//   %  crumbling bridge over a gap: collapses after the rescuer leaves it
//   ( )  and  [ ]  paired mole burrows: with the mole leading, entering one exits the other
// Level-only characters: S start, B boulder, @ or a letter above for the cage.
// Patrolling bees are listed separately: def.bees = [[[x, y], ...], ...] (one cycle per bee).
const BASE_WALK = new Set(['.', 'E', '=', '+', ',', '*', 'o', '%', '(', ')', '[', ']']);
const CURRENTS = { '>': 'right', '<': 'left', '^': 'up', v: 'down' };
const BURROW_PAIRS = { '(': ')', ')': '(', '[': ']', ']': '[' };
const TERRAIN_CHARS = '.#~_HE*><^vo g%()[]'.replace(' ', '');

export const isWater = (ch) => ch === '~' || ch in CURRENTS;
export const currentDir = (ch) => CURRENTS[ch];
export const isBurrow = (ch) => ch in BURROW_PAIRS;

export function isWalkable(ch) {
  return BASE_WALK.has(ch);
}

// ---------- level parsing ----------

const ROTATE_CHAR = { '>': 'v', v: '<', '<': '^', '^': '>' };

/** Rotate a level 90° clockwise. The puzzle is unchanged; only its on-screen shape. */
export function rotateLevel(def) {
  const rows = def.map;
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const map = [];
  for (let x = 0; x < w; x++) {
    let row = '';
    for (let y = h - 1; y >= 0; y--) {
      const ch = rows[y][x] ?? '#';
      row += ROTATE_CHAR[ch] ?? ch;
    }
    map.push(row);
  }
  const bees = def.bees?.map((path) => path.map(([x, y]) => [h - 1 - y, x]));
  return { ...def, map, ...(bees ? { bees } : {}) };
}

/** Kept for older callers: rotate just the map rows. */
export function rotateMap(rows) {
  return rotateLevel({ map: rows }).map;
}

export function parseLevel(def) {
  const rows = def.map;
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const terrain = [];
  const boulders = [];
  let start = -1;
  let cage = -1;
  let pet = def.pet ?? null;
  let exit = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x] ?? '#';
      const i = y * w + x;
      if (ch === 'S') {
        start = i;
        terrain.push('.');
      } else if (ch === 'B') {
        boulders.push(i);
        terrain.push('.');
      } else if (ch === '@' || CAGE_CHARS[ch]) {
        if (cage !== -1) throw new Error(`level ${def.id}: more than one cage`);
        cage = i;
        if (ch !== '@') pet = CAGE_CHARS[ch];
        terrain.push('.');
      } else if (ch === 'E') {
        exit = i;
        terrain.push('E');
      } else if (TERRAIN_CHARS.includes(ch)) {
        terrain.push(ch);
      } else {
        throw new Error(`level ${def.id}: unknown tile '${ch}' at ${x},${y}`);
      }
    }
  }
  if (start < 0 || cage < 0 || exit < 0 || !pet) {
    throw new Error(`level ${def.id}: needs S, a cage with a pet and E`);
  }
  const bees = (def.bees ?? []).map((path) => path.map(([x, y]) => y * w + x));
  const period = bees.reduce((a, p) => lcm(a, p.length), 1);
  return { id: def.id, w, h, terrain, boulders, start, cage, pet, exit, bees, period };
}

function gcd(a, b) {
  return b ? gcd(b, a % b) : a;
}
function lcm(a, b) {
  return (a * b) / gcd(a, b);
}

export function createState(level, owned = []) {
  const ownedList = COMPANIONS.filter((c) => owned.includes(c));
  return {
    w: level.w,
    h: level.h,
    t: level.terrain.slice(),
    b: level.boulders.slice().sort((a, b) => a - b),
    p: level.start,
    start: level.start,
    cage: level.cage,
    pet: level.pet,
    exit: level.exit,
    bees: level.bees ?? [],
    period: level.period ?? 1,
    turn: 0,
    rescued: false,
    won: false,
    owned: ownedList,
    // The most recently rescued companion leads by default.
    active: ownedList.length ? ownedList[ownedList.length - 1] : null,
  };
}

function clone(s) {
  return { ...s, t: s.t.slice(), b: s.b.slice(), owned: s.owned.slice() };
}

export function xy(s, i) {
  return { x: i % s.w, y: Math.floor(i / s.w) };
}

function offset(s, i, dir) {
  const x = (i % s.w) + dir.x;
  const y = Math.floor(i / s.w) + dir.y;
  if (x < 0 || y < 0 || x >= s.w || y >= s.h) return -1;
  return y * s.w + x;
}

function hasBoulder(s, i) {
  return s.b.includes(i);
}

function cageAt(s, i) {
  return !s.rescued && s.cage === i;
}

/** Gates are open while any plate holds a boulder or the rescuer. */
export function gatesOpen(s) {
  for (let i = 0; i < s.t.length; i++) {
    if (s.t[i] === 'o' && (s.p === i || hasBoulder(s, i))) return true;
  }
  return false;
}

export function beePositions(s, turn = s.turn) {
  return s.bees.map((path) => path[turn % path.length]);
}

function enterable(s, i, open) {
  const ch = s.t[i];
  return isWalkable(ch) || (ch === 'g' && open);
}

// A tile something can stand on: walkable terrain, no boulder, no closed cage.
function free(s, i, open = gatesOpen(s)) {
  return i >= 0 && enterable(s, i, open) && !hasBoulder(s, i) && !cageAt(s, i);
}

function partner(s, i) {
  const want = BURROW_PAIRS[s.t[i]];
  return s.t.indexOf(want);
}

/** Move a pushed boulder from `at` one tile, then keep sliding while it rests on ice. */
function pushBoulder(s, at, dir) {
  const path = [];
  let cur = at;
  const open = false; // a gate tile never takes a boulder
  for (;;) {
    const n = offset(s, cur, dir);
    if (n < 0 || hasBoulder(s, n) || cageAt(s, n) || n === s.p) break;
    const ch = s.t[n];
    if (isWater(ch)) {
      path.push(n);
      return { path, result: 'sink', end: n };
    }
    if (ch === '_' || ch === '%') {
      path.push(n);
      return { path, result: 'fill', end: n };
    }
    if (!enterable(s, n, open) || ch === 'E' || ch === 'g') break;
    path.push(n);
    cur = n;
    if (s.t[cur] !== '*') break;
  }
  if (!path.length) return null;
  return { path, result: 'roll', end: cur };
}

/**
 * Attempt one move. Returns
 *   { ok: true, state, kind, destructive, from, to, at, path, ... }
 *   { ok: false, reason, at, need }
 * `path` lists every tile the rescuer passes through after `from` (slides and currents),
 * `need` names the ability that would have made a blocked move possible.
 */
export function step(state, dirName) {
  if (dirName === 'wait') return wait(state);
  const dir = DIRS[dirName];
  if (!dir || state.won) return { ok: false, reason: 'none', at: state.p };
  const from = state.p;
  const t = offset(state, from, dir);
  if (t < 0 || state.t[t] === '#') return { ok: false, reason: 'wall', at: t };
  const active = state.active;
  const open = gatesOpen(state);
  const r = { ok: true, from, at: t, destructive: false, path: [] };
  let s;

  if (cageAt(state, t)) {
    s = clone(state);
    s.rescued = true;
    const isCompanion = COMPANIONS.includes(s.pet);
    if (isCompanion && !s.owned.includes(s.pet)) {
      s.owned = COMPANIONS.filter((c) => c === s.pet || s.owned.includes(c));
      r.gained = s.pet;
    }
    // A newly rescued companion leads so its ability can be shown straight away.
    // Never switch away from the duck while swimming.
    if (isCompanion && !isWater(s.t[from])) s.active = s.pet;
    r.kind = 'open';
    r.destructive = true;
    s.p = t;
  } else if (hasBoulder(state, t)) {
    if (active !== 'puppy') return { ok: false, reason: 'heavy', at: t, need: 'push' };
    s = clone(state);
    s.p = t;
    const moved = pushBoulder(s, t, dir);
    if (!moved) return { ok: false, reason: 'stuck', at: t };
    s.b = s.b.filter((i) => i !== t);
    if (moved.result === 'sink') s.t[moved.end] = '=';
    else if (moved.result === 'fill') s.t[moved.end] = '+';
    else s.b = [...s.b, moved.end].sort((a, b) => a - b);
    Object.assign(r, { kind: 'push', destructive: true, boulderPath: moved.path, boulderTo: moved.end, result: moved.result });
  } else {
    const ch = state.t[t];
    if (isWater(ch)) {
      if (active !== 'duck') return { ok: false, reason: 'water', at: t, need: 'swim' };
      s = clone(state);
      s.p = t;
      r.kind = 'swim';
    } else if (ch === '_') {
      if (active !== 'frog') return { ok: false, reason: 'gap', at: t, need: 'hop' };
      const l = offset(state, t, dir);
      if (!free(state, l, open)) return { ok: false, reason: 'landing', at: t };
      s = clone(state);
      s.p = l;
      r.kind = 'hop';
      r.over = t;
    } else if (ch === 'H') {
      if (active !== 'mole') return { ok: false, reason: 'hedge', at: t, need: 'dig' };
      s = clone(state);
      s.t[t] = ',';
      s.p = t;
      r.kind = 'dig';
      r.destructive = true;
    } else if (ch === 'g' && !open) {
      return { ok: false, reason: 'gate', at: t };
    } else if (enterable(state, t, open)) {
      s = clone(state);
      s.p = t;
      r.kind = 'walk';
    } else {
      return { ok: false, reason: 'wall', at: t };
    }
  }

  settle(s, r, from, dir);
  r.state = s;
  r.to = s.p;
  return r;
}

/** Stand still for one beat so patrolling bees can pass. Only offered on levels with bees. */
function wait(state) {
  if (!state.bees.length || state.won) return { ok: false, reason: 'none', at: state.p };
  const s = clone(state);
  const r = { ok: true, kind: 'wait', from: state.p, at: state.p, destructive: false, path: [] };
  settle(s, r, state.p, null);
  r.state = s;
  r.to = s.p;
  return r;
}

/** Actions available in a state: the four moves, plus waiting when bees patrol. */
export function moveNames(state) {
  return state.bees.length ? [...DIR_NAMES, 'wait'] : DIR_NAMES;
}

/** Everything that happens after the rescuer lands: bridges, ice, currents, burrows, home, bees. */
function settle(s, r, from, dir) {
  if (dir) r.path.push(s.p);
  const collapse = (i) => {
    if (s.t[i] === '%') {
      s.t[i] = '_';
      (r.collapsed ??= []).push(i);
    }
  };
  if (dir) collapse(from);

  // Ice: keep sliding in the same direction until something stops the rescuer.
  let guard = 0;
  while (dir && s.t[s.p] === '*' && guard++ < 64) {
    const n = offset(s, s.p, dir);
    if (n < 0 || !free(s, n) || isWater(s.t[n]) || s.t[n] === '_') break;
    s.p = n;
    r.path.push(n);
    r.slid = true;
  }

  // Currents carry a swimmer downstream while the water keeps going.
  guard = 0;
  const seen = new Set([s.p]);
  while (currentDir(s.t[s.p]) && guard++ < 64) {
    const n = offset(s, s.p, DIRS[currentDir(s.t[s.p])]);
    if (n < 0 || !isWater(s.t[n]) || hasBoulder(s, n) || seen.has(n)) break;
    seen.add(n);
    s.p = n;
    r.path.push(n);
    r.drifted = true;
  }

  // Burrows: with the mole leading, pop out of the paired burrow.
  if (dir && isBurrow(s.t[s.p]) && s.active === 'mole') {
    const out = partner(s, s.p);
    if (out >= 0 && free(s, out)) {
      r.teleport = { from: s.p, to: out };
      s.p = out;
      r.path.push(out);
    }
  }

  if (s.t[s.p] === 'E' && s.rescued) {
    s.won = true;
    r.kind = r.kind === 'walk' ? 'win' : r.kind;
    r.destructive = true;
  }

  // Bees move after every step. Meeting one (or swapping places) sends the rescuer home to start.
  s.turn = state_turn(s) + 1;
  if (s.bees.length && !s.won) {
    const before = beePositions(s, s.turn - 1);
    const after = beePositions(s, s.turn);
    const hit = after.some((b, k) => b === s.p || (b === from && before[k] === s.p) || r.path.includes(b));
    if (hit) {
      r.caught = { at: s.p };
      r.destructive = true;
      s.p = s.start;
      r.path.push(s.start);
    }
  }
}

function state_turn(s) {
  return s.turn ?? 0;
}

export function canSetActive(state, companion) {
  if (!state.owned.includes(companion)) return { ok: false, reason: 'locked' };
  if (isWater(state.t[state.p]) && companion !== 'duck') return { ok: false, reason: 'swimming' };
  return { ok: true };
}

export function setActive(state, companion) {
  const r = canSetActive(state, companion);
  if (!r.ok) return r;
  return { ok: true, state: { ...clone(state), active: companion } };
}

/**
 * Shortest route for a tap on tile `target`. Intermediate moves never change the board
 * (walk, swim, hop, slide, drift, burrow) and never meet a bee; only the final move may push,
 * dig, open the cage or win, and it must act on the tapped tile. Routes that collapse a
 * bridge are used only when nothing else reaches the target. Returns direction names or null.
 */
export function findPath(state, target) {
  if (target === state.p) return null;
  return route(state, target, false) ?? route(state, target, true);
}

function route(state, target, allowCollapse) {
  const period = state.bees.length ? state.period : 1;
  const nodeKey = (p, turn) => p * period + (turn % period);
  const startKey = nodeKey(state.p, state.turn);
  const prev = new Map([[startKey, null]]);
  const queue = [{ p: state.p, turn: state.turn }];
  const probe = clone(state);
  while (queue.length) {
    const node = queue.shift();
    probe.p = node.p;
    probe.turn = node.turn;
    const k = nodeKey(node.p, node.turn);
    for (const d of moveNames(probe)) {
      const r = step(probe, d);
      if (!r.ok || r.caught) continue;
      if (r.collapsed && !allowCollapse) continue;
      const hits = r.to === target || r.at === target || r.over === target || r.path.includes(target);
      if (r.destructive) {
        if (hits) return rebuild(prev, k, d);
        continue;
      }
      const nk = nodeKey(r.to, r.state.turn);
      if (prev.has(nk)) continue;
      prev.set(nk, { k, d });
      if (hits) return rebuild(prev, nk, null);
      queue.push({ p: r.to, turn: r.state.turn });
    }
  }
  return null;
}

function rebuild(prev, end, lastDir) {
  const dirs = lastDir ? [lastDir] : [];
  let cur = end;
  while (prev.get(cur)) {
    const { k, d } = prev.get(cur);
    dirs.unshift(d);
    cur = k;
  }
  return dirs;
}

function key(s) {
  const phase = s.bees.length ? s.turn % s.period : 0;
  return `${s.p}|${s.active}|${s.rescued ? 1 : 0}|${s.owned.join(',')}|${s.b.join(',')}|${phase}|${s.t.join('')}`;
}

/**
 * Breadth-first search over the whole puzzle state, layered by moves: companion switches
 * are free (expanded within the same layer), so `moves` is the true minimum number of steps.
 * Options: { grantOnRescue: false } stops a rescued companion from joining, which proves
 * the escape needs the new ability.
 */
export function solve(state, { maxNodes = 400000, grantOnRescue = true } = {}) {
  const startKey = key(state);
  const seen = new Map([[startKey, null]]);
  let frontier = [state];
  let nodes = 0;
  let moves = 0;
  while (frontier.length) {
    const next = [];
    // The frontier grows while it is walked: switches land in the same layer.
    for (let n = 0; n < frontier.length; n++) {
      const s = frontier[n];
      const sk = key(s);
      for (const c of s.owned) {
        if (c === s.active || !canSetActive(s, c).ok) continue;
        const ns = setActive(s, c).state;
        const k = key(ns);
        if (seen.has(k)) continue;
        seen.set(k, { from: sk, a: `use:${c}` });
        if (++nodes > maxNodes) return { solved: false, exhausted: true, nodes };
        frontier.push(ns);
      }
      for (const d of moveNames(s)) {
        const r = step(s, d);
        if (!r.ok) continue;
        let ns = r.state;
        if (!grantOnRescue && r.kind === 'open' && r.gained) {
          ns = { ...ns, owned: s.owned.slice(), active: s.active };
        }
        const k = key(ns);
        if (seen.has(k)) continue;
        seen.set(k, { from: sk, a: d });
        if (ns.won) return { solved: true, actions: trace(seen, k), moves: moves + 1, nodes };
        if (++nodes > maxNodes) return { solved: false, exhausted: true, nodes };
        next.push(ns);
      }
    }
    frontier = next;
    moves++;
  }
  return { solved: false, exhausted: false, nodes };
}

function trace(seen, k) {
  const out = [];
  let cur = seen.get(k);
  while (cur) {
    out.unshift(cur.a);
    cur = seen.get(cur.from);
  }
  return out;
}

/** Replay a list of solver actions; returns the step results (used by tests and the generator). */
export function replay(state, actions) {
  const results = [];
  let s = state;
  for (const a of actions) {
    const r = a.startsWith('use:') ? setActive(s, a.slice(4)) : step(s, a);
    if (!r.ok) throw new Error(`replay failed at ${a}`);
    results.push(r);
    s = r.state;
  }
  return { state: s, results };
}
