# Pet Rescue: Borrow & Escape

Status: brief, 18 October 2026, with a playable build (see the README): 300 campaign levels in six worlds, 260 daily puzzles, engagement systems and capped ads. Working title. The build has automated rule, level and browser tests only: no player testing, real-device measurement, upload or certification. Rendering engine: three.js (see Graphics engine and size budget).

## Product promise

Rescue a pet on a short escape route. The rescued companion lends an ability that changes how the next rescue can be solved. Collecting a pet therefore changes play, rather than only adding an entry to a collection.

## Psychological foundation

Protective tension, discovery, attachment and growing capability. The player should see the pet that needs help, understand the immediate obstacle, cause a useful change and enjoy the complete escape and reunion.

The original interpretation is the recurring companion-capability decision. A different name, setting or appearance alone is not the differentiator.

## Core loop

1. Enter a compact scene with a visible pet, threat or obstacle, and destination.
2. Move through a readable route and use an available companion ability when helpful.
3. Rescue the pet and complete the escape.
4. Appreciate the reunion and demonstrate the acquired capability.
5. Choose another rescue with a meaningfully different route or capability interaction.

Begin with one available capability and introduce additional choices through play. Keep the initial ability set small. Examples for evaluation: moving a heavy obstacle, crossing a gap or travelling through water. These examples are design proposals, not a finalized catalogue.

The selected companion must change what the player can do. Essential rescues must remain solvable using the capabilities actually available. No forced wait, paid ability or served ad may be necessary to complete ordinary progression.

## Input and language

Target one-finger play: movement and ability selection can happen sequentially. Do not require simultaneous touches, a held movement gesture plus a second finger, text input or spoken commands.

Core gameplay must be understandable and completable without reading. Follow [TEXTLESS_GAMEPLAY.md](TEXTLESS_GAMEPLAY.md). Functional notices and voluntary ad offers may use concise localized text.

## Replay and progression

Change route dependencies, obstacle interactions and meaningful companion choices. Revisit situations with new capabilities only where the available solution genuinely changes. Do not count palette changes, rarity labels or random seeds as separate gameplay content.

Preserve earned companion ownership and meaningful progress through the selected host's supported save mechanism.

Implemented on 18 October 2026, at the user's request to maximise engagement and variety:

- **Worlds:** six worlds of 50 levels. Each world after the Meadow adds one mechanic that changes routes: river currents, ice, plates and gates, crumbling bridges, and mole burrows with patrolling bees.
- **Level checks:** every level is solver-verified to depend on its mechanic and on its companions. Duplicate maps are removed even when rotated or mirrored.
- **Daily puzzle and streak:** a daily puzzle drawn from a separate pool of 260.
- **Stars and garden:** stars against par moves, a pet garden with star-unlocked decorations, and an album of all 32 animals.
- **Hats:** cosmetic hats.
- **Not counted as gameplay content:** palette changes and new animals are collection rewards, not puzzle variety.

## Advertising boundaries

The full escape and reunion/capability reveal precede any eligible next-round interruption. A single optional checkpoint continue after a substantial failed attempt is a proposal to assess; basic ability acquisition remains earned through play.

No banners. Ordinary play must remain usable after cancellation, error or no fill. Never grant an unverified reward or stack rewarded followed by an interstitial. Do not import Toybox or Haircut thresholds automatically.

On 18 October 2026 the user approved this policy to maximise ad revenue. It is implemented in `src/ads.js`, where every cap can be tuned:

- **Interstitials:**
  - only when the player presses *next* after the full escape and celebration;
  - none in the first three completed levels;
  - at most one per three levels *and* three minutes, whichever is later;
  - none within 90 seconds after a rewarded ad.
- **Rewarded, voluntary, with localized text naming the ad, the reward and a decline button:**
  - *skip level:* offered after three minutes on a level, from level 5; the skipped level can still be completed for stars;
  - *mystery hat:* cosmetic;
  - *one bonus daily puzzle:* after the day's puzzle.

Hints, undo and restart stay free, so no ad is ever needed to progress. The caps are starting values to be tuned from YouTube analytics after onboarding.

## Graphics engine and size budget

Use **three.js** for real-time 3D. The requirement is good-enough 3D with minimal startup time. In a minimal measured scene (WebGL renderer, camera, lights, mesh and glTF loader; esbuild-minified, gzip -9, 18 October 2026), three.js 0.186.1 compressed to about 151 KB, against about 503 KB for PlayCanvas 2.23.3 and about 645 KB for tree-shaken Babylon.js 9.31.0. three.js needs no WebAssembly compilation or separate runtime boot before the first frame. Unity and Godot 4 web exports were not measured; their WebAssembly runtimes typically cost several MiB and start more slowly on phones. PlayCanvas is the fallback if an editor-based art workflow becomes necessary.

YouTube Playables limits, as reported in Google's certification pages (re-confirm before build, because revisions have changed them):

| Limit | Value |
|---|---|
| Initial bundle (bytes downloaded until `gameReady`, after HTTP compression) | Must be under 30 MiB; target under 15 MiB |
| Total bundle | 250 MiB |
| Any single file | Under 30 MiB |
| Saved game data | Under 3 MiB |
| JavaScript heap | 512 MB |

Proposed initial-bundle budget, within the 15 MiB target:

| Item | Budget |
|---|---|
| Engine and game code | 1–2 MiB |
| Models and textures for the menu and first rescue | 4–6 MiB |
| Audio needed at start | 2–3 MiB |
| Remaining headroom | at least 4 MiB |

Asset and startup rules:

- Models: glTF/GLB with Meshopt or Draco compression; low-poly stylised pets, roughly 3–8k triangles each.
- Textures: KTX2/Basis, so they stay compressed in GPU memory as well as in transfer.
- Lighting: baked lighting and ambient occlusion; at most one inexpensive real-time shadow, or blob shadows.
- Shaders: compile during loading so the first interaction does not stutter.
- Loading: fetch only the menu and first rescue before `gameReady`; stream later rescues afterwards.
- The game must adapt to portrait, landscape and arbitrary aspect ratios.
- The store cover/thumbnail is a separately uploaded image and may be an offline high-quality render of the same models.

First build, measured 18 October 2026: about 162 KB gzipped in total, because models are generated from primitives and sound and music are synthesized. Frame rate on real phones and certification have not been measured.

Sources:
- https://developers.google.com/youtube/gaming/playables/certification/requirements_stability
- https://developers.google.com/youtube/gaming/playables/certification/revisionhistory
- https://developers.google.com/youtube/gaming/playables/support/faq

## Evidence and limits

The 7–17 October 2026 retained Playables comparison recorded approximately 480K nominal incremental plays/day for The Egg Stealing Master and 460K/day for Shift Shapes Car. Those are rounded incumbent counter differences, not forecasts for this product. Existing pet-collection and form-switching games corroborate the component motivations; they do not prove the borrowed-ability combination will succeed.

Sources:
- https://playables.games/games/the-egg-stealing-master/
- https://playables.games/games/shift-shapes-car/
- https://play.google.com/store/apps/details?id=com.game.shape.shift
- https://play.google.com/store/apps/details?id=es.socialpoint.DragonCity

The main risk is selection friction: too many capabilities, unclear affordances or remembering the right pet may undermine immediate comprehension. No claimed audience-fit percentage, measured retention, guaranteed novelty, certification or successful build exists at this planning stage.

## Implementation boundary

The build implements:

- the core loop with four companions (puppy push, frog hop, duck swim, mole dig);
- six worlds of 50 levels and 260 daily puzzles;
- 32 rescuable animals;
- stars, daily streaks, a pet garden, an album and hats;
- capped interstitial and rewarded ads;
- the Playables lifecycle, saving and textless guidance.

Automated tests prove that:

- every level is solvable with the companions available when it is first played, in exactly its par moves;
- each companion's introduction level needs that companion;
- every later world's levels use that world's mechanic;
- no map repeats, even rotated or mirrored.

Some levels can be made unwinnable; undo and restart recover them, and the game highlights both when it happens.

Still open:

- player testing of difficulty and fun;
- the human acceptance checks in [TEXTLESS_GAMEPLAY.md](TEXTLESS_GAMEPLAY.md);
- real-device performance;
- localization beyond ad offers and failure messages in five languages;
- tuning the ad caps from analytics;
- how YouTube classifies a pet game for child audiences, which can restrict ads;
- Playables onboarding, upload and certification.

Preserve user-approved decisions, including three.js as the rendering engine.
