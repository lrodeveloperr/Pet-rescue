// Progress, streak, ad-cap and localisation rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FREEZE_CAP,
  STREAK_HATS,
  STAR_HATS,
  addVariant,
  countRewarded,
  dailyCalendar,
  dayKey,
  emptyProgress,
  hatRequirement,
  liveStreak,
  migrate,
  msToNextDay,
  newlyEarnedHats,
  recordDaily,
  rewardedToday,
  starsFor,
  totalStars,
  variantCount,
  weekKey,
} from '../src/progress.js';
import { AD_POLICY, Ads } from '../src/ads.js';
import { LANGUAGES } from '../src/i18n.js';
import { ALL_ANIMALS } from '../src/species.js';
import { HATS } from '../src/models.js';
import { DECORATIONS } from '../src/garden.js';

const DAY = 86400000;
const T0 = Date.UTC(2026, 9, 18, 12); // a Sunday

test('version 2 saves migrate, and the removed master sound setting is ignored', () => {
  const raw = JSON.stringify({ v: 2, owned: ['puppy'], stars: { 'meadow-1': 3, gone: 2 }, skipped: [], rescued: { kitten: 2 }, hats: { unlocked: ['crown'], worn: 'crown' }, daily: { last: '2026-10-17', streak: 4, best: 6, done: 9 }, sound: false, music: false });
  const p = migrate(raw, ['meadow-1']);
  assert.equal(p.v, 3);
  assert.deepEqual(p.stars, { 'meadow-1': 3 });
  assert.equal('sound' in p, false);
  assert.equal(p.music, false);
  assert.equal(p.hats.worn, 'crown');
  assert.equal(p.daily.streak, 4);
  assert.equal(p.daily.freezes, 0);
  assert.equal(p.variants.kitten, 1, 'rescued species have their first look');
});

test('version 1 saves migrate', () => {
  const p = migrate(JSON.stringify({ done: [1, 2] }), ['meadow-1', 'meadow-2']);
  assert.deepEqual(p.stars, { 'meadow-1': 2, 'meadow-2': 2 });
});

test('a worn hat must be unlocked; unknown saved fields are dropped', () => {
  const p = migrate(JSON.stringify({ v: 3, hats: { unlocked: [], worn: 'wizard' }, ads: { day: 5 } }), []);
  assert.equal(p.hats.worn, null);
  assert.deepEqual(p.ads, { day: null, rewarded: 0 });
});

test('streak grows on consecutive days and restarts after a gap without freezes', () => {
  const p = emptyProgress();
  assert.equal(recordDaily(p, T0).streak, 1);
  assert.equal(recordDaily(p, T0 + DAY).streak, 2);
  assert.equal(recordDaily(p, T0 + DAY).streak, 2, 'same day counts once');
  p.daily.freezes = 0;
  assert.equal(liveStreak(p, T0 + 3 * DAY), 0);
  assert.equal(recordDaily(p, T0 + 3 * DAY).streak, 1);
  assert.equal(p.daily.best, 2, 'best streak is kept');
});

test('freezes are earned every three dailies, capped, and cover missed days automatically', () => {
  const p = emptyProgress();
  for (let d = 0; d < 3; d++) recordDaily(p, T0 + d * DAY);
  assert.equal(p.daily.freezes, 1);
  for (let d = 3; d < 12; d++) recordDaily(p, T0 + d * DAY);
  assert.equal(p.daily.freezes, FREEZE_CAP);
  assert.equal(p.daily.streak, 12);
  // Miss two days: still alive, and both freezes are used when the player returns.
  assert.equal(liveStreak(p, T0 + 14 * DAY), 12);
  const r = recordDaily(p, T0 + 14 * DAY);
  assert.equal(r.froze, 2);
  assert.equal(r.streak, 13);
  assert.equal(p.daily.freezes, 0);
  assert.equal(p.daily.history[dayKey(T0 + 12 * DAY)], 'f');
  assert.equal(p.daily.history[dayKey(T0 + 14 * DAY)], 's');
});

test('a gap longer than the freezes restarts the streak and keeps the freezes', () => {
  const p = emptyProgress();
  for (let d = 0; d < 3; d++) recordDaily(p, T0 + d * DAY);
  assert.equal(p.daily.freezes, 1);
  const r = recordDaily(p, T0 + 6 * DAY);
  assert.equal(r.streak, 1);
  assert.equal(r.froze, 0);
  assert.equal(p.daily.freezes, 1);
});

test('the calendar lists 28 days ending today', () => {
  const p = emptyProgress();
  recordDaily(p, T0);
  const cells = dailyCalendar(p, T0);
  assert.equal(cells.length, 28);
  assert.equal(cells.at(-1).today, true);
  assert.equal(cells.at(-1).mark, 's');
  assert.equal(cells[0].mark, '');
});

test('countdown and week keys', () => {
  assert.equal(msToNextDay(Date.UTC(2026, 0, 1, 23, 0)), 3600000);
  assert.equal(weekKey(T0), '2026-W42');
  assert.equal(weekKey(Date.UTC(2026, 0, 1)), '2026-W01');
  assert.equal(weekKey(Date.UTC(2027, 0, 1)), '2026-W53');
});

test('streak milestones go to 100 days and every hat says how it is earned', () => {
  assert.deepEqual(Object.values(STREAK_HATS), [3, 7, 14, 21, 30, 50, 100]);
  for (const h of HATS) assert.ok(hatRequirement(h), h);
  const p = emptyProgress();
  p.daily.best = 30;
  assert.deepEqual(newlyEarnedHats(p).filter((h) => h in STREAK_HATS), ['bow', 'viking', 'propeller', 'sunhat', 'antlers']);
});

test('all twelve decorations are reachable with mostly 2-star play', () => {
  // 300 levels at 2 stars each, plus nothing else.
  assert.ok(DECORATIONS.at(-1).stars <= 600);
  assert.ok(Math.max(...Object.values(STAR_HATS)) <= 600);
});

test('stars count campaign, daily, weekly and encore wins', () => {
  const p = emptyProgress();
  p.stars = { a: 3, b: 2 };
  p.daily.done = 4;
  p.weeklyStars = 2;
  p.encore = 1;
  assert.equal(totalStars(p), 12);
  assert.equal(starsFor(10, 10), 3);
  assert.equal(starsFor(14, 10), 2);
  assert.equal(starsFor(40, 10), 1);
});

test('variants and the daily rewarded counter', () => {
  const p = emptyProgress();
  assert.equal(addVariant(p, 'otter', 2), true);
  assert.equal(addVariant(p, 'otter', 2), false);
  assert.equal(variantCount(p), 1);
  countRewarded(p, T0);
  countRewarded(p, T0);
  assert.equal(rewardedToday(p, T0), 2);
  assert.equal(rewardedToday(p, T0 + DAY), 0);
});

// ---------- ads ----------

function fakeHost({ fail = false, earn = true } = {}) {
  const calls = { interstitial: 0, rewarded: 0 };
  return {
    calls,
    adsAvailable: () => true,
    requestInterstitialAd: async () => {
      calls.interstitial++;
    },
    requestRewardedAd: async () => {
      calls.rewarded++;
      if (fail) throw new Error('no fill');
      return earn;
    },
  };
}

function clock(start = 0) {
  const c = { t: start, now: () => c.t };
  return c;
}

test('interstitials wait for the level count, the time gap and a quiet period', async () => {
  const c = clock(0);
  const api = fakeHost();
  const ads = new Ads(c.now, null, api);
  const p = AD_POLICY.interstitial;
  for (let k = 0; k < p.everyLevels; k++) ads.levelCompleted();
  assert.equal(await ads.maybeInterstitial(p.minCompletedLevels), false, 'first one waits minSeconds');
  c.t += p.minSeconds * 1000;
  for (let k = 0; k < p.everyLevels; k++) ads.levelCompleted();
  assert.equal(await ads.maybeInterstitial(p.minCompletedLevels - 1), false, 'not during the first levels');
  assert.equal(await ads.maybeInterstitial(p.minCompletedLevels), true);
  assert.equal(api.calls.interstitial, 1);
});

test('no interstitial at the break after a rewarded view, or after a struggle', async () => {
  const c = clock(0);
  const ads = new Ads(c.now, null, fakeHost());
  c.t = 10 * 60 * 1000;
  for (let k = 0; k < 9; k++) ads.levelCompleted();
  assert.equal(await ads.maybeInterstitial(20, { struggled: true }), false);
  assert.equal(await ads.rewarded('x'), 'earned');
  c.t += 10 * 60 * 1000;
  assert.equal(await ads.maybeInterstitial(20), false, 'the break after a rewarded view');
  assert.equal(await ads.maybeInterstitial(20), true, 'the next break may show one');
});

test('rewarded ads stop for the session after repeated no-fill', async () => {
  const ads = new Ads(() => 0, null, fakeHost({ fail: true }));
  assert.equal(await ads.rewarded('x'), 'unavailable');
  assert.equal(ads.rewardedAvailable, true);
  assert.equal(await ads.rewarded('x'), 'unavailable');
  assert.equal(ads.rewardedAvailable, false);
  assert.equal(await ads.rewarded('x'), 'unavailable');
});

test('declined rewarded ads give nothing; the daily cap hides offers', async () => {
  const counter = { n: 0, today() { return this.n; }, add() { this.n++; } };
  const ads = new Ads(() => 0, counter, fakeHost({ earn: false }));
  assert.equal(await ads.rewarded('x'), 'declined');
  counter.n = AD_POLICY.rewarded.dailyCap;
  assert.equal(ads.rewardedAvailable, false);
  assert.equal(await ads.rewarded('x'), 'unavailable');
});

// ---------- localisation ----------

test('every language defines every string, including animal and hat names', () => {
  const keys = Object.keys(LANGUAGES.en);
  for (const kind of ALL_ANIMALS) assert.ok(keys.includes(`a_${kind}`), kind);
  for (const h of HATS) assert.ok(keys.includes(`h_${h}`), h);
  for (const m of ['current', 'ice', 'gate', 'bridge', 'burrow', 'bees']) assert.ok(keys.includes(`m_${m}`), m);
  for (const [lang, table] of Object.entries(LANGUAGES)) {
    const missing = keys.filter((k) => !(k in table));
    assert.deepEqual(missing, [], lang);
  }
});
