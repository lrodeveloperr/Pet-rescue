// Campaign statistics used by the engagement audit: par per world (and how it rises), levels
// with reachable dead positions, obstacle clutter, and how many companions each level needs.
//   node scripts/level-stats.mjs
import { WORLDS, DAILY } from '../src/levels.js';
import { parseLevel, createState, solve, replay, COMPANIONS, moveNames, step, setActive } from '../src/logic.js';

const key = (s) => `${s.p}|${s.active}|${s.rescued ? 1 : 0}|${s.b}|${s.bees.length ? s.turn % s.period : 0}|${s.t.join('')}`;

/** Reachable states that can no longer reach a win (search capped at 60k states). */
function deadStates(st) {
  const nodes = new Map([[key(st), st]]);
  const queue = [st];
  const edges = new Map();
  const wins = new Set();
  while (queue.length && nodes.size < 60000) {
    const s = queue.shift();
    const out = [];
    for (const r of [...moveNames(s).map((d) => step(s, d)), ...s.owned.map((c) => setActive(s, c))]) {
      if (!r.ok) continue;
      const k = key(r.state);
      out.push(k);
      if (r.state.won) {
        wins.add(k);
        continue;
      }
      if (!nodes.has(k)) {
        nodes.set(k, r.state);
        queue.push(r.state);
      }
    }
    edges.set(key(s), out);
  }
  const back = new Map();
  for (const [a, out] of edges) for (const b of out) (back.get(b) ?? back.set(b, []).get(b)).push(a);
  const good = new Set(wins);
  const q = [...wins];
  while (q.length) for (const a of back.get(q.shift()) ?? []) if (!good.has(a)) good.add(a) && q.push(a);
  let dead = 0;
  for (const k of nodes.keys()) if (!good.has(k)) dead++;
  return dead;
}

const isObstacle = (c) => '~_H*><^vog%()[]'.includes(c);
const owned = [];
const table = [];
let all = [];
for (const w of WORLDS) {
  const rows = [];
  for (const [n, def] of w.levels.entries()) {
    const level = parseLevel(def);
    const own = w.key === 'meadow' ? owned.slice() : COMPANIONS;
    const st = createState(level, own);
    const sol = solve(st);
    const { results } = replay(st, sol.actions);
    const touched = new Set();
    for (const r of results) {
      if (!r.kind) continue;
      touched.add(r.at);
      if (r.over !== undefined) touched.add(r.over);
      for (const p of r.path ?? []) touched.add(p);
      for (const p of r.boulderPath ?? []) touched.add(p);
    }
    let obstacles = 0;
    let untouched = 0;
    level.terrain.forEach((c, i) => {
      if (isObstacle(c) || level.boulders.includes(i)) {
        obstacles++;
        if (!touched.has(i)) untouched++;
      }
    });
    const needs = own.filter((c) => {
      const r = solve(createState(level, own.filter((o) => o !== c)), { maxNodes: 60000 });
      return !r.solved && !r.exhausted;
    }).length;
    rows.push({ n: n + 1, par: def.par, dead: deadStates(st) > 0, obstacles, untouched, needs, handmade: Boolean(def.handmade), intro: def.intro });
    if (COMPANIONS.includes(level.pet) && !owned.includes(level.pet)) owned.push(level.pet);
  }
  const avg = (list, f) => (list.reduce((a, x) => a + f(x), 0) / list.length).toFixed(1);
  table.push({
    world: w.key,
    par: avg(rows, (r) => r.par),
    halves: `${avg(rows.slice(0, 25), (r) => r.par)} → ${avg(rows.slice(25), (r) => r.par)}`,
    dead: `${rows.filter((r) => r.dead).length}/50`,
    clutter: `${Math.round((100 * rows.reduce((a, r) => a + r.untouched, 0)) / rows.reduce((a, r) => a + r.obstacles, 0))}%`,
    one: rows.filter((r) => !r.handmade && r.needs <= 1).length,
    twoPlus: rows.filter((r) => !r.handmade && r.needs >= 2).length,
    intros: rows.filter((r) => r.intro).map((r) => r.n).join(', '),
    maxFirst12: Math.max(...rows.slice(0, 12).map((r) => r.par)),
  });
  all = all.concat(rows);
}
console.log('| Measure | ' + table.map((t) => t.world).join(' | ') + ' |');
console.log('|---|' + table.map(() => '---').join('|') + '|');
const line = (label, f) => console.log(`| ${label} | ${table.map(f).join(' | ')} |`);
line('Average par (moves)', (t) => t.par);
line('Par, levels 1–25 → 26–50', (t) => t.halves);
line('Levels where a dead (unwinnable) position is reachable', (t) => t.dead);
line('Obstacle tiles never touched by the optimal solution', (t) => t.clutter);
line('Generated levels needing one companion / two or more', (t) => `${t.one} / ${t.twoPlus}`);
line('Levels opening with a new element or mix', (t) => t.intros || '—');
console.log(`\nLongest par in the first 12 levels: ${table[0].maxFirst12}`);
console.log(`Par 25 or more: ${all.filter((r) => r.par >= 25).length} levels; par 10–14: ${all.filter((r) => r.par >= 10 && r.par <= 14).length}`);
console.log(`Daily pool: ${DAILY.length} puzzles, average par ${(DAILY.reduce((a, d) => a + d.par, 0) / DAILY.length).toFixed(1)}`);
