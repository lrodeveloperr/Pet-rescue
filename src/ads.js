// Ad policy. Every cap lives here so it can be tuned from analytics in one place.
// Rules from the brief: ads only at natural breaks after the full escape and reunion,
// never needed to progress, no banners, no rewarded ad followed by an interstitial,
// and play continues normally if an ad fails, is declined or has no fill.
// The numbers are hypotheses; docs/AD_POLICY_LOG.md records every change and why.
import * as host from './host.js';

export const AD_POLICY = {
  interstitial: {
    minCompletedLevels: 3, // no interstitials during the first three levels
    everyLevels: 3, // at most one every three completed levels...
    minSeconds: 180, // ...and at least three minutes apart (whichever comes later)
    quietAfterRewardedSeconds: 90, // never straight after a rewarded ad
  },
  rewarded: {
    dailyCap: 6, // rewarded views per player per UTC day
    noFillLimit: 2, // after this many failures in a row, hide rewarded offers for the session
  },
  skipOffer: { stuckSeconds: 120, restarts: 3, notBeforeLevel: 4 }, // level index 4 is level 5
  superHintCooldownSeconds: 60,
  bonusDailiesPerDay: 2,
};

// Test-only overrides (never read inside YouTube), e.g. ?adlevels=1&adgrace=0&adevery=1&rewardcap=2.
if (!host.inPlayables) {
  const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
  const num = (key, apply) => {
    if (params.has(key) && Number.isFinite(Number(params.get(key)))) apply(Number(params.get(key)));
  };
  num('adlevels', (n) => (AD_POLICY.interstitial.minCompletedLevels = n));
  num('adevery', (n) => (AD_POLICY.interstitial.everyLevels = n));
  num('adgrace', (n) => (AD_POLICY.interstitial.minSeconds = n));
  num('adquiet', (n) => (AD_POLICY.interstitial.quietAfterRewardedSeconds = n));
  num('rewardcap', (n) => (AD_POLICY.rewarded.dailyCap = n));
  num('skipsecs', (n) => (AD_POLICY.skipOffer.stuckSeconds = n));
}

export class Ads {
  /**
   * @param now clock
   * @param counter { today(): number, add(): void } persisted count of today's rewarded views
   * @param api the host SDK wrapper (replaced in tests)
   */
  constructor(now = () => Date.now(), counter = null, api = host) {
    this.now = now;
    this.api = api;
    this.counter = counter ?? { n: 0, today() { return this.n; }, add() { this.n++; } };
    this.levelsSince = 0;
    // The session counts as having just shown an ad, so the first one waits minSeconds.
    this.lastInterstitial = now();
    this.lastRewarded = -Infinity;
    this.rewardedSinceBreak = false;
    this.failures = 0;
    this.busy = false;
  }

  get available() {
    return this.api.adsAvailable();
  }

  /** Rewarded offers are shown only while ads work and today's cap is not reached. */
  get rewardedAvailable() {
    return this.available && this.failures < AD_POLICY.rewarded.noFillLimit && this.counter.today() < AD_POLICY.rewarded.dailyCap;
  }

  levelCompleted() {
    this.levelsSince++;
  }

  shouldShowInterstitial(completedLevels, { struggled = false } = {}) {
    const p = AD_POLICY.interstitial;
    const t = this.now();
    return (
      this.available &&
      !struggled &&
      !this.rewardedSinceBreak &&
      completedLevels >= p.minCompletedLevels &&
      this.levelsSince >= p.everyLevels &&
      t - this.lastInterstitial >= p.minSeconds * 1000 &&
      t - this.lastRewarded >= p.quietAfterRewardedSeconds * 1000
    );
  }

  /**
   * At a natural break: shows an interstitial if the caps allow; resolves when play may continue.
   * A break that follows a rewarded view, or a level the player struggled with, never shows one.
   */
  async maybeInterstitial(completedLevels, opts = {}) {
    const show = !this.busy && this.shouldShowInterstitial(completedLevels, opts);
    this.rewardedSinceBreak = false;
    if (!show) return false;
    this.busy = true;
    try {
      await this.api.requestInterstitialAd();
    } catch (err) {
      console.warn(err);
    } finally {
      this.busy = false;
      this.levelsSince = 0;
      this.lastInterstitial = this.now();
    }
    return true;
  }

  /**
   * Resolves 'earned' when the host confirms the reward, 'declined' when the ad was closed early,
   * and 'unavailable' when no ad could be shown (no fill, an error, or a cap).
   */
  async rewarded(rewardId) {
    if (this.busy || !this.rewardedAvailable) return 'unavailable';
    this.busy = true;
    try {
      const earned = await this.api.requestRewardedAd(rewardId);
      this.failures = 0;
      this.counter.add();
      this.rewardedSinceBreak = true;
      this.lastRewarded = this.now();
      return earned === true ? 'earned' : 'declined';
    } catch (err) {
      console.warn(err);
      this.failures++;
      return 'unavailable';
    } finally {
      this.busy = false;
    }
  }
}
