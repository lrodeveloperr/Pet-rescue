// Level generator core: random candidate maps, filtered by the real solver.
// A candidate is kept only if it is solvable, long enough, needs the required number of
// companions, and genuinely depends on its world's mechanic.
import { parseLevel, createState, solve, replay, COMPANIONS } from '../../src/logic.js';

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

// ---------- world specifications ----------

const BASE = { owned: COMPANIONS, minNeeds: 1, minMoves: 12, maxMoves: 70, maxNodes: 40000 };
export const SPECS = {
  meadow: { ...BASE, size: [5, 8], features: { water: [0, 2], gap: [0, 2], hedge: [0, 2], boulder: [1, 3] }, mechanics: [], minNeeds: 2, minMoves: 14 },
  river: { ...BASE, size: [5, 8], features: { water: [0, 1], gap: [0, 1], hedge: [0, 1], boulder: [0, 2] }, mechanics: ['current'] },
  snow: { ...BASE, size: [5, 8], features: { water: [0, 1], gap: [0, 1], hedge: [0, 1], boulder: [0, 2] }, mechanics: ['ice'] },
  farm: { ...BASE, size: [5, 8], features: { water: [0, 1], gap: [0, 1], hedge: [0, 1], boulder: [1, 3] }, mechanics: ['gate'] },
  canyon: { ...BASE, size: [5, 8], features: { water: [0, 1], gap: [1, 2], hedge: [0, 1], boulder: [0, 2] }, mechanics: ['bridge'] },
  woods: { ...BASE, size: [5, 8], features: { water: [0, 1], gap: [0, 1], hedge: [0, 2], boulder: [0, 2] }, mechanics: ['burrow', 'bees'], anyMechanic: true },
};

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

function walls(r, g) {
  const area = (g.length - 2) * (g[0].length - 2);
  const segments = r.int(Math.floor(area / 14), Math.floor(area / 7));
  for (let n = 0; n < segments; n++) line(r, g, '#', r.int(1, 4));
}

// ---------- mechanic placement ----------

const ARROW = { '1,0': '>', '-1,0': '<', '0,1': 'v', '0,-1': '^' };

const PLACE = {
  current(r, g) {
    const [dx, dy] = r.pick(STEPS);
    const len = r.int(3, 6);
    const free = cells(g);
    let [x, y] = r.pick(free);
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
    // Gates replace tiles in walls so they become doors.
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
      const free = cells(g);
      let [x, y] = r.pick(free);
      const path = [[x, y]];
      const len = r.int(2, 3);
      for (let s = 1; s < len; s++) {
        if (!inside(g, x + dx, y + dy) || g[y + dy][x + dx] === '#') break;
        x += dx;
        y += dy;
        path.push([x, y]);
      }
      if (path.length < 2) continue;
      // Ping-pong patrol, optionally pausing at one end to vary the rhythm.
      const cycle = [...path, ...path.slice(1, -1).reverse()];
      if (r.chance(0.4)) cycle.push(cycle[0]);
      bees.push(cycle);
    }
    if (bees.length) def.bees = bees;
  },
};

// ---------- candidate generation ----------

export function candidate(r, spec, mechanics = spec.mechanics) {
  const w = r.int(spec.size[0], spec.size[1]) + 2;
  const h = r.int(spec.size[0], spec.size[1]) + 2;
  const g = blank(w, h);
  const def = {};
  walls(r, g);
  for (const m of mechanics) PLACE[m](r, g, def);
  const f = spec.features;
  for (let n = r.int(...f.water); n > 0; n--) blob(r, g, '~', r.int(1, 4));
  for (let n = r.int(...f.gap); n > 0; n--) line(r, g, '_', r.int(1, 2));
  for (let n = r.int(...f.hedge); n > 0; n--) line(r, g, 'H', r.int(1, 2));
  for (let n = r.int(...f.boulder); n > 0; n--) blob(r, g, 'B', 1);
  // Start, cage and home on grass, spread apart.
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

const has = {
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

/** Does the level genuinely depend on mechanic `m`? */
function essential(m, def, sol, events, spec) {
  if (!has[m](def)) return false;
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

export function evaluate(def, spec) {
  let level;
  try {
    level = parseLevel({ id: 'gen', pet: 'kitten', ...def });
  } catch {
    return null;
  }
  const state = createState(level, spec.owned);
  const sol = solve(state, { maxNodes: spec.maxNodes });
  if (!sol.solved || sol.moves < spec.minMoves || sol.moves > spec.maxMoves) return null;
  const { results } = replay(state, sol.actions);
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
  if (events.caught) return null;
  const needs = spec.owned.filter((c) => {
    const r = trySolve(def, spec.owned.filter((o) => o !== c), spec.maxNodes);
    return !r.solved && !r.exhausted;
  });
  if (needs.length < spec.minNeeds) return null;
  const mechanics = spec.mechanics.filter((m) => has[m](def));
  const ess = mechanics.filter((m) => essential(m, def, sol, events, spec));
  if (spec.anyMechanic ? ess.length === 0 : ess.length < spec.mechanics.length) return null;
  const interesting = Object.entries(events).filter(([k, v]) => v > 0 && k !== 'switch').length;
  if (interesting < 2) return null;
  const difficulty = sol.moves + 4 * events.switch + 3 * (events.push + events.dig) + 5 * needs.length + 6 * ess.length + 2 * Math.log2(1 + sol.nodes);
  return { def: { ...def, par: sol.moves }, difficulty, needs, mechanics: ess, events, nodes: sol.nodes };
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
