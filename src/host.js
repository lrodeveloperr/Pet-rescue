// YouTube Playables SDK wrapper. Outside YouTube every call falls back to the browser.
const yt = typeof window !== 'undefined' ? window.ytgame : undefined;
export const inPlayables = Boolean(yt && yt.IN_PLAYABLES_ENV);

const SAVE_KEY = 'pet-rescue-progress-v1';
const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
// ?fakeads shows a stand-in ad outside YouTube for testing; ?fakeads=decline simulates a skipped
// reward and ?fakeads=nofill an ad that cannot be shown.
const fakeAds = params.has('fakeads') ? params.get('fakeads') || 'accept' : null;

function safe(fn, fallback) {
  try {
    return fn();
  } catch (err) {
    console.warn(err);
    return fallback;
  }
}

export function firstFrameReady() {
  if (inPlayables) safe(() => yt.game.firstFrameReady());
}

export function gameReady() {
  if (inPlayables) safe(() => yt.game.gameReady());
}

export async function loadData() {
  if (inPlayables) return (await yt.game.loadData()) || '';
  return safe(() => window.localStorage.getItem(SAVE_KEY), '') || '';
}

export async function saveData(text) {
  if (inPlayables) return yt.game.saveData(text);
  window.localStorage.setItem(SAVE_KEY, text);
}

export function sendScore(value) {
  if (inPlayables) safe(() => yt.engagement.sendScore({ value }));
}

export function isAudioEnabled() {
  return inPlayables ? safe(() => yt.system.isAudioEnabled(), true) : true;
}

export function onAudioEnabledChange(cb) {
  if (inPlayables) safe(() => yt.system.onAudioEnabledChange(cb));
}

export function onPause(cb) {
  if (inPlayables) safe(() => yt.system.onPause(cb));
  document.addEventListener('visibilitychange', () => document.hidden && cb());
}

export function onResume(cb) {
  if (inPlayables) safe(() => yt.system.onResume(cb));
  document.addEventListener('visibilitychange', () => !document.hidden && cb());
}

export async function language() {
  if (inPlayables) {
    const lang = await safe(() => yt.system.getLanguage(), null);
    if (lang) return lang;
  }
  return navigator.language || 'en';
}

// Haptics are optional and can be switched off in the pause menu (a Playables requirement).
export const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
let hapticsOn = true;

export function setHaptics(on) {
  hapticsOn = on;
}

/** A short haptic tap where the device and frame allow it; silently does nothing otherwise. */
export function vibrate(pattern) {
  if (hapticsOn && canVibrate) safe(() => navigator.vibrate(pattern));
}

/** Clipboard sharing is offered only where the browser exposes it. */
export const canCopy = typeof navigator !== 'undefined' && Boolean(navigator.clipboard?.writeText) && (typeof window === 'undefined' || window.isSecureContext !== false);

export async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

export function logError() {
  if (inPlayables) safe(() => yt.health.logError());
}

// ---------- ads ----------

export function adsAvailable() {
  return (inPlayables && Boolean(yt.ads)) || Boolean(fakeAds);
}

export async function requestInterstitialAd() {
  if (inPlayables && yt.ads?.requestInterstitialAd) return yt.ads.requestInterstitialAd();
  if (fakeAds) return fakeAd('interstitial');
  return undefined;
}

export async function requestRewardedAd(rewardId) {
  if (inPlayables && yt.ads?.requestRewardedAd) return yt.ads.requestRewardedAd(rewardId);
  if (fakeAds) return fakeAd('rewarded');
  return false;
}

function fakeAd(kind) {
  if (fakeAds === 'nofill') return Promise.reject(new Error('no fill (test)'));
  return new Promise((resolve) => {
    const box = document.createElement('div');
    box.className = 'fake-ad';
    box.dataset.kind = kind;
    box.textContent = `TEST AD (${kind})`;
    document.body.append(box);
    setTimeout(() => {
      box.remove();
      resolve(kind === 'rewarded' ? fakeAds !== 'decline' : undefined);
    }, Number(params.get('fakeadms') || 1500));
  });
}
