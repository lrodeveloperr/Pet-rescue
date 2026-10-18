// Synthesized sound: effects, animal voices and ability stingers.
// Works with a live AudioContext or an OfflineAudioContext (used to render previews in tests).

const rand = (a, b) => a + Math.random() * (b - a);
export const midiToHz = (m) => 440 * 2 ** ((m - 69) / 12);

export class SoundEngine {
  constructor(ctx) {
    this.ctx = ctx;
    // Stateless soft clipper as a safety limiter. (A DynamicsCompressor was tried and its
    // make-up gain produced occasional loud onset spikes.)
    const clip = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) curve[i] = Math.tanh(((i / (curve.length - 1)) * 2 - 1) * 1.2) / Math.tanh(1.2);
    clip.curve = curve;
    this.master = ctx.createGain();
    this.master.gain.value = 1.2;
    this.master.connect(clip).connect(ctx.destination);

    this.sfx = ctx.createGain();
    this.sfx.gain.value = 0.9;
    this.sfx.connect(this.master);
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0.3;
    this.musicBus.connect(this.master);

    // Small room reverb from a generated impulse response.
    const len = Math.floor(ctx.sampleRate * 1.3);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
    }
    const convolver = ctx.createConvolver();
    convolver.buffer = ir;
    this.reverbIn = ctx.createGain();
    this.reverbIn.gain.value = 0.5;
    this.reverbIn.connect(convolver).connect(this.master);

    const nlen = ctx.sampleRate;
    this.noiseBuf = ctx.createBuffer(1, nlen, ctx.sampleRate);
    const nd = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < nlen; i++) nd[i] = Math.random() * 2 - 1;
    this.key = 60;
  }

  get now() {
    return this.ctx.currentTime;
  }

  envelope(g, t, { vol, attack = 0.005, dur, hold = 0 }) {
    // Start silent: a gain node defaults to 1, and a source starting a fraction of a sample
    // before the first automation event would otherwise leak one full-volume sample (a click).
    g.gain.value = 0;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), t + attack);
    if (hold) g.gain.setValueAtTime(Math.max(vol, 0.0002), t + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, attack + hold + 0.01));
  }

  filterNode(t, f) {
    const n = this.ctx.createBiquadFilter();
    n.type = f.type ?? 'lowpass';
    n.frequency.setValueAtTime(f.freq, t);
    if (f.to) n.frequency.exponentialRampToValueAtTime(f.to, t + (f.glide ?? f.dur ?? 0.2));
    n.Q.value = f.q ?? 0.7;
    return n;
  }

  // Shared tail: tremolo, envelope, destination and reverb send.
  finish(node, t, o, stopAt, sources) {
    const c = this.ctx;
    let out = node;
    if (o.am) {
      const amp = c.createGain();
      amp.gain.value = 1 - o.am.depth;
      const lfo = c.createOscillator();
      lfo.frequency.value = o.am.rate;
      const depth = c.createGain();
      depth.gain.value = o.am.depth;
      lfo.connect(depth).connect(amp.gain);
      lfo.start(t);
      lfo.stop(stopAt);
      out.connect(amp);
      out = amp;
    }
    const g = c.createGain();
    this.envelope(g, t, o);
    out.connect(g);
    g.connect(o.dest ?? this.sfx);
    if (o.reverb) {
      const send = c.createGain();
      send.gain.value = o.reverb;
      g.connect(send).connect(this.reverbIn);
    }
    for (const s of sources) {
      s.start(t);
      s.stop(stopAt);
    }
  }

  /** One oscillator voice with optional glide, pitch contour, vibrato, filter and tremolo. */
  tone(o) {
    const c = this.ctx;
    const t = o.at ?? c.currentTime;
    const osc = c.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide ?? o.dur));
    if (o.points) for (const [dt, f] of o.points) osc.frequency.linearRampToValueAtTime(f, t + dt);
    if (o.detune) osc.detune.value = o.detune;
    const stopAt = t + o.dur + 0.05;
    const sources = [osc];
    if (o.vibrato) {
      const lfo = c.createOscillator();
      lfo.frequency.value = o.vibrato.rate;
      const lg = c.createGain();
      lg.gain.value = o.vibrato.depth;
      lfo.connect(lg).connect(osc.frequency);
      sources.push(lfo);
    }
    let node = osc;
    if (o.filter) node = node.connect(this.filterNode(t, { dur: o.dur, ...o.filter }));
    this.finish(node, t, o, stopAt, sources);
  }

  /** Filtered noise burst. */
  hiss(o) {
    const c = this.ctx;
    const t = o.at ?? c.currentTime;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    src.playbackRate.value = o.rate ?? 1;
    const f = this.filterNode(t, { type: 'bandpass', dur: o.dur, ...(o.filter ?? {}) });
    src.connect(f);
    this.finish(f, t, o, t + o.dur + 0.05, [src]);
  }

  /** Bell / mallet: fundamental plus an inharmonic partial. */
  bell(freq, at, { vol = 0.12, dur = 0.9, reverb = 0.5, dest } = {}) {
    this.tone({ freq, at, dur, vol, reverb, dest });
    this.tone({ freq: freq * 2.76, at, dur: dur * 0.35, vol: vol * 0.25, reverb, dest });
  }

  // ---------- effects ----------

  step(surface = '.', { at = this.now, vol = 1 } = {}) {
    const p = rand(0.92, 1.08);
    const v = vol * rand(0.8, 1.1);
    switch (surface) {
      case ',':
        this.hiss({ at, dur: 0.07, vol: 0.22 * v, filter: { freq: 1500 * p, q: 1 } });
        this.hiss({ at: at + 0.018, dur: 0.05, vol: 0.14 * v, filter: { freq: 2600 * p, q: 1.5 } });
        this.tone({ freq: 130 * p, to: 80, at, dur: 0.05, vol: 0.05 * v });
        break;
      case '=':
      case '+':
        this.tone({ type: 'triangle', freq: 950 * p, at, dur: 0.035, vol: 0.06 * v });
        this.hiss({ at, dur: 0.03, vol: 0.06 * v, filter: { type: 'highpass', freq: 3000 } });
        break;
      case 'E':
        this.tone({ freq: 420 * p, at, dur: 0.07, vol: 0.12 * v });
        this.tone({ freq: 640 * p, at, dur: 0.05, vol: 0.06 * v });
        break;
      default:
        this.hiss({ at, dur: 0.055, vol: 0.13 * v, filter: { type: 'lowpass', freq: 750 * p, q: 0.8 } });
        this.tone({ freq: 150 * p, to: 90, at, dur: 0.05, vol: 0.07 * v });
    }
  }

  swim(at = this.now) {
    const p = rand(0.85, 1.15);
    this.hiss({ at, dur: 0.18, vol: 0.14, filter: { freq: 600 * p, to: 1700 * p, q: 1.2 } });
    this.tone({ freq: 300 * p, to: 540 * p, at: at + rand(0.03, 0.08), dur: 0.07, vol: 0.07 });
  }

  hop(at = this.now) {
    this.tone({ freq: 230, to: 690, glide: 0.18, at, dur: 0.26, vol: 0.18, vibrato: { rate: 16, depth: 25 } });
    this.hiss({ at, dur: 0.08, vol: 0.05, filter: { freq: 2500, to: 5000, q: 1 } });
    this.step('.', { at: at + 0.31, vol: 1.6 });
  }

  push(at = this.now) {
    const p = rand(0.9, 1.1);
    this.hiss({ at, dur: 0.26, vol: 0.32, attack: 0.02, filter: { type: 'lowpass', freq: 260 * p, q: 1 }, am: { rate: 14, depth: 0.6 } });
    this.tone({ freq: 72 * p, at, dur: 0.22, vol: 0.12, attack: 0.02 });
    this.hiss({ at, dur: 0.2, vol: 0.05, filter: { freq: 520 * p, q: 3 } });
  }

  sink(at = this.now) {
    this.hiss({ at, dur: 0.45, vol: 0.34, filter: { freq: 1300, to: 550, q: 0.7 } });
    this.hiss({ at, dur: 0.22, vol: 0.12, filter: { type: 'highpass', freq: 3500 } });
    this.tone({ freq: 190, to: 90, at, dur: 0.22, vol: 0.2 });
    for (let i = 0; i < 4; i++) {
      const f = rand(420, 720);
      this.tone({ freq: f, to: f * 1.7, at: at + 0.12 + i * 0.07 + rand(0, 0.03), dur: 0.05, vol: 0.07 });
    }
  }

  fill(at = this.now) {
    this.tone({ freq: 110, to: 42, at, dur: 0.32, vol: 0.45 });
    this.hiss({ at, dur: 0.25, vol: 0.25, filter: { type: 'lowpass', freq: 420 } });
    for (let i = 0; i < 4; i++) this.tone({ type: 'triangle', freq: rand(1500, 2600), at: at + rand(0.05, 0.28), dur: 0.02, vol: 0.04 });
  }

  dig(at = this.now) {
    for (let i = 0; i < 5; i++) {
      this.hiss({ at: at + i * 0.045 + rand(0, 0.02), dur: rand(0.04, 0.08), vol: 0.12, filter: { freq: rand(2500, 4500), q: 1.5 } });
    }
    this.hiss({ at: at + 0.05, dur: 0.12, vol: 0.12, filter: { freq: 900, q: 1 } });
    this.tone({ freq: 520, to: 240, at: at + 0.24, dur: 0.07, vol: 0.08 });
  }

  open(at = this.now) {
    this.tone({ freq: 1180, at, dur: 0.28, vol: 0.12, reverb: 0.3 });
    this.tone({ freq: 1735, at, dur: 0.2, vol: 0.07, reverb: 0.3 });
    this.tone({ freq: 2650, at, dur: 0.12, vol: 0.04 });
    this.hiss({ at, dur: 0.05, vol: 0.08, filter: { type: 'highpass', freq: 4000 } });
    [0, 4, 7, 12, 16].forEach((s, i) => this.bell(midiToHz(this.key + 24 + s), at + 0.12 + i * 0.06, { vol: 0.09 }));
  }

  select(at = this.now) {
    this.tone({ freq: 880, at, dur: 0.06, vol: 0.09 });
    this.tone({ freq: 1320, at: at + 0.05, dur: 0.07, vol: 0.07 });
  }

  blocked(at = this.now) {
    this.tone({ freq: 260, to: 165, at, dur: 0.17, vol: 0.2 });
    this.tone({ type: 'triangle', freq: 130, at, dur: 0.1, vol: 0.08 });
  }

  tap(at = this.now) {
    this.tone({ freq: rand(1400, 1700), at, dur: 0.025, vol: 0.05 });
  }

  ui(at = this.now) {
    this.tone({ freq: 700, at, dur: 0.035, vol: 0.08 });
    this.hiss({ at, dur: 0.012, vol: 0.04, filter: { type: 'highpass', freq: 5000 } });
  }

  undo(at = this.now) {
    this.tone({ freq: 900, to: 300, at, dur: 0.18, vol: 0.08 });
    this.hiss({ at, dur: 0.18, vol: 0.06, filter: { freq: 3000, to: 800, q: 1 } });
  }

  stuck(at = this.now) {
    const o = { type: 'triangle', vol: 0.14, filter: { type: 'lowpass', freq: 1300 } };
    this.tone({ ...o, freq: 392, to: 370, at, dur: 0.3 });
    this.tone({ ...o, freq: 330, to: 311, at: at + 0.32, dur: 0.3 });
    this.tone({ ...o, freq: 262, to: 220, at: at + 0.64, dur: 0.7, vibrato: { rate: 6, depth: 6 } });
  }

  win(at = this.now) {
    const k = this.key + 12;
    const tune = [[0, 0], [4, 0.12], [7, 0.24], [12, 0.36], [9, 0.54], [12, 0.66], [16, 0.78], [19, 0.98]];
    for (const [s, dt] of tune) {
      this.tone({ type: 'triangle', freq: midiToHz(k + s), at: at + dt, dur: 0.22, vol: 0.12, reverb: 0.35 });
      this.tone({ freq: midiToHz(k + s + 12), at: at + dt, dur: 0.12, vol: 0.04 });
    }
    for (const s of [0, 4, 7, 12]) this.bell(midiToHz(k + 12 + s), at + 0.98, { vol: 0.07, dur: 1.4, reverb: 0.7 });
    this.tone({ type: 'triangle', freq: midiToHz(k - 24), at: at + 0.98, dur: 1.2, vol: 0.15 });
  }

  // ---------- animal voices ----------

  voice(kind, { at = this.now, vol = 1 } = {}) {
    const p = rand(0.95, 1.05);
    const v = vol;
    switch (kind) {
      case 'puppy':
        for (const [dt, m] of [[0, 1], [0.17, 1.06]]) {
          this.tone({ type: 'sawtooth', freq: 560 * p * m, to: 300 * p, glide: 0.09, at: at + dt, dur: 0.11, vol: 0.28 * v, filter: { type: 'bandpass', freq: 1150, q: 1.3 } });
          this.hiss({ at: at + dt, dur: 0.05, vol: 0.08 * v, filter: { freq: 1600, q: 1 } });
        }
        break;
      case 'frog':
        this.tone({ type: 'square', freq: 150 * p, to: 200 * p, at, dur: 0.12, vol: 0.2 * v, filter: { type: 'lowpass', freq: 900 }, am: { rate: 42, depth: 0.9 } });
        this.tone({ type: 'square', freq: 165 * p, to: 245 * p, at: at + 0.17, dur: 0.15, vol: 0.2 * v, filter: { type: 'lowpass', freq: 900 }, am: { rate: 42, depth: 0.9 } });
        break;
      case 'duck':
        for (const [dt, m] of [[0, 1], [0.2, 0.94]]) {
          this.tone({ type: 'sawtooth', freq: 620 * p * m, to: 470 * p * m, at: at + dt, dur: 0.15, vol: 0.3 * v, filter: { type: 'bandpass', freq: 1300, to: 800, q: 4 }, am: { rate: 50, depth: 0.3 } });
        }
        break;
      case 'mole':
        for (let i = 0; i < 3; i++) this.hiss({ at: at + i * 0.06, dur: 0.04, vol: 0.09 * v, filter: { freq: 2100, q: 2 } });
        this.tone({ freq: 1600 * p, to: 2150 * p, at: at + 0.21, dur: 0.08, vol: 0.1 * v });
        break;
      case 'kitten':
        this.tone({ type: 'sawtooth', freq: 650 * p, points: [[0.1, 920 * p], [0.36, 610 * p]], at, dur: 0.42, vol: 0.2 * v, attack: 0.03, filter: { type: 'bandpass', freq: 1500, to: 900, q: 2 }, vibrato: { rate: 7, depth: 10 } });
        break;
      case 'bunny':
        this.tone({ freq: 120, to: 60, at, dur: 0.08, vol: 0.25 * v });
        this.tone({ freq: 120, to: 60, at: at + 0.12, dur: 0.08, vol: 0.25 * v });
        this.tone({ freq: 2200 * p, to: 2650 * p, at: at + 0.28, dur: 0.06, vol: 0.06 * v });
        break;
      case 'piglet':
        for (const [dt, m] of [[0, 1], [0.19, 0.92]]) {
          this.tone({ type: 'sawtooth', freq: 260 * p * m, to: 195 * p * m, at: at + dt, dur: 0.13, vol: 0.3 * v, filter: { type: 'lowpass', freq: 900, q: 6 }, am: { rate: 30, depth: 0.5 } });
        }
        break;
      case 'chick':
        for (let i = 0; i < 3; i++) this.tone({ freq: 2600 * p, to: 3400 * p, at: at + i * 0.1, dur: 0.06, vol: 0.09 * v });
        break;
      case 'hamster':
        this.tone({ freq: 1900 * p, to: 2400 * p, at, dur: 0.14, vol: 0.09 * v, vibrato: { rate: 30, depth: 80 } });
        this.tone({ freq: 2100 * p, to: 2500 * p, at: at + 0.18, dur: 0.08, vol: 0.08 * v });
        break;
      case 'lamb':
        this.tone({ type: 'sawtooth', freq: 330 * p, to: 295 * p, at, dur: 0.55, vol: 0.22 * v, attack: 0.03, filter: { type: 'bandpass', freq: 1000, q: 2 }, vibrato: { rate: 9, depth: 14 } });
        break;
      case 'fox':
        for (const dt of [0, 0.18]) {
          this.tone({ type: 'triangle', freq: 800 * p, points: [[0.05, 1400 * p], [0.12, 700 * p]], at: at + dt, dur: 0.13, vol: 0.18 * v });
        }
        break;
      case 'panda':
        this.tone({ type: 'triangle', freq: 240 * p, to: 210 * p, at, dur: 0.3, vol: 0.24 * v, filter: { type: 'lowpass', freq: 800 }, vibrato: { rate: 5, depth: 6 } });
        this.tone({ type: 'triangle', freq: 200 * p, to: 170 * p, at: at + 0.33, dur: 0.2, vol: 0.18 * v, filter: { type: 'lowpass', freq: 700 } });
        break;
    }
  }

  // ---------- ability stingers ----------

  stinger(ability, at = this.now) {
    const k = this.key + 12;
    switch (ability) {
      case 'push':
        for (const [s, dt, v] of [[0, 0, 0.18], [0, 0.16, 0.18], [7, 0.32, 0.26]]) {
          this.tone({ type: 'sawtooth', freq: midiToHz(k - 12 + s), at: at + dt, dur: 0.2, vol: v, filter: { type: 'lowpass', freq: 700 } });
          this.tone({ freq: midiToHz(k - 24 + s), at: at + dt, dur: 0.18, vol: v });
        }
        break;
      case 'hop':
        [0, 2, 4, 7, 9, 12].forEach((s, i) => {
          const f = midiToHz(k + s);
          this.tone({ freq: f * 0.7, to: f, glide: 0.05, at: at + i * 0.07, dur: 0.12, vol: 0.13 });
        });
        break;
      case 'swim':
        this.tone({ freq: midiToHz(k), to: midiToHz(k + 24), glide: 0.45, at, dur: 0.5, vol: 0.1, vibrato: { rate: 8, depth: 12 }, reverb: 0.4 });
        for (let i = 0; i < 5; i++) {
          const f = rand(500, 900);
          this.tone({ freq: f, to: f * 1.8, at: at + 0.1 + i * 0.08, dur: 0.05, vol: 0.06 });
        }
        break;
      case 'dig':
        [0, 0.09, 0.18, 0.3].forEach((dt, i) => {
          this.tone({ freq: i % 2 ? 820 : 1050, at: at + dt, dur: 0.05, vol: 0.14 });
          this.hiss({ at: at + dt, dur: 0.04, vol: 0.06, filter: { freq: 3000, q: 1.5 } });
        });
        break;
    }
    // Shared "you got it" chord.
    for (const s of [0, 4, 7, 12]) this.bell(midiToHz(k + 12 + s), at + 0.5, { vol: 0.08, dur: 1.3, reverb: 0.6 });
    this.tone({ type: 'triangle', freq: midiToHz(k - 12), at: at + 0.5, dur: 1, vol: 0.14 });
  }
}
