# Store listing

Material for the YouTube Developer Portal. Check every field against the portal's current form before submitting; the exact thumbnail pixel sizes are listed there, not in the public docs.

## Thumbnails

`listing/` holds thumbnails rendered from real gameplay by `node scripts/listing.mjs` (after `npm run build`):

| Scene | Ratios |
|---|---|
| `rescue-*`: a level in play: rescuer, companions, a caged pet, a river current | 16:9, 1:1, 9:16, 4:3 |
| `garden-*`: the pet garden with rescued animals wearing hats | 16:9, 1:1, 9:16, 4:3 |

They have no text, no logos and no branding (a Playables rule). Each is 2× the listed CSS size (for example 1920×1080 for 16:9). Re-render after visual changes.

## Title

Pet Rescue: Borrow & Escape

## Short description

Rescue caged pets, borrow their abilities, and lead everyone home. A one-finger 3D puzzle with no words to read.

## Long description

Every rescued animal joins you and lends you a skill: the puppy pushes boulders, the frog hops gaps, the duck swims and the mole digs. Choose the right friend at the right moment to free the next pet and get everyone home.

- More than 2,500 puzzles across 51 worlds in six settings: meadow, river, snow, farm, canyon and woods, each with its own twist (currents, ice, gates, crumbling bridges, burrows and bees) and ever-new mixes of them.
- A new puzzle every day, the same for everyone, plus a weekly set and an endless encore after the campaign.
- Undo any move, ask for a hint, and play at your own pace.
- Collect 32 animals in three looks each, fill your album, decorate your garden and dress up with 16 hats.
- No text to read, one finger to play, full of animal sounds.

## Audience and category

- **Audience:** general audience, 13+. Not made for kids. The game is all-ages in content: no violence, no text, no chat, no purchases, no external links.
- **Category:** Puzzle.
- **Ads:** interstitials at natural breaks only (capped), and opt-in rewarded ads. See `docs/AD_POLICY_LOG.md`.

## Accessibility tags

Pick every tag the portal offers that applies:

- Playable without reading (textless).
- One-finger touch; mouse and keyboard also work (arrows/WASD, 1–4 companions, Space to wait, H hint, Z undo, R restart, Esc to close or pause).
- Playable without sound: every cue is visual.
- Colour is never the only cue (shapes, outlines and motion too).
- No time pressure: patrolling bees move only when the player moves or waits.
- Screen-reader names on every control, in English, Spanish, Portuguese, French and German.
- Optional vibration with an off switch.

## Builds

Publish one build of the game only (the duplicate-build ban), and keep test builds private. The `?fakeads` and ad-cap test switches are ignored inside YouTube; `?debug` adds test hooks only when the URL asks for it.
