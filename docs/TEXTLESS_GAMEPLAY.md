# Textless core gameplay

Applies to Pet Rescue: Borrow & Escape. This is a product requirement; the evidence section below records what the first build has and has not shown.

## Required player experience

A player who cannot read the displayed language must be able to start, move, recognize the pet and destination, understand danger, select and use a companion capability, complete a rescue, retry and continue.

- Teach the first movement through a brief gesture demonstration with an immediate visible consequence.
- Demonstrate each capability in a safe introductory situation. Its control, valid target and resulting change must be understandable without a written explanation.
- Communicate danger, blocked actions and success through consistent symbols, motion and reactions. Colour alone must not be the sole cue.
- Communicate available versus unavailable capabilities and usable versus unusable targets clearly.
- Use understandable controls for pause, resume, retry, next and sound. Input must work one finger at a time.
- No reading puzzle, written quest, dialogue, text-only objective, text entry or required spoken instruction in the core rescue loop.
- Gameplay comprehension must also work with sound muted. Audio may reinforce information.
- Keep accessibility labels for assistive technology; textless play does not mean removing accessible names.

## No words on screen

The whole game is textless on screen, not only the core loop. Every screen uses pictures, motion and digits. Pictures are not reduced to symbols to decode: where a rule or an offer needs explaining, it plays out as a short animated story on tiles drawn like the game (`src/demos.js`):

- **Companions:** the first rescue of each companion plays its ability: the puppy pushes a boulder into water and it becomes a stepping stone; the frog hops a gap; the duck swims across; the mole digs through a hedge.
- **New elements:** one step onto ice and the rescuer slides to the tree; a current carries the swimmer downstream; a boulder on the plate lights the plate, a dotted line runs to the gate and the gate opens; a bridge falls behind the rescuer and a crossed-out arrow shows there is no way back; the mole goes into one burrow and out of its pair; the hand taps the rescuer to wait while the bee flies past, then the rescuer walks home.
- With reduced motion, each story is shown frozen on its outcome.

- **Rewarded offers** are stories: a video screen (lavender, the colour used only for ads) plays and its bar fills, an arrow pulses, and the exact reward pops out: this level's caged pet jumped over to the next level, the route drawn on a little board, the rescuer wearing the chosen hat, the calendar with +1, or the chosen animal. Accept (the video glyph) and decline (a cross) have the same shape and colour. Declining returns straight to play.
- **Notices** are stories too: a video stopped half-way → a crossed-out gift (the ad was closed early, so no reward), a crossed-out video (no ad available), and a crossed-out cloud (progress could not be saved or loaded; play continues). The save notice appears at most once per session.
- **The no-WebGL screen** is a crossed-out cube.
- **Numbers** (moves and par, star totals, streak days, the countdown to the next daily, rescue counts) are digits. Digits are not tied to a language.

Words exist only for assistive technology: accessible names for every control, animal, hat and puzzle element, and the full wording of each offer and notice in a screen-reader live region (en, es, pt, fr, de).

### Disclosure risk

Ad policies ask for clear disclosure of the ad, the reward and the decline choice. The pictograms show all three, and screen readers get the full sentence. If a YouTube review asks for written disclosure, set `SHOW_OFFER_WORDS` in `src/ui.js` to `true`; the localized sentences already exist.

## Acceptance checks to implement

| Check | Expected evidence |
|---|---|
| First rescue with written gameplay instructions hidden | A new tester can identify the goal, act and finish without verbal coaching. Record actual comprehension and friction; do not declare this passed without testing. |
| New capability with explanatory text hidden | The tester understands the demonstrated action and can use it on a new valid obstacle. |
| Muted sound | Goal, threats, valid input, progress and completion remain understandable. |
| Colour information removed or confused | Shape/symbol/motion or other non-colour cues still distinguish relevant states. |
| One active touch | Movement, selection, action, retry and next all work without simultaneous fingers. |
| Ad declined or unavailable | Ordinary progression remains usable and no reward is granted unless verified. |
| Failure and recovery | The picture notice is understood, and play recovers without reading. |
| No words on screen | Automated: every major screen is scanned for visible text other than digits. |

These are acceptance checks. The tester rows need real players and have not been run.

## Evidence from the build

Automated, in `npm run smoke` (headless Chromium, production build):

- **No words on screen:** the level HUD, win panel, world-complete panel, pause menu, new-element card, map, calendar, garden, album, hats, rewarded offer, bonus-friend picker and no-reward notice are scanned; none shows visible text other than digits.
- **First level:** a tutorial hand is shown on level 1. Real taps rescue the puppy and reach home. Efficient play earns three stars.
- **Controls:** a swipe on the canvas takes one step, undo reverts it, a tap during a long move fast-forwards it, and Esc closes every dialog.
- **Hints:** idle time pulses the hint button (no automatic hand outside tutorials); the button marks the key object, then the next moves, then the whole route.
- **New elements:** the first level with a new element shows a wordless card and then rings the element on the board.
- **Levels:** the first meadow levels are completed in par, and the first, middle and last level of every world are completed. A bee level is solved without a sting.
- **Menus and collection:** the map, calendar, garden (including moving decorations and putting hats on pets), album (six world sets, three looks each) and hat picker (with how each hat is earned) work.
- **Daily and saving:** the daily puzzle is the same for every player, starts a streak and can be shared as emoji text; progress survives a reload.
- **Ads:** the interstitial caps hold; accept and decline look alike; a declined or unavailable ad grants nothing and shows a picture notice; repeated no-fill hides offers; six rewarded views a day is the cap.
- **Feedback:** a blocked move shows a symbol bubble, and an unwinnable position highlights undo and restart.
- **Errors:** no page errors occur.

Implementation, not yet player-tested:

- States use shape and motion cues as well as colour:
  - dashed outlines and locks for unavailable items;
  - a raised button with a pointer for the active companion;
  - pulsing rings for usable targets and crosses for blocked moves;
  - dotted bee routes;
  - gate posts sharing the plate's yellow ring;
  - burrow pairs sharing a marker shape;
  - the ad glyph on every button that plays an ad.
- All input works with one pointer, including waiting for bees by tapping the rescuer.
- The game is fully playable muted.
