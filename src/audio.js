// Audio manager: owns the AudioContext, mute rules and music intensity.
// Sound only reinforces what the screen already shows.
import { SoundEngine } from './sound.js';
import { Music } from './music.js';
import { voiceOf } from './species.js';

const IDLE_CALM_MS = 10000;

export class Audio {
  constructor() {
    this.ctx = null;
    // YouTube owns muting (no in-game master mute); the game only offers a music toggle.
    this.hostEnabled = true;
    this.musicEnabled = true;
    this.paused = false;
    this.base = 1;
    this.level = 0;
    this.idleTimer = null;
  }

  get enabled() {
    return this.hostEnabled && !this.paused;
  }

  // Browsers only allow audio after a user gesture; every input calls this.
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.engine = new SoundEngine(this.ctx);
      this.music = new Music(this.engine);
      this.music.setLevel(this.level);
      this.apply();
    } else if (this.ctx.state === 'suspended' && this.enabled) {
      this.ctx.resume().catch(() => {});
    }
    this.activity();
  }

  apply() {
    if (!this.ctx) return;
    if (this.enabled) this.ctx.resume().catch(() => {});
    else this.ctx.suspend().catch(() => {});
    if (this.enabled && this.musicEnabled) this.music.start();
    else this.music.stop();
  }

  setHostEnabled(v) {
    this.hostEnabled = v;
    this.apply();
  }

  setMusicEnabled(v) {
    this.musicEnabled = v;
    this.apply();
  }

  setPaused(v) {
    this.paused = v;
    this.apply();
  }

  get ready() {
    return Boolean(this.ctx) && this.enabled;
  }

  // ---------- music state ----------

  levelStart(index) {
    this.level = index;
    this.base = 1;
    this.music?.setLevel(index);
    this.music?.setMuffled(false);
    this.activity();
  }

  /** After the rescue the music picks up for the escape home. */
  escaping() {
    this.base = 2;
    this.activity();
  }

  /** Any input: full intensity now, calm down again after a quiet spell. */
  activity() {
    if (!this.music) return;
    this.music.setIntensity(this.base);
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => this.music.setIntensity(0), IDLE_CALM_MS);
  }

  calm() {
    clearTimeout(this.idleTimer);
    this.music?.setIntensity(0);
  }

  menu(open) {
    this.music?.setMuffled(open);
    if (open) this.calm();
    else this.activity();
  }

  // ---------- one-shots ----------

  play(name, opts = {}) {
    if (!this.ready) return;
    const e = this.engine;
    switch (name) {
      case 'step':
        e.step(opts.surface, opts);
        break;
      case 'win':
        this.music.duck(2.6);
        this.calm();
        e.win();
        break;
      default:
        e[name]?.();
    }
  }

  voice(kind, opts = {}) {
    if (!this.ready) return;
    this.engine.voice(voiceOf(kind), { at: this.ctx.currentTime + (opts.delay ?? 0), vol: opts.vol ?? 1 });
  }

  stinger(ability, delay = 0) {
    if (!this.ready) return;
    this.music.duck(2);
    this.engine.stinger(ability, this.ctx.currentTime + delay);
  }
}
