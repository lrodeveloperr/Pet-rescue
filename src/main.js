import './style.css';
import { World } from './world.js';
import { Interface } from './ui.js';
import { Audio } from './audio.js';
import { Game } from './game.js';
import * as host from './host.js';
import { setLanguage, t } from './i18n.js';
import * as logic from './logic.js';
import { SoundEngine } from './sound.js';
import { Music } from './music.js';
import { LEVELS, WORLDS, loadWorld } from './levels.js';
import { UI } from './icons.js';

const KEY_DIRS = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};
const COMPANION_KEYS = { Digit1: 'puppy', Digit2: 'frog', Digit3: 'duck', Digit4: 'mole' };

// Even the no-WebGL screen is a picture; its words are for screen readers only.
function fatal(message) {
  const box = document.getElementById('fatal');
  box.innerHTML = `<span class="fatal-icon" aria-hidden="true">${UI.noWebgl}<i>${UI.cross}</i></span><span class="sr-only"></span>`;
  box.querySelector('.sr-only').textContent = message;
  box.hidden = false;
}

async function boot() {
  const languageReady = host.language().then(setLanguage).catch(() => {});
  const canvas = document.getElementById('scene');
  let world;
  try {
    world = new World(canvas);
  } catch (err) {
    console.error(err);
    await languageReady;
    fatal(t('noWebgl'));
    host.logError();
    return;
  }
  world.update(0);
  host.firstFrameReady();
  await languageReady;

  const audio = new Audio();
  let game;
  const ui = new Interface(document.getElementById('ui'), {
    onPause: () => game.openPause(),
    onResume: () => game.resume(),
    onUndo: () => game.undo(),
    onRestart: () => game.restart(),
    onCompanion: (kind) => game.selectCompanion(kind),
    onNext: () => game.next(),
    onMap: () => game.openMap(),
    onCloseMap: () => game.closeMap(),
    onLevel: (k) => game.chooseLevel(k),
    onWorld: (w) => game.openMap(w),
    onDaily: () => game.playDaily(),
    onGarden: () => game.openGarden(),
    onLeaveGarden: () => game.leaveGarden(),
    onAlbum: () => game.openAlbum(),
    onHats: () => game.openHats(),
    onWearHat: (h) => game.wearHat(h),
    onSkip: () => game.offerSkip(),
    onHint: () => game.requestHint(),
    onShare: () => game.shareDaily(),
    onFriend: () => game.offerFriend(),
    onCalendar: () => game.openCalendar(),
    onWeekly: () => game.playWeekly(),
    onEncore: () => game.playEncore(),
    onGardenEdit: () => game.toggleGardenEdit(),
    onMusic: () => game.toggleMusic(),
    onHaptics: () => game.toggleHaptics(),
  });
  game = new Game(world, ui, audio);

  audio.setHostEnabled(host.isAudioEnabled());
  host.onAudioEnabledChange((enabled) => audio.setHostEnabled(enabled));
  host.onPause(() => game.setHostPaused(true));
  host.onResume(() => game.setHostPaused(false));

  await game.loadProgress();
  // A returning player may be in a later world: load its file before the first frame of play.
  const resumeAt = game.firstUnfinished();
  await loadWorld(LEVELS[resumeAt].worldIndex).catch((err) => console.warn(err));
  game.startLevel(resumeAt);

  // One-finger input: a short tap moves to a tile, a swipe takes one step.
  let press = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (press) return;
    press = { id: e.pointerId, x: e.clientX, y: e.clientY, swiped: false };
    audio.unlock();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!press || press.id !== e.pointerId || press.swiped) return;
    const dx = e.clientX - press.x;
    const dy = e.clientY - press.y;
    if (Math.hypot(dx, dy) > 36) {
      press.swiped = true;
      game.swipe(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
    }
  });
  const release = (e) => {
    if (!press || press.id !== e.pointerId) return;
    const moved = Math.hypot(e.clientX - press.x, e.clientY - press.y);
    if (!press.swiped && moved < 16 && e.type === 'pointerup') game.pointerTap(e.clientX, e.clientY);
    press = null;
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  window.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('keydown', (e) => {
    if (e.repeat && !KEY_DIRS[e.code]) return;
    if (KEY_DIRS[e.code]) {
      e.preventDefault();
      game.swipe(KEY_DIRS[e.code]);
    } else if (COMPANION_KEYS[e.code]) {
      game.selectCompanion(COMPANION_KEYS[e.code]);
    } else if (e.code === 'Space') {
      e.preventDefault();
      if (game.state?.bees.length) game.swipe('wait');
    } else if (e.code === 'KeyH') {
      game.requestHint();
    } else if (e.code === 'KeyZ' || e.code === 'Backspace') {
      game.undo();
    } else if (e.code === 'KeyR') {
      game.restart();
    } else if (e.code === 'Escape' || e.code === 'KeyP') {
      game.escape();
    }
  });

  const onResize = () => {
    world.resize();
    world.setInsets(ui.insets());
    ui.hideHand();
    game.onResize();
  };
  window.addEventListener('resize', onResize);
  window.visualViewport?.addEventListener('resize', onResize);

  let last = performance.now();
  world.renderer.setAnimationLoop((now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    // Catch size changes that arrive without a resize event (such as a 0×0 first viewport).
    if (window.innerWidth !== world.sizeW || window.innerHeight !== world.sizeH) onResize();
    if (!game.hostPaused) world.update(dt);
  });

  host.gameReady();
  if (new URLSearchParams(location.search).has('debug')) {
    // Test hooks: the level list and handy indices.
    const levelIndex = {};
    LEVELS.forEach((l, i) => (levelIndex[l.world] ??= i));
    const levelIds = Object.fromEntries(LEVELS.map((l, i) => [l.id, i]));
    const firstBeeLevel = LEVELS.findIndex((l) => l.bees?.length);
    window.__petRescue = { game, world, ui, logic, SoundEngine, Music, LEVELS, WORLDS, loadWorld, levelIndex, levelIds, firstBeeLevel };
  }
}

boot();
