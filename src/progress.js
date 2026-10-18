// Saved progress (version 3): stars per level, rescues and variants, hats, daily streak with
// freezes and history, garden layout, ad counters and settings.
// Pure data helpers; the Game decides when to load and save.
import { COMPANIONS } from './logic.js';
import { HATS } from './models.js';

export const STAR_HATS = { party: 0, crown: 30, flowers: 60, beanie: 90, cowboy: 130, tophat: 180, chef: 240, pirate: 300, wizard: 380 };
export const STREAK_HATS = { bow: 3, viking: 7, propeller: 14, sunhat: 21, antlers: 30, astronaut: 50, unicorn: 100 };

// Streak freezes: earned free, one per FREEZE_EVERY dailies, never more than FREEZE_CAP.
export const FREEZE_EVERY = 3;
export const FREEZE_CAP = 2;
const HISTORY_DAYS = 35;
const DAY = 86400000;

// Each species has three looks; the album collects all of them.
export const VARIANTS = 3;

export function emptyProgress() {
  return {
    v: 3,
    owned: [],
    stars: {},
    skipped: [],
    rescued: {},
    variants: {},
    hats: { unlocked: ['party'], worn: null },
    petHats: {},
    garden: {},
    daily: { last: null, streak: 0, best: 0, done: 0, freezes: 0, toward: 0, history: {}, bonusDate: null, bonusCount: 0 },
    weekly: { week: null, done: [] },
    weeklyStars: 0,
    encore: 0,
    seen: [],
    worldsDone: [],
    ads: { day: null, rewarded: 0 },
    music: true,
    haptics: true,
  };
}

const count = (n) => Math.max(0, n | 0);

/** Accepts version 1, 2 or 3 save text (or nothing) and returns clean version 3 progress. */
export function migrate(raw, levelIds) {
  const p = emptyProgress();
  if (!raw) return p;
  const data = JSON.parse(raw);
  const known = new Set(levelIds);
  p.owned = COMPANIONS.filter((c) => Array.isArray(data.owned) && data.owned.includes(c));
  // The master sound setting was removed (YouTube owns muting); only music remains.
  p.music = data.music !== false;
  p.haptics = data.haptics !== false;
  if (data.v >= 2) {
    for (const [id, n] of Object.entries(data.stars ?? {})) if (known.has(id)) p.stars[id] = Math.max(0, Math.min(3, n | 0));
    p.skipped = (data.skipped ?? []).filter((id) => known.has(id) && !(id in p.stars));
    for (const [k, n] of Object.entries(data.rescued ?? {})) p.rescued[k] = count(n);
    for (const [k, n] of Object.entries(data.variants ?? {})) p.variants[k] = (n | 0) & ((1 << VARIANTS) - 1);
    p.hats.unlocked = HATS.filter((h) => h === 'party' || data.hats?.unlocked?.includes(h));
    p.hats.worn = p.hats.unlocked.includes(data.hats?.worn) ? data.hats.worn : null;
    for (const [k, h] of Object.entries(data.petHats ?? {})) if (p.hats.unlocked.includes(h)) p.petHats[k] = h;
    for (const [k, i] of Object.entries(data.garden ?? {})) if (Number.isInteger(i)) p.garden[k] = i;
    const d = data.daily ?? {};
    Object.assign(p.daily, {
      last: typeof d.last === 'string' ? d.last : null,
      streak: count(d.streak),
      best: count(d.best),
      done: count(d.done),
      freezes: Math.min(FREEZE_CAP, count(d.freezes)),
      toward: count(d.toward) % FREEZE_EVERY,
      history: typeof d.history === 'object' && d.history ? { ...d.history } : {},
      bonusDate: typeof d.bonusDate === 'string' ? d.bonusDate : null,
      bonusCount: count(d.bonusCount),
    });
    if (data.weekly && typeof data.weekly.week === 'string') p.weekly = { week: data.weekly.week, done: (data.weekly.done ?? []).filter(Number.isInteger) };
    p.weeklyStars = count(data.weeklyStars);
    p.encore = count(data.encore);
    p.seen = Array.isArray(data.seen) ? data.seen.filter((x) => typeof x === 'string') : [];
    p.worldsDone = Array.isArray(data.worldsDone) ? data.worldsDone.filter(Number.isInteger) : [];
    if (data.ads && typeof data.ads.day === 'string') p.ads = { day: data.ads.day, rewarded: count(data.ads.rewarded) };
  } else if (Array.isArray(data.done)) {
    // Version 1 stored completed hand-made level numbers 1..12.
    for (const n of data.done) {
      const id = `meadow-${n}`;
      if (known.has(id)) p.stars[id] = 2;
    }
  }
  // Every rescued species has at least its first look.
  for (const [k, n] of Object.entries(p.rescued)) if (n > 0) p.variants[k] |= 1;
  return p;
}

export function totalStars(p) {
  return Object.values(p.stars).reduce((a, b) => a + b, 0) + (p.daily.done ?? 0) + (p.weeklyStars ?? 0) + (p.encore ?? 0);
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

/** How a hat is earned: { stars: n } or { streak: n }. */
export function hatRequirement(hat) {
  if (hat in STAR_HATS) return { stars: STAR_HATS[hat] };
  if (hat in STREAK_HATS) return { streak: STREAK_HATS[hat] };
  return null;
}

export function dayKey(time = Date.now()) {
  return new Date(time).toISOString().slice(0, 10);
}

export function dayNumber(time = Date.now()) {
  return Math.floor(time / DAY);
}

const keyDay = (key) => Math.floor(Date.parse(`${key}T00:00:00Z`) / DAY);

/** Days missed since the last daily, not counting today. */
function missedDays(d, time) {
  if (!d.last) return Infinity;
  return dayNumber(time) - keyDay(d.last) - 1;
}

/**
 * Record today's daily puzzle. Missed days are covered by freezes if there are enough,
 * otherwise the streak starts again at 1 (the best streak is kept).
 * Returns { streak, froze, earnedFreeze }.
 */
export function recordDaily(p, time = Date.now()) {
  const d = p.daily;
  const today = dayKey(time);
  if (d.last === today) return { streak: d.streak, froze: 0, earnedFreeze: false };
  const missed = missedDays(d, time);
  let froze = 0;
  if (missed === 0) d.streak++;
  else if (missed > 0 && missed <= d.freezes) {
    froze = missed;
    d.freezes -= missed;
    for (let k = 1; k <= missed; k++) d.history[dayKey(time - k * DAY)] = 'f';
    d.streak++;
  } else d.streak = 1;
  d.best = Math.max(d.best ?? 0, d.streak);
  d.last = today;
  d.done = (d.done ?? 0) + 1;
  d.history[today] = 's';
  // Keep only recent history.
  const oldest = dayKey(time - HISTORY_DAYS * DAY);
  for (const k of Object.keys(d.history)) if (k < oldest) delete d.history[k];
  let earnedFreeze = false;
  d.toward = (d.toward ?? 0) + 1;
  if (d.toward >= FREEZE_EVERY) {
    d.toward = 0;
    if (d.freezes < FREEZE_CAP) {
      d.freezes++;
      earnedFreeze = true;
    }
  }
  return { streak: d.streak, froze, earnedFreeze };
}

/** The streak as it stands today: kept while freezes can still cover the missed days. */
export function liveStreak(p, time = Date.now()) {
  const d = p.daily;
  const missed = missedDays(d, time);
  if (missed <= 0 || missed <= d.freezes) return d.streak;
  return 0;
}

/** Calendar cells for the last `days` days, oldest first: 's' solved, 'f' frozen, '' missed. */
export function dailyCalendar(p, time = Date.now(), days = 28) {
  const cells = [];
  for (let k = days - 1; k >= 0; k--) {
    const key = dayKey(time - k * DAY);
    cells.push({ key, mark: p.daily.history[key] ?? '', today: k === 0 });
  }
  return cells;
}

/** Milliseconds until the next UTC midnight, when the next daily puzzle appears. */
export function msToNextDay(time = Date.now()) {
  return (dayNumber(time) + 1) * DAY - time;
}

/** ISO week key such as "2026-W42" (weeks start on Monday, UTC). */
export function weekKey(time = Date.now()) {
  const d = new Date(time);
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((date - yearStart) / DAY + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** A running week number, for picking each week's puzzles. */
export function weekNumber(time = Date.now()) {
  // Day 4 of the Unix epoch was a Monday.
  return Math.floor((dayNumber(time) - 4) / 7);
}

/** Today's count of rewarded ads watched (it resets each UTC day). */
export function rewardedToday(p, time = Date.now()) {
  return p.ads.day === dayKey(time) ? p.ads.rewarded : 0;
}

export function countRewarded(p, time = Date.now()) {
  const today = dayKey(time);
  if (p.ads.day !== today) p.ads = { day: today, rewarded: 0 };
  p.ads.rewarded++;
}

export function hasVariant(p, kind, v) {
  return Boolean((p.variants[kind] ?? 0) & (1 << v));
}

export function addVariant(p, kind, v) {
  const before = p.variants[kind] ?? 0;
  p.variants[kind] = before | (1 << v);
  return p.variants[kind] !== before;
}

export function variantCount(p) {
  let n = 0;
  for (const mask of Object.values(p.variants)) for (let v = 0; v < VARIANTS; v++) if (mask & (1 << v)) n++;
  return n;
}
