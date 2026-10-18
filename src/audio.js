// Tiny synthesized sound effects: no audio files to download.
// Sound only reinforces what the screen already shows.
export class Audio {
  constructor() {
    this.ctx = null;
    this.hostEnabled = true;
    this.userEnabled = true;
    this.paused = false;
  }

  get enabled() {
    return this.hostEnabled && this.userEnabled && !this.paused;
  }

  // Browsers only allow audio after a user gesture.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended' && this.enabled) this.ctx.resume().catch(() => {});
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 0.5;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.apply();
  }

  apply() {
    if (!this.ctx) return;
    if (this.enabled) this.ctx.resume().catch(() => {});
    else this.ctx.suspend().catch(() => {});
  }

  setHostEnabled(v) {
    this.hostEnabled = v;
    this.apply();
  }

  setUserEnabled(v) {
    this.userEnabled = v;
    this.apply();
  }

  setPaused(v) {
    this.paused = v;
    this.apply();
  }

  tone(freq, { type = 'sine', dur = 0.12, vol = 0.3, slide = 0, delay = 0 } = {}) {
    const c = this.ctx;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  hiss({ dur = 0.2, vol = 0.25, freq = 1200, q = 0.8, delay = 0 } = {}) {
    const c = this.ctx;
    const t = c.currentTime + delay;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + dur);
  }

  play(name) {
    if (!this.ctx || !this.enabled) return;
    switch (name) {
      case 'walk':
        this.tone(520 + Math.random() * 60, { type: 'triangle', dur: 0.05, vol: 0.08 });
        break;
      case 'swim':
        this.hiss({ dur: 0.18, vol: 0.12, freq: 900 });
        break;
      case 'hop':
        this.tone(300, { type: 'sine', dur: 0.25, vol: 0.25, slide: 3 });
        break;
      case 'push':
        this.hiss({ dur: 0.22, vol: 0.3, freq: 220, q: 1.5 });
        break;
      case 'sink':
        this.tone(400, { type: 'sine', dur: 0.3, vol: 0.2, slide: 0.4 });
        this.hiss({ dur: 0.3, vol: 0.2, freq: 1400, delay: 0.05 });
        break;
      case 'fill':
        this.tone(140, { type: 'triangle', dur: 0.25, vol: 0.3, slide: 0.6 });
        break;
      case 'dig':
        for (let i = 0; i < 3; i++) this.hiss({ dur: 0.07, vol: 0.25, freq: 600, q: 2, delay: i * 0.07 });
        break;
      case 'open':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, { type: 'triangle', dur: 0.16, vol: 0.22, delay: i * 0.07 }));
        break;
      case 'win':
        [523, 659, 784, 659, 784, 1047].forEach((f, i) => this.tone(f, { type: 'square', dur: 0.14, vol: 0.09, delay: i * 0.11 }));
        break;
      case 'select':
        this.tone(660, { type: 'sine', dur: 0.08, vol: 0.2 });
        this.tone(990, { type: 'sine', dur: 0.08, vol: 0.15, delay: 0.06 });
        break;
      case 'blocked':
        this.tone(160, { type: 'square', dur: 0.14, vol: 0.12 });
        this.tone(120, { type: 'square', dur: 0.14, vol: 0.12, delay: 0.12 });
        break;
      case 'tap':
        this.tone(880, { type: 'sine', dur: 0.04, vol: 0.08 });
        break;
      case 'stuck':
        this.tone(330, { type: 'sine', dur: 0.4, vol: 0.18, slide: 0.6 });
        break;
    }
  }
}
