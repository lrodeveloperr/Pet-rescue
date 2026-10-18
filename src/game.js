// Game controller: connects rules, 3D world, interface, audio and the host SDK.
import { LEVELS } from './levels.js';
import {
  ABILITY,
  COMPANIONS,
  DIR_NAMES,
  DIRS,
  createState,
  findPath,
  parseLevel,
  rotateMap,
  setActive,
  solve,
  step,
} from './logic.js';
import { face, ability, UI } from './icons.js';
import * as host from './host.js';
import { t } from './i18n.js';

const TUTORIAL_LEVELS = 4;
const HINT_DELAY_TUTORIAL = 2500;
const HINT_DELAY = 12000;
const MAX_HISTORY = 400;

const COMPANION_FOR = Object.fromEntries(Object.entries(ABILITY).map(([c, a]) => [a, c]));

export class Game {
  constructor(world, ui, audio) {
    this.world = world;
    this.ui = ui;
    this.audio = audio;
    this.progress = { v: 1, owned: [], done: [], sound: true };
    this.queue = [];
    this.history = [];
    this.busy = false;
    this.menuPaused = false;
    this.hostPaused = false;
    this.pendingTap = null;
    this.hintTimer = null;
    this.goalKey = '';
  }

  // ---------- progress ----------

  async loadProgress() {
    try {
      const raw = await host.loadData();
      if (raw) {
        const p = JSON.parse(raw);
        const ids = new Set(LEVELS.map((l) => l.id));
        this.progress = {
          v: 1,
          owned: COMPANIONS.filter((c) => Array.isArray(p.owned) && p.owned.includes(c)),
          done: Array.isArray(p.done) ? p.done.filter((id) => ids.has(id)) : [],
          sound: p.sound !== false,
        };
      }
    } catch (err) {
      console.warn(err);
      this.ui.toast(t('loadFailed'));
    }
    this.audio.setUserEnabled(this.progress.sound);
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
    return this.progress.done.includes(LEVELS[i].id);
  }

  isUnlocked(i) {
    return i === 0 || this.isDone(i) || this.isDone(i - 1);
  }

  firstUnfinished() {
    const i = LEVELS.findIndex((_, k) => !this.isDone(k));
    return i < 0 ? 0 : i;
  }

  // ---------- level flow ----------

  startLevel(i) {
    this.index = i;
    const def = LEVELS[i];
    const rows = def.map.length;
    const cols = Math.max(...def.map.map((r) => r.length));
    const portrait = window.innerHeight > window.innerWidth;
    // Turn the map to match the screen so it can be drawn as large as possible.
    const rotate = portrait ? cols > rows : rows > cols * 1.2;
    this.level = parseLevel(rotate ? { ...def, map: rotateMap(def.map) } : def);
    this.state = createState(this.level, this.progress.owned);
    this.history = [];
    this.queue = [];
    this.pendingTap = null;
    this.menuPaused = false;
    this.goalKey = '';
    this.tutorial = i < TUTORIAL_LEVELS && !this.isDone(i);
    this.ui.hideOverlays();
    this.ui.hideHand();
    this.ui.setStuck(false);
    this.world.loadLevel(this.level, this.state);
    this.world.setInsets(this.ui.insets());
    this.refresh();
    this.scheduleHint(this.tutorial ? 900 : HINT_DELAY);
  }

  refresh() {
    const s = this.state;
    this.ui.setCompanions(s.owned, s.active, { swimming: s.t[s.p] === '~' });
    const goalKey = `${s.pet}|${s.rescued}`;
    if (goalKey !== this.goalKey) {
      this.goalKey = goalKey;
      this.ui.setGoal(s.pet, s.rescued);
    }
    this.ui.setUndoEnabled(this.history.length > 0);
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
      const ch = { hop: '_', dig: 'H', swim: '~' }[kind];
      for (let i = 0; i < s.t.length; i++) if (s.t[i] === ch) candidates.push(i);
      if (kind === 'swim') {
        // Only shore tiles, so the whole lake is not covered in rings.
        candidates = candidates.filter((i) =>
          DIR_NAMES.some((d) => {
            const x = (i % s.w) + DIRS[d].x;
            const y = Math.floor(i / s.w) + DIRS[d].y;
            return x >= 0 && y >= 0 && x < s.w && y < s.h && s.t[y * s.w + x] !== '~' && s.t[y * s.w + x] !== '#';
          }),
        );
      }
    }
    return candidates.filter((i) => findPath(s, i));
  }

  get inputBlocked() {
    return this.menuPaused || this.hostPaused || this.ui.overlayOpen || !this.state || this.state.won;
  }

  // ---------- input ----------

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
    if (i === s.p) return;
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
      return;
    }
    this.pushHistory(s);
    this.state = r.state;
    this.world.switchCompanion(this.state);
    this.audio.play('select');
    this.refresh();
    this.scheduleHint(this.idleDelay());
  }

  undo() {
    this.audio.unlock();
    if (this.menuPaused || this.hostPaused || this.ui.overlayOpen) return;
    this.clearHint();
    if (!this.history.length) {
      this.ui.shake('btnUndo');
      return;
    }
    this.queue = [];
    this.pendingTap = null;
    this.state = this.history.pop();
    this.world.sync(this.state);
    this.ui.setStuck(false);
    this.refresh();
    this.scheduleHint(this.idleDelay());
  }

  restart() {
    this.audio.unlock();
    this.startLevel(this.index);
  }

  next() {
    if (this.index < LEVELS.length - 1) this.startLevel(this.index + 1);
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
    switch (r.kind) {
      case 'push':
        a.play('push');
        if (r.result !== 'roll') setTimeout(() => a.play(r.result), 180);
        break;
      case 'open':
        a.play('open');
        break;
      case 'win':
        a.play('walk');
        break;
      default:
        a.play(r.kind);
    }
  }

  afterOpen(r) {
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
        const swimming = s.t[s.p] === '~';
        this.ui.bubble(pos, swimming ? UI.cross : face(c), swimming ? 'cross' : 'need');
        if (!swimming) this.ui.pulse(c);
      } else {
        this.ui.bubble(pos, UI.lock, 'lock');
      }
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
    if (s.t[s.p] !== '~') {
      for (const c of s.owned) {
        if (c === s.active) continue;
        const alt = setActive(s, c);
        if (alt.ok && findPath(alt.state, i)) {
          this.audio.play('blocked');
          this.ui.bubble(this.world.tileScreen(i, 0.9), face(c), 'need');
          this.ui.pulse(c);
          this.scheduleHint(this.idleDelay());
          return;
        }
      }
    }
    const tile = s.t[i];
    const need = s.b.includes(i) ? 'push' : { _: 'hop', '~': 'swim', H: 'dig' }[tile];
    this.audio.play('blocked');
    if (need && !s.owned.includes(COMPANION_FOR[need])) this.ui.bubble(this.world.tileScreen(i, 0.9), UI.lock, 'lock');
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
        this.ui.bubble(this.world.tileScreen(state.p, 1.3), UI.cross, 'cross');
        this.clearHint();
        this.hintTimer = setTimeout(() => this.ui.showHand(this.ui.buttonCenter('btnUndo')), 1200);
      }
    }, 30);
  }

  async onWin() {
    this.clearHint();
    this.audio.play('win');
    const id = LEVELS[this.index].id;
    const before = this.progress.owned;
    const gained = this.state.owned.find((c) => !before.includes(c)) ?? null;
    const firstTime = !this.progress.done.includes(id);
    this.progress.owned = COMPANIONS.filter((c) => before.includes(c) || this.state.owned.includes(c));
    if (firstTime) this.progress.done.push(id);
    this.saveProgress();
    host.sendScore(this.progress.done.length);
    // The full escape and reunion play before anything else appears.
    setTimeout(() => {
      if (!this.state.won) return;
      this.ui.showWin({ pet: this.state.pet, gained, hasNext: this.index < LEVELS.length - 1 });
    }, 500);
  }

  // ---------- menus ----------

  openPause() {
    if (this.ui.overlayOpen) return;
    this.menuPaused = true;
    this.clearHint();
    this.ui.showPause({ sound: this.progress.sound });
  }

  resume() {
    this.menuPaused = false;
    this.ui.hideOverlays();
    this.scheduleHint(this.idleDelay());
  }

  toggleSound() {
    this.audio.unlock();
    this.progress.sound = !this.progress.sound;
    this.audio.setUserEnabled(this.progress.sound);
    this.audio.play('select');
    this.saveProgress();
    this.ui.showPause({ sound: this.progress.sound });
  }

  openMap() {
    this.menuPaused = true;
    this.clearHint();
    this.ui.hideOverlays();
    this.ui.showMap(
      LEVELS.map((def, i) => ({
        pet: parseLevel(def).pet,
        done: this.isDone(i),
        locked: !this.isUnlocked(i),
        current: i === this.index,
      })),
    );
  }

  closeMap() {
    if (this.state?.won) {
      this.ui.hideOverlays();
      this.onWinOverlayAgain();
      return;
    }
    this.resume();
  }

  onWinOverlayAgain() {
    this.ui.showWin({ pet: this.state.pet, gained: null, hasNext: this.index < LEVELS.length - 1 });
  }

  chooseLevel(i) {
    if (this.isUnlocked(i)) this.startLevel(i);
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
      return;
    }
    // Point at the next action (push, dig, rescue, home...) or, if the plan switches
    // companion first, at the place where the switch is needed.
    let sim = s;
    let target = -1;
    for (const a of r.actions) {
      if (a.startsWith('use:')) break;
      const res = step(sim, a);
      target = res.destructive ? res.at : res.to;
      sim = res.state;
      if (res.destructive) break;
    }
    if (target < 0 || !findPath(s, target)) target = step(s, first).to;
    this.ui.showHand(this.world.tileScreen(target, 0.2));
  }
}
