// End-to-end smoke test of the production build in headless Chromium.
// Plays every level through the game's own input paths and saves screenshots.
import { mkdirSync } from 'node:fs';
import { preview } from 'vite';
import { chromium } from 'playwright-core';

const OUT = new URL('../screenshots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const server = await preview({ preview: { port: 4173, strictPort: true }, logLevel: 'silent' });
const url = 'http://localhost:4173/?debug';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

const errors = [];
let failed = false;
const check = (cond, msg) => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${msg}`);
  if (!cond) failed = true;
};

async function open(viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2, hasTouch: false });
  // The Playables SDK is not reachable here; the game must run without it.
  await page.route('https://www.youtube.com/**', (r) => r.abort());
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && !m.text().includes('youtube.com') && !m.text().includes('ERR_FAILED') && errors.push(`console: ${m.text()}`));
  await page.goto(url);
  await page.waitForFunction(() => window.__petRescue?.game?.state);
  return page;
}

const idle = (page) => page.waitForFunction(() => !window.__petRescue.game.busy, null, { timeout: 15000 });

async function tapTile(page, i) {
  const pos = await page.evaluate((i) => window.__petRescue.world.tileScreen(i, 0), i);
  await page.mouse.click(pos.x, pos.y);
  await page.waitForTimeout(60);
  await idle(page);
}

// Solve the current level with the rules engine and feed the moves through the controller.
async function autoplay(page) {
  return page.evaluate(async () => {
    const { game, logic } = window.__petRescue;
    const wait = () => new Promise((res) => {
      const tick = () => (game.busy ? setTimeout(tick, 16) : res());
      tick();
    });
    const sol = logic.solve(game.state);
    if (!sol.solved) return false;
    for (const a of sol.actions) {
      if (a.startsWith('use:')) game.selectCompanion(a.slice(4));
      else game.swipe(a);
      await new Promise((r) => setTimeout(r, 20));
      await wait();
    }
    return game.state.won;
  });
}

try {
  // ---------- portrait phone ----------
  const page = await open({ width: 390, height: 844 });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${OUT}01-level1-portrait.png` });
  check(await page.evaluate(() => !document.querySelector('.hand').classList.contains('hidden')), 'tutorial hand is shown on level 1');

  // Level 1 with real mouse taps: cage, then home.
  const lv = await page.evaluate(() => ({ cage: window.__petRescue.game.state.cage, exit: window.__petRescue.game.state.exit }));
  await tapTile(page, lv.cage);
  check(await page.evaluate(() => window.__petRescue.game.state.rescued), 'tapping the cage walks there and rescues the puppy');
  check(await page.evaluate(() => window.__petRescue.game.state.owned.includes('puppy')), 'puppy joins the companions');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}02-level1-rescued.png` });
  await tapTile(page, lv.exit);
  await page.waitForSelector('.overlay.win:not(.hidden)', { timeout: 5000 });
  check(true, 'reaching home shows the win panel');
  await page.screenshot({ path: `${OUT}03-level1-win.png` });

  // Undo/restart and blocked feedback on level 2.
  await page.click('.overlay.win .btn.primary', { force: true });
  await page.waitForTimeout(400);
  check(await page.evaluate(() => window.__petRescue.game.index === 1), 'next button opens level 2');
  await page.evaluate(() => {
    const { game, logic } = window.__petRescue;
    game.swipe(logic.solve(game.state).actions.find((a) => !a.startsWith('use:')));
  });
  await idle(page);
  const moved = await page.evaluate(() => window.__petRescue.game.history.length);
  await page.click('.hud .group .btn:first-child');
  check((await page.evaluate(() => window.__petRescue.game.history.length)) === moved - 1, 'undo button reverts one move');

  // A real one-finger swipe on the canvas takes one step.
  const before = await page.evaluate(() => window.__petRescue.game.history.length);
  const dir = await page.evaluate(() => {
    const { game, logic } = window.__petRescue;
    return logic.DIR_NAMES.find((d) => logic.step(game.state, d).ok);
  });
  const v = { up: [0, -80], down: [0, 80], left: [-80, 0], right: [80, 0] }[dir];
  await page.mouse.move(195, 600);
  await page.mouse.down();
  await page.mouse.move(195 + v[0] / 2, 600 + v[1] / 2, { steps: 4 });
  await page.mouse.move(195 + v[0], 600 + v[1], { steps: 4 });
  await page.mouse.up();
  await idle(page);
  check((await page.evaluate(() => window.__petRescue.game.history.length)) === before + 1, `swipe ${dir} on the canvas takes one step`);
  await page.click('.hud .group .btn:first-child');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}04-level2-portrait.png` });
  for (let i = 1; i < 12; i++) {
    const index = await page.evaluate(() => window.__petRescue.game.index);
    if (index === 6) await page.screenshot({ path: `${OUT}05-level7-start.png` });
    const won = await autoplay(page);
    check(won, `level ${index + 1} completed through the game controller`);
    await page.waitForSelector('.overlay.win:not(.hidden)', { timeout: 6000 });
    if (index === 2) await page.screenshot({ path: `${OUT}06-level3-win-duck.png` });
    if (index === 11) {
      await page.screenshot({ path: `${OUT}07-level12-win.png` });
      break;
    }
    await page.click('.overlay.win .btn.primary', { force: true });
    await page.waitForTimeout(250);
  }
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('pet-rescue-progress-v1')));
  check(progress.done.length === 12 && progress.owned.length === 4, 'progress saved: 12 levels done, 4 companions');

  // Reload: progress is restored and the map shows every level as done.
  await page.reload();
  await page.waitForFunction(() => window.__petRescue?.game?.state);
  await page.evaluate(() => window.__petRescue.game.openMap());
  await page.waitForTimeout(400);
  check((await page.locator('.node.done').count()) === 12, 'level map shows 12 completed levels after reload');
  await page.screenshot({ path: `${OUT}08-map.png` });
  await page.close();

  // ---------- landscape phone, stuck detection ----------
  const land = await open({ width: 844, height: 390 });
  // Fresh browser context: grant the companions a player would have by now.
  await land.evaluate(() => (window.__petRescue.game.progress.owned = ['puppy', 'frog', 'duck', 'mole']));
  await land.evaluate(() => window.__petRescue.game.startLevel(10));
  await land.waitForTimeout(800);
  await land.screenshot({ path: `${OUT}09-level11-landscape.png` });
  // Level 5 with the duck leading: walking into the boulder is blocked and explained with a symbol.
  await land.evaluate(() => window.__petRescue.game.startLevel(4));
  await land.evaluate(() => window.__petRescue.game.selectCompanion('duck'));
  await land.evaluate(() => {
    const { game } = window.__petRescue;
    game.queue = ['right', 'right', 'right'];
    return game.pump();
  });
  await idle(land);
  check((await land.locator('.bubble').count()) > 0, 'blocked boulder shows a symbol bubble');
  await land.waitForTimeout(300);
  await land.screenshot({ path: `${OUT}10-blocked-landscape.png` });

  // Stuck detection: only levels 8 and 11 have unwinnable positions; find one on level 8,
  // play it through the controller and expect undo/restart to call for attention.
  const stuck = await land.evaluate(async () => {
    const { game, logic } = window.__petRescue;
    const wait = () => new Promise((res) => { const t = () => (game.busy ? setTimeout(t, 16) : res()); t(); });
    for (const level of [7]) {
      game.startLevel(level);
      const start = game.state;
      const queue = [{ s: start, plan: [] }];
      const seen = new Set();
      let found = null;
      while (queue.length && !found) {
        const { s, plan } = queue.shift();
        if (plan.length > 40) break;
        for (const a of [...logic.DIR_NAMES, ...s.owned.map((c) => `use:${c}`)]) {
          const r = a.startsWith('use:') ? logic.setActive(s, a.slice(4)) : logic.step(s, a);
          if (!r.ok || r.state.won) continue;
          const key = JSON.stringify([r.state.p, r.state.b, r.state.t.join(''), r.state.active, r.state.rescued]);
          if (seen.has(key)) continue;
          seen.add(key);
          const next = [...plan, a];
          if (r.destructive && !logic.solve(r.state, { maxNodes: 50000 }).solved) { found = next; break; }
          queue.push({ s: r.state, plan: next });
        }
      }
      if (!found) continue;
      for (const a of found) {
        if (a.startsWith('use:')) game.selectCompanion(a.slice(4));
        else game.swipe(a);
        await new Promise((r) => setTimeout(r, 20));
        await wait();
      }
      await new Promise((r) => setTimeout(r, 400));
      return { level: level + 1, plan: found.join(' '), attention: !!document.querySelector('.btn.attention'), solvable: logic.solve(game.state).solved };
    }
    return null;
  });
  check(stuck && stuck.attention && !stuck.solvable, `unwinnable position lights up undo/restart ${JSON.stringify(stuck)}`);
  await land.waitForTimeout(1300);
  await land.screenshot({ path: `${OUT}11-stuck-landscape.png` });
  await land.close();
} catch (err) {
  failed = true;
  console.error(err);
}

check(errors.length === 0, `no page errors${errors.length ? `:\n  ${errors.join('\n  ')}` : ''}`);
await browser.close();
await new Promise((r) => server.httpServer.close(r));
process.exit(failed ? 1 : 0);
