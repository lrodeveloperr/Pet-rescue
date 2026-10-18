// Game controller: connects rules, 3D world, interface, audio, ads and the host SDK.
import { LEVELS, WORLDS, DAILY, WORLD_MECHANIC } from './levels.js';
import {
  ABILITY,
  COMPANIONS,
  DIR_NAMES,
  DIRS,
  createState,
  findPath,
  isWater,
  parseLevel,
  rotateLevel,
  setActive,
  solve,
  step,
} from './logic.js';
import { face, ability, silhouette, UI, HAT_ICONS, MECH_ICONS, WORLD_ICONS } from './icons.js';
import { ALL_ANIMALS, WORLD_FRIENDS } from './species.js';
import { HATS } from './models.js';
import { Ads, AD_POLICY } from './ads.js';
import { Garden, DECORATIONS, SOUVENIRS, nextDecoration, unlockedDecorations } from './garden.js';
import {
  STAR_HATS,
  STREAK_HATS,
  VARIANTS,
  addVariant,
  countRewarded,
  dailyCalendar,
  dayKey,
  dayNumber,
  emptyProgress,
  hasVariant,
  hatRequirement,
  liveStreak,
  migrate,
  msToNextDay,
  newlyEarnedHats,
  recordDaily,
  rewardedToday,
  starsFor,
  totalStars,
  weekKey,
  weekNumber,
} from './progress.js';
import * as host from './host.js';
import { t } from './i18n.js';

const HINT_DELAY_TUTORIAL = 2500;
const IDLE_DELAY = 12000; // idle time before the hint button pulses
const MAX_HISTORY = 400;
const FAST_SPEED = 3; // animation speed while the player taps ahead
const DAILY_EPOCH = Math.floor(Date.UTC(2026, 0, 1) / 86400000);
const WEEKLY_COUNT = 5;

const COMPANION_FOR = Object.fromEntries(Object.entries(ABILITY).map(([c, a]) => [a, c]));

// Album sets: each world's species. The meadow set includes the four companions.
export const ALBUM_SETS = WORLDS.map((w, i) => ({ key: w.key, kinds: i === 0 ? [...COMPANIONS, ...WORLD_FRIENDS[0]] : WORLD_FRIENDS[i] ?? [] }));

/** The puzzle elements a level uses, in a fixed order. */
export function mechanicsOf(def) {
  const map = def.map.join('');
  const out = [];
  if (/[<>^v]/.test(map)) out.push('current');
  if (map.includes('*')) out.push('ice');
  if (map.includes('g') && map.includes('o')) out.push('gate');
  if (map.includes('%')) out.push('bridge');
  if (/[()[\]]/.test(map)) out.push('burrow');
  if (def.bees?.length) out.push('bees');
  return out;
}

function hash(text) {
  let h = 2166136261;
  for (let k = 0; k < text.length; k++) {
    h ^= text.charCodeAt(k);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const mod = (a, n) => ((a % n) + n) % n;

/** Timers that stop while play is held (host pause, an ad, a menu) and resume afterwards. */
class Timers {
  constructor() {
    this.list = new Map();
    this.holds = new Set();
  }

  set(name, fn, ms) {
    this.clear(name);
    const tm = { fn, remaining: ms, start: 0, id: null };
    this.list.set(name, tm);
    if (!this.holds.size) this.run(name, tm);
  }

  run(name, tm) {
    tm.start = performance.now();
    tm.id = setTimeout(() => {
      this.list.delete(name);
      tm.fn();
    }, tm.remaining);
  }

  clear(name) {
    const tm = this.list.get(name);
    if (!tm) return;
    clearTimeout(tm.id);
    this.list.delete(name);
  }

  has(name) {
    return this.list.has(name);
  }

  hold(reason) {
    if (!this.holds.size) {
      for (const tm of this.list.values()) {
        clearTimeout(tm.id);
        tm.remaining = Math.max(0, tm.remaining - (performance.now() - tm.start));
      }
    }
    this.holds.add(reason);
  }

  release(reason) {
    if (!this.holds.delete(reason) || this.holds.size) return;
    for (const [name, tm] of this.list) this.run(name, tm);
  }
}

export class Game {
  constructor(world, ui, audio) {
    this.world = world;
    this.ui = ui;
    this.audio = audio;
    this.progress = emptyProgress();
    this.ads = new Ads(undefined, {
      today: () => rewardedToday(this.progress),
      add: () => {
        countRewarded(this.progress);
        this.saveProgress();
      },
    });
    this.timers = new Timers();
    this.queue = [];
    this.history = [];
    this.busy = false;
    this.menuPaused = false;
    this.hostPaused = false;
    this.pendingTap = null;
    this.goalKey = '';
    this.mode = 'level';
    this.mapWorld = 0;
    this.extra = null; // { kind: 'daily' | 'weekly' | 'encore', def, n }
    this.restarts = 0;
    this.restartKey = null;
    this.lastSuperHint = -Infinity;
    this.saveWarned = false;
    this.hadSave = false;
  }

  get daily() {
    return this.extra?.kind === 'daily' ? this.extra : null;
  }

  // ---------- progress ----------

  async loadProgress() {
    try {
      const raw = await host.loadData();
      this.hadSave = Boolean(raw);
      this.progress = migrate(raw, LEVELS.map((l) => l.id));
    } catch (err) {
      console.warn(err);
      this.progress = emptyProgress();
      this.ui.notice('load');
    }
    this.audio.setMusicEnabled(this.progress.music);
    host.setHaptics(this.progress.haptics);
    this.world.setHat(this.progress.hats.worn);
  }

  async saveProgress() {
    try {
      await host.saveData(JSON.stringify(this.progress));
      this.hadSave = true;
    } catch (err) {
      console.warn(err);
      // Once per session at most, and never for a player who never had a save
      // (for example, signed out), since nothing they had can be lost.
      if (!this.saveWarned && this.hadSave) this.ui.notice('save');
      this.saveWarned = true;
    }
  }

  isDone(i) {
    const id = LEVELS[i].id;
    return id in this.progress.stars || this.progress.skipped.includes(id);
  }

  isUnlocked(i) {
    return i === 0 || this.isDone(i) || this.isDone(i - 1);
  }

  completedCount() {
    return Object.keys(this.progress.stars).length + this.progress.skipped.length;
  }

  firstUnfinished() {
    const i = LEVELS.findIndex((_, k) => !this.isDone(k));
    return i < 0 ? LEVELS.length - 1 : i;
  }

  worldUnlocked(w) {
    return this.isUnlocked(LEVELS.findIndex((l) => l.worldIndex === w));
  }

  get dailyUnlocked() {
    return COMPANIONS.every((c) => this.progress.owned.includes(c));
  }

  get campaignDone() {
    return LEVELS.every((_, i) => this.isDone(i));
  }

  // ---------- level flow ----------

  /** Start campaign level `i`. */
  startLevel(i) {
    if (this.restartKey !== `level-${i}`) {
      this.restartKey = `level-${i}`;
      this.restarts = 0;
    }
    this.index = i;
    this.extra = null;
    const def = LEVELS[i];
    const firstTime = !this.isDone(i);
    this.firstTime = firstTime;
    this.tutorial = firstTime && (def.lesson || (def.worldIndex === 0 ? def.number <= 4 : def.number <= 2));
    const variant = this.variantFor(def.id, def.pet);
    this.load(def, def.world, this.progress.owned, i, variant, firstTime && def.intro?.length ? def.intro : null);
  }

  startExtra(kind, def, n) {
    const key = `${kind}-${def.id}-${n}`;
    if (this.restartKey !== key) {
      this.restartKey = key;
      this.restarts = 0;
    }
    this.extra = { kind, def, n };
    this.firstTime = true;
    this.tutorial = false;
    this.load(def, def.world, COMPANIONS, dayNumber() + n, this.variantFor(key, def.pet), null);
  }

  /** Start today's daily puzzle (offset 0) or a bonus one. */
  startDaily(offset = 0) {
    const def = this.dailyPuzzle(offset);
    if (def) this.startExtra('daily', def, offset);
  }

  variantFor(id, pet) {
    if (!this.progress.rescued[pet]) return 0;
    return hash(id) % VARIANTS;
  }

  load(def, world, owned, musicIndex, variant = 0, intro = null, { quiet = false } = {}) {
    this.mode = 'level';
    this.garden = null;
    this.world.garden = null;
    const rows = def.map.length;
    const cols = Math.max(...def.map.map((r) => r.length));
    const portrait = window.innerHeight > window.innerWidth;
    // Turn the map to match the screen so it can be drawn as large as possible.
    const rotate = portrait ? cols > rows : rows > cols * 1.2;
    this.def = def;
    this.loadArgs = [def, world, owned, musicIndex, variant];
    this.rotated = rotate;
    this.level = parseLevel(rotate ? rotateLevel(def) : def);
    this.state = createState(this.level, owned);
    this.variant = variant;
    this.history = [];
    this.queue = [];
    this.pendingTap = null;
    this.pendingSelect = null;
    this.menuPaused = false;
    this.timers.release('menu');
    this.goalKey = '';
    this.hintStage = 0;
    this.hintMax = 0;
    this.routeBought = false;
    this.friendOffered = false;
    this.world.speed = 1;
    this.ui.hideOverlays();
    this.ui.hideHand();
    this.ui.setStuck(false);
    this.ui.setMode('level');
    this.ui.setSkip(false);
    this.ui.setHintAttention(false);
    this.world.petVariant = variant;
    this.world.loadLevel(this.level, this.state, world);
    this.world.setInsets(this.ui.insets());
    this.refresh();
    if (!quiet) this.audio.levelStart(musicIndex);
    this.timers.clear('skip');
    this.scheduleIdle(this.tutorial ? 900 : IDLE_DELAY);
    this.scheduleSkipOffer();
    if (this.restarts >= AD_POLICY.skipOffer.restarts && this.skipEligible) this.ui.setSkip(true);
    // A new element (or a new mix) gets a wordless intro card the first time it appears.
    if (!quiet) {
      const unseen = mechanicsOf(def).filter((m) => !this.progress.seen.includes(m));
      const list = intro?.length ? intro : unseen;
      for (const m of mechanicsOf(def)) if (!this.progress.seen.includes(m)) this.progress.seen.push(m);
      if (list.length) this.showIntro(list);
    }
  }

  /** On a resize: if no move has been made yet, re-lay the map for the new orientation. */
  onResize() {
    if (this.mode !== 'level' || !this.def || this.busy || this.history.length || this.state?.won) return;
    const rows = this.def.map.length;
    const cols = Math.max(...this.def.map.map((r) => r.length));
    const portrait = window.innerHeight > window.innerWidth;
    const rotate = portrait ? cols > rows : rows > cols * 1.2;
    if (rotate === this.rotated) return;
    const overlay = this.ui.overlayOpen;
    const intro = this.ui.openOverlay === 'intro';
    if (overlay && !intro) return;
    this.load(...this.loadArgs, null, { quiet: true });
    if (intro) this.ui.reopenIntro();
  }

  showIntro(list) {
    this.menuPaused = true;
    this.timers.hold('menu');
    this.ui.showIntro({ mechanics: list, onPlay: () => this.closeIntro(list) });
  }

  closeIntro(list) {
    this.audio.unlock();
    this.audio.play('ui');
    this.menuPaused = false;
    this.timers.release('menu');
    this.ui.hideOverlays();
    // Point out where the new elements are on the board.
    const tiles = this.mechanicTiles(list);
    if (tiles.length) {
      this.world.setTargets(tiles);
      this.timers.set('introRings', () => this.refresh(), 2600);
    }
    this.scheduleIdle(this.tutorial ? 900 : IDLE_DELAY);
  }

  mechanicTiles(list) {
    const s = this.state;
    const match = {
      current: (c) => '<>^v'.includes(c),
      ice: (c) => c === '*',
      gate: (c) => c === 'g' || c === 'o',
      bridge: (c) => c === '%',
      burrow: (c) => '()[]'.includes(c),
    };
    const tiles = new Set();
    for (const m of list) {
      if (m === 'bees') for (const path of s.bees) path.forEach((i) => tiles.add(i));
      else if (match[m]) s.t.forEach((c, i) => match[m](c) && tiles.add(i));
    }
    return [...tiles].slice(0, 24);
  }

  refresh() {
    const s = this.state;
    this.ui.setCompanions(s.owned, s.active, { swimming: isWater(s.t[s.p]) });
    const goalKey = `${s.pet}|${s.rescued}`;
    if (goalKey !== this.goalKey) {
      this.goalKey = goalKey;
      this.ui.setGoal(s.pet, s.rescued);
    }
    this.ui.setUndoEnabled(this.history.length > 0);
    this.ui.setStars(starsFor(s.turn, this.def.par), s.turn, this.def.par);
    this.world.setTargets(this.targets());
  }

  /** Obstacles the active companion can act on right now (shown as pulsing rings). */
  targets() {
    const s = this.state;
    if (!s.active || s.won) return [];
    const kind = ABILITY[s.active];
    let candidates = [];
    if (kind === 'push') candidates = s.b;
    else {
      const match = { hop: (c) => c === '_', dig: (c) => c === 'H', swim: isWater }[kind];
      for (let i = 0; i < s.t.length; i++) if (match(s.t[i])) candidates.push(i);
      if (kind === 'swim') {
        // Only shore tiles, so the whole lake is not covered in rings.
        candidates = candidates.filter((i) =>
          DIR_NAMES.some((d) => {
            const x = (i % s.w) + DIRS[d].x;
            const y = Math.floor(i / s.w) + DIRS[d].y;
            const ch = s.t[y * s.w + x];
            return x >= 0 && y >= 0 && x < s.w && y < s.h && !isWater(ch) && ch !== '#';
          }),
        );
      }
    }
    return candidates.filter((i) => findPath(s, i));
  }

  get inputBlocked() {
    return this.mode !== 'level' || this.menuPaused || this.hostPaused || this.ui.overlayOpen || !this.state || this.state.won;
  }

  // ---------- input ----------

  /** A tap on the canvas: a tile in a level, a pet or decoration in the garden. */
  pointerTap(x, y) {
    this.audio.unlock();
    if (this.mode === 'garden') {
      if (!this.ui.overlayOpen) this.gardenTap(x, y);
      return;
    }
    this.tap(this.world.tileAt(x, y));
  }

  tap(i) {
    this.audio.unlock();
    if (this.inputBlocked || i < 0) return;
    this.clearHint();
    if (this.busy) {
      // Tapping ahead skips the rest of a long slide or current.
      this.world.speed = FAST_SPEED;
      this.pendingTap = i;
      this.queue = [];
      this.world.tapAt(i);
      return;
    }
    const s = this.state;
    if (i === s.p) {
      // Tapping yourself waits one beat when bees patrol.
      if (s.bees.length) this.swipe('wait');
      return;
    }
    const path = findPath(s, i);
    if (path) {
      this.world.tapAt(i);
      this.audio.play('tap');
      this.queue = path;
      this.pump();
      return;
    }
    this.explainUnreachable(i);
  }

  swipe(dir) {
    this.audio.unlock();
    if (this.inputBlocked) return;
    this.clearHint();
    if (this.busy) {
      this.world.speed = FAST_SPEED;
      if (this.queue.length === 0) this.queue.push(dir);
      return;
    }
    this.queue = [dir];
    this.pump();
  }

  selectCompanion(kind) {
    this.audio.unlock();
    if (this.inputBlocked) return;
    this.clearHint();
    if (this.busy) {
      this.world.speed = FAST_SPEED;
      this.queue = [];
      this.pendingTap = null;
      this.pendingSelect = kind;
      return;
    }
    const s = this.state;
    const r = setActive(s, kind);
    if (!r.ok) {
      this.ui.shake(kind);
      this.audio.play('blocked');
      const pos = this.ui.buttonCenter(kind);
      if (r.reason === 'locked') this.ui.bubble({ x: pos.x, y: pos.y - 70 }, UI.lock, 'lock');
      else this.ui.bubble(this.world.tileScreen(s.p, 1.1), ability('swim'), 'need');
      this.scheduleIdle(this.idleDelay());
      return;
    }
    if (kind === s.active) {
      this.ui.pulse(kind);
      this.audio.voice(kind, { vol: 0.6 });
      return;
    }
    this.pushHistory(s);
    this.state = r.state;
    this.hintStage = 0;
    this.world.switchCompanion(this.state);
    this.audio.play('select');
    this.audio.voice(kind, { delay: 0.06 });
    this.refresh();
    this.scheduleIdle(this.idleDelay());
  }

  undo() {
    this.audio.unlock();
    if (this.mode !== 'level' || this.menuPaused || this.hostPaused || this.ui.overlayOpen) return;
    this.clearHint();
    if (!this.history.length) {
      this.ui.shake('btnUndo');
      return;
    }
    this.queue = [];
    this.pendingTap = null;
    this.audio.play('undo');
    this.state = this.history.pop();
    this.hintStage = 0;
    this.world.sync(this.state);
    this.ui.setStuck(false);
    this.refresh();
    this.scheduleIdle(this.idleDelay());
  }

  restart() {
    this.audio.unlock();
    this.audio.play('undo');
    if (this.state && !this.state.won) this.restarts++;
    if (this.extra) this.startExtra(this.extra.kind, this.extra.def, this.extra.n);
    else this.startLevel(this.index);
  }

  /** Continue after a win: an interstitial may play here, at a natural break. */
  async next() {
    this.audio.play('ui');
    if (this.extra?.kind === 'encore') {
      this.ui.hideOverlays();
      await this.adBreak();
      this.playEncore();
      return;
    }
    if (this.extra?.kind === 'weekly' && this.nextWeekly() >= 0) {
      this.ui.hideOverlays();
      await this.adBreak();
      this.playWeekly();
      return;
    }
    if (this.extra || this.index >= LEVELS.length - 1) {
      this.openMap();
      return;
    }
    this.ui.hideOverlays();
    await this.adBreak();
    this.startLevel(this.index + 1);
  }

  /** A natural break between levels. No interstitial after a level the player struggled with. */
  async adBreak() {
    const struggled = this.restarts >= 3 || this.hintMax >= 2;
    await this.withAdPause(() => this.ads.maybeInterstitial(this.completedCount(), { struggled }));
  }

  async withAdPause(fn) {
    this.audio.setPaused(true);
    this.timers.hold('ad');
    try {
      return await fn();
    } finally {
      this.timers.release('ad');
      this.audio.setPaused(this.hostPaused);
    }
  }

  pushHistory(s) {
    this.history.push(s);
    if (this.history.length > MAX_HISTORY) this.history.shift();
  }

  // ---------- moves ----------

  async pump() {
    if (this.busy) return;
    this.busy = true;
    while (this.queue.length) {
      const dir = this.queue.shift();
      const prev = this.state;
      const r = step(prev, dir);
      if (!r.ok) {
        this.queue = [];
        this.explainBlocked(r);
        break;
      }
      this.pushHistory(prev);
      this.state = r.state;
      this.hintStage = 0;
      this.playSound(r);
      await this.world.animate(r, prev, r.state);
      // Undo, restart or the garden replaced the state while this step was animating.
      if (this.state !== r.state || this.mode !== 'level') break;
      if (r.kind === 'open') this.afterOpen(r);
      if (r.caught) this.audio.play('stuck');
      this.refresh();
      if (r.state.won) {
        this.busy = false;
        this.world.speed = 1;
        this.onWin();
        return;
      }
      if (r.destructive) this.checkStuck();
      if (this.pendingSelect) {
        const kind = this.pendingSelect;
        this.pendingSelect = null;
        this.busy = false;
        this.world.speed = 1;
        this.selectCompanion(kind);
        return;
      }
      if (this.pendingTap !== null) {
        const target = this.pendingTap;
        this.pendingTap = null;
        const path = findPath(this.state, target);
        if (path) this.queue = path;
        else {
          this.busy = false;
          this.world.speed = 1;
          this.explainUnreachable(target);
          return;
        }
      }
    }
    this.busy = false;
    this.world.speed = 1;
    if (this.mode !== 'level') return;
    if (this.pendingSelect) {
      const kind = this.pendingSelect;
      this.pendingSelect = null;
      this.selectCompanion(kind);
    }
    this.scheduleIdle(this.idleDelay());
  }

  playSound(r) {
    const a = this.audio;
    const surface = r.state.t[r.to];
    switch (r.kind) {
      case 'walk':
      case 'win':
        a.play(r.drifted ? 'swim' : 'step', { surface: r.slid ? '=' : surface });
        if (r.teleport) setTimeout(() => a.play('dig'), 120);
        break;
      case 'push':
        a.play('push');
        a.play('step', { surface });
        if (r.result !== 'roll') setTimeout(() => a.play(r.result), 180 + 85 * (r.boulderPath.length - 1));
        break;
      case 'open':
        a.play('open');
        a.voice(r.state.pet, { delay: 0.3 });
        if (r.gained) a.stinger(ABILITY[r.gained], 0.9);
        host.vibrate(20);
        break;
      case 'wait':
        a.play('tap');
        break;
      default:
        a.play(r.kind);
    }
    if (r.collapsed) setTimeout(() => a.play('fill'), 120);
  }

  afterOpen(r) {
    this.audio.escaping();
    if (r.gained) this.ui.flashCompanionGain(r.gained, this.world.tileScreen(r.at, 0.8));
    this.ui.bubble(this.world.tileScreen(r.at, 1.4), UI.heart, 'heart');
  }

  explainBlocked(r) {
    const s = this.state;
    this.world.blocked(s, r.at);
    this.audio.play('blocked');
    host.vibrate(8);
    const pos = this.world.tileScreen(r.at >= 0 ? r.at : s.p, 0.9);
    if (r.need) {
      const c = COMPANION_FOR[r.need];
      if (s.owned.includes(c)) {
        const swimming = isWater(s.t[s.p]);
        this.ui.bubble(pos, swimming ? UI.cross : face(c), swimming ? 'cross' : 'need');
        if (!swimming) {
          this.ui.pulse(c);
          this.audio.voice(c, { delay: 0.15, vol: 0.55 });
        }
      } else {
        this.ui.bubble(pos, UI.lock, 'lock');
      }
    } else if (r.reason === 'gate') {
      this.ui.bubble(pos, UI.plate, 'need');
    } else if (r.reason !== 'wall') {
      this.ui.bubble(pos, UI.cross, 'cross');
    }
    this.scheduleIdle(this.idleDelay());
  }

  explainUnreachable(i) {
    const s = this.state;
    // A neighbouring obstacle: say exactly what blocks it.
    for (const d of DIR_NAMES) {
      const x = (s.p % s.w) + DIRS[d].x;
      const y = Math.floor(s.p / s.w) + DIRS[d].y;
      if (x >= 0 && y >= 0 && x < s.w && y < s.h && y * s.w + x === i) {
        const r = step(s, d);
        if (!r.ok) return this.explainBlocked(r);
      }
    }
    // Another companion could get there: point at it.
    if (!isWater(s.t[s.p])) {
      for (const c of s.owned) {
        if (c === s.active) continue;
        const alt = setActive(s, c);
        if (alt.ok && findPath(alt.state, i)) {
          this.audio.play('blocked');
          this.ui.bubble(this.world.tileScreen(i, 0.9), face(c), 'need');
          this.ui.pulse(c);
          this.audio.voice(c, { delay: 0.15, vol: 0.55 });
          this.scheduleIdle(this.idleDelay());
          return;
        }
      }
    }
    const tile = s.t[i];
    const need = s.b.includes(i) ? 'push' : tile === '_' ? 'hop' : isWater(tile) ? 'swim' : tile === 'H' ? 'dig' : null;
    this.audio.play('blocked');
    if (need && !s.owned.includes(COMPANION_FOR[need])) this.ui.bubble(this.world.tileScreen(i, 0.9), UI.lock, 'lock');
    else if (tile === 'g') this.ui.bubble(this.world.tileScreen(i, 0.9), UI.plate, 'need');
    else if (tile !== '#') this.ui.bubble(this.world.tileScreen(i, 0.9), UI.cross, 'cross');
    this.world.blocked(s, -1);
    this.scheduleIdle(this.idleDelay());
  }

  checkStuck() {
    const state = this.state;
    setTimeout(() => {
      if (state !== this.state) return;
      const r = solve(state, { maxNodes: 150000 });
      const stuck = !r.solved && !r.exhausted;
      this.ui.setStuck(stuck);
      if (stuck) {
        this.audio.play('stuck');
        this.audio.calm();
        this.ui.bubble(this.world.tileScreen(state.p, 1.3), UI.cross, 'cross');
        this.clearHint();
        this.timers.set('hint', () => this.ui.showHand(this.ui.buttonCenter('btnUndo')), 1200);
      }
    }, 30);
  }

  // ---------- winning ----------

  async onWin() {
    this.clearHint();
    this.timers.clear('skip');
    this.timers.clear('idle');
    this.ui.setSkip(false);
    this.ui.setHintAttention(false);
    this.audio.play('win');
    host.vibrate([25, 40, 25]);
    // Everyone cheers: the rescued pet first, then the companion.
    const voices = [this.state.pet, this.state.active].filter((k, n, a) => k && a.indexOf(k) === n);
    voices.forEach((k, n) => this.audio.voice(k, { delay: 1.3 + n * 0.45 }));

    const p = this.progress;
    const starsBefore = totalStars(p);
    const albumBefore = this.completeSets();
    const stars = starsFor(this.state.turn, this.def.par);
    const before = p.owned;
    const gained = this.state.owned.find((c) => !before.includes(c)) ?? null;
    p.owned = COMPANIONS.filter((c) => before.includes(c) || this.state.owned.includes(c));
    const pet = this.state.pet;
    p.rescued[pet] = (p.rescued[pet] ?? 0) + 1;
    const newLook = addVariant(p, pet, this.variant) && this.variant > 0;
    let streak = null;
    let worldDone = null;
    const kind = this.extra?.kind;
    if (kind === 'daily') {
      if (this.extra.n === 0) {
        const r = recordDaily(p);
        streak = { n: r.streak, best: p.daily.best, froze: r.froze, earnedFreeze: r.earnedFreeze };
      }
    } else if (kind === 'weekly') {
      this.syncWeek();
      if (!p.weekly.done.includes(this.extra.n)) {
        p.weekly.done.push(this.extra.n);
        p.weeklyStars++;
      }
    } else if (kind === 'encore') {
      if (this.extra.n === p.encore) p.encore++;
    } else {
      const id = this.def.id;
      p.stars[id] = Math.max(p.stars[id] ?? 0, stars);
      p.skipped = p.skipped.filter((x) => x !== id);
      this.ads.levelCompleted();
      const w = WORLDS[this.def.worldIndex];
      if (this.def.number === w.levels.length && !p.worldsDone.includes(w.index)) {
        p.worldsDone.push(w.index);
        worldDone = {
          key: w.key,
          stars: w.levels.reduce((a, l) => a + (p.stars[l.id] ?? 0), 0),
          max: w.levels.length * 3,
          next: WORLDS[w.index + 1]?.key ?? null,
        };
      }
    }
    const hats = newlyEarnedHats(p);
    p.hats.unlocked.push(...hats);
    const starsAfter = totalStars(p);
    const decoration = unlockedDecorations(starsAfter).length > unlockedDecorations(starsBefore).length;
    const souvenirs = this.completeSets().filter((k) => !albumBefore.includes(k));
    this.saveProgress();
    host.sendScore(starsAfter);
    this.lastWin = {
      pet,
      variant: this.variant,
      newLook,
      gained,
      stars: kind ? 3 : stars,
      moves: this.state.turn,
      par: this.def.par,
      hats,
      decoration,
      souvenirs,
      streak,
      worldDone,
      goal: this.nearestGoal(starsBefore, starsAfter),
      tease: this.tease(),
    };
    // The full escape and reunion play before anything else appears.
    setTimeout(() => {
      if (!this.state.won) return;
      this.showWinPanel(this.lastWin);
      this.audio.calm();
    }, 500);
  }

  showWinPanel(info, { again = false } = {}) {
    const kind = this.extra?.kind;
    const hasNext =
      kind === 'encore' || (kind === 'weekly' && this.nextWeekly() >= 0) || (!kind && this.index < LEVELS.length - 1);
    this.ui.showWin({
      ...info,
      ...(again ? { gained: null, hats: [], decoration: false, souvenirs: [], newLook: false } : {}),
      hasNext,
      dailyReady: this.dailyUnlocked && this.progress.daily.last !== dayKey() && kind !== 'daily',
      canFriend: !this.friendOffered && !kind && this.index >= 5 && this.ads.rewardedAvailable && this.friendChoices().length > 0,
      canShare: kind === 'daily' && this.extra.n === 0 && host.canCopy,
    });
  }

  showWinAgain() {
    if (this.lastWin) this.showWinPanel(this.lastWin, { again: true });
  }

  /** The reward the player is closest to, with the bar before and after this win (0..1). */
  nearestGoal(starsBefore, starsAfter) {
    const p = this.progress;
    const goals = [];
    const span = (list, value) => {
      const next = list.find((n) => value < n);
      if (next === undefined) return null;
      const prev = [0, ...list].filter((n) => n <= value).pop();
      return { prev, next };
    };
    const decoSteps = DECORATIONS.map((d) => d.stars);
    const d = span(decoSteps, starsAfter);
    if (d) goals.push({ icon: UI.garden, kind: 'decoration', ...this.fill(d, starsBefore, starsAfter) });
    const hatSteps = Object.entries(STAR_HATS).filter(([h]) => !p.hats.unlocked.includes(h)).map(([, n]) => n).sort((a, b) => a - b);
    const h = span(hatSteps, starsAfter);
    if (h) {
      const hat = Object.keys(STAR_HATS).find((k) => STAR_HATS[k] === h.next);
      goals.push({ icon: HAT_ICONS[hat], kind: 'hat', ...this.fill(h, starsBefore, starsAfter) });
    }
    const set = ALBUM_SETS[this.extra ? -1 : this.def.worldIndex] ?? null;
    if (set) {
      const have = set.kinds.filter((k) => p.rescued[k] || p.owned.includes(k)).length;
      const gotNow = !this.extra && (p.rescued[this.state.pet] === 1 ? 1 : 0);
      if (have < set.kinds.length) goals.push({ icon: WORLD_ICONS[set.key], kind: 'album', from: (have - gotNow) / set.kinds.length, to: have / set.kinds.length, value: have, target: set.kinds.length });
    }
    if (this.extra?.kind === 'daily') {
      const s = span(Object.values(STREAK_HATS), p.daily.streak);
      if (s) {
        const hat = Object.keys(STREAK_HATS).find((k) => STREAK_HATS[k] === s.next);
        goals.push({ icon: HAT_ICONS[hat], kind: 'streak', from: Math.max(0, p.daily.streak - 1 - s.prev) / (s.next - s.prev), to: (p.daily.streak - s.prev) / (s.next - s.prev), value: p.daily.streak, target: s.next });
      }
    }
    goals.sort((a, b) => b.to - a.to);
    return goals[0] ?? null;
  }

  fill({ prev, next }, before, after) {
    return { from: Math.max(0, (before - prev) / (next - prev)), to: (after - prev) / (next - prev), value: after, target: next };
  }

  /** What comes next: a new world, a new element, or a new animal. */
  tease() {
    if (this.extra || this.index >= LEVELS.length - 1) return null;
    const next = LEVELS[this.index + 1];
    if (next.worldIndex !== this.def.worldIndex) return { html: WORLD_ICONS[next.world] + (WORLD_MECHANIC[next.world] ? MECH_ICONS[WORLD_MECHANIC[next.world]] : ''), kind: 'world' };
    const fresh = mechanicsOf(next).filter((m) => !this.progress.seen.includes(m));
    if (next.intro?.length || fresh.length) return { html: (next.intro?.length ? next.intro : fresh).map((m) => MECH_ICONS[m]).join(''), kind: 'element' };
    if (!this.progress.rescued[next.pet] && !this.progress.owned.includes(next.pet)) return { html: silhouette(next.pet), kind: 'animal' };
    return null;
  }

  completeSets() {
    const p = this.progress;
    return ALBUM_SETS.filter((s) => s.kinds.length && s.kinds.every((k) => p.rescued[k] || p.owned.includes(k))).map((s) => s.key);
  }

  // ---------- skip offer (rewarded) ----------

  get skipEligible() {
    const policy = AD_POLICY.skipOffer;
    return !this.extra && !this.tutorial && !this.def?.lesson && this.index >= policy.notBeforeLevel && this.ads.rewardedAvailable;
  }

  scheduleSkipOffer() {
    this.timers.clear('skip');
    if (!this.skipEligible) return;
    this.timers.set(
      'skip',
      () => {
        if (this.state && !this.state.won && this.mode === 'level' && this.ads.rewardedAvailable) this.ui.setSkip(true);
      },
      AD_POLICY.skipOffer.stuckSeconds * 1000,
    );
  }

  offerSkip() {
    this.audio.play('ui');
    this.menuPaused = true;
    this.timers.hold('menu');
    this.clearHint();
    this.ui.showOffer({ kind: 'skip', text: t('offerSkip'), onAccept: () => this.watchForSkip(), onDecline: () => this.resume() });
  }

  /** Plays a rewarded ad; on anything but a reward, explains (declined) or shows the unavailable state. */
  async rewardedAd(id) {
    this.ui.hideOverlays();
    const result = await this.withAdPause(() => this.ads.rewarded(id));
    if (result === 'declined') this.ui.notice('noReward');
    else if (result === 'unavailable') this.ui.notice('noAd');
    if (!this.ads.rewardedAvailable) this.ui.setSkip(false);
    return result === 'earned';
  }

  async watchForSkip() {
    const earned = await this.rewardedAd('skip-level');
    if (!earned) {
      this.resume();
      return;
    }
    const id = this.def.id;
    if (!(id in this.progress.stars) && !this.progress.skipped.includes(id)) this.progress.skipped.push(id);
    this.saveProgress();
    this.ui.setSkip(false);
    this.timers.release('menu');
    // A skip is a rewarded view, so the break after it never shows an interstitial.
    await this.ads.maybeInterstitial(this.completedCount());
    this.startLevel(Math.min(LEVELS.length - 1, this.index + 1));
  }

  // ---------- menus ----------

  openPause() {
    if (this.ui.overlayOpen || this.mode !== 'level') return;
    // Queued moves stop at the current step.
    this.queue = [];
    this.pendingTap = null;
    this.menuPaused = true;
    this.timers.hold('menu');
    this.clearHint();
    this.audio.play('ui');
    this.audio.menu(true);
    this.ui.showPause(this.pauseState());
  }

  pauseState() {
    return { music: this.progress.music, haptics: host.canVibrate ? this.progress.haptics : null };
  }

  resume() {
    this.audio.play('ui');
    this.audio.menu(false);
    this.menuPaused = false;
    this.timers.release('menu');
    this.ui.hideOverlays();
    if (this.mode === 'level' && this.state?.won) {
      this.showWinAgain();
      return;
    }
    this.scheduleIdle(this.idleDelay());
  }

  toggleMusic() {
    this.audio.unlock();
    this.progress.music = !this.progress.music;
    this.audio.setMusicEnabled(this.progress.music);
    this.audio.play('select');
    this.saveProgress();
    this.ui.showPause(this.pauseState());
  }

  toggleHaptics() {
    this.progress.haptics = !this.progress.haptics;
    host.setHaptics(this.progress.haptics);
    host.vibrate(15);
    this.audio.play('select');
    this.saveProgress();
    this.ui.showPause(this.pauseState());
  }

  /** Esc closes whichever dialog is open (a Playables requirement), else toggles pause. */
  escape() {
    const open = this.ui.openOverlay;
    if (open && this.ui.onEscape) {
      this.ui.onEscape();
      return;
    }
    if (open) return;
    if (this.mode === 'garden') this.leaveGarden();
    else this.openPause();
  }

  // ---------- daily, weekly and encore ----------

  /** One puzzle per date for everyone, cycling through the whole pool. */
  dailyPuzzle(offset = 0) {
    if (!DAILY.length) return null;
    return DAILY[mod(dayNumber() - DAILY_EPOCH + offset * 137, DAILY.length)];
  }

  dailyInfo() {
    const p = this.progress;
    const doneToday = p.daily.last === dayKey();
    const bonusToday = p.daily.bonusDate === dayKey() ? p.daily.bonusCount : 0;
    return {
      unlocked: this.dailyUnlocked,
      doneToday,
      streak: liveStreak(p),
      best: p.daily.best,
      freezes: p.daily.freezes,
      nextAt: Date.now() + msToNextDay(),
      pet: this.dailyPuzzle(doneToday ? bonusToday + 1 : 0)?.pet ?? 'kitten',
      canBonus: doneToday && bonusToday < AD_POLICY.bonusDailiesPerDay && this.ads.rewardedAvailable,
    };
  }

  syncWeek() {
    const key = weekKey();
    if (this.progress.weekly.week !== key) this.progress.weekly = { week: key, done: [] };
  }

  /** This week's puzzles, taken from the end of the pool so they differ from the dailies. */
  weeklyPuzzle(k) {
    const n = DAILY.length;
    return DAILY[mod(n - 1 - (weekNumber() * WEEKLY_COUNT + k), n)];
  }

  nextWeekly() {
    this.syncWeek();
    for (let k = 0; k < WEEKLY_COUNT; k++) if (!this.progress.weekly.done.includes(k)) return k;
    return -1;
  }

  weeklyInfo() {
    this.syncWeek();
    const k = this.nextWeekly();
    return { unlocked: this.dailyUnlocked && DAILY.length > 0, done: this.progress.weekly.done.length, total: WEEKLY_COUNT, pet: this.weeklyPuzzle(Math.max(0, k))?.pet ?? 'kitten' };
  }

  playWeekly() {
    const k = this.nextWeekly();
    if (k < 0 || !this.dailyUnlocked) return;
    this.startExtra('weekly', this.weeklyPuzzle(k), k);
  }

  /** After the campaign: an endless track through the pool, turned half a turn on each lap. */
  encorePuzzle(n) {
    const len = DAILY.length;
    const base = DAILY[mod(n * 7 + 3, len)];
    if (Math.floor(n / len) % 2 === 0) return base;
    const turned = rotateLevel(rotateLevel(base));
    return { ...turned, id: `${base.id}-r`, pet: base.pet, par: base.par, world: base.world };
  }

  playEncore() {
    if (!this.campaignDone || !DAILY.length) return;
    this.startExtra('encore', this.encorePuzzle(this.progress.encore), this.progress.encore);
  }

  openMap(worldIndex = null) {
    this.queue = [];
    this.pendingTap = null;
    this.menuPaused = true;
    this.timers.hold('menu');
    this.clearHint();
    this.audio.play('ui');
    this.audio.menu(true);
    this.ui.hideOverlays();
    if (worldIndex !== null) this.mapWorld = worldIndex;
    else if (!this.extra && this.index !== undefined) this.mapWorld = LEVELS[this.index].worldIndex;
    const w = WORLDS[this.mapWorld];
    const first = LEVELS.findIndex((l) => l.worldIndex === this.mapWorld);
    this.ui.showMap({
      worlds: WORLDS.map((x) => ({
        key: x.key,
        locked: !this.worldUnlocked(x.index),
        stars: x.levels.reduce((a, l) => a + (this.progress.stars[l.id] ?? 0), 0),
        max: x.levels.length * 3,
      })),
      world: this.mapWorld,
      levels: w.levels.map((l, k) => {
        const i = first + k;
        return { pet: l.pet, stars: this.progress.stars[l.id] ?? 0, done: this.isDone(i), locked: !this.isUnlocked(i), current: i === this.index && !this.extra };
      }),
      daily: this.dailyInfo(),
      weekly: this.weeklyInfo(),
      encore: this.campaignDone && DAILY.length ? { count: this.progress.encore, pet: this.encorePuzzle(this.progress.encore).pet } : null,
      totalStars: totalStars(this.progress),
    });
  }

  closeMap() {
    this.ui.hideOverlays();
    if (this.mode === 'garden') return;
    if (this.state?.won) {
      this.audio.music?.setMuffled(false);
      this.menuPaused = false;
      this.timers.release('menu');
      this.showWinAgain();
      return;
    }
    this.resume();
  }

  openCalendar() {
    this.audio.play('ui');
    const info = this.dailyInfo();
    this.ui.showCalendar({ cells: dailyCalendar(this.progress), streak: info.streak, best: info.best, freezes: info.freezes, nextAt: info.nextAt, onClose: () => this.openMap() });
  }

  chooseLevel(k) {
    const i = LEVELS.findIndex((l) => l.worldIndex === this.mapWorld) + k;
    if (this.isUnlocked(i)) this.startLevel(i);
  }

  playDaily() {
    const info = this.dailyInfo();
    if (!info.unlocked) return;
    if (!info.doneToday) {
      this.startDaily(0);
      return;
    }
    if (!info.canBonus) return;
    this.ui.showOffer({ kind: 'bonus', text: t('offerBonus'), onAccept: () => this.watchForBonus(), onDecline: () => this.openMap() });
  }

  async watchForBonus() {
    const earned = await this.rewardedAd('bonus-daily');
    if (!earned) {
      this.openMap();
      return;
    }
    const p = this.progress;
    if (p.daily.bonusDate !== dayKey()) {
      p.daily.bonusDate = dayKey();
      p.daily.bonusCount = 0;
    }
    p.daily.bonusCount++;
    this.saveProgress();
    this.startDaily(p.daily.bonusCount);
  }

  /** Copies an emoji summary of today's daily result (no links, no personal data). */
  async shareDaily() {
    const w = this.lastWin;
    if (!w || !host.canCopy) return;
    const streak = this.progress.daily.streak;
    const text = `🐾 Pet Rescue ${dayKey()}\n${'⭐'.repeat(starsFor(w.moves, w.par))} 👣${w.moves}\n🔥${streak}`;
    try {
      await host.copyText(text);
      this.ui.bubble(this.ui.buttonCenter('btnShare'), UI.check, 'heart');
      this.audio.play('select');
    } catch (err) {
      console.warn(err);
      this.ui.bubble(this.ui.buttonCenter('btnShare'), UI.cross, 'cross');
    }
  }

  // ---------- bonus friend (rewarded) ----------

  /** Up to three missing looks of species the player has rescued, chosen without randomness. */
  friendChoices() {
    const p = this.progress;
    const out = [];
    const species = ALL_ANIMALS.filter((k) => p.rescued[k]);
    const start = this.completedCount();
    for (let n = 0; n < species.length && out.length < 3; n++) {
      const kind = species[(start + n * 5) % species.length];
      for (let v = 1; v < VARIANTS; v++) {
        if (!hasVariant(p, kind, v) && !out.some((o) => o.kind === kind)) {
          out.push({ kind, variant: v });
          break;
        }
      }
    }
    return out;
  }

  offerFriend() {
    this.audio.play('ui');
    const choices = this.friendChoices();
    if (!choices.length) return;
    this.ui.showFriends({
      choices,
      onPick: (c) =>
        this.ui.showOffer({
          kind: 'friend',
          text: t('offerFriend'),
          preview: face(c.kind),
          variant: c.variant,
          onAccept: () => this.watchForFriend(c),
          onDecline: () => this.showWinAgain(),
        }),
      onClose: () => this.showWinAgain(),
    });
  }

  async watchForFriend(c) {
    this.friendOffered = true;
    const earned = await this.rewardedAd('bonus-friend');
    if (earned) {
      addVariant(this.progress, c.kind, c.variant);
      this.saveProgress();
      this.audio.voice(c.kind);
      this.audio.stinger('hop');
      this.ui.toastIcon(`${face(c.kind)}${UI.sparkle}`);
    }
    this.showWinAgain();
  }

  // ---------- garden, album and hats ----------

  openGarden() {
    this.audio.play('ui');
    this.audio.menu(false);
    this.audio.calm();
    this.clearHint();
    this.timers.clear('skip');
    this.timers.clear('idle');
    this.queue = [];
    this.pendingTap = null;
    this.pendingSelect = null;
    this.ui.hideOverlays();
    this.mode = 'garden';
    this.menuPaused = false;
    this.timers.release('menu');
    const p = this.progress;
    const animals = ALL_ANIMALS.filter((k) => p.rescued[k] || p.owned.includes(k)).map((kind) => {
      let variant = 0;
      for (let v = VARIANTS - 1; v > 0; v--) if (hasVariant(p, kind, v)) {
        variant = v;
        break;
      }
      return { kind, variant, hat: p.petHats[kind] ?? null };
    });
    const stars = totalStars(p);
    this.garden = new Garden(this.world, { animals, stars, souvenirs: this.completeSets().filter((k) => SOUVENIRS[k]), layout: p.garden });
    this.world.garden = this.garden;
    this.world.setHat(p.hats.worn);
    this.gardenEditing = false;
    this.ui.setMode('garden');
    this.showGardenBar();
    this.world.setInsets(this.ui.insets());
  }

  showGardenBar() {
    const stars = totalStars(this.progress);
    this.ui.showGardenBar({ stars, next: nextDecoration(stars), editing: this.gardenEditing });
  }

  toggleGardenEdit() {
    if (this.mode !== 'garden' || !this.garden) return;
    this.audio.play('select');
    this.gardenEditing = !this.gardenEditing;
    this.garden.setEditing(this.gardenEditing);
    this.showGardenBar();
  }

  gardenTap(x, y) {
    const g = this.garden;
    if (!g) return;
    if (!this.gardenEditing) {
      const pet = g.petAt(x, y);
      if (pet) this.audio.voice(pet.kind);
      return;
    }
    const tile = g.tileAt(x, y);
    const deco = g.decorationAt(tile);
    if (deco) {
      g.select(g.selected === deco ? null : deco);
      this.audio.play('tap');
      return;
    }
    if (g.selected) {
      const key = g.selected;
      if (g.moveSelected(tile) >= 0) {
        this.progress.garden[key] = tile;
        this.audio.play('push');
        this.saveProgress();
      } else this.audio.play('blocked');
      return;
    }
    // In edit mode, tapping a pet tries on the next unlocked hat.
    const pet = g.petAt(x, y);
    if (pet) {
      const list = [null, ...this.progress.hats.unlocked];
      const hat = list[(list.indexOf(pet.hat) + 1) % list.length];
      g.setPetHat(pet, hat);
      if (hat) this.progress.petHats[pet.kind] = hat;
      else delete this.progress.petHats[pet.kind];
      this.audio.voice(pet.kind, { vol: 0.6 });
      this.saveProgress();
    }
  }

  leaveGarden() {
    this.audio.play('ui');
    this.gardenEditing = false;
    this.openMap();
  }

  openAlbum() {
    this.audio.play('ui');
    const p = this.progress;
    this.ui.showAlbum(
      ALBUM_SETS.map((set) => ({
        key: set.key,
        complete: set.kinds.every((k) => p.rescued[k] || p.owned.includes(k)),
        souvenir: SOUVENIRS[set.key]?.kind ?? null,
        animals: set.kinds.map((kind) => ({
          kind,
          count: p.rescued[kind] ?? 0,
          owned: p.owned.includes(kind),
          looks: Array.from({ length: VARIANTS }, (_, v) => hasVariant(p, kind, v)),
        })),
      })),
    );
  }

  openHats(fresh = null) {
    this.audio.play('ui');
    const p = this.progress;
    this.ui.showHats({
      hats: HATS.map((h) => ({ key: h, unlocked: p.hats.unlocked.includes(h), need: hatRequirement(h) })),
      worn: p.hats.worn,
      fresh,
      canAd: this.ads.rewardedAvailable,
    });
  }

  wearHat(hat) {
    const p = this.progress;
    if (!p.hats.unlocked.includes(hat)) {
      // Locked star hats can be chosen with a rewarded ad; streak hats only by streaks.
      if (hat in STAR_HATS && this.ads.rewardedAvailable) {
        this.audio.play('ui');
        this.ui.showOffer({ kind: 'hat', text: t('offerHat'), preview: HAT_ICONS[hat], onAccept: () => this.watchForHat(hat), onDecline: () => this.openHats() });
      } else {
        this.audio.play('blocked');
        this.ui.shakeHat(hat);
      }
      return;
    }
    p.hats.worn = p.hats.worn === hat ? null : hat;
    this.world.setHat(p.hats.worn);
    this.audio.play('select');
    this.saveProgress();
    this.openHats();
  }

  async watchForHat(hat) {
    const earned = await this.rewardedAd('choose-hat');
    if (!earned) {
      this.openHats();
      return;
    }
    const p = this.progress;
    if (!p.hats.unlocked.includes(hat)) p.hats.unlocked.push(hat);
    p.hats.worn = hat;
    this.world.setHat(hat);
    this.saveProgress();
    this.audio.stinger('hop');
    this.openHats(hat);
  }

  setHostPaused(v) {
    this.hostPaused = v;
    this.audio.setPaused(v);
    if (v) this.timers.hold('host');
    else this.timers.release('host');
  }

  // ---------- hints ----------

  idleDelay() {
    return this.tutorial ? HINT_DELAY_TUTORIAL : IDLE_DELAY;
  }

  clearHint() {
    this.timers.clear('hint');
    this.timers.clear('idle');
    this.ui.hideHand();
    this.ui.setHintAttention(false);
    this.world.clearRoute();
  }

  /** After idle time: tutorials show the next move; elsewhere the hint button only pulses. */
  scheduleIdle(ms) {
    this.timers.set(
      'idle',
      () => {
        if (this.busy || this.inputBlocked) return;
        if (this.tutorial) this.showHintStage(2, solve(this.state, { maxNodes: 150000 }), { auto: true });
        else this.ui.setHintAttention(true);
      },
      ms,
    );
  }

  /** The hint button: stage 1 marks the key object, 2 shows the next moves, 3 the whole route. */
  requestHint() {
    this.audio.unlock();
    if (this.inputBlocked || this.busy) return;
    this.ui.setHintAttention(false);
    this.timers.clear('idle');
    const r = solve(this.state, { maxNodes: 150000 });
    // Once the whole route is unlocked for this level, every press shows it.
    let stage = this.routeBought ? 3 : Math.min(3, this.hintStage + 1);
    if (stage === 3 && !this.routeBought && r.solved) {
      const cooling = performance.now() - this.lastSuperHint < AD_POLICY.superHintCooldownSeconds * 1000;
      if (this.ads.rewardedAvailable && !cooling) {
        this.audio.play('ui');
        this.menuPaused = true;
        this.timers.hold('menu');
        this.ui.showOffer({
          kind: 'hint',
          text: t('offerHint'),
          onAccept: () => this.watchForSuperHint(),
          onDecline: () => {
            this.resume();
            this.showHintStage(2, solve(this.state, { maxNodes: 150000 }));
          },
        });
        return;
      }
      // While cooling down the next moves are shown again; without ads the route is free.
      if (this.ads.rewardedAvailable) stage = 2;
    }
    this.audio.play('select');
    this.showHintStage(stage, r);
  }

  async watchForSuperHint() {
    const earned = await this.rewardedAd('super-hint');
    this.menuPaused = false;
    this.timers.release('menu');
    if (earned) {
      this.routeBought = true;
      this.lastSuperHint = performance.now();
    }
    this.showHintStage(earned ? 3 : 2, solve(this.state, { maxNodes: 150000 }));
  }

  /** Simulates the solution: the tiles it walks, the first key object and the companion switches. */
  plan(actions, limitToKey) {
    let sim = this.state;
    const tiles = [];
    const switches = [];
    let key = -1;
    let firstTarget = -1;
    for (const a of actions) {
      if (a.startsWith('use:')) {
        switches.push({ at: sim.p, kind: a.slice(4) });
        const r = setActive(sim, a.slice(4));
        if (!r.ok) break;
        sim = r.state;
        continue;
      }
      const res = step(sim, a);
      if (!res.ok) break;
      for (const i of res.path.length ? res.path : [res.to]) if (i !== undefined && i >= 0 && tiles[tiles.length - 1] !== i) tiles.push(i);
      const keyAction = res.destructive || res.kind === 'open' || res.kind === 'win';
      if (firstTarget < 0 && (keyAction || a === 'wait')) firstTarget = a === 'wait' ? sim.p : res.destructive ? res.at : res.to;
      if (key < 0 && keyAction) key = res.destructive ? res.at : res.to;
      sim = res.state;
      if (limitToKey && key >= 0) break;
    }
    return { tiles, key, switches, firstTarget };
  }

  showHintStage(stage, r, { auto = false } = {}) {
    if (this.busy || this.inputBlocked || !r) return;
    this.ui.hideHand();
    this.world.clearRoute();
    if (!r.solved) {
      if (!r.exhausted) {
        this.ui.setStuck(true);
        this.ui.showHand(this.ui.buttonCenter('btnUndo'));
      }
      return;
    }
    if (!auto) {
      this.hintStage = stage;
      this.hintMax = Math.max(this.hintMax, stage);
    }
    const s = this.state;
    const first = r.actions[0];
    const plan = this.plan(r.actions, stage < 3);
    const switchFirst = first?.startsWith('use:') ? first.slice(4) : null;
    if (stage === 1) {
      // The key object, plus the companion it needs.
      this.world.showRoute([], plan.key);
      if (switchFirst) this.ui.pulse(switchFirst);
      else if (s.active) this.audio.voice(s.active, { vol: 0.35 });
      return;
    }
    this.world.showRoute(plan.tiles, plan.key);
    if (stage === 3) for (const sw of plan.switches.slice(switchFirst ? 1 : 0)) this.ui.bubble(this.world.tileScreen(sw.at, 1.2), face(sw.kind), 'need');
    if (switchFirst) {
      this.ui.showHand(this.ui.buttonCenter(switchFirst));
      this.audio.voice(switchFirst, { vol: 0.4 });
      return;
    }
    if (first === 'wait') {
      this.ui.showHand(this.world.tileScreen(s.p, 0.2));
      return;
    }
    let target = plan.firstTarget;
    if (target < 0 || !findPath(s, target)) target = step(s, first).to;
    this.ui.showHand(this.world.tileScreen(target, 0.2));
    if (s.active) this.audio.voice(s.active, { vol: 0.35 });
  }
}
