// Ad policy. Every cap lives here so it can be tuned from analytics in one place.
// Rules from the brief: ads only at natural breaks after the full escape and reunion,
// never needed to progress, no banners, no rewarded ad followed by an interstitial,
// and play continues normally if an ad fails, is declined or has no fill.
import * as host from './host.js';

export const AD_POLICY = {
  interstitial: {
    minCompletedLevels: 3, // no interstitials during the first three levels
    everyLevels: 3, // at most one every three completed levels...
    minSeconds: 180, // ...and at least three minutes apart (whichever comes later)
    quietAfterRewardedSeconds: 90, // never straight after a rewarded ad
  },
  skipOffer: { stuckSeconds: 180, notBeforeLevel: 5 },
};

export class Ads {
  constructor(now = () => Date.now()) {
    this.now = now;
    this.levelsSince = 0;
    // The session counts as having just shown an ad, so the first one waits minSeconds.
    this.lastInterstitial = now();
    this.lastRewarded = -Infinity;
    this.busy = false;
  }

  get available() {
    return host.adsAvailable();
  }

  levelCompleted() {
    this.levelsSince++;
  }

  shouldShowInterstitial(completedLevels) {
    const p = AD_POLICY.interstitial;
    const t = this.now();
    return (
      this.available &&
      completedLevels >= p.minCompletedLevels &&
      this.levelsSince >= p.everyLevels &&
      t - this.lastInterstitial >= p.minSeconds * 1000 &&
      t - this.lastRewarded >= p.quietAfterRewardedSeconds * 1000
    );
  }

  /** Shows an interstitial if the caps allow; resolves when play may continue. */
  async maybeInterstitial(completedLevels) {
    if (this.busy || !this.shouldShowInterstitial(completedLevels)) return false;
    this.busy = true;
    try {
      await host.requestInterstitialAd();
    } catch (err) {
      console.warn(err);
    } finally {
      this.busy = false;
      this.levelsSince = 0;
      this.lastInterstitial = this.now();
    }
    return true;
  }

  /** Resolves true only when the host confirms the reward was earned. */
  async rewarded(rewardId) {
    if (this.busy || !this.available) return false;
    this.busy = true;
    try {
      const earned = await host.requestRewardedAd(rewardId);
      return earned === true;
    } catch (err) {
      console.warn(err);
      return false;
    } finally {
      this.busy = false;
      this.lastRewarded = this.now();
    }
  }
}
