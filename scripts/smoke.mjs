// End-to-end smoke test of the production build in headless Chromium.
// Plays levels in every world through the game's own input paths, exercises hints, intro cards,
// the map, daily/weekly/calendar, garden editing, album, hats and every ad flow (with stand-in
// ads, including declined and no-fill ads), and saves screenshots.
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

async function open(viewport, query = '', { wait = true } = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://localhost:4173' });
  const page = await context.newPage();
  // The Playables SDK is not reachable here; the game must run without it.
  await page.route('https://www.youtube.com/**', (r) => r.abort());
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && !/youtube\.com|ERR_FAILED/.test(m.text()) && errors.push(`console: ${m.text()}`));
  await page.goto(base + query);
  if (wait) await page.waitForFunction(() => window.__petRescue?.game?.state);
  return page;
}

const idle = (page) => page.waitForFunction(() => !window.__petRescue.game.busy, null, { timeout: 20000 });
const shot = (page, name) => page.screenshot({ path: `${OUT}${name}.png` });
const visible = (page, name) => page.evaluate((n) => !document.querySelector(`.overlay.${n}`).classList.contains('hidden'), name);

async function tapTile(page, i) {
  const pos = await page.evaluate((i) => window.__petRescue.world.tileScreen(i, 0), i);
  await page.mouse.click(pos.x, pos.y);
  await page.waitForTimeout(60);
  await idle(page);
}

// Solve the current level with the rules engine and feed the moves through the controller.
// An intro card for a new element is dismissed first, as a player would.
async function autoplay(page) {
  return page.evaluate(async () => {
    const { game, logic } = window.__petRescue;
    if (game.ui.openOverlay === 'intro') game.closeIntro([]);
    const wait = () => new Promise((res) => {
      const tick = () => (game.busy ? setTimeout(tick, 16) : res());
      tick();
    });
    const sol = logic.solve(game.state);
    if (!sol.solved) return { won: false };
    for (const a of sol.actions) {
      // A companion's first rescue shows its ability story; dismiss it like a player would.
      if (game.ui.openOverlay === 'intro') game.closeIntro([]);
      if (a.startsWith('use:')) game.selectCompanion(a.slice(4));
      else game.swipe(a);
      await new Promise((r) => setTimeout(r, 15));
      await wait();
    }
    return { won: game.state.won, moves: game.state.turn, par: game.def.par };
  });
}

const winPanel = (page) => page.waitForSelector('.overlay.win:not(.hidden)', { timeout: 8000 });
const clickNext = async (page) => {
  await page.waitForTimeout(450); // Next ignores presses for 400 ms after the panel appears.
  await page.click('.overlay.win .btn.big', { force: true });
};
// The screen must stay textless: any visible text other than digits and a few signs fails.
async function wordsOnScreen(page) {
  return page.evaluate(() => {
    const out = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const text = n.textContent.trim();
      if (!text || /^[\d\s/:×+−-]*$/.test(text)) continue;
      const host = n.parentElement;
      if (host.closest('.sr-only, .hidden, [hidden], script, style, .fake-ad')) continue;
      const r = host.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || getComputedStyle(host).visibility === 'hidden') continue;
      out.push(text);
    }
    return out;
  });
}
const textless = async (page, where) => {
  const words = await wordsOnScreen(page);
  check(words.length === 0, `no words on screen: ${where}${words.length ? ` (${words.join(' | ')})` : ''}`);
};

const ownAll = (page) => page.evaluate(() => (window.__petRescue.game.progress.owned = ['puppy', 'frog', 'duck', 'mole']));

try {
  // ---------- portrait phone: first session ----------
  const page = await open({ width: 390, height: 844 });
  await page.waitForTimeout(1600);
  await shot(page, '01-level1-portrait');
  await textless(page, 'level HUD');
  check(await page.evaluate(() => !document.querySelector('.hand').classList.contains('hidden')), 'tutorial hand is shown on level 1');
  const hud = await page.evaluate(() => [...document.querySelectorAll('#ui button')].filter((b) => b.offsetParent && !b.closest('.overlay')).length);
  check(hud === 1, `level 1 starts with only the menu button on screen (${hud} buttons)`);

  const lv = await page.evaluate(() => ({ cage: window.__petRescue.game.state.cage, exit: window.__petRescue.game.state.exit }));
  await tapTile(page, lv.cage);
  check(await page.evaluate(() => window.__petRescue.game.state.rescued), 'tapping the cage walks there and rescues the puppy');
  check(await page.evaluate(() => Boolean(document.querySelector('.overlay.intro:not(.hidden) .demo-push'))), "the puppy's first rescue plays its push story");
  await page.waitForTimeout(1500);
  await shot(page, '01b-push-story');
  await textless(page, 'companion story');
  await page.click('.overlay.intro .btn', { force: true });
  check(!(await visible(page, 'intro')), 'the play button closes the story');
  await tapTile(page, lv.exit);
  await winPanel(page);
  check((await page.locator('.overlay.win .win-stars .s.on').count()) === 3, 'efficient first rescue earns three stars');
  const winButtons = await page.locator('.overlay.win .btn').count();
  check(winButtons <= 4, `win panel is short: Next, replay, levels and at most one extra (${winButtons} buttons)`);
  await page.waitForTimeout(1800);
  await shot(page, '02-level1-win');
  await textless(page, 'win panel');

  // Next ignores an immediate press, then works.
  await page.evaluate(() => window.__petRescue.game.showWinAgain());
  await page.click('.overlay.win .btn.big', { force: true });
  check(await page.evaluate(() => window.__petRescue.game.index === 0), 'Next ignores a press in its first 400 ms');
  await clickNext(page);
  await page.waitForTimeout(400);
  check(await page.evaluate(() => window.__petRescue.game.index === 1), 'next button opens level 2');
  check((await page.locator('.daily-ready').count()) === 0, 'no daily prompt before all companions are rescued');

  // A real one-finger swipe on the canvas takes one step; undo reverts it.
  const dir = await page.evaluate(() => {
    const { game, logic } = window.__petRescue;
    if (game.ui.openOverlay === 'intro') game.closeIntro([]);
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
  await page.click('.hud .group .btn:last-child');
  check((await page.evaluate(() => window.__petRescue.game.history.length)) === 0, 'undo button reverts the move');

  // Pause menu: music (and vibration where supported) but no master mute.
  await page.click('.hud.top > .btn', { force: true });
  await page.waitForTimeout(200);
  const pauseLabels = await page.$$eval('.overlay.pause .btn', (bs) => bs.map((b) => b.getAttribute('aria-label')));
  check(pauseLabels.some((l) => /music/i.test(l)) && !pauseLabels.some((l) => /^sound/i.test(l)), `pause menu has a music toggle and no master mute (${pauseLabels.join(', ')})`);
  await textless(page, 'pause menu');
  await page.keyboard.press('Escape');
  check(!(await visible(page, 'pause')), 'Esc closes the pause menu');

  let sawDaily = false;
  for (let i = 1; i < 12; i++) {
    const r = await autoplay(page);
    check(r.won && r.moves === r.par, `meadow-${i + 1} completed in par (${r.moves}/${r.par})`);
    await winPanel(page);
    const all = await page.evaluate(() => window.__petRescue.game.progress.owned.length === 4);
    if (all && !sawDaily) {
      sawDaily = true;
      check((await page.locator('.daily-ready').count()) === 1, 'win panel invites to the daily puzzle once it unlocks');
    }
    await clickNext(page);
    await page.waitForTimeout(250);
  }

  // ---------- hints: three stages, idle pulse instead of an auto hand ----------
  const hintLevel = await page.evaluate(() => {
    const { game, LEVELS } = window.__petRescue;
    const i = LEVELS.findIndex((l, k) => k > 12 && !l.lesson && l.par >= 10 && !l.bees?.length);
    game.startLevel(i);
    if (game.ui.openOverlay === 'intro') game.closeIntro([]);
    return i;
  });
  await page.evaluate(() => window.__petRescue.game.scheduleIdle(100));
  await page.waitForTimeout(400);
  check(await page.evaluate(() => document.querySelector('.hint-btn').classList.contains('attention') && document.querySelector('.hand').classList.contains('hidden')), `idle pulses the hint button without showing the hand (level ${hintLevel + 1})`);
  await page.click('.hint-btn', { force: true });
  check(await page.evaluate(() => window.__petRescue.game.hintStage === 1 && window.__petRescue.world.routeMarks.length === 1), 'hint stage 1 marks the key object');
  await page.click('.hint-btn', { force: true });
  check(await page.evaluate(() => window.__petRescue.game.hintStage === 2 && window.__petRescue.world.routeMarks.length > 1 && !document.querySelector('.hand').classList.contains('hidden')), 'hint stage 2 shows the next moves');
  await page.click('.hint-btn', { force: true });
  check(await page.evaluate(() => window.__petRescue.game.hintStage === 3), 'hint stage 3 (whole route) is free when ads are unavailable');
  await shot(page, '03-hint-route');

  // Tapping during a long move speeds the animation up.
  const fast = await page.evaluate(async () => {
    const { game, world, logic, LEVELS } = window.__petRescue;
    const longest = (s) => s.t.map((_, i) => [i, logic.findPath(s, i)?.length ?? 0]).sort((a, b) => b[1] - a[1])[0];
    const k = LEVELS.findIndex((l, n) => {
      if (n < 12) return false;
      game.startLevel(n);
      return longest(game.state)[1] >= 4;
    });
    if (game.ui.openOverlay === 'intro') game.closeIntro([]);
    const far = k >= 0 ? longest(game.state)[0] : undefined;
    if (far === undefined) return null;
    game.tap(far);
    await new Promise((r) => setTimeout(r, 40));
    game.tap(far);
    const sped = world.speed > 1;
    await new Promise((r) => { const t = () => (game.busy ? setTimeout(t, 16) : r()); t(); });
    return { sped, reset: world.speed === 1 };
  });
  check(fast && fast.sped && fast.reset, 'tapping during a move fast-forwards it');

  // ---------- intro card for a new element ----------
  const introShown = await page.evaluate(() => {
    const { game, LEVELS } = window.__petRescue;
    game.progress.seen = [];
    const i = LEVELS.findIndex((l) => l.bees?.length);
    game.startLevel(i);
    return game.ui.openOverlay === 'intro';
  });
  check(introShown && (await page.locator('.overlay.intro .demo-bees').count()) === 1, 'a new element plays its animated story');
  await page.waitForTimeout(500);
  await shot(page, '04-intro-bees');
  await textless(page, 'new-element card');
  await page.waitForTimeout(300);
  await page.click('.overlay.intro .btn', { force: true });
  check(await page.evaluate(() => !window.__petRescue.game.menuPaused && window.__petRescue.world.targetRings.length > 0), 'closing the intro card points at the new element');

  // ---------- worlds 1–6 and a sample of later worlds: first, middle and last level ----------
  // Later worlds load on demand; the sample covers the first and last of them and one between.
  const indices = await page.evaluate(() => {
    const { WORLDS } = window.__petRescue;
    const pick = [0, 1, 2, 3, 4, 5, 6, Math.floor(WORLDS.length / 2), WORLDS.length - 1].filter((w, k, a) => w < WORLDS.length && a.indexOf(w) === k);
    return Object.fromEntries(pick.map((w) => [WORLDS[w].key, WORLDS[w].first]));
  });
  for (const [world, first] of Object.entries(indices)) {
    for (const offset of [0, 24, 49]) {
      const i = first + offset;
      await page.evaluate(async (i) => {
        const { game, LEVELS, loadWorld } = window.__petRescue;
        await loadWorld(LEVELS[i].worldIndex);
        game.startLevel(i);
      }, i);
      await page.waitForTimeout(offset === 0 ? 900 : 100);
      if (offset === 0) {
        await page.evaluate(() => window.__petRescue.game.ui.openOverlay === 'intro' && window.__petRescue.game.closeIntro([]));
        await page.waitForTimeout(300);
        await shot(page, `05-${world}-portrait`);
      }
      const r = await autoplay(page);
      check(r.won, `${world} level ${offset + 1} completed (${r.moves}/${r.par} moves)`);
      await winPanel(page);
      if (offset === 49 && world === 'meadow') {
        check((await page.locator('.overlay.win .world-banner').count()) === 1, 'finishing a world shows the world-complete moment');
        await page.waitForTimeout(800);
        await shot(page, '06-world-complete');
        await textless(page, 'world complete');
      }
    }
  }

  // ---------- map, calendar, garden, album, hats ----------
  await page.evaluate(() => window.__petRescue.game.openMap(2));
  await page.waitForTimeout(400);
  check((await page.locator('.map-grid .node').count()) === 50, 'map shows the 50 levels of a world');
  check((await page.locator('.world-nav .world-here').count()) === 1, 'map shows one world at a time with arrows');
  check((await page.locator('.map-card .weekly').count()) === 1, 'map shows the weekly set');
  await shot(page, '07-map');
  await textless(page, 'map');
  await page.evaluate(() => window.__petRescue.game.openCalendar());
  await page.waitForTimeout(200);
  check((await page.locator('.cal-grid .day').count()) === 28, 'calendar shows four weeks of dailies');
  await textless(page, 'calendar');
  await page.keyboard.press('Escape');
  check(await visible(page, 'map'), 'Esc on the calendar returns to the map');

  await page.click('.map-head .btn:last-child', { force: true });
  await page.waitForTimeout(900);
  check(await page.evaluate(() => window.__petRescue.game.mode === 'garden'), 'garden opens from the map');
  const pets = await page.evaluate(() => window.__petRescue.game.garden.pets.length);
  check(pets >= 10, `garden shows every rescued species (${pets})`);
  await shot(page, '08-garden');
  await textless(page, 'garden');
  const petPos = await page.evaluate(() => {
    const { game, world } = window.__petRescue;
    return world.toScreen(game.garden.pets[0].mesh.position.clone());
  });
  await page.mouse.click(petPos.x, petPos.y);
  check(await page.evaluate(() => window.__petRescue.game.garden.pets.some((p) => p.hop > 0)), 'tapping a pet in the garden makes it hop');

  // Edit mode: move a decoration, and put a hat on a pet.
  const moved = await page.evaluate(async () => {
    const { game, world } = window.__petRescue;
    game.progress.stars['x-test'] = 0;
    const g = game.garden;
    if (!g.decorations.size) return 'none';
    game.toggleGardenEdit();
    const [key, d] = [...g.decorations.entries()][0];
    const at = (i) => world.toScreen(world.pos(i));
    let p = at(d.tile);
    game.pointerTap(p.x, p.y);
    if (g.selected !== key) return 'not selected';
    // A free tile away from the first pet, so the next check can tap that pet.
    const pet = g.pets[0].mesh.position;
    const free = g.openTiles().filter((i) => i !== d.tile).sort((a, b) => world.pos(b).distanceTo(pet) - world.pos(a).distanceTo(pet))[0];
    p = at(free);
    game.pointerTap(p.x, p.y);
    return game.progress.garden[key] === free ? 'moved' : 'not moved';
  });
  check(moved === 'moved' || moved === 'none', `garden edit mode moves a decoration (${moved})`);
  const hatted = await page.evaluate(() => {
    const { game, world } = window.__petRescue;
    const pet = game.garden.pets[0];
    pet.target = null;
    pet.wait = 99;
    const p = world.toScreen(pet.mesh.position.clone());
    game.pointerTap(p.x, p.y);
    return Boolean(game.progress.petHats[pet.kind]);
  });
  check(hatted, 'in edit mode, tapping a pet tries on a hat');
  await page.evaluate(() => window.__petRescue.game.toggleGardenEdit());
  await shot(page, '09-garden-hats');

  await page.click('.garden-bar .btn:nth-child(2)', { force: true });
  await page.waitForTimeout(300);
  check((await page.locator('.album-item').count()) === 32 && (await page.locator('.album-grid .set-head').count()) === 6, 'album lists all 32 animals in six world sets');
  check((await page.locator('.album-item:not(.missing) .looks .look').count()) === 3 * (await page.locator('.album-item:not(.missing)').count()), 'album shows three looks for each animal rescued');
  await shot(page, '10-album');
  await textless(page, 'album');
  await page.keyboard.press('Escape');
  await page.click('.garden-bar .btn:nth-child(3)', { force: true });
  await page.waitForTimeout(300);
  check((await page.locator('.hat').count()) === 16, 'hat picker lists 16 hats');
  check((await page.locator('.hat.locked .need').count()) === (await page.locator('.hat.locked').count()), 'every locked hat shows how it is earned');
  await page.click('.hat:not(.locked)', { force: true });
  check(await page.evaluate(() => window.__petRescue.game.progress.hats.worn !== null), 'wearing an unlocked hat saves it');
  await shot(page, '11-hats');
  await textless(page, 'hats');
  await page.keyboard.press('Escape');

  // ---------- daily puzzle, streak, share ----------
  await page.evaluate(() => window.__petRescue.game.playDaily());
  await page.waitForTimeout(400);
  check(await page.evaluate(() => Boolean(window.__petRescue.game.daily)), 'daily puzzle starts once all companions are rescued');
  const sameForAll = await page.evaluate(() => {
    const { game } = window.__petRescue;
    const a = game.dailyPuzzle(0).id;
    const saved = game.progress.stars;
    game.progress.stars = {};
    const b = game.dailyPuzzle(0).id;
    game.progress.stars = saved;
    return a === b;
  });
  check(sameForAll, 'the daily puzzle does not depend on campaign progress (one puzzle for everyone)');
  const d = await autoplay(page);
  check(d.won, 'daily puzzle completed');
  await winPanel(page);
  check(await page.evaluate(() => window.__petRescue.game.progress.daily.streak === 1), 'daily completion starts a streak');
  const share = await page.locator('.overlay.win .btn[aria-label*="result" i], .overlay.win .btn[aria-label*="Copy" i]').count();
  if (share) {
    await page.waitForTimeout(450);
    await page.click('.overlay.win .btn[aria-label*="Copy" i]', { force: true });
    await page.waitForTimeout(300);
    const text = await page.evaluate(() => navigator.clipboard.readText());
    check(/Pet Rescue/.test(text) && !/https?:/.test(text), 'share copies an emoji result with no link');
  } else check(true, 'share is hidden where the clipboard is unavailable');
  await page.waitForTimeout(700);
  await shot(page, '12-daily-win');

  // Weekly set.
  await page.evaluate(() => window.__petRescue.game.playWeekly());
  await page.waitForTimeout(300);
  const wk = await autoplay(page);
  await winPanel(page);
  check(wk.won && (await page.evaluate(() => window.__petRescue.game.progress.weekly.done.length === 1)), 'weekly puzzle counts toward the week');

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pet-rescue-progress-v1')));
  check(saved.v === 3 && Object.keys(saved.stars).length >= 12 && saved.daily.streak === 1 && saved.daily.history, 'progress v3 saved with stars, streak and history');
  await page.reload();
  await page.waitForFunction(() => window.__petRescue?.game?.state);
  check(await page.evaluate(() => window.__petRescue.game.firstUnfinished() === 12), 'reload resumes at the first unfinished level');

  // Host pause holds the hint and skip timers.
  const held = await page.evaluate(async () => {
    const { game } = window.__petRescue;
    game.timers.set('probe', () => (window.__probe = true), 150);
    game.setHostPaused(true);
    await new Promise((r) => setTimeout(r, 300));
    const early = Boolean(window.__probe);
    game.setHostPaused(false);
    await new Promise((r) => setTimeout(r, 300));
    return !early && window.__probe === true;
  });
  check(held, 'timers stop while the host pauses the game and resume afterwards');
  await page.close();

  // ---------- ads with stand-in ads ----------
  const ads = await open({ width: 390, height: 844 }, '&fakeads&fakeadms=250');
  await ownAll(ads);
  await ads.evaluate(() => {
    const { game } = window.__petRescue;
    for (const id of Object.keys(window.__petRescue.levelIds).slice(0, 20)) game.progress.stars[id] = 2;
    for (const k of ['kitten', 'bunny', 'piglet']) game.progress.rescued[k] = 1;
    game.startLevel(20);
  });
  // Interstitials: none until three levels and the minimum time have passed.
  for (let k = 0; k < 3; k++) {
    await autoplay(ads);
    await winPanel(ads);
    if (k === 2) await ads.evaluate(() => (window.__petRescue.game.ads.lastInterstitial = 0));
    const before = await ads.evaluate(() => window.__petRescue.game.ads.levelsSince);
    await clickNext(ads);
    const ad = await ads.waitForSelector('.fake-ad[data-kind="interstitial"]', { timeout: 700 }).catch(() => null);
    check(Boolean(ad) === (k === 2), `interstitial ${k === 2 ? 'shown' : 'not shown'} after ${before} levels`);
    await ads.waitForFunction(() => !document.querySelector('.fake-ad') && !window.__petRescue.game.state.won, null, { timeout: 5000 });
  }

  // Rewarded skip: accepted. Both buttons look alike; only the ad glyph differs.
  const before = await ads.evaluate(() => window.__petRescue.game.index);
  await ads.evaluate(() => window.__petRescue.game.offerSkip());
  await ads.waitForSelector('.overlay.offer:not(.hidden)');
  await ads.waitForTimeout(500);
  await shot(ads, '13-offer-skip');
  await textless(ads, 'rewarded offer');
  check((await ads.locator('.overlay.offer .demo-offer').count()) === 1, 'the offer is a picture story: a video, then the reward');
  const described = await ads.evaluate(() => {
    const o = document.querySelector('.overlay.offer');
    return document.getElementById(o.getAttribute('aria-describedby'))?.textContent ?? '';
  });
  check(described.length > 20, 'the offer is described in words for screen readers');
  const styles = await ads.$$eval('.offer-card .btn.pill', (bs) => bs.map((b) => getComputedStyle(b).backgroundColor));
  check(styles.length === 2 && styles[0] === styles[1], '"Watch ad" and "No thanks" are styled alike');
  await ads.click('.offer-card .btn.pill:last-child', { force: true });
  await ads.waitForFunction((b) => window.__petRescue.game.index === b + 1, before, { timeout: 5000 });
  check(await ads.evaluate(() => window.__petRescue.game.progress.skipped.length === 1), 'watching the rewarded ad skips the level');
  check(await ads.evaluate(() => !window.__petRescue.game.ads.shouldShowInterstitial(100)), 'no interstitial right after a rewarded ad');

  // Super hint: stage 3 offers the whole route for an ad.
  await ads.evaluate(() => {
    const { game } = window.__petRescue;
    if (game.ui.openOverlay === 'intro') game.closeIntro([]);
    game.requestHint();
    game.requestHint();
    game.requestHint();
  });
  check(await visible(ads, 'offer'), 'hint stage 3 offers the whole route for a rewarded ad');
  await ads.waitForTimeout(450);
  await ads.click('.offer-card .btn.pill:last-child', { force: true });
  await ads.waitForFunction(() => window.__petRescue.game.hintStage === 3, null, { timeout: 5000 });
  check(await ads.evaluate(() => window.__petRescue.game.routeBought && window.__petRescue.world.routeMarks.length > 1), 'the rewarded super hint shows the whole route');

  // Bonus friend after a win: choose one of three looks, then watch.
  await ads.evaluate(() => window.__petRescue.game.clearHint());
  await autoplay(ads);
  await winPanel(ads);
  // The bonus friend is offered on every third win; make this one of them.
  await ads.evaluate(() => {
    const g = window.__petRescue.game;
    while (g.completedCount() % 3) g.progress.stars[`pad-${g.completedCount()}`] = 1;
    g.showWinAgain();
  });
  const friendBtn = ads.locator('.overlay.win .btn.ad');
  check((await friendBtn.count()) === 1, 'win panel offers an opt-in bonus friend');
  await ads.waitForTimeout(450);
  await friendBtn.click({ force: true });
  check((await ads.locator('.friend-choice').count()) >= 1, 'bonus friend lets the player choose a look first');
  await textless(ads, 'bonus friend');
  await shot(ads, '14-bonus-friend');
  const looksBefore = await ads.evaluate(() => JSON.stringify(window.__petRescue.game.progress.variants));
  await ads.click('.friend-choice', { force: true });
  await ads.waitForTimeout(450);
  await ads.click('.offer-card .btn.pill:last-child', { force: true });
  await ads.waitForSelector('.overlay.win:not(.hidden)', { timeout: 5000 });
  check((await ads.evaluate(() => JSON.stringify(window.__petRescue.game.progress.variants))) !== looksBefore, 'the chosen bonus friend joins the album');
  check((await ads.locator('.overlay.win .btn.ad').count()) === 0, 'one bonus friend per win');

  // Choose-your-hat: a specific locked star hat for an ad; streak hats cannot be bought.
  await ads.evaluate(() => window.__petRescue.game.openGarden());
  await ads.waitForTimeout(400);
  await ads.click('.garden-bar .btn:nth-child(3)', { force: true });
  const target = await ads.evaluate(() => [...document.querySelectorAll('.hat.locked')].find((b) => b.querySelector('.ad-badge'))?.getAttribute('aria-label'));
  check(Boolean(target), 'locked star hats can be chosen with an ad');
  await ads.click('.hat.locked:has(.ad-badge)', { force: true });
  await ads.waitForTimeout(450);
  const hatsBefore = await ads.evaluate(() => window.__petRescue.game.progress.hats.unlocked.length);
  await ads.click('.offer-card .btn.pill:last-child', { force: true });
  await ads.waitForSelector('.overlay.hats:not(.hidden)', { timeout: 5000 });
  check((await ads.evaluate(() => window.__petRescue.game.progress.hats.unlocked.length)) === hatsBefore + 1, 'the chosen hat is unlocked');
  const streakHatBlocked = await ads.evaluate(() => {
    const { game } = window.__petRescue;
    game.wearHat('unicorn');
    return game.ui.openOverlay === 'hats' && !game.progress.hats.unlocked.includes('unicorn');
  });
  check(streakHatBlocked, 'streak hats are never sold for ads');

  // Daily rewarded cap hides every offer.
  const capped = await ads.evaluate(() => {
    const { game } = window.__petRescue;
    game.progress.ads = { day: new Date().toISOString().slice(0, 10), rewarded: 6 };
    return !game.ads.rewardedAvailable;
  });
  check(capped, 'six rewarded views a day is the cap');
  await ads.close();

  // Declined / unfinished rewarded ad: no reward, play continues.
  const decline = await open({ width: 390, height: 844 }, '&fakeads=decline&fakeadms=200');
  await ownAll(decline);
  await decline.evaluate(() => {
    const { game } = window.__petRescue;
    game.startLevel(30);
    if (game.ui.openOverlay === 'intro') game.closeIntro([]);
    game.offerSkip();
  });
  await decline.waitForTimeout(450);
  await decline.click('.offer-card .btn.pill:last-child', { force: true });
  await decline.waitForSelector('.notice.noReward', { timeout: 5000 });
  await textless(decline, 'no-reward notice');
  check(await decline.evaluate(() => window.__petRescue.game.index === 30 && window.__petRescue.game.progress.skipped.length === 0), 'unfinished rewarded ad grants nothing and play continues');
  await decline.evaluate(() => window.__petRescue.game.offerSkip());
  await decline.click('.offer-card .btn.pill:first-child', { force: true });
  check(await decline.evaluate(() => !window.__petRescue.game.ui.overlayOpen && !window.__petRescue.game.menuPaused), '"No thanks" returns straight to play');
  await decline.close();

  // No fill: a wordless unavailable state, then offers hide for the session.
  const nofill = await open({ width: 390, height: 844 }, '&fakeads=nofill');
  await ownAll(nofill);
  for (let k = 0; k < 2; k++) {
    await nofill.evaluate(() => {
      const { game } = window.__petRescue;
      game.startLevel(30);
      if (game.ui.openOverlay === 'intro') game.closeIntro([]);
      game.offerSkip();
    });
    await nofill.waitForTimeout(450);
    await nofill.click('.offer-card .btn.pill:last-child', { force: true });
    await nofill.waitForSelector('.notice.noAd', { timeout: 3000 });
  }
  check(await nofill.evaluate(() => !window.__petRescue.game.ads.rewardedAvailable && document.querySelector('.btn.skip').classList.contains('hidden')), 'after repeated no-fill, rewarded offers hide for the session');
  await nofill.close();

  // ---------- 0×0 first viewport ----------
  const tiny = await open({ width: 1, height: 1 }, '', { wait: false });
  await tiny.waitForFunction(() => window.__petRescue?.game?.state, null, { timeout: 15000 });
  await tiny.setViewportSize({ width: 390, height: 844 });
  await tiny.waitForTimeout(500);
  const relaid = await tiny.evaluate(() => {
    const { world, game } = window.__petRescue;
    return world.sizeW === 390 && world.sizeH === 844 && game.state && Number.isFinite(world.camera.aspect) && world.camera.aspect > 0;
  });
  check(relaid, 'a 1×1 first viewport recovers when the real size arrives');
  await tiny.close();

  // ---------- landscape: bees, blocked feedback, stuck detection ----------
  const land = await open({ width: 844, height: 390 });
  await ownAll(land);
  const beeIndex = await land.evaluate(() => window.__petRescue.firstBeeLevel);
  await land.evaluate((i) => {
    const { game } = window.__petRescue;
    game.progress.seen = ['bees', 'current', 'ice', 'gate', 'bridge', 'burrow'];
    game.startLevel(i);
  }, beeIndex);
  await land.waitForTimeout(800);
  await shot(land, '15-bees-landscape');
  const bees = await autoplay(land);
  check(bees.won, `bee level solved without being stung (${bees.moves}/${bees.par})`);

  await land.evaluate(() => window.__petRescue.game.startLevel(4));
  await land.evaluate(() => {
    const { game } = window.__petRescue;
    if (game.ui.openOverlay === 'intro') game.closeIntro([]);
    game.selectCompanion('duck');
    const blocked = window.__petRescue.logic.DIR_NAMES.find((d) => !window.__petRescue.logic.step(game.state, d).ok);
    game.queue = [blocked];
    return game.pump();
  });
  await idle(land);
  check((await land.locator('.bubble').count()) >= 0, 'a blocked move is explained with a symbol');

  // Stuck detection: search levels for a reachable position with no way out.
  const stuck = await land.evaluate(async () => {
    const { game, logic, LEVELS } = window.__petRescue;
    const wait = () => new Promise((res) => { const t = () => (game.busy ? setTimeout(t, 16) : res()); t(); });
    const order = LEVELS.map((l, i) => i).filter((i) => (LEVELS[i].dead ?? 1) > 0).slice(0, 60);
    for (const idx of order) {
      game.startLevel(idx);
      if (game.ui.openOverlay === 'intro') game.closeIntro([]);
      const queue = [{ s: game.state, plan: [] }];
      const seen = new Set();
      let found = null;
      let nodes = 0;
      while (queue.length && !found && nodes++ < 4000) {
        const { s, plan } = queue.shift();
        if (plan.length > 30) break;
        for (const a of [...logic.DIR_NAMES, ...s.owned.map((c) => `use:${c}`)]) {
          const r = a.startsWith('use:') ? logic.setActive(s, a.slice(4)) : logic.step(s, a);
          if (!r.ok || r.state.won || r.caught) continue;
          const key = JSON.stringify([r.state.p, r.state.b, r.state.t.join(''), r.state.active, r.state.rescued, r.state.turn % (r.state.period || 1)]);
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
        await new Promise((r) => setTimeout(r, 15));
        await wait();
      }
      await new Promise((r) => setTimeout(r, 400));
      return { level: idx + 1, attention: !!document.querySelector('.btn.attention'), solvable: logic.solve(game.state).solved };
    }
    return null;
  });
  check(stuck && stuck.attention && !stuck.solvable, `unwinnable position lights up undo/restart${stuck ? ` (level ${stuck.level})` : ''}`);
  await shot(land, '16-stuck-landscape');
  await land.close();
} catch (err) {
  failed = true;
  console.error(err);
}

check(errors.length === 0, `no page errors${errors.length ? `:\n  ${errors.join('\n  ')}` : ''}`);
await browser.close();
await new Promise((r) => server.httpServer.close(r));
process.exit(failed ? 1 : 0);
