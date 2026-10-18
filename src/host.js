// YouTube Playables SDK wrapper. Outside YouTube every call falls back to the browser.
const yt = typeof window !== 'undefined' ? window.ytgame : undefined;
export const inPlayables = Boolean(yt && yt.IN_PLAYABLES_ENV);

const SAVE_KEY = 'pet-rescue-progress-v1';

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

export function logError() {
  if (inPlayables) safe(() => yt.health.logError());
}
