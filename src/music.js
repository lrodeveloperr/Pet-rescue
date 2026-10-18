// Procedural background music: a looping marimba tune over bass, pad and light percussion.
// Each level gets its own key and seeded melody; intensity follows the action:
//   0 calm (idle, menus, after a win)   1 exploring   2 escaping with the rescued pet.
import { midiToHz } from './sound.js';

const BPM = 104;
const STEP = 60 / BPM / 4; // sixteenth note
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MAJ = [0, 4, 7];
const MIN = [0, 3, 7];
// Eight-bar form: A then B. [root semitone, quality]
const PROGRESSION = [
  [0, MAJ], [9, MIN], [5, MAJ], [7, MAJ],
  [5, MAJ], [7, MAJ], [4, MIN], [0, MAJ],
];
const RHYTHMS = [
  [0, 3, 6, 8, 10, 12],
  [0, 2, 4, 8, 11, 14],
  [0, 4, 6, 8, 12, 14],
  [0, 3, 4, 8, 10, 12, 14],
  [0, 6, 8, 10, 12],
];
const LEVEL_KEYS = [0, 5, -3, 2, 7, -2, 4, -5, 3, -4, 1, 6];

function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export class Music {
  constructor(engine) {
    this.e = engine;
    this.ctx = engine.ctx;
    this.out = this.ctx.createGain();
    this.muffle = this.ctx.createBiquadFilter();
    this.muffle.type = 'lowpass';
    this.muffle.frequency.value = 18000;
    this.out.connect(this.muffle).connect(engine.musicBus);
    this.intensity = 1;
    this.step = 0;
    this.next = 0;
    this.timer = null;
    this.setLevel(0);
  }

  setLevel(index) {
    this.key = 60 + LEVEL_KEYS[index % LEVEL_KEYS.length];
    this.e.key = this.key;
    this.melody = this.compose(index * 7919 + 13);
  }

  /** Eight bars of melody: rhythm from a template, pitches by a stepwise walk that lands on chord tones. */
  compose(seed) {
    const r = seeded(seed);
    const bars = [];
    let degree = 7 + Math.floor(r() * 3);
    const motif = RHYTHMS[Math.floor(r() * RHYTHMS.length)];
    for (let bar = 0; bar < PROGRESSION.length; bar++) {
      const [root, quality] = PROGRESSION[bar];
      const chordTones = quality.map((q) => (root + q) % 12);
      // Repeat the opening motif on bars 0 and 4 so the tune is memorable.
      const rhythm = bar % 4 === 0 ? motif : RHYTHMS[Math.floor(r() * RHYTHMS.length)];
      const notes = [];
      const last = bar === 3 || bar === 7;
      for (const s of rhythm) {
        if (last && s > 8) break;
        degree += [-2, -1, -1, 1, 1, 2, 0][Math.floor(r() * 7)];
        degree = Math.max(3, Math.min(13, degree));
        let semis = 12 * Math.floor(degree / 7) + MAJOR[((degree % 7) + 7) % 7];
        if (s % 4 === 0 || last) {
          // Strong beats snap to the nearest chord tone.
          let best = semis;
          let bestDist = 99;
          for (let d = -3; d <= 3; d++) {
            if (chordTones.includes((((semis + d) % 12) + 12) % 12) && Math.abs(d) < bestDist) {
              best = semis + d;
              bestDist = Math.abs(d);
            }
          }
          semis = best;
        }
        notes.push({ step: s, semis, len: last && s === 8 ? 8 : 2 });
      }
      bars.push(notes);
    }
    return bars;
  }

  setIntensity(n) {
    this.intensity = n;
  }

  setMuffled(on) {
    const f = this.muffle.frequency;
    f.cancelScheduledValues(this.ctx.currentTime);
    f.setTargetAtTime(on ? 650 : 18000, this.ctx.currentTime, 0.15);
  }

  /** Briefly lower the music under a jingle. */
  duck(seconds = 1.6) {
    const g = this.out.gain;
    const t = this.ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(0.25, t, 0.05);
    g.setTargetAtTime(1, t + seconds, 0.4);
  }

  start() {
    if (this.timer) return;
    this.next = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.tick(), 25);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
  }

  tick() {
    const now = this.ctx.currentTime;
    if (this.next < now - 0.2) this.next = now + 0.05;
    while (this.next < now + 0.15) {
      this.schedule(this.step, this.next);
      this.next += STEP;
      this.step++;
    }
  }

  /** Schedule several bars directly (offline rendering). */
  render(bars, at = 0, fromBar = 0) {
    for (let i = 0; i < bars * 16; i++) this.schedule(fromBar * 16 + i, at + i * STEP);
    return bars * 16 * STEP;
  }

  schedule(step, t) {
    const e = this.e;
    const dest = this.out;
    const level = this.intensity;
    const s = step % 16;
    const bar = Math.floor(step / 16) % PROGRESSION.length;
    const [root, quality] = PROGRESSION[bar];
    const k = this.key;

    // Pad: soft sustained chord each bar.
    if (s === 0) {
      for (const q of quality) {
        e.tone({ type: 'triangle', freq: midiToHz(k + root + q), at: t, dur: STEP * 16, vol: level === 2 ? 0.025 : 0.04, attack: 0.4, hold: STEP * 10, dest, detune: -6 });
        e.tone({ type: 'triangle', freq: midiToHz(k + root + q), at: t, dur: STEP * 16, vol: level === 2 ? 0.02 : 0.03, attack: 0.4, hold: STEP * 10, dest, detune: 7 });
      }
    }

    // Bass.
    const bassVol = level === 0 ? 0.12 : 0.2;
    const bassAt = { 0: 0, 8: 0, 12: 12, 6: 7, 14: 7 };
    if (s in bassAt && (s === 0 || s === 8 || level >= 1)) {
      const f = midiToHz(k - 24 + root + bassAt[s]);
      e.tone({ type: 'triangle', freq: f, at: t, dur: 0.32, vol: bassVol, dest });
      e.tone({ freq: f / 2, at: t, dur: 0.25, vol: bassVol * 0.6, dest });
    }

    // Offbeat chord plucks.
    if (level >= 1 && (s === 4 || s === 12)) {
      for (const q of quality) {
        e.tone({ type: 'triangle', freq: midiToHz(k + 12 + root + q), at: t, dur: 0.16, vol: 0.035, dest, filter: { type: 'lowpass', freq: 2200 } });
      }
    }

    // Melody on marimba.
    for (const n of this.melody[bar]) {
      if (n.step !== s) continue;
      if (level === 0 && s % 4 !== 0) continue;
      const f = midiToHz(k + n.semis);
      const vol = level === 0 ? 0.07 : 0.1;
      e.tone({ freq: f, at: t, dur: n.len === 8 ? 0.9 : 0.4, vol, dest, reverb: 0.25 });
      e.tone({ freq: f * 4, at: t, dur: 0.05, vol: vol * 0.25, dest });
      if (level === 2 && s % 4 === 0) e.tone({ freq: f * 2, at: t + STEP * 2, dur: 0.2, vol: vol * 0.35, dest, reverb: 0.25 });
    }

    // Percussion.
    if (level >= 1 && s % 2 === 0) {
      e.hiss({ at: t, dur: 0.03, vol: s % 4 === 2 ? 0.05 : 0.03, filter: { type: 'highpass', freq: 6500 }, dest });
    }
    if ((level === 2 && (s === 0 || s === 8)) || (level === 1 && s === 0)) {
      e.tone({ freq: 125, to: 45, at: t, dur: 0.18, vol: level === 2 ? 0.32 : 0.2, dest });
    }
    if (level === 2 && (s === 4 || s === 12)) {
      e.hiss({ at: t, dur: 0.08, vol: 0.07, filter: { freq: 1600, q: 1 }, dest });
    }
  }
}
