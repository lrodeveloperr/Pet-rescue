// Inline SVG icons. Every symbol has a distinct silhouette so states never rely on colour alone.
const O = '#2a2230';
const svg = (body, vb = 64) => `<svg viewBox="0 0 ${vb} ${vb}" aria-hidden="true" focusable="false">${body}</svg>`;
const eyes = (y = 34, dx = 8, r = 3.2) =>
  `<circle cx="${32 - dx}" cy="${y}" r="${r}" fill="${O}"/><circle cx="${32 + dx}" cy="${y}" r="${r}" fill="${O}"/>` +
  `<circle cx="${32 - dx + 1}" cy="${y - 1.2}" r="1" fill="#fff"/><circle cx="${32 + dx + 1}" cy="${y - 1.2}" r="1" fill="#fff"/>`;
const head = (fill, r = 19, cy = 36) => `<circle cx="32" cy="${cy}" r="${r}" fill="${fill}" stroke="${O}" stroke-width="2.5"/>`;
const s = `stroke="${O}" stroke-width="2.5" stroke-linejoin="round"`;

const FACES = {
  puppy:
    `<ellipse cx="14" cy="34" rx="7" ry="13" fill="#7b4a24" ${s} transform="rotate(18 14 34)"/>` +
    `<ellipse cx="50" cy="34" rx="7" ry="13" fill="#7b4a24" ${s} transform="rotate(-18 50 34)"/>` +
    head('#c8874a') + `<ellipse cx="32" cy="43" rx="10" ry="7" fill="#f3dcb8"/>` + eyes(33) +
    `<ellipse cx="32" cy="40" rx="3.6" ry="2.6" fill="${O}"/>`,
  frog:
    `<circle cx="20" cy="22" r="8" fill="#63c24c" ${s}/><circle cx="44" cy="22" r="8" fill="#63c24c" ${s}/>` +
    `<ellipse cx="32" cy="38" rx="23" ry="16" fill="#63c24c" ${s}/>` +
    `<circle cx="20" cy="22" r="4.5" fill="#fff"/><circle cx="44" cy="22" r="4.5" fill="#fff"/>` +
    `<circle cx="20" cy="22" r="2.4" fill="${O}"/><circle cx="44" cy="22" r="2.4" fill="${O}"/>` +
    `<path d="M20 42 Q32 50 44 42" fill="none" stroke="${O}" stroke-width="2.5" stroke-linecap="round"/>`,
  duck:
    head('#ffd54a', 19, 33) + eyes(30, 8) +
    `<path d="M20 41 Q32 36 44 41 Q32 52 20 41Z" fill="#f08a24" ${s}/>`,
  mole:
    head('#5d4c48') + `<path d="M21 31 l6 1 M43 31 l-6 1" stroke="#f6efe6" stroke-width="3" stroke-linecap="round"/>` +
    `<ellipse cx="32" cy="42" rx="7" ry="5.5" fill="#f29bb0" ${s}/>` +
    `<path d="M14 50 l4 -6 M18 52 l3 -7 M50 50 l-4 -6 M46 52 l-3 -7" stroke="#f6efe6" stroke-width="2.5" stroke-linecap="round"/>`,
  kitten:
    `<path d="M15 30 L17 10 L30 21Z M49 30 L47 10 L34 21Z" fill="#f2a54a" ${s}/>` +
    head('#f2a54a') + eyes(34) + `<path d="M29 40 L35 40 L32 43Z" fill="#e77d8c"/>` +
    `<path d="M14 40 h8 M14 44 h8 M42 40 h8 M42 44 h8" stroke="${O}" stroke-width="1.6"/>`,
  bunny:
    `<ellipse cx="24" cy="14" rx="5.5" ry="13" fill="#f5f1ea" ${s}/><ellipse cx="40" cy="14" rx="5.5" ry="13" fill="#f5f1ea" ${s}/>` +
    `<ellipse cx="24" cy="14" rx="2.5" ry="9" fill="#f6b7c0"/><ellipse cx="40" cy="14" rx="2.5" ry="9" fill="#f6b7c0"/>` +
    head('#f5f1ea', 18, 38) + eyes(37) + `<path d="M29 43 L35 43 L32 46Z" fill="#e77d8c"/>`,
  piglet:
    `<path d="M13 26 L22 14 L27 26Z M51 26 L42 14 L37 26Z" fill="#ec8fa5" ${s}/>` +
    head('#f6a9bb') + eyes(31) + `<ellipse cx="32" cy="42" rx="9" ry="6.5" fill="#e57f98" ${s}/>` +
    `<circle cx="28.5" cy="42" r="1.8" fill="${O}"/><circle cx="35.5" cy="42" r="1.8" fill="${O}"/>`,
  chick:
    `<path d="M30 16 Q32 8 34 16 Q38 10 37 18" fill="none" ${s}/>` + head('#ffe36b', 18) + eyes(33, 7) +
    `<path d="M26 40 L38 40 L32 47Z" fill="#f08a24" ${s}/>`,
  hamster:
    `<circle cx="17" cy="21" r="6" fill="#d09858" ${s}/><circle cx="47" cy="21" r="6" fill="#d09858" ${s}/>` +
    head('#e2b170', 21) + `<ellipse cx="32" cy="44" rx="13" ry="8" fill="#fff4e2"/>` + eyes(33) +
    `<circle cx="18" cy="42" r="4" fill="#f6b7c0"/><circle cx="46" cy="42" r="4" fill="#f6b7c0"/>` +
    `<path d="M30 41 L34 41 L32 43.5Z" fill="#e77d8c"/>`,
  lamb:
    `<g fill="#fbfaf6" ${s}><circle cx="18" cy="24" r="8"/><circle cx="32" cy="18" r="9"/><circle cx="46" cy="24" r="8"/>` +
    `<circle cx="14" cy="38" r="7"/><circle cx="50" cy="38" r="7"/></g>` +
    `<ellipse cx="32" cy="38" rx="13" ry="15" fill="#3b3236" ${s}/>` +
    `<circle cx="27" cy="35" r="2.6" fill="#fff"/><circle cx="37" cy="35" r="2.6" fill="#fff"/>`,
  fox:
    `<path d="M12 32 L14 8 L28 20Z M52 32 L50 8 L36 20Z" fill="#e8742a" ${s}/>` +
    `<path d="M12 28 Q32 14 52 28 Q48 50 32 56 Q16 50 12 28Z" fill="#e8742a" ${s}/>` +
    `<path d="M18 38 Q32 34 46 38 Q40 52 32 54 Q24 52 18 38Z" fill="#fff"/>` + eyes(32) +
    `<ellipse cx="32" cy="46" rx="3.4" ry="2.6" fill="${O}"/>`,
  panda:
    `<circle cx="16" cy="20" r="7" fill="${O}"/><circle cx="48" cy="20" r="7" fill="${O}"/>` + head('#f8f8f4', 20) +
    `<ellipse cx="23" cy="34" rx="6" ry="7.5" fill="${O}" transform="rotate(-25 23 34)"/>` +
    `<ellipse cx="41" cy="34" rx="6" ry="7.5" fill="${O}" transform="rotate(25 41 34)"/>` +
    `<circle cx="24" cy="33" r="2" fill="#fff"/><circle cx="40" cy="33" r="2" fill="#fff"/>` +
    `<ellipse cx="32" cy="44" rx="3.6" ry="2.6" fill="${O}"/>`,
  rescuer:
    `<path d="M12 30 Q32 6 52 30Z" fill="#e5474b" ${s}/>` + head('#f7c99c', 18, 38) + eyes(38, 7) +
    `<path d="M26 46 Q32 50 38 46" fill="none" stroke="${O}" stroke-width="2.5" stroke-linecap="round"/>`,
};

export function face(kind) {
  return svg(FACES[kind] ?? FACES.puppy);
}

export function silhouette(kind) {
  return svg(`<g opacity="0.55">${(FACES[kind] ?? '').replace(/fill="[^"]*"/g, 'fill="#55505e"')}</g>`);
}

const ABILITIES = {
  // Boulder with a push arrow.
  push: `<circle cx="13" cy="15" r="7" fill="#9a9aa6" stroke="${O}" stroke-width="2"/><path d="M2 9 h5 M2 15 h4 M2 21 h5" stroke="${O}" stroke-width="2" stroke-linecap="round"/>`,
  // Arc over a gap.
  hop: `<path d="M3 20 Q12 0 21 20" fill="none" stroke="${O}" stroke-width="2.4" stroke-dasharray="3 2.4"/><path d="M17 17 L21 21 L22.5 15.5" fill="none" stroke="${O}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="8" y="20" width="8" height="3" fill="${O}"/>`,
  // Waves.
  swim: `<path d="M2 10 q3.3 -4 6.6 0 t6.6 0 t6.6 0 M2 17 q3.3 -4 6.6 0 t6.6 0 t6.6 0" fill="none" stroke="#2a7fbf" stroke-width="2.6" stroke-linecap="round"/>`,
  // Claw digging through leaves.
  dig: `<path d="M5 21 L9 7 M11 22 L13 6 M17 21 L18 7" stroke="${O}" stroke-width="2.6" stroke-linecap="round"/><path d="M2 22 h20" stroke="#8a5a36" stroke-width="3" stroke-linecap="round"/>`,
};

export function ability(name) {
  return svg(ABILITIES[name], 24);
}

const P = `fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"`;
export const UI = {
  pause: svg(`<rect x="18" y="14" width="9" height="36" rx="3" fill="currentColor"/><rect x="37" y="14" width="9" height="36" rx="3" fill="currentColor"/>`),
  play: svg(`<path d="M22 12 L50 32 L22 52Z" fill="currentColor" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>`),
  undo: svg(`<path d="M24 14 L12 26 L24 38" ${P}/><path d="M12 26 H38 a12 12 0 0 1 0 24 H28" ${P}/>`),
  restart: svg(`<path d="M48 32 a16 16 0 1 1 -5 -11.6" ${P}/><path d="M46 10 V22 H34" ${P}/>`),
  map: svg(`<g fill="currentColor"><rect x="10" y="10" width="18" height="18" rx="4"/><rect x="36" y="10" width="18" height="18" rx="4"/><rect x="10" y="36" width="18" height="18" rx="4"/><rect x="36" y="36" width="18" height="18" rx="4"/></g>`),
  soundOn: svg(`<path d="M12 24 H22 L34 14 V50 L22 40 H12Z" fill="currentColor"/><path d="M41 24 q5 8 0 16 M47 18 q10 14 0 28" ${P} stroke-width="4"/>`),
  soundOff: svg(`<path d="M12 24 H22 L34 14 V50 L22 40 H12Z" fill="currentColor"/><path d="M42 24 L54 40 M54 24 L42 40" ${P} stroke-width="4"/>`),
  lock: svg(`<rect x="16" y="28" width="32" height="24" rx="5" fill="currentColor"/><path d="M22 28 V21 a10 10 0 0 1 20 0 V28" ${P}/>`),
  check: svg(`<path d="M14 33 L27 46 L50 19" ${P} stroke-width="7"/>`),
  heart: svg(`<path d="M32 54 C4 36 6 10 22 10 C28 10 32 16 32 20 C32 16 36 10 42 10 C58 10 60 36 32 54Z" fill="#ff5a7a" stroke="${O}" stroke-width="2.5"/>`),
  cross: svg(`<circle cx="32" cy="32" r="26" fill="#fff" stroke="${O}" stroke-width="3"/><path d="M21 21 L43 43 M43 21 L21 43" stroke="#e5474b" stroke-width="7" stroke-linecap="round"/>`),
  hand: svg(`<path d="M24 8 a5 5 0 0 1 10 0 V30 l2 -1 a5 5 0 0 1 9 2 l1 0 a5 5 0 0 1 9 3 V44 c0 10 -8 16 -18 16 h-2 c-8 0 -12 -4 -16 -10 L10 38 a5 5 0 0 1 8 -6 l6 6Z" fill="#fff" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`),
  home: svg(`<path d="M10 30 L32 12 L54 30" ${P} stroke="#e0534d" stroke-width="6"/><rect x="16" y="28" width="32" height="24" rx="2" fill="#fbe9cf" stroke="${O}" stroke-width="2.5"/><rect x="27" y="36" width="10" height="16" fill="#9a5b34"/>`),
};
