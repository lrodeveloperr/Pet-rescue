// Saved progress (version 2): stars per level, rescues, hats, daily streak and settings.
// Pure data helpers; the Game decides when to load and save.
import { COMPANIONS } from './logic.js';
import { HATS } from './models.js';

export const STAR_HATS = { party: 0, crown: 30, flowers: 60, beanie: 90, cowboy: 130, tophat: 180, chef: 240, pirate: 300, wizard: 380 };
export const STREAK_HATS = { bow: 3, viking: 7, propeller: 14 };

export function emptyProgress() {
  return {
    v: 2,
    owned: [],
    stars: {},
    skipped: [],
    rescued: {},
    hats: { unlocked: ['party'], worn: null },
    daily: { last: null, streak: 0, best: 0, done: 0, bonusDate: null, bonusCount: 0 },
    sound: true,
    music: true,
  };
}

/** Accepts version 1 or 2 save text (or nothing) and returns clean version 2 progress. */
export function migrate(raw, levelIds) {
  const p = emptyProgress();
  if (!raw) return p;
  const data = JSON.parse(raw);
  const known = new Set(levelIds);
  p.owned = COMPANIONS.filter((c) => Array.isArray(data.owned) && data.owned.includes(c));
  p.sound = data.sound !== false;
  p.music = data.music !== false;
  if (data.v === 2) {
    for (const [id, n] of Object.entries(data.stars ?? {})) if (known.has(id)) p.stars[id] = Math.max(0, Math.min(3, n | 0));
    p.skipped = (data.skipped ?? []).filter((id) => known.has(id));
    for (const [k, n] of Object.entries(data.rescued ?? {})) p.rescued[k] = Math.max(0, n | 0);
    p.hats.unlocked = HATS.filter((h) => h === 'party' || data.hats?.unlocked?.includes(h));
    p.hats.worn = HATS.includes(data.hats?.worn) ? data.hats.worn : null;
    Object.assign(p.daily, data.daily ?? {});
  } else if (Array.isArray(data.done)) {
    // Version 1 stored completed hand-made level numbers 1..12.
    for (const n of data.done) {
      const id = `meadow-${n}`;
      if (known.has(id)) p.stars[id] = 2;
    }
  }
  return p;
}

export function totalStars(p) {
  return Object.values(p.stars).reduce((a, b) => a + b, 0) + (p.daily.done ?? 0);
}

export function starsFor(moves, par) {
  if (moves <= par) return 3;
  if (moves <= Math.ceil(par * 1.25) + 2) return 2;
  return 1;
}

/** Hats unlocked by stars and streaks that are not yet in the list. */
export function newlyEarnedHats(p) {
  const stars = totalStars(p);
  const earned = [];
  for (const [hat, need] of Object.entries(STAR_HATS)) if (stars >= need && !p.hats.unlocked.includes(hat)) earned.push(hat);
  for (const [hat, need] of Object.entries(STREAK_HATS)) if ((p.daily.best ?? 0) >= need && !p.hats.unlocked.includes(hat)) earned.push(hat);
  return earned;
}

export function dayKey(time = Date.now()) {
  return new Date(time).toISOString().slice(0, 10);
}

export function dayNumber(time = Date.now()) {
  return Math.floor(time / 86400000);
}

/** Record today's daily puzzle; returns the new streak. */
export function recordDaily(p, time = Date.now()) {
  const today = dayKey(time);
  const yesterday = dayKey(time - 86400000);
  const d = p.daily;
  if (d.last === today) return d.streak;
  d.streak = d.last === yesterday ? d.streak + 1 : 1;
  d.best = Math.max(d.best ?? 0, d.streak);
  d.last = today;
  d.done = (d.done ?? 0) + 1;
  return d.streak;
}

/** The streak as it stands today: it lapses if yesterday's puzzle was missed. */
export function liveStreak(p, time = Date.now()) {
  const d = p.daily;
  if (d.last === dayKey(time) || d.last === dayKey(time - 86400000)) return d.streak;
  return 0;
}
