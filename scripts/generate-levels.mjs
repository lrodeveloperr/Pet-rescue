// Generates the campaign and the daily-puzzle pool (version 2), using every CPU core.
//   node scripts/generate-levels.mjs        (writes src/levels/campaign.js; about an hour on 4 cores)
// Each world is built from 10-level segments. A segment either introduces the world's mechanic
// (opening with two forced lesson levels) or combines it with an earlier mechanic, so something
// new arrives about every ten levels. Within a segment, levels rise to a short spike, then a
// breather. See scripts/levelgen/core.mjs for the per-level filters.
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { cpus } from 'node:os';
import { writeFileSync } from 'node:fs';
import { rng, segmentSpec, candidate, pickFeatured, evaluate, strip, canonical } from './levelgen/core.mjs';

const LESSON = { size: [4, 5], minMoves: 6, maxMoves: 16, maxDead: 0.05, lesson: true, minDetour: 0, minNeeds: 0, maxNeeds: 1 };
const SPECS = {
  'meadow-two': { mechanics: [], minNeeds: 2, maxNeeds: 2 },
  'meadow-three': { mechanics: [], minNeeds: 2, maxNeeds: 3, size: [5, 8], minMoves: 12 },
  'meadow-bees': { mechanics: ['bees'], minNeeds: 1, maxNeeds: 2 },
  'meadow-bees-two': { mechanics: ['bees'], minNeeds: 2, maxNeeds: 3, size: [5, 8] },
  'lesson-bees': { ...LESSON, mechanics: ['bees'] },
  'lesson-current': { ...LESSON, mechanics: ['current'] },
  'lesson-ice': { ...LESSON, mechanics: ['ice'] },
  'lesson-gate': { ...LESSON, mechanics: ['gate'], minNeeds: 1 },
  'lesson-bridge': { ...LESSON, mechanics: ['bridge'], maxDead: 0.35 },
  'lesson-burrow': { ...LESSON, mechanics: ['burrow'] },
};
const combo = (world, mechanics, extra = {}) => ({ mechanics, requireMechanics: mechanics, size: [5, 8], fallback: [world], ...extra });
// Segment plan per world: [spec name or inline spec, slots].
const WORLD_PLAN = {
  river: [combo('current', ['current'], { size: [5, 7] }), combo('current', ['current', 'bees']), combo('current', ['current'], { minNeeds: 2 }), combo('current', ['current', 'bees'], { minNeeds: 2 }), combo('current', ['current'], { minNeeds: 2, maxNeeds: 3, size: [6, 8] })],
  snow: [combo('ice', ['ice'], { size: [5, 7] }), combo('ice', ['ice', 'current']), combo('ice', ['ice'], { minNeeds: 2 }), combo('ice', ['ice', 'bees']), combo('ice', ['ice', 'current'], { minNeeds: 2 })],
  farm: [combo('gate', ['gate'], { size: [5, 7] }), combo('gate', ['gate', 'ice']), combo('gate', ['gate', 'current']), combo('gate', ['gate', 'bees']), combo('gate', ['gate'], { minNeeds: 2, size: [6, 8] })],
  canyon: [combo('bridge', ['bridge'], { size: [5, 7], maxDead: 0.3 }), combo('bridge', ['bridge', 'gate'], { maxDead: 0.3 }), combo('bridge', ['bridge', 'ice'], { maxDead: 0.3 }), combo('bridge', ['bridge', 'current'], { maxDead: 0.3 }), combo('bridge', ['bridge', 'bees'], { maxDead: 0.3 })],
  woods: [combo('burrow', ['burrow'], { size: [5, 7] }), combo('burrow', ['burrow', 'bees']), combo('burrow', ['burrow', 'gate']), combo('burrow', ['burrow', 'ice']), combo('burrow', ['burrow', 'bridge'], { maxDead: 0.3 })],
};
const WORLD_ORDER = ['meadow', 'river', 'snow', 'farm', 'canyon', 'woods'];
const WORLD_LESSON = { river: 'lesson-current', snow: 'lesson-ice', farm: 'lesson-gate', canyon: 'lesson-bridge', woods: 'lesson-burrow' };
const MINUTES = Number(process.env.GEN_MINUTES || 4);
const DAILY_TARGET = Number(process.env.DAILY_TARGET || 400);

const specOf = (s) => segmentSpec(typeof s === 'string' ? SPECS[s] : s);

if (!isMainThread) {
  const { spec, seed, want, deadline } = workerData;
  const specs = spec.map(specOf);
  const r = rng(seed);
  let found = 0;
  while (found < want && Date.now() < deadline) {
    const sp = r.pick(specs);
    const featured = pickFeatured(r, sp);
    const def = candidate(r, sp, featured);
    if (!def) continue;
    let e = evaluate(def, sp, featured);
    if (!e) continue;
    e = strip(e, sp);
    e.spec = sp.mechanics;
    found++;
    parentPort.postMessage(e);
  }
  parentPort.postMessage({ done: true });
} else {
  const { HANDMADE } = await import('../src/levels/handmade.js');
  const { WORLD_FRIENDS } = await import('../src/species.js');
  const { parseLevel, createState, solve, COMPANIONS } = await import('../src/logic.js');
  const threads = Math.max(1, cpus().length);
  const seen = new Set();
  let seedBase = 1;

  /** Generates up to `want` unique levels for a list of specs within `minutes`. */
  async function generate(spec, want, minutes = MINUTES) {
    const results = [];
    const deadline = Date.now() + minutes * 60000;
    const per = Math.ceil(want / threads);
    await Promise.all(
      Array.from({ length: threads }, () =>
        new Promise((resolve, reject) => {
          const w = new Worker(new URL(import.meta.url), { workerData: { spec: Array.isArray(spec) ? spec : [spec], seed: (seedBase += 7919), want: per, deadline } });
          w.on('message', (m) => {
            if (m.done) return resolve();
            const c = canonical(m.def.map);
            if (seen.has(c)) return;
            seen.add(c);
            results.push(m);
          });
          w.on('error', reject);
        }),
      ),
    );
    return results.sort((a, b) => a.difficulty - b.difficulty);
  }

  /** Fill `slots` from a sorted pool as a sawtooth: a ramp, a short hard spike, then a breather. */
  function sawtooth(pool, slots) {
    const used = new Set();
    const pickNear = (q, filter = () => true) => {
      let best = -1;
      let bestD = Infinity;
      pool.forEach((e, i) => {
        if (used.has(i) || !filter(e)) return;
        const d = Math.abs(i / Math.max(1, pool.length - 1) - q);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      if (best < 0) return null;
      used.add(best);
      return pool[best];
    };
    const out = [];
    for (let k = 0; k < slots; k++) {
      let e;
      if (slots >= 4 && k === slots - 2) e = pickNear(1, (x) => x.def.par <= 22) ?? pickNear(1);
      else if (slots >= 4 && k === slots - 1) e = pickNear(0.25);
      else e = pickNear(0.1 + (0.75 * k) / Math.max(1, slots - 2));
      if (e) out.push({ ...e, spike: slots >= 4 && k === slots - 2 });
    }
    return { chosen: out, rest: pool.filter((_, i) => !used.has(i)) };
  }

  async function segment(spec, slots, label) {
    let pool = await generate(spec, Math.ceil(slots * 1.6) + 2);
    if (pool.length < slots && typeof spec === 'object' && spec.fallback) {
      console.log(`  ${label}: ${pool.length}/${slots}, relaxing to ${spec.fallback}`);
      pool = [...pool, ...(await generate({ ...spec, requireMechanics: spec.fallback }, slots - pool.length + 2))].sort((a, b) => a.difficulty - b.difficulty);
    }
    if (pool.length < slots) {
      console.log(`  ${label}: ${pool.length}/${slots}, relaxing needs`);
      const relaxed = typeof spec === 'string' ? { ...SPECS[spec] } : { ...spec };
      pool = [...pool, ...(await generate({ ...relaxed, minNeeds: 1, requireMechanics: relaxed.fallback ?? relaxed.mechanics }, slots - pool.length + 2, MINUTES * 2))].sort((a, b) => a.difficulty - b.difficulty);
    }
    // Last resort: the world's own mechanic with one companion, until every slot is filled.
    for (let tries = 0; pool.length < slots && tries < 6; tries++) {
      const base = typeof spec === 'string' ? { ...SPECS[spec], minNeeds: 1 } : { mechanics: spec.fallback ?? spec.mechanics, size: [5, 7], minNeeds: 1 };
      pool = [...pool, ...(await generate(base, slots - pool.length + 2, MINUTES))].sort((a, b) => a.difficulty - b.difficulty);
    }
    console.log(`${label}: pool ${pool.length} for ${slots} slots`);
    return sawtooth(pool, slots);
  }

  const lessons = async (name, count) => {
    const pool = await generate(name, count * 6, 2);
    // Lessons: the simplest forced levels, fewest tiles first.
    pool.sort((a, b) => a.def.par + a.def.map.join('').replace(/[.#]/g, '').length - (b.def.par + b.def.map.join('').replace(/[.#]/g, '').length));
    console.log(`${name}: ${pool.length} candidates`);
    return { chosen: pool.slice(0, count).map((e) => ({ ...e, lesson: true })), rest: pool.slice(count) };
  };

  const meta = (e) => ({
    needs: e.needs,
    ...(e.mechanics.length ? { mechanics: e.mechanics } : {}),
    dead: Math.round(e.dead * 100) / 100,
    ...(e.spike ? { spike: true } : {}),
    ...(e.lesson ? { lesson: true } : {}),
  });
  const strip2 = (e) => ({ map: e.def.map, ...(e.def.bees ? { bees: e.def.bees } : {}), par: e.def.par, ...meta(e) });

  const worlds = [];
  let leftovers = [];
  for (const [wi, world] of WORLD_ORDER.entries()) {
    const friends = WORLD_FRIENDS[wi];
    const slots = [];
    const add = (entries, intro) => entries.forEach((e, k) => slots.push({ ...e, ...(k === 0 && intro ? { intro } : {}) }));
    if (world === 'meadow') {
      const hand = (n) => {
        const def = HANDMADE[n - 1];
        const level = parseLevel(def);
        const owned = COMPANIONS.slice(0, Math.min(n - 1, 4));
        const sol = solve(createState(level, owned));
        return { map: def.map, pet: level.pet, par: sol.moves, handmade: true };
      };
      for (let n = 1; n <= 7; n++) slots.push(hand(n));
      slots.push(hand(10));
      const two = await segment('meadow-two', 11, 'meadow-two');
      add(two.chosen.slice(0, 10).map(strip2));
      slots.push({ ...hand(9), spike: true });
      add(two.chosen.slice(10).map(strip2));
      const beeLesson = await lessons('lesson-bees', 1);
      add(beeLesson.chosen.map(strip2), ['bees']);
      const bees = await segment('meadow-bees', 9, 'meadow-bees');
      add(bees.chosen.map(strip2));
      const three = await segment('meadow-three', 10, 'meadow-three');
      add(three.chosen.map(strip2));
      const bees2 = await segment('meadow-bees-two', 10, 'meadow-bees-two');
      add(bees2.chosen.map(strip2));
      leftovers.push(...two.rest, ...bees.rest, ...three.rest, ...bees2.rest);
    } else {
      const mech = WORLD_PLAN[world][0].mechanics[0];
      const lesson = await lessons(WORLD_LESSON[world], 2);
      add(lesson.chosen.map(strip2), [mech]);
      for (const [k, spec] of WORLD_PLAN[world].entries()) {
        const n = k === 0 ? 8 : 10;
        const seg = await segment(spec, n, `${world}-${k + 1}`);
        const isNew = k > 0 && spec.mechanics.length > 1 ? spec.mechanics.filter((m) => m !== mech) : null;
        add(seg.chosen.map(strip2), isNew);
        leftovers.push(...seg.rest);
      }
    }
    worlds.push({ key: world, levels: slots.map((l, k) => ({ id: `${world}-${k + 1}`, pet: l.pet ?? friends[k % friends.length], ...l })) });
    console.log(`${world}: ${slots.length} levels`);
  }

  // Daily pool: leftovers, the long hand-made puzzles, and fresh mixed levels.
  const dailySpecs = [...Object.values(WORLD_PLAN).flat(), SPECS['meadow-two'], SPECS['meadow-bees'], SPECS['meadow-three']].map((s) => ({ ...s, requireMechanics: s.fallback ?? s.mechanics, maxMoves: 30 }));
  const need = Math.max(0, DAILY_TARGET - leftovers.length - 3);
  if (need) leftovers.push(...(await generate(dailySpecs, need, MINUTES * 3)));
  const specials = [8, 11, 12].map((n) => {
    const def = HANDMADE[n - 1];
    const sol = solve(createState(parseLevel(def), COMPANIONS));
    return { map: def.map, par: sol.moves, world: 'meadow', handmade: true };
  });
  const worldOf = (e) => (e.spec?.length ? WORLD_ORDER.find((w) => w !== 'meadow' && WORLD_PLAN[w][0].mechanics[0] === e.spec[0]) ?? 'woods' : 'meadow');
  const pool = leftovers.map((e) => ({ ...strip2(e), world: worldOf(e) }));
  const byWorld = WORLD_ORDER.map((w) => pool.filter((d) => d.world === w));
  const daily = [...specials];
  for (let i = 0; byWorld.some((l) => l.length); i++) {
    const list = byWorld[i % byWorld.length];
    if (list.length) daily.push(list.shift());
  }
  daily.forEach((d, i) => {
    d.id = `daily-${i + 1}`;
    d.pet = WORLD_FRIENDS[WORLD_ORDER.indexOf(d.world)][i % 4];
  });

  const out =
    `// Generated by scripts/generate-levels.mjs. Do not edit by hand.\n` +
    `// Every level is solver-verified; par is the minimum number of moves.\n` +
    `export const WORLDS = ${JSON.stringify(worlds)};\n` +
    `export const DAILY = ${JSON.stringify(daily)};\n`;
  writeFileSync(process.env.GEN_OUT || new URL('../src/levels/campaign.js', import.meta.url), out);
  console.log(`wrote ${worlds.reduce((a, w) => a + w.levels.length, 0)} campaign levels and ${daily.length} daily puzzles`);
}
