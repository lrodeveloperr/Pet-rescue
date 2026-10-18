# Textless core gameplay

Applies to Pet Rescue: Borrow & Escape. This is a product requirement for the planned game, not a report of a completed implementation.

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

These are planned acceptance checks. No executable tests or successful usability results are included in this upload.
