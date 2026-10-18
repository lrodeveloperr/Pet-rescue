# Ad monetization for casual puzzle games (mobile + web/HTML5 + YouTube Playables): placements, frequencies, rewards, trade-offs, pitfalls

Research date: 2026-10-18. Method note: WebFetch could not resolve any host in this environment (DNS failure on developers.google.com, docs.crazygames.com, sdk.poki.com), so **every finding below comes from WebSearch result extracts**, not from full-page reads. Exact wording was rarely checkable. Evidence tags used throughout:
- **[POLICY]** platform rules or official docs (most authoritative)
- **[DATA]** a measured result: an A/B test, a cross-game dataset or a published report
- **[VENDOR]** an ad-network or ad-tech marketing blog. Numbers are often unsourced or copied from other blogs, so treat them as directional.
- **[ANECDOTE]** a single developer's own report
- **[UNVERIFIED]** the search summary could not tie the claim to a primary source
- The year of the evidence is given wherever it is known.

Context being audited: "Pet Rescue: Borrow & Escape", a textless one-finger puzzle game on YouTube Playables. It earns from ads only (no IAP). YouTube runs the pre-roll. The game shows an interstitial only when the player presses "next" after a level celebration: none in the first 3 completed levels, at most 1 per 3 levels and per 3 minutes, and none within 90 s after a rewarded ad. Rewarded ads cover skip-level (after 3 min stuck, from level 5), a random cosmetic hat, and 1 bonus daily puzzle per day. Hints, undo and restart are free. There are no banners.

## Q1. Ad revenue model: ARPDAU drivers, eCPMs by format/region/platform, and how session length and retention multiply into LTV

### Takeaway
Ad ARPDAU = impressions per DAU × eCPM ÷ 1000. Ad LTV = ad ARPDAU × expected active days per player (the area under the retention curve). Rewarded video is the highest-eCPM format on mobile (2024–2026, US roughly $13–$30+). Interstitials are close behind in the US ($9–$25 depending on source and creative type). Tier-3 countries pay about 5–18% of US rates. In casual games, interstitials earn as much total revenue as rewarded or more, because they have more impressions. YouTube Playables publishes no eCPM, fill or revenue-share data, so any Pet Rescue forecast must use mobile and web proxies and be checked against the YouTube portfolio reports.

### Cited Findings
**Formula and structure**
- Ad LTV = ad ARPDAU × the area under the retention curve (expected active days per player). One source frames impressions per DAU as "a design decision, not a benchmark". Its models assume 6, 12 and 20 impressions/DAU and note that 20 runs into Google Play's repeated-interstitial policy. Worked example: 1.5 rewarded impressions/DAU at a $4 eCPM gives ad ARPDAU of $0.006. Times about 4.8 cumulative active days (a hybrid-puzzle example, not a benchmark), that is about $0.03 ad LTV. [VENDOR, 2026] — [Playio ad revenue calculator](https://blog.playio.co/mobile-game-ad-revenue-calculator)
- ARPDAU = (ad impressions per DAU × eCPM ÷ 1000) + (IAP revenue ÷ DAU). Rewarded impressions/DAU = (share of users who engage with a placement) × (views per engaged user). [VENDOR] — [AdReact ARPDAU guide](https://adreact.com/blog/arpdau-calculator-benchmark-guide/); [Playio calculator](https://blog.playio.co/mobile-game-ad-revenue-calculator)
- Unity defines engagement rate in terms of impressions vs DAU, and "usage rate" as impressions ÷ daily *engaged* users. Note that many sources instead use "engagement rate" for the % of DAU who watch at least one rewarded ad, so definitions differ. [VENDOR] — [Unity game design consultant blog](https://unity.com/blog/maximize-mobile-game-performance-unity-game-design)

**Mobile eCPM by format, OS and region**
- Tenjin Q2 2024, US, game apps: interstitial $23.17 on iOS and $16.15 on Android; rewarded $24.39 on iOS and $30.25 on Android. [DATA, 2024, via secondary summary] — [GameDevReports summary of Tenjin Q2'24](https://gamedevreports.substack.com/p/tenjin-ad-monetization-in-mobile-00b)
- Tenjin Q1 2024: US rewarded $30.25 on iOS and $27.88 on Android. US interstitial is listed as $19.62 on both OSs, which is a likely copy error. 55% of iOS ad revenue and 33% of Android ad revenue came from the US. [DATA, 2024, secondary] — [GameDevReports summary of Tenjin Q1'24](https://gamedevreports.substack.com/p/tenjin-ad-monetization-in-mobile)
- Tenjin/CAS published an "Ad Monetization Benchmark Report 2025" with eCPM by format, but its tables were not visible in search extracts. — [Tenjin 2025 report](https://tenjin.com/blog/ad-monetization-benchmark-report-2025-ecpm-ad-revenue/)
- A secondhand citation of an Aug-2026 Tenjin benchmark: Q2 2026 game ad revenue was 55% Android / 45% iOS, and the US was 58% of iOS and 32% of Android revenue. [UNVERIFIED, 2026] — [Playio eCPM benchmarks 2026](https://blog.playio.co/mobile-game-ecpm-benchmarks-2026)
- US rewarded eCPM is about $13–$30 depending on source (Tier-1 rewarded $15–$30, Playwire 2025). US/CA video interstitials are $12–$25 and static/playable interstitials $6–$12 (AdReact, May 2026). [VENDOR, 2025–2026] — [Playio eCPM benchmarks 2026](https://blog.playio.co/mobile-game-ecpm-benchmarks-2026)
- AdMob benchmarks, June 2026: US/Tier-1 rewarded $14–$22 and interstitial $9–$14. Tier-3 rewarded $2–$3 and interstitial $1–$2. Tier-3 is about 0.05–0.18× the US. [VENDOR, 2026] — [RevenueLab AdMob eCPM benchmarks 2026](https://www.revenuelab.fyi/blog/admob-ecpm-benchmarks-2026)
- AppLovin 2025 publisher benchmarks (as cited): Tier-1 rewarded $15–$40 and Tier-2/3 $3–$10. [VENDOR, secondhand] — [Coinis glossary](https://coinis.com/glossary/rewarded-video)
- Appodeal Q4 2024: rewarded video had the highest eCPM on both platforms. Interstitials grew steadily, with a sharp December rise (Q4 seasonality). [VENDOR/DATA, 2024] — [Appodeal eCPM report Q4 2024](https://appodeal.com/the-mobile-ecpm-report-updated-q4-2024-view)
- TopOn H1 2025: in casual games, interstitials were **44%** of ad revenue vs rewarded **39%**. Interstitial revenue share grew +15% YoY. [DATA, 2025, via secondary] — [Prado summary](https://prado.co/post/rewarded-video-holds-the-crown-but-interstitial-ads-are-catching-up)

**Web / HTML5 eCPM and earnings**
- Web rewarded eCPM: US $15–$28, EU $8–$15, Tier-3 $1–$3. Web interstitial: US/CA $3–$12, EU $2–$8, Tier-3 $0.50–$2. These are per-impression figures, not per 1,000 plays. [VENDOR] — [AppLixir eCPM optimization for web games](https://www.applixir.com/blog/ecpm-optimization-for-web-games-benchmarks-and-fixes/)
- An average web rewarded eCPM of $12–$15, with North American rates down 5–10% YoY. The same vendor claims rewarded runs 3–8× interstitial eCPM, but no source is given. [VENDOR, unsourced] — [AppLixir highest-paying HTML5 format](https://www.applixir.com/blog/whats-the-highest-paying-ad-format-for-html5-games-right-now)
- Poki revenue share: 100% of revenue for players who come to the game directly, 50/50 for players Poki sends. CrazyGames publishes no standard split; a Sept-2025 jam guide listed 60% to the developer. [POLICY, secondhand] — [BountyBoard HTML5 monetization 2026](https://www.bountyboard.gg/blog/how-to-monetize-an-html5-game)
- Developer earnings anecdotes from CrazyGames: 50k plays ≈ $250 (about $5 per 1,000 plays). Another game earned about €31/day six weeks after Full Launch, and adding one rewarded ad lifted revenue about 25% the next day. [ANECDOTE; aggregated in 2026 HTML5 income blogs, original posts not retrieved] — [PixelGameCraft HTML5 income](https://pixelgamecraft.com/blog/html5-game-income/); [Impulse Media Hub](https://www.impulsemediahub.com/blog/html5-game-monetization-2026/)

**YouTube Playables specifically**
- Ad formats: pre-roll while the game loads (no integration needed), interstitials at natural breakpoints, and rewarded ads that are opt-in and give in-game items or experiences. The SDK ads API is a public preview, "subject to change". [POLICY] — [YouTube Playables monetization](https://developers.google.com/youtube/gaming/playables/reference/monetization)
- Fill is not 100%, so not every player sees an ad every session. Monetization runs on Google ad demand (MediaCube says AdSense). [VENDOR/secondary] — [MediaCube Playables monetization](https://mediacube.io/en/blog/youtube-playables-monetization)
- Revenue reporting (third-party descriptions): no real-time per-game revenue. Total daily portfolio revenue appears with a 48-hour delay, and a per-game breakdown for the prior month arrives around the 15th. No official rate, payout method or threshold is published. [UNVERIFIED, 2026] — [MediaCube Playables updates](https://mediacube.io/en/blog/youtube-playables-updates); [Playgama Playables monetization](https://playgama.com/blog/main/youtube-playables-monetization/)
- Playgama (a publisher) self-reports that its strongest Playables titles earned $10,000–$15,000 in their first month, and its games averaged about $3,100/month in the closed beta. Another blog claims about 10× portfolio revenue growth from May to June 2026 while monetization was still a pilot. [ANECDOTE/self-reported, 2026] — [Playgama Playables monetization](https://playgama.com/blog/main/youtube-playables-monetization/); [Playgama "What are YouTube Playables"](https://playgama.com/blog/2026/06/04/youtube-playables/)

**ARPDAU and retention reference points (conflicting)**
- Casual ads-only blended ARPDAU of $0.01–$0.05 (2026 article), vs casual puzzle/match-3 at $0.05–$0.15 with top performers at $0.20–$0.30 (an older article with no named sources). These conflict. [VENDOR] — [GameGrowthAdvisor KPIs 2026](https://gamegrowthadvisor.com/blog/2026-03-17-mobile-game-kpis-benchmarks-2026/); [AdReact ARPDAU guide](https://adreact.com/blog/arpdau-calculator-benchmark-guide/)
- Puzzle retention is cited as D1 31.85%, D7 12.18%, D30 5.35%. Genre retention has not been broadly republished since AppsFlyer's Q3 2022 breakdown, so these numbers are dated. [DATA, ~2022] — [GameGrowthAdvisor KPIs 2026](https://gamegrowthadvisor.com/blog/2026-03-17-mobile-game-kpis-benchmarks-2026/)

### Inferences
- For Pet Rescue, total ad revenue ≈ DAU × [(pre-roll imps/DAU × pre-roll eCPM) + (interstitial imps/DAU × int. eCPM) + (rewarded imps/DAU × RV eCPM)] ÷ 1000 × fill. Pre-roll impressions scale with **sessions per DAU** (one per load), interstitials with **levels and minutes played per session**, and rewarded with **offer reach × opt-in**. Retention (D1/D7/D30) multiplies all three. A 1-point drop in D7 can outweigh a 5–10% ARPDAU gain (see Q2), so revenue must be judged per install over at least D7 (ideally cumulative D14/D30), not per day.
- Under the current caps (≤1 interstitial per 3 levels and per 3 min, with a 3-level grace), a 10-minute session can hold at most about 3 interstitials. Realistically it will be 1–2, plus 1 pre-roll. With fill below 100% and a rewarded menu that only reaches stuck players, cosmetic seekers and daily players, total impressions/DAU is likely only about 2–4. That is at the conservative end of the 6–20/DAU range used in the Playio models. This is an estimate, not a measurement.
- Because YouTube's audience is global and Tier-3 eCPMs are about 5–18% of the US, a large share of plays may come from low-eCPM regions. More ad load there adds little revenue but costs the same retention. That argues against simply raising frequency globally.

### Gaps
- No public YouTube Playables eCPM, fill rate, revenue share or per-format split was found. The pre-roll's share of Playables revenue is unknown.
- No reliable public benchmark of impressions/DAU specifically for casual puzzle games (mobile or web) was found.
- Tenjin 2025/2026 tables could not be read directly. The 2025–2026 eCPM ranges above come from vendor blogs that partly cite each other.

## Q2. Interstitial best practice: frequency caps, new-user grace, natural-break placement, and measured effects on D1/D7 retention and session length

### Takeaway
The best quantified A/B evidence (ZiMAD, Neon Play; ironSource/Unity, about 2020–2022) shows that adding interstitials to a rewarded-only game raised ARPDAU about 18% for about a 2.3–2.5% relative drop in D7 retention. Tuning frequency afterwards added more. Platform norms converge on interstitials only at natural breaks (never at level start, app load or mid-play), a time cap of about 1 per 2–3 minutes (CrazyGames enforces 1 per 3 min; Playgama defaults to 60 s), suppression right after a rewarded ad, and a first-session grace period. Grace lengths range from 1 core action to 10–19 levels in published examples. Retention losses show up at D3–D7, not D1, so tests need at least 7–14 days. Interstitials churn players more than rewarded ads, and iOS users are more sensitive than Android users (Unity AdQuality, Nov 2025).

### Cited Findings
**Measured A/B results**
- ZiMAD (Dig Out!) added interstitials from Day 1 against a control with rewarded + banner only. Revenue rose **+17%** and ARPDAU **+18%**, while D7 retention fell about **2.5%** (Unity's write-up) or **2.3%** (the is.com/ironSource summary). [DATA, ironSource-era ~2020–2021] — [Unity ZiMAD case study](https://unity.com/resources/zimad-dig-out); [is.com interstitial best practices](https://is.com/community/academy/monetization/interstitial-and-banner-ads-best-practices)
- Neon Play added interstitials to a game monetized only by rewarded video. ARPDAU rose "with minimal impact on retention". A second test tuning frequency "further increased" ARPDAU. No frequency numbers were published. [DATA, ironSource-era] — [Unity Neon Play case study](https://unity.com/resources/neon-play)
- GameBiz Consulting's experiment series: changing interstitial *order/sequence* boosted ad revenue **+24%**, adjusting rewarded/interstitial placement order gave about **+30%**, and simple UI tweaks raised rewarded engagement. One test cut IAP revenue 1.5% (a lower average transaction, with conversion stable). [DATA, practitioner, n not visible] — [PocketGamer.biz: five in-game ad experiments](https://www.pocketgamer.biz/what-five-in-game-ad-experiments-taught-us-about-player-behaviour-and-revenue/); [Symphony mirror](https://www.gf.symphonyonline.co.uk/reports/5-surprises-from-in-game-ad-experiments)
- A peer-reviewed observational study of 21 F2P mobile games (Burns, AIIDE 2021) found that in-game ads had "a weak, insignificant effect on each measure of user-level retention". Game-specific effects dominated all advertising effects. [DATA, academic, 2021] — [AAAI/AIIDE paper PDF](https://cdn.aaai.org/ojs/12906/12906-52-16423-1-2-20201228.pdf)
- GameBiz Consulting cites Unity research showing a +2.3% D7 retention *lift* when ads were added to an IAP-only game (secondhand). Its conclusion: ads generally have little retention effect when implemented well. [DATA, secondhand] — [GameBiz: Do ads hurt retention?](https://www.gamebizconsulting.com/blog/do-ads-hurt-retention-in-mobile-games)
- Unity AdQuality data (Nov 2025, multiple games, Android + iOS): "interstitial ads consistently drive higher churn than rewarded videos across platforms", and iOS users are more sensitive than Android. Some games saw AppLovin-served interstitial churn over 20% on iOS. In one Android interstitial game, churn after Unity Ads impressions was 3.90% at D1 and 1.40% at D14. Churn varies strongly by ad *network/creative quality*, not just frequency. [DATA, 2025] — [PocketGamer.biz: ad quality and churn](https://www.pocketgamer.biz/what-our-data-reveals-about-ad-quality-and-player-churn-in-mobile-games/); [GameBiz AdMon newsletter #7](https://www.gamebizconsulting.com/newsletter/admon-newsletter-7-how-ad-quality-impacts-churn)
- Supersonic: some games get better LTV with a **15 s** interstitial timer, others with **45 s**. The optimum is game-specific and found by testing (hyper-casual context). [VENDOR/publisher] — [Supersonic: improve LTV of hyper-casual](https://supersonic.com/learn/blog/how-to-improve-the-ltv-of-your-hyper-casual-game)

**Test design**
- Unity/ironSource: watch impressions, retention and ARPU, and run about **2 weeks**. If D1 drops without a big enough ARPU gain, reduce frequency or change placement. If ARPU rises with no significant retention impact, roll out. [VENDOR guidance] — [is.com best practices](https://is.com/community/academy/monetization/interstitial-and-banner-ads-best-practices); [Unity interstitial best practices](https://unity.com/blog/best-practices-for-maximizing-revenue-from-interstitial-ads-in-your-app)
- More frequency raises revenue the same day, but the retention loss appears **between D3 and D7**, so a 3-day test is biased toward more ads. The same blog's pacing numbers (first ad after 60–90 s, 2–3 min between ads, 4–6 per session, a 5–8% D1 gain) are unsourced. [VENDOR, 2026] — [Playio: real price of an interstitial](https://blog.playio.co/interstitial-ads-mobile-games)

**Capping and pacing mechanics**
- LevelPlay: "capping" limits the number of ads and "pacing" limits the interval between them. Both can be set per ad unit and per placement, and the stricter rule applies. "Capping and pacing ads in your app might reduce your revenue", so test it. Best moments are the end of a timed segment or level, the completion of a single game, or a level increase. [POLICY/vendor docs] — [Unity LevelPlay capping & pacing](https://docs.unity.com/en-us/grow/levelplay/platform/settings/capping-pacing); [Unity interstitial best practices](https://unity.com/blog/best-practices-for-maximizing-revenue-from-interstitial-ads-in-your-app)
- CrazyGames enforces "at most one midgame ad every 3 minutes, with additional safeguards around game start and rewarded ads". Developers are told to request at every natural break and let the SDK pace. [POLICY] — [CrazyGames midgame ads pacing](https://docs.crazygames.com/resources/midgame-ads-pacing/); [CrazyGames ad requirements](https://docs.crazygames.com/requirements/ads/)
- Playgama Bridge: `minimumDelayBetweenInterstitial` defaults to **60 s**. The initial-interstitial delay is reported as **60 s** (changelog v1.31.0) or **30 s** (GitHub release notes); these conflict. The delay is disabled for GameDistribution. [POLICY/docs, conflicting] — [Playgama Bridge config](https://wiki.playgama.com/playgama/bridge-sdk/config); [Playgama changelog](https://wiki.playgama.com/playgama/bridge-sdk/changelog); [Playgama Bridge releases](https://github.com/playgama/bridge/releases)
- Poki is reported to use a minimum of about 2 minutes between forced interstitials. This is not in Poki's official docs. [UNVERIFIED] — [Poki SDK explained (Plain English)](https://plainenglish.io/gaming/poki-sdk-explained-for-html5-game-developers)

**New-user grace periods (examples, not benchmarks)**
- A word-puzzle developer (Morning Words) shows no interstitials in levels 1–19, then one only after every 3 beaten levels, with a 3-minute floor. [ANECDOTE] — [HackerNoon: Morning Words monetization](https://hackernoon.com/how-i-monetize-morning-words-without-interrupting-players-after-every-level)
- A SayGames hybrid-casual example shows the first interstitial only after level 10, followed by a no-ads offer. [UNVERIFIED: the primary SayGames URL was not retrieved; the search summary attributed it to a SayGames article]
- An operator guide recommends a minimum gap of 60–90 s between interstitials, no first interstitial before the user completes at least one core action, and lower caps in US/Western Europe than in APAC (opinion). [VENDOR/opinion] — [MonetizationGuy operator framework](https://monetizationguy.com/articles/balancing-ad-revenue-and-user-experience-mobile-apps)
- CrazyGames: ads should not show "before the player has had a reasonable amount of gameplay". [POLICY] — [CrazyGames ad requirements](https://docs.crazygames.com/requirements/ads/)

**Placement rules from store/network policy**
- AdMob: interstitials only at logical breaks (pages, stages, levels). Ads that appear suddenly while a user is focused on a task cause accidental clicks. No more than one interstitial after every two user actions (including Back). For level transitions, show the ad *before* the Continue/Next-level button to reduce accidental clicks. Interstitials on app load or exit are disallowed (per an AdMob SDK team member). [POLICY] — [AdMob disallowed interstitial implementations](https://support.google.com/admob/answer/6201362?hl=en); [AdMob recommended implementations](https://support.google.com/admob/answer/6201350?hl=en); [AdMob interstitial guidance](https://support.google.com/admob/answer/6066980?hl=en); [AdMob SDK forum thread](https://groups.google.com/g/google-admob-ads-sdk/c/6tkQZmPLNhg)
- Google Play policy (effective 30 Sep 2022): no ads at the start of a level or content segment, no full-screen video interstitials before the splash/loading screen, and full-screen interstitials must be closeable after 15 s. Exceptions are opt-in interstitials and those after a score screen. [POLICY, 2022] — [Play Console Ads policy](https://support.google.com/googleplay/android-developer/answer/9857753?hl=en); [TechCrunch 2022](https://techcrunch.com/2022/07/28/google-announces-new-play-store-policies-around-intrusive-ads-impersonation-and-more/)
- YouTube Playables: call `requestInterstitialAd()` "at logical pauses", such as between levels, after a game-over screen or during mid-game loading. The call does not guarantee that an ad shows. [POLICY] — [Playables monetization](https://developers.google.com/youtube/gaming/playables/reference/monetization); [Playables SDK reference](https://developers.google.com/youtube/gaming/playables/reference/sdk)
- Third-party Playables guides claim that "artificial timers before interstitials are strictly forbidden" (that is, ads must be event-driven at breaks, not fired by a timer) and that YouTube expects the game to pause during all ad events. [UNVERIFIED] — [Playables.in requirements guide](https://playables.in/youtube-playables-requirements/); [Playgama Playables monetization](https://playgama.com/blog/main/youtube-playables-monetization/)

### Inferences
- Pet Rescue's interstitial policy is **already at or beyond the strictest published platform norms**. It has a 3-minute floor (equal to the CrazyGames cap and stricter than the Playgama 60 s default and the reported Poki ~2 min), a level cap (1 per 3 levels), a post-rewarded cool-down, a grace period (3 levels), and break-only placement. The audit question is therefore mainly whether it is *too conservative* and where to loosen it safely, not whether it is too aggressive.
- The cheapest candidate test is **time cap 3 min → 2 min, level cap unchanged**. Short levels mean the level cap binds in fast sessions and the time cap in slow ones. Read D1, D3, D7, levels per session, session length and interstitial imps/DAU over ≥14 days. The ZiMAD and Neon Play magnitudes suggest about a +10–20% ARPDAU gain is plausible for about a 1–3% relative D7 cost. That is a hypothesis from analogous mobile tests, not a Playables measurement.
- The 3-level grace on top of the YouTube pre-roll means the new player's first ad is the pre-roll, then nothing for 3 levels. Published grace examples range from "1 core action" to 10–19 levels. Given that the first 3 levels of a one-finger puzzle may take only 1–3 minutes, a **time-based grace (for example no interstitial before about 5 minutes of cumulative play in the first session)** may be more meaningful than a level count. It is worth A/B testing 3 levels against 6 levels or about 5 min.
- AdMob's "show before the Next button" recommendation and Google's warnings about accidental clicks suggest guarding the Next tap. Ignore input for about 300–500 ms after the celebration appears, and do not reuse a repeated tap target that could land on the ad. YouTube controls the ad UI on Playables, but the general accidental-click principle still applies.
- Interstitial churn varies mostly with **creative and network quality** (AdQuality 2025; the Deloitte 2025 study in Q7). Pet Rescue cannot choose networks on Playables, so ad quality is outside its control. That is another argument for keeping frequency modest and leaning on rewarded ads.

### Gaps
- No published Voodoo, Homa, SayGames, Kwalee, Rollic, AppLovin or CrazyGames numbers on interstitial-frequency vs D1/D7 retention were found beyond the ironSource-era case studies.
- No evidence was found on the effect of interstitials on **session length** specifically (only retention and ARPDAU).
- No Playables-specific data was found on how interstitial frequency affects retention, or on YouTube's own server-side capping (YouTube may suppress requests, as Poki and CrazyGames do).

## Q3. Rewarded ad best practice: top puzzle placements, engagement rate, impressions/DAU, retention effects, reward calibration, offer frequency and fatigue, "watch to double"

### Takeaway
Rewarded ads are the format players like best. Players who engage with rewarded ads retain and spend more (correlational). Adding rewarded ads to an interstitial game cut perceived intrusiveness without hurting engagement (a small study). The strongest puzzle placements are at *moments of need*: out of moves or about to fail (continue/extra moves/undo), stuck (hint/skip), and between levels (double reward). About 36–38% of DAU watch rewarded ads in word and casual games (Unity, 2023 data). More placements raise engagement up to about 15–20 placements, then plateau. Guides converge on caps of about 3–8 rewarded views per user per day, diminishing payouts for repeat views, about a 1-minute cooldown on hint ads, and no stars or progress credit for skipped levels.

### Cited Findings
**Engagement and placement data**
- Unity 2024 Mobile Growth & Monetization Report (2023 data): rewarded engagement rose +3.2% YoY. The highest genres were word games (**38.4% of DAU watch rewarded ads**), RPG (37.6%) and casual (36%). **38.1%** of users will watch ads when out of resources. [DATA/vendor, 2024 report] — [PocketGamer.biz on Unity report](https://www.pocketgamer.biz/unity-global-rewarded-ad-engagement-rose-by-32-in-2023/); [Unity 2024 report page](https://unity.com/resources/mobile-growth-monetization-report-2024)
- Games with 15–20 distinct rewarded placements reportedly reach engagement up to about **46%**, with conversion growth "almost stopping" after 15–20 placements. [UNVERIFIED, attributed to Unity data] — [Unity 2024 report page](https://unity.com/resources/mobile-growth-monetization-report-2024); [ARPU Brothers summary](https://arpubrothers.com/blog/mobile-user-acquisition-unity-report/)
- Unity's 2023 report said between-level rewarded placements were the most engaged placement in **55%** of games. Unity also names between-level and lobby/pre-level as the placements most likely to engage. [DATA/vendor, 2023, secondhand] — [PremiumAds summary of Unity 2023 report](https://premiumads.net/blog/unity-mobile-growth-and-monetization-report-2023)
- Web rewarded engagement benchmark: **35–65%** (ad starts ÷ offers shown). [VENDOR] — [AppLixir](https://www.applixir.com/?p=3382)

**Retention and attitude effects**
- ironSource analysis of 8 high-DAU apps: users who engaged with a rewarded ad were about **4.5×** more likely to make a first purchase, with a weighted spend increase of +326%. This shows rewarded engagers are the most engaged players. It is correlational and an IAP metric. [DATA/vendor, ~2021–2022] — [Unity: rewarded ads impact on IAP, retention, engagement](https://unity.com/blog/understanding-the-impact-of-rewarded-ads-on-iap-retention-and-engagement)
- "Users who engage with rewarded ads show up to **3.5×** higher retention" (attributed to Mistplay, 500+ games). This is correlational and likely self-selection. [VENDOR/UNVERIFIED] — [Playio: rewarded ads and retention](https://blog.playio.co/impact-of-rewarded-ads-on-user-retention)
- In a small randomized study (n=51, 4 groups), adding rewarded ads where interstitials already existed **reduced perceived intrusiveness and increased ads viewed**, and player engagement was constant across groups. [DATA, academic, small n] — [ResearchGate listing](https://www.researchgate.net/publication/364466177_The_Sensitivity_of_Retention_to_In-Game_Advertisements_An_Exploratory_Analysis)

**Puzzle-specific placements (platform guidance)**
- CrazyGames says puzzle games generally perform best for rewarded ads, because slower gameplay suits hints and undo moves that players will watch an ad for. "Revive" on game over, limited to **once per session**, is a strong placement. Rewarded has the highest eCPM. [POLICY/guidance] — [CrazyGames ad monetization guide](https://docs.crazygames.com/resources/ad-monetization-guide/)
- CrazyGames puzzle guide: [POLICY/guidance] — [CrazyGames monetizing puzzle](https://docs.crazygames.com/resources/monetizing-puzzle/)
  - Offer hint-for-ad with a **1-minute cooldown** after a hint, so players cannot chain hints through a whole puzzle.
  - Offer undo or extra moves at the moment of failure.
  - **Do not grant coins or stars for skipped levels**, so the game cannot be skipped through.
  - Track hints per session and level churn, and put "Watch to Skip" on high-churn levels.
  - If hint use is low, make the first hint per level free to build the habit.
  - The no-ad option must look equally prominent.
  - Grant no reward if the ad fails.
  - Don't offer an ad every time the player dies.
- CrazyGames rewarded deep dive: build rewarded ads into the core loop from the start, make them easy to find, and make the reward feel worth the wait. Offer them at natural pauses. Use diminishing payouts for repeat views (example: 1st ad 100 gems, 2nd 50, 3rd 25). Poor implementation can damage the economy. [POLICY/guidance] — [CrazyGames: mastering rewarded ads](https://docs.crazygames.com/resources/rewarded-ads-deep-dive/)
- Market examples: match-3 "watch for more moves" (Pangle), and Two Dots' rewarded wheel granting +1/+3/+5 moves or boosters (GameRefinery). [VENDOR/market observation] — [Pangle rewarded placement best practices](https://www.pangleglobal.com/resource/27805); [GameRefinery rewarded implementations](https://www.gamerefinery.com/rewarded-video-ad-placements-interesting-implementations-from-across-the-market/)
- Explicit value framing ("Play a video for double coins") beats a vague prompt, and opt-in at failure moments is "much higher" than for a generic prompt. No numbers are given. [VENDOR] — [Pangle](https://www.pangleglobal.com/resource/27805)

**Calibration, caps and fatigue**
- Revenue per user is said to plateau or decline after **5–8 rewarded views/day**, with fatigue lowering eCPMs and hurting retention. Other guides suggest **3–5 rewarded opportunities per user per day**. A Roblox guide claims 30–50% opt-in for daily-bonus doubling, without a source. [VENDOR/UNVERIFIED] — [AdReact rewarded best practices](https://adreact.com/blog/rewarded-video-best-practices-maximize-revenue/); [AudienceLab rewarded optimization](https://audiencelab.ai/blog/rewarded-video-ads-optimization); [RoLearn rewarded video](https://rolearn.dev/guidance/ad-monetization-rewarded-video/)
- Modest increases in reward size can roughly double opt-in when the reward is consumable. Test reward value by segment. [VENDOR] — [AdReact rewarded best practices](https://adreact.com/blog/rewarded-video-best-practices-maximize-revenue/)
- Poki: `rewardedBreak()` only on the player's explicit choice, telling the player beforehand that an ad is coming, and reward only on success. A `size` parameter (small/medium/large) exists, and per the docs "based on the size, Poki may show more rewarded advertisements". A rewarded break **resets the commercial-break timer**. [POLICY] — [Poki SDK overview](https://developers.poki.com/guide/sdk-overview); [Poki HTML5 SDK](https://sdk.poki.com/html5)
- YouTube Playables: call `requestRewardedAd(id)` only when the player explicitly asks. Each placement needs a reward ID (a readable string or UUID, with no user data). The call resolves to a boolean "reward earned", and the game must branch on it. A third-party certification guide warns that a rewarded button that requests no ad or grants no reward can fail review. [POLICY + VENDOR] — [Playables monetization](https://developers.google.com/youtube/gaming/playables/reference/monetization); [MediaCube certification errors](https://mediacube.io/en/blog/youtube-playables-errors)
- Ordering matters. Showing an interstitial right after a player watched a rewarded ad for extra moves undermines the experience (developer observation). One segmentation pattern: users who watch a rewarded ad after a level get no interstitial, and users who skip it get one. [ANECDOTE + VENDOR] — [HackerNoon: Morning Words](https://hackernoon.com/how-i-monetize-morning-words-without-interrupting-players-after-every-level); [GameBiz segmentation newsletter](https://www.gamebizconsulting.com/newsletter/mastering-segmentation-ad-monetization)

### Inferences
- Pet Rescue's rewarded menu (skip after 3 min stuck from L5, random hat, 1 daily bonus puzzle) is **narrow and mostly low-frequency**. Skip reaches only stuck players. The hat is cosmetic, with uncertain appeal to a textless all-ages audience. The daily puzzle is capped at 1/day. Against the "moments of need" evidence and the 15–20-placement engagement curve, the main revenue lever is **more rewarded opportunities at need moments**, not more interstitials.
- Because hints, undo and restart are free (a deliberate engagement choice), the classic puzzle placements are unavailable. Options that keep them free:
  - (a) A rewarded "**super hint**" (reveal the full next 2–3 moves or a solution replay) while keeping the basic hint free. This matches CrazyGames' "first hint free" pattern.
  - (b) **"Watch to double stars/treats"** on the level-complete screen, if stars or any collectible exist. This is the classic between-levels "double reward", the most engaged placement in 55% of games per Unity 2023.
  - (c) A rewarded **"pick your hat"** (choose instead of random) or a second hat.
  - (d) **Streak-save** for the daily puzzle (see Q4).
  - (e) An earlier skip offer on measured high-churn levels (CrazyGames: put "Watch to Skip" where level churn is high) instead of a flat 3 minutes.
- Skip-level guardrails backed by CrazyGames: skipped levels should not award stars or count toward star-gated unlocks, and players should be able to replay them. The audit should check what Pet Rescue grants on skip.
- Calibration guardrails to adopt:
  - Cap total rewarded views at about 5–8/day.
  - Use diminishing returns for repeatable rewards.
  - Offer rewarded ads with an equally prominent "no thanks".
  - Grant nothing when `rewardEarned` is false, but show textless feedback such as an icon.
  - Keep the 90 s post-rewarded interstitial suppression. It matches Poki's timer reset and CrazyGames' "safeguards around rewarded ads". Consider extending it to "no interstitial at the next level break after a rewarded ad".

### Gaps
- No controlled public A/B data was found on "watch to double" opt-in rates, rewarded daily caps, or skip-level ad uptake in puzzle games.
- No rewarded-engagement % for the *puzzle* genre specifically (Unity reports word and casual only).
- No evidence was found on how cosmetic-only rewarded ads perform vs functional rewards, or how textless UIs affect rewarded opt-in.

## Q4. Hybrid ideas without IAP: ad-gated currencies, "ad tickets", streak repair, revive/continue, rewarded events

### Takeaway
There is little quantified public evidence for IAP-free hybrid systems. The defensible principles come from platform guidance:
- Rewarded ads must be optional value-adds, never gates. A level must be completable without one.
- Revives/continues are top placements, but cap them (for example once per session).
- Repeated views get diminishing payouts.
- Streak and daily systems help early retention, especially in week 1, but should be forgiving.
On YouTube Playables, rewards must be in-game items or experiences delivered only via YouTube's SDK. Off-platform monetization is banned.

### Cited Findings
- Rewarded ads must be "an optional opportunity, not an expectation". "Poorly designed levels that can only be completed by a rewarded ad are not acceptable" (grounds for rejection). [POLICY] — [CrazyGames ad requirements](https://docs.crazygames.com/requirements/ads/)
- Revive on the game-over screen, **limited to once per session**, is a strong rewarded placement. [POLICY/guidance] — [CrazyGames ad monetization guide](https://docs.crazygames.com/resources/ad-monetization-guide/)
- Diminishing returns (100 → 50 → 25) for repeat views, plus warnings that weak rewarded design can damage the in-game economy. [POLICY/guidance] — [CrazyGames: mastering rewarded ads](https://docs.crazygames.com/resources/rewarded-ads-deep-dive/)
- Daily rewards and streak mechanics are effective "particularly during the first week". A resetting 7-day streak can *break* habits, so a forgiving rolling version is suggested. [VENDOR/opinion, 2026] — [Hubapps retention strategies 2026](https://hubapps.team/blog/mobile-game-retention-strategies)
- Retry/continue is described as the strongest retention lever among rewarded placements. Its "25–35% next-day retention" figure is unsourced. The reward must carry real progression meaning for rewarded ads to help retention. [VENDOR, unsourced numbers] — [AppSamurai rewarded ads 2025](https://appsamurai.com/blog/rewarded-ads-in-mobile-games/); [Playio: why rewarded is effective](https://blog.playio.co/rewarded-ads-in-mobile-game)
- A rewarded *interstitial* (AdMob format) can serve without opt-in, and the user can skip at any point. It is one way to replace a forced interstitial with a reward-bearing one. Not available on Playables, which exposes only interstitial and rewarded calls. [POLICY] — [AdMob rewarded interstitial reference](https://developers.google.com/admob/unity/reference/class/google-mobile-ads/api/rewarded-interstitial-ad); [Playables monetization](https://developers.google.com/youtube/gaming/playables/reference/monetization)
- YouTube Playables: the game MAY show ads only through YouTube-provided ad functions and MUST NOT use off-platform ad or monetization services. Only ad-based monetization is active; there is no IAP. [POLICY] — [Playables monetization requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements_monetization); [Playgama Playables monetization](https://playgama.com/blog/main/youtube-playables-monetization/)
- Conflict: one extract of the same Google monetization-requirements page summary said "in-game advertising is strictly prohibited". This is most likely an outdated summary from before the ads API preview. The more specific "MAY display… using YouTube-provided ads functions" text appears current. [POLICY, conflicting extracts] — [Playables monetization requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements_monetization)
- Voodoo-style "rewarded-or-interstitial" flow: a short countdown offers a rewarded video, and declining triggers a plain interstitial. [UNVERIFIED; reported in a third-party write-up about Paper.io 2, primary URL not retrieved]

### Inferences
- IAP-free hybrid ideas for Pet Rescue, ranked by how well they fit the evidence. All are hypotheses to test:
  1. **Daily-puzzle streak save via rewarded ad.** It applies the "forgiving streak" principle and "progression meaning". Cap it at 1 save per missed day. It is also a natural D2–D7 retention hook.
  2. **"Treat" or "paw" currency earned by play, with a rewarded 2× at level end** (diminishing per day). Spend it on choosing hats, garden decorations or a pet costume. This keeps rewards cosmetic and economy-safe while creating a repeatable between-levels rewarded placement.
  3. **Rewarded "super hint"** while basic hints stay free.
  4. **Weekly "rescue event" level packs** unlocked by play or by an optional rewarded ad. They must also be unlockable by play to avoid ad-gating.
  5. "Ad tickets" (bank one rewarded view now, redeem later) are more complex. No evidence of their benefit was found, and they add text- and UI-heavy explanation that is hard in a textless game.
- A **"rewarded-or-interstitial" swap** at the level break is the IAP-free version of a no-ads offer: offer a rewarded 2× reward, and if declined, the regular interstitial (still capped) may show. It must not look like a forced ad, and YouTube's interstitial call must never be used to grant rewards.

### Gaps
- No Naavik or Deconstructor of Fun analysis specific to IAP-free hybrid ad economies was retrieved.
- No quantitative evidence on streak-repair rewarded ads, ad-ticket systems or rewarded events.

## Q5. Pre-roll / ad-on-load norms for web games, and how web portals (Poki, CrazyGames, GameDistribution, Playgama, YouTube) cap ads

### Takeaway
On every major web portal the *platform*, not the developer, decides whether a requested break actually shows an ad. Developers are told to signal every natural break and let the platform pace. Pre-roll/ad-on-load is platform-controlled:
- YouTube runs a pre-roll during load (on by default; it cannot be disabled, per third-party guides).
- Poki asks for a `commercialBreak()` before `gameplayStart`.
- GameDistribution reportedly requires a preroll plus midrolls for revenue.
- CrazyGames applies safeguards at game start and discourages ads before "a reasonable amount of gameplay".
Mobile policy (AdMob and Play) forbids interstitials on app load or before the splash screen, so the web pre-roll is a portal-specific norm, not a general best practice.

### Cited Findings
- YouTube Playables: pre-roll shows while the game loads and requires no integration. Interstitial and rewarded ads use the SDK. [POLICY] — [Playables monetization](https://developers.google.com/youtube/gaming/playables/reference/monetization)
- Pre-rolls on Playables are "on by default, can't be disabled". The game code must check whether ad placements are supported before calling, because monetization is rolling out gradually and is not enabled everywhere. [UNVERIFIED third-party, 2026] — [Playables.in requirements guide](https://playables.in/youtube-playables-requirements/); [Playgama Playables monetization](https://playgama.com/blog/main/youtube-playables-monetization/)
- The Playables Developer Portal has monetization settings for interstitial and rewarded ads that "won't change the end-user ads experience for now", but Google will eventually check them when handling ad requests. [POLICY] — [Playables Developer Portal](https://developers.google.com/youtube/gaming/playables/developer_portal)
- On Playables the game MUST handle muting through `isAudioEnabled`/`onAudioEnabledChange` and pausing through `onPause`/`onResume`. It must pause all execution after `onPause` and resume only on `onResume`. [POLICY] — [Playables integration requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements_integration); [Playables monetization requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements_monetization)
- Poki:
  - Not every `commercialBreak()` shows an ad. "Poki's system will determine when a user is ready for another ad, so feel free to signal as many commercial break opportunities as possible."
  - Call it at natural pauses, including before each `gameplayStart`.
  - Mute audio and disable input during breaks.
  - No other ad systems are allowed, and the game must remain playable with an ad blocker.
  [POLICY] — [Poki SDK overview](https://developers.poki.com/guide/sdk-overview); [Poki HTML5 SDK](https://sdk.poki.com/html5); [Poki requirements](https://developers.poki.com/guide/requirements-quality)
- A 2022 user report says a Poki game did not play ads the first time it opened; ads appeared only after some play and a restart. This suggests Poki holds back ads on first load. [ANECDOTE, 2022] — [uBlockOrigin issue #13603](https://github.com/uBlockOrigin/uAssets/issues/13603)
- CrazyGames:
  - Request midgame ads at opportune moments "without worrying about frequency or minimum intervals". The SDK caps them at 1 per 3 min, with safeguards around game start and rewarded ads.
  - Handle `adError`, which fires on timing limits, adblock or low demand, so the game continues.
  - Mute on `adStarted`, not on request.
  - Ads are disabled during Basic Launch.
  - Games that don't follow the rules are rejected without feedback.
  [POLICY] — [CrazyGames ad requirements](https://docs.crazygames.com/requirements/ads/); [CrazyGames midgame pacing](https://docs.crazygames.com/resources/midgame-ads-pacing/)
- GameDistribution: a preroll and midrolls are reportedly mandatory for revenue, and the SDK limits frequency (no number published). Playgama Bridge disables its own interstitial delay on GameDistribution. [UNVERIFIED third-party + POLICY changelog] — [PortalReady GameDistribution](https://portalready.world/portals/gamedistribution/); [Playgama changelog](https://wiki.playgama.com/playgama/bridge-sdk/changelog)
- Mobile contrast: AdMob says interstitials on app load or exit are disallowed. Google Play bans full-screen video interstitials before the splash/loading screen and ads at the beginning of a level. [POLICY] — [AdMob SDK forum thread](https://groups.google.com/g/google-admob-ads-sdk/c/6tkQZmPLNhg); [Play Console Ads policy](https://support.google.com/googleplay/android-developer/answer/9857753?hl=en)

### Inferences
- On Playables, the pre-roll counts as the new player's first ad, and it lands at the highest-churn moment (load). It is outside the game's control, which is a strong reason for the game's own grace period. Pet Rescue's "no interstitial in the first 3 levels" mirrors CrazyGames' start-of-game safeguard and the Poki first-load behaviour. Keep it, and consider a time-based floor too (Q2).
- Because portals and likely YouTube can silently refuse ad requests, the game should treat each break as a *request*. It should (a) never block progress waiting for an ad, (b) count its own caps from *shown* ads where the SDK reports that, (c) handle "no fill" or unsupported regions silently, and (d) never grant a reward when `rewardEarned` is false. If Playables reports no "shown" signal for interstitials, counting caps from *requests* will undercount real ads. That is conservative, which is fine.
- Mid-game loading screens are explicitly listed by YouTube as a valid interstitial moment. Entering a new biome or world on the map is a natural candidate break that does not interrupt a level.

### Gaps
- Poki's official numeric pacing (minimum interval, first-play rule) was not found in official docs.
- No data was found on pre-roll bounce or abandonment rates on web portals or Playables.
- It is unknown whether YouTube applies its own server-side interstitial frequency cap on top of the game's.

## Q6. Segmentation and ad pacing: adjusting ad load by engagement/tenure, region, platform or payer status

### Takeaway
Publishers segment ad load by tenure (protect new users), engagement (heavy players tolerate more ads in absolute terms), rewarded-ad behaviour (suppress interstitials for players who just watched or regularly watch rewarded), region (eCPM in Tier-3 is about 5–18% of the US) and OS (iOS users churn more from interstitials). Mediation platforms (LevelPlay, MAX, AdMob) support per-placement and per-segment capping and pacing. Hard public data on segmented-pacing uplift is scarce. On Playables, segmentation must be implemented in game code, because there is no mediation layer.

### Cited Findings
- Segmentation inputs include progression, spending and ad engagement. One example: users playing 7+ days without IAP receive interstitials and banners, keeping early play uninterrupted. Another: users who watch a rewarded ad after a level skip the interstitial, and those who skip the rewarded ad get the interstitial. [VENDOR/practitioner] — [GameBiz: segmentation in ad monetization](https://www.gamebizconsulting.com/newsletter/mastering-segmentation-ad-monetization)
- LevelPlay capping and pacing can be configured per ad unit and per placement, with the more restrictive setting winning. AppLovin MAX and AdMob reportedly allow server-side targeting rules to suppress or reduce ad frequency for segments. [POLICY docs + UNVERIFIED] — [Unity LevelPlay capping & pacing](https://docs.unity.com/en-us/grow/levelplay/platform/settings/capping-pacing); [MonetizationGuy](https://monetizationguy.com/articles/balancing-ad-revenue-and-user-experience-mobile-apps)
- Opinion: US and Western Europe users tolerate interstitials at lower frequency than APAC markets, so caps should vary by market. [VENDOR/opinion] — [MonetizationGuy](https://monetizationguy.com/articles/balancing-ad-revenue-and-user-experience-mobile-apps)
- Region value spread: Tier-3 eCPM is about 0.05–0.18× the US (2026). [VENDOR] — [RevenueLab 2026](https://www.revenuelab.fyi/blog/admob-ecpm-benchmarks-2026)
- iOS users are more sensitive to intrusive formats than Android (Unity AdQuality, Nov 2025). [DATA] — [PocketGamer.biz: ad quality and churn](https://www.pocketgamer.biz/what-our-data-reveals-about-ad-quality-and-player-churn-in-mobile-games/)
- Poki's rewarded `size` parameter lets the platform adjust how many rewarded ads it shows, a form of platform-side pacing. [POLICY] — [Poki HTML5 SDK](https://sdk.poki.com/html5)

### Inferences
- With no IAP, Pet Rescue's analog of "payer status" is **rewarded-ad engager status**. A practical, evidence-aligned rule set:
  - (1) **Tenure.** Grace of 3 levels or about 5 min in session 1, then the standard caps.
  - (2) **Rewarded engagers.** No interstitial at the next break after any rewarded ad (already partly covered by the 90 s rule). Optionally relax the interstitial cap slightly for heavy players who play long sessions, *if* tests show no D7 loss.
  - (3) **Struggling players.** If the player failed or restarted the current level several times, skip the interstitial at the next break, because frustration plus an ad compounds churn risk.
  - (4) **Long sessions.** Keep the time cap but drop the level cap after, say, 20 minutes of play in a session. Heavy players produce most impressions anyway.
- Region- or OS-based caps are likely impractical or unavailable on Playables. The game may only know language or locale, not ad-market tier. Treat region tuning as a gap.

### Gaps
- No published numbers were found on the revenue or retention impact of segmented vs flat ad pacing in casual puzzle games.
- It is unknown whether the YouTube Playables SDK exposes region, device OS or any signal that could support segmentation, beyond what the game measures itself.

## Q7. Pitfalls: ad fatigue, accidental clicks, ads during gameplay, misleading rewards, policy violations and bans, impact on reviews/ratings

### Takeaway
The evidence-backed pitfalls are:
- Disruptive ad experiences: one exposure raises churn about 6–7%, 52% of gamers would quit after repeated exposure, and 1 in 5 have abandoned a favorite game (Deloitte × AdMob, June 2025, n=7,000).
- Interstitials vs rewarded: interstitials churn players more than rewarded (Unity AdQuality, 2025).
- Unexpected or mid-task placements: banned by AdMob and Google Play, and the classic cause of accidental-click violations.
- Rewards: rewarded ads that gate progress, or that pay out when the ad fails or fail to pay when it succeeds, cause portal rejection or certification failure.
- Ad frequency: the most common theme of ad-related low-star reviews (nearly half, 2020 study).

### Cited Findings
- Deloitte × Google AdMob, "Quality Drives Value: A Look into Mobile Gaming Ads" (released 10 June 2025; survey of 7,000 gamers plus a 50-person diary study in BR, DE, JP, UK and US):
  - One exposure to a disruptive ad feature raised churn by **6–7%**.
  - Quitting rates **triple** when such ads appear on end-cards or reward screens.
  - Repeated exposure pushes **52%** of gamers to quit entirely.
  - **1 in 5** would abandon a favorite title over bad ad design.
  - Disruptive features are widespread in full-screen formats, rewarded included.
  - The widely cited "4:1 preference for rewarded over interstitial" figure is *not* from Deloitte (it comes from an MAF blog, unverified).
  [DATA, survey, 2025] — [PR Newswire release](https://www.prnewswire.com/news-releases/growth-in-mobile-gaming-new-global-study-from-deloitte-and-google-admob-reveals-the-link-between-mobile-ad-engagement-and-gamer-retention-302477095.html); [Deloitte press room](https://www.deloitte.com/us/en/about/press-room/deloitte-improve-mobile-game-advertising.html); [Deloitte article](https://www.deloitte.com/us/en/industries/tmt/articles/improve-mobile-game-advertising.html)
- Interstitials consistently drive higher churn than rewarded across platforms, and iOS is more sensitive (Unity AdQuality, Nov 2025). [DATA] — [PocketGamer.biz](https://www.pocketgamer.biz/what-our-data-reveals-about-ad-quality-and-player-churn-in-mobile-games/)
- Accidental clicks and unexpected ads: AdMob flags "layout encourages accidental clicks" for interstitials that load unexpectedly while a user is viewing content. Ads must appear at logical breaks, with at most 1 interstitial per 2 user actions. [POLICY] — [AdMob disallowed interstitial implementations](https://support.google.com/admob/answer/6201362?hl=en); [AdMob forum: accidental clicks violation](https://groups.google.com/g/google-admob-ads-sdk/c/6tkQZmPLNhg)
- Google Play (since 30 Sep 2022) bans ads that "show unexpectedly, typically when the user has chosen to do something else", ads at the beginning of a level, and non-closeable (>15 s) forced interstitials. [POLICY] — [Play Console Ads policy](https://support.google.com/googleplay/android-developer/answer/9857753?hl=en); [Game Developer coverage](https://www.gamedeveloper.com/business/new-guidelines-will-prohibit-google-play-devs-from-using-unexpected-advertising)
- Misleading or gated rewards on web portals:
  - Levels completable only through a rewarded ad are unacceptable.
  - Rewarded buttons must be clearly labelled, with an equally prominent no-ad option.
  - No reward if the ad fails.
  - Non-compliant games are rejected without feedback.
  [POLICY] — [CrazyGames ad requirements](https://docs.crazygames.com/requirements/ads/); [CrazyGames monetizing puzzle](https://docs.crazygames.com/resources/monetizing-puzzle/)
- Playables certification pitfalls (third-party): rewarded buttons that do not request an ad or grant a reward fail review. Test the full requested → shown → rewarded cycle in the Playables Test Suite. Off-platform payment gateways (Stripe, PayPal) or ad SDKs mean rejection. [VENDOR/UNVERIFIED] — [MediaCube Playables certification errors](https://mediacube.io/en/blog/youtube-playables-errors); [Playables.in rejection reasons](https://playables.in/youtube-playables-game-rejection-reasons/)
- Reviews: in a study of 36,309 ad-related reviews from 32 popular apps (not games-specific), nearly half of 1–3-star ad reviews complain about the **number of ads and display frequency**. [DATA, academic, 2020] — [arXiv 2008.12112](https://ar5iv.arxiv.org/html/2008.12112)
- A vendor analysis of negative reviews from 500+ apps puts ad complaints at about 18% of complaints, more prominent in F2P games. It also claims apps with ad complaints above 15% of negative reviews see download declines within 2–3 months. [VENDOR, method not published, 2026] — [Unstar 1-star review analysis](https://unstar.app/blog/why-apps-lose-users-top-reasons-from-1-star-reviews)
- Sequencing pitfall: an interstitial right after a rewarded ad (for example after a continue) undermines the experience. [ANECDOTE] — [HackerNoon: Morning Words](https://hackernoon.com/how-i-monetize-morning-words-without-interrupting-players-after-every-level)
- Unfilled ads: requests can fail (timing, adblock, low demand), and the game must continue normally. [POLICY] — [CrazyGames ad requirements](https://docs.crazygames.com/requirements/ads/)

### Inferences
- Pet Rescue's main pitfall risks, given its design:
  - (1) **A textless reward offer.** Without words, players must still understand *before* tapping that an ad will play (Poki and CrazyGames require clear labelling). Use a universal "▶ video" or TV icon on every rewarded button, and an equally prominent "no thanks" (✕).
  - (2) **The interstitial on the "next" tap.** Guard against double-tap accidental clicks, and never place it right after a rewarded flow. The 90 s rule covers this; consider making it "next break after any rewarded ad".
  - (3) **Skip-level abuse or mis-crediting.** Check that skipped levels do not grant stars or progress currency.
  - (4) **Pause and audio compliance.** Ad events must pause the game loop and mute audio; Playables certification requires it.
  - (5) **A rewarded ad that fails.** Show a clear textless "no ad available" state and do not consume the offer (for example the daily bonus puzzle attempt).
- Since Deloitte finds that disruptive ads on end-cards or reward screens triple quitting, the celebration screen should stay ad-free. The ad should come only after the player chooses "next", which is the current design.

### Gaps
- No games-specific peer-reviewed data was found linking ad frequency to star ratings.
- No public account of YouTube Playables enforcement actions (delisting or bans for ad misuse) was found.

## Q8. Synthesis for the audit: how Pet Rescue's current ad policy compares with the evidence (derived from the objective)

### Takeaway
The current policy is **safe and policy-compliant, and conservative on interstitials**. It matches or beats CrazyGames' 3-minute platform cap, Poki-style post-rewarded suppression and start-of-game grace norms. Its main weakness is **under-monetized rewarded inventory**: only 3 narrow placements, in a genre where the top placements (hints/undo) are deliberately free. The highest-expected-value changes are (1) more need-moment rewarded placements (super hint, 2× level reward or streak save, pick-your-hat) under a daily cap with diminishing returns, and (2) a controlled ≥14-day test of a modestly looser interstitial time cap (3 → 2 min), read on D7 and cumulative ad revenue per install, not ARPDAU.

### Cited Findings
- 1 midgame per 3 min is CrazyGames' enforced platform maximum, so Pet Rescue's 3-minute floor equals the strictest portal norm. [POLICY] — [CrazyGames midgame pacing](https://docs.crazygames.com/resources/midgame-ads-pacing/)
- Rewarded breaks reset the commercial-break timer on Poki, and CrazyGames adds safeguards around rewarded ads. Pet Rescue's 90 s post-rewarded suppression follows the same principle. [POLICY] — [Poki SDK overview](https://developers.poki.com/guide/sdk-overview); [CrazyGames midgame pacing](https://docs.crazygames.com/resources/midgame-ads-pacing/)
- Adding interstitials or raising frequency in tested mobile games yielded about +18% ARPDAU for about 2.3–2.5% D7 loss (ZiMAD), or "minimal" retention impact (Neon Play). [DATA, ironSource-era] — [Unity ZiMAD](https://unity.com/resources/zimad-dig-out); [Unity Neon Play](https://unity.com/resources/neon-play)
- Retention costs surface at D3–D7, and Unity recommends tests of about 2 weeks. [VENDOR] — [Playio](https://blog.playio.co/interstitial-ads-mobile-games); [is.com](https://is.com/community/academy/monetization/interstitial-and-banner-ads-best-practices)
- Rewarded engagement rises with the number of distinct placements up to about 15–20 [UNVERIFIED]. About 38% of users watch when out of resources [DATA/vendor 2024]. — [Unity 2024 report](https://unity.com/resources/mobile-growth-monetization-report-2024); [PocketGamer.biz](https://www.pocketgamer.biz/unity-global-rewarded-ad-engagement-rose-by-32-in-2023/)
- Puzzle placement guidance (hint ads with a 1-min cooldown; skip without stars; skip offers on high-churn levels; first hint free) comes from CrazyGames. [POLICY/guidance] — [CrazyGames monetizing puzzle](https://docs.crazygames.com/resources/monetizing-puzzle/)

### Inferences
Audit checklist with evidence-backed target values. All values are hypotheses to test on Pet Rescue's own data.

| Policy item | Current | Evidence range | Suggested action |
|---|---|---|---|
| Interstitial trigger | On "next" after the celebration | Natural breaks only (AdMob, Play, YouTube, CrazyGames, Poki) | Keep. Add a ~300–500 ms input guard. Optionally add biome-transition breaks |
| New-user grace | First 3 completed levels | 1 core action → 10–19 levels; CrazyGames/Poki protect game start | Keep. A/B test 3 levels vs 6 levels or ≥5 min of first-session play |
| Time cap | 1 per 3 min | 60 s (Playgama default) – ~2 min (Poki, unverified) – 3 min (CrazyGames max); 15–45 s in hyper-casual | Test 2 min (the level cap still applies) over ≥14 days |
| Level cap | 1 per 3 levels | Morning Words: every 3 levels; AdMob: ≤1 per 2 user actions | Keep. Consider dropping it after ~20 min of in-session play |
| Post-rewarded suppression | 90 s | Poki resets the timer; CrazyGames safeguards; "RV watcher gets no interstitial" pattern | Keep. Also skip the next interstitial break after any rewarded ad |
| Struggle protection | None stated | Frustration plus ad compounds churn (inference) | Skip the interstitial after repeated fails/restarts on the level just finished |
| Rewarded: skip level | After 3 min stuck, from L5 | CrazyGames: "Watch to Skip" on high-churn levels; no stars for skipped levels | Keep. Verify no stars or progress credit. Tune the trigger per level from churn data (e.g. after N restarts OR 3 min) |
| Rewarded: cosmetic hat | Random hat | Cosmetics and exclusives; reward must feel "worth the wait" | Test "choose your hat" or a 2-option pick. Use diminishing returns per day |
| Rewarded: bonus daily puzzle | 1/day | Daily or streak systems help week-1 retention; keep streaks forgiving | Keep. Add a rewarded streak save (1 per missed day) |
| Hints/undo/restart | Free | CrazyGames: hints/undo are the best puzzle rewarded slots; "first hint free" pattern | Keep basic ones free (engagement). Add a rewarded "super hint" with a ~1-min cooldown |
| Level-end reward | None stated | Between-level rewarded was the most engaged placement in 55% of games (Unity 2023) | If stars, treats or garden items exist, add "▶ ×2" on the level-complete screen. If declined, the normal capped interstitial may follow |
| Daily rewarded cap | Not stated | ~3–8 views/day before fatigue (vendor) | Add a global cap of ~6–8 rewarded views/day, with diminishing payouts on repeatables |
| Banners | None | Interstitials and banners are what segmentation guides hold back from new users; no data supports banners on Playables | Keep none |
| Failure handling | — | No reward on failure; game continues on no-fill (CrazyGames, Playables boolean) | Verify: offer not consumed on failure; textless "unavailable" state; caps counted from shown ads where possible |
| Measurement | — | Read D1/D3/D7 + cumulative ad revenue per install over ≥14 days | Instrument: per-placement offers, starts, completions, `rewardEarned`, interstitial requests vs shows, level churn, session length |

- Expected direction: rewarded additions should raise total impressions/DAU with neutral or positive retention (rewarded is preferred and less churn-inducing). An interstitial loosening trades about 1–3% relative D7 for about 10–20% more interstitial revenue (by analogy to ZiMAD and Neon Play). With YouTube's global, partly low-eCPM audience, the rewarded route is the better-evidenced lever.

### Gaps
- None of these target values has been validated on YouTube Playables specifically. YouTube's own pacing, fill and eCPM behaviour is undocumented publicly, so every row above should be treated as an A/B test hypothesis.
- No Playables A/B testing framework was found; the game would need its own random cohort assignment and analytics.
