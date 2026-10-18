# Pet Rescue: Borrow & Escape

Status: planning brief, 18 October 2026. Working title; gameplay is proposed, not implemented or tested. Graphics are intentionally unspecified.

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

Preserve earned companion ownership and meaningful progress through the selected host's supported save mechanism. The implementation contract still needs the exact progression catalogue, failure/retry rules, save schema and acceptance tests before build.

## Advertising boundaries

The full escape and reunion/capability reveal precede any eligible next-round interruption. A single optional checkpoint continue after a substantial failed attempt is a proposal to assess; basic ability acquisition remains earned through play.

First/subsequent cadence, active-time gates and reward entitlements are not finalized in this brief. Do not import Toybox or Haircut thresholds automatically or implement monetization changes without authorization. No banners. Ordinary play must remain usable after cancellation, error or no fill. Never grant an unverified reward or stack rewarded followed by an interstitial.

## Evidence and limits

The 7–17 October 2026 retained Playables comparison recorded approximately 480K nominal incremental plays/day for The Egg Stealing Master and 460K/day for Shift Shapes Car. Those are rounded incumbent counter differences, not forecasts for this product. Existing pet-collection and form-switching games corroborate the component motivations; they do not prove the borrowed-ability combination will succeed.

Sources:
- https://playables.games/games/the-egg-stealing-master/
- https://playables.games/games/shift-shapes-car/
- https://play.google.com/store/apps/details?id=com.game.shape.shift
- https://play.google.com/store/apps/details?id=es.socialpoint.DragonCity

The main risk is selection friction: too many capabilities, unclear affordances or remembering the right pet may undermine immediate comprehension. No claimed audience-fit percentage, measured retention, guaranteed novelty, certification or successful build exists at this planning stage.

## Implementation boundary

This upload contains planning documents only. A full implementation contract must settle mechanics, content/exhaustion, progression, exact ad rules, host lifecycle, cloud saving, localization, performance budgets and acceptance evidence. Preserve user-approved decisions and leave graphics unspecified.
