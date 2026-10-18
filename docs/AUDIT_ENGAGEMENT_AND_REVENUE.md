# Engagement and revenue audit

Audit of Pet Rescue: Borrow & Escape (commit `a2ad7f5`, 18 October 2026). It is checked against the principles in [the research report](../reports/Puzzle%20game%20engagement%20and%20ad%20revenue.md), whose IDs (P, E, R, M, L) are used throughout.

**Method:**
- **Code review:** every principle checked against the source.
- **Level statistics:** a solver analysis of all 300 campaign levels, covering difficulty, dead positions, clutter and how many companions each level needs.
- **Screenshots:** the production build in headless Chromium.

**Limits:**
- No player has played the game, so nothing here measures fun, solve times or retention.
- The research read its sources through search summaries. Official Playables wording must be re-checked on the live documentation before a certification verdict depends on it.

## Verdict

The game is strongest where the evidence is strongest about doing no harm:

- conservative interstitials;
- free undo, restart and hints;
- no energy, timers or lives;
- earned, non-random stars;
- tiny load;
- a 13+-safe data footprint.

Its weaknesses are, in order of impact:

1. **The puzzles, which the research says carry retention, are the weakest part.** Difficulty is flat. The hardest levels arrive in the first session. Half of all obstacles are clutter. Outside the first world, most levels need only one companion, which removes the game's defining choice.<br>→ **Done.** The pause menu keeps only music (and vibration where supported); old saves' sound setting is ignored.
2. **Return hooks are thin.** The streak breaks with no repair. Players get different daily puzzles on the same day. No end screen shows the next goal. Nothing exists after level 300.<br>→ **Done.** Hint, idle and skip timers stop during host pause, ads and menus, and resume with their remaining time.
3. **There are few rewarded placements, and one is a policy risk.** Free help leaves only three: skip, a random hat (risky under minors guidance) and a bonus daily (uncapped).<br>→ **Done.** At most once per session, and never for a player who never had a save. The notice is a picture.
4. **Four certification risks:** a master mute button, a save-error message that could repeat for every signed-out player, an unguarded zero-size first viewport, and missing listing assets.<br>→ **Done.** Layout waits for a real size, the frame loop catches size changes without a resize event, and the map is re-laid for the new orientation if no move was made. Smoke-tested with a 1×1 first viewport.

## Measured level facts

The figures come from scripts in the session scratchpad. They re-run the game's own solver on `src/levels/campaign.js`.

| Measure | Meadow | River | Snow | Farm | Canyon | Woods |
|---|---|---|---|---|---|---|
| Average par (moves) | 19.4 | 15.0 | 14.9 | 18.7 | 15.1 | 14.8 |
| Par, levels 1–25 → 26–50 | 19.1 → 19.8 | 13.9 → 16.2 | 12.9 → 17.0 | 15.1 → 22.3 | 13.7 → 16.5 | 13.8 → 15.8 |
| Levels where a dead (unwinnable) position is reachable | 14/50 | 10/50 | 7/50 | 46/50 | **50/50** | 10/50 |
| Obstacle tiles never touched by the optimal solution | 50% | 35% | 48% | 48% | **58%** | 52% |
| Levels needing exactly one companion | 0 of 38 generated | 40 | 46 | 39 | 34 | 42 |
| New mechanics introduced | 4 companions (levels 1–4) | currents | ice | plates/gates | bridges | burrows, bees |

Across all 300 levels:
- 129 levels have par 10–14, the generator's floor band.
- Only 17 have par 25 or more, and three of those are hand-made levels 8, 11 and 12 (par 38, 39 and 33).
- The last world ends at par 18, easier than level 8.

## Scorecard

Status values:
- **Meets:** satisfies the principle.
- **Partly:** satisfies some of it.
- **Gap:** feature absent.
- **Fails:** contradicts a rule or strong evidence.
- **Unverified:** needs a device, a playtest or the live docs.

### Platform rules (P)

| ID | Status | Evidence | Fix |
|---|---|---|---|
| P1 gameReady timing, interactive < 5 s | Meets (unverified on device) | `firstFrameReady` after the first render; `gameReady` after `startLevel` in `src/main.js`. The 197 KB build | Time on a mid-range Android phone |
| P2 no external calls | Meets | Only the SDK script in `index.html`; everything else is bundled | Keep it that way: no analytics |
| P3 pause, audio, **no master mute** | **Fails (Rule-S)** | The pause menu has an overall sound toggle (`src/ui.js:274`). Hint and skip-offer timers keep running during `onPause` (`src/game.js:815`) | Remove the master sound toggle and keep the music toggle; pause or cancel hint and skip timers on host pause |
| P4 save rules | Partly | Saves on win, streak change and settings, after `loadData`, well under 3 MiB, with migration. But a failed save shows a toast every time (`src/game.js:81`); if signed-out saves reject, every win nags | Show the save-failure message at most once per session; treat signed-out play as normal |
| P5 any aspect ratio, 0×0 first viewport, keyboard | Partly | Map rotation and aspect fitting work, and keyboard controls work. `fit()` divides by a zero height on a 0×0 first load (`src/world.js:298`) | Skip `fit()` while width or height is 0 and refit on the first non-zero resize |
| P6 English, `getLanguage()` | Meets | `src/host.js` uses `ytgame.system.getLanguage()` inside YouTube | — |
| P7 listing assets, no logos, accessibility tags | **Gap** | No cover art, thumbnails, description or tags exist | Produce gameplay-based thumbnails in every required ratio, an all-ages description and accurate accessibility tags (one-finger, no reading needed, no timers, muted-playable) |
| P8 one rising integer score | Meets | `sendScore(totalStars)` | — |
| P9 ads only through the SDK | Meets | `src/host.js` | — |
| P10 cope with monetization being unavailable | Partly | Offers hide when `ytgame.ads` is absent. If the namespace exists but never fills, every rewarded tap ends in "no reward" | After two unfilled rewarded requests, hide rewarded offers for the session and show a wordless "unavailable" state |

### Puzzle design (E)

| ID | Status | Evidence | Fix |
|---|---|---|---|
| E1 sawtooth per world | Partly | The generator orders levels by its score and adds a breather every 5th level, but par barely rises (table above) | Re-curate each world on a structural difficulty score: a new element, 2–3 learning levels, a rise, a spike, a breather |
| E2 critical path leans easy | Partly | Most levels are short (good), but levels 8, 11 and 12 (38, 39 and 33 moves) land in the first session | Move the 33–39-move hand-made levels later or shorten them; keep the first 20 levels under about 20 moves |
| E3 hardest levels are short | **Fails** | The hardest levels are the longest ones | Tune the generator for insight (dead-position density, required switches) at short length |
| E4 prune least-fun levels | Gap | Playables forbids telemetry, and there is no playtest | Run the campaign on a web portal with telemetry, or playtest with 10–20 people; cut the bottom 10–20% by abandon versus pass time |
| E5 featured companion or hazard required | Partly | Each world's mechanic must matter, but the level's companion is not chosen deliberately: river 1–3 need only the duck, snow 1–2 only the mole | Make each level feature one companion (or two) and require exactly those |
| E6 a greedy route fails; few near-par solutions | Gap | Not checked | Add both checks to the generator |
| E7 structural difficulty | Partly | The generator scores moves, switches, pushes and solver nodes; dead-position density and congestion are measured only in this audit | Add dead-position fraction, irreversible actions and congestion to the score |
| E8 untouched elements rare | **Fails** | 35–58% of obstacle tiles are never touched by the best solution | Strip untouched obstacles unless they are a deliberate decoy (keep at most 1–2 per level) |
| E9 forced debut, then 2–3 variations | Partly | Companion debuts are hand-made single routes. World mechanics debut in generated levels that are not forced; a tutorial hand helps | Hand-make the first two levels of each world as forced single-route lessons |
| E10 first rescue in 30–60 s, no menu first | Meets (unverified) | Level 1 loads straight away; 20 moves of tap-to-move | Measure on a device |
| E11 earned celebration, readable animation, tease what's next | Partly | Celebrates rescues and shows unlocks; slides and currents animate readably. The win panel never teases the next companion, world, animal or hat | Add a "next" preview strip to the win panel |
| E12 unlimited undo, dead-position cue | Meets | Undo history of 400; the solver flags dead positions and lights up undo/restart | — |
| E13 stepped hints from the current state, on request | Partly | Hints come from the current state, but appear automatically after 12 s (`src/game.js:37`) as a single step, with no escalation | Add a hint button that pulses after idle time; stage 1 highlights the key object, stage 2 shows the next 1–3 moves, stage 3 shows the full path |
| E14 stars never gate progress; at least 1 star; par counts moves | Partly | The campaign is never gated and moves are counted correctly. The garden needs 650 and 800 stars (`src/garden.js:22`), out of reach with mostly 2-star play (600 + dailies). The HUD shows moves but not the target | Cap the decoration thresholds near 2-star play (≤ 600); mark par on the star meter |
| E15 a new element about every 10 levels | **Fails** | A new mechanic every 50 levels after level 4; no cross-world combinations | Introduce sub-mechanics or combinations every ~10 levels (e.g. ice + boulder plates, currents + bridges); bring every world's mechanic into the daily pool and later worlds |
| E16 20–90 s levels | Unverified | Pars are mostly 12–20 moves | Measure |

### Retention (R)

| ID | Status | Evidence | Fix |
|---|---|---|---|
| R1 measure D1/D7/D30 | Gap (platform) | Only YouTube's portal stats are possible | Use YouTube analytics after launch; run tuning tests on a web portal build |
| R2 streak freeze or repair | **Fails** | The streak resets to 0 after one missed day; there is no freeze | Earn a free freeze (cap 2–3) by completing 3 dailies; or keep a 1-day repair window, earned through play, never through an ad |
| R3 no shaming; show best streak | Partly | No shaming, but the best streak is never shown and a break reads as a bare 0 | Show the best streak and a fresh-start flame |
| R4 any completed daily keeps the streak | Meets | Any completion counts | — |
| R5 day-3 hat visible from session 1; milestones past day 14 | Partly | Streak hats unlock at 3, 7 and 14 days, but the hat picker never says how a locked hat is earned | Show streak and star requirements on locked hats; add milestones at 21, 30, 50 and 100 days |
| R6 one daily per date for everyone, countdown, history | **Fails** | The pool is filtered by each player's unlocked worlds (`src/game.js:634`), so players get different puzzles the same day; no countdown, no history | Use one global daily per date (any companion set it needs is already owned); add an information-only countdown and a calendar of past results |
| R7 progress bar to the nearest goal on every end screen | **Gap** | Only the garden bar shows decoration progress | Win panel: a bar to the next decoration, hat, album set or streak milestone, starting partly filled |
| R8 near-miss from real data | Meets | No engineered near-misses | Optionally show "one move over par" truthfully |
| R10 no energy or appointment timers | Meets | — | — |
| R11 meta never blocks; resume on next level; 2-star reachable | Partly | Next is one tap and resume lands correctly, but the 650/800-star decorations fail the 2-star test | See E14 |
| R12 themed album sets with permanent rewards | Gap | The album lists animals and counts only | Group by world (6 sets) and give each completed set a permanent decoration or hat |
| R13 a plan after level 300, the full album, all hats and day 14 | **Gap** | After level 300 the game sends the player to the map; the daily repeats after 260 days | Add weekly rotating level sets from the pool, endless generated puzzles after world 6, and new animals or hats in later sets |

### Ads (M)

| ID | Status | Evidence | Fix |
|---|---|---|---|
| M2 never stack an early interstitial behind the pre-roll | Meets | Session start counts as an ad; 3 levels and 3 minutes first | — |
| M3 interstitial only at breaks | Meets | Only on Next | Optionally also at world transitions |
| M4 first-session grace covers ~5 min | Partly | 3 levels and 3 minutes | Test a 5-minute first-session floor |
| M5 time cap ≥ 2 min plus 1 per 3 levels | Meets (3 min) | `src/ads.js:11` | Test 2 minutes on a web portal for 14+ days |
| M6 ad-free celebration; Next guarded 300–500 ms; Next unlike ad buttons | Partly | The celebration is ad-free, but Next has no tap guard, and the skip button is yellow like Next (`src/style.css:676`) | Guard Next for 400 ms after the panel appears; give rewarded buttons their own colour and video glyph |
| M7 no countdowns | Meets | — | — |
| M8 no interstitial at the break after any rewarded view | Partly | Only a 90 s quiet period | Skip the next break entirely after any rewarded view |
| M9 skip the interstitial after a struggle level | Gap | — | No interstitial after a level with 3+ restarts or a hint |
| M10 rewarded placements at moments of need | **Gap** | Only skip (after 3 min), a random hat and a bonus daily | Add a rewarded "super hint" (stage 3 of E13, while stages 1–2 stay free), choose-your-hat, an earlier skip on dead-position-heavy levels, and "rescue a bonus friend" (a duplicate-free album entry) |
| M11 everything completable with no ads | Meets | — | — |
| M12 skipped levels give no stars and stay replayable | Meets | Skipped levels score 0 stars and remain playable | — |
| M13 6–8 rewarded views a day, diminishing payouts | **Gap** | The bonus daily is uncapped | Cap at 6 rewarded views a day; at most 2 bonus dailies |
| M14 explicit tap, stable IDs, reward only on true, offer kept on failure | Meets | IDs `skip-level`, `mystery-hat`, `bonus-daily` | A wordless unavailable state (see P10) |
| M15 interstitial never rewards | Meets | — | — |
| M16 loop and audio pause around ads | Partly | Audio pauses, but hint and skip timers keep running | Pause the timers (see P3) |
| M17 no banners | Meets | — | — |

### Audience and policy (L)

| ID | Status | Evidence | Fix |
|---|---|---|---|
| L1 all-ages positioning, never "for kids" | Gap (no listing yet) | The title is neutral | Write cosy all-ages listing copy; screenshots of later, harder worlds |
| L2 no tracking | Meets | — | — |
| L3 rewarded buttons are distinct, show the reward, decline equally prominent | Partly | An "Ad" badge and a reward icon are present, but the offer dialog makes "Watch ad" primary yellow and "No thanks" plain | Style both offer buttons equally; use a distinct ad colour |
| L4 no guilt on decline | Meets | — | — |
| L7 non-punitive streak | Partly | Hats are kept, but there is no freeze | See R2 |
| L9 random reward for an ad | **Fails (risky)** | The mystery hat is random | Replace it with choose-your-hat |
| L10 no countdown offers | Meets | — | Keep the future daily countdown information-only |
| L13 break cues at world ends | Gap | — | Add a "world complete" celebration with a natural stopping point: the garden visit and the new-world reveal |

## Every improvement, prioritized

Effort: S is under half a day, M is 1–2 days, L is 3 or more days.

### P0: certification and policy (do before submission)

1. Remove the master sound toggle; keep the music toggle (P3). S
2. Pause or cancel hint and skip-offer timers on host pause and around ads (P3, M16). S
3. Show the save-failure toast at most once per session, and never for signed-out empty saves (P4). S
4. Guard `fit()` and `resize()` against a 0×0 first viewport (P5). S
5. Hide rewarded offers after repeated no-fill and show a wordless unavailable state (P10, M14). S<br>→ **Done.** Two failures in a row hide offers for the session; failures show a wordless notice.
6. Replace the random mystery hat with choose-your-hat (L9). S<br>→ **Done.** The player picks a locked star hat first; streak hats are never sold.
7. Style "Watch ad" and "No thanks" equally, and give rewarded buttons a distinct colour and video glyph unlike Next (L3, M6). S<br>→ **Done.** Both offer buttons share one style; every ad button is lavender with a video glyph, unlike the yellow Next.
8. Produce listing assets: thumbnails in every ratio from real gameplay, an all-ages description and accessibility tags (P7, L1). M<br>→ **Done, pending the portal's exact sizes.** `listing/` has gameplay thumbnails in 16:9, 1:1, 9:16 and 4:3 with no text or logos (`scripts/listing.mjs`); copy and tags are in `docs/LISTING.md`.
9. Re-check every certification item against the live Playables docs, since the research only saw summaries. S<br>→ **Partly.** The documentation host is unreachable from this environment, so the re-check used search results. It found two more requirements, both now implemented: a toggle for haptics, and Esc closing every dialog. A full read of the live pages is still needed before submission.

### P1: puzzle quality (largest engagement impact)

10. Move or shorten hand-made levels 8, 11 and 12 (33–39 moves) out of the first session (E2, E3). S<br>→ **Done.** Hand-made levels 8, 11 and 12 moved to the daily pool; level 9 (26 moves) is now a meadow spike at level 19.
11. Strip obstacles the solution never touches, keeping at most 1–2 deliberate decoys per level (E8). M<br>→ **Done.** The generator strips every obstacle the solution never touches when the puzzle (par, required companions, required mechanics) stays the same.
12. Make each level feature specific companions and require exactly those; aim for at least half the levels in worlds 2–6 needing 2 or more companions, to restore the core choice (E5, brief). M<br>→ **Done.** Each level features specific companions and requires exactly those. See the measured table below for the share needing two or more.
13. Add the "greedy route fails" and "few near-par solutions" checks to the generator (E6). M<br>→ **Partly.** The meadow requires a real detour over the obstacle-free route, and a limited-search agent scores how hard a level is to find. A count of near-par solutions was not added.
14. Score difficulty structurally (dead-position density, irreversible actions, required switches, congestion) and re-curate each world into a true sawtooth, with short hard levels and later worlds harder than the first (E1, E3, E7). M<br>→ **Done.** Difficulty combines required companions, switches, irreversible actions, dead-position share, the limited agent, search size, par and detour; each 10-level segment rises to a short spike (par ≤ 22) and then a breather.
15. Hand-make the first two levels of each world as forced single-route lessons for its mechanic, plus the wait action for bees (E9). M<br>→ **Partly.** Each world opens with two generated lesson levels (small, short, almost no dead positions) and an intro card, and bees get a lesson in the meadow. They were generated to these limits rather than hand-made, and their single route was not verified.
16. Add a new element or combination about every 10 levels: mechanic mixes in later worlds, and variants such as two-plate gates, bridges over water, ice with currents or bees over ice (E15). L<br>→ **Partly.** Every world after the first adds a new mix about every 10 levels (for example currents with bees, ice with currents, gates with ice, bridges with gates, burrows with bridges), each opened by an intro card. New sub-variants (two-plate gates, bridges over water) were not added.
17. Cut the 50/50 dead-position rate in Canyon and 46/50 in Farm: prefer layouts where mistakes are recoverable, and keep dead positions for spike levels (E2, E12). M<br>→ **Done.** The share of reachable positions that are dead is capped per level: 5% in lessons (35% in the bridge lessons, where every crossing destroys a bridge), 30% in Canyon and 20% elsewhere. See the measured table below.
18. Hints: a hint button with three escalating stages, offered (pulsing) after idle time instead of auto-shown; no auto-hint for players who have not asked (E13). M<br>→ **Done.** A hint button with three stages; after idle time it pulses. Only tutorial and lesson levels show the hand by themselves.
19. Mark par on the star meter so players know the target (E14). S<br>→ **Done.** The star meter shows moves/par.
20. Playtest 10–20 people, or run a web-portal build with telemetry; prune the bottom 10–20% of levels by abandon versus pass time (E4, R1). M<br>→ **Needs people.** Not possible here. A limited-search agent and a dead-position share stand in for difficulty until a playtest or a web-portal build with telemetry exists.

### P2: retention and return hooks

21. One global daily puzzle per date for everyone, drawn from the whole pool once all companions are rescued (R6). S<br>→ **Done.** The puzzle depends only on the date.
22. Daily: an information-only countdown to the next puzzle and a calendar history of solved days (R6). M<br>→ **Done.** A countdown chip and a four-week calendar of solved and frozen days.
23. Streak freezes, earned free (one per 3 dailies, cap 2–3) and used automatically (R2, L7). S<br>→ **Done.** One per three dailies, up to two, used automatically for missed days.
24. Show the best streak and a fresh-start flame after a break, with no loss message (R3). S<br>→ **Done.** The best streak shows when it beats the current one; a broken streak shows a bobbing flame at 0 with no loss message.
25. Streak milestones beyond day 14 (21, 30, 50, 100) with new hats or decorations (R5, R13). S<br>→ **Done.** Streak hats at 21, 30, 50 and 100 days (sun hat, antlers, space helmet, unicorn horn).
26. Show how every locked hat is earned (star count or streak days) in the picker (R5). S<br>→ **Done.** Every locked hat shows its star or streak requirement.
27. Win panel: a progress bar to the nearest goal (decoration, hat, album set, streak), starting partly filled, with the next goal shown straight after each reward (R7, E11). M<br>→ **Done.** The bar fills from where it stood before the win; the nearest unearned goal is chosen after each reward.
28. Win panel: tease what comes next (next world's mechanic, next new animal) (E11). S<br>→ **Done.** The win panel previews a new world (with its mechanic), a new element or a new animal.
29. Album sets by world, with a permanent reward per completed set (R12). S<br>→ **Done.** Six world sets; each complete set adds a souvenir to the garden.
30. Lower the decoration thresholds so all twelve are reachable with mostly 2-star play (E14, R11). S<br>→ **Done.** Thresholds now end at 600 stars.
31. "World complete" moment: a garden visit, a new-world reveal and a natural stopping point (L13, E11). M<br>→ **Done.** The last level of each world shows the world icon with a check, its stars, the next world and a highlighted garden button.
32. Post-campaign content: weekly rotating sets, endless generated puzzles after level 300, and refilling the daily pool before day 260 (R13). M<br>→ **Done.** Weekly sets of five, an encore track after level 300 that never ends (each lap is turned half a turn), and a daily pool of more than a year.
33. More rescue novelty: each world rescues only 4 species, each about 12 times. Add per-world variants (colours or accessories) as album entries and give each rescue a new name or look (R12). M<br>→ **Done.** Three looks per species (normal, gold and lavender), shown in the album; rescues of a new look are celebrated. Individual names were not added, to stay textless.
34. Garden agency: let players place unlocked decorations, and let rescued animals wear hats (light meta, never blocking) (R11). M<br>→ **Done.** A move mode places decorations and souvenirs; tapping a pet in that mode tries on hats. Both are saved.
35. Shareable daily result as emoji text, only if the Playables frame allows clipboard access (R6). S, after verifying<br>→ **Done, pending a check in the Playables frame.** Shown only where the clipboard is available; the text has no link.

### P3: revenue (within policy)

36. Rewarded "super hint": the full path (hint stage 3), with stages 1–2 free; 1-minute cooldown (M10, M13). S, after item 18<br>→ **Done.** Stages 1–2 free, stage 3 rewarded (free when ads are unavailable), one-minute cooldown.
37. An earlier, targeted skip offer: after 2 minutes, or after 3 restarts on dead-position-heavy levels (M10). S<br>→ **Done.** After 2 minutes of active play or 3 restarts, from level 5.
38. Rewarded "bonus friend": rescue an extra variant animal for the album or garden after a level, opt-in and non-random (choose from 3) (M10). M<br>→ **Done.** After a win (from level 6), the player picks one of three missing looks, then watches; once per win.
39. Daily cap of 6 rewarded views and at most 2 bonus dailies; smaller rewards on repeats (M13). S<br>→ **Partly.** The cap of six rewarded views a day and two bonus dailies are done. Repeat rewards are not made smaller, because each reward is a single item (a hat, a look, a puzzle), not a currency.
40. No interstitial at the break after any rewarded view, and none after a struggle level (M8, M9). S<br>→ **Done.**
41. Guard Next for 400 ms after the win panel appears (M6). S<br>→ **Done.** Rewarded buttons on the win panel and offer cards have the same guard.
42. Test a 5-minute first-session floor, and separately a 2-minute cap, on a web portal for 14+ days before changing Playables (M4, M5, M1). M<br>→ **Needs a web portal.** Not possible here; the test plan is in `docs/AD_POLICY_LOG.md`.
43. Optionally, an interstitial at world transitions (a natural loading break), counted inside the same caps (M3). S<br>→ **Already true.** Pressing Next at a world transition is an ordinary break inside the same caps; no extra placement was added.

### P4: polish and process

44. Device performance pass on a mid-range Android phone and an iPhone: frame rate, memory under 512 MB, time to `gameReady` (P1). M<br>→ **Needs devices.** Not possible here.
45. Optional haptic taps on mobile (`navigator.vibrate`) if Playables allows them; haptics improved enjoyment in a controlled study (E11). S, after verifying<br>→ **Done, pending a check in the Playables frame.** Short taps on a rescue, a win and a blocked move, with an off switch in the pause menu (a Playables requirement found in item 9).
46. Let players skip long slide or current animations by tapping (E11). S<br>→ **Done.** Tapping during a move triples the animation speed for the rest of it.
47. Accessible names for animal and hat buttons in all five languages; currently some use raw species ids (P5). S<br>→ **Done.** Animals, hats, worlds and elements have names in all five languages, read by screen readers only.
48. Publish only one build per game (the duplicate-build ban) and keep test builds private (P7). S<br>→ **Process.** Recorded in `docs/LISTING.md`.
49. Document the ad caps as hypotheses and record each change with dates, to read against YouTube's monthly data (M1). S<br>→ **Done.** `docs/AD_POLICY_LOG.md`.

## What not to do

The research rules these out despite their revenue appeal:

- watch-an-ad to save a streak or progress (L8);
- random rewards for ads (L9);
- countdown or limited-time offers (L10);
- an energy or lives system (R10);
- doubling stars for ads, because stars measure skill and gate the garden (M10);
- interstitials after every level (L6);
- any analytics or tracking call inside the Playables build (P2, L2);
- positioning the game as "for kids" (L1).
