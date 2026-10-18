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

// Faces for the later worlds, built from a few shared parts.
const GENERIC = {
  otter: { head: '#8b5a3c', muzzle: '#e2c49c', ears: 'round', ear: '#6e4430' },
  beaver: { head: '#8a5a33', muzzle: '#c79a6a', ears: 'round', ear: '#6e4428', teeth: true },
  raccoon: { head: '#8f8f96', muzzle: '#e6e6ea', ears: 'pointy', ear: '#6a6a72', mask: true },
  hedgehog: { head: '#f2d7b5', muzzle: '#f8e6cc', ears: 'round', ear: '#d9b48c', spikes: '#7a5a40' },
  polarbear: { head: '#f6f6f0', muzzle: '#ffffff', ears: 'round', ear: '#e8e8e0' },
  arcticfox: { head: '#f4f4f8', muzzle: '#ffffff', ears: 'pointy', ear: '#c8ccd8', fox: true },
  calf: { head: '#f8f6f0', muzzle: '#f2a0b0', ears: 'flap', ear: '#2a2230', spots: '#2a2230', nostrils: true },
  foal: { head: '#b07040', muzzle: '#c98a58', ears: 'pointy', ear: '#b07040', mane: '#4a2c1a', nostrils: true },
  goat: { head: '#f0ece4', muzzle: '#f6f2ea', ears: 'flap', ear: '#e6e0d4', horns: '#b8a888', beard: true },
  meerkat: { head: '#d8b48a', muzzle: '#f0dcbc', ears: 'round', ear: '#5a4636', mask: true },
  coyote: { head: '#b89a74', muzzle: '#f2e6d2', ears: 'pointy', ear: '#6a5240', fox: true },
  fawn: { head: '#c4844a', muzzle: '#f2dcc0', ears: 'flap', ear: '#c4844a', spots: '#ffffff' },
  ram: { head: '#8a7868', muzzle: '#a89888', ears: 'flap', ear: '#6a5a50', curls: '#c8b490', wool: '#f3ecdc' },
  squirrel: { head: '#c86a32', muzzle: '#f6e2c8', ears: 'pointy', ear: '#c86a32', teeth: true },
  bearcub: { head: '#7a4e2c', muzzle: '#b88a5c', ears: 'round', ear: '#6a4224' },
  redpanda: { head: '#c8502a', muzzle: '#ffffff', ears: 'pointy', ear: '#ffffff', cheeks: '#ffffff' },
  wolfpup: { head: '#8c8f99', muzzle: '#e8e8ec', ears: 'pointy', ear: '#5a5c66', fox: true },
  penguin: { head: '#2c2c38', muzzle: '#ffffff', beak: '#f08a24' },
  owl: { head: '#c8a06a', muzzle: '#f0dcb4', tufts: '#c8a06a', beak: '#f08a24', owlEyes: true },
  rooster: { head: '#f8f4ea', muzzle: '#f8f4ea', beak: '#f0b030', comb: '#e5383b' },
};

function genericFace(f) {
  let out = '';
  if (f.wool) out += `<g fill="${f.wool}" ${s}><circle cx="18" cy="24" r="8"/><circle cx="32" cy="18" r="9"/><circle cx="46" cy="24" r="8"/></g>`;
  if (f.spikes) {
    out += `<path d="M10 40 L6 30 L14 28 L12 18 L22 20 L24 10 L32 16 L40 10 L42 20 L52 18 L50 28 L58 30 L54 40Z" fill="${f.spikes}" ${s}/>`;
  }
  if (f.ears === 'round') out += `<circle cx="16" cy="22" r="7" fill="${f.ear}" ${s}/><circle cx="48" cy="22" r="7" fill="${f.ear}" ${s}/>`;
  if (f.ears === 'pointy') out += `<path d="M13 32 L15 10 L29 21Z M51 32 L49 10 L35 21Z" fill="${f.ear}" ${s}/>`;
  if (f.ears === 'flap') out += `<ellipse cx="11" cy="32" rx="9" ry="5" fill="${f.ear}" ${s} transform="rotate(20 11 32)"/><ellipse cx="53" cy="32" rx="9" ry="5" fill="${f.ear}" ${s} transform="rotate(-20 53 32)"/>`;
  if (f.horns) out += `<path d="M22 22 L19 8 L27 19Z M42 22 L45 8 L37 19Z" fill="${f.horns}" ${s}/>`;
  if (f.curls) out += `<circle cx="12" cy="34" r="7" fill="${f.curls}" ${s}/><circle cx="52" cy="34" r="7" fill="${f.curls}" ${s}/>`;
  if (f.tufts) out += `<path d="M14 26 L12 10 L24 20Z M50 26 L52 10 L40 20Z" fill="${f.tufts}" ${s}/>`;
  if (f.comb) out += `<path d="M24 18 Q26 6 30 14 Q32 4 36 14 Q40 6 40 18Z" fill="${f.comb}" ${s}/>`;
  if (f.fox) out += `<path d="M12 28 Q32 14 52 28 Q48 50 32 56 Q16 50 12 28Z" fill="${f.head}" ${s}/>`;
  else out += head(f.head, 19);
  if (f.mane) out += `<path d="M24 18 Q32 8 40 18 Q36 22 32 20 Q28 22 24 18Z" fill="${f.mane}" ${s}/>`;
  if (f.fox) out += `<path d="M18 38 Q32 34 46 38 Q40 52 32 54 Q24 52 18 38Z" fill="${f.muzzle}"/>`;
  else if (!f.beak) out += `<ellipse cx="32" cy="43" rx="11" ry="8" fill="${f.muzzle}"/>`;
  if (f.owlEyes) out += `<circle cx="24" cy="34" r="8" fill="${f.muzzle}"/><circle cx="40" cy="34" r="8" fill="${f.muzzle}"/><circle cx="24" cy="34" r="5" fill="#ffc83d"/><circle cx="40" cy="34" r="5" fill="#ffc83d"/>`;
  if (f.mask) out += `<path d="M13 32 Q32 24 51 32 Q46 40 38 36 Q32 33 26 36 Q18 40 13 32Z" fill="#3a3238"/>`;
  if (f.cheeks) out += `<circle cx="20" cy="40" r="5" fill="${f.cheeks}"/><circle cx="44" cy="40" r="5" fill="${f.cheeks}"/>`;
  if (f.spots) out += `<circle cx="22" cy="26" r="4" fill="${f.spots}"/><circle cx="44" cy="44" r="3.5" fill="${f.spots}"/><circle cx="40" cy="24" r="2.5" fill="${f.spots}"/>`;
  out += eyes(34, 8, f.owlEyes ? 2.6 : 3.2).replace(/fill="#2a2230"/g, `fill="${f.head === '#2c2c38' ? '#ffffff' : O}"`);
  if (f.head === '#2c2c38') out += `<circle cx="24" cy="34" r="1.6" fill="${O}"/><circle cx="40" cy="34" r="1.6" fill="${O}"/>`;
  if (f.beak) out += `<path d="M26 41 L38 41 L32 49Z" fill="${f.beak}" ${s}/>`;
  else if (f.nostrils) out += `<circle cx="28" cy="44" r="1.8" fill="${O}"/><circle cx="36" cy="44" r="1.8" fill="${O}"/>`;
  else out += `<ellipse cx="32" cy="40" rx="3.4" ry="2.5" fill="${O}"/>`;
  if (f.teeth) out += `<rect x="29.5" y="45" width="5" height="5" rx="1" fill="#fff" ${s} stroke-width="1.5"/>`;
  if (f.beard) out += `<path d="M28 52 L32 60 L36 52Z" fill="#e6e0d4" ${s} stroke-width="1.5"/>`;
  return out;
}

export function face(kind) {
  if (GENERIC[kind]) return svg(genericFace(GENERIC[kind]));
  return svg(FACES[kind] ?? FACES.puppy);
}

export function silhouette(kind) {
  const body = GENERIC[kind] ? genericFace(GENERIC[kind]) : FACES[kind] ?? '';
  return svg(`<g opacity="0.55">${body.replace(/fill="[^"]*"/g, 'fill="#55505e"')}</g>`);
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
  musicOn: svg(`<path d="M26 44 V14 L50 9 V38" ${P} stroke-width="4.5"/><ellipse cx="20" cy="45" rx="7.5" ry="6" fill="currentColor"/><ellipse cx="44" cy="39" rx="7.5" ry="6" fill="currentColor"/>`),
  musicOff: svg(`<path d="M26 44 V14 L50 9 V38" ${P} stroke-width="4.5" opacity="0.45"/><ellipse cx="20" cy="45" rx="7.5" ry="6" fill="currentColor" opacity="0.45"/><ellipse cx="44" cy="39" rx="7.5" ry="6" fill="currentColor" opacity="0.45"/><path d="M10 10 L54 54" ${P} stroke-width="5"/>`),
  lock: svg(`<rect x="16" y="28" width="32" height="24" rx="5" fill="currentColor"/><path d="M22 28 V21 a10 10 0 0 1 20 0 V28" ${P}/>`),
  check: svg(`<path d="M14 33 L27 46 L50 19" ${P} stroke-width="7"/>`),
  heart: svg(`<path d="M32 54 C4 36 6 10 22 10 C28 10 32 16 32 20 C32 16 36 10 42 10 C58 10 60 36 32 54Z" fill="#ff5a7a" stroke="${O}" stroke-width="2.5"/>`),
  cross: svg(`<circle cx="32" cy="32" r="26" fill="#fff" stroke="${O}" stroke-width="3"/><path d="M21 21 L43 43 M43 21 L21 43" stroke="#e5474b" stroke-width="7" stroke-linecap="round"/>`),
  hand: svg(`<path d="M24 8 a5 5 0 0 1 10 0 V30 l2 -1 a5 5 0 0 1 9 2 l1 0 a5 5 0 0 1 9 3 V44 c0 10 -8 16 -18 16 h-2 c-8 0 -12 -4 -16 -10 L10 38 a5 5 0 0 1 8 -6 l6 6Z" fill="#fff" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`),
  star: svg(`<path d="M32 6 L39.6 23.4 L58 25.2 L44 37.6 L48.2 56 L32 46.2 L15.8 56 L20 37.6 L6 25.2 L24.4 23.4Z" fill="#ffc83d" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`),
  starEmpty: svg(`<path d="M32 6 L39.6 23.4 L58 25.2 L44 37.6 L48.2 56 L32 46.2 L15.8 56 L20 37.6 L6 25.2 L24.4 23.4Z" fill="#e6e0d6" stroke="${O}" stroke-width="3" stroke-linejoin="round" stroke-dasharray="4 3"/>`),
  skip: svg(`<path d="M10 14 L32 32 L10 50Z M32 14 L54 32 L32 50Z" fill="currentColor"/>`),
  plate: svg(`<rect x="8" y="30" width="48" height="16" rx="4" fill="#8a8a96" stroke="${O}" stroke-width="3"/><circle cx="32" cy="34" r="8" fill="#ffc83d" stroke="${O}" stroke-width="2.5"/><path d="M32 8 V22 M24 16 L32 24 L40 16" ${P} stroke-width="4"/>`),
  garden: svg(`<path d="M32 58 V30" ${P} stroke="#3f8f52" stroke-width="5"/><path d="M32 40 Q18 38 16 26 Q30 26 32 40Z M32 46 Q46 44 48 32 Q34 32 32 46Z" fill="#63c24c" stroke="${O}" stroke-width="2.5"/><circle cx="32" cy="18" r="8" fill="#ff8fab" stroke="${O}" stroke-width="2.5"/><circle cx="32" cy="18" r="3" fill="#ffe066"/>`),
  album: svg(`<rect x="10" y="8" width="44" height="48" rx="5" fill="#ffd8a8" stroke="${O}" stroke-width="3"/><path d="M18 8 V56" stroke="${O}" stroke-width="3"/><circle cx="37" cy="27" r="7" fill="#c8874a" stroke="${O}" stroke-width="2.5"/><circle cx="34" cy="26" r="1.5" fill="${O}"/><circle cx="40" cy="26" r="1.5" fill="${O}"/><path d="M27 44 h20" ${P} stroke-width="3"/>`),
  hats: svg(`<path d="M10 44 Q32 50 54 44 L50 40 Q32 44 14 40Z" fill="#9a6234" stroke="${O}" stroke-width="2.5"/><path d="M20 41 Q22 14 32 14 Q42 14 44 41Z" fill="#c0843c" stroke="${O}" stroke-width="2.5"/><path d="M21 34 Q32 38 43 34" ${P} stroke="#e5383b" stroke-width="4"/>`),
  flame: svg(`<path d="M32 6 C40 18 52 24 50 40 C48 54 38 58 32 58 C26 58 14 54 14 40 C14 30 22 26 24 16 C28 22 30 26 30 30 C34 24 34 14 32 6Z" fill="#ff7a2e" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M32 34 C36 40 40 44 38 50 C36 54 28 54 26 50 C24 44 30 42 32 34Z" fill="#ffd84a"/>`),
  calendar: svg(`<rect x="8" y="12" width="48" height="44" rx="6" fill="#fff" stroke="${O}" stroke-width="3"/><rect x="8" y="12" width="48" height="12" rx="4" fill="#e5383b" stroke="${O}" stroke-width="3"/><path d="M20 6 V16 M44 6 V16" ${P} stroke-width="4"/><path d="M32 30 L35 37 L42 38 L37 43 L38 50 L32 46 L26 50 L27 43 L22 38 L29 37Z" fill="#ffc83d" stroke="${O}" stroke-width="2"/>`),
  back: svg(`<path d="M38 12 L18 32 L38 52" ${P} stroke-width="7"/>`),
  home: svg(`<path d="M10 30 L32 12 L54 30" ${P} stroke="#e0534d" stroke-width="6"/><rect x="16" y="28" width="32" height="24" rx="2" fill="#fbe9cf" stroke="${O}" stroke-width="2.5"/><rect x="27" y="36" width="10" height="16" fill="#9a5b34"/>`),
};

// World tab icons.
export const WORLD_ICONS = {
  meadow: svg(`<circle cx="32" cy="32" r="26" fill="#bfe6f5" stroke="${O}" stroke-width="3"/><path d="M8 40 Q32 30 56 40 V44 Q56 56 32 58 Q8 56 8 44Z" fill="#8fd36a"/><circle cx="24" cy="38" r="4" fill="#ff8fab"/><circle cx="38" cy="36" r="4" fill="#ffe066"/><circle cx="42" cy="18" r="6" fill="#ffd84a"/>`),
  river: svg(`<circle cx="32" cy="32" r="26" fill="#9edb6e" stroke="${O}" stroke-width="3"/><path d="M10 28 Q20 22 30 28 T50 28 L54 40 Q42 34 32 40 T12 40Z" fill="#5bbfe9"/><path d="M22 32 L28 32 M34 34 L42 34" ${P} stroke="#fff" stroke-width="3"/>`),
  snow: svg(`<circle cx="32" cy="32" r="26" fill="#d6e8f6" stroke="${O}" stroke-width="3"/><path d="M32 12 V52 M15 22 L49 42 M15 42 L49 22" ${P} stroke="#4a8fd6" stroke-width="4"/>`),
  farm: svg(`<circle cx="32" cy="32" r="26" fill="#a9d36a" stroke="${O}" stroke-width="3"/><path d="M16 50 V30 L32 18 L48 30 V50Z" fill="#e0534d" stroke="${O}" stroke-width="2.5"/><rect x="26" y="36" width="12" height="14" fill="#fff" stroke="${O}" stroke-width="2"/>`),
  canyon: svg(`<circle cx="32" cy="32" r="26" fill="#f6dcc0" stroke="${O}" stroke-width="3"/><path d="M8 44 L20 30 L28 38 L40 22 L56 44Z" fill="#c0703f"/><path d="M30 52 V36 M30 44 Q24 44 24 38 M30 42 Q36 42 36 36" ${P} stroke="#4f9a5a" stroke-width="5"/>`),
  woods: svg(`<circle cx="32" cy="32" r="26" fill="#a9cbe0" stroke="${O}" stroke-width="3"/><path d="M20 50 L28 30 L36 50Z M32 52 L42 20 L52 52Z" fill="#2f6a44"/><circle cx="22" cy="52" r="4" fill="#e5383b"/>`),
};

// Hat picker icons.
export const HAT_ICONS = {
  party: svg(`<path d="M32 6 L48 54 H16Z" fill="#6c8cff" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><circle cx="32" cy="6" r="5" fill="#ffd84a" stroke="${O}" stroke-width="2"/><path d="M22 38 H42 M26 26 H38" ${P} stroke="#ff7aa8" stroke-width="4"/>`),
  crown: svg(`<path d="M10 48 L12 20 L24 32 L32 14 L40 32 L52 20 L54 48Z" fill="#ffc83d" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><circle cx="32" cy="40" r="4" fill="#e5383b"/>`),
  flowers: svg(`<ellipse cx="32" cy="40" rx="24" ry="8" fill="none" stroke="#3f8f52" stroke-width="3"/><circle cx="12" cy="38" r="6" fill="#ff8fab" stroke="${O}" stroke-width="2"/><circle cx="26" cy="32" r="6" fill="#ffe066" stroke="${O}" stroke-width="2"/><circle cx="40" cy="32" r="6" fill="#fff" stroke="${O}" stroke-width="2"/><circle cx="52" cy="38" r="6" fill="#b9a6ff" stroke="${O}" stroke-width="2"/>`),
  beanie: svg(`<path d="M12 44 Q12 16 32 16 Q52 16 52 44Z" fill="#3fa7d6" stroke="${O}" stroke-width="3"/><rect x="10" y="40" width="44" height="10" rx="4" fill="#2a7fa8" stroke="${O}" stroke-width="3"/><circle cx="32" cy="12" r="6" fill="#fff" stroke="${O}" stroke-width="2.5"/>`),
  cowboy: svg(`<path d="M4 42 Q32 54 60 42 Q52 40 46 42 L44 18 Q32 12 20 18 L18 42 Q12 40 4 42Z" fill="#9a6234" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M19 36 H45" ${P} stroke="#4a2c1a" stroke-width="5"/>`),
  tophat: svg(`<rect x="20" y="8" width="24" height="36" rx="3" fill="#2a2230"/><rect x="8" y="42" width="48" height="8" rx="4" fill="#2a2230"/><rect x="20" y="34" width="24" height="6" fill="#e5383b"/>`),
  chef: svg(`<circle cx="22" cy="24" r="12" fill="#fff" stroke="${O}" stroke-width="3"/><circle cx="42" cy="24" r="12" fill="#fff" stroke="${O}" stroke-width="3"/><circle cx="32" cy="18" r="12" fill="#fff" stroke="${O}" stroke-width="3"/><rect x="18" y="30" width="28" height="20" rx="3" fill="#fff" stroke="${O}" stroke-width="3"/>`),
  pirate: svg(`<path d="M6 40 Q32 8 58 40 Q32 50 6 40Z" fill="#2a2230"/><circle cx="32" cy="32" r="5" fill="#fff"/><path d="M27 38 L37 28 M27 28 L37 38" stroke="#fff" stroke-width="2.5"/>`),
  wizard: svg(`<path d="M32 4 L46 46 H18Z" fill="#6a3fc8" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="32" cy="48" rx="24" ry="6" fill="#6a3fc8" stroke="${O}" stroke-width="3"/><circle cx="30" cy="26" r="3" fill="#ffd84a"/><circle cx="36" cy="36" r="2" fill="#ffd84a"/>`),
  bow: svg(`<path d="M32 32 L8 18 V46Z M32 32 L56 18 V46Z" fill="#ff5a8a" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><circle cx="32" cy="32" r="7" fill="#e0406e" stroke="${O}" stroke-width="3"/>`),
  viking: svg(`<path d="M14 44 Q14 18 32 18 Q50 18 50 44Z" fill="#a8b0bc" stroke="${O}" stroke-width="3"/><path d="M14 34 Q4 30 6 14 Q12 26 18 28Z M50 34 Q60 30 58 14 Q52 26 46 28Z" fill="#f6efe6" stroke="${O}" stroke-width="2.5"/>`),
  propeller: svg(`<path d="M12 46 Q12 22 32 22 Q52 22 52 46Z" fill="#ffc83d" stroke="${O}" stroke-width="3"/><path d="M32 22 V12" stroke="${O}" stroke-width="3"/><path d="M14 10 Q32 4 50 10 Q32 16 14 10Z" fill="#3fa7d6" stroke="${O}" stroke-width="2.5"/>`),
};
