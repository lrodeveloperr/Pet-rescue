// Game controller: connects rules, 3D world, interface, audio, ads and the host SDK.
import { LEVELS, WORLDS, DAILY } from './levels.js';
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
import { face, ability, UI } from './icons.js';
import { ALL_ANIMALS } from './species.js';
import { HATS } from './models.js';
import { Ads, AD_POLICY } from './ads.js';
import { Garden, nextDecoration, unlockedDecorations } from './garden.js';
import {
  dayKey,
  dayNumber,
  emptyProgress,
  liveStreak,
  migrate,
  newlyEarnedHats,
  recordDaily,
  starsFor,
  totalStars,
} from './progress.js';
import * as host from './host.js';
import { t } from './i18n.js';

const HINT_DELAY_TUTORIAL = 2500;
const HINT_DELAY = 12000;
const MAX_HISTORY = 400;

const COMPANION_FOR = Object.fromEntries(Object.entries(ABILITY).map(([c, a]) => [a, c]));

export class Game {
  constructor(world, ui, audio) {
    this.world = world;
    this.ui = ui;
    this.audio = audio;
    this.ads = new Ads();
    this.progress = emptyProgress();
    this.queue = [];
    this.history = [];
    this.busy = false;
    this.menuPaused = false;
    this.hostPaused = false;
    this.pendingTap = null;
    this.hintTimer = null;
    this.goalKey = '';
    this.mode = 'level';
    this.mapWorld = 0;
  }

  // ---------- progress ----------

  async loadProgress() {
    try {
      this.progress = migrate(await host.loadData(), LEVELS.map((l) => l.id));
    } catch (err) {
      console.warn(err);
      this.progress = emptyProgress();
      this.ui.toast(t('loadFailed'));
    }
    this.audio.setUserEnabled(this.progress.sound);
    this.audio.setMusicEnabled(this.progress.music);
    this.world.setHat(this.progress.hats.worn);
  }

  async saveProgress() {
    try {
      await host.saveData(JSON.stringify(this.progress));
    } catch (err) {
      console.warn(err);
      this.ui.toast(t('saveFailed'));
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

  // ---------- level flow ----------

  /** Start campaign level `i`. */
  startLevel(i) {
    this.index = i;
    this.daily = null;
    const def = LEVELS[i];
    const firstTime = !this.isDone(i);
    this.tutorial = firstTime && (def.worldIndex === 0 ? def.number <= 4 : def.number <= 2);
    this.load(def, def.world, this.progress.owned, i);
  }

  /** Start today's daily puzzle (or a bonus one). */
  startDaily(offset = 0) {
    const def = this.dailyPuzzle(offset);
    if (!def) return;
    this.daily = { def, offset };
    this.tutorial = false;
    this.load(def, def.world, COMPANIONS, dayNumber());
  }

  load(def, world, owned, musicIndex) {
    this.mode = 'level';
    this.garden = null;
    this.world.garden = null;
    const rows = def.map.length;
    const cols = Math.max(...def.map.map((r) => r.length));
    const portrait = window.innerHeight > window.innerWidth;
    // Turn the map to match the screen so it can be drawn as large as possible.
    const rotate = portrait ? cols > rows : rows > cols * 1.2;
    this.def = def;
    this.level = parseLevel(rotate ? rotateLevel(def) : def);
    this.state = createState(this.level, owned);
    this.history = [];
    this.queue = [];
    this.pendingTap = null;
    this.menuPaused = false;
    this.goalKey = '';
    this.ui.hideOverlays();
    this.ui.hideHand();
    this.ui.setStuck(false);
    this.ui.setMode('level');
    this.ui.setSkip(false);
    this.world.loadLevel(this.level, this.state, world);
    this.world.setInsets(this.ui.insets());
    this.refresh();
    this.audio.levelStart(musicIndex);
    this.scheduleHint(this.tutorial ? 900 : HINT_DELAY);
    this.scheduleSkipOffer();
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
    this.ui.setStars(starsFor(s.turn, this.def.par), s.turn);
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

  /** A tap on the canvas: a tile in a level, a pet in the garden. */
  pointerTap(x, y) {
    this.audio.unlock();
    if (this.mode === 'garden') {
      if (this.ui.overlayOpen) return;
      const pet = this.garden?.petAt(x, y);
      if (pet) this.audio.voice(pet.kind);
      return;
    }
    this.tap(this.world.tileAt(x, y));
  }

  tap(i) {
    this.audio.unlock();
    if (this.inputBlocked || i < 0) return;
    this.clearHint();
    if (this.busy) {
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
      this.scheduleHint(this.idleDelay());
      return;
    }
    if (kind === s.active) {
      this.ui.pulse(kind);
      this.audio.voice(kind, { vol: 0.6 });
      return;
    }
    this.pushHistory(s);
    this.state = r.state;
    this.world.switchCompanion(this.state);
    this.audio.play('select');
    this.audio.voice(kind, { delay: 0.06 });
    this.refresh();
    this.scheduleHint(this.idleDelay());
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
    this.world.sync(this.state);
    this.ui.setStuck(false);
    this.refresh();
    this.scheduleHint(this.idleDelay());
  }

  restart() {
    this.audio.unlock();
    this.audio.play('undo');
    if (this.daily) this.startDaily(this.daily.offset);
    else this.startLevel(this.index);
  }

  /** Continue after a win: an interstitial may play here, at a natural break. */
  async next() {
    this.audio.play('ui');
    if (this.daily || this.index >= LEVELS.length - 1) {
      this.openMap();
      return;
    }
    this.ui.hideOverlays();
    await this.withAdPause(() => this.ads.maybeInterstitial(this.completedCount()));
    this.startLevel(this.index + 1);
  }

  async withAdPause(fn) {
    this.audio.setPaused(true);
    try {
      return await fn();
    } finally {
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
      this.playSound(r);
      await this.world.animate(r, prev, r.state);
      // Undo or restart replaced the state while this step was animating.
      if (this.state !== r.state) break;
      if (r.kind === 'open') this.afterOpen(r);
      if (r.caught) this.audio.play('stuck');
      this.refresh();
      if (r.state.won) {
        this.busy = false;
        this.onWin();
        return;
      }
      if (r.destructive) this.checkStuck();
      if (this.pendingSelect) {
        const kind = this.pendingSelect;
        this.pendingSelect = null;
        this.busy = false;
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
          this.explainUnreachable(target);
          return;
        }
      }
    }
    this.busy = false;
    if (this.pendingSelect) {
      const kind = this.pendingSelect;
      this.pendingSelect = null;
      this.selectCompanion(kind);
    }
    this.scheduleHint(this.idleDelay());
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
    this.scheduleHint(this.idleDelay());
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
          this.scheduleHint(this.idleDelay());
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
    this.scheduleHint(this.idleDelay());
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
        this.hintTimer = setTimeout(() => this.ui.showHand(this.ui.buttonCenter('btnUndo')), 1200);
      }
    }, 30);
  }

  async onWin() {
    this.clearHint();
    clearTimeout(this.skipTimer);
    this.ui.setSkip(false);
    this.audio.play('win');
    // Everyone cheers: the rescued pet first, then the companion.
    const voices = [this.state.pet, this.state.active].filter((k, n, a) => k && a.indexOf(k) === n);
    voices.forEach((k, n) => this.audio.voice(k, { delay: 1.3 + n * 0.45 }));

    const p = this.progress;
    const starsBefore = totalStars(p);
    const stars = starsFor(this.state.turn, this.def.par);
    const before = p.owned;
    const gained = this.state.owned.find((c) => !before.includes(c)) ?? null;
    p.owned = COMPANIONS.filter((c) => before.includes(c) || this.state.owned.includes(c));
    p.rescued[this.state.pet] = (p.rescued[this.state.pet] ?? 0) + 1;
    let streak = null;
    if (this.daily) {
      streak = recordDaily(p);
    } else {
      const id = this.def.id;
      p.stars[id] = Math.max(p.stars[id] ?? 0, stars);
      p.skipped = p.skipped.filter((x) => x !== id);
      this.ads.levelCompleted();
    }
    const hats = newlyEarnedHats(p);
    p.hats.unlocked.push(...hats);
    const starsAfter = totalStars(p);
    const decoration = unlockedDecorations(starsAfter).length > unlockedDecorations(starsBefore).length;
    this.saveProgress();
    host.sendScore(starsAfter);
    // The full escape and reunion play before anything else appears.
    setTimeout(() => {
      if (!this.state.won) return;
      this.ui.showWin({
        pet: this.state.pet,
        gained,
        stars: this.daily ? 3 : stars,
        hats,
        decoration,
        streak,
        hasNext: !this.daily && this.index < LEVELS.length - 1,
        dailyReady: this.dailyUnlocked && this.progress.daily.last !== dayKey(),
      });
      this.audio.calm();
    }, 500);
  }

  // ---------- skip offer (rewarded) ----------

  scheduleSkipOffer() {
    clearTimeout(this.skipTimer);
    const policy = AD_POLICY.skipOffer;
    if (this.daily || this.tutorial || this.index < policy.notBeforeLevel || !this.ads.available) return;
    this.skipTimer = setTimeout(() => {
      if (this.state && !this.state.won && this.mode === 'level') this.ui.setSkip(true);
    }, policy.stuckSeconds * 1000);
  }

  offerSkip() {
    this.audio.play('ui');
    this.menuPaused = true;
    this.clearHint();
    this.ui.showOffer({ kind: 'skip', text: t('offerSkip'), onAccept: () => this.watchForSkip(), onDecline: () => this.resume() });
  }

  async watchForSkip() {
    this.ui.hideOverlays();
    const earned = await this.withAdPause(() => this.ads.rewarded('skip-level'));
    if (!earned) {
      this.ui.toast(t('adNoReward'));
      this.resume();
      return;
    }
    const id = this.def.id;
    if (!(id in this.progress.stars) && !this.progress.skipped.includes(id)) this.progress.skipped.push(id);
    this.saveProgress();
    this.ui.setSkip(false);
    this.startLevel(Math.min(LEVELS.length - 1, this.index + 1));
  }

  // ---------- menus ----------

  openPause() {
    if (this.ui.overlayOpen || this.mode !== 'level') return;
    this.menuPaused = true;
    this.clearHint();
    this.audio.play('ui');
    this.audio.menu(true);
    this.ui.showPause({ sound: this.progress.sound, music: this.progress.music });
  }

  resume() {
    this.audio.play('ui');
    this.audio.menu(false);
    this.menuPaused = false;
    this.ui.hideOverlays();
    if (this.mode === 'level' && this.state?.won) {
      this.showWinAgain();
      return;
    }
    this.scheduleHint(this.idleDelay());
  }

  toggleSound() {
    this.audio.unlock();
    this.progress.sound = !this.progress.sound;
    this.audio.setUserEnabled(this.progress.sound);
    this.audio.play('select');
    this.saveProgress();
    this.ui.showPause({ sound: this.progress.sound, music: this.progress.music });
  }

  toggleMusic() {
    this.audio.unlock();
    this.progress.music = !this.progress.music;
    this.audio.setMusicEnabled(this.progress.music);
    this.audio.play('select');
    this.saveProgress();
    this.ui.showPause({ sound: this.progress.sound, music: this.progress.music });
  }

  dailyPool() {
    const open = WORLDS.filter((w) => this.worldUnlocked(w.index)).map((w) => w.key);
    return DAILY.filter((d) => open.includes(d.world));
  }

  dailyPuzzle(offset = 0) {
    const pool = this.dailyPool();
    if (!pool.length) return null;
    return pool[(dayNumber() * 31 + offset * 7) % pool.length];
  }

  dailyInfo() {
    const p = this.progress;
    const doneToday = p.daily.last === dayKey();
    const bonusToday = p.daily.bonusDate === dayKey() ? p.daily.bonusCount : 0;
    return {
      unlocked: this.dailyUnlocked,
      doneToday,
      streak: liveStreak(p),
      pet: this.dailyPuzzle(doneToday ? bonusToday + 1 : 0)?.pet ?? 'kitten',
      canBonus: doneToday && this.ads.available,
    };
  }

  openMap(worldIndex = null) {
    this.menuPaused = true;
    this.clearHint();
    this.audio.play('ui');
    this.audio.menu(true);
    this.ui.hideOverlays();
    if (worldIndex !== null) this.mapWorld = worldIndex;
    else if (!this.daily && this.index !== undefined) this.mapWorld = LEVELS[this.index].worldIndex;
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
        return { pet: l.pet, stars: this.progress.stars[l.id] ?? 0, done: this.isDone(i), locked: !this.isUnlocked(i), current: i === this.index && !this.daily };
      }),
      daily: this.dailyInfo(),
      totalStars: totalStars(this.progress),
    });
  }

  closeMap() {
    this.ui.hideOverlays();
    if (this.mode === 'garden') return;
    if (this.state?.won) {
      this.audio.music?.setMuffled(false);
      this.menuPaused = false;
      this.showWinAgain();
      return;
    }
    this.resume();
  }

  showWinAgain() {
    this.ui.showWin({
      pet: this.state.pet,
      gained: null,
      stars: this.daily ? 3 : starsFor(this.state.turn, this.def.par),
      hats: [],
      hasNext: !this.daily && this.index < LEVELS.length - 1,
    });
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
    this.ui.hideOverlays();
    const earned = await this.withAdPause(() => this.ads.rewarded('bonus-daily'));
    if (!earned) {
      this.ui.toast(t('adNoReward'));
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

  // ---------- garden, album and hats ----------

  openGarden() {
    this.audio.play('ui');
    this.audio.menu(false);
    this.audio.calm();
    this.clearHint();
    clearTimeout(this.skipTimer);
    this.ui.hideOverlays();
    this.mode = 'garden';
    this.menuPaused = false;
    const animals = ALL_ANIMALS.filter((k) => this.progress.rescued[k] || this.progress.owned.includes(k));
    const stars = totalStars(this.progress);
    this.garden = new Garden(this.world, { animals, stars });
    this.world.garden = this.garden;
    this.world.setHat(this.progress.hats.worn);
    this.ui.setMode('garden');
    this.ui.showGardenBar({
      stars,
      next: nextDecoration(stars),
      canMystery: this.ads.available && HATS.some((h) => !this.progress.hats.unlocked.includes(h)),
    });
    this.world.setInsets(this.ui.insets());
  }

  leaveGarden() {
    this.audio.play('ui');
    this.openMap();
  }

  openAlbum() {
    this.audio.play('ui');
    this.ui.showAlbum(ALL_ANIMALS.map((kind) => ({ kind, count: this.progress.rescued[kind] ?? 0, owned: this.progress.owned.includes(kind) })));
  }

  openHats() {
    this.audio.play('ui');
    this.ui.showHats({ hats: HATS, unlocked: this.progress.hats.unlocked, worn: this.progress.hats.worn });
  }

  wearHat(hat) {
    if (!this.progress.hats.unlocked.includes(hat)) {
      this.audio.play('blocked');
      return;
    }
    this.progress.hats.worn = this.progress.hats.worn === hat ? null : hat;
    this.world.setHat(this.progress.hats.worn);
    this.audio.play('select');
    this.saveProgress();
    this.openHats();
  }

  offerMysteryHat() {
    this.audio.play('ui');
    this.ui.showOffer({ kind: 'hat', text: t('offerHat'), onAccept: () => this.watchForHat(), onDecline: () => this.ui.hideOverlays() });
  }

  async watchForHat() {
    this.ui.hideOverlays();
    const earned = await this.withAdPause(() => this.ads.rewarded('mystery-hat'));
    const locked = HATS.filter((h) => !this.progress.hats.unlocked.includes(h));
    if (!earned || !locked.length) {
      if (!earned) this.ui.toast(t('adNoReward'));
      return;
    }
    const hat = locked[Math.floor(Math.random() * locked.length)];
    this.progress.hats.unlocked.push(hat);
    this.progress.hats.worn = hat;
    this.world.setHat(hat);
    this.saveProgress();
    this.audio.stinger('hop');
    this.ui.showHats({ hats: HATS, unlocked: this.progress.hats.unlocked, worn: hat, fresh: hat });
  }

  setHostPaused(v) {
    this.hostPaused = v;
    this.audio.setPaused(v);
  }

  // ---------- hints ----------

  idleDelay() {
    return this.tutorial ? HINT_DELAY_TUTORIAL : HINT_DELAY;
  }

  clearHint() {
    clearTimeout(this.hintTimer);
    this.hintTimer = null;
    this.ui.hideHand();
  }

  scheduleHint(ms) {
    clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => this.showHint(), ms);
  }

  /** Point a hand at the next useful tap, computed from the solver. */
  showHint() {
    if (this.busy || this.inputBlocked) return;
    const s = this.state;
    const r = solve(s, { maxNodes: 150000 });
    if (!r.solved) {
      if (!r.exhausted) {
        this.ui.setStuck(true);
        this.ui.showHand(this.ui.buttonCenter('btnUndo'));
      }
      return;
    }
    const first = r.actions[0];
    if (first.startsWith('use:')) {
      this.ui.showHand(this.ui.buttonCenter(first.slice(4)));
      this.audio.voice(first.slice(4), { vol: 0.4 });
      return;
    }
    if (first === 'wait') {
      this.ui.showHand(this.world.tileScreen(s.p, 0.2));
      return;
    }
    // Point at the next action (push, dig, rescue, home...) or, if the plan switches
    // companion first, at the place where the switch is needed.
    let sim = s;
    let target = -1;
    for (const a of r.actions) {
      if (a.startsWith('use:') || a === 'wait') break;
      const res = step(sim, a);
      target = res.destructive ? res.at : res.to;
      sim = res.state;
      if (res.destructive) break;
    }
    if (target < 0 || !findPath(s, target)) target = step(s, first).to;
    this.ui.showHand(this.world.tileScreen(target, 0.2));
    if (s.active) this.audio.voice(s.active, { vol: 0.35 });
  }
}
