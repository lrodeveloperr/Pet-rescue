# Ad policy log

Every ad cap in `src/ads.js` (`AD_POLICY`) is a hypothesis, not a known optimum. Record each change here with its date, the reason and the data that will judge it, so YouTube's monthly revenue and engagement data can be read against it.

Rules that never change: ads appear only at natural breaks after the full escape and reunion, never as banners, never to progress; rewarded ads are opt-in with a visible decline; play continues normally when an ad fails, is declined or has no fill.

## Current values

| Setting | Value | Why | What would change it |
|---|---|---|---|
| `interstitial.minCompletedLevels` | 3 | Protect the first session before any ad (research: early interstitials raise churn). | Day-1 retention by cohort before and after. |
| `interstitial.everyLevels` | 3 | Cap frequency at natural breaks. | Session length and levels per session. |
| `interstitial.minSeconds` | 180 | At least 3 minutes between interstitials, and the first waits 3 minutes. | Ads per session against session length. |
| `interstitial.quietAfterRewardedSeconds` | 90 | Never stack an interstitial on a rewarded view. | — |
| Break after a rewarded view | no interstitial | A player who just chose an ad is not shown another at the next break. | — |
| Break after a struggle level | no interstitial | A level with 3+ restarts or a stage-2+ hint is a frustration point (research: ads at frustration points raise churn). | Retention of players who struggle. |
| `rewarded.dailyCap` | 6 | Keeps rewarded ads a choice, not a routine; prevents fatigue. | Rewarded views per DAU and next-day retention. |
| `rewarded.noFillLimit` | 2 | After two failed requests in a row, hide offers for the session instead of showing broken buttons. | Fill rate reports. |
| `skipOffer.stuckSeconds` | 120 | Offer a skip after 2 minutes of active play on a level (timers stop during pauses, menus and ads). | Skip offers accepted vs. levels abandoned. |
| `skipOffer.restarts` | 3 | Or after 3 restarts of the same level. | Same. |
| `skipOffer.notBeforeLevel` | index 4 (level 5) | No skips in the opening levels. | — |
| `superHintCooldownSeconds` | 60 | At most one rewarded whole-route hint a minute. | Super-hint views and level completion after a hint. |
| `bonusDailiesPerDay` | 2 | Extra daily puzzles for an ad, at most two a day. | Bonus-daily views and next-day return. |

Rewarded placements: skip a level, whole-route hint (hint stage 3), bonus daily puzzle, choose a star hat, bonus friend (choose one of three looks). Streak hats are never sold.

## Testing outside YouTube

Test-only URL parameters (ignored inside YouTube): `?fakeads` (stand-in ads), `?fakeads=decline`, `?fakeads=nofill`, `fakeadms=<ms>`, and cap overrides `adlevels`, `adevery`, `adgrace`, `adquiet`, `rewardcap`, `skipsecs`.

## Experiments to run elsewhere first

Test on a web portal for at least 14 days before changing Playables (audit item 42):

1. A 5-minute first-session floor before any interstitial (vs. the current 3 levels and 3 minutes).
2. A 2-minute minimum gap (vs. 3 minutes).

Judge by day-1 and day-7 retention and revenue per daily active user, not by ad impressions.

## Change history

| Date | Change | Reason |
|---|---|---|
| 2026-10-18 | Initial caps as above. Added: daily rewarded cap 6, no-fill backoff, no interstitial after a rewarded view or a struggle level, skip offer at 2 minutes or 3 restarts (was 3 minutes), super hint, bonus friend, choose-your-hat (replaced the random mystery hat), bonus dailies capped at 2. | Engagement and revenue audit (`docs/AUDIT_ENGAGEMENT_AND_REVENUE.md`). |
