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

## Necessary localized text

Concise localized text remains permitted for voluntary advertising offers, the precise reward and scope, settings where a symbol is ambiguous, save/SDK/connectivity failures and recovery, and applicable privacy/legal notices.

Never hide reward conditions behind an unexplained symbol. Optional rewarded offers must clearly identify the ad, reward, duration/scope and decline choice. A player who declines continues normal play.

## Acceptance checks to implement

| Check | Expected evidence |
|---|---|
| First rescue with written gameplay instructions hidden | A new tester can identify the goal, act and finish without verbal coaching. Record actual comprehension and friction; do not declare this passed without testing. |
| New capability with explanatory text hidden | The tester understands the demonstrated action and can use it on a new valid obstacle. |
| Muted sound | Goal, threats, valid input, progress and completion remain understandable. |
| Colour information removed or confused | Shape/symbol/motion or other non-colour cues still distinguish relevant states. |
| One active touch | Movement, selection, action, retry and next all work without simultaneous fingers. |
| Ad declined or unavailable | Ordinary progression remains usable and no reward is granted unless verified. |
| Failure and recovery | A clear localized explanation and usable recovery remain available where a symbol alone is insufficient. |

These are acceptance checks. The tester rows need real players and have not been run.

## Evidence from the build

Automated, in `npm run smoke` (headless Chromium, production build):

- **First level:** a tutorial hand is shown on level 1. Real taps rescue the puppy and reach home. Efficient play earns three stars.
- **Controls:** a swipe on the canvas takes one step, and undo reverts it.
- **Levels:** levels 1–12 are completed in par moves through the game controller. The first, middle and last level of every world are completed. A bee level is solved without a sting.
- **Menus and collection:** the map, garden, album and hat picker work. Tapping a garden pet makes it hop.
- **Daily and saving:** the daily puzzle starts a streak, progress survives a reload, and the win panel invites to the daily once it unlocks.
- **Interstitial caps:** no interstitial in the first levels, one after three levels and the minimum time, and none straight after a rewarded ad.
- **Rewarded offers:** the skip offer explains the ad and reward in words. An accepted rewarded ad skips the level or unlocks a hat. An unfinished one grants nothing and play continues, and "No thanks" returns straight to play.
- **Feedback:** a blocked move shows a symbol bubble, and an unwinnable position highlights undo and restart.
- **Errors:** no page errors occur.

Implementation, not yet player-tested:

- The core loop shows no text.
- States use shape and motion cues as well as colour:
  - dashed outlines and locks for unavailable items;
  - a raised button with a pointer for the active companion;
  - pulsing rings for usable targets and crosses for blocked moves;
  - dotted bee routes;
  - gate posts sharing the plate's yellow ring;
  - burrow pairs sharing a marker shape.
- All input works with one pointer, including waiting for bees by tapping the rescuer.
- The game is fully playable muted.
- Buttons have accessible names.
- Ad offers and failure messages are localized in en, es, pt, fr and de.
