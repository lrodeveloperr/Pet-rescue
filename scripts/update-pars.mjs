// Recomputes par (minimum moves) for every campaign and daily level after a rules change,
// keeping the levels and their order. Usage: node scripts/update-pars.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { parseLevel, createState, solve, COMPANIONS } from '../src/logic.js';
import { WORLDS, DAILY } from '../src/levels/campaign.js';

let changed = 0;
const owned = [];
for (const w of WORLDS) {
  for (const def of w.levels) {
    const level = parseLevel(def);
    const r = solve(createState(level, w.key === 'meadow' ? owned : COMPANIONS));
    if (!r.solved) throw new Error(`${def.id} is unsolvable`);
    if (r.moves !== def.par) changed++;
    def.par = r.moves;
    if (COMPANIONS.includes(level.pet) && !owned.includes(level.pet)) owned.push(level.pet);
  }
}
for (const def of DAILY) {
  const r = solve(createState(parseLevel(def), COMPANIONS));
  if (!r.solved) throw new Error(`${def.id} is unsolvable`);
  if (r.moves !== def.par) changed++;
  def.par = r.moves;
}
const file = new URL('../src/levels/campaign.js', import.meta.url);
const header = readFileSync(file, 'utf8').split('\n').slice(0, 2).join('\n');
writeFileSync(file, `${header}\nexport const WORLDS = ${JSON.stringify(WORLDS)};\nexport const DAILY = ${JSON.stringify(DAILY)};\n`);
console.log(`updated ${changed} par values`);
