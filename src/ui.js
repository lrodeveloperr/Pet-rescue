// HTML overlay: icon-only controls on top of the 3D canvas.
import { face, silhouette, ability, UI, WORLD_ICONS, HAT_ICONS } from './icons.js';
import { COMPANIONS, ABILITY } from './logic.js';
import { t } from './i18n.js';

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

const starsHtml = (n, max = 3) => Array.from({ length: max }, (_, k) => `<i class="s ${k < n ? 'on' : 'off'}">${k < n ? UI.star : UI.starEmpty}</i>`).join('');

// Move focus into dialogs only for keyboard players, so touch players see no focus ring.
let keyboardUser = false;
window.addEventListener('keydown', () => (keyboardUser = true), true);
window.addEventListener('pointerdown', () => (keyboardUser = false), true);
function focusForKeyboard(node) {
  if (keyboardUser) node.focus({ preventScroll: true });
}

// Pointer handling that ignores the synthetic click after a touch, and works with one finger.
// Scrolling a list (finger moves) does not count as a press.
function onPress(node, fn) {
  let down = null;
  node.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    down = { x: e.clientX, y: e.clientY };
  });
  node.addEventListener('pointerup', (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    e.stopPropagation();
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12) return;
    fn(e);
  });
  node.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fn(e);
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
    this.btnSkip = button('round skip hidden', `${UI.skip}<i class="ad-badge">${t('adLabel')}</i>`, t('skip'));

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
    this.toastEl = el('div', { class: 'toast hidden', role: 'status', 'aria-live': 'polite' });

    this.overlays = {};
    for (const name of ['pause', 'win', 'map', 'offer', 'album', 'hats']) this.overlays[name] = this.overlay(name);

    root.append(this.top, this.btnSkip, this.bar, this.gardenBar, this.layer, this.hand, ...Object.values(this.overlays), this.toastEl);

    onPress(this.btnPause, () => this.h.onPause());
    onPress(this.btnUndo, () => this.h.onUndo());
    onPress(this.btnRestart, () => this.h.onRestart());
    onPress(this.btnSkip, () => this.h.onSkip());
  }

  overlay(name) {
    return el('div', { class: `overlay ${name} hidden`, role: 'dialog', 'aria-modal': 'true' });
  }

  setMode(mode) {
    const level = mode === 'level';
    this.top.classList.toggle('hidden', !level);
    this.bar.classList.toggle('hidden', !level);
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

  /** Three stars that drop away as the move count passes par. */
  setStars(stars, moves) {
    const key = `${stars}|${moves}`;
    if (this.starKey === key) return;
    const lost = this.starCount !== undefined && stars < this.starCount;
    this.starKey = key;
    this.starCount = stars;
    this.starMeter.innerHTML = `${starsHtml(stars)}<b class="moves">${moves}</b>`;
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
    const r = this.resolve(target).getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  hideOverlays() {
    for (const o of Object.values(this.overlays)) o.classList.add('hidden');
  }

  get overlayOpen() {
    return Object.values(this.overlays).some((o) => !o.classList.contains('hidden'));
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

  showPause({ sound, music }) {
    const card = el('div', { class: 'card' });
    const resume = button('big primary', UI.play, t('resume'));
    const row = el('div', { class: 'row wrap' });
    const restart = button('round', UI.restart, t('restart'));
    const map = button('round', UI.map, t('map'));
    const garden = button('round', UI.garden, t('garden'));
    const snd = button('round', sound ? UI.soundOn : UI.soundOff, sound ? t('soundOn') : t('soundOff'));
    snd.setAttribute('aria-pressed', String(sound));
    const mus = button('round', music ? UI.musicOn : UI.musicOff, music ? t('musicOn') : t('musicOff'));
    mus.setAttribute('aria-pressed', String(music));
    row.append(restart, map, garden, snd, mus);
    card.append(resume, row);
    this.hideOverlays();
    this.open('pause', t('pause'), card);
    onPress(resume, () => this.h.onResume());
    onPress(restart, () => this.h.onRestart());
    onPress(map, () => this.h.onMap());
    onPress(garden, () => this.h.onGarden());
    onPress(snd, () => this.h.onSound());
    onPress(mus, () => this.h.onMusic());
    focusForKeyboard(resume);
  }

  showWin({ pet, gained, stars = 0, hats = [], decoration = false, streak = null, hasNext, dailyReady = false }) {
    const card = el('div', { class: 'card win-card' });
    card.append(el('div', { class: 'win-stars' }, starsHtml(stars)));
    card.append(el('div', { class: 'hero' }, `<span class="hearts">${UI.heart}${UI.heart}${UI.heart}</span><span class="hero-face">${face(pet)}</span><span class="hero-home">${UI.home}</span>`));
    if (gained) {
      card.append(el('div', { class: 'gain' }, `<span class="plus">+</span><span class="gain-face">${face(gained)}</span><span class="gain-ability ${ABILITY[gained]}">${ability(ABILITY[gained])}</span>`));
    }
    const rewards = [];
    if (streak) rewards.push(`<span class="reward streak">${UI.flame}<b>${streak}</b></span>`);
    for (const h of hats) rewards.push(`<span class="reward new">${HAT_ICONS[h]}</span>`);
    if (decoration) rewards.push(`<span class="reward new">${UI.garden}</span>`);
    if (rewards.length) card.append(el('div', { class: 'rewards' }, rewards.join('')));
    const row = el('div', { class: 'row' });
    const replay = button('round', UI.restart, t('restart'));
    const map = button('round', UI.map, t('map'));
    const garden = button('round', UI.garden, t('garden'));
    row.append(replay, map, garden);
    if (dailyReady) {
      const daily = button('round daily-ready pulse-forever', UI.calendar, t('daily'));
      row.append(daily);
      onPress(daily, () => this.h.onDaily());
    }
    let next = null;
    if (hasNext) {
      next = button('big primary pulse-forever', UI.play, t('next'));
      card.append(next);
      onPress(next, () => this.h.onNext());
    }
    card.append(row);
    this.hideOverlays();
    this.open('win', t('next'), card);
    onPress(replay, () => this.h.onRestart());
    onPress(map, () => this.h.onMap());
    onPress(garden, () => this.h.onGarden());
    if (next) setTimeout(() => focusForKeyboard(next), 50);
  }

  showMap({ worlds, world, levels, daily, totalStars }) {
    const card = el('div', { class: 'card map-card' });
    const head = el('div', { class: 'map-head' });
    const close = button('round', UI.back, t('back'));
    const total = el('div', { class: 'total-stars', 'aria-hidden': 'true' }, `${UI.star}<b>${totalStars}</b>`);
    const garden = button('round', UI.garden, t('garden'));
    head.append(close, total, garden);
    card.append(head);

    // Daily puzzle card: calendar, today's pet, and the streak flame.
    const dailyBtn = el(
      'button',
      { class: `daily ${daily.unlocked ? '' : 'locked'} ${daily.doneToday ? 'done' : ''}`, type: 'button', 'aria-label': t('daily') },
      `<span class="cal">${UI.calendar}</span><span class="face">${daily.unlocked ? face(daily.pet) : silhouette(daily.pet)}</span>` +
        `<span class="streak">${UI.flame}<b>${daily.streak}</b></span>` +
        (daily.unlocked ? (daily.doneToday ? (daily.canBonus ? `<i class="badge ad">${t('adLabel')}</i>` : `<i class="badge ok">${UI.check}</i>`) : '') : `<i class="badge">${UI.lock}</i>`),
    );
    if (!daily.unlocked || (daily.doneToday && !daily.canBonus)) dailyBtn.disabled = true;
    else onPress(dailyBtn, () => this.h.onDaily());
    card.append(dailyBtn);

    const tabs = el('div', { class: 'tabs', role: 'tablist' });
    worlds.forEach((w, i) => {
      const tab = el(
        'button',
        { class: `tab ${i === world ? 'on' : ''} ${w.locked ? 'locked' : ''}`, type: 'button', role: 'tab', 'aria-selected': String(i === world), 'aria-label': `${t('world')} ${i + 1}` },
        `${WORLD_ICONS[w.key]}${w.locked ? `<i class="badge">${UI.lock}</i>` : `<i class="meter"><b style="width:${Math.round((w.stars / w.max) * 100)}%"></b></i>`}`,
      );
      if (w.locked) tab.disabled = true;
      else onPress(tab, () => this.h.onWorld(i));
      tabs.append(tab);
    });
    card.append(tabs);

    const grid = el('div', { class: 'map-grid' });
    levels.forEach((lv, k) => {
      const label = `${t('level')} ${k + 1}${lv.locked ? ` (${t('locked')})` : ''}`;
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
    onPress(close, () => this.h.onCloseMap());
    onPress(garden, () => this.h.onGarden());
    // Bring the current or next level into view.
    const target = grid.querySelector('.current') ?? [...grid.querySelectorAll('.node:not(.locked)')].pop();
    target?.scrollIntoView({ block: 'center' });
  }

  /** A voluntary rewarded-ad offer: always says what it is, what it gives, and how to decline. */
  showOffer({ kind, text, onAccept, onDecline }) {
    const card = el('div', { class: 'card offer-card' });
    const icon = { skip: UI.skip, hat: UI.hats, bonus: UI.calendar }[kind];
    card.append(el('div', { class: 'offer-icon', 'aria-hidden': 'true' }, `${icon}<i class="ad-badge">${t('adLabel')}</i>`));
    card.append(el('p', { class: 'offer-text' }, ''));
    card.querySelector('.offer-text').textContent = text;
    const row = el('div', { class: 'row' });
    const accept = el('button', { class: 'btn pill primary', type: 'button' }, `${UI.play}<span></span>`);
    accept.querySelector('span').textContent = t('watchAd');
    const decline = el('button', { class: 'btn pill', type: 'button' }, '<span></span>');
    decline.querySelector('span').textContent = t('noThanks');
    row.append(decline, accept);
    card.append(row);
    this.hideOverlays();
    this.open('offer', t('adLabel'), card);
    onPress(accept, () => onAccept());
    onPress(decline, () => {
      this.hideOverlays();
      onDecline();
    });
    focusForKeyboard(accept);
  }

  // ---------- garden ----------

  showGardenBar({ stars, next, canMystery }) {
    this.gardenBar.innerHTML = '';
    const back = button('round', UI.back, t('back'));
    const album = button('round', UI.album, t('album'));
    const hats = button('round', UI.hats, t('hats'));
    const progress = el('div', { class: 'deco-progress', 'aria-hidden': 'true' });
    if (next) {
      const pct = Math.min(100, Math.round((stars / next.stars) * 100));
      progress.innerHTML = `${UI.star}<i class="meter"><b style="width:${pct}%"></b></i><span class="next-deco">${UI.garden}</span>`;
    } else {
      progress.innerHTML = `${UI.star}<b>${stars}</b>`;
    }
    this.gardenBar.append(back, progress, album, hats);
    if (canMystery) {
      const mystery = button('round mystery', `${UI.hats}<i class="ad-badge">${t('adLabel')}</i>`, t('mystery'));
      this.gardenBar.append(mystery);
      onPress(mystery, () => this.h.onMystery());
    }
    onPress(back, () => this.h.onLeaveGarden());
    onPress(album, () => this.h.onAlbum());
    onPress(hats, () => this.h.onHats());
  }

  showAlbum(list) {
    const card = el('div', { class: 'card album-card' });
    const close = button('round', UI.back, t('back'));
    const grid = el('div', { class: 'album-grid' });
    for (const a of list) {
      const has = a.count > 0 || a.owned;
      grid.append(
        el(
          'div',
          { class: `album-item ${has ? '' : 'missing'}`, 'aria-label': has ? `${a.kind} ×${a.count}` : t('locked') },
          `<span class="face">${has ? face(a.kind) : silhouette(a.kind)}</span>${a.owned ? `<i class="badge">${ability(ABILITY[a.kind])}</i>` : ''}${a.count ? `<b class="count">×${a.count}</b>` : ''}`,
        ),
      );
    }
    card.append(close, grid);
    this.hideOverlays();
    this.open('album', t('album'), card);
    onPress(close, () => this.hideOverlays());
  }

  showHats({ hats, unlocked, worn, fresh = null }) {
    const card = el('div', { class: 'card hats-card' });
    const close = button('round', UI.back, t('back'));
    const grid = el('div', { class: 'hat-grid' });
    for (const h of hats) {
      const has = unlocked.includes(h);
      const b = el(
        'button',
        { class: `hat ${has ? '' : 'locked'} ${worn === h ? 'worn' : ''} ${fresh === h ? 'fresh' : ''}`, type: 'button', 'aria-label': h, 'aria-pressed': String(worn === h) },
        `${HAT_ICONS[h]}${has ? '' : `<i class="badge">${UI.lock}</i>`}${worn === h ? `<i class="badge ok">${UI.check}</i>` : ''}`,
      );
      onPress(b, () => this.h.onWearHat(h));
      grid.append(b);
    }
    card.append(close, grid);
    this.hideOverlays();
    this.open('hats', t('hats'), card);
    onPress(close, () => this.hideOverlays());
  }

  toast(text, ms = 4000) {
    this.toastEl.textContent = text;
    this.toastEl.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastEl.classList.add('hidden'), ms);
  }
}
