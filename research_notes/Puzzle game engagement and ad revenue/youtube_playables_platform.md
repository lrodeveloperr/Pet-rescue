# YouTube Playables as a Platform: Discovery, Engagement, Requirements and Monetization (as of 18 Oct 2026)

> Method note (read first): every primary page (developers.google.com, playables.games, mobilegamer.biz) failed to fetch from this environment (DNS failure, then proxy 403 on CONNECT). **All findings below come from WebSearch result summaries/snippets, not full-page reads.** Official Google wording is therefore paraphrased or quoted from search snippets and should be re-checked against the live docs before an audit verdict depends on it. Sources are tagged **[OFFICIAL]** (Google/YouTube docs or Google staff), **[PRESS]** (independent trade or tech press), **[VENDOR]** (publishers or service sellers with a commercial interest, such as Playgama, Mediacube and playables.in) or **[TRACKER/FAN]** (third-party catalogue sites and fan wikis). The search budget ran out before a planned FRVR docs lookup.

## 1. Discovery and launch: surfaces, metadata/assets, click-through and first-seconds drop-off

### Takeaway
Players reach Playables through the Explore menu > "Playables", a Playables shelf on the Home feed, direct links (youtube.com/playables/<id>) and, since Sep 2025, creator livestreams. The metadata Google requires is title, genre, description, publisher/developer and thumbnails in several aspect ratios, with **no branding or logos** allowed. Accessibility tags were added in Aug 2026 as a discovery input. No published click-through or first-seconds drop-off data exists. The only proxies are that a pre-roll ad plays during loading and that the game SHOULD be interactive in under 5 seconds.

### Cited Findings
**Surfaces**
- [PRESS, Nov 2023] Users found Playables through a "Playables" shelf by scrolling on Home, or through a "Playables" link in the Explore menu, on desktop and mobile. — [9to5Google, 28 Nov 2023](https://9to5google.com/2023/11/28/youtube-testing-playables-gaming-effort/); [Tubefilter, 28 Nov 2023](https://tubefilter.com/2023/11/28/youtube-premium-playables-mobile-casual-gaming-hub/)
- [PRESS, May 2024] With the all-user rollout, Playables appears as a tab in the Explore menu on web, Android and iOS. Once a game is open it runs full-screen with no background video player. — [Tubefilter, 28 May 2024](https://www.tubefilter.com/2024/05/28/youtube-playables-rollout/); [AlternativeTo, May 2024](https://alternativeto.net/news/2024/5/youtube-playables-free-games-are-now-available-to-all-users-without-premium-subscription)
- [TRACKER/FAN, 2026] Playables sits under Explore and as a Home-feed shelf. The hub is youtube.com/playables and each game has its own youtube.com/playables/<game id> deep link. One catalogue site says the Playables section has **no search box**, so players browse shelves and genre rows. Another says Playables may also surface as a shelf in Home or Search, and in the You tab after a game is saved. Direct game links open without sign-in. — [YouTube Playables fandom wiki](https://youtube-playables.fandom.com/wiki/Playables); [playables.games how-to-play](https://playables.games/how-to-play/) (secondary, unverified against YouTube)
- [TRACKER, 11 Oct 2026] A catalogue site says TV and console YouTube apps have no Playables section. — [playables.games how-to-play](https://playables.games/how-to-play/) (unverified)
- [PRESS, 16 Sep 2025, Made on YouTube] Creators can play Playables (75+ titles at launch, e.g. Angry Birds Showdown, Cut the Rope, Tomb of the Mask, Trivia Crack) inside livestreams, interact with viewers through live chat, and monetize the stream as usual. YouTube positioned this as an easy starting point for new streamers. — [TechCrunch, 16 Sep 2025](https://techcrunch.com/2025/09/16/youtube-live-gets-a-major-update-introduces-dual-format-streaming-minigames-and-more/); [Business Standard, 17 Sep 2025](https://www.business-standard.com/technology/tech-news/youtube-live-adds-creators-focused-features-including-games-what-is-new-125091700351_1.html)
- [VENDOR/aggregator, 2026] A roundup says users can now play games during livestreams on mobile. — [SocialBee, 12 Oct 2026](https://socialbee.com/blog/youtube-updates-news-features/)
- [Indirect signal] Several browser extensions exist only to hide the Playables shelf from the YouTube homepage and sidebar, which suggests the shelf is prominent on Home. — [FocusTube PR #50](https://github.com/malekwael229/FocusTube/pull/50); [YT-Plus-Plus](https://github.com/Lalitmukesh69/YT-Plus-Plus)
- No official confirmation was found of Playables appearing inside the Shorts feed, or of a feature that links a Short or video to a Playable. Searches returned nothing official. — (see Gaps)

**Metadata and assets**
- [OFFICIAL] In the Developer Portal you provide title, genre, description, publisher and developer information, upload the bundle as a ZIP, and "upload thumbnails according to the design requirements". — [Developer Portal docs](https://developers.google.com/youtube/gaming/playables/developer_portal)
- [OFFICIAL] The design requirements list image thumbnails in several aspect ratios, plus description, title, genre and publisher/developer info, as a "non-exhaustive list" of required metadata. "Developer MUST NOT include any branding or logos in the thumbnails, description, or title." Titles and descriptions have character limits, and files must follow naming conventions. The exact limits and pixel sizes did not appear in snippets. — [Design requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements_design)
- [OFFICIAL, 24 Aug 2026] Game accessibility tags were added (Sections 2 and 2.1) "covering Accessible Gaming Initiative (AGI) player discovery and developer metadata accuracy". Tags feed player discovery and must accurately describe the game. — [Revision history](https://developers.google.com/youtube/gaming/playables/certification/revisionhistory); [playables.in rejection reasons](https://playables.in/youtube-playables-game-rejection-reasons/)
- [VENDOR] The thumbnail must accurately represent actual gameplay, and misleading icons or titles can cause rejection. — [Playgama blog: monetization rules](https://playgama.com/blog/main/youtube-playables-monetization/)
- [VENDOR] Portal fields per one guide: title, description, category, age rating, screenshots, icon. Unofficial. — [playables.in developer portal guide](https://playables.in/youtube-playables-developer-portal/)

**Click-through and first seconds**
- [OFFICIAL] Pre-roll ads play during loading and are handled automatically by YouTube. — [Monetization reference](https://developers.google.com/youtube/gaming/playables/reference/monetization)
- [OFFICIAL] The game SHOULD finish loading and allow interaction in under 5 seconds. The initial bundle is measured from the start of page load until the game calls gameReady. — [Stability & performance requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements_stability)
- [VENDOR, opinion] Strong retention is what gets a game surfaced to new players: "a self-reinforcing feedback loop". This is a claim about the recommender with no evidence offered. — [playables.in monetization guide](https://playables.in/youtube-playables-monetization/)

### Inferences
- Discovery is browse-driven (shelves and genre rows) rather than search-driven, so the thumbnail is the main conversion asset. Pet Rescue's thumbnails must show real gameplay, carry no logo or wordmark (title text in the image would likely count as branding), and work in every required aspect ratio.
- The pre-roll plays during loading, so the effective first impression is pre-roll, then load, then first interaction. Being interactive immediately after `gameReady`, with no splash or menu gate, is the main controllable lever on first-seconds drop-off. Pet Rescue's ~200 KB bundle is a strong advantage here.
- Livestream play makes games that are readable and fun to watch for a creator's audience (clear goal, visible "aha" moments) more valuable. A textless one-finger puzzle fits that well.
- Accessibility tags (Aug 2026) are a cheap discovery lever. One-finger and textless design may map to an AGI tag, but the tag list was not visible (see Gaps).

### Gaps
- No official or third-party figures on Playables click-through rate, shelf impression-to-play conversion, or first-session or first-seconds drop-off.
- Whether Playables surface in the Shorts feed, in search results, or as cards in creator videos (outside livestreams) could not be confirmed officially.
- Exact thumbnail aspect ratios, pixel sizes, character limits and the genre/category list: the official page was not readable.
- The list of AGI accessibility tags and how they affect ranking is unknown.

## 2. Most-played Playables, successful genres and session shapes, play-count data and growth

### Takeaway
The all-time chart is dominated by hypercasual mobile ports, led by Supersonic's Tall Man Run (~106-109M plays). Puzzle is the largest genre: 611 games and 1.1B plays on one tracker. Pet and escape rescue puzzles rank high (Save The Pets ~37M, Cat Escape ~24M), and "draw & escape" puzzles were the fastest-growing new mechanic in Jul-Sep 2026. The catalogue roughly doubled in summer 2026 to ~1,500-1,850 games, and tracked cumulative plays are ~5B.

### Cited Findings
**Top games (tracker data, all-time plays; numbers drift daily)**
- [TRACKER, ~Oct 2026] playables.games ranks by all-time plays: Tall Man Run ~109M, Build a Queen ~102M, Snake Clash! ~98M, Stealth Master ~95M, Going Balls ~94M, followed by Thief Puzzle, Dessert DIY, Race Master 3D, Phone Case DIY and Hide N Seek. Its homepage reports **5.38B live plays across 1,800+ games**. Figures differ slightly between the site's pages (e.g. Tall Man Run 108M, #1 of 1,780 on another page). — [playables.games](https://playables.games/); [Tall Man Run page](https://playables.games/games/tall-man-run/)
- [PRESS, ~late Sep 2026] Supersonic's Tall Man Run "had separately reached 106 million plays". Build A Queen, Snake Clash and Stealth Master have each been played 90M+ times. — [Mobilegamer.biz](https://mobilegamer.biz/youtube-has-quietly-rolled-out-playables-across-europe/)
- [PRESS via 36Kr, Oct 2026] "Some games passing 100 million cumulative plays". — [36Kr](https://eu.36kr.com/en/p/4027861725614465)
- [TRACKER/FAN, Sep 2026] The fan wiki reports over 4.8B total plays as of September 2026, and 1,654 games from ~280 publishers as of 20 Sep 2026, with ~10-15 new games a day. — [YouTube Playables fandom wiki](https://youtube-playables.fandom.com/wiki/Playables)

**Puzzle genre (most relevant comparables for Pet Rescue)**
- [TRACKER, ~Oct 2026] Brain & Puzzle has 611 games and 1.1B all-time plays. Top five: **Thief Puzzle 90M, Save The Pets 37M, Fashion Battle 33M, Cat Escape 24M, Cut The Rope 21M**, then Jelly Run 2048 14M. Daily Crossword sits at ~rank 51 with 5.1M. Bricks Breaker Quest ~400K. Cut the Rope: Magic 17K. "2048 Quest" is listed, but its count was not visible. — [playables.games Brain & Puzzle](https://playables.games/genres/brain-puzzle/)
- [TRACKER, 17 Oct 2026] The Egg Stealing Master has ~9M plays, #151 of 1,851. It was published 23 Sep 2026 by Mediacube, so it reached ~9M in about 3.5 weeks. — [playables.games: The Egg Stealing Master](https://playables.games/games/the-egg-stealing-master/)
- [TRACKER] Multiplayer genre: 9 games, led by Magic Tiles 3 with ~69M plays. — [playables.games Multiplayer](https://playables.games/genres/multiplayer/)
- Angry Birds Showdown launched on Playables 26 Apr 2024 per the fan wiki. No YouTube play count was found (play counts on other web portals are unrelated). Shift Shapes Car: no data found. — [fandom: Angry Birds Showdown](https://youtube-playables.fandom.com/wiki/Angry_Birds_Showdown)

**What is winning among new releases (vendor analysis)**
- [VENDOR, Mediacube, Sep 2026] Mediacube analysed games added 1 Jul-4 Sep 2026. The catalogue went from 788 to 1,477 titles, and none of the 783 games live on 1 Jul lost plays. "Draw & escape" puzzles were the strongest category: Tricky Twist: Brain Puzzle at 394K plays/day (the top new game), **Dog Escape 274K/day**, Home Rush 243K/day, Ladder Master 191K/day. Car physics and crash sandboxes also "scaled quickly after launch". The article says the platform "added over one billion games" in those 65 days, almost certainly a typo for plays. — [Mediacube: 6 mechanics winning in 2026](https://mediacube.io/en/blog/youtube-playables-game-mechanics) (self-reported; methodology unverified)
- [VENDOR, Playgama] Five Playgama games published on Playables "last week" generated 5.5M+ plays in their first 7 days. — [Playgama: Publish on YouTube Playables](https://playgama.com/publish-your-game-on-youtube-playables/) (undated vendor claim)

**Catalogue growth timeline**
- [PRESS] Sep 2023: small public test (Stack Bounce named). Nov 2023: Premium-only experiment with 37 games, including Daily Solitaire, The Daily Crossword, Angry Birds Showdown, Words of Wonders, 8 Ball Billiards Classic and Brain Games. — [9to5Google, 5 Sep 2023](https://9to5google.com/2023/09/05/youtube-testing-playables-gaming-effort/); [9to5Google, 28 Nov 2023](https://9to5google.com/2023/11/28/youtube-testing-playables-gaming-effort/)
- [PRESS] May 2024: 75+ games for all users, staggered rollout. Highlighted titles: Angry Birds Showdown, Words of Wonders, Cut the Rope, Tomb of the Mask, Trivia Crack. — [Tubefilter, 28 May 2024](https://www.tubefilter.com/2024/05/28/youtube-playables-rollout/)
- [PRESS] Dec 2024: 130+ games, "mostly simple browser games". — [Pocket-lint](https://www.pocket-lint.com/youtube-playables-adding-mulitplayer/)
- [PRESS, opinion, 2024] Early critical reception: "YouTube's Big Gaming Push Feels Like It's From 2004" (headline only seen). — [Kotaku](https://kotaku.com/youtube-playables-angry-birds-showdown-1851506040)
- [VENDOR/TRACKER] Jul 2026: 788 titles. 4 Sep 2026: 1,477. 20 Sep 2026: 1,654. Oct 2026: 1,711-1,851 depending on page. — [Mediacube](https://mediacube.io/en/blog/youtube-playables-game-mechanics); [fandom wiki](https://youtube-playables.fandom.com/wiki/Playables); [playables.games](https://playables.games/)
- [ANALYSIS] Play counts are not unique users, so they are a weak comparison metric. No company, YouTube included, has published a Playables-wide MAU. — [shattered.io](https://shattered.io/youtube-playables-50-markets-zero-iap-2026/)

### Inferences
- Pet and rescue/escape puzzles are a proven fit on Playables: Save The Pets (37M) and Cat Escape (24M) are #2 and #4 in the biggest genre, and Dog Escape was a top-3 new game by daily plays in summer 2026. Pet Rescue: Borrow & Escape sits in a validated niche, but it will be compared directly with established titles, so the thumbnail and first level must differentiate it fast.
- Successful session shapes are short, level-based, instantly legible hypercasual loops (runner, "DIY", stealth, draw-to-solve) that resemble ad-creative mechanics. A textless one-finger puzzle matches this profile.
- The catalogue doubled in about 2 months, so competition for shelf slots is rising quickly. New games from active publishers (Mediacube's Egg Stealing Master: ~9M plays in ~3.5 weeks) can still break out quickly.

### Gaps
- No official YouTube top-games list or play counts. All counts come from third-party trackers that scrape public catalogue numbers, and their methodology was not readable.
- No data on average session length, levels per session or D1/D7 retention for any Playable.
- Play counts for 2048, Brick Breaker, Trivia and Shift Shapes Car could not be confirmed.

## 3. SDK features that affect engagement

### Takeaway
The SDK (namespaces `system`, `game`, `engagement`, `health`, plus a public-preview `ads`) provides lifecycle signals, cloud save (<3 MiB, signed-in users only), a single best-score channel (`sendScore`) displayed by YouTube, language, audio-state and pause/resume events, and best-effort health logging. There is no general social or sharing API. Multiplayer exists only as a YouTube-run test on a few titles, and external network calls are banned.

### Cited Findings
- [OFFICIAL] Namespaces: engagement, game, health, system, and ads. The `ads` namespace is a "public preview API subject to change without notice". — [SDK reference](https://developers.google.com/youtube/gaming/playables/reference/sdk)
- [OFFICIAL] `ytgame.engagement.sendScore({ value })` sends "a best score to YouTube to display". It is listed as a recommended integration. — [Getting started](https://developers.google.com/youtube/gaming/playables/reference/getting_started)
- [THIRD-PARTY engine docs] Send an integer score and "use one score type throughout the game". Call it when a new best is reached. — [Needle Engine docs](https://engine.needle.tools/docs/how-to-guides/deployment/playable-ads/youtube-playables.html); [playables.in SDK tutorial](https://playables.in/playables-sdk/)
- [VENDOR] One guide calls the score display a "native leaderboard" in the YouTube UI. The UI itself is not documented in any source found. — [Virlan guide](https://www.virlan.co/prompt/youtube-playables-ai-game-monetization-guide/)
- [OFFICIAL] Save data MUST be < 3 MiB. — [Stability requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements_stability)
- [OFFICIAL/THIRD-PARTY] `saveData` takes a string, which must be valid UTF-16 with no lone surrogates. A `SIZE_LIMIT_EXCEEDED` error exists. Save/load only work for signed-in users, and data is per player. When the player is not signed in, the promise resolves with empty data. — [SDK reference](https://developers.google.com/youtube/gaming/playables/reference/sdk); [Phaser tutorial](https://phaser.io/tutorials/creating-youtube-playables-with-phaser)
- [OFFICIAL] `onPause` fires for all kinds of pause, including when the user exits. The game gets only a short window to save state before eviction, and resume is not guaranteed. — [SDK reference](https://developers.google.com/youtube/gaming/playables/reference/sdk)
- [OFFICIAL] `ytgame.system.getLanguage()` returns the user's locale. Web APIs `navigator.language`/`navigator.languages` are prohibited for this. — [i18n/L10n requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements_i18n_l10n)
- [THIRD-PARTY developer observation] `ytgame.health.logError()`/`logWarning()` are best-effort and rate-limited, and appear to accept no payload. — [Phaser tutorial](https://phaser.io/tutorials/creating-youtube-playables-with-phaser)
- [THIRD-PARTY] Defold's official Playables extension exposes lifecycle, saved data, audio and pause events, scores, "YouTube content", rewarded and interstitial ads, and error reporting. — [Defold forum](https://forum.defold.com/t/official-youtube-playables-extension-for-defold/83247); [Defold asset page](https://defold.com/assets/youtube-playables/)
- [PRESS, Dec 2024] YouTube began testing real-time multiplayer on two titles, Ludo Club (up to 4 players worldwide) and Magic Tiles 3, on desktop and mobile. — [TechCrunch, 10 Dec 2024](https://techcrunch.com/2024/12/10/youtube-is-testing-multiplayer-mini-games); [Android Police](https://www.androidpolice.com/youtube-testing-new-multiplayer-games-playables/); [GameSpot](https://www.gamespot.com/articles/youtube-adds-multiplayer-functionality-to-playables-game-library/1100-6528344/)
- [VENDOR, Jul 2026] Mediacube mentions further "multiplayer testing", without details. — [Mediacube updates](https://mediacube.io/en/blog/youtube-playables-updates)
- [OFFICIAL] Playables "must not make any external calls at this time". The FAQ says internal analytics are not exempt. This rules out developer-run multiplayer servers and third-party analytics. — [Stability requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements_stability); [Certification FAQ](https://developers.google.com/youtube/gaming/playables/support/certification_faq)
- [OFFICIAL] An online Test Suite validates the SDK integration. It was enhanced on 11 Jul 2024. — [Revision history](https://developers.google.com/youtube/gaming/playables/certification/revisionhistory); [Certification requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements)
- [OFFICIAL/PRESS] Creator-side features: Playables in livestreams (Sep 2025) and the Gemini-based "Playables Builder" (closed beta from Dec 2025, creators in US/CA/UK/AU) for creators to make and share bite-sized games with their audience. — [TechCrunch](https://techcrunch.com/2025/09/16/youtube-live-gets-a-major-update-introduces-dual-format-streaming-minigames-and-more/); [YouTube Playables Builder](https://www.youtube.com/playablesbuilder/); [Tubefilter, 17 Dec 2025](https://www.tubefilter.com/2025/12/17/youtube-playables-video-games-gemini-ai-sambucha/)

### Inferences
- Because the game cannot make external calls, the SDK's own signals are the only engagement tools. Pet Rescue's use of total stars as the single integer `sendScore` value fits the "one score type" guidance, provided it is sent monotonically (best or total only).
- Signed-out players get empty `loadData`, so the game must also handle progress for them gracefully. A local fallback (e.g. localStorage, if permitted) or at least no crash or broken state is needed, and saves should be written incrementally because `onPause` may be the last event before eviction.
- No in-SDK social, sharing, comments or "play with creator" hooks were found. Social reach comes from YouTube-side surfaces (livestreams, Builder), not developer APIs.

### Gaps
- Exact leaderboard or score UI (where `sendScore` is shown, friends vs global) is undocumented in the sources found.
- Whether `localStorage` is permitted as a fallback for signed-out users could not be confirmed.
- No developer-facing multiplayer API was found. The 2024 and 2026 tests appear to be YouTube-run.

## 4. Certification and quality requirements that affect engagement; revision history

### Takeaway
Certification is a mandatory pre-launch review: any failed MUST blocks publishing. The engagement-relevant rules are: initial bundle MUST < 30 MiB (SHOULD < 15 MiB); interactive in < 5 s (SHOULD); `gameReady` only when actually interactive; strict pause/resume and YouTube-audio compliance (no global in-game mute button); support for every aspect ratio without orientation lock; English mandatory, with locale taken from `getLanguage`; no external calls; a 512 MB JS heap cap; general-audience (13+) content; and, since Aug 2026, accurate accessibility tags and a ban on duplicate builds.

### Cited Findings
**Size, load and stability**
- [OFFICIAL] Initial bundle "MUST be less than 30 MiB" and "SHOULD be less than 15 MiB". It is measured from page-load start until `gameReady`. Zipping the initially loaded content is a good approximation, and size is measured after HTTP compression. Total bundle MUST be < 250 MiB by default. Each file MUST be < 30 MiB and SHOULD be < 512 KiB. File count is capped at 8,000. Save data < 3 MiB. — [Stability & performance requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements_stability); [portalready.world](https://portalready.world/portals/youtube-playables/)
- **Conflict:** the stability page's auto-generated summary box quotes an initial-bundle limit of 15 MB with an ideal of 5 MB. This looks like pre-July-2024 numbers. The normative requirement list (30/15 MiB) should govern. — [Stability page summary](https://developers.google.com/youtube/gaming/playables/certification/requirements_stability); [portalready.world note](https://portalready.world/portals/youtube-playables/)
- [VENDOR] Playgama's wiki says the initial load must be < 30 MB and "YouTube does not allow any compression". This contradicts the official "measured after HTTP compression" wording, so treat it with caution. — [Playgama wiki: YouTube requirements](https://wiki.playgama.com/platforms/youtube-playables-requirements-for-games)
- [OFFICIAL] Load and become interactive in < 5 seconds (SHOULD). `firstFrameReady` must precede `gameReady`. — [Stability requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements_stability)
- [THIRD-PARTY, FRVR's own SDK docs] Calling `gameReady()` too early, while still loading or non-interactive, is grounds for rejection. — [FRVR docs: YouTube channel](https://docs.frvr.com/requirements/channels/youtube/)
- [OFFICIAL] No consistently reproducible crashes, and the game must not crash the YouTube app or site. Peak JS heap cap is 512 MB, and exceeding it causes crashes on iPhones (iOS Safari crash-reload loops). Some Unity games exceed the memory limits. — [Stability requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements_stability); [Certification FAQ](https://developers.google.com/youtube/gaming/playables/support/certification_faq)
- [OFFICIAL] No external network calls, and internal analytics are not exempt. — [Certification FAQ](https://developers.google.com/youtube/gaming/playables/support/certification_faq)

**Integration (pause, audio)**
- [OFFICIAL] Games must pause and resume according to the SDK `onPause`/`onResume` callbacks. — [Integration requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements_integration)
- [OFFICIAL] The game MUST respect the YouTube audio setting and mute button via `isAudioEnabled`/`onAudioEnabledChange`. When YouTube mute is on, audio MUST NOT be output and in-game audio controls MUST NOT affect output. The game SHOULD NOT show an overall mute button. — [Integration requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements_integration); [SDK reference](https://developers.google.com/youtube/gaming/playables/reference/sdk)
- [VENDOR] Common rejection causes: the game loop, animations, physics, timers or input keep running during pause; audio un-mutes after settings, restart or level change; audio not muted on pause. Use SDK callbacks, not the Page Visibility API. — [Mediacube: 8 certification errors](https://mediacube.io/en/blog/youtube-playables-errors); [playables.in SDK tutorial](https://playables.in/playables-sdk/)
- [VENDOR] Progress should survive interruptions such as calls and tab switches. — [playables.in approval guide](https://playables.in/youtube-playables-developer-program-approval/)

**Design, orientation, i18n, accessibility**
- [THIRD-PARTY summary of official design requirements] Support every aspect ratio with no orientation lock. On Android the game first loads in a hidden WebView with a zero-size viewport, so layout code must handle 0x0. — [portalready.world](https://portalready.world/portals/youtube-playables/) (official text not directly seen)
- [OFFICIAL] English support is mandatory. Use `getLanguage`, and do not use `navigator.language(s)`. — [i18n/L10n requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements_i18n_l10n)
- [OFFICIAL] Accessibility: a best-effort attempt at WCAG AA (SHOULD, not MUST). Design best practices recommend keyboard support for all gameplay controls and screen navigation alongside touch and mouse, and adjustable text size. — [Accessibility requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements_accessibility); [Design best practices](https://developers.google.com/youtube/gaming/playables/certification/best_practices_design)

**Trust & Safety / content**
- [THIRD-PARTY summary] Games must suit a general audience (13+). Games designed exclusively for children, or tagged "made for kids", are not accepted. Content must comply with YouTube Community Guidelines, and full IP clearance is required. — [playables.in requirements](https://playables.in/youtube-playables-requirements/) (not verified against the official T&S page)
- [OFFICIAL, YouTube Help] In the US, a "kid" is anyone under 13. A 13+ disclaimer alone does not make content "not made for kids" in the FTC's view. — [YouTube Help: made for kids FAQ](https://support.google.com/youtube/answer/9684541?hl=en)

**Revision history (official)**
- 11 Jul 2024: technical requirements refactored into multiple documents, bundle size limit increased, lazy-loading guidance added, Test Suite improved. — [Revision history](https://developers.google.com/youtube/gaming/playables/certification/revisionhistory)
- 24 Aug 2026: game accessibility tags added (Sections 2 and 2.1), covering AGI player discovery and developer metadata accuracy. — [Revision history](https://developers.google.com/youtube/gaming/playables/certification/revisionhistory)
- 25 Aug 2026: Trust & Safety section 2.2 added a duplicate content policy. Content must be original, authorized or licensed, and duplicate game builds are prohibited. — [Revision history](https://developers.google.com/youtube/gaming/playables/certification/revisionhistory); [playables.in](https://playables.in/youtube-playables-game-rejection-reasons/)
- The revision history covers Technical Requirements, Playables SDK, Game Design Guidelines, Accessibility and Trust & Safety. Entries between Jul 2024 and Aug 2026 were not visible in snippets. — [Revision history](https://developers.google.com/youtube/gaming/playables/certification/revisionhistory)

### Inferences (audit checklist for Pet Rescue)
- At ~200 KB gzipped, Pet Rescue is far under every size SHOULD. The risks are elsewhere: (a) `gameReady` must fire only once the first level is touchable, and (b) three.js, fonts and audio must all be bundled locally, because a CDN fetch is an external call.
- An in-game master mute toggle would breach the SHOULD NOT and, if it can un-mute while YouTube is muted, the MUST. Any in-game audio controls must be subordinate to `isAudioEnabled`.
- Textless design supports the i18n requirement (English mandatory, and there may be no text to translate). Confirm no UI relies on `navigator.language`.
- A one-finger game should still accept keyboard input (SHOULD) and must lay out correctly at any aspect ratio, including the 0x0 hidden-WebView start.
- The duplicate-build ban (Aug 2026) means no submitting reskins or variants of the same build.
- A cute pet theme carries a "made for kids" perception risk. Positioning, art and metadata should read as general-audience puzzle content.

### Gaps
- Official Trust & Safety text (exact age wording, content-rating fields) was not readable. The 13+ rule comes from a third-party summary.
- No official numeric crash-rate threshold or low-end-device spec.
- Official orientation wording was not directly seen.
- Revision entries between Jul 2024 and Aug 2026 are unknown.

## 5. Ads and monetization: formats, rules, revenue share, reported earnings

### Takeaway
Three ad formats exist. **Pre-roll** is automatic and YouTube-run. **Interstitial** (`requestInterstitialAd`) runs at natural breaks and must never be used as a reward. **Rewarded** (`requestRewardedAd(rewardId)`) is opt-in, with one stable, user-data-free ID per reward type. Neither call guarantees an ad is shown. IAP, banners and off-platform ads are not allowed. Ad revenue sharing has been in limited testing since ~Mar 2026 with no published terms, and IAP tests are targeted for 2027. The only earnings figures are vendor self-reports (Playgama ~$3.1K/month average; $10-15K first month for top titles).

### Cited Findings
**Formats and rules**
- [OFFICIAL] Pre-roll ads play during loading and are handled automatically. Interstitials go at natural breaks. Rewarded ads are opted into for in-game benefits. Interstitial and rewarded ads are integrated through the SDK, "about 5 minutes to implement". — [Monetization reference](https://developers.google.com/youtube/gaming/playables/reference/monetization)
- [OFFICIAL] `requestRewardedAd(id)`: call it only when the player explicitly asks for a rewarded ad. It resolves to a boolean for whether the reward was earned, and makes no guarantee an ad was shown. — [SDK reference](https://developers.google.com/youtube/gaming/playables/reference/sdk); [Monetization reference](https://developers.google.com/youtube/gaming/playables/reference/monetization)
- [OFFICIAL] Reward IDs: use a unique ID per reward type and reuse the same ID every time that reward type is offered. The ID must contain no user data. A readable string such as "100-coins-reward-12" or a UUID is fine, and IDs can be hard-coded. — [Monetization reference](https://developers.google.com/youtube/gaming/playables/reference/monetization)
- [OFFICIAL] `requestInterstitialAd()` is for breakpoints such as level completion. "Do not use this API to reward players for watching an ad." No guarantee an ad is shown. — [SDK reference](https://developers.google.com/youtube/gaming/playables/reference/sdk)
- [OFFICIAL] Developer Portal monetization settings let you configure interstitial and rewarded ads. They "won't change the end-user ads experience for now, but we'll eventually check these settings when handling ads requests". A third-party source says they default to on and can be toggled for testing. — [Developer Portal docs](https://developers.google.com/youtube/gaming/playables/developer_portal); [portalready.world](https://portalready.world/portals/youtube-playables/)
- [VENDOR] "Artificial timers before interstitials are strictly forbidden" (no countdown or "ad in 3...2...1"). The game should pause during all ad events and resume correctly afterwards. Banners and intrinsic ads don't work. Monetization is rolling out gradually, so code should tolerate placements being unavailable. — [Playgama wiki](https://wiki.playgama.com/platforms/youtube-playables-requirements-for-games); [Playgama blog](https://playgama.com/blog/main/youtube-playables-monetization/)
- [VENDOR] A rewarded button that fails to request an ad is a certification failure. Games must keep working, and never leave players stuck or losing progress, when an ad isn't served. Rewarded ads must stay optional. — [Playgama blog](https://playgama.com/blog/main/youtube-playables-monetization/); [playables.in monetization](https://playables.in/youtube-playables-monetization/)
- [VENDOR] No off-platform ad networks or external monetization. IAP, subscriptions and buy-to-play are not supported. — [playables.in monetization](https://playables.in/youtube-playables-monetization/); [shattered.io](https://shattered.io/youtube-playables-50-markets-zero-iap-2026/)
- No official interstitial frequency cap or minimum interval was found (see Gaps).

**Revenue-share status**
- [OFFICIAL, Google staff via LinkedIn, ~Sep 2026] Joel Jansson (YouTube game partnerships; title reported inconsistently) said Google aims to "test IAP solutions during 2027". — [Mobilegamer.biz](https://mobilegamer.biz/youtube-has-quietly-rolled-out-playables-across-europe/); [36Kr](https://eu.36kr.com/en/p/4027861725614465)
- [PRESS/ANALYSIS, Sep-Oct 2026] Google has not published revenue-share terms, ad-format economics or payout schedule for Playables. One analysis calls submitting "more like a marketing play than a revenue channel" until terms are confirmed. — [tech-insider.org](https://tech-insider.org/youtube-playables-50-markets-eu-nordics-2026/); [shattered.io](https://shattered.io/youtube-playables-50-markets-zero-iap-2026/)
- [VENDOR] Revenue sharing is being piloted with a select group, with no public rate. — [playables.in monetization](https://playables.in/youtube-playables-monetization/)
- [OFFICIAL] Developer access is in early access via an interest form, and monetization may not yet be available to every developer account. — [YouTube Playables (developers.google.com)](https://developers.google.com/youtube/gaming/playables)
- [VENDOR forecast] Mediacube expects IAP by end-2026 or into 2027. — [Mediacube updates](https://mediacube.io/en/blog/youtube-playables-updates)

**Reported earnings (all self-reported by sellers; low verification)**
- [VENDOR via press] Playgama says YouTube began testing ad monetization in **March 2026** in limited geographies with a restricted developer group, and that its games averaged **~$3,100/month** in that closed beta. — [shattered.io](https://shattered.io/youtube-playables-50-markets-zero-iap-2026/)
- [VENDOR] Playgama's strongest titles earned $10,000-15,000 in their first month, "$15,000 in net revenue within their first month — after all platform commissions". Playgama's split is "you keep 75%, we take 25%", while another Playgama page says 70-90% to developers. — [Playgama: publish on Playables](https://playgama.com/publish-your-game-on-youtube-playables/); [Playgama developers](https://playgama.com/developers)
- [VENDOR] Revenue depends on retention, session length and player geography: high-CPM regions (North America, Western Europe) earn more per impression. — [playables.in monetization](https://playables.in/youtube-playables-monetization/)
- [PRESS context] YouTube's overall ad revenue was $11.1B in Q2 2026 (+~13% YoY, Alphabet earnings 22 Jul 2026). This is not Playables-specific. — [TubeBuddy](https://www.tubebuddy.com/blog/youtube-creator-news-july-2026/)
- [THIRD-PARTY] YouTube Premium subscribers reportedly see no ads in Playables. — [Mediacube monetization](https://mediacube.io/en/blog/youtube-playables-monetization) (unverified)

### Inferences
- Pet Rescue's capped interstitial and rewarded design matches the formats. Audit points:
  - Interstitials fire only at level-complete or breakpoints, never with a visible countdown, and never on first launch, since a YouTube pre-roll has just played.
  - Each rewarded offer type (e.g. "skip level", "extra borrow", "hat") uses its own hard-coded stable ID.
  - The reward is granted only on `true`.
  - Buttons degrade gracefully when no ad fills.
  - Game and audio pause around ad calls.
- Monetization is not guaranteed for a direct (non-partner) developer, so engagement metrics (plays, session length) are the main near-term return, and partners such as Playgama or Mediacube are the de facto route to the monetization pilot.

### Gaps
- No official interstitial frequency cap or minimum spacing, and no official rule on interstitials before the first level.
- No official revenue-share percentage, eCPM, payout threshold or schedule.
- No independent (non-vendor) earnings data. All $ figures are seller marketing.
- Whether Premium users generate any developer revenue (e.g. a Premium revenue pool) is unknown.

## 6. Audience: who plays, where, on which devices; Made-for-Kids handling

### Takeaway
Playables is free for all eligible signed-in or signed-out users (Premium only during the 2023 experiment) on web, Android and iOS, but not TV or console. It was available in 7 markets (US, UK, CA, AU, IN, MY, TR) until a 2026 expansion to 50+ markets including the EU and Nordics. Sources conflict on whether that happened in July or late September 2026. No official demographics or MAU exist. Children's audiences are excluded (13+, no "made for kids" games), and supervised and kid accounts get restricted, contextual-only ads.

### Cited Findings
- [PRESS] Nov 2023: Premium-only experiment (access until at least 28 Mar 2024). 28 May 2024: rolled out to all users, no Premium needed, staggered over months. Web, Android and iOS. — [9to5Google](https://9to5google.com/2023/11/28/youtube-testing-playables-gaming-effort/); [Tubefilter](https://www.tubefilter.com/2024/05/28/youtube-playables-rollout/)
- [PRESS] Launch footprint was 7 markets: US, UK, Canada, Australia, India, Malaysia, Türkiye. — [Mobilegamer.biz](https://mobilegamer.biz/youtube-has-quietly-rolled-out-playables-across-europe/); [tech-insider.org](https://tech-insider.org/youtube-playables-50-markets-eu-nordics-2026/)
- [OFFICIAL via LinkedIn + PRESS, Sep 2026] Joel Jansson: Playables "now launched for users in over 50 markets, including Nordics and the EU". Earliest sighting is ~24 Sep 2026 and PocketGamer.biz confirmed it on 28 Sep 2026. There was no blog post or press event, and no full country list has been published. — [PocketGamer.biz](https://www.pocketgamer.biz/youtube-playables-expands-to-more-than-50-markets-including-the-eu-and-nordics/); [Mobilegamer.biz](https://mobilegamer.biz/youtube-has-quietly-rolled-out-playables-across-europe/); [tech-insider.org](https://tech-insider.org/youtube-playables-50-markets-eu-nordics-2026/)
- **Conflict on timing:** SocialBee and Outlierkit list an EU rollout in **July 2026**, and TubeGames says it has been "quietly rolling out across the EU since July 2026". Others date the 50+ expansion to late Sep 2026. Both may be true (a gradual EU rollout, then an announcement). — [SocialBee](https://socialbee.com/blog/youtube-updates-news-features/); [Outlierkit](https://outlierkit.com/blog/youtube-updates-july-2026); [playables.games](https://playables.games/)
- [VENDOR, Jul 2026] Portal analytics added age, country and session-length dimensions in mid-July 2026. Before that, only total plays (7-day/28-day/all-time) were shown. Countries in analytics then were USA, Australia, Canada, UK, India and Malaysia (Türkiye not listed, a minor inconsistency). Across Mediacube's own accounts, 2.8% of sessions came from players aged 65+ over 28 days. — [Mediacube updates](https://mediacube.io/en/blog/youtube-playables-updates)
- [ANALYSIS] No Playables MAU has been published. The 2024 "2.49B users" figure was YouTube's total audience. — [shattered.io](https://shattered.io/youtube-playables-50-markets-zero-iap-2026/); [Techloy, May 2024](https://www.techloy.com/youtube-is-rolling-out-playables-to-all-users/)
- [TRACKER] Playables is not on TV or console apps (as of 11 Oct 2026). It is only offered to accounts and regions YouTube deems eligible. — [playables.games how-to-play](https://playables.games/how-to-play/)
- [THIRD-PARTY] Playables is not available in YouTube Kids or on supervised accounts and is treated as 13+. — [playables.games help](https://playables.games/help/playables-not-working/) (unverified)
- [OFFICIAL, YouTube Help] Supervised (under-13) accounts get contextual ads only, with no personalized ads or remarketing. Teens (13+) get no personalized ads. — [YouTube Help: ads for supervised accounts / made for kids](https://support.google.com/youtube/answer/9713557?hl=en)

### Inferences
- Pet Rescue's likely audience is general-audience casual players, with a heavier tail of English-speaking and South/Southeast Asian markets (India, Malaysia) until EU and other markets mature. Textless design suits a now-50+-market, mostly non-English expansion.
- The mobile-heavy hypercasual top chart and the portrait-friendly mechanics suggest mobile dominates, but there is no data (see Gaps). The game must also play well with mouse on desktop.

### Gaps
- No desktop vs mobile split, age distribution (beyond one vendor's 65+ share), gender, or session-length benchmarks.
- No full list of the 50+ markets.
- Official Playables help-centre text on supervised or teen access and Premium ad treatment was not found.

## 7. Developer postmortems, interviews and case studies

### Takeaway
There are no detailed public postmortems with retention or revenue curves. The available case material is vendor-produced:
- Defold, Green Train and Playgama's Arrow Cube 3D: 3 MB initial download, too early to show effects.
- Playgama: 5 games reaching 5.5M plays in 7 days; ~$3.1K/month average ad revenue in beta.
- Mediacube's genre analysis and its Egg Stealing Master: ~9M plays in ~3.5 weeks.

The recurring lessons are tiny bundles, robust pause/audio/save, ads that fail gracefully, and fast-legible puzzle or hypercasual mechanics.

### Cited Findings
- [THIRD-PARTY interview, 7 Sep 2026] Green Train Studio and Playgama discuss Arrow Cube 3D, a puzzle game built in Defold with a **3 MB initial download**, published on Playables. After ~2 weeks live they had "not yet observed a noticeable effect on traffic to other platforms". No play counts were given. — [Defold blog](https://defold.com/2026/09/07/Interview-Green-Train-Playgama/)
- [VENDOR] Playgama claims official Playables partner status with 20+ games live. Developers integrate the Playgama Bridge SDK instead of applying to Google directly. Five games got 5.5M+ plays in their first week. — [Playgama: publish on Playables](https://playgama.com/publish-your-game-on-youtube-playables/); [Playgama wiki: how to publish](https://wiki.playgama.com/platforms/how-to-publish-your-game-on-youtube-playables)
- [VENDOR] Direct-application pain points: approval via the interest form "can take weeks or even months", documentation is sparse, and the platform changes faster than public docs. A Channel Manager role on an onboarded channel is required. — [playables.in approval guide](https://playables.in/youtube-playables-developer-program-approval/); [Developer Portal docs](https://developers.google.com/youtube/gaming/playables/developer_portal)
- [VENDOR] Mediacube (also a Playables publisher) found draw-and-escape puzzles and car/crash sandboxes winning among summer-2026 launches. Its own Egg Stealing Master reached ~9M plays in ~3.5 weeks. — [Mediacube mechanics](https://mediacube.io/en/blog/youtube-playables-game-mechanics); [playables.games](https://playables.games/games/the-egg-stealing-master/)
- [VENDOR, Jul 2026] Developers most wanted DAU/MAU breakdowns, retention curves and crash reporting, which implies per-game retention data was not available to developers as of mid-2026. — [Mediacube updates](https://mediacube.io/en/blog/youtube-playables-updates)
- [THIRD-PARTY] FRVR maintains YouTube-channel requirement docs for its own SDK (e.g. calling `gameReady()` too early is grounds for rejection), which indicates FRVR ships to Playables. — [FRVR docs](https://docs.frvr.com/requirements/channels/youtube/)
- [PRESS] Top charts are dominated by hypercasual publishers' ports (Supersonic's Tall Man Run). — [Mobilegamer.biz](https://mobilegamer.biz/youtube-has-quietly-rolled-out-playables-across-europe/)

### Inferences
- Pet Rescue's small three.js build and puzzle-escape mechanic match what vendors report working. With no in-portal retention analytics until recently (and still limited), building engagement into the design up front matters: daily puzzle, streak, stars feeding `sendScore`, robust save. Post-launch telemetry is constrained by the no-external-calls rule.

### Gaps
- No Reddit r/gamedev, Medium or LinkedIn first-person postmortems with numbers were found (searches returned none).
- No Poki case material on Playables. Poki appears only as a separate portal, not a Playables route.
- A search summary said FRVR took part in YouTube's original 2024 trial, but the originating page could not be identified or read, so this is unconfirmed.
- No first-party Google developer case studies were found.
