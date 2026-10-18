// HTML overlay: icon-only controls on top of the 3D canvas.
import { face, silhouette, ability, UI } from './icons.js';
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
  const b = el('button', { class: `btn ${cls}`, type: 'button', 'aria-label': label }, icon);
  return b;
}

// Move focus into dialogs only for keyboard players, so touch players see no focus ring.
let keyboardUser = false;
window.addEventListener('keydown', () => (keyboardUser = true), true);
window.addEventListener('pointerdown', () => (keyboardUser = false), true);
function focusForKeyboard(node) {
  if (keyboardUser) node.focus({ preventScroll: true });
}

// Pointer handling that ignores the synthetic click after a touch, and works with one finger.
function onPress(node, fn) {
  node.addEventListener('pointerup', (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    e.stopPropagation();
    fn(e);
  });
  node.addEventListener('pointerdown', (e) => e.stopPropagation());
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
    this.goal = el('div', { class: 'goal', 'aria-hidden': 'true' });
    const right = el('div', { class: 'group' });
    this.btnUndo = button('round', UI.undo, t('undo'));
    this.btnRestart = button('round', UI.restart, t('restart'));
    right.append(this.btnUndo, this.btnRestart);
    this.top.append(this.btnPause, this.goal, right);

    this.bar = el('div', { class: 'bar', role: 'toolbar' });
    this.companionButtons = new Map();
    for (const kind of COMPANIONS) {
      const b = el('button', { class: 'companion', type: 'button', 'aria-label': t(kind) });
      b.dataset.kind = kind;
      onPress(b, () => this.h.onCompanion(kind));
      this.bar.append(b);
      this.companionButtons.set(kind, b);
    }

    this.layer = el('div', { class: 'layer', 'aria-hidden': 'true' });
    this.hand = el('div', { class: 'hand hidden', 'aria-hidden': 'true' }, UI.hand);
    this.toastEl = el('div', { class: 'toast hidden', role: 'status', 'aria-live': 'polite' });

    this.pauseOverlay = this.overlay('pause');
    this.winOverlay = this.overlay('win');
    this.mapOverlay = this.overlay('map');

    root.append(this.top, this.bar, this.layer, this.hand, this.pauseOverlay, this.winOverlay, this.mapOverlay, this.toastEl);

    onPress(this.btnPause, () => this.h.onPause());
    onPress(this.btnUndo, () => this.h.onUndo());
    onPress(this.btnRestart, () => this.h.onRestart());
  }

  overlay(name) {
    return el('div', { class: `overlay ${name} hidden`, role: 'dialog', 'aria-modal': 'true' });
  }

  insets() {
    const W = window.innerWidth;
    const H = window.innerHeight;
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

  setGoal(pet, rescued) {
    this.goal.innerHTML =
      `<span class="goal-pet ${rescued ? 'done' : ''}">${face(pet)}${rescued ? `<i class="badge">${UI.heart}</i>` : `<i class="badge">${UI.lock}</i>`}</span>` +
      `<span class="goal-arrow">${'<b></b>'.repeat(3)}</span>` +
      `<span class="goal-home ${rescued ? 'next' : ''}">${UI.home}</span>`;
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

  pulse(target) {
    const b = typeof target === 'string' ? this.companionButtons.get(target) ?? this[target] : target;
    if (!b) return;
    b.classList.remove('pulse');
    void b.offsetWidth;
    b.classList.add('pulse');
    setTimeout(() => b.classList.remove('pulse'), 1600);
  }

  shake(target) {
    const b = typeof target === 'string' ? this.companionButtons.get(target) ?? this[target] : target;
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
    const b = typeof target === 'string' ? this.companionButtons.get(target) ?? this[target] : target;
    const r = b.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  hideOverlays() {
    for (const o of [this.pauseOverlay, this.winOverlay, this.mapOverlay]) o.classList.add('hidden');
  }

  get overlayOpen() {
    return [this.pauseOverlay, this.winOverlay, this.mapOverlay].some((o) => !o.classList.contains('hidden'));
  }

  showPause({ sound }) {
    const o = this.pauseOverlay;
    o.setAttribute('aria-label', t('pause'));
    o.innerHTML = '';
    const card = el('div', { class: 'card' });
    const resume = button('big primary', UI.play, t('resume'));
    const row = el('div', { class: 'row' });
    const restart = button('round', UI.restart, t('restart'));
    const map = button('round', UI.map, t('map'));
    const snd = button('round', sound ? UI.soundOn : UI.soundOff, sound ? t('soundOn') : t('soundOff'));
    snd.setAttribute('aria-pressed', String(sound));
    row.append(restart, map, snd);
    card.append(resume, row);
    o.append(card);
    onPress(resume, () => this.h.onResume());
    onPress(restart, () => this.h.onRestart());
    onPress(map, () => this.h.onMap());
    onPress(snd, () => this.h.onSound());
    o.classList.remove('hidden');
    focusForKeyboard(resume);
  }

  showWin({ pet, gained, hasNext }) {
    const o = this.winOverlay;
    o.setAttribute('aria-label', t('next'));
    o.innerHTML = '';
    const card = el('div', { class: 'card win-card' });
    const hero = el('div', { class: 'hero' }, `<span class="hearts">${UI.heart}${UI.heart}${UI.heart}</span><span class="hero-face">${face(pet)}</span><span class="hero-home">${UI.home}</span>`);
    card.append(hero);
    if (gained) {
      card.append(el('div', { class: 'gain' }, `<span class="plus">+</span><span class="gain-face">${face(gained)}</span><span class="gain-ability ${ABILITY[gained]}">${ability(ABILITY[gained])}</span>`));
    }
    const row = el('div', { class: 'row' });
    const replay = button('round', UI.restart, t('restart'));
    const map = button('round', UI.map, t('map'));
    row.append(replay, map);
    if (hasNext) {
      const next = button('big primary pulse-forever', UI.play, t('next'));
      card.append(next);
      onPress(next, () => this.h.onNext());
      setTimeout(() => focusForKeyboard(next), 50);
    }
    card.append(row);
    o.append(card);
    onPress(replay, () => this.h.onRestart());
    onPress(map, () => this.h.onMap());
    o.classList.remove('hidden');
  }

  showMap(levels) {
    const o = this.mapOverlay;
    o.setAttribute('aria-label', t('map'));
    o.innerHTML = '';
    const card = el('div', { class: 'card map-card' });
    const grid = el('div', { class: 'map-grid' });
    levels.forEach((lv, i) => {
      const label = `${t('level')} ${i + 1}${lv.locked ? ` (${t('locked')})` : ''}`;
      const cls = ['node', lv.done ? 'done' : '', lv.locked ? 'locked' : '', lv.current ? 'current' : ''].join(' ');
      const inner = lv.locked
        ? `<span class="face">${silhouette(lv.pet)}</span><i class="badge">${UI.lock}</i>`
        : `<span class="face">${face(lv.pet)}</span>${lv.done ? `<i class="badge ok">${UI.check}</i>` : ''}`;
      const b = el('button', { class: cls, type: 'button', 'aria-label': label }, inner);
      if (lv.locked) b.disabled = true;
      else onPress(b, () => this.h.onLevel(i));
      grid.append(b);
    });
    const close = button('big primary', UI.play, t('resume'));
    card.append(grid, close);
    o.append(card);
    onPress(close, () => this.h.onCloseMap());
    o.classList.remove('hidden');
  }

  toast(text, ms = 4000) {
    this.toastEl.textContent = text;
    this.toastEl.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastEl.classList.add('hidden'), ms);
  }
}
