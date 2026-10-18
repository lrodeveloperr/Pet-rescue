// End-to-end smoke test of the production build in headless Chromium.
// Plays levels in every world through the game's own input paths, exercises the map, garden,
// album, hats, daily puzzle and the ad flows (with stand-in ads), and saves screenshots.
import { mkdirSync } from 'node:fs';
import { preview } from 'vite';
import { chromium } from 'playwright-core';

const OUT = new URL('../screenshots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const server = await preview({ preview: { port: 4173, strictPort: true }, logLevel: 'silent' });
const base = 'http://localhost:4173/?debug';
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

async function open(viewport, query = '') {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
  // The Playables SDK is not reachable here; the game must run without it.
  await page.route('https://www.youtube.com/**', (r) => r.abort());
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && !/youtube\.com|ERR_FAILED/.test(m.text()) && errors.push(`console: ${m.text()}`));
  await page.goto(base + query);
  await page.waitForFunction(() => window.__petRescue?.game?.state);
  return page;
}

const idle = (page) => page.waitForFunction(() => !window.__petRescue.game.busy, null, { timeout: 20000 });
const shot = (page, name) => page.screenshot({ path: `${OUT}${name}.png` });

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
    if (!sol.solved) return { won: false };
    for (const a of sol.actions) {
      if (a.startsWith('use:')) game.selectCompanion(a.slice(4));
      else game.swipe(a);
      await new Promise((r) => setTimeout(r, 15));
      await wait();
    }
    return { won: game.state.won, moves: game.state.turn, par: game.def.par };
  });
}

const winPanel = (page) => page.waitForSelector('.overlay.win:not(.hidden)', { timeout: 8000 });

try {
  // ---------- portrait phone: first session ----------
  const page = await open({ width: 390, height: 844 });
  await page.waitForTimeout(1600);
  await shot(page, '01-level1-portrait');
  check(await page.evaluate(() => !document.querySelector('.hand').classList.contains('hidden')), 'tutorial hand is shown on level 1');

  const lv = await page.evaluate(() => ({ cage: window.__petRescue.game.state.cage, exit: window.__petRescue.game.state.exit }));
  await tapTile(page, lv.cage);
  check(await page.evaluate(() => window.__petRescue.game.state.rescued), 'tapping the cage walks there and rescues the puppy');
  await tapTile(page, lv.exit);
  await winPanel(page);
  check((await page.locator('.overlay.win .win-stars .s.on').count()) === 3, 'efficient first rescue earns three stars');
  await shot(page, '02-level1-win');

  await page.click('.overlay.win .btn.primary', { force: true });
  await page.waitForTimeout(400);
  check(await page.evaluate(() => window.__petRescue.game.index === 1), 'next button opens level 2');
  check((await page.locator('.daily-ready').count()) === 0, 'no daily prompt before all companions are rescued');

  // A real one-finger swipe on the canvas takes one step; undo reverts it.
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
  check((await page.evaluate(() => window.__petRescue.game.history.length)) === 1, `swipe ${dir} on the canvas takes one step`);
  await page.click('.hud .group .btn:first-child');
  check((await page.evaluate(() => window.__petRescue.game.history.length)) === 0, 'undo button reverts the move');

  for (let i = 1; i < 12; i++) {
    const r = await autoplay(page);
    check(r.won && r.moves === r.par, `meadow-${i + 1} completed in par (${r.moves}/${r.par})`);
    await winPanel(page);
    if (i === 4) check((await page.locator('.daily-ready').count()) === 1, 'win panel invites to the daily puzzle once it unlocks');
    await page.click('.overlay.win .btn.primary', { force: true });
    await page.waitForTimeout(250);
  }

  // ---------- every world: first, middle and last level ----------
  const indices = await page.evaluate(() => window.__petRescue.levelIndex);
  for (const [world, first] of Object.entries(indices)) {
    for (const offset of [0, 24, 49]) {
      const i = first + offset;
      await page.evaluate((i) => window.__petRescue.game.startLevel(i), i);
      await page.waitForTimeout(offset === 0 ? 900 : 100);
      if (offset === 0) await shot(page, `03-${world}-portrait`);
      const r = await autoplay(page);
      check(r.won, `${world} level ${offset + 1} completed (${r.moves}/${r.par} moves)`);
      await winPanel(page);
    }
  }

  // ---------- map, garden, album, hats ----------
  await page.evaluate(() => window.__petRescue.game.openMap(2));
  await page.waitForTimeout(400);
  check((await page.locator('.map-grid .node').count()) === 50, 'map shows the 50 levels of a world');
  check((await page.locator('.tabs .tab').count()) === 6, 'map shows six world tabs');
  await shot(page, '04-map');

  await page.click('.map-head .btn:last-child', { force: true });
  await page.waitForTimeout(900);
  check(await page.evaluate(() => window.__petRescue.game.mode === 'garden'), 'garden opens from the map');
  const pets = await page.evaluate(() => window.__petRescue.game.garden.pets.length);
  check(pets >= 10, `garden shows every rescued species (${pets})`);
  await shot(page, '05-garden');
  // Tap a pet: it hops.
  const petPos = await page.evaluate(() => {
    const { game, world } = window.__petRescue;
    return world.toScreen(game.garden.pets[0].mesh.position.clone());
  });
  await page.mouse.click(petPos.x, petPos.y);
  check(await page.evaluate(() => window.__petRescue.game.garden.pets.some((p) => p.hop > 0)), 'tapping a pet in the garden makes it hop');
  await page.click('.garden-bar .btn:nth-child(3)', { force: true });
  await page.waitForTimeout(300);
  check((await page.locator('.album-item').count()) === 32, 'album lists all 32 animals');
  await shot(page, '06-album');
  await page.click('.overlay.album .btn', { force: true });
  await page.click('.garden-bar .btn:nth-child(4)', { force: true });
  await page.waitForTimeout(300);
  check((await page.locator('.hat').count()) === 12, 'hat picker lists 12 hats');
  await page.click('.hat:not(.locked)', { force: true });
  check(await page.evaluate(() => window.__petRescue.game.progress.hats.worn !== null), 'wearing an unlocked hat saves it');
  await shot(page, '07-hats');
  await page.click('.overlay.hats .btn', { force: true });

  // ---------- daily puzzle and streak ----------
  await page.evaluate(() => window.__petRescue.game.playDaily());
  await page.waitForTimeout(400);
  check(await page.evaluate(() => Boolean(window.__petRescue.game.daily)), 'daily puzzle starts once all companions are rescued');
  const d = await autoplay(page);
  check(d.won, 'daily puzzle completed');
  await winPanel(page);
  check(await page.evaluate(() => window.__petRescue.game.progress.daily.streak === 1), 'daily completion starts a streak');
  await page.waitForTimeout(700);
  await shot(page, '08-daily-win');

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pet-rescue-progress-v1')));
  check(saved.v === 2 && Object.keys(saved.stars).length >= 12 && saved.daily.streak === 1, 'progress v2 saved with stars and streak');
  await page.reload();
  await page.waitForFunction(() => window.__petRescue?.game?.state);
  check(await page.evaluate(() => window.__petRescue.game.firstUnfinished() === 12), 'reload resumes at the first unfinished level');
  await page.close();

  // ---------- ads with stand-in ads ----------
  const ads = await open({ width: 390, height: 844 }, '&fakeads&fakeadms=250');
  await ads.evaluate(() => {
    const { game } = window.__petRescue;
    game.progress.owned = ['puppy', 'frog', 'duck', 'mole'];
    for (const id of Object.keys(window.__petRescue.levelIds).slice(0, 20)) game.progress.stars[id] = 2;
    game.startLevel(20);
  });
  // Interstitials: none until three levels and the minimum time have passed.
  let shown = 0;
  for (let k = 0; k < 3; k++) {
    await autoplay(ads);
    await winPanel(ads);
    if (k === 2) await ads.evaluate(() => (window.__petRescue.game.ads.lastInterstitial = 0));
    const before = await ads.evaluate(() => window.__petRescue.game.ads.levelsSince);
    await ads.click('.overlay.win .btn.primary', { force: true });
    const ad = await ads.waitForSelector('.fake-ad[data-kind="interstitial"]', { timeout: 600 }).catch(() => null);
    if (ad) shown++;
    check(Boolean(ad) === (k === 2), `interstitial ${k === 2 ? 'shown' : 'not shown'} after ${before} levels`);
    await ads.waitForFunction(() => !document.querySelector('.fake-ad') && !window.__petRescue.game.state.won, null, { timeout: 5000 });
  }

  // Rewarded skip: accepted.
  const before = await ads.evaluate(() => window.__petRescue.game.index);
  await ads.evaluate(() => window.__petRescue.game.offerSkip());
  await ads.waitForSelector('.overlay.offer:not(.hidden)');
  await ads.waitForTimeout(500);
  await shot(ads, '09-offer-skip');
  check((await ads.locator('.offer-text').innerText()).length > 20, 'skip offer explains the ad and reward in words');
  await ads.click('.offer-card .btn.primary', { force: true });
  await ads.waitForFunction((b) => window.__petRescue.game.index === b + 1, before, { timeout: 5000 });
  check(await ads.evaluate((b) => window.__petRescue.game.progress.skipped.length === 1, before), 'watching the rewarded ad skips the level');
  // No interstitial straight after a rewarded ad.
  check(await ads.evaluate(() => !window.__petRescue.game.ads.shouldShowInterstitial(100)), 'no interstitial right after a rewarded ad');

  // Mystery hat via rewarded ad.
  await ads.evaluate(() => window.__petRescue.game.openGarden());
  await ads.waitForTimeout(500);
  const hatsBefore = await ads.evaluate(() => window.__petRescue.game.progress.hats.unlocked.length);
  await ads.click('.garden-bar .mystery', { force: true });
  await ads.click('.offer-card .btn.primary', { force: true });
  await ads.waitForSelector('.overlay.hats:not(.hidden)', { timeout: 5000 });
  check((await ads.evaluate(() => window.__petRescue.game.progress.hats.unlocked.length)) === hatsBefore + 1, 'mystery-hat ad unlocks one hat');
  await ads.close();

  // Declined / unfinished rewarded ad: no reward, play continues.
  const decline = await open({ width: 390, height: 844 }, '&fakeads=decline&fakeadms=200');
  await decline.evaluate(() => {
    const { game } = window.__petRescue;
    game.progress.owned = ['puppy', 'frog', 'duck', 'mole'];
    game.startLevel(30);
    game.offerSkip();
  });
  await decline.click('.offer-card .btn.primary', { force: true });
  await decline.waitForSelector('.toast:not(.hidden)', { timeout: 5000 });
  check(await decline.evaluate(() => window.__petRescue.game.index === 30 && window.__petRescue.game.progress.skipped.length === 0), 'unfinished rewarded ad grants nothing and play continues');
  await decline.evaluate(() => window.__petRescue.game.offerSkip());
  await decline.click('.offer-card .btn:not(.primary)', { force: true });
  check(await decline.evaluate(() => !window.__petRescue.game.ui.overlayOpen && !window.__petRescue.game.menuPaused), '"No thanks" returns straight to play');
  await decline.close();

  // ---------- landscape: bees, blocked feedback, stuck detection ----------
  const land = await open({ width: 844, height: 390 });
  await land.evaluate(() => (window.__petRescue.game.progress.owned = ['puppy', 'frog', 'duck', 'mole']));
  const beeIndex = await land.evaluate(() => window.__petRescue.firstBeeLevel);
  await land.evaluate((i) => window.__petRescue.game.startLevel(i), beeIndex);
  await land.waitForTimeout(800);
  await shot(land, '10-woods-bees-landscape');
  const bees = await autoplay(land);
  check(bees.won, `bee level solved without being stung (${bees.moves}/${bees.par})`);

  await land.evaluate(() => window.__petRescue.game.startLevel(4));
  await land.evaluate(() => window.__petRescue.game.selectCompanion('duck'));
  await land.evaluate(() => {
    const { game } = window.__petRescue;
    game.queue = ['right', 'right', 'right'];
    return game.pump();
  });
  await idle(land);
  check((await land.locator('.bubble').count()) > 0, 'blocked boulder shows a symbol bubble');

  // Stuck detection on meadow-8, which has unwinnable positions.
  const stuck = await land.evaluate(async () => {
    const { game, logic } = window.__petRescue;
    const wait = () => new Promise((res) => { const t = () => (game.busy ? setTimeout(t, 16) : res()); t(); });
    game.startLevel(7);
    const queue = [{ s: game.state, plan: [] }];
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
    if (!found) return null;
    for (const a of found) {
      if (a.startsWith('use:')) game.selectCompanion(a.slice(4));
      else game.swipe(a);
      await new Promise((r) => setTimeout(r, 15));
      await wait();
    }
    await new Promise((r) => setTimeout(r, 400));
    return { attention: !!document.querySelector('.btn.attention'), solvable: logic.solve(game.state).solved };
  });
  check(stuck && stuck.attention && !stuck.solvable, 'unwinnable position lights up undo/restart');
  await shot(land, '11-stuck-landscape');
  await land.close();
} catch (err) {
  failed = true;
  console.error(err);
}

check(errors.length === 0, `no page errors${errors.length ? `:\n  ${errors.join('\n  ')}` : ''}`);
await browser.close();
await new Promise((r) => server.httpServer.close(r));
process.exit(failed ? 1 : 0);
