// Pure game rules: no rendering, no DOM. Shared by the game, the hint system and the tests.

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
// Friends are rescued and taken home; they do not lend abilities.
export const FRIENDS = ['kitten', 'bunny', 'piglet', 'chick', 'hamster', 'lamb', 'fox', 'panda'];

const CAGE_CHARS = {
  P: 'puppy', F: 'frog', D: 'duck', M: 'mole',
  K: 'kitten', N: 'bunny', G: 'piglet', C: 'chick',
  A: 'hamster', L: 'lamb', X: 'fox', Y: 'panda',
};

// Terrain characters:
//   .  grass          #  tree (blocks)     ~  water (duck swims)
//   _  gap (frog hops over one)            H  hedge (mole digs through)
//   E  home / exit    =  boulder sunk in water (walkable)
//   +  boulder filling a gap (walkable)    ,  dug hedge (walkable)
// Level-only characters: S start, B boulder on grass, cage letters above.
const WALKABLE = new Set(['.', 'E', '=', '+', ',']);

export function isWalkable(ch) {
  return WALKABLE.has(ch);
}

/** Rotate a level map 90° clockwise. The puzzle is unchanged; only its on-screen shape. */
export function rotateMap(rows) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const out = [];
  for (let x = 0; x < w; x++) {
    let row = '';
    for (let y = h - 1; y >= 0; y--) row += rows[y][x] ?? '#';
    out.push(row);
  }
  return out;
}

export function parseLevel(def) {
  const rows = def.map;
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const terrain = [];
  const boulders = [];
  let start = -1;
  let cage = -1;
  let pet = null;
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
      } else if (CAGE_CHARS[ch]) {
        if (cage !== -1) throw new Error(`level ${def.id}: more than one cage`);
        cage = i;
        pet = CAGE_CHARS[ch];
        terrain.push('.');
      } else if (ch === 'E') {
        exit = i;
        terrain.push('E');
      } else if ('.#~_H'.includes(ch)) {
        terrain.push(ch);
      } else {
        throw new Error(`level ${def.id}: unknown tile '${ch}' at ${x},${y}`);
      }
    }
  }
  if (start < 0 || cage < 0 || exit < 0) {
    throw new Error(`level ${def.id}: needs S, a cage and E`);
  }
  return { id: def.id, w, h, terrain, boulders, start, cage, pet, exit };
}

export function createState(level, owned = []) {
  const ownedList = COMPANIONS.filter((c) => owned.includes(c));
  return {
    w: level.w,
    h: level.h,
    t: level.terrain.slice(),
    b: level.boulders.slice().sort((a, b) => a - b),
    p: level.start,
    cage: level.cage,
    pet: level.pet,
    exit: level.exit,
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
  const { x, y } = xy(s, i);
  const nx = x + dir.x;
  const ny = y + dir.y;
  if (nx < 0 || ny < 0 || nx >= s.w || ny >= s.h) return -1;
  return ny * s.w + nx;
}

function hasBoulder(s, i) {
  return s.b.includes(i);
}

function cageAt(s, i) {
  return !s.rescued && s.cage === i;
}

// A tile something can stand on: walkable terrain, no boulder, no closed cage.
function free(s, i) {
  return i >= 0 && isWalkable(s.t[i]) && !hasBoulder(s, i) && !cageAt(s, i);
}

function arrive(s, to) {
  s.p = to;
  if (s.t[to] === 'E' && s.rescued) s.won = true;
}

/**
 * Attempt one move. Returns
 *   { ok: true, state, kind, destructive, from, to, at, ... }
 *   { ok: false, reason, at, need }
 * `need` names the ability that would have made a blocked move possible.
 */
export function step(state, dirName) {
  const dir = DIRS[dirName];
  if (!dir || state.won) return { ok: false, reason: 'none', at: state.p };
  const from = state.p;
  const t = offset(state, from, dir);
  if (t < 0 || state.t[t] === '#') return { ok: false, reason: 'wall', at: t };
  const active = state.active;

  if (cageAt(state, t)) {
    const s = clone(state);
    s.rescued = true;
    const isCompanion = COMPANIONS.includes(s.pet);
    let gained = null;
    if (isCompanion && !s.owned.includes(s.pet)) {
      s.owned = COMPANIONS.filter((c) => c === s.pet || s.owned.includes(c));
      gained = s.pet;
    }
    // A newly rescued companion leads so its ability can be shown straight away.
    // Never switch away from the duck while swimming.
    if (isCompanion && s.t[from] !== '~') s.active = s.pet;
    arrive(s, t);
    return { ok: true, state: s, kind: 'open', destructive: true, from, to: t, at: t, gained };
  }

  if (hasBoulder(state, t)) {
    if (active !== 'puppy') return { ok: false, reason: 'heavy', at: t, need: 'push' };
    const n = offset(state, t, dir);
    const blocked = { ok: false, reason: 'stuck', at: t };
    if (n < 0 || hasBoulder(state, n) || cageAt(state, n)) return blocked;
    const nt = state.t[n];
    const s = clone(state);
    s.b = s.b.filter((i) => i !== t);
    let result = 'roll';
    if (nt === '~') {
      s.t[n] = '=';
      result = 'sink';
    } else if (nt === '_') {
      s.t[n] = '+';
      result = 'fill';
    } else if (isWalkable(nt) && nt !== 'E') {
      s.b.push(n);
      s.b.sort((a, b) => a - b);
    } else {
      return blocked;
    }
    arrive(s, t);
    return { ok: true, state: s, kind: 'push', destructive: true, from, to: t, at: t, boulderTo: n, result };
  }

  const ch = state.t[t];
  if (ch === '~') {
    if (active !== 'duck') return { ok: false, reason: 'water', at: t, need: 'swim' };
    const s = clone(state);
    arrive(s, t);
    return { ok: true, state: s, kind: 'swim', destructive: false, from, to: t, at: t };
  }
  if (ch === '_') {
    if (active !== 'frog') return { ok: false, reason: 'gap', at: t, need: 'hop' };
    const l = offset(state, t, dir);
    if (!free(state, l)) return { ok: false, reason: 'landing', at: t };
    const s = clone(state);
    arrive(s, l);
    return { ok: true, state: s, kind: 'hop', destructive: s.won, from, to: l, at: t, over: t };
  }
  if (ch === 'H') {
    if (active !== 'mole') return { ok: false, reason: 'hedge', at: t, need: 'dig' };
    const s = clone(state);
    s.t[t] = ',';
    arrive(s, t);
    return { ok: true, state: s, kind: 'dig', destructive: true, from, to: t, at: t };
  }
  if (isWalkable(ch)) {
    const s = clone(state);
    arrive(s, t);
    return { ok: true, state: s, kind: s.won ? 'win' : 'walk', destructive: s.won, from, to: t, at: t };
  }
  return { ok: false, reason: 'wall', at: t };
}

export function canSetActive(state, companion) {
  if (!state.owned.includes(companion)) return { ok: false, reason: 'locked' };
  if (state.t[state.p] === '~' && companion !== 'duck') return { ok: false, reason: 'swimming' };
  return { ok: true };
}

export function setActive(state, companion) {
  const r = canSetActive(state, companion);
  if (!r.ok) return r;
  return { ok: true, state: { ...clone(state), active: companion } };
}

/**
 * Shortest route for a tap on tile `target`. Intermediate moves never change the
 * board (walk, swim, hop); only the final move may push, dig, open the cage or win,
 * and it must act on the tapped tile. Returns an array of direction names or null.
 */
export function findPath(state, target) {
  if (target === state.p) return null;
  const prev = new Map([[state.p, null]]);
  const queue = [state.p];
  const probe = clone(state);
  while (queue.length) {
    const pos = queue.shift();
    probe.p = pos;
    for (const d of DIR_NAMES) {
      const r = step(probe, d);
      if (!r.ok) continue;
      const hits = r.to === target || r.at === target || r.over === target;
      if (r.destructive) {
        if (hits) return rebuild(prev, pos, d);
        continue;
      }
      if (prev.has(r.to)) continue;
      prev.set(r.to, { pos, d });
      if (r.to === target || r.over === target) return rebuild(prev, r.to, null);
      queue.push(r.to);
    }
  }
  return null;
}

function rebuild(prev, end, lastDir) {
  const dirs = lastDir ? [lastDir] : [];
  let cur = end;
  while (prev.get(cur)) {
    const { pos, d } = prev.get(cur);
    dirs.unshift(d);
    cur = pos;
  }
  return dirs;
}

function key(s) {
  return `${s.p}|${s.active}|${s.rescued ? 1 : 0}|${s.owned.join(',')}|${s.b.join(',')}|${s.t.join('')}`;
}

/**
 * Breadth-first search over the whole puzzle state. Companion switches count as
 * actions. Options: { grantOnRescue: false } stops a rescued companion from joining,
 * which proves the escape needs the new ability.
 */
export function solve(state, { maxNodes = 400000, grantOnRescue = true } = {}) {
  const startKey = key(state);
  const seen = new Map([[startKey, null]]);
  let frontier = [state];
  let nodes = 0;
  while (frontier.length) {
    const next = [];
    for (const s of frontier) {
      const actions = [];
      for (const c of s.owned) {
        if (c !== s.active && canSetActive(s, c).ok) actions.push({ a: `use:${c}`, s: setActive(s, c).state });
      }
      for (const d of DIR_NAMES) {
        const r = step(s, d);
        if (!r.ok) continue;
        let ns = r.state;
        if (!grantOnRescue && r.kind === 'open' && r.gained) {
          ns = { ...ns, owned: s.owned.slice(), active: s.active };
        }
        actions.push({ a: d, s: ns });
      }
      const sk = key(s);
      for (const { a, s: ns } of actions) {
        const k = key(ns);
        if (seen.has(k)) continue;
        seen.set(k, { from: sk, a });
        if (ns.won) return { solved: true, actions: trace(seen, k), nodes };
        if (++nodes > maxNodes) return { solved: false, exhausted: true, nodes };
        next.push(ns);
      }
    }
    frontier = next;
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
