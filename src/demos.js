// Animated picture stories. Instead of a symbol to decode, each one plays the rule out on a
// few tiles drawn like the game: the cause, then the effect, on a loop. Used on the cards that
// introduce a new element or companion, and on rewarded-ad offers and notices.
// Motion lives in style.css (the "Demos" section); with reduced motion each story is shown
// frozen on its outcome.
import { faceBody, UI, HAT_ICONS } from './icons.js';
import { VARIANT_TINTS } from './models.js';

const O = '#2a2230';
const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const scene = (name, body, vb = '0 0 200 100') => `<svg class="demo demo-${name}" viewBox="${vb}" aria-hidden="true" focusable="false">${body}</svg>`;
const g = (cls, body, attrs = '') => `<g class="${cls}" ${attrs}>${body}</g>`;

// ---------- tiles (40 units) ----------

const tile = (x, y, fill, extra = '') => `<rect x="${x + 1.5}" y="${y + 1.5}" width="37" height="37" rx="7" fill="${fill}" stroke="${O}" stroke-width="2"/>${extra}`;
const grass = (x, y) => tile(x, y, '#8fd36a', `<path d="M${x + 10} ${y + 30} l2 -5 l2 5 M${x + 27} ${y + 14} l2 -5 l2 5" fill="none" stroke="#5fa844" stroke-width="1.6" stroke-linecap="round"/>`);
const water = (x, y) =>
  tile(x, y, '#5bbfe9', `<path d="M${x + 7} ${y + 15} q5 -4 10 0 t10 0 M${x + 12} ${y + 28} q5 -4 10 0 t10 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.85"/>`);
const ice = (x, y) => tile(x, y, '#dff3ff', `<path d="M${x + 9} ${y + 13} l9 -4 M${x + 21} ${y + 31} l10 -5 M${x + 8} ${y + 26} l5 -2" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M${x + 25} ${y + 10} l6 -2" stroke="#9fd2f2" stroke-width="2" stroke-linecap="round"/>`);
const gap = (x, y) => `<rect x="${x + 1.5}" y="${y + 1.5}" width="37" height="37" rx="4" fill="#3a3238"/><rect x="${x + 5}" y="${y + 30}" width="30" height="6" rx="2" fill="#241e28"/>`;
const tree = (x, y) =>
  grass(x, y) + `<rect x="${x + 17}" y="${y + 22}" width="6" height="13" rx="1" fill="#8a5a36" stroke="${O}" stroke-width="1.5"/><circle cx="${x + 20}" cy="${y + 16}" r="13" fill="#3f8f52" stroke="${O}" stroke-width="2"/><circle cx="${x + 15}" cy="${y + 12}" r="4" fill="#63c24c"/>`;
const hedgeBush = (x, y) =>
  `<g fill="#3f8f52" stroke="${O}" stroke-width="1.8"><circle cx="${x + 12}" cy="${y + 24}" r="9"/><circle cx="${x + 28}" cy="${y + 24}" r="9"/><circle cx="${x + 20}" cy="${y + 14}" r="10"/></g><circle cx="${x + 16}" cy="${y + 12}" r="3" fill="#e5474b"/><circle cx="${x + 27}" cy="${y + 20}" r="3" fill="#e5474b"/>`;
const boulder = (cx, cy, r = 12) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#9a9aa6" stroke="${O}" stroke-width="2"/><circle cx="${cx - 4}" cy="${cy - 4}" r="${r / 3}" fill="#c8c8d2"/>`;
const plate = (x, y) => grass(x, y) + `<rect x="${x + 6}" y="${y + 11}" width="28" height="18" rx="4" fill="#8a8a96" stroke="${O}" stroke-width="2"/><circle cx="${x + 20}" cy="${y + 20}" r="6" fill="#ffc83d" stroke="${O}" stroke-width="1.8"/>`;
const holeAt = (cx, cy) => `<ellipse cx="${cx}" cy="${cy}" rx="13" ry="7" fill="#5a3a22" stroke="${O}" stroke-width="2"/><ellipse cx="${cx}" cy="${cy + 1}" rx="8" ry="3.5" fill="#241e28"/>`;
const house = (x, y) =>
  grass(x, y) + `<path d="M${x + 6} ${y + 18} L${x + 20} ${y + 6} L${x + 34} ${y + 18}Z" fill="#e0534d" stroke="${O}" stroke-width="2" stroke-linejoin="round"/><rect x="${x + 10}" y="${y + 17}" width="20" height="16" fill="#fbe9cf" stroke="${O}" stroke-width="2"/><rect x="${x + 17}" y="${y + 23}" width="6" height="10" fill="#9a5b34"/>`;
const bee = (cx, cy) =>
  `<g><ellipse cx="${cx - 4}" cy="${cy - 8}" rx="6" ry="4" fill="#fff" stroke="${O}" stroke-width="1.5" opacity="0.95"/><ellipse cx="${cx + 4}" cy="${cy - 8}" rx="6" ry="4" fill="#fff" stroke="${O}" stroke-width="1.5" opacity="0.95"/>` +
  `<ellipse cx="${cx}" cy="${cy}" rx="10" ry="8" fill="#ffd84a" stroke="${O}" stroke-width="2"/><path d="M${cx - 3} ${cy - 7} v14 M${cx + 3} ${cy - 7} v14" stroke="${O}" stroke-width="2.5"/><circle cx="${cx + 7}" cy="${cy - 2}" r="1.6" fill="${O}"/></g>`;
const dots = (cx, cy) => `<g fill="${O}" opacity="0.35"><circle cx="${cx - 8}" cy="${cy - 8}" r="2.4"/><circle cx="${cx + 8}" cy="${cy + 8}" r="2.4"/><circle cx="${cx + 8}" cy="${cy - 8}" r="2.4"/><circle cx="${cx - 8}" cy="${cy + 8}" r="2.4"/></g>`;
const heart = (cx, cy, size = 18) => `<g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${size / 64})">${inner(UI.heart)}</g>`;
const cross = (cx, cy, size = 26) => `<g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${size / 64})">${inner(UI.cross)}</g>`;
const icon = (svg, cx, cy, size) => `<g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${size / 64})">${inner(svg)}</g>`;

/** An animal (or the rescuer) as its face, centred at (cx, cy). */
const actor = (kind, cx, cy, size = 30) => `<g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${size / 64})">${faceBody(kind)}</g>`;
/** A pointing hand whose fingertip touches (x, y). */
const hand = (x, y, size = 30) => `<g transform="translate(${x - (29 * size) / 64} ${y - (4 * size) / 64}) scale(${size / 64})">${inner(UI.hand)}</g>`;
const speedLines = (x, y) => `<path d="M${x - 26} ${y - 6} h12 M${x - 30} ${y + 2} h14 M${x - 25} ${y + 10} h10" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M${x - 26} ${y - 6} h12 M${x - 30} ${y + 2} h14 M${x - 25} ${y + 10} h10" stroke="${O}" stroke-width="1" stroke-linecap="round" opacity="0.5"/>`;
const shadowRow = (y, n = 5) => `<rect x="2" y="${y + 36}" width="${n * 40 - 4}" height="6" rx="3" fill="${O}" opacity="0.12"/>`;

// ---------- new elements ----------

export const MECH_DEMOS = {
  // Ice: one step onto the ice and you slide until something stops you.
  ice: () =>
    scene(
      'ice',
      shadowRow(40) + grass(0, 40) + ice(40, 40) + ice(80, 40) + ice(120, 40) + tree(160, 40) +
        g('a-ice-bump', `<path d="M158 44 l-6 -6 M160 58 l-9 0 M158 72 l-6 6" stroke="${O}" stroke-width="2.5" stroke-linecap="round"/>`) +
        g('a-ice-hero', g('a-ice-lines', speedLines(20, 58)) + actor('rescuer', 20, 58)) +
        g('a-ice-hand', hand(62, 64)),
    ),
  // Current: the water carries a swimmer downstream.
  current: () =>
    scene(
      'current',
      shadowRow(40) + water(0, 40) + water(40, 40) + water(80, 40) + water(120, 40) + grass(160, 40) +
        [0, 40, 80, 120].map((x) => g('a-flow', `<path d="M${x + 13} 48 l10 12 l-10 12" fill="none" stroke="#1f6fa8" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`)).join('') +
        g('a-current-hero', g('a-bob', actor('duck', 26, 62, 32) + actor('rescuer', 11, 48, 24))),
    ),
  // Plate and gate: weight on the plate opens the gate.
  gate: () =>
    scene(
      'gate',
      shadowRow(8, 3) + grass(0, 8) + grass(40, 8) + plate(80, 8) + tree(120, 8) + tree(160, 8) +
        shadowRow(52) + grass(0, 52) + grass(40, 52) + grass(80, 52) + grass(120, 52) + house(160, 52) +
        g('a-gate-glow', `<circle cx="100" cy="28" r="17" fill="none" stroke="#ffc83d" stroke-width="4"/>`) +
        g('a-gate-link', `<path d="M108 44 Q130 46 136 60" fill="none" stroke="#ffc83d" stroke-width="3.5" stroke-dasharray="5 4" stroke-linecap="round"/>`) +
        // Gate posts with yellow caps (like the plate's ring), and bars that sink when open.
        `<rect x="123" y="56" width="7" height="32" rx="2" fill="#8a5a36" stroke="${O}" stroke-width="1.8"/><rect x="150" y="56" width="7" height="32" rx="2" fill="#8a5a36" stroke="${O}" stroke-width="1.8"/>` +
        `<circle cx="126.5" cy="55" r="4.5" fill="#ffc83d" stroke="${O}" stroke-width="1.6"/><circle cx="153.5" cy="55" r="4.5" fill="#ffc83d" stroke="${O}" stroke-width="1.6"/>` +
        g('a-gate-bars', `<rect x="129" y="62" width="22" height="6" rx="2" fill="#c0843c" stroke="${O}" stroke-width="1.6"/><rect x="129" y="74" width="22" height="6" rx="2" fill="#c0843c" stroke="${O}" stroke-width="1.6"/>`) +
        g('a-gate-boulder', boulder(60, 28)) +
        g('a-gate-puppy', actor('puppy', 22, 28, 26)) +
        g('a-gate-hero', actor('rescuer', 20, 72, 28)) +
        g('a-gate-heart', heart(180, 56, 20)),
      '0 0 200 100',
    ),
  // Crumbling bridge: it holds once, then falls behind you.
  bridge: () =>
    scene(
      'bridge',
      shadowRow(40) + grass(0, 40) + gap(40, 40) + gap(80, 40) + grass(120, 40) + grass(160, 40) +
        g('a-plank1', `<rect x="41" y="50" width="38" height="20" rx="3" fill="#c0843c" stroke="${O}" stroke-width="2"/><path d="M52 50 v20 M66 50 v20" stroke="${O}" stroke-width="1.6"/>`) +
        g('a-plank2', `<rect x="81" y="50" width="38" height="20" rx="3" fill="#c0843c" stroke="${O}" stroke-width="2"/><path d="M92 50 v20 M106 50 v20" stroke="${O}" stroke-width="1.6"/>`) +
        g('a-bridge-hero', actor('rescuer', 20, 58)) +
        g('a-bridge-x', `<path d="M118 22 Q80 4 44 22" fill="none" stroke="${O}" stroke-width="2.5" stroke-dasharray="4 4"/><path d="M50 14 L44 22 L54 26" fill="none" stroke="${O}" stroke-width="2.5" stroke-linecap="round"/>` + cross(80, 20, 26)),
    ),
  // Burrows: with the mole leading, in one hole and out of its pair.
  burrow: () =>
    scene(
      'burrow',
      shadowRow(40) + grass(0, 40) + grass(40, 40) + tree(80, 40) + grass(120, 40) + grass(160, 40) + holeAt(60, 64) + holeAt(140, 64) +
        g('a-burrow-arc', `<path d="M60 56 Q100 -4 140 56" fill="none" stroke="#8a5a36" stroke-width="3.5" stroke-dasharray="6 5" stroke-linecap="round"/>`) +
        g('a-burrow-in', actor('mole', 20, 56)) +
        g('a-burrow-out', actor('mole', 140, 56)),
    ),
  // Bees: they fly a fixed route. Tap yourself to wait, then go when the way is clear.
  bees: () =>
    scene(
      'bees',
      shadowRow(52) + grass(0, 52) + grass(40, 52) + grass(80, 52) + grass(120, 52) + house(160, 52) + grass(80, 8) + dots(100, 28) + dots(100, 72) +
        g('a-bee', g('a-buzz', bee(100, 72))) +
        g('a-bees-hero', actor('rescuer', 60, 72, 28)) +
        g('a-bees-clock', icon(UI.clock, 60, 44, 18)) +
        g('a-bees-hand', hand(62, 74, 26)),
    ),
};

// ---------- companions ----------

export const ABILITY_DEMOS = {
  // Puppy: push a boulder into water and it becomes a stepping stone.
  push: () =>
    scene(
      'push',
      shadowRow(40) + grass(0, 40) + grass(40, 40) + water(80, 40) + grass(120, 40) + grass(160, 40) +
        g('a-push-stone', `<ellipse cx="100" cy="62" rx="14" ry="8" fill="#9a9aa6" stroke="${O}" stroke-width="2"/><ellipse cx="96" cy="59" rx="5" ry="2.5" fill="#c8c8d2"/>`) +
        g('a-push-splash', `<path d="M86 50 l-5 -8 M100 46 v-10 M114 50 l5 -8" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`) +
        g('a-push-boulder', boulder(60, 58)) +
        g('a-push-hero', actor('rescuer', 9, 46, 24) + actor('puppy', 26, 62, 32)),
    ),
  // Frog: hop over a gap.
  hop: () =>
    scene(
      'hop',
      shadowRow(40) + grass(0, 40) + gap(40, 40) + grass(80, 40) + grass(120, 40) + grass(160, 40) +
        g('a-hop-arc', `<path d="M20 50 Q60 0 100 50" fill="none" stroke="${O}" stroke-width="2.5" stroke-dasharray="4 4"/>`) +
        g('a-hop-hero', actor('rescuer', 8, 46, 24) + actor('frog', 24, 62, 32)),
    ),
  // Duck: swim across water.
  swim: () =>
    scene(
      'swim',
      shadowRow(40) + grass(0, 40) + water(40, 40) + water(80, 40) + water(120, 40) + grass(160, 40) +
        g('a-swim-hero', g('a-bob', actor('rescuer', 9, 46, 24) + actor('duck', 26, 62, 32))),
    ),
  // Mole: dig through a hedge.
  dig: () =>
    scene(
      'dig',
      shadowRow(40) + grass(0, 40) + grass(40, 40) + grass(80, 40) + grass(120, 40) + grass(160, 40) +
        g('a-dig-dirt', `<ellipse cx="60" cy="62" rx="15" ry="9" fill="#8a5a36" stroke="${O}" stroke-width="2"/><circle cx="54" cy="60" r="2.5" fill="#5a3a22"/><circle cx="66" cy="64" r="2" fill="#5a3a22"/>`) +
        g('a-dig-hedge', hedgeBush(40, 40)) +
        g('a-dig-bits', `<g fill="#3f8f52" stroke="${O}" stroke-width="1"><circle cx="48" cy="40" r="3"/><circle cx="72" cy="38" r="3"/><circle cx="60" cy="32" r="2.5"/></g>`) +
        g('a-dig-hero', actor('rescuer', 9, 46, 24) + actor('mole', 26, 62, 32)),
    ),
};

// ---------- ad offers and notices ----------

const tv = (bar = 'a-tv-bar', broken = false) =>
  `<rect x="6" y="10" width="76" height="56" rx="10" fill="#c9b8ff" stroke="${O}" stroke-width="3"/><rect x="14" y="17" width="60" height="42" rx="6" fill="${O}"/>` +
  (broken ? cross(44, 38, 30) : `<path d="M37 27 L55 38 L37 49Z" fill="#fff"/>`) +
  `<rect x="14" y="74" width="60" height="9" rx="4.5" fill="#fff" stroke="${O}" stroke-width="2"/>` +
  g(bar, `<rect x="15" y="75" width="58" height="7" rx="3.5" fill="#7b5cff"/>`) +
  `<path d="M30 92 h28" stroke="${O}" stroke-width="3" stroke-linecap="round"/>`;
const arrowAt = (x) => g('a-offer-arrow', `<path d="M${x} 46 h28 M${x + 18} 34 l12 12 l-12 12" fill="none" stroke="${O}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`);

/** The reward picture for each rewarded offer, drawn in a 96×96 box at x = 140. */
const REWARD_ART = {
  // Skip: this level's node, jumped over to the next one.
  skip: ({ pet = 'kitten' } = {}) =>
    `<rect x="142" y="44" width="40" height="40" rx="9" fill="#fff" stroke="${O}" stroke-width="2.5"/>` + actor(pet, 162, 64, 30) +
    `<path d="M152 46 v36 M162 46 v36 M172 46 v36" stroke="#8a5a36" stroke-width="2.5"/>` +
    `<rect x="194" y="44" width="40" height="40" rx="9" fill="#fff3d6" stroke="${O}" stroke-width="2.5"/>` + icon(UI.star, 214, 64, 26) +
    g('a-skip-arc', `<path d="M162 40 Q188 0 212 38" fill="none" stroke="${O}" stroke-width="3" stroke-dasharray="5 4" stroke-linecap="round"/><path d="M204 32 L212 40 L216 30" fill="none" stroke="${O}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`),
  // Whole route: a little board with the path drawn from the rescuer to the cage and home.
  hint: () => {
    let tiles = '';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) tiles += `<rect x="${146 + c * 28}" y="${8 + r * 28}" width="26" height="26" rx="5" fill="${(r + c) % 2 ? '#8fd36a' : '#a2dc7e'}" stroke="${O}" stroke-width="1.5"/>`;
    return (
      tiles + `<rect x="202" y="64" width="26" height="26" rx="5" fill="#3f8f52" stroke="${O}" stroke-width="1.5"/>` +
      g('a-route', `<path d="M159 77 V49 H215 V21" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="1 9" stroke-linecap="round"/>`) +
      actor('rescuer', 159, 77, 22) + `<rect x="204" y="10" width="22" height="22" rx="4" fill="#c0843c" stroke="${O}" stroke-width="1.5"/>` + actor('kitten', 215, 21, 16) +
      `<path d="M206 12 v18 M212 12 v18 M218 12 v18 M224 12 v18" stroke="${O}" stroke-width="1.3"/>` + icon(UI.home, 187, 21, 22)
    );
  },
  // Hat: the rescuer wearing the chosen hat.
  hat: ({ hat = 'crown' } = {}) => actor('rescuer', 188, 64, 60) + icon(HAT_ICONS[hat], 188, 36, 44),
  // Bonus daily: one more daily puzzle today.
  bonus: () => icon(UI.calendar, 184, 52, 70) + `<text x="214" y="30" font-size="22" font-weight="900" fill="${O}" stroke="#fff" stroke-width="4" paint-order="stroke">+1</text>`,
  // Bonus friend: the chosen animal in its new look.
  friend: ({ kind = 'kitten', variant = 1 } = {}) =>
    `<circle cx="188" cy="52" r="38" fill="${variant ? `#${VARIANT_TINTS[variant].toString(16).padStart(6, '0')}` : '#fff'}" opacity="0.55"/>` + actor(kind, 188, 52, 64) + icon(UI.sparkle, 222, 18, 24),
};

/** Offer story: a video plays, then the reward appears. */
export function offerScene(kind, opts) {
  return scene(`offer offer-${kind}`, tv() + arrowAt(96) + g('a-reward', REWARD_ART[kind](opts)), '0 0 240 100');
}

/** Notice stories: what went wrong, without words. */
export function noticeScene(kind) {
  if (kind === 'noReward') return scene('notice', tv('a-tv-stop') + arrowAt(96) + icon(UI.gift, 188, 50, 64) + cross(214, 74, 32), '0 0 240 100');
  if (kind === 'noAd') return scene('notice', tv('a-tv-none', true), '0 0 90 100');
  return scene('notice', icon(UI.cloud, 45, 50, 70) + cross(70, 74, 30), '0 0 90 100');
}
