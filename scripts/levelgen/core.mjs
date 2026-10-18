// Level generator core (version 2): random candidate maps, filtered and shaped by the real solver.
// A candidate is kept only if it:
//   - is solvable within the move band,
//   - needs exactly its featured companions (each one is required),
//   - forces a detour: the best solution is clearly longer than walking straight to the cage
//     and home, so the obvious route fails,
//   - genuinely depends on each mechanic it features,
//   - keeps unwinnable positions rare (spike levels may have more).
// Obstacles the best solution never needs are then stripped, and difficulty is scored on the
// level's structure rather than its length.
import { parseLevel, createState, solve, replay, moveNames, step, setActive, COMPANIONS, ABILITY } from '../../src/logic.js';

export function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  next.chance = (p) => next() < p;
  return next;
}

// ---------- specifications ----------

// Obstacles that make each companion necessary.
const COMPANION_FEATURES = { puppy: ['boulder'], frog: ['gap'], duck: ['water'], mole: ['hedge'] };
// Mechanics that make a companion necessary by themselves.
const MECHANIC_COMPANION = { current: 'duck', burrow: 'mole' };

/**
 * A segment spec: { mechanics, minNeeds, maxNeeds, size, maxDead, minMoves, maxMoves, lesson }.
 * `mechanics` must all matter (bees count when they force a wait or a longer route).
 */
export function segmentSpec(opts) {
  return {
    owned: COMPANIONS,
    maxNodes: 15000,
    minMoves: 10,
    maxMoves: 28,
    minNeeds: 1,
    maxNeeds: 3,
    size: [5, 7],
    maxDead: 0.2,
    minDetour: 2,
    lesson: false,
    ...opts,
  };
}

// ---------- map building helpers ----------

function blank(w, h) {
  const g = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) row.push(x === 0 || y === 0 || x === w - 1 || y === h - 1 ? '#' : '.');
    g.push(row);
  }
  return g;
}

function cells(g, ch = '.') {
  const out = [];
  for (let y = 1; y < g.length - 1; y++) for (let x = 1; x < g[0].length - 1; x++) if (g[y][x] === ch) out.push([x, y]);
  return out;
}

function inside(g, x, y) {
  return x > 0 && y > 0 && x < g[0].length - 1 && y < g.length - 1;
}

const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function blob(r, g, ch, size) {
  const free = cells(g);
  if (!free.length) return;
  let [x, y] = r.pick(free);
  for (let n = 0; n < size; n++) {
    if (g[y][x] === '.') g[y][x] = ch;
    const [dx, dy] = r.pick(STEPS);
    if (inside(g, x + dx, y + dy)) {
      x += dx;
      y += dy;
    }
  }
}

function line(r, g, ch, len, { onlyGrass = true } = {}) {
  const [dx, dy] = r.pick(STEPS);
  const free = cells(g);
  if (!free.length) return [];
  let [x, y] = r.pick(free);
  const placed = [];
  for (let n = 0; n < len && inside(g, x, y); n++) {
    if (!onlyGrass || g[y][x] === '.') {
      g[y][x] = ch;
      placed.push([x, y]);
    }
    x += dx;
    y += dy;
  }
  return placed;
}

function walls(r, g, density) {
  const area = (g.length - 2) * (g[0].length - 2);
  const segments = Math.round(r.int(Math.floor(area / 14), Math.floor(area / 7)) * density);
  for (let n = 0; n < segments; n++) line(r, g, '#', r.int(1, 4));
}

// ---------- mechanic placement ----------

const ARROW = { '1,0': '>', '-1,0': '<', '0,1': 'v', '0,-1': '^' };

const PLACE = {
  current(r, g) {
    const [dx, dy] = r.pick(STEPS);
    const len = r.int(3, 6);
    let [x, y] = r.pick(cells(g));
    for (let n = 0; n < len && inside(g, x, y); n++) {
      g[y][x] = n === len - 1 && r.chance(0.5) ? '~' : ARROW[`${dx},${dy}`];
      x += dx;
      y += dy;
    }
    if (r.chance(0.4)) blob(r, g, '~', r.int(1, 3));
  },
  ice(r, g) {
    const w = r.int(2, 4);
    const h = r.int(2, 4);
    const x0 = r.int(1, Math.max(1, g[0].length - 1 - w));
    const y0 = r.int(1, Math.max(1, g.length - 1 - h));
    for (let y = y0; y < y0 + h && y < g.length - 1; y++) {
      for (let x = x0; x < x0 + w && x < g[0].length - 1; x++) if (g[y][x] === '.' || r.chance(0.5)) g[y][x] = '*';
    }
    if (r.chance(0.5)) line(r, g, '*', r.int(2, 4));
  },
  gate(r, g) {
    const plate = r.pick(cells(g));
    if (!plate) return;
    g[plate[1]][plate[0]] = 'o';
    const wallTiles = cells(g, '#').filter(([x, y]) => STEPS.filter(([dx, dy]) => g[y + dy]?.[x + dx] === '.').length >= 2);
    const n = r.int(1, 2);
    for (let k = 0; k < n && wallTiles.length; k++) {
      const [x, y] = wallTiles.splice(Math.floor(r() * wallTiles.length), 1)[0];
      g[y][x] = 'g';
    }
    blob(r, g, 'B', 1);
  },
  bridge(r, g) {
    const placed = line(r, g, '_', r.int(2, 4));
    for (const [x, y] of placed) if (r.chance(0.5)) g[y][x] = '%';
    if (!placed.some(([x, y]) => g[y][x] === '%') && placed.length) {
      const [x, y] = placed[0];
      g[y][x] = '%';
    }
  },
  burrow(r, g) {
    const pairs = r.chance(0.3) ? [['(', ')'], ['[', ']']] : [['(', ')']];
    for (const [a, b] of pairs) {
      const free = cells(g);
      if (free.length < 2) return;
      const p = r.pick(free);
      g[p[1]][p[0]] = a;
      const far = cells(g).filter(([x, y]) => Math.abs(x - p[0]) + Math.abs(y - p[1]) >= 4);
      const q = far.length ? r.pick(far) : r.pick(cells(g));
      g[q[1]][q[0]] = b;
    }
  },
  bees(r, g, def) {
    const n = r.int(1, 2);
    const bees = [];
    for (let k = 0; k < n; k++) {
      const [dx, dy] = r.pick(STEPS);
      let [x, y] = r.pick(cells(g));
      const path = [[x, y]];
      const len = r.int(2, 3);
      for (let s = 1; s < len; s++) {
        if (!inside(g, x + dx, y + dy) || g[y + dy][x + dx] === '#') break;
        x += dx;
        y += dy;
        path.push([x, y]);
      }
      if (path.length < 2) continue;
      const cycle = [...path, ...path.slice(1, -1).reverse()];
      if (r.chance(0.4)) cycle.push(cycle[0]);
      bees.push(cycle);
    }
    if (bees.length) def.bees = bees;
  },
};

const FEATURE_PLACE = {
  boulder: (r, g) => {
    blob(r, g, 'B', 1);
    if (r.chance(0.5)) blob(r, g, r.chance(0.5) ? '~' : '_', r.int(1, 2));
  },
  gap: (r, g) => line(r, g, '_', r.int(1, 2)),
  water: (r, g) => blob(r, g, '~', r.int(1, 4)),
  hedge: (r, g) => line(r, g, 'H', r.int(1, 2)),
};

// ---------- candidate generation ----------

/** Builds a random candidate around `featured` companions and the spec's mechanics. */
export function candidate(r, spec, featured) {
  const w = r.int(spec.size[0], spec.size[1]) + 2;
  const h = r.int(spec.size[0], spec.size[1]) + 2;
  const g = blank(w, h);
  const def = {};
  walls(r, g, spec.lesson ? 0.7 : 1);
  for (const m of spec.mechanics) PLACE[m](r, g, def);
  for (const c of featured) {
    const n = spec.lesson ? 1 : r.int(1, 2);
    for (let k = 0; k < n; k++) FEATURE_PLACE[r.pick(COMPANION_FEATURES[c])](r, g);
  }
  // An occasional decoy from a non-featured companion keeps choices honest.
  if (!spec.lesson && r.chance(0.3)) {
    const other = COMPANIONS.filter((c) => !featured.includes(c));
    if (other.length) FEATURE_PLACE[COMPANION_FEATURES[r.pick(other)][0]](r, g);
  }
  const grass = cells(g);
  if (grass.length < 3) return null;
  const S = r.pick(grass);
  const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  const farFromS = grass.filter((c) => dist(c, S) >= 4);
  if (!farFromS.length) return null;
  const C = r.pick(farFromS);
  const homeOptions = grass.filter((c) => dist(c, C) >= 3 && dist(c, S) >= 1);
  if (!homeOptions.length) return null;
  const E = r.pick(homeOptions);
  g[S[1]][S[0]] = 'S';
  g[C[1]][C[0]] = '@';
  g[E[1]][E[0]] = 'E';
  def.map = g.map((row) => row.join(''));
  return def;
}

/** Companions to feature in a candidate, honouring the spec's need range and mechanics. */
export function pickFeatured(r, spec) {
  const forced = spec.mechanics.map((m) => MECHANIC_COMPANION[m]).filter(Boolean);
  const want = r.int(spec.minNeeds, spec.maxNeeds);
  const pool = COMPANIONS.filter((c) => !forced.includes(c));
  const out = [...new Set(forced)];
  while (out.length < want && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return out;
}

// ---------- evaluation ----------

const NEUTRAL = {
  current: (def) => ({ ...def, map: def.map.map((row) => row.replace(/[<>^v]/g, '~')) }),
  ice: (def) => ({ ...def, map: def.map.map((row) => row.replace(/\*/g, '.')) }),
  gate: (def) => ({ ...def, map: def.map.map((row) => row.replace(/g/g, '#')) }),
  bridge: (def) => ({ ...def, map: def.map.map((row) => row.replace(/%/g, '_')) }),
  burrow: (def) => ({ ...def, map: def.map.map((row) => row.replace(/[()[\]]/g, '.')) }),
  bees: (def) => {
    const { bees, ...rest } = def;
    return rest;
  },
};

export const HAS = {
  current: (def) => def.map.some((row) => /[<>^v]/.test(row)),
  ice: (def) => def.map.some((row) => row.includes('*')),
  gate: (def) => def.map.some((row) => row.includes('g')) && def.map.some((row) => row.includes('o')),
  bridge: (def) => def.map.some((row) => row.includes('%')),
  burrow: (def) => def.map.some((row) => /[()[\]]/.test(row)),
  bees: (def) => Boolean(def.bees?.length),
};

function trySolve(def, owned, maxNodes) {
  try {
    return solve(createState(parseLevel({ id: 'gen', pet: 'kitten', ...def }), owned), { maxNodes });
  } catch {
    return { solved: false, exhausted: false };
  }
}

function eventsOf(level, results) {
  const events = { push: 0, sink: 0, fill: 0, dig: 0, hop: 0, swim: 0, slid: 0, drifted: 0, collapsed: 0, teleport: 0, wait: 0, gate: 0, switch: 0, caught: 0 };
  for (const r of results) {
    if (!r.kind) {
      events.switch++;
      continue;
    }
    if (r.kind === 'push') {
      events.push++;
      if (r.result !== 'roll') events[r.result]++;
    }
    if (r.kind in events) events[r.kind]++;
    if (r.slid) events.slid++;
    if (r.drifted) events.drifted++;
    if (r.collapsed) events.collapsed++;
    if (r.teleport) events.teleport++;
    if (r.caught) events.caught++;
    if (r.path?.some((i) => level.terrain[i] === 'g')) events.gate++;
  }
  return events;
}

function essential(m, def, sol, events, spec) {
  if (!HAS[m](def)) return false;
  const alt = trySolve(NEUTRAL[m](def), spec.owned, spec.maxNodes);
  const unsolvable = !alt.solved && !alt.exhausted;
  switch (m) {
    case 'current':
      return events.drifted > 0 && (unsolvable || (alt.solved && alt.moves !== sol.moves));
    case 'ice':
      return events.slid >= 2 && (unsolvable || (alt.solved && Math.abs(alt.moves - sol.moves) >= 2));
    case 'gate':
      return events.gate > 0 && unsolvable;
    case 'bridge':
      return events.collapsed > 0 && unsolvable;
    case 'burrow':
      return events.teleport > 0 && (unsolvable || (alt.solved && alt.moves - sol.moves >= 3));
    case 'bees':
      return (events.wait > 0 || (alt.solved && sol.moves - alt.moves >= 2)) && !unsolvable;
  }
  return false;
}

/**
 * Moves needed when every companion obstacle (boulders, hedges, gaps, water, gates) is cleared
 * but the world's movement mechanics stay. The difference to par is the detour the obstacles
 * force: zero means the level is just "walk (or swim) straight there".
 */
function relaxedPar(def, spec) {
  const map = def.map.map((row) => row.replace(/[BH_~g]/g, '.'));
  const r = trySolve({ ...def, map }, spec.owned, spec.maxNodes);
  return r.solved ? r.moves : Infinity;
}

const stateKey = (s) => `${s.p}|${s.active}|${s.rescued ? 1 : 0}|${s.b}|${s.bees.length ? s.turn % s.period : 0}|${s.t.join('')}`;

/** Fraction of reachable positions from which the level can no longer be won (capped search). */
export function deadFraction(state, cap = 25000) {
  const nodes = new Map([[stateKey(state), state]]);
  const edges = new Map();
  const wins = new Set();
  const q = [state];
  while (q.length && nodes.size < cap) {
    const s = q.shift();
    const k = stateKey(s);
    const out = [];
    const acts = [...moveNames(s).map((d) => step(s, d)), ...s.owned.map((c) => setActive(s, c))];
    for (const r of acts) {
      if (!r.ok) continue;
      const nk = stateKey(r.state);
      out.push(nk);
      if (r.state.won) {
        wins.add(nk);
        continue;
      }
      if (!nodes.has(nk)) {
        nodes.set(nk, r.state);
        q.push(r.state);
      }
    }
    edges.set(k, out);
  }
  const rev = new Map();
  for (const [a, outs] of edges) for (const b of outs) (rev.get(b) ?? rev.set(b, []).get(b)).push(a);
  const good = new Set(wins);
  const qq = [...wins];
  while (qq.length) {
    const b = qq.shift();
    for (const a of rev.get(b) ?? []) if (!good.has(a)) {
      good.add(a);
      qq.push(a);
    }
  }
  // Unexplored frontier states count as alive, so a capped search under-reports, never over-reports.
  let dead = 0;
  for (const k of edges.keys()) if (!good.has(k)) dead++;
  return { fraction: dead / Math.max(1, nodes.size), states: nodes.size, capped: nodes.size >= cap };
}

/** A deliberately limited solver: how much search a casual player-like agent needs. */
function limitedAgentLevel(def, owned) {
  for (const [budget, level] of [[400, 0], [2000, 1], [8000, 2]]) {
    if (trySolve(def, owned, budget).solved) return level;
  }
  return 3;
}

/** Full evaluation; returns null when the candidate must be rejected. */
export function evaluate(def, spec, featured = null, stats = null) {
  const no = (why) => {
    if (stats) stats[why] = (stats[why] ?? 0) + 1;
    return null;
  };
  let level;
  try {
    level = parseLevel({ id: 'gen', pet: 'kitten', ...def });
  } catch {
    return no('parse');
  }
  const state = createState(level, spec.owned);
  const sol = solve(state, { maxNodes: spec.maxNodes });
  if (!sol.solved) return no('unsolved');
  if (sol.moves < spec.minMoves) return no('short');
  if (sol.moves > spec.maxMoves) return no('long');
  const { results } = replay(state, sol.actions);
  const events = eventsOf(level, results);
  if (events.caught) return no('caught');
  // The obvious route must fail: the obstacles must force a real detour. Worlds whose puzzle is
  // a movement mechanic rely on that mechanic being essential instead.
  const detour = sol.moves - relaxedPar(def, spec);
  if (!spec.mechanics.length && detour < spec.minDetour) return no('detour');
  const needs = spec.owned.filter((c) => {
    const r = trySolve(def, spec.owned.filter((o) => o !== c), spec.maxNodes);
    return !r.solved && !r.exhausted;
  });
  if (needs.length < spec.minNeeds) return no('fewNeeds');
  if (needs.length > spec.maxNeeds) return no('manyNeeds');
  const mechanics = spec.mechanics.filter((m) => essential(m, def, sol, events, spec));
  const required = spec.requireMechanics ?? spec.mechanics;
  if (!required.every((m) => mechanics.includes(m))) return no('mechanic');
  const interesting = Object.entries(events).filter(([k, v]) => v > 0 && k !== 'switch').length;
  if (interesting < (spec.lesson ? 1 : 2)) return no('dull');
  const dead = deadFraction(state);
  if (dead.fraction > spec.maxDead) return no('dead');
  return score({ def: { ...def, par: sol.moves }, needs, mechanics, events, nodes: sol.nodes, dead: dead.fraction, detour }, spec);
}

function irreversible(events) {
  return events.sink + events.fill + events.dig + events.collapsed;
}

function score(e, spec) {
  e.agent = limitedAgentLevel(e.def, spec.owned);
  e.difficulty =
    4 * e.needs.length + 2 * e.events.switch + 2 * irreversible(e.events) + 12 * e.dead + 3 * e.agent + 1.5 * Math.log2(1 + e.nodes) + e.def.par / 4 + e.detour / 3;
  return e;
}

const OBSTACLE = /[~_H*><^vog%()[\]B]/;

/**
 * Removes obstacles the best solution never needs. Each untouched obstacle tile is turned to
 * grass (or, failing that, a tree); the change is kept only if par, needs and mechanics hold.
 */
export function strip(e, spec) {
  let def = e.def;
  const level = parseLevel({ id: 'gen', pet: 'kitten', ...def });
  const state = createState(level, spec.owned);
  const sol = solve(state, { maxNodes: spec.maxNodes });
  const { results } = replay(state, sol.actions);
  const touched = new Set();
  for (const r of results) {
    if (!r.kind) continue;
    touched.add(r.at);
    if (r.over !== undefined) touched.add(r.over);
    for (const p of r.path ?? []) touched.add(p);
    for (const p of r.boulderPath ?? []) touched.add(p);
    if (r.teleport) touched.add(r.teleport.from);
  }
  // Gates need their plates and burrows need their partners: keep whole mechanic groups.
  const groups = { g: 'o', o: 'g', '(': ')', ')': '(', '[': ']', ']': '[' };
  const chars = () => def.map.join('');
  const keepGroups = new Set();
  for (const i of touched) if (groups[chars()[i]]) keepGroups.add(groups[chars()[i]]);
  const holds = (candidateDef) => {
    const r = trySolve(candidateDef, spec.owned, spec.maxNodes);
    if (!r.solved || r.moves !== e.def.par) return false;
    for (const c of e.needs) {
      const alt = trySolve(candidateDef, spec.owned.filter((o) => o !== c), spec.maxNodes);
      if (alt.solved || alt.exhausted) return false;
    }
    const lv = parseLevel({ id: 'gen', pet: 'kitten', ...candidateDef });
    const st = createState(lv, spec.owned);
    const sol2 = solve(st, { maxNodes: spec.maxNodes });
    const ev = eventsOf(lv, replay(st, sol2.actions).results);
    return e.mechanics.every((m) => essential(m, candidateDef, sol2, ev, spec));
  };
  const w = level.w;
  for (let i = 0; i < level.terrain.length; i++) {
    const ch = def.map[Math.floor(i / w)][i % w];
    if (!OBSTACLE.test(ch) || touched.has(i) || keepGroups.has(ch) || ch in groups) continue;
    for (const repl of ['.', '#']) {
      const rows = def.map.map((row, y) => (y === Math.floor(i / w) ? row.slice(0, i % w) + repl + row.slice(i % w + 1) : row));
      const next = { ...def, map: rows };
      if (holds(next)) {
        def = next;
        break;
      }
    }
  }
  if (def === e.def) return e;
  const again = evaluate({ map: def.map, ...(def.bees ? { bees: def.bees } : {}) }, spec);
  return again ?? e;
}

// ---------- symmetry dedupe ----------

const ROT = { '>': 'v', v: '<', '<': '^', '^': '>' };
const FLIP = { '>': '<', '<': '>' };

function rotate(rows) {
  const h = rows.length;
  const w = rows[0].length;
  const out = [];
  for (let x = 0; x < w; x++) {
    let row = '';
    for (let y = h - 1; y >= 0; y--) row += ROT[rows[y][x]] ?? rows[y][x];
    out.push(row);
  }
  return out;
}

function flip(rows) {
  return rows.map((r) => [...r].reverse().map((c) => FLIP[c] ?? c).join(''));
}

export function canonical(map) {
  let best = null;
  let cur = map;
  for (let k = 0; k < 4; k++) {
    for (const v of [cur, flip(cur)]) {
      const s = v.join('/');
      if (best === null || s < best) best = s;
    }
    cur = rotate(cur);
  }
  return best;
}

export { ABILITY };
