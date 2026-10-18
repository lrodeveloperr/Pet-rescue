// Renders every sound and some music offline in headless Chromium through the game's own
// SoundEngine, checks for silence, clipping and NaN, and writes a listenable WAV preview.
import { mkdirSync, writeFileSync } from 'node:fs';
import { preview } from 'vite';
import { chromium } from 'playwright-core';

const OUT = new URL('../screenshots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const server = await preview({ preview: { port: 4174, strictPort: true }, logLevel: 'silent' });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
await page.route('https://www.youtube.com/**', (r) => r.abort());
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:4174/?debug');
await page.waitForFunction(() => window.__petRescue?.SoundEngine);

const result = await page.evaluate(async () => {
  const { SoundEngine, Music } = window.__petRescue;
  const sr = 32000;
  const ctx = new OfflineAudioContext(2, sr * 100, sr);
  const e = new SoundEngine(ctx);
  const m = new Music(e);
  m.setLevel(0);
  const segments = [];
  let t = 0.3;
  const mark = (name, len, fn) => {
    fn(t);
    segments.push({ name, start: t, end: t + len });
    t += len + 0.25;
  };
  mark('footsteps on grass', 0.8, (t) => { for (let i = 0; i < 4; i++) e.step('.', { at: t + i * 0.18 }); });
  mark('footsteps on dug earth', 0.8, (t) => { for (let i = 0; i < 4; i++) e.step(',', { at: t + i * 0.18 }); });
  mark('footsteps on stone', 0.8, (t) => { for (let i = 0; i < 4; i++) e.step('=', { at: t + i * 0.18 }); });
  mark('swimming', 0.75, (t) => { for (let i = 0; i < 3; i++) e.swim(t + i * 0.22); });
  mark('frog hop and landing', 0.5, (t) => e.hop(t));
  mark('boulder push, sinks in pond', 0.8, (t) => { e.push(t); e.sink(t + 0.18); });
  mark('boulder push, fills gap', 0.7, (t) => { e.push(t); e.fill(t + 0.18); });
  mark('mole digs hedge', 0.4, (t) => e.dig(t));
  mark('cage opens', 1.1, (t) => e.open(t));
  mark('tap, select, button', 0.5, (t) => { e.tap(t); e.select(t + 0.15); e.ui(t + 0.35); });
  mark('blocked move', 0.3, (t) => e.blocked(t));
  mark('undo', 0.3, (t) => e.undo(t));
  mark('level became unwinnable', 1.4, (t) => e.stuck(t));
  for (const kind of ['puppy', 'frog', 'duck', 'mole', 'kitten', 'bunny', 'piglet', 'chick', 'hamster', 'lamb', 'fox', 'panda', 'hoot', 'moo', 'neigh', 'crow', 'howl']) {
    mark(`voice: ${kind}`, 0.6, (t) => e.voice(kind, { at: t }));
  }
  for (const a of ['push', 'hop', 'swim', 'dig']) mark(`ability stinger: ${a}`, 1.9, (t) => e.stinger(a, t));
  mark('home celebration fanfare', 2.4, (t) => e.win(t));
  for (const [name, level, fromBar] of [['music: calm (idle, menus)', 0, 0], ['music: exploring', 1, 0], ['music: escaping home', 2, 4]]) {
    m.setIntensity(level);
    const len = m.render(4, t, fromBar);
    segments.push({ name, start: t, end: t + len });
    t += len + 0.4;
  }
  const buf = await ctx.startRendering();
  const L = buf.getChannelData(0);
  const R = buf.getChannelData(1);
  const end = Math.min(L.length, Math.ceil((t + 0.5) * sr));
  let nan = 0;
  let peak = 0;
  for (let i = 0; i < end; i++) {
    if (!Number.isFinite(L[i]) || !Number.isFinite(R[i])) nan++;
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  }
  for (const seg of segments) {
    let sum = 0;
    let p = 0;
    const a = Math.floor(seg.start * sr);
    const b = Math.floor(seg.end * sr);
    for (let i = a; i < b; i++) {
      const v = (L[i] + R[i]) / 2;
      sum += v * v;
      if (Math.abs(v) > p) {
        p = Math.abs(v);
        seg.peakAt = i / sr;
      }
    }
    seg.rms = Math.sqrt(sum / (b - a));
    seg.peak = p;
  }
  // 16-bit stereo WAV.
  const bytes = new ArrayBuffer(44 + end * 4);
  const dv = new DataView(bytes);
  const str = (o, s) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); dv.setUint32(4, 36 + end * 4, true); str(8, 'WAVE'); str(12, 'fmt ');
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true); dv.setUint32(24, sr, true);
  dv.setUint32(28, sr * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true); str(36, 'data'); dv.setUint32(40, end * 4, true);
  for (let i = 0; i < end; i++) {
    dv.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true);
    dv.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true);
  }
  const u8 = new Uint8Array(bytes);
  let bin = '';
  for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return { segments, peak, nan, seconds: end / sr, wav: btoa(bin) };
});

let failed = errors.length > 0;
const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
const lines = [];
for (const seg of result.segments) {
  const ok = seg.rms > 0.004 && seg.peak < 1;
  if (!ok) failed = true;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${fmt(seg.start).padStart(6)}  ${seg.name.padEnd(30)} rms ${seg.rms.toFixed(3)} peak ${seg.peak.toFixed(2)} at ${seg.peakAt.toFixed(4)}`);
  lines.push(`${fmt(seg.start)}  ${seg.name}`);
}
console.log(`${result.nan === 0 ? 'ok  ' : 'FAIL'} no NaN samples`);
console.log(`${result.peak <= 1 ? 'ok  ' : 'FAIL'} overall peak ${result.peak.toFixed(3)} (no clipping)`);
if (result.nan || result.peak > 1) failed = true;
if (errors.length) console.log(`FAIL page errors: ${errors.join('; ')}`);
writeFileSync(`${OUT}audio-preview.wav`, Buffer.from(result.wav, 'base64'));
writeFileSync(`${OUT}audio-preview.txt`, `Pet Rescue sound preview (${result.seconds.toFixed(0)} s)\n\n${lines.join('\n')}\n`);
console.log(`wrote screenshots/audio-preview.wav (${result.seconds.toFixed(0)} s) and the track list`);
await browser.close();
await new Promise((r) => server.httpServer.close(r));
process.exit(failed ? 1 : 0);
