// Checks that every screen of the game fits the display at many sizes: nothing sticks out of
// the viewport and nothing needs scrolling. Saves a contact sheet per screen size.
//   npm run build && node scripts/fit-check.mjs [outDir]
import { mkdirSync } from 'node:fs';
import { preview } from 'vite';
import { chromium } from 'playwright-core';

const OUT = process.argv[2] || new URL('../screenshots/fit/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
export const VIEWPORTS = [
  [320, 568], [360, 640], [390, 844], [412, 915], [568, 320], [640, 360], [844, 390], [915, 412],
  [768, 1024], [1024, 768], [1280, 800], [1920, 1080], [2560, 1080], [600, 600],
];

const server = await preview({ preview: { port: 4178, strictPort: true }, logLevel: 'silent' });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

// Every screen, set up through the game's own entry points.
const SCREENS = {
  play: (g) => {
    g.startLevel(30);
    if (g.ui.openOverlay === 'intro') g.closeIntro([]);
    g.ui.setHint('pulse');
    g.ui.setStuck(true);
    g.ui.setSkip(true);
  },
  win: (g) => {
    g.startLevel(49);
    g.ui.hideOverlays();
    g.state = { ...g.state, won: true };
    g.lastWin = { pet: 'fox', variant: 1, newLook: true, gained: null, stars: 3, moves: 12, par: 12, hats: ['crown'], decoration: true, souvenirs: ['meadow'], streak: null, worldDone: { key: 'meadow', number: 1, stars: 140, max: 150, next: 'river' }, goal: null };
    g.showWinPanel(g.lastWin);
  },
  map: (g) => g.openMap(0),
  pause: (g) => {
    g.startLevel(30);
    g.ui.hideOverlays();
    g.menuPaused = false;
    g.openPause();
  },
  intro: (g) => g.ui.showIntro({ mechanics: ['ice', 'current'], onPlay() {} }),
  offer: (g) => g.ui.showOffer({ kind: 'skip', text: 'x', art: { pet: 'otter' }, onAccept() {}, onDecline() {} }),
  calendar: (g) => g.openCalendar(),
  garden: (g) => g.openGarden(),
  album: (g) => {
    g.openGarden();
    g.openAlbum();
  },
  hats: (g) => {
    g.openGarden();
    g.openHats();
  },
  friends: (g) => g.ui.showFriends({ choices: [{ kind: 'fox', variant: 1 }, { kind: 'otter', variant: 2 }, { kind: 'kitten', variant: 1 }], onPick() {}, onClose() {} }),
};

/** Problems on the current screen: anything outside the viewport, and anything that scrolls. */
function measure() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const out = [];
  const name = (e) => `${e.tagName.toLowerCase()}.${[...e.classList].join('.')}`;
  for (const e of document.querySelectorAll('#ui *')) {
    if (e.closest('.layer, .hidden, [hidden], .sr-only') || !e.offsetParent) continue;
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    if (r.left < -1 || r.top < -1 || r.right > W + 1 || r.bottom > H + 1) out.push(`${name(e)} outside (${Math.round(r.left)},${Math.round(r.top)})-(${Math.round(r.right)},${Math.round(r.bottom)})`);
    const cs = getComputedStyle(e);
    if (/(auto|scroll)/.test(cs.overflowY + cs.overflowX) && (e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1)) out.push(`${name(e)} scrolls`);
  }
  const doc = document.scrollingElement;
  if (doc.scrollHeight > H + 1 || doc.scrollWidth > W + 1) out.push('page scrolls');
  return [...new Set(out)].slice(0, 6);
}

let problems = 0;
for (const [w, h] of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.route('https://www.youtube.com/**', (r) => r.abort());
  page.on('pageerror', (e) => console.log(`  pageerror ${e.message}`));
  await page.goto('http://localhost:4178/?debug&fakeads');
  await page.waitForFunction(() => window.__petRescue?.game?.state);
  await page.evaluate(() => {
    const { game, LEVELS } = window.__petRescue;
    const p = game.progress;
    p.owned = ['puppy', 'frog', 'duck', 'mole'];
    for (let n = 0; n < 60; n++) p.stars[LEVELS[n].id] = 1 + (n % 3);
    for (const k of ['kitten', 'bunny', 'piglet', 'otter', 'fox', 'penguin']) p.rescued[k] = 2;
    p.daily.streak = 4;
    p.daily.best = 9;
    p.daily.freezes = 1;
  });
  for (const [screen, setup] of Object.entries(SCREENS)) {
    await page.evaluate(`(${setup.toString()})(window.__petRescue.game)`);
    await page.waitForTimeout(screen === 'play' || screen === 'garden' ? 800 : 650);
    const found = await page.evaluate(measure);
    if (found.length) {
      problems += found.length;
      console.log(`${w}x${h} ${screen}: ${found.join('; ')}`);
    }
    await page.screenshot({ path: `${OUT}${w}x${h}-${screen}.png` });
    await page.evaluate(() => {
      const g = window.__petRescue.game;
      g.ui.hideOverlays();
      g.menuPaused = false;
    });
  }
  await page.close();
}
console.log(problems ? `${problems} fit problems` : 'every screen fits at every size');
await browser.close();
await new Promise((r) => server.httpServer.close(r));
process.exit(problems ? 1 : 0);
