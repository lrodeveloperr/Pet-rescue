// Design aid: for each level, report solvability, solution length and which abilities are required.
import { LEVELS } from '../src/levels.js';
import { parseLevel, createState, solve, COMPANIONS } from '../src/logic.js';

const owned = [];
for (const def of LEVELS) {
  const level = parseLevel(def);
  const base = solve(createState(level, owned));
  const needed = [];
  for (const c of owned) {
    const r = solve(createState(level, owned.filter((o) => o !== c)));
    if (!r.solved) needed.push(c);
  }
  let needsNew = '';
  if (COMPANIONS.includes(level.pet) && !owned.includes(level.pet)) {
    const r = solve(createState(level, owned), { grantOnRescue: false });
    needsNew = r.solved ? ' NEW-ABILITY-NOT-NEEDED' : ' needs-new-ability';
  }
  console.log(
    `L${def.id} pet=${level.pet} owned=[${owned}] solved=${base.solved} len=${base.actions?.length} nodes=${base.nodes} needs=[${needed}]${needsNew}`,
  );
  if (process.argv.includes('-v') && base.solved) console.log('   ', base.actions.join(' '));
  if (COMPANIONS.includes(level.pet) && !owned.includes(level.pet)) owned.push(level.pet);
}
