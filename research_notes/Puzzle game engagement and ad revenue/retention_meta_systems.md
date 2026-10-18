# Retention and Meta-Game Systems in Casual Mobile and Web Puzzle Games

*Research scope: what brings players back on day 1, day 7 and day 30, and what makes sessions longer. The notes are written so each principle can be checked against "Pet Rescue: Borrow & Escape" (YouTube Playables, textless, one-finger 3D grid puzzle; no push, no IAP; 300 levels / 6 worlds, daily puzzle + streak with hats at 3/7/14 days, 3-star par ratings, pet garden with star-gated decorations, 32-animal album, 12 hats, world map, Playables cloud save).*

*Method note (important for the report writer): WebFetch failed with DNS errors (ENOTFOUND) for every domain tried in this session (investgame.net, blog.duolingo.com, docs.crazygames.com, naavik.co, public-production.gameanalytics.com). So every finding below comes from WebSearch result summaries/snippets of the cited pages, not from full-page reads. Exact wording and numbers should be treated as "reported by the search index for that URL". Where a search summary could not tie a number to a specific URL, I say so. Evidence date is given in brackets; anything before 2024 is marked as older.*

---

## 1. Benchmarks: D1/D7/D30 retention, session length and sessions per day (casual puzzle, hyper-casual, web/HTML5 portals)

### Takeaway
Mobile retention medians are low and still falling: about 22% D1 and about 3.4–3.9% D7 across all genres (GameAnalytics, 2024 data). Top-quartile games reach about 26–33% D1 and 7–8% D7, and three-quarters of games are below 3% at D28. Puzzle is consistently one of the best genres for medium- and long-term retention, but no primary source published a current puzzle-only table. Web portals use lower bars: CrazyGames calls 10–15% D1 "strong". Poki judges games on early-session retention (first ~3 minutes), "Pure Game Time" and D1/D3/D7 against top performers. Puzzle sessions are short (typically 4–7 minutes per session in older data), so retention comes from more sessions per day and more days played, not from long sittings.

### Cited Findings
**Mobile, all genres (GameAnalytics)**
- GameAnalytics 2025 Mobile Benchmarks (data through end of 2024): about 11,600 games, 9 regions, iOS and Android, 16 genres, *classic* (not rolling) retention. Median D1 is about 22%; median D7 is about 3.4–3.9% — [GameDev Reports summary of GameAnalytics 2025](https://gamedevreports.substack.com/p/gameanalytics-mobile-gaming-benchmarks)
- Same report: top-25% D1 is 31–33% on iOS and 25–27% on Android (about 26.5–27.7% blended at end of 2024); top-25% D7 is 7–8%; 75% of projects have D28 retention below 3% — [GameDev Reports summary](https://gamedevreports.substack.com/p/gameanalytics-mobile-gaming-benchmarks)
- GameAnalytics 2026 report (data for 2025): baseline D1, D7 and D30 retention "continued to decline in 2025". A search summary says this edition gives no genre-level benchmarks while genre categorization is reworked (not verified on page) — [GameAnalytics 2026 Mobile & PC Benchmarks](https://www.gameanalytics.com/reports/2026-mobile-pc-gaming-benchmarks)
- GameAnalytics (2019, older): "the best genres for medium and long-term retention are board games, card games, puzzles, and casino games" — [GameAnalytics H1 2019 Benchmarks PDF](https://progamedev.net/wp-content/uploads/2019/07/Benchmarks2019.pdf)
- Adjust (via a secondary compilation): average all-genre D1 retention was 27% in 2025 — [Genzopia, citing Adjust](https://www.genzopia.com/blog/hyper-casual-games-statistics-2026)

**Puzzle-specific (secondary, lower confidence)**
- Blog tables in 2026 give puzzle at about 31.85% D1, 12.18% D7 and 5.35% D30, with no clear primary attribution. Search summaries flagged this explicitly as unattributed — [Segwise 2026 benchmarks blog](https://segwise.ai/blog/mobile-gaming-app-user-retention-strategies) (attribution to this exact page is uncertain; treat as LOW confidence)
- Another compilation gives puzzle D1 28–32%, D7 9–12% and D30 3.5–5%, attributed to AppsFlyer genre data from 2022–2023 (older; secondary) — [AppAgent retention benchmarks](https://appagent.com/blog/mobile-game-retention-benchmarks/) / [Game Growth Advisor 2026](https://gamegrowthadvisor.com/blog/2026-03-17-mobile-game-retention-strategies-2026/) (the search could not say which of these pages carries the AppsFlyer table)
- Real A/B-test data point (Cookie Cats, a casual puzzle game; public dataset of 90,189 installs, about 2018, older): D1 retention was about 45% and D7 about 19% in both test arms (first progress gate at level 30 vs level 40) — [Virtual Worlds Economies: Cookie Cats A/B test](https://virtualworldseconomies.substack.com/p/ab-testing-cookie-cats-mobile-game); method walkthrough at [Henkel Data & Analytics (Medium)](https://medium.com/henkel-data-and-analytics/introduction-to-bayesian-a-b-testing-comparing-player-retention-in-a-mobile-game-50514ae5135d)

**Hyper-casual (secondary compilations)**
- Hyper-casual D1 is about 20–40% depending on source; top titles reach about 38–40% (Sensor Tower data compiled by AppAgent). D7 medians are about 3–5% (8–12% for strong titles). D30 is about 1.4–4%, often below 2% — [AppAgent](https://appagent.com/blog/mobile-game-retention-benchmarks/); [Genzopia](https://www.genzopia.com/blog/hyper-casual-games-statistics-2026)
- Hybrid-casual was the only casual segment whose in-app revenue grew in 2025 (+20%), with hybrid-casual puzzle the standout (Sensor Tower/AppMagic via Cinevva). This suggests that adding meta/progression to hyper-casual cores is where the market moved — [Cinevva casual trends 2026](https://app.cinevva.com/guides/casual-games-trends-2026)

**Session length, playtime, sessions per day**
- GameAnalytics-based 2021 data (older): puzzle session length is 7 minutes (top 25%), 4 minutes (median) and 3 minutes (bottom 25%). Puzzle daily playtime is about 30 minutes (top 25%), 14 minutes (median) and 8 minutes (bottom 25%) — reported in search summaries of [Udonis Puzzle Games Report](https://www.blog.udonis.co/mobile-marketing/mobile-games/puzzle-games-report) / [AppFollow benchmark interview](https://appfollow.io/blog/mobile-game-analytics-with-ioana-hreninciuc) (exact page attribution uncertain)
- Adjust reports puzzle "session" time rising from 23.89 minutes (2023) to 24.48 minutes (2024). That is far above the GameAnalytics figures and is probably a different metric (daily time per user) — [Adjust: puzzle games trends](https://www.adjust.com/blog/puzzle-games-trends-strategies/)
- Median daily playtime across all games in 2024 was 22 minutes (GameAnalytics, via search summary) — [GameDev Reports summary](https://gamedevreports.substack.com/p/gameanalytics-mobile-gaming-benchmarks)
- General mobile figure: 4–6 sessions per day; no puzzle-specific source was found — [Udonis Puzzle Games Report](https://www.blog.udonis.co/mobile-marketing/mobile-games/puzzle-games-report) (search summary; LOW confidence)
- A benchmark of 10 minutes average Day-0 playtime is called "excellent" (derived from a Google Play report) — [Elite Game Developers: Advanced Retention Metrics](https://elitegamedevelopers.substack.com/p/retention-metrics-in-free-to-play)

**Web / HTML5 portals**
- CrazyGames docs: "strong games often achieve 10–15% Day 1 Retention". The move from Basic Launch to Full Launch is judged on average playtime, conversion to gameplay and retention, benchmarked against other games on the platform. Basic Launch runs until the game has been live at least 7 days with 500 plays, or ends after 21 days — [CrazyGames Basic Launch Guide](https://docs.crazygames.com/resources/basic-launch-metrics/)
- Poki (Google AdMob interview, about 2022, older): Poki tracks a custom "Pure Game Time" metric that excludes ads and loading, plus 1st-, 3rd- and 7th-day retention benchmarked against top performers — [Google AdMob blog: How Poki tests games](https://blog.google/products/admob/app-monetization-insights-how-poki/)
- A Poki developer-relations specialist: "Retention: Do players stay? Do they come back? This is the single most important metric." They stress the first three minutes — [IndieGameBusiness](https://indiegamebusiness.com/web-gaming-for-indie-developers/)
- No single published retention number applies across portals; each runs its own staged test on playtime, session length, conversion to play and return visits — [Playgama: web portal retention benchmarks](https://playgama.com/blog/business-faqs/what-player-retention-benchmarks-define-success-on-web-game/)
- YouTube Playables: third-party guides suggest sustaining about 10-minute sessions. This is advice, not a platform rule — [playables.in requirements guide](https://playables.in/youtube-playables-requirements/)

### Inferences
- For an HTML5 game on an in-feed platform, a realistic first target is the web-portal bar (D1 of 10–15% or more), with mobile casual puzzle top quartile (about 30% D1, 7–12% D7, about 5% D30) as a stretch. Web D1 is structurally lower than mobile D1 because there is no install commitment and no home-screen icon.
- Puzzle sessions are short (median about 4 minutes in older data). Pet Rescue should optimise for **sessions per day × days retained**, not single-session length. A 3–5 level "session arc" that ends on a meaningful unlock fits the genre norm.
- Benchmarks must use the same definition (classic vs rolling retention). Any Pet Rescue analytics should log classic D1/D7/D30 so the numbers are comparable to GameAnalytics.

### Gaps
- No current (2025–2026) primary, puzzle-only D1/D7/D30 table was retrievable. The GameAnalytics 2025 genre tables are behind a lead form, and the 2026 edition reportedly omits genres. Sensor Tower and data.ai puzzle retention figures were not found in open sources.
- No published YouTube Playables retention or session benchmarks were found. No Poki numeric thresholds are public; a "25% of testers play at least 3 minutes" figure circulates but comes from one unverified developer account.
- No puzzle-specific sessions-per-day figure was found.

---

## 2. Which meta layers measurably improve retention in puzzle games?

### Takeaway
Published *quantified* effects of individual meta layers (decorate, collections, cosmetics, maps, events) are almost nonexistent. Studios keep them private. The strongest public signal is qualitative but consistent. For tight puzzle cores (Royal Match), the **puzzle itself is the main retention driver**. A *light* decorate/area meta beat "no meta" and "episode meta" in Dream Games' internal tests (per Naavik), mainly for revenue. **Win streaks and limited-time events** are seen as stronger retention levers than decoration. Collections and albums are monetization and event engines in IAP games, but no retention data was found. Daily-puzzle habits (NYT) are the best-documented retention model for no-IAP games.

### Cited Findings
**Decorate / renovate meta**
- Deconstructor of Fun (2021, older) on Royal Match: the game's appeal is mainly the puzzle, not the meta. They class it "puzzle & decorate lite": a Coin Master-style decoration meta with pre-set item locations and no customization. They argue that more event types would raise session length and ideally cut churn, because the meta is light — [DoF: Royal Match, the New King from Turkey?](https://www.deconstructoroffun.com/blog/2021/3/21/royal-match-the-new-king-from-turkey)
- Naavik: Dream Games reportedly ran A/B/C tests on the meta, including a "no meta" variant and an "episode meta" variant, and kept the light decoration system. Naavik describes the current design as an "area meta with tasks" that "is clearly contributing to Royal Match's highly competitive RPD" (revenue per download, a monetization metric, not retention) — [Naavik: The Royal Blueprint](https://naavik.co/digest/why-dream-games-success-is-a-challenge-to-replicate/); [Naavik deep dive: Royal Match](https://naavik.co/deep-dives/royal-match/)
- Naavik (counterpoint): the decoration meta "most likely won't move the needle in terms of long-term retention", and "players care less and less about potential meta features the closer one gets to classic match-3" — [Naavik: The Royal Blueprint](https://naavik.co/digest/why-dream-games-success-is-a-challenge-to-replicate/) (search summary; the exact Naavik article for this quote is uncertain among the linked Naavik pieces)
- Deconstructor of Fun (2023, older) on Royal Kingdom: decoration is reworked as an isometric map split into districts. The win streak is "a bigger reward driver than the decoration itself" — [DoF: Royal Kingdom](https://www.deconstructoroffun.com/blog/2023/05/09/royal-kingdom-will-it-usurp-the-throne)
- Gardenscapes (Mobile Free To Play, older): Playrix kept the narrative and decoration layer from the earlier hidden-object version when it pivoted to match-3, which set it apart. Match-3 balancing where losers "come close to winning" is described as the recipe for retention and monetization — [Mobile Free To Play: Deconstructing Gardenscapes](https://mobilefreetoplay.com/deconstructing-gardenscapes/); see also [PocketGamer.biz](https://www.pocketgamer.biz/comment-and-opinion/65810/deconstructing-gardenscapes-success/)
- Udonis (secondary, opinion): a Playrix research finding says most Gardenscapes players come from audiences of genres with light narrative and customization. The underlying Playrix research was not found. Decorations cannot be bought directly and progress only through core play, which ties the meta to the core loop — [Udonis: Playrix overview](https://www.blog.udonis.co/game-publishers/playrix)

**Events, win streaks, weekly loops**
- Deconstructor of Fun (2024): "Win Streak: the Gift That Keeps on Giving". Win-streak-focused events are "certainly more effective" for retention "than the more intrinsic and easily-capped features" (opinion piece; no test data) — [DoF: Win Streak](https://www.deconstructoroffun.com/blog/2024/8/5/win-streak-the-gift-that-keeps-on-giving)
- GameRefinery (April 2025): Royal Match added "Puzzle Break", a limited-time event where standard levels earn puzzle pieces. GameRefinery frames it as driving retention and engagement *with the core mechanic* — [GameRefinery Market Review April 2025](https://www.gamerefinery.com/mobile-game-market-review-april-2025/)
- GameRefinery (2025): Triple Match 3D turned its win-streak event into a solo version with three difficulty tiers — [GameRefinery Market Review (2025 bulletins)](https://www.gamerefinery.com/mobile-game-market-review-march-2025/) (exact month uncertain)
- GameRefinery (September 2025): a weekly progression layer that penalizes missed weeks is described as "a great retention loop that is sure to benefit both a player's progression and the game's overall health metrics" (analyst opinion) — [GameRefinery Market Review September 2025](https://www.gamerefinery.com/mobile-game-market-review-september-2025/)

**Market context**
- Sensor Tower via Naavik: mobile puzzle games earned more than $10B in IAP in 2025 (+14% YoY), the second-highest-grossing genre. Royal Match earned more than $1.4B and Candy Crush Saga more than $1.1B — [Naavik: What leading match-3 & merge games do differently](https://naavik.co/digest/what-leading-match-3-and-merge-games-do-differently/)

**Collections / albums**
- Monopoly GO sticker albums: set completion gives big rewards and full-album completion gives "massive" rewards plus a token. Albums have a deadline. Duplicates can be traded with friends. Leftover extras do not carry over to the next album. One album held 216 stickers, including 27 gold — [TheGamer: Sticker Albums FAQ](https://www.thegamer.com/monopoly-go-sticker-albums-faq-complete-guide/); [SuperCheats album list](https://www.supercheats.com/monopoly-go-walkthrough-guide/monopoly-go-monopoly-ever-after-album-sticker-list-all-sets)
- Analysis essay (opinion): the album deadline "creates completion pressure with an expiry date", and trading "converted sticker collection from a solo grind into a social obligation network" — [Tech-Insider: Monopoly Go sticker economy](https://tech-insider.org/monopoly-go-sticker-economy-mobile-monetization/)

**Daily challenges (see Section 4 for detail)**
- NYT Games treats daily habit as its retention model. It tracks users who play every day for 7 days and for 30 days as signs of a strong game. "Retention is king" — [Nieman Lab (2023)](https://www.niemanlab.org/2023/09/the-new-york-times-finds-a-match-with-the-word-game-connections/)

### Inferences
- The evidence supports Pet Rescue's current approach of a **light meta tied to core performance** (garden decorations unlocked by stars, like Playrix's non-purchasable decorations). It warns against expecting the garden or album to carry retention alone. The puzzle quality, difficulty curve and the daily habit will matter more.
- The biggest missing lever, measured against what top puzzle games run, is **recurring, time-boxed content that uses the core loop**: win-streak runs, weekly "event" level sets, Puzzle-Break-style collect-pieces events. Pet Rescue has no IAP, so these would pay out cosmetics, garden items or album entries rather than boosters.
- The album (32 species with rescue counts) works as a collection, but the IAP-game album mechanics (sets, set-completion rewards, rarity) are what create pull. Grouping species into themed sets, one per world, each with a completion reward (a hat or decoration), would convert it into a goal-gradient structure (Section 5).
- Area meta "with tasks" (Royal Match) suggests that garden decorations shown as a visible task list ("3 more stars → bench") are stronger than silent unlocks.

### Gaps
- No public A/B results quantify the retention lift of a decorate meta, collections, cosmetics, world maps or chests in puzzle games. Dream Games' meta test is reported only qualitatively, and as RPD.
- No collection-completion-rate data (share of players finishing an album) was found for any game.
- No GameRefinery feature-penetration statistic (e.g., "% of top-grossing puzzle games with collections") was retrieved.
- No quantified retention data on seasonal content in puzzle games was found.

---

## 3. Streak design: Duolingo, Wordle, Snapchat; freeze and repair, loss aversion, burnout, rewards

### Takeaway
Streaks are among the best-evidenced retention mechanics. Duolingo has run 600+ streak experiments and reports relative lifts such as +14% D7 (Streak Wager) and +3.3% D14 (separating the daily goal from the streak). Academic work (Silverman & Barasch, JCR 2023) shows that **seeing an intact streak raises future engagement, while a broken streak causes drop-off**. The damage is worse when players blame themselves and smaller when they can **repair** the streak. Best practice is therefore forgiveness: freezes (2–3 is better than 1, per Duolingo), repair windows, weekend leniency, and never shaming a broken streak. Evidence of streak *burnout* is mostly correlational (Snapchat teen surveys) but consistent: pressure, FOMO and distress when streaks are lost.

### Cited Findings
**Duolingo (company data; dates of the blog posts not verified, likely 2020–2023)**
- Separating the daily goal from the streak raised Day-14 retention by 3.3%, daily active learners by 1%, and the share of daily learners on a streak by 10.5% (all relative). The 10.5% rise came within 20 days — [Duolingo blog: Improving the streak](https://blog.duolingo.com/improving-the-streak)
- For new learners, the share with a streak rose about 19% (secondary report of the same Duolingo post) — [Viblo (secondary)](https://viblo.asia/p/duolingo-streak-vi-sao-nguoi-hoc-co-giu-chuoi-ymJXDZ0qJkq)
- Streak Wager (bet gems on keeping a streak): learners offered it returned more often and completed more lessons, with D7 retention +14% — [Duolingo blog: How streaks keep learners committed](https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/)
- Weekend Amulet was A/B tested because daily active users drop by as much as 5–10% on weekends. Results were not in the excerpts — [Duolingo blog: How streaks keep learners committed](https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/)
- Streak freezes: going from 1 equipped freeze to a maximum of 2–3 "significantly improved user return rates". The difference between 3 and 2 "wasn't actually that large" (third-party summary of a Duolingo PM talk) — [Elsewhere/Linear Capital: How Duolingo built streaks](https://elsewhere.news/en/linearcapital/duolingobolt)
- An unsourced third-party claim says Streak Freeze "reduced churn by 21%". There is no primary source; treat with caution — cited in [Orizon blog](https://www.orizon.co/blog/duolingos-gamification-secrets) (search summary)
- Mechanics: a freeze must be acquired *in advance* of the missed day. A streak repair can be bought with gems after a miss — [Duolingo Help Center: What is a streak?](https://www.duolingo.com/help/what-is-a-streak)
- Lenny's Podcast (December 2024) with Jackson Shuttleworth (Group PM, Retention): 600+ streak experiments in about 4 years (roughly one every other day). The biggest win cited was changing the call to action from "Continue" to "Commit to my goal". Testing focuses on the first 0–7 days. Summaries add that retention effects plateaued by day 7, and they list streak pausing and balancing "perfect streak" rewards against leniency (flexibility vs integrity) — [Transcript on GitHub](https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/jackson-shuttleworth/transcript.md); [Lenny's Newsletter](https://www.lennysnewsletter.com/p/behind-the-product-duolingo-streaks); [Podwise summary](https://podwise.ai/dashboard/episodes/2514316); [Deepcast summary](https://deepcast.fm/episode/behind-the-product-duolingo-streaks-jackson-shuttleworth-group-pm-retention)
- Lenny Rachitsky (opinion): streaks are "the single biggest driver of Duolingo's growth to a $14 billion business" — [Lenny on X](https://x.com/lennysan/status/1868330119833813056)

**Academic: streaks and broken streaks**
- Silverman & Barasch, "On or Off Track: How (Broken) Streaks Affect Consumer Decisions", *Journal of Consumer Research* (2023), 7 studies. Intact streaks highlighted in behavior logs increase subsequent engagement compared with broken streaks, *independent of actual past behavior*. The effect is amplified when consumers attribute the break to themselves and attenuated when they can "repair" the streak. The authors advise against "you broke your streak" messaging and suggest alternate ways to keep streaks going — [CU Boulder Leeds research summary](https://www.colorado.edu/business/faculty-research/2023/04/19/or-track-how-broken-streaks-affect-consumer-decisions); [UDel repository](https://udspace.udel.edu/items/42ce576b-8e1f-429a-8541-e29e48dbcfbb)
- In one experiment, participants *told* they had intact streaks were much more motivated, even though their actual game play was identical. People "drop off once their streaks are broken" — [UDaily (2024)](https://udel.edu/udaily/2024/march/power-of-streaks-motivation-jackie-silverman); [CU Boulder news](https://www.colorado.edu/business/news/2023/04/20/research-streaks-marketing-tech-barasch)

**Streak pressure and burnout (mostly correlational or anecdotal)**
- An Egyptian survey of teens (2025) found late-night app use, prioritizing streaks over sleep or study, and emotional distress (disappointment, sadness) when Snapchat streaks were lost — [MJSM journal article](https://mjsm.journals.ekb.eg/article_422365.html)
- Anecdote: middle-school girls called Snapstreaks "exhausting" and "way too much pressure", driven by fear of letting friends down — [Girls Leadership / MEDIAGIRLS](https://girlsleadership.org/blog/mediamondaytip-how-grown-ups-can-help-girls-stressed-out-by-snapstreaks/)
- An adolescent thesis (2022) found that high emphasis on snapstreaks correlated with higher FOMO; COVID limited data collection — [EKU thesis](https://encompass.eku.edu/etd/689)
- Wordle (2025): the hardest Wordle of the year ("BONGO", 14 May) "snapped 36,337 streaks". Streak loss is a salient, reported event even at NYT — [TODAY](https://www.today.com/popculture/hardest-wordle-connections-puzzle-2025-new-york-times-games-rcna251022)

### Inferences
- Pet Rescue's streak (hats at 3/7/14) should be checked for these points:
  - (a) **A forgiveness mechanic.** Earned freezes, e.g., one banked per 7 days, max 2–3, per Duolingo's 2–3 finding. Or a repair window (play yesterday's daily today to restore). Silverman & Barasch show that repair attenuates drop-off.
  - (b) **No shame messaging** on a break. Show "best streak" and "new streak started" instead.
  - (c) **Rewards beyond day 14.** Goal-gradient research shows effort drops after a reward and only re-accelerates when the next goal is visible (Section 5). After 14 days the streak may have no next target. Add milestones at 21/30/50/100, or recurring cosmetic tiers.
  - (d) **The daily goal kept separate from the streak.** Duolingo's +3.3% D14 came from decoupling them. Keeping the streak alive should take one daily-puzzle completion, not a 3-star result.
  - (e) **Hard-day protection.** Wordle's BONGO day broke tens of thousands of streaks through *failure*, not absence. Pet Rescue should decide explicitly whether failing or abandoning the daily breaks the streak. The forgiving option is that any completed attempt (any star count) keeps the streak, since the game has no lose state beyond being over par.
- Duolingo's finding that lifts concentrate in days 0–7 suggests the 3-day hat is the most important milestone. It should be reachable quickly and be visible from the first session.
- Without notifications, Pet Rescue cannot send Duolingo-style "streak saver" reminders. The streak must be surfaced inside the game (title screen, end-of-level screen), and the forgiveness mechanic matters more because players cannot be reminded.

### Gaps
- No primary Duolingo figure for the retention effect of streak freezes or streak repair specifically, nor the Weekend Amulet result.
- No study measures streak *burnout* causally. A 2023 Belgian survey (Van Essen & Van Ouytsel, n=2,483 adolescents) was referenced in search summaries, but its URL was not retrieved; it reportedly found only weak correlations with FOMO and problematic phone use.
- No game-specific (as opposed to app) streak A/B data in puzzle games was found.

---

## 4. Daily puzzle and "same puzzle for everyone" effects (Wordle, NYT Games): sharing, social comparison, emoji results

### Takeaway
A single shared daily puzzle combines scarcity (one per day), a common reference point for social comparison, and spoiler-free shareable results. Wordle's emoji grid turned it from about 90 players (November 2021) into millions of daily players within about three months. NYT now runs over 11 billion puzzle solves a year (2025). NYT judges new games by retention (players who play 7/7 and 30/30 days) and by the *share* of players posting results.

### Cited Findings
- Wordle launched in October 2021. It had about 90 players in November 2021. The emoji share was copied from New Zealand players who typed coloured squares to show their solve path without spoilers; Wardle automated it as a clipboard grid. It is described as the catalyst for virality. Growth: from under 1,000 to about 2 million players over weeks, or about 300,000 in early January 2022 to over 2 million by month's end. Nearly 10 million daily players were reported by February 2022. Sources disagree on exact timing and counts — [CUNY Pressbooks: The Wordle Effect](https://pressbooks.cuny.edu/inspire/part/the-wordle-effect-how-five-letters-changed-the-internet/); [Syntax.fm interview with Josh Wardle (2022)](https://syntax.fm/show/430/creator-of-wordle-josh-wardle/transcript)
- NYT bought Wordle in late January 2022 for a "low seven figures". Wordle brought "tens of millions" of new users to NYT (2022, older) — [TechCrunch (May 2022)](https://techcrunch.com/2022/05/04/wordle-new-york-times-user-growth); [AOL](https://www.aol.com/news/wordle-brought-tens-millions-users-150000203.html)
- NYT Connections (2023, older): head of games Jonathan Knight cited the volume of new daily users, many arriving via search (organic virality), and was impressed by the percentage of users sharing results. Connections was NYT's second most popular game shortly after its beta. NYT evaluates games on reach, but "retention is king", and tracks players who play every day for 7 and 30 days. Subscribers who use both news and games in a week are more likely to stay subscribed — [Nieman Lab (September 2023)](https://www.niemanlab.org/2023/09/the-new-york-times-finds-a-match-with-the-word-game-connections/)
- Knight: "the news can be kinda lumpy", while "games are a daily habit" — [Aftermath](https://aftermath.site/new-york-times-wordle-connections-puzzmo-games/)
- Scale (2025): more than 11.2 billion puzzles solved on NYT Games, including 4.2B Wordle, 1.6B Connections, 1.5B Strands, 1.4B Mini, 667M Spelling Bee and 612M Pips (new in 2025). TODAY's exclusive cites NYT; there is no NYT press release — [TODAY (December 2025)](https://www.today.com/popculture/hardest-wordle-connections-puzzle-2025-new-york-times-games-rcna251022)
- Social ritual: over 140,000 #wordle videos. Everyone doing the same daily puzzle lets people check in with friends and family every day — [Dazed](https://www.dazeddigital.com/life-culture/article/62601/1/are-puzzles-cool-now-gen-z-nyt-connections-strands-mini-wordle)

### Inferences
- Pet Rescue's daily puzzle should be **the same for every player on a given date**: seeded by UTC or local date, chosen from a curated pool. The result should be expressible as a textless, spoiler-free share card, e.g., an emoji line for moves vs par, stars, and pets rescued (🐾⭐⭐⭐ 12/10). This suits a textless game, because emoji grids are language-independent.
- A Wordle-style **one attempt / one result per day** design, with a visible "next puzzle in hh:mm" countdown, creates the scarcity and "come back tomorrow" cue without notifications.
- Social comparison does not need a backend. Showing "your moves vs par" plus a personal history (a distribution of past daily results, like Wordle's guess distribution) gives a self-comparison loop. A global "% of players solved at par today" would need server data, which is a platform gap.
- A daily-specific cosmetic or album entry (e.g., a "daily visitor" pet that only appears via the daily) would make the daily mode carry meta progress too.

### Gaps
- No data was found on what share of Wordle or Connections players share results, or on the retention difference between sharers and non-sharers.
- It is unknown whether YouTube Playables allows clipboard or share actions from inside the game frame (official docs at developers.google.com could not be fetched). This should be checked before designing a share card.
- No evidence was found on the optimal daily-puzzle difficulty, or on whether failing should end the attempt.

---

## 5. Reward schedules: variable vs fixed rewards, near-miss and goal-gradient effects, next-unlock visibility, Zeigarnik, collection completion

### Takeaway
Three effects are robust in the literature and directly usable:
1. **Goal-gradient**: effort and visit frequency rise as a visible goal approaches, drop after the reward, and re-accelerate toward the next goal. Artificial head starts speed completion.
2. **Motivating uncertainty**: uncertain rewards can drive more effort than certain ones of equal or higher value.
3. **Near-misses** in casual puzzle games raise arousal and the urge to continue, but also frustration.

The famous Zeigarnik "memory for unfinished tasks" effect did **not** hold up in a 2025 meta-analysis. The related **Ovsiankina effect** (a tendency to *resume* interrupted tasks) did. No collection-completion-rate data was found.

### Cited Findings
- Kivetz, Urminsky & Zheng (2006, *Journal of Marketing Research*; older but foundational): café customers bought coffee more often as they neared a free coffee. Customers given a 12-stamp card with 2 pre-filled "bonus" stamps finished the 10 required purchases faster than those with a plain 10-stamp card (illusory head start). On a music-rating site, users visited more often, rated more songs per visit and were **less likely to end a session** as they neared the reward threshold. Engagement dropped after the first reward and re-accelerated toward the second. The effects were not explained by habituation, expiration concerns or heterogeneity — [Columbia Business School research page](https://business.columbia.edu/faculty/research/goal-gradient-hypothesis-resurrected-purchase-acceleration-illusionary-goal); [paper PDF](https://business.columbia.edu/sites/default/files-efs/pubfiles/1200/goalgradient.pdf)
- The goal-distance model: effort is a function of the *proportion* of the original distance remaining — [Columbia Business School insights](https://business.columbia.edu/insights/chazen-global-insights/goal-gradient-hypothesis-resurrected-purchase-acceleration)
- Shen, Fishbach & Hsee (2015, *Journal of Consumer Research*): people invested more time, money and effort for an uncertain reward than a certain one. For example, more participants finished drinking 1.4 L of water in 2 minutes for a coin-flip chance at $1 or $2 than for a sure $2. The effect appears even when the uncertain reward is worse in expectation. The mechanism is the excitement of resolving uncertainty during pursuit — [Chicago Booth Review](https://www.chicagobooth.edu/review/uncertainty-can-improve-motivation); [PsyPost](https://www.psypost.org/chance-as-a-motivator-uncertainty-can-make-people-work-harder/)
- Larche, Musielak & Dixon (*Journal of Gambling Studies*, 2016/2017; older): 60 avid Candy Crush players played for 30 minutes. Near-misses produced higher heart rate and subjective arousal than losses, were the most frustrating outcome, and triggered the strongest urge to continue playing. The authors link this to players playing longer than intended — [PMC: The Candy Crush Sweet Tooth](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5445157/); [Springer](https://link.springer.com/article/10.1007/s10899-016-9633-7)
- Gardenscapes balancing where losing players "come close to winning" is cited as a retention and monetization recipe (analyst opinion) — [Mobile Free To Play](https://mobilefreetoplay.com/deconstructing-gardenscapes/)
- Zeigarnik / Ovsiankina meta-analysis (2025, *Humanities and Social Sciences Communications* / Palgrave Communications, vol. 12): "No memory advantage for unfinished tasks was found, but there was a general tendency to resume tasks." The Zeigarnik effect "lacks universal validity" — [IDEAS/RePEc record](https://ideas.repec.org/a/pal/palcom/v12y2025i1d10.1057_s41599-025-05000-w.html); [Bern thesis](https://boristheses.unibe.ch/4796/). Secondary blogs cite a resumption rate of about 67% (not verified) — [Yu-kai Chou](https://yukaichou.com/behavioral-analysis/zeigarnik-effect-incomplete-tasks-memory-tension/)
- Older replications of Zeigarnik's experiment in other countries failed to find recall differences — [Wikipedia: Zeigarnik effect](https://en.wikipedia.org/wiki/Zeigarnik_effect)
- Win streaks (rewards grow with consecutive wins and reset on a loss) are described as raising the value of every win — [iLogos puzzle design guide](https://ilogos.biz/puzzle-game-development-guide-mastering-design-and-creation/); [DoF Win Streak (2024)](https://www.deconstructoroffun.com/blog/2024/8/5/win-streak-the-gift-that-keeps-on-giving)

### Inferences
- **Next-unlock visibility** is the most direct application of the goal-gradient. Every end-of-level screen in Pet Rescue should show progress toward the nearest goal: stars to the next garden decoration, rescues to the next album entry or set, levels to the next world, days to the next streak hat. Use a progress bar, not just a number.
- **Head start**: start the first garden goal or album set partly filled (e.g., the tutorial rescue counts), and avoid empty meters on day 1.
- **Post-reward slump**: immediately show the *next* goal after each unlock, as Kivetz's data shows engagement drops after a reward. This applies particularly after the 14-day hat, after 32/32 album completion and after level 300.
- **Variable rewards without dark patterns**: a small surprise element, such as a random pet reaction, an occasional bonus decoration or a mystery hat colourway, can add motivating uncertainty. In a no-IAP game this is far less ethically fraught than loot boxes, but it should stay cosmetic and never gate progress.
- **Near-miss**: par-based stars naturally create near-misses ("1 move over par → 2 stars"). The research suggests this drives "one more try" replays. Showing "1 move from ⭐⭐⭐" and offering an instant retry is the benign version. Do not engineer fake near-misses.
- "Unfinished business" hooks (an unfinished garden, a partly filled album) are better justified by the *resumption* tendency (Ovsiankina) and the goal-gradient than by Zeigarnik memory claims. The report should not cite Zeigarnik as established.

### Gaps
- No published completion rates for in-game collections or albums were found. It is unknown what share of players finish a 30–40 item collection in casual games.
- No game-specific A/B evidence was found comparing fixed vs variable reward schedules for retention in puzzle games.
- No sample sizes or effect sizes were retrieved for Kivetz et al. or Shen et al.; the full texts could not be fetched.

---

## 6. Return hooks without push notifications (web and in-feed platforms)

### Takeaway
Without push, return hooks must be **in-game and calendar-based**: a daily reset (daily puzzle and streak), time-boxed or rotating content (weekly events, win-streak runs), visible "next unlock" and "tomorrow" teasers, and reliable progress persistence so a returning player resumes instantly. Energy and timers are an option, but academic work classes "appointment play" as a temporal dark pattern. No quantified evidence was found for web platforms. YouTube Playables requires saving progress through its cloud-save API at meaningful milestones, which is the precondition for any multi-day loop.

### Cited Findings
- YouTube Playables official integration requirements: the game must call `saveData` when the player makes meaningful progress (e.g., a level change), must not use any other save mechanism, and must await `loadData` before saving (early saves are rejected). It must handle cloud saves from earlier versions without crashing. The final save on exit is best-effort, capped at 64 KiB — [Google: Playables integration requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements_integration) (search snippet; page not fetched)
- Third-party summary: save data must stay below 3 MiB and should stay below 500 KiB. Use onPause/onResume rather than the Page Visibility API — [PortalReady: YouTube Playables](https://portalready.world/portals/youtube-playables/)
- No platform rule requires daily content or re-engagement features; third-party guides only *suggest* achievements and daily rewards — [playables.in](https://playables.in/youtube-playables-requirements/); [Playgama wiki: Playables requirements](https://wiki.playgama.com/platforms/youtube-playables-requirements-for-games)
- NYT's daily-habit model (one puzzle per day, retention measured as 7/7 and 30/30 daily play) works largely through organic habit and sharing rather than push — [Nieman Lab (2023)](https://www.niemanlab.org/2023/09/the-new-york-times-finds-a-match-with-the-word-game-connections/)
- A weekly progression layer that penalizes missed weeks was called a "great retention loop" (GameRefinery, September 2025, analyst opinion) — [GameRefinery](https://www.gamerefinery.com/mobile-game-market-review-september-2025/)
- Time-boxed events using standard levels (Royal Match Puzzle Break, April 2025) — [GameRefinery](https://www.gamerefinery.com/mobile-game-market-review-april-2025/)
- Duolingo: weekend activity drops 5–10%, which motivated the Weekend Amulet (leniency rather than pressure) — [Duolingo blog](https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/)
- Progress gates as a lever: in Cookie Cats, moving the first gate from level 30 to level 40 changed D7 retention. D1 was about 45% and D7 about 19% in both arms, and the commonly reported conclusion is that the later gate did *not* improve and slightly lowered D7. Exact per-group values were not verified in this session — [Virtual Worlds Economies](https://virtualworldseconomies.substack.com/p/ab-testing-cookie-cats-mobile-game); [Henkel (Medium)](https://medium.com/henkel-data-and-analytics/introduction-to-bayesian-a-b-testing-comparing-player-retention-in-a-mobile-game-50514ae5135d)
- Appointment play ("forces players to return to a game daily in order to complete quests") is classed as a *temporal* dark pattern (Zagal, Björk & Lewis, 2013, older), alongside grinding — [arXiv 2412.05039: Dark patterns in mobile games](https://arxiv.org/html/2412.05039v1)
- Anecdote: one game's moving its daily-reward *notification* from morning to lunchtime reportedly raised D7 by 18%. There is no source or sample; it is only relevant as a hint that the timing of the daily reset matters — [FeatureUpvote: game retention](https://featureupvote.com/blog/game-retention/) (search summary; LOW confidence)

### Inferences
- For Pet Rescue, the viable no-push return hooks, in order of evidence strength:
  1. **The daily puzzle and streak**, with a forgiving streak and a visible countdown to the next daily.
  2. A **visible next goal** across all meta layers (goal-gradient).
  3. **Rotating time-boxed content**, such as a weekly themed level set or a weekend "rescue rush" win-streak run, giving a reason to come back that is not just the next campaign level.
  4. A **"tomorrow" teaser** at session end, e.g., a silhouette of tomorrow's daily visitor pet or a garden item "arriving tomorrow".
  5. **Instant resume**: cloud save at every level completion, so the player lands exactly where they left off.
- Energy/lives systems are not recommended. Without IAP they add friction with no monetization upside, and Zagal et al. classify appointment-style forcing as a dark pattern. If any timer is used, make it a *bonus* (e.g., "the garden pet left you a gift — collect tomorrow"), not a block.
- The daily reset time should be consistent and explicit, shown as a countdown in-game. Cloud save must store the last-played date and streak state, and must handle time-zone or clock changes so streaks are not unfairly broken.

### Gaps
- No quantified evidence was found on return hooks for web, HTML5 or in-feed platforms specifically (e.g., D7 lift from daily rewards on Poki or CrazyGames).
- It is unknown whether YouTube surfaces "continue playing" or recently played Playables to returning users, which would affect how much in-game hooks matter. The official docs could not be fetched.
- No data was found on energy/timer systems' net retention effect in no-IAP games.

---

## 7. First-session and day-1 retention drivers for casual games

### Takeaway
The largest churn happens on install day / first play. Drivers are fast load (on the web, every extra MB loses players), time-to-fun under about 60–90 seconds, minimal tutorial friction (contextual hints rather than long tutorials), early wins and an early meaningful reward, and showing the player a commitment or goal early (Duolingo's "commit to my goal"). Day-0 playtime of about 10 minutes is cited as excellent, and the session-1 → session-2 conversion is the leading indicator of D1. Most numbers here come from vendor blogs; treat them as directional.

### Cited Findings
- "The biggest block of churn does not happen at D30 or D7 — it happens on install day." Get players into core gameplay within about a minute; if the aha moment takes more than 90 seconds, "a significant share of users never return for session two". Session-1 → session-2 conversion is the leading indicator of D1. Read the tutorial funnel step by step (e.g., "12% leave at step three") rather than as an average (vendor guidance) — [Playio: Onboarding decides your D1](https://blog.playio.co/mobile-game-onboarding-retention)
- DeltaDNA analysis (via a blog; older): nearly 20% of players do not complete the first tutorial quest — [Udonis: FTUE in mobile games](https://www.blog.udonis.co/mobile-marketing/mobile-games/first-time-user-experience) (search summary; attribution to this exact page uncertain)
- Some players quit before reaching the tutorial because of crashes or long load times — [Udonis FTUE](https://www.blog.udonis.co/mobile-marketing/mobile-games/first-time-user-experience) / [Keewano FTUE tips](https://keewano.com/blog/first-time-user-experience-ftue-mobile-games/) (search summary)
- Supersonic research (unverified, via a blog): top hyper-casual games with D1 above 50% had tutorials under 30 seconds — [Game-Developers.org](https://www.game-developers.org/22-tips-to-increase-player-retention-in-games-the-definitive-guide)
- Roblox docs: use a brief tutorial or contextual tooltips to guide users through the core loop, and avoid long tutorials — [Roblox Creator Docs: Onboarding](https://create.roblox.com/docs/production/game-design/onboarding)
- A Poki engineer: "For every extra megabyte a person has to download to play your game, you're going to lose a couple percent of players." He also flags onboarding friction and forcing phone rotation — [Poki blog: building web games in 2026](https://poki.com/blog/building-web-browser-games-2026) (search summary; page attribution likely but not verified)
- Poki devrel: the first three minutes decide retention — [IndieGameBusiness](https://indiegamebusiness.com/web-gaming-for-indie-developers/)
- CrazyGames judges "conversion to gameplay" (the share of visitors who actually start playing) alongside playtime and D1 — [CrazyGames Basic Launch](https://docs.crazygames.com/resources/basic-launch-metrics/)
- 10 minutes average Day-0 playtime is an "excellent" benchmark — [Elite Game Developers](https://elitegamedevelopers.substack.com/p/retention-metrics-in-free-to-play)
- Duolingo: the biggest streak-test win was changing the CTA from "Continue" to "Commit to my goal". Optimization effort concentrates on days 0–7 — [Lenny's Podcast transcript](https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/jackson-shuttleworth/transcript.md)
- Cookie Cats: where the first progress gate is placed affects D7 retention (about 90k-player test) — [Virtual Worlds Economies](https://virtualworldseconomies.substack.com/p/ab-testing-cookie-cats-mobile-game)

### Inferences
- First-session checks for Pet Rescue:
  - Time from tap to first interactive grid is under ~5 seconds after load, and the first rescue happens within 30–60 seconds.
  - The textless tutorial teaches by doing: one mechanic per level with contextual hand-pointer hints.
  - Small initial download (lazy-load later worlds and biome assets).
  - Portrait-friendly, one-finger play with no rotation.
  - Early levels give near-guaranteed 3-star wins.
  - The first garden or album unlock comes within the first session.
  - The daily puzzle and streak are introduced (or at least previewed) in session 1, so the D1 return has a reason.
- Meta screens (garden, album, hats) should be unlocked progressively after the core loop is learned, not shown all at once in the first minute. This follows the minimal-friction guidance and the Naavik/DoF point that the puzzle carries retention.
- A Duolingo-style commitment moment could be a textless "streak flame" pledge after the first daily puzzle. This is speculative, adapted from a non-game app.

### Gaps
- Most FTUE figures (60–90 seconds, 20% tutorial drop, under-30-second tutorials) come from vendor or agency blogs without primary data.
- No first-session data specific to HTML5 or in-feed games was found (e.g., how YouTube Playables users' first session compares with portal users').

---

## 8. Pitfalls: meta that distracts from the core loop, grind, reward inflation, dark patterns players resent

### Takeaway
The main documented pitfalls:
- **Over-investing in meta** for a strong puzzle core: the evidence says the puzzle drives retention and meta matters less the closer the game is to a pure puzzle.
- **Temporal dark patterns**: grinding and appointment play (Zagal et al.).
- **Streak pressure and shame**: broken-streak messaging backfires, and teens report distress.
- **Deadline/FOMO collection pressure and expiring progress** (Monopoly GO-style albums).
- **Exploiting near-misses**: they raise frustration and "playing longer than intended".

No quantified evidence on "reward inflation" was found.

### Cited Findings
- Dark game design patterns are "used intentionally by a game creator to cause negative experiences for players which are against their best interests and likely to happen without their consent". Categories are temporal (grinding, appointment play), monetary (pay to skip) and social capital (Zagal, Björk & Lewis 2013, older). Temporal patterns "manipulate the time players must invest to progress, often leading to frustration" — [arXiv 2412.05039 (2024)](https://arxiv.org/html/2412.05039v1); [DiGRA 2020 paper](https://eprints.whiterose.ac.uk/156460/1/DiGRA_2020_paper_189.pdf)
- A 2024 mobile-games study notes that empirical studies of dark patterns are relatively scarce. Monetary dark patterns co-occur frequently with other types, which suggests a link to F2P monetization — [arXiv 2412.05039](https://arxiv.org/pdf/2412.05039)
- Chen, Wang & Xiao (about 2025): psychological manipulation is prevalent in popular F2P mobile games, and the line between manipulation and persuasion is blurred — [SciTePress](https://scitepress.org/Papers/2025/133658/133658.pdf)
- Meta distraction: the Royal Match appeal is "mainly the puzzle" ([DoF 2021](https://www.deconstructoroffun.com/blog/2021/3/21/royal-match-the-new-king-from-turkey)). "Players care less and less about potential meta features the closer one gets to classic match-3" ([Naavik](https://naavik.co/digest/why-dream-games-success-is-a-challenge-to-replicate/)).
- Broken-streak messaging: messages highlighting a recent failure "typically don't work", and people "drop off once their streaks are broken". Offer repair instead — [CU Boulder news (2023)](https://www.colorado.edu/business/news/2023/04/20/research-streaks-marketing-tech-barasch); [UDaily (2024)](https://udel.edu/udaily/2024/march/power-of-streaks-motivation-jackie-silverman)
- Streak distress: teens prioritize streaks over sleep and study and feel distress when streaks are lost ([MJSM 2025](https://mjsm.journals.ekb.eg/article_422365.html)); "exhausting", "way too much pressure" (anecdote; [Girls Leadership](https://girlsleadership.org/blog/mediamondaytip-how-grown-ups-can-help-girls-stressed-out-by-snapstreaks/))
- Collection pressure: album deadlines create "completion pressure with an expiry date", and extras do not carry over. Trading turns collection into a "social obligation network" — [Tech-Insider essay](https://tech-insider.org/monopoly-go-sticker-economy-mobile-monetization/); [TheGamer](https://www.thegamer.com/monopoly-go-sticker-albums-faq-complete-guide/)
- Near-misses are the most frustrating outcome and may make players play longer than intended — [PMC: Larche et al.](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5445157/)
- Decoration/retention claims in marketing blogs are often assertions without data (e.g., Udonis on Gardenscapes) — [Udonis Playrix](https://www.blog.udonis.co/game-publishers/playrix)

### Inferences
**Audit checklist for Pet Rescue derived from all sections**

1. **Core loop first.** Puzzle quality, difficulty curve and par fairness should get the most design attention. Meta should never interrupt the "next level" flow: one tap from the result screen to the next level, with meta visits optional.
2. **Star gating vs grind.** Decoration unlocks at star totals should be reachable with mostly 2-star play. Requiring near-perfect 3-stars to progress the garden turns par into grind; check the cumulative star curve against unlock thresholds.
3. **Streak forgiveness.** Add a freeze or repair, use non-shaming copy (icons only, since the game is textless) and keep "best streak" memory. Avoid stacking pressure (one streak only, not multiple overlapping daily obligations).
4. **No appointment forcing.** There is no energy; keep it that way. Any timed element should be a bonus, never a block.
5. **Reward inflation.** Keep reward cadence meaningful. If every level gives a pop-up reward, rewards lose salience. Prefer milestone rewards (world completion, set completion, streak tiers) and a visible next goal.
6. **Collections without FOMO.** Keep the album permanent (no expiry). If time-limited events are added, their cosmetics can return later, or progress can carry over. This avoids the Monopoly GO expiring-extras resentment.
7. **Honest near-misses.** Show "1 move from 3 stars" from real par data. Do not manipulate outcomes.
8. **End-game.** Have a plan for after level 300, 32/32 album, 12/12 hats and 14+ day streaks (goal-gradient slump). The daily puzzle plus rotating events is the evergreen layer.

### Gaps
- No quantified study of "reward inflation" in casual games was found.
- No survey data directly measuring player resentment of grind or specific meta features in puzzle games was found; the dark-patterns literature is mostly taxonomic.
- No evidence was found on whether cosmetic-only meta (no gameplay effect) retains as well as boosters or power-ups in no-IAP games.
