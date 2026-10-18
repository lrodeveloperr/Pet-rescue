# Pet Rescue

**Pet Rescue: Borrow & Escape** is a textless, one-finger 3D puzzle game for YouTube Playables, built with three.js.

- [Game brief](docs/PET_RESCUE_BRIEF.md)
- [Textless gameplay requirements](docs/TEXTLESS_GAMEPLAY.md)

Rescue a caged pet, then lead it home. Each rescued companion lends one ability while it leads: the puppy pushes boulders (into ponds and gaps to make crossings), the frog hops one-tile gaps, the duck swims, and the mole digs through hedges. You cannot switch companion while swimming, which drives the later puzzles.

**Status:** first playable build: 12 levels, 4 companions, 8 friends to rescue. It has not been uploaded, certified, tested on real phones or tested with players. Ads are not implemented, because no ad cadence has been approved.

<p>
  <img src="docs/screenshots/level7-portrait.png" width="240" alt="Level 7 in portrait: rescuer, mole, pond, boulder and a caged piglet">
  <img src="docs/screenshots/win-duck.png" width="240" alt="Win panel: duck rescued, swim ability gained">
</p>
<img src="docs/screenshots/blocked-hint-landscape.png" width="560" alt="Landscape: a blocked boulder shows the puppy face as a hint">

## Run it

```sh
npm install
npm run dev        # local development server
npm run build      # production build in dist/ plus a size report against the Playables limits
npm test           # rules and level tests (Node)
npm run smoke      # plays the production build in headless Chromium and saves screenshots/
```

`dist/` is the folder to zip and upload. `npm run smoke` needs a Chromium; it uses `/opt/pw-browsers/chromium` by default or the path in `CHROMIUM_PATH`.

## Controls (one finger at a time)

| Action | Touch / mouse | Keyboard |
|---|---|---|
| Move | Tap a tile to walk there; tap an obstacle to act on it; or swipe for one step | Arrow keys / WASD |
| Choose companion | Tap its face in the bar | 1–4 |
| Undo / restart | Top-right buttons | Z or Backspace / R |
| Pause, levels, sound | Top-left button | Esc or P |

## How the game stays textless

- The objective strip shows the caged pet → home. The pet gets a heart once it is rescued, and the home starts bouncing.
- A bouncing pin marks the current goal. Pulsing rings mark obstacles the active companion can act on.
- A blocked move shakes the rescuer. A bubble then shows what would help: the needed companion's face (its button pulses), a lock if it is not rescued yet, or a cross.
- On the first four levels a hand demonstrates the next tap. On later levels it appears after 12 seconds idle. The hint comes from a solver, so it is always a valid next move.
- If a move makes the level unwinnable (possible only on levels 8 and 11), undo and restart light up and the hand points at undo.
- Text appears only for save/load failures and missing WebGL (en, es, pt, fr, de), and as accessible names on buttons.

## Size and performance

- The production build is about 157 KB gzipped, against the 15 MiB initial-bundle target. All models are generated in code from primitives, and all sound is synthesized, so the game ships no asset files.
- Each character is merged into one vertex-coloured mesh. Ground and trees are instanced.
- The renderer caps pixel ratio at 2 and lowers it automatically if frames run slower than 45 fps.

## YouTube Playables integration

- The SDK (`https://www.youtube.com/game_api/v1`) loads first in `index.html`. `src/host.js` wraps it and falls back to the browser when the game runs outside YouTube.
- `firstFrameReady` is called after the first render. `gameReady` is called once the level is interactive.
- Progress is stored with `saveData`/`loadData` (localStorage outside YouTube). The score sent through `sendScore` is the number of completed levels.
- `onPause`/`onResume` stop rendering and audio. Audio follows `isAudioEnabled` and `onAudioEnabledChange`, as well as the in-game sound toggle.

## Code map

| File | Purpose |
|---|---|
| `src/logic.js` | Pure rules, tap pathfinding and a breadth-first solver (used by hints, stuck detection and tests) |
| `src/levels.js` | The 12 level maps |
| `src/world.js` | three.js scene, camera fitting, animation and effects |
| `src/models.js` | Procedural low-poly models |
| `src/game.js` | Controller: input, move queue, undo, hints, win flow, progress |
| `src/ui.js`, `src/icons.js`, `src/style.css` | Icon-only interface |
| `src/host.js`, `src/audio.js`, `src/i18n.js` | Playables SDK, synthesized sound, failure messages |
| `test/` | Rule tests and per-level solvability and ability-requirement tests |
| `scripts/` | Size report, level analyser, browser smoke test |
