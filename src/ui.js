// HTML overlay: icon-only controls on top of the 3D canvas.
import { face, silhouette, ability, UI, WORLD_ICONS, HAT_ICONS, MECH_ICONS } from './icons.js';
import { COMPANIONS, ABILITY } from './logic.js';
import { VARIANT_TINTS } from './models.js';
import { ABILITY_DEMOS, MECH_DEMOS, noticeScene, offerScene } from './demos.js';
import { t } from './i18n.js';

// Rewarded buttons ignore presses this soon after a panel opens, so a tap meant for the
// level cannot land on them; Next has the same guard.
const PRESS_GUARD_MS = 400;

// The screen is textless; offer wording is read to screen readers only. If a store review ever
// requires written ad disclosure, set this to true to also print the localized wording.
const SHOW_OFFER_WORDS = false;

function el(tag, attrs = {}, html = '') {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else e.setAttribute(k, v);
  }
  if (html) e.innerHTML = html;
  return e;
}

function button(cls, icon, label) {
  return el('button', { class: `btn ${cls}`, type: 'button', 'aria-label': label }, icon);
}

/** A button that plays a rewarded ad: its own colour and the video glyph, unlike Next. */
function adButton(cls, icon, label) {
  return button(`ad ${cls}`, `${icon}<i class="ad-badge">${UI.video}</i>`, label);
}

const starsHtml = (n, max = 3) => Array.from({ length: max }, (_, k) => `<i class="s ${k < n ? 'on' : 'off'}">${k < n ? UI.star : UI.starEmpty}</i>`).join('');
const tintHex = (v) => `#${VARIANT_TINTS[v].toString(16).padStart(6, '0')}`;
const lookFace = (kind, v) => (v ? `<span class="tinted" style="--tint:${tintHex(v)}">${face(kind)}</span>` : face(kind));
const animalName = (kind) => t(`a_${kind}`);

function clock(ms) {
  const m = Math.max(0, Math.ceil(ms / 60000));
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
}

// Move focus into dialogs only for keyboard players, so touch players see no focus ring.
let keyboardUser = false;
window.addEventListener('keydown', () => (keyboardUser = true), true);
window.addEventListener('pointerdown', () => (keyboardUser = false), true);
function focusForKeyboard(node) {
  if (keyboardUser) node.focus({ preventScroll: true });
}

// Pointer handling that ignores the synthetic click after a touch, and works with one finger.
// Scrolling a list (finger moves) does not count as a press.
function onPress(node, fn, { guard = 0 } = {}) {
  let down = null;
  const shown = performance.now();
  const ready = () => performance.now() - shown >= guard;
  node.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    down = { x: e.clientX, y: e.clientY };
  });
  node.addEventListener('pointerup', (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    e.stopPropagation();
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12) return;
    if (!ready()) return;
    fn(e);
  });
  node.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (ready()) fn(e);
    }
  });
}

export class Interface {
  constructor(root, handlers) {
    this.root = root;
    this.h = handlers;
    root.innerHTML = '';

    this.top = el('div', { class: 'hud top' });
    this.btnPause = button('round', UI.pause, t('pause'));
    const middle = el('div', { class: 'middle' });
    this.goal = el('div', { class: 'goal', 'aria-hidden': 'true' });
    this.starMeter = el('div', { class: 'star-meter', 'aria-hidden': 'true' });
    middle.append(this.goal, this.starMeter);
    const right = el('div', { class: 'group' });
    this.btnUndo = button('round', UI.undo, t('undo'));
    this.btnRestart = button('round', UI.restart, t('restart'));
    right.append(this.btnUndo, this.btnRestart);
    this.top.append(this.btnPause, middle, right);
    this.btnHint = button('round hint-btn', UI.hint, t('hint'));
    this.btnSkip = adButton('round skip hidden', UI.skip, t('skip'));

    this.bar = el('div', { class: 'bar', role: 'toolbar' });
    this.companionButtons = new Map();
    for (const kind of COMPANIONS) {
      const b = el('button', { class: 'companion', type: 'button', 'aria-label': t(kind) });
      b.dataset.kind = kind;
      onPress(b, () => this.h.onCompanion(kind));
      this.bar.append(b);
      this.companionButtons.set(kind, b);
    }

    this.gardenBar = el('div', { class: 'garden-bar hidden', role: 'toolbar' });

    this.layer = el('div', { class: 'layer', 'aria-hidden': 'true' });
    this.hand = el('div', { class: 'hand hidden', 'aria-hidden': 'true' }, UI.hand);
    // Screen-reader announcements only; nothing here is drawn on screen.
    this.toastEl = el('div', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });

    this.overlays = {};
    for (const name of ['pause', 'win', 'map', 'offer', 'album', 'hats', 'intro', 'calendar', 'friends']) this.overlays[name] = this.overlay(name);

    root.append(this.top, this.btnHint, this.btnSkip, this.bar, this.gardenBar, this.layer, this.hand, ...Object.values(this.overlays), this.toastEl);

    onPress(this.btnPause, () => this.h.onPause());
    onPress(this.btnUndo, () => this.h.onUndo());
    onPress(this.btnRestart, () => this.h.onRestart());
    onPress(this.btnHint, () => this.h.onHint());
    onPress(this.btnSkip, () => this.h.onSkip());
  }

  overlay(name) {
    return el('div', { class: `overlay ${name} hidden`, role: 'dialog', 'aria-modal': 'true' });
  }

  setMode(mode) {
    const level = mode === 'level';
    this.top.classList.toggle('hidden', !level);
    this.bar.classList.toggle('hidden', !level);
    this.btnHint.classList.toggle('hidden', !level);
    this.gardenBar.classList.toggle('hidden', level);
    if (!level) this.btnSkip.classList.add('hidden');
  }

  insets() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    if (!this.gardenBar.classList.contains('hidden')) {
      const g = this.gardenBar.getBoundingClientRect();
      return { top: 16, bottom: H - g.top + 8, left: 8, right: 8 };
    }
    const top = this.top.getBoundingClientRect();
    const bar = this.bar.getBoundingClientRect();
    const vertical = bar.height > bar.width;
    return {
      top: top.bottom + 4,
      bottom: vertical ? 12 : H - bar.top + 4,
      right: vertical ? W - bar.left + 4 : 8,
      left: 8,
    };
  }

  // ---------- level HUD ----------

  setGoal(pet, rescued) {
    this.goal.innerHTML =
      `<span class="goal-pet ${rescued ? 'done' : ''}">${face(pet)}${rescued ? `<i class="badge">${UI.heart}</i>` : `<i class="badge">${UI.lock}</i>`}</span>` +
      `<span class="goal-arrow">${'<b></b>'.repeat(3)}</span>` +
      `<span class="goal-home ${rescued ? 'next' : ''}">${UI.home}</span>`;
  }

  /** Three stars that drop away as the move count passes par; the target is shown as moves/par. */
  setStars(stars, moves, par) {
    const key = `${stars}|${moves}|${par}`;
    if (this.starKey === key) return;
    const lost = this.starCount !== undefined && stars < this.starCount && moves > 0;
    this.starKey = key;
    this.starCount = stars;
    this.starMeter.innerHTML = `${starsHtml(stars)}<b class="moves ${moves > par ? 'over' : ''}">${moves}<small>/${par}</small></b>`;
    if (lost) {
      this.starMeter.classList.remove('lost');
      void this.starMeter.offsetWidth;
      this.starMeter.classList.add('lost');
    }
  }

  setSkip(show) {
    this.btnSkip.classList.toggle('hidden', !show);
    if (show) this.pulse(this.btnSkip);
  }

  setHintAttention(on) {
    this.btnHint.classList.toggle('attention', on);
  }

  setCompanions(owned, active, { swimming = false } = {}) {
    for (const [kind, b] of this.companionButtons) {
      const has = owned.includes(kind);
      b.classList.toggle('locked', !has);
      b.classList.toggle('active', has && kind === active);
      b.classList.toggle('unavailable', has && swimming && kind !== 'duck');
      b.setAttribute('aria-pressed', String(has && kind === active));
      b.setAttribute('aria-label', has ? t(kind) : `${t(kind)} (${t('locked')})`);
      const key = `${has}|${kind === active}`;
      if (b.dataset.key === key) continue;
      b.dataset.key = key;
      b.innerHTML = has
        ? `<span class="face">${face(kind)}</span><span class="ability">${ability(ABILITY[kind])}</span>`
        : `<span class="face">${silhouette(kind)}</span><span class="ability lock">${UI.lock}</span>`;
    }
  }

  flashCompanionGain(kind, from) {
    const b = this.companionButtons.get(kind);
    if (!b) return;
    const rect = b.getBoundingClientRect();
    const fly = el('div', { class: 'fly' }, face(kind));
    fly.style.left = `${from.x}px`;
    fly.style.top = `${from.y}px`;
    this.layer.append(fly);
    requestAnimationFrame(() => {
      fly.style.transform = `translate(${rect.left + rect.width / 2 - from.x}px, ${rect.top + rect.height / 2 - from.y}px) scale(0.6)`;
      fly.style.opacity = '0.2';
    });
    setTimeout(() => {
      fly.remove();
      this.pulse(b);
    }, 650);
  }

  resolve(target) {
    return typeof target === 'string' ? this.companionButtons.get(target) ?? this[target] : target;
  }

  pulse(target) {
    const b = this.resolve(target);
    if (!b) return;
    b.classList.remove('pulse');
    void b.offsetWidth;
    b.classList.add('pulse');
    setTimeout(() => b.classList.remove('pulse'), 1600);
  }

  shake(target) {
    const b = this.resolve(target);
    if (!b) return;
    b.classList.remove('shake');
    void b.offsetWidth;
    b.classList.add('shake');
  }

  setStuck(stuck) {
    this.btnUndo.classList.toggle('attention', stuck);
    this.btnRestart.classList.toggle('attention', stuck);
  }

  setUndoEnabled(v) {
    this.btnUndo.disabled = !v;
  }

  /** Short-lived symbol near a tile: a red cross, a needed companion, a lock, a heart. */
  bubble(pos, html, cls = '') {
    const b = el('div', { class: `bubble ${cls}` }, html);
    b.style.left = `${pos.x}px`;
    b.style.top = `${pos.y}px`;
    this.layer.append(b);
    setTimeout(() => b.remove(), 1300);
  }

  /**
   * Wordless notices. The picture says what happened; the words go only to the screen-reader
   * live region. 'noAd': no ad could be shown. 'noReward': the ad was closed early, so no reward.
   * 'save' / 'load': progress could not be saved or loaded (play continues).
   */
  notice(kind) {
    const words = { noAd: 'adUnavailable', noReward: 'adNoReward', save: 'saveFailed', load: 'loadFailed' };
    const b = el('div', { class: `notice ${kind}`, 'aria-hidden': 'true' }, noticeScene(kind));
    this.layer.append(b);
    setTimeout(() => b.remove(), 3200);
    this.toastEl.textContent = t(words[kind]);
  }

  showHand(pos, { press = true } = {}) {
    this.hand.style.left = `${pos.x}px`;
    this.hand.style.top = `${pos.y}px`;
    this.hand.classList.toggle('press', press);
    this.hand.classList.remove('hidden');
  }

  hideHand() {
    this.hand.classList.add('hidden');
  }

  buttonCenter(target) {
    const node = this.resolve(target);
    if (!node) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const r = node.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  hideOverlays() {
    for (const o of Object.values(this.overlays)) o.classList.add('hidden');
    clearInterval(this.countdownTimer);
    this.onEscape = null;
  }

  get overlayOpen() {
    return Object.values(this.overlays).some((o) => !o.classList.contains('hidden'));
  }

  get openOverlay() {
    return Object.keys(this.overlays).find((k) => !this.overlays[k].classList.contains('hidden')) ?? null;
  }

  open(name, label, ...children) {
    const o = this.overlays[name];
    o.setAttribute('aria-label', label);
    o.innerHTML = '';
    o.append(...children);
    o.classList.remove('hidden');
    return o;
  }

  // ---------- dialogs ----------

  showPause({ music, haptics = null }) {
    const card = el('div', { class: 'card' });
    const resume = button('big primary', UI.play, t('resume'));
    const row = el('div', { class: 'row wrap' });
    const restart = button('round', UI.restart, t('restart'));
    const map = button('round', UI.map, t('map'));
    const garden = button('round', UI.garden, t('garden'));
    // Only music can be switched off here; YouTube's own controls mute the game.
    const mus = button('round', music ? UI.musicOn : UI.musicOff, music ? t('musicOn') : t('musicOff'));
    mus.setAttribute('aria-pressed', String(music));
    row.append(restart, map, garden, mus);
    // Shown only where vibration works; the game uses short haptic taps on rescues and wins.
    if (haptics !== null) {
      const hap = button('round', haptics ? UI.vibrate : UI.vibrateOff, haptics ? t('hapticsOn') : t('hapticsOff'));
      hap.setAttribute('aria-pressed', String(haptics));
      row.append(hap);
      onPress(hap, () => this.h.onHaptics());
    }
    card.append(resume, row);
    this.hideOverlays();
    this.open('pause', t('pause'), card);
    this.onEscape = () => this.h.onResume();
    onPress(resume, () => this.h.onResume());
    onPress(restart, () => this.h.onRestart());
    onPress(map, () => this.h.onMap());
    onPress(garden, () => this.h.onGarden());
    onPress(mus, () => this.h.onMusic());
    focusForKeyboard(resume);
  }

  /**
   * A wordless card for something new: each new element or companion ability plays out as a
   * short animated story (cause, then effect), with its icon beside it, and a play button.
   */
  showIntro({ mechanics = [], abilities = [], onPlay }) {
    this.introArgs = { mechanics, abilities, onPlay };
    const card = el('div', { class: 'card intro-card' });
    card.append(el('div', { class: 'intro-badge', 'aria-hidden': 'true' }, UI.sparkle));
    const stories = [
      ...abilities.map((a) => `<div class="story"><span class="mech small">${ability(a)}</span>${ABILITY_DEMOS[a]()}</div>`),
      ...mechanics.map((m) => `<div class="story"><span class="mech small">${MECH_ICONS[m]}</span>${MECH_DEMOS[m]()}</div>`),
    ];
    card.append(el('div', { class: 'intro-stories', 'aria-hidden': 'true' }, stories.join('<b class="plus">+</b>')));
    const play = button('big primary', UI.play, t('play'));
    card.append(play);
    this.hideOverlays();
    const names = [...abilities.map((a) => t(Object.keys(ABILITY).find((c) => ABILITY[c] === a))), ...mechanics.map((m) => t(`m_${m}`))];
    this.open('intro', `${t('newElement')}: ${names.join(', ')}`, card);
    this.onEscape = () => onPlay();
    onPress(play, () => onPlay(), { guard: 250 });
    focusForKeyboard(play);
  }

  reopenIntro() {
    if (this.introArgs) this.showIntro(this.introArgs);
  }

  showWin(w) {
    const card = el('div', { class: `card win-card ${w.worldDone ? 'world-done' : ''}` });
    if (w.worldDone) {
      const d = w.worldDone;
      card.append(
        el(
          'div',
          { class: 'world-banner', role: 'img', 'aria-label': t('worldDone') },
          `<span class="world-done-icon">${WORLD_ICONS[d.key]}<b class="wnum">${d.number}</b><i class="badge ok">${UI.done}</i></span><span class="world-stars">${UI.star}<b>${d.stars}/${d.max}</b></span>` +
            (d.next ? `<span class="arrow">${UI.arrow}</span><span class="world-next">${WORLD_ICONS[d.next]}<i class="sparkle">${UI.sparkle}</i></span>` : ''),
        ),
      );
    } else {
      card.append(el('div', { class: 'win-stars', role: 'img', 'aria-label': `${w.stars} ${t('stars')}` }, starsHtml(w.stars)));
    }
    card.append(
      el(
        'div',
        { class: 'hero', 'aria-hidden': 'true' },
        `<span class="hearts">${UI.heart}${UI.heart}${UI.heart}</span><span class="hero-face">${lookFace(w.pet, w.variant)}${w.newLook ? `<i class="sparkle">${UI.sparkle}</i>` : ''}</span><span class="hero-home">${UI.home}</span>`,
      ),
    );
    if (w.gained) {
      card.append(el('div', { class: 'gain', 'aria-hidden': 'true' }, `<span class="plus">+</span><span class="gain-face">${face(w.gained)}</span><span class="gain-ability ${ABILITY[w.gained]}">${ability(ABILITY[w.gained])}</span>`));
    }
    const rewards = [];
    if (w.streak) {
      rewards.push(`<span class="reward streak">${UI.flame}<b>${w.streak.n}</b></span>`);
      if (w.streak.froze) rewards.push(`<span class="reward used">${UI.freeze}<b>−${w.streak.froze}</b></span>`);
      if (w.streak.earnedFreeze) rewards.push(`<span class="reward new">${UI.freeze}<b>+1</b></span>`);
    }
    for (const h of w.hats ?? []) rewards.push(`<span class="reward new">${HAT_ICONS[h]}</span>`);
    if (w.decoration) rewards.push(`<span class="reward new">${UI.garden}</span>`);
    for (const s of w.souvenirs ?? []) rewards.push(`<span class="reward new">${WORLD_ICONS[s]}<i class="badge ok">${UI.album}</i></span>`);
    if (w.newLook) rewards.push(`<span class="reward new">${UI.album}<i class="sparkle">${UI.sparkle}</i></span>`);
    if (rewards.length) card.append(el('div', { class: 'rewards', 'aria-hidden': 'true' }, rewards.join('')));

    // The nearest goal, as a bar that fills from where it was before this win.
    if (w.goal) {
      const g = w.goal;
      const bar = el(
        'div',
        { class: 'goal-progress', role: 'img', 'aria-label': `${g.value}/${g.target}` },
        `<i class="meter"><b style="width:${Math.round(Math.min(1, g.from) * 100)}%"></b></i><span class="goal-icon">${g.icon}</span><small>${g.value}/${g.target}</small>`,
      );
      card.append(bar);
      requestAnimationFrame(() => requestAnimationFrame(() => (bar.querySelector('.meter b').style.width = `${Math.round(Math.min(1, g.to) * 100)}%`)));
    }

    const row = el('div', { class: 'row wrap' });
    const replay = button('round', UI.restart, t('restart'));
    const map = button('round', UI.map, t('map'));
    const garden = button(`round ${w.worldDone ? 'primary pulse-forever' : ''}`, UI.garden, t('garden'));
    row.append(replay, map, garden);
    if (w.dailyReady) {
      const daily = button('round daily-ready pulse-forever', UI.calendar, t('daily'));
      row.append(daily);
      onPress(daily, () => this.h.onDaily());
    }
    if (w.canShare) {
      this.btnShare = button('round', UI.share, t('share'));
      row.append(this.btnShare);
      onPress(this.btnShare, () => this.h.onShare());
    }
    if (w.canFriend) {
      const friend = adButton('round', UI.gift, t('bonusFriend'));
      row.append(friend);
      onPress(friend, () => this.h.onFriend(), { guard: PRESS_GUARD_MS });
    }
    let next = null;
    if (w.hasNext) {
      const label = w.worldDone?.next ? t('nextWorld') : t('next');
      next = button('big primary pulse-forever', w.tease ? `${UI.play}` : UI.play, label);
      const wrap = el('div', { class: 'next-wrap' });
      wrap.append(next);
      if (w.tease) wrap.append(el('div', { class: `tease ${w.tease.kind}`, 'aria-hidden': 'true' }, w.tease.html));
      card.append(wrap);
      onPress(next, () => this.h.onNext(), { guard: PRESS_GUARD_MS });
    }
    card.append(row);
    this.hideOverlays();
    this.open('win', w.worldDone ? t('worldDone') : t('next'), card);
    this.onEscape = () => this.h.onMap();
    onPress(replay, () => this.h.onRestart());
    onPress(map, () => this.h.onMap());
    onPress(garden, () => this.h.onGarden());
    if (next) setTimeout(() => focusForKeyboard(next), 50);
  }

  showMap({ worlds, world, levels, daily, weekly, encore, totalStars }) {
    const card = el('div', { class: 'card map-card' });
    const head = el('div', { class: 'map-head' });
    const close = button('round', UI.back, t('back'));
    const total = el('div', { class: 'total-stars', role: 'img', 'aria-label': `${totalStars} ${t('stars')}` }, `${UI.star}<b>${totalStars}</b>`);
    const garden = button('round', UI.garden, t('garden'));
    head.append(close, total, garden);
    card.append(head);

    // Daily puzzle card: calendar, today's pet, the streak flame, best streak and freezes.
    const extras = el('div', { class: 'extras' });
    const dailyBtn = el(
      'button',
      { class: `daily ${daily.unlocked ? '' : 'locked'} ${daily.doneToday ? 'done' : ''}`, type: 'button', 'aria-label': `${t('daily')}, ${t('streak')} ${daily.streak}` },
      `<span class="cal">${UI.calendar}</span><span class="face">${daily.unlocked ? face(daily.pet) : silhouette(daily.pet)}</span>` +
        `<span class="streak ${daily.streak ? '' : 'fresh'}">${UI.flame}<b>${daily.streak}</b></span>` +
        (daily.unlocked ? (daily.doneToday ? (daily.canBonus ? `<i class="badge ad">${UI.video}</i>` : `<i class="badge ok">${UI.check}</i>`) : '') : `<i class="badge">${UI.lock}</i>`),
    );
    if (!daily.unlocked || (daily.doneToday && !daily.canBonus)) dailyBtn.disabled = true;
    else onPress(dailyBtn, () => this.h.onDaily());
    const meta = el('div', { class: 'daily-meta' });
    if (daily.best > daily.streak) meta.append(el('span', { class: 'chip', role: 'img', 'aria-label': `${t('best')} ${daily.best}` }, `${UI.trophy}<b>${daily.best}</b>`));
    if (daily.freezes) meta.append(el('span', { class: 'chip', role: 'img', 'aria-label': `${t('freezes')} ${daily.freezes}` }, `${UI.freeze}<b>${daily.freezes}</b>`));
    if (daily.doneToday) {
      const left = el('span', { class: 'chip countdown', role: 'timer', 'aria-label': t('nextPuzzle') }, `${UI.clock}<b></b>`);
      const tick = () => (left.querySelector('b').textContent = clock(daily.nextAt - Date.now()));
      tick();
      clearInterval(this.countdownTimer);
      this.countdownTimer = setInterval(tick, 20000);
      meta.append(left);
    }
    const cal = button('round small', UI.calendar, t('calendar'));
    if (!daily.unlocked) cal.disabled = true;
    else onPress(cal, () => this.h.onCalendar());
    meta.append(cal);
    const dailyWrap = el('div', { class: 'daily-wrap' });
    dailyWrap.append(dailyBtn, meta);
    extras.append(dailyWrap);

    if (weekly) {
      const allDone = weekly.done >= weekly.total;
      const dots = Array.from({ length: weekly.total }, (_, k) => `<i class="${k < weekly.done ? 'on' : ''}"></i>`).join('');
      const wk = el(
        'button',
        { class: `weekly ${weekly.unlocked ? '' : 'locked'} ${allDone ? 'done' : ''}`, type: 'button', 'aria-label': `${t('weekly')} ${weekly.done}/${weekly.total}` },
        `<span class="cal">${UI.weekly}</span><span class="dots">${dots}</span>${weekly.unlocked ? (allDone ? `<i class="badge ok">${UI.check}</i>` : '') : `<i class="badge">${UI.lock}</i>`}`,
      );
      if (!weekly.unlocked || allDone) wk.disabled = true;
      else onPress(wk, () => this.h.onWeekly());
      extras.append(wk);
    }
    if (encore) {
      const en = el('button', { class: 'encore', type: 'button', 'aria-label': `${t('encore')} ${encore.count}` }, `<span class="cal">${UI.encore}</span><span class="face">${face(encore.pet)}</span><b>${encore.count}</b>`);
      onPress(en, () => this.h.onEncore());
      extras.append(en);
    }
    card.append(extras);

    // A scrolling strip of worlds: every open world, then a few locked ones as a preview.
    const tabs = el('div', { class: 'tabs', role: 'tablist' });
    const lastOpen = worlds.reduce((a, w, i) => (w.locked ? a : i), 0);
    worlds.slice(0, Math.max(6, lastOpen + 4)).forEach((w, i) => {
      const tab = el(
        'button',
        { class: `tab ${i === world ? 'on' : ''} ${w.locked ? 'locked' : ''}`, type: 'button', role: 'tab', 'aria-selected': String(i === world), 'aria-label': `${t('world')} ${i + 1}: ${t(`w_${w.key}`)}` },
        `${WORLD_ICONS[w.key]}<b class="wnum">${i + 1}</b>${w.locked ? `<i class="badge">${UI.lock}</i>` : `<i class="meter"><b style="width:${Math.round((w.stars / w.max) * 100)}%"></b></i>`}`,
      );
      if (w.locked) tab.disabled = true;
      else onPress(tab, () => this.h.onWorld(i));
      tabs.append(tab);
    });
    card.append(tabs);

    const grid = el('div', { class: 'map-grid' });
    levels.forEach((lv, k) => {
      const label = `${t('level')} ${k + 1}${lv.locked ? ` (${t('locked')})` : `, ${lv.stars} ${t('stars')}`}`;
      const cls = ['node', lv.done ? 'done' : '', lv.locked ? 'locked' : '', lv.current ? 'current' : ''].join(' ');
      const inner = lv.locked
        ? `<span class="face">${silhouette(lv.pet)}</span><i class="badge">${UI.lock}</i>`
        : `<span class="face">${face(lv.pet)}</span><span class="mini-stars">${starsHtml(lv.stars)}</span><b class="num">${k + 1}</b>`;
      const b = el('button', { class: cls, type: 'button', 'aria-label': label }, inner);
      if (lv.locked) b.disabled = true;
      else onPress(b, () => this.h.onLevel(k));
      grid.append(b);
    });
    card.append(grid);
    this.hideOverlays();
    this.open('map', t('map'), card);
    this.onEscape = () => this.h.onCloseMap();
    onPress(close, () => this.h.onCloseMap());
    onPress(garden, () => this.h.onGarden());
    // Bring the current or next level into view.
    const target = grid.querySelector('.current') ?? [...grid.querySelectorAll('.node:not(.locked)')].pop();
    target?.scrollIntoView({ block: 'center' });
    const tab = tabs.querySelector('.tab.on');
    if (tab) tabs.scrollLeft = tab.offsetLeft - tabs.clientWidth / 2 + tab.clientWidth / 2;
  }

  /** The last four weeks of dailies: solved, frozen or missed, with streak, best and freezes. */
  showCalendar({ cells, streak, best, freezes, nextAt, onClose }) {
    const card = el('div', { class: 'card calendar-card' });
    const close = button('round', UI.back, t('back'));
    const stats = el(
      'div',
      { class: 'cal-stats', 'aria-hidden': 'true' },
      `<span class="chip">${UI.flame}<b>${streak}</b></span><span class="chip">${UI.trophy}<b>${best}</b></span><span class="chip">${UI.freeze}<b>${freezes}</b></span><span class="chip">${UI.clock}<b>${clock(nextAt - Date.now())}</b></span>`,
    );
    const grid = el('div', { class: 'cal-grid', role: 'list' });
    for (const c of cells) {
      const icon = c.mark === 's' ? UI.star : c.mark === 'f' ? UI.freeze : '';
      grid.append(el('div', { class: `day ${c.mark ? `m-${c.mark}` : ''} ${c.today ? 'today' : ''}`, role: 'listitem', 'aria-label': `${c.key}${c.mark === 's' ? ' ✓' : c.mark === 'f' ? ' ❄' : ''}` }, icon));
    }
    card.append(close, stats, grid);
    this.hideOverlays();
    this.open('calendar', t('calendar'), card);
    this.onEscape = () => onClose();
    onPress(close, () => onClose());
  }

  /**
   * A voluntary rewarded-ad offer, shown as a picture: the ad (a play button in a screen) leads
   * to the reward. Accept (the ad glyph) and decline (a cross) look alike. The full wording is
   * read to screen readers only, so the screen stays textless.
   */
  showOffer({ kind, text, art = {}, onAccept, onDecline }) {
    const card = el('div', { class: 'card offer-card' });
    // The story: a short video plays (its bar fills), then the exact reward appears.
    card.append(el('div', { class: 'offer-story', 'aria-hidden': 'true' }, offerScene(kind, art)));
    const desc = el('p', { class: SHOW_OFFER_WORDS ? 'offer-words' : 'sr-only', id: `offer-desc-${kind}` });
    desc.textContent = text;
    card.append(desc);
    const row = el('div', { class: 'row' });
    const accept = button('pill offer-btn', UI.video, t('watchAd'));
    const decline = button('pill offer-btn', UI.close, t('noThanks'));
    row.append(decline, accept);
    card.append(row);
    this.hideOverlays();
    const o = this.open('offer', t('adLabel'), card);
    o.setAttribute('aria-describedby', desc.id);
    const no = () => {
      this.hideOverlays();
      onDecline();
    };
    this.onEscape = no;
    onPress(accept, () => onAccept(), { guard: PRESS_GUARD_MS });
    onPress(decline, no);
    focusForKeyboard(decline);
  }

  /** Bonus friend: three looks to choose from, each named, before any ad plays. */
  showFriends({ choices, onPick, onClose }) {
    const card = el('div', { class: 'card friends-card' });
    const close = button('round', UI.back, t('back'));
    const row = el('div', { class: 'row' });
    for (const c of choices) {
      const b = el('button', { class: 'friend-choice', type: 'button', 'aria-label': `${animalName(c.kind)} (${t('look')} ${c.variant + 1})` }, `${lookFace(c.kind, c.variant)}<i class="ad-badge">${UI.video}</i>`);
      onPress(b, () => onPick(c));
      row.append(b);
    }
    card.append(close, row);
    this.hideOverlays();
    this.open('friends', t('bonusFriend'), card);
    this.onEscape = () => onClose();
    onPress(close, () => onClose());
  }

  // ---------- garden ----------

  showGardenBar({ stars, next, editing }) {
    this.gardenBar.innerHTML = '';
    const back = button('round', UI.back, t('back'));
    const album = button('round', UI.album, t('album'));
    const hats = button('round', UI.hats, t('hats'));
    const move = button(`round ${editing ? 'primary' : ''}`, UI.move, t('move'));
    move.setAttribute('aria-pressed', String(Boolean(editing)));
    const progress = el('div', { class: 'deco-progress', role: 'img', 'aria-label': next ? `${stars}/${next.stars} ${t('stars')}` : `${stars} ${t('stars')}` });
    if (next) {
      const pct = Math.min(100, Math.round((stars / next.stars) * 100));
      progress.innerHTML = `${UI.star}<i class="meter"><b style="width:${pct}%"></b></i><span class="next-deco">${UI.garden}</span>`;
    } else {
      progress.innerHTML = `${UI.star}<b>${stars}</b>`;
    }
    this.gardenBar.append(back, progress, album, hats, move);
    onPress(back, () => this.h.onLeaveGarden());
    onPress(album, () => this.h.onAlbum());
    onPress(hats, () => this.h.onHats());
    onPress(move, () => this.h.onGardenEdit());
  }

  /** The album, grouped by world; a complete set shows its souvenir. */
  showAlbum(sets) {
    const card = el('div', { class: 'card album-card' });
    const close = button('round', UI.back, t('back'));
    const list = el('div', { class: 'album-sets' });
    for (const set of sets) {
      const head = el('div', { class: `set-head ${set.complete ? 'complete' : ''}`, role: 'img', 'aria-label': `${t(`w_${set.key}`)}${set.complete ? ' ✓' : ''}` }, `${WORLD_ICONS[set.key]}${set.complete ? `<i class="badge ok">${UI.check}</i>` : ''}`);
      const grid = el('div', { class: 'album-grid' });
      for (const a of set.animals) {
        const has = a.count > 0 || a.owned;
        const looks = a.looks.map((on, v) => `<i class="look v${v} ${on ? 'on' : ''}" ${v ? `style="--tint:${tintHex(v)}"` : ''}></i>`).join('');
        const looksHad = a.looks.filter(Boolean).length;
        grid.append(
          el(
            'div',
            { class: `album-item ${has ? '' : 'missing'}`, role: 'img', 'aria-label': has ? `${animalName(a.kind)} ×${a.count}, ${t('look')} ${looksHad}/${a.looks.length}` : t('locked') },
            `<span class="face">${has ? face(a.kind) : silhouette(a.kind)}</span>${a.owned ? `<i class="badge">${ability(ABILITY[a.kind])}</i>` : ''}${a.count ? `<b class="count">×${a.count}</b>` : ''}<span class="looks">${looks}</span>`,
          ),
        );
      }
      const section = el('section', { class: 'album-set' });
      section.append(head, grid);
      list.append(section);
    }
    card.append(close, list);
    this.hideOverlays();
    this.open('album', t('album'), card);
    this.onEscape = () => this.hideOverlays();
    onPress(close, () => this.hideOverlays());
  }

  /** Hats with how each locked one is earned; star hats can also be chosen with an ad. */
  showHats({ hats, worn, fresh = null, canAd = false }) {
    const card = el('div', { class: 'card hats-card' });
    const close = button('round', UI.back, t('back'));
    const grid = el('div', { class: 'hat-grid' });
    this.hatButtons = new Map();
    for (const h of hats) {
      const need = h.need ? (h.need.stars !== undefined ? `${UI.star}<b>${h.need.stars}</b>` : `${UI.flame}<b>${h.need.streak}</b>`) : '';
      const needLabel = h.need ? (h.need.stars !== undefined ? `${h.need.stars} ${t('starsNeeded')}` : `${h.need.streak} ${t('daysNeeded')}`) : '';
      const adable = !h.unlocked && canAd && h.need?.stars !== undefined;
      const b = el(
        'button',
        {
          class: `hat ${h.unlocked ? '' : 'locked'} ${worn === h.key ? 'worn' : ''} ${fresh === h.key ? 'fresh' : ''}`,
          type: 'button',
          'aria-label': `${t(`h_${h.key}`)}${h.unlocked ? '' : ` (${t('locked')}: ${needLabel}${adable ? `, ${t('mystery')}` : ''})`}`,
          'aria-pressed': String(worn === h.key),
        },
        `${HAT_ICONS[h.key]}${h.unlocked ? '' : `<span class="need">${need}</span>${adable ? `<i class="ad-badge">${UI.video}</i>` : `<i class="badge">${UI.lock}</i>`}`}${worn === h.key ? `<i class="badge ok">${UI.check}</i>` : ''}`,
      );
      onPress(b, () => this.h.onWearHat(h.key));
      grid.append(b);
      this.hatButtons.set(h.key, b);
    }
    card.append(close, grid);
    this.hideOverlays();
    this.open('hats', t('hats'), card);
    this.onEscape = () => this.hideOverlays();
    onPress(close, () => this.hideOverlays());
  }

  shakeHat(hat) {
    this.shake(this.hatButtons?.get(hat));
  }

  /** A wordless toast: icons only, for rewards that need no explanation. */
  toastIcon(html, ms = 2200) {
    const b = el('div', { class: 'bubble reward-pop' }, html);
    b.style.left = '50%';
    b.style.top = '30%';
    this.layer.append(b);
    setTimeout(() => b.remove(), ms);
  }
}
