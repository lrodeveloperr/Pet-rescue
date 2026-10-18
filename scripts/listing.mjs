// Renders store-listing thumbnails from real gameplay in several aspect ratios.
// No text, no logos (Playables rule); the HUD is hidden so only the 3D scene shows.
// Output: listing/<scene>-<ratio>.jpg. Exact pixel sizes required by the YouTube Developer
// Portal should be checked there; these cover the common ratios at high resolution.
import { mkdirSync } from 'node:fs';
import { preview } from 'vite';
import { chromium } from 'playwright-core';

const OUT = new URL('../listing/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const RATIOS = {
  '16x9': { width: 960, height: 540 },
  '1x1': { width: 540, height: 540 },
  '9x16': { width: 540, height: 960 },
  '4x3': { width: 720, height: 540 },
};

const server = await preview({ preview: { port: 4175, strictPort: true }, logLevel: 'silent' });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

// Each scene sets up the game through the debug hooks, then hides the interface.
const SCENES = {
  // A mid-game level: several companions, a caged pet and a puzzle element in view.
  rescue: async (page) =>
    page.evaluate(async () => {
      const { game, LEVELS, logic } = window.__petRescue;
      game.progress.owned = ['puppy', 'frog', 'duck', 'mole'];
      game.progress.seen = ['current', 'ice', 'gate', 'bridge', 'burrow', 'bees'];
      game.progress.hats.unlocked.push('crown');
      game.progress.hats.worn = 'crown';
      game.world.setHat('crown');
      const pick = LEVELS.findIndex((l) => l.world === 'river' && (l.needs ?? 2) >= 2 && l.par >= 14) ;
      game.startLevel(pick >= 0 ? pick : 60);
      // Play a few moves so the scene shows action, not a start position.
      const sol = logic.solve(game.state);
      for (const a of sol.actions.slice(0, 3)) {
        if (a.startsWith('use:')) game.selectCompanion(a.slice(4));
        else game.swipe(a);
        await new Promise((r) => { const t = () => (game.busy ? setTimeout(t, 16) : r()); setTimeout(t, 20); });
      }
      game.clearHint();
    }),
  // The pet garden: rescued animals in hats among decorations.
  garden: async (page) =>
    page.evaluate(async () => {
      const { game } = window.__petRescue;
      const p = game.progress;
      p.owned = ['puppy', 'frog', 'duck', 'mole'];
      for (const k of ['kitten', 'bunny', 'piglet', 'chick', 'hamster', 'lamb', 'fox', 'panda', 'otter', 'penguin', 'calf', 'redpanda']) p.rescued[k] = 3;
      p.rescued.puppy = p.rescued.frog = p.rescued.duck = p.rescued.mole = 2;
      for (let n = 0; n < 160; n++) p.stars[`x${n}`] = 2;
      p.hats.unlocked = ['party', 'crown', 'flowers', 'beanie', 'cowboy', 'tophat', 'chef', 'bow'];
      p.petHats = { kitten: 'bow', puppy: 'party', piglet: 'crown', panda: 'beanie', fox: 'cowboy', duck: 'flowers' };
      p.hats.worn = 'tophat';
      game.openGarden();
    }),
};

for (const [scene, setup] of Object.entries(SCENES)) {
  for (const [ratio, viewport] of Object.entries(RATIOS)) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
    await page.route('https://www.youtube.com/**', (r) => r.abort());
    await page.goto('http://localhost:4175/?debug');
    await page.waitForFunction(() => window.__petRescue?.game?.state);
    await setup(page);
    await page.addStyleTag({ content: '#ui { display: none !important; }' });
    await page.evaluate(() => {
      const { world, ui } = window.__petRescue;
      world.setInsets({ top: 12, bottom: 12, left: 12, right: 12 });
      ui.hideOverlays();
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}${scene}-${ratio}.jpg`, type: 'jpeg', quality: 88 });
    console.log(`listing/${scene}-${ratio}.jpg`);
    await page.close();
  }
}

await browser.close();
await new Promise((r) => server.httpServer.close(r));
