// Procedural low-poly models. Every model is built from primitives and merged into one
// vertex-coloured geometry, so each character or prop is a single draw call and the game
// ships no model files.
import {
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
  Matrix4,
  Mesh,
  MeshLambertMaterial,
  Quaternion,
  SphereGeometry,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const flatMaterial = new MeshLambertMaterial({ vertexColors: true, flatShading: true });
export const smoothMaterial = new MeshLambertMaterial({ vertexColors: true });

const tmpColor = new Color();

/** Collects coloured, transformed primitives and merges them. */
class Builder {
  constructor() {
    this.parts = [];
  }

  add(geometry, color, { pos = [0, 0, 0], scale = [1, 1, 1], rot = [0, 0, 0] } = {}) {
    let g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    g.deleteAttribute('uv');
    const m = new Matrix4().compose(
      new Vector3(...pos),
      new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), rot[0])
        .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), rot[1]))
        .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), rot[2])),
      new Vector3(...(typeof scale === 'number' ? [scale, scale, scale] : scale)),
    );
    g.applyMatrix4(m);
    tmpColor.set(color);
    const n = g.attributes.position.count;
    const colors = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      colors[i * 3] = tmpColor.r;
      colors[i * 3 + 1] = tmpColor.g;
      colors[i * 3 + 2] = tmpColor.b;
    }
    g.setAttribute('color', new Float32BufferAttribute(colors, 3));
    this.parts.push(g);
    return this;
  }

  // Mirrored pair across x.
  pair(geometry, color, { pos = [0, 0, 0], scale = [1, 1, 1], rot = [0, 0, 0] } = {}) {
    this.add(geometry, color, { pos, scale, rot });
    this.add(geometry, color, { pos: [-pos[0], pos[1], pos[2]], scale, rot: [rot[0], -rot[1], -rot[2]] });
    return this;
  }

  geometry() {
    const g = mergeGeometries(this.parts, false);
    g.computeBoundingSphere();
    return g;
  }

  mesh(material = flatMaterial) {
    return new Mesh(this.geometry(), material);
  }
}

const SPHERE = new SphereGeometry(1, 10, 8);
const SMOOTH_SPHERE = new SphereGeometry(1, 14, 10);
const BOX = new BoxGeometry(1, 1, 1);
const CYL = new CylinderGeometry(1, 1, 1, 8);
const CONE = new ConeGeometry(1, 1, 8);
const ICO = new IcosahedronGeometry(1, 0);
const ICO1 = new IcosahedronGeometry(1, 1);

const BLACK = 0x2a2230;
const WHITE = 0xffffff;

function eyes(b, { x = 0.07, y, z, r = 0.035, color = BLACK }) {
  b.pair(SMOOTH_SPHERE, color, { pos: [x, y, z], scale: r });
  b.pair(SMOOTH_SPHERE, WHITE, { pos: [x + 0.01, y + 0.012, z + r * 0.75], scale: r * 0.35 });
}

// Pets face +z. Feet rest on y = 0.
const ANIMALS = {
  puppy: { body: 0xc8874a, belly: 0xf3dcb8, ear: 0x7b4a24, nose: BLACK, ears: 'floppy', tail: 'stub' },
  kitten: { body: 0xf2a54a, belly: 0xfde6c4, ear: 0xf2a54a, inner: 0xf6b7c0, nose: 0xe77d8c, ears: 'pointy', tail: 'long' },
  bunny: { body: 0xf5f1ea, belly: WHITE, ear: 0xf5f1ea, inner: 0xf6b7c0, nose: 0xe77d8c, ears: 'long', tail: 'puff' },
  piglet: { body: 0xf6a9bb, belly: 0xf9c6d2, ear: 0xec8fa5, nose: 0xe57f98, ears: 'flap', tail: 'curl', snout: true },
  hamster: { body: 0xe2b170, belly: 0xfff4e2, ear: 0xd09858, inner: 0xf6b7c0, nose: 0xe77d8c, ears: 'round', tail: 'none', chubby: true },
  fox: { body: 0xe8742a, belly: WHITE, ear: 0xe8742a, inner: BLACK, nose: BLACK, ears: 'pointy', tail: 'bushy', snoutLong: true },
  panda: { body: 0xf8f8f4, belly: 0xf8f8f4, ear: BLACK, nose: BLACK, ears: 'round', tail: 'stub', legs: BLACK, patches: true, chubby: true },
  lamb: { body: 0xfbfaf6, belly: 0xfbfaf6, ear: 0x3b3236, nose: 0x3b3236, ears: 'flap', tail: 'puff', face: 0x3b3236, wool: true },
  // River
  otter: { body: 0x8b5a3c, belly: 0xe2c49c, ear: 0x6e4430, nose: BLACK, ears: 'round', tail: 'long', long: true },
  beaver: { body: 0x8a5a33, belly: 0xc79a6a, ear: 0x6e4428, nose: BLACK, ears: 'round', tail: 'paddle', teeth: true, chubby: true },
  raccoon: { body: 0x8f8f96, belly: 0xdcdce0, ear: 0x6a6a72, inner: 0xdcdce0, nose: BLACK, ears: 'pointy', tail: 'ringed', mask: true },
  hedgehog: { body: 0x7a5a40, belly: 0xf2d7b5, ear: 0xd9b48c, nose: BLACK, ears: 'round', tail: 'none', face: 0xf2d7b5, spiky: true },
  // Snow
  polarbear: { body: 0xf6f6f0, belly: 0xeeeee6, ear: 0xe8e8e0, nose: BLACK, ears: 'round', tail: 'stub', chubby: true },
  arcticfox: { body: 0xf4f4f8, belly: WHITE, ear: 0xf4f4f8, inner: 0xb8bcc8, nose: BLACK, ears: 'pointy', tail: 'bushy', snoutLong: true, tip: 0xc8ccd8 },
  // Farm
  calf: { body: 0xf8f6f0, belly: 0xf8f6f0, ear: 0xf8f6f0, nose: 0xf2a0b0, ears: 'flap', tail: 'long', snout: true, spots: BLACK },
  foal: { body: 0xb07040, belly: 0xc98a58, ear: 0xb07040, inner: 0x5a3420, nose: 0x3a2418, ears: 'pointy', tail: 'long', mane: 0x4a2c1a, snoutLong: true, tall: true },
  goat: { body: 0xf0ece4, belly: WHITE, ear: 0xe6e0d4, nose: 0xd8a0a8, ears: 'flap', tail: 'stub', horns: 0xb8a888, beard: true },
  // Canyon
  meerkat: { body: 0xd8b48a, belly: 0xf0dcbc, ear: 0x5a4636, nose: BLACK, ears: 'round', tail: 'long', mask: true, upright: true },
  coyote: { body: 0xb89a74, belly: 0xf2e6d2, ear: 0xb89a74, inner: 0x6a5240, nose: BLACK, ears: 'pointy', tail: 'bushy', snoutLong: true, tip: 0x5a4636 },
  fawn: { body: 0xc4844a, belly: 0xf2dcc0, ear: 0xc4844a, inner: 0xf2c4b0, nose: BLACK, ears: 'flap', tail: 'stub', spots: WHITE, tall: true },
  ram: { body: 0xf3ecdc, belly: 0xf3ecdc, ear: 0x6a5a50, nose: 0x6a5a50, ears: 'flap', tail: 'puff', face: 0x8a7868, wool: true, curls: 0xc8b490 },
  // Woods
  squirrel: { body: 0xc86a32, belly: 0xf6e2c8, ear: 0xc86a32, inner: 0xf2c4b0, nose: BLACK, ears: 'pointy', tail: 'bushyup' },
  bearcub: { body: 0x7a4e2c, belly: 0xb88a5c, ear: 0x6a4224, inner: 0xb88a5c, nose: BLACK, ears: 'round', tail: 'stub', chubby: true },
  redpanda: { body: 0xc8502a, belly: 0x3a2a2a, ear: 0xc8502a, inner: WHITE, nose: BLACK, ears: 'pointy', tail: 'ringed', cheeks: WHITE, legs: 0x3a2a2a },
  wolfpup: { body: 0x8c8f99, belly: 0xe8e8ec, ear: 0x8c8f99, inner: 0x5a5c66, nose: BLACK, ears: 'pointy', tail: 'bushy', snoutLong: true, tip: 0x5a5c66 },
};

function quadruped(spec) {
  const b = new Builder();
  const chubby = spec.chubby ? 1.15 : 1;
  const legColor = spec.legs ?? spec.body;
  // Body and belly.
  if (spec.wool) {
    for (const [x, y, z] of [[0, 0.27, 0], [0.1, 0.25, 0.08], [-0.1, 0.25, 0.08], [0.1, 0.25, -0.1], [-0.1, 0.25, -0.1], [0, 0.34, -0.04], [0, 0.32, 0.1]]) {
      b.add(ICO1, spec.body, { pos: [x, y, z], scale: 0.13 });
    }
  } else {
    const len = spec.long ? 1.25 : 1;
    b.add(SPHERE, spec.body, { pos: [0, 0.24, 0], scale: [0.19 * chubby, 0.16 * chubby, 0.24 * len] });
    b.add(SPHERE, spec.belly, { pos: [0, 0.2, 0.06], scale: [0.14 * chubby, 0.11, 0.16 * len] });
  }
  if (spec.spots) {
    for (const [x, y, z] of [[0.12, 0.3, 0.05], [-0.1, 0.33, -0.08], [0.08, 0.35, -0.12], [-0.13, 0.26, 0.08]]) {
      b.add(SPHERE, spec.spots, { pos: [x, y, z], scale: [0.05, 0.04, 0.05] });
    }
  }
  if (spec.spiky) {
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      const r2 = k % 2 ? 0.12 : 0.16;
      b.add(CONE, 0x5a3e28, { pos: [Math.cos(a) * r2 * 0.9, 0.3 + Math.abs(Math.sin(a)) * 0.05, Math.sin(a) * r2 - 0.03], scale: [0.04, 0.12, 0.04], rot: [Math.sin(a) * 0.8 - 0.3, 0, -Math.cos(a) * 0.8] });
    }
  }
  if (spec.mane) b.add(BOX, spec.mane, { pos: [0, 0.4, 0.06], scale: [0.05, 0.12, 0.2], rot: [0.5, 0, 0] });
  if (spec.patches) b.add(SPHERE, BLACK, { pos: [0, 0.27, 0.02], scale: [0.2, 0.09, 0.12] });
  // Legs.
  const legH = spec.tall ? 0.2 : 0.12;
  for (const z of [0.12, -0.12]) b.pair(CYL, legColor, { pos: [0.1, legH / 2, z], scale: [0.05, legH, 0.05] });
  // Head.
  const hy = spec.tall ? 0.5 : spec.upright ? 0.5 : 0.43;
  const hz = 0.2;
  const headColor = spec.face ?? spec.body;
  b.add(SPHERE, headColor, { pos: [0, hy, hz], scale: [0.17 * chubby, 0.15 * chubby, 0.15] });
  if (spec.wool) b.add(ICO1, spec.body, { pos: [0, hy + 0.12, hz - 0.03], scale: [0.12, 0.07, 0.1] });
  if (!spec.face) b.add(SPHERE, spec.belly, { pos: [0, hy - 0.05, hz + 0.09], scale: [0.09, 0.06, 0.06] });
  if (spec.snoutLong) b.add(CONE, spec.belly, { pos: [0, hy - 0.04, hz + 0.16], scale: [0.07, 0.12, 0.06], rot: [Math.PI / 2, 0, 0] });
  if (spec.snout) b.add(CYL, spec.nose, { pos: [0, hy - 0.03, hz + 0.15], scale: [0.06, 0.04, 0.05], rot: [Math.PI / 2, 0, 0] });
  else b.add(SMOOTH_SPHERE, spec.nose, { pos: [0, hy - 0.02, hz + (spec.snoutLong ? 0.22 : 0.15)], scale: 0.026 });
  if (spec.patches) b.pair(SPHERE, BLACK, { pos: [0.06, hy + 0.02, hz + 0.11], scale: [0.045, 0.055, 0.03], rot: [0, 0, 0.4] });
  if (spec.mask) b.add(SPHERE, 0x3a3238, { pos: [0, hy + 0.03, hz + 0.1], scale: [0.15, 0.045, 0.05] });
  if (spec.cheeks) b.pair(SPHERE, spec.cheeks, { pos: [0.08, hy - 0.03, hz + 0.1], scale: [0.05, 0.04, 0.04] });
  if (spec.teeth) b.add(BOX, WHITE, { pos: [0, hy - 0.08, hz + 0.14], scale: [0.04, 0.04, 0.012] });
  if (spec.beard) b.add(CONE, 0xe6e0d4, { pos: [0, hy - 0.13, hz + 0.1], scale: [0.03, 0.08, 0.03], rot: [Math.PI, 0, 0] });
  if (spec.horns) b.pair(CONE, spec.horns, { pos: [0.06, hy + 0.15, hz - 0.04], scale: [0.025, 0.1, 0.025], rot: [-0.4, 0, -0.2] });
  if (spec.curls) b.pair(ICO1, spec.curls, { pos: [0.13, hy + 0.04, hz - 0.02], scale: [0.06, 0.07, 0.07] });
  eyes(b, { x: 0.065, y: hy + 0.03, z: hz + 0.125, color: spec.patches || spec.face || spec.mask ? 0x111111 : BLACK });
  // Ears.
  const ear = spec.ear;
  switch (spec.ears) {
    case 'floppy':
      b.pair(SPHERE, ear, { pos: [0.15, hy, hz - 0.02], scale: [0.04, 0.11, 0.07], rot: [0, 0, 0.35] });
      break;
    case 'pointy':
      b.pair(CONE, ear, { pos: [0.09, hy + 0.15, hz - 0.02], scale: [0.06, 0.12, 0.04], rot: [0, 0, -0.25] });
      b.pair(CONE, spec.inner, { pos: [0.09, hy + 0.14, hz], scale: [0.03, 0.07, 0.02], rot: [0, 0, -0.25] });
      break;
    case 'long':
      b.pair(SPHERE, ear, { pos: [0.06, hy + 0.24, hz - 0.04], scale: [0.04, 0.16, 0.03], rot: [0, 0, -0.12] });
      b.pair(SPHERE, spec.inner, { pos: [0.06, hy + 0.24, hz - 0.015], scale: [0.022, 0.12, 0.012], rot: [0, 0, -0.12] });
      break;
    case 'flap':
      b.pair(SPHERE, ear, { pos: [0.15, hy + 0.06, hz - 0.02], scale: [0.07, 0.035, 0.05], rot: [0, 0, -0.5] });
      break;
    case 'round':
      b.pair(SMOOTH_SPHERE, ear, { pos: [0.11, hy + 0.12, hz - 0.03], scale: [0.05, 0.05, 0.025] });
      if (spec.inner) b.pair(SMOOTH_SPHERE, spec.inner, { pos: [0.11, hy + 0.12, hz - 0.01], scale: [0.03, 0.03, 0.012] });
      break;
  }
  // Tail.
  switch (spec.tail) {
    case 'stub':
      b.add(SPHERE, spec.legs ? BLACK : spec.body, { pos: [0, 0.3, -0.24], scale: [0.04, 0.04, 0.07], rot: [-0.6, 0, 0] });
      break;
    case 'long':
      b.add(CYL, spec.body, { pos: [0, 0.38, -0.27], scale: [0.03, 0.26, 0.03], rot: [-0.5, 0, 0] });
      break;
    case 'puff':
      b.add(ICO1, WHITE, { pos: [0, 0.27, -0.25], scale: 0.06 });
      break;
    case 'curl':
      b.add(SPHERE, spec.body, { pos: [0, 0.32, -0.25], scale: [0.03, 0.05, 0.03], rot: [0.6, 0, 0] });
      break;
    case 'bushy':
      b.add(SPHERE, spec.body, { pos: [0, 0.3, -0.33], scale: [0.08, 0.08, 0.16], rot: [-0.5, 0, 0] });
      b.add(SPHERE, spec.tip ?? WHITE, { pos: [0, 0.37, -0.45], scale: [0.05, 0.05, 0.06], rot: [-0.5, 0, 0] });
      break;
    case 'bushyup':
      b.add(SPHERE, spec.body, { pos: [0, 0.42, -0.3], scale: [0.09, 0.2, 0.08], rot: [-0.3, 0, 0] });
      b.add(SPHERE, spec.body, { pos: [0, 0.6, -0.24], scale: [0.08, 0.08, 0.08] });
      break;
    case 'ringed':
      for (let k = 0; k < 4; k++) {
        b.add(SPHERE, k % 2 ? 0x3a3238 : spec.body, { pos: [0, 0.3 + k * 0.03, -0.3 - k * 0.06], scale: [0.065, 0.065, 0.05] });
      }
      break;
    case 'paddle':
      b.add(BOX, 0x4a3426, { pos: [0, 0.12, -0.32], scale: [0.14, 0.03, 0.2] });
      break;
  }
  return b;
}

function frog() {
  const b = new Builder();
  const green = 0x63c24c;
  b.add(SPHERE, green, { pos: [0, 0.17, 0], scale: [0.22, 0.15, 0.24] });
  b.add(SPHERE, 0xd9f2a0, { pos: [0, 0.13, 0.08], scale: [0.16, 0.09, 0.16] });
  b.pair(SPHERE, green, { pos: [0.18, 0.09, -0.08], scale: [0.09, 0.07, 0.14] });
  b.pair(SPHERE, green, { pos: [0.12, 0.05, 0.16], scale: [0.04, 0.05, 0.05] });
  b.pair(SMOOTH_SPHERE, green, { pos: [0.1, 0.3, 0.12], scale: 0.075 });
  b.pair(SMOOTH_SPHERE, WHITE, { pos: [0.1, 0.32, 0.16], scale: 0.05 });
  b.pair(SMOOTH_SPHERE, BLACK, { pos: [0.1, 0.32, 0.2], scale: 0.028 });
  b.add(BOX, 0xd2526b, { pos: [0, 0.17, 0.23], scale: [0.12, 0.012, 0.02] });
  return b;
}

function bird({ body, beak, size = 1, crest = false }) {
  const b = new Builder();
  const s = size;
  b.add(SPHERE, body, { pos: [0, 0.2 * s, 0], scale: [0.17 * s, 0.15 * s, 0.21 * s] });
  b.pair(SPHERE, body, { pos: [0.15 * s, 0.22 * s, -0.02], scale: [0.04 * s, 0.09 * s, 0.13 * s], rot: [0.2, 0, 0] });
  b.add(CONE, body, { pos: [0, 0.27 * s, -0.22 * s], scale: [0.07 * s, 0.12 * s, 0.05 * s], rot: [-1.1, 0, 0] });
  b.add(SMOOTH_SPHERE, body, { pos: [0, 0.4 * s, 0.12 * s], scale: 0.12 * s });
  b.add(BOX, beak, { pos: [0, 0.38 * s, 0.24 * s], scale: [0.1 * s, 0.035 * s, 0.1 * s] });
  eyes(b, { x: 0.06 * s, y: 0.43 * s, z: 0.21 * s, r: 0.025 });
  b.pair(BOX, beak, { pos: [0.06 * s, 0.025, 0.03], scale: [0.06 * s, 0.03, 0.09 * s] });
  if (crest) b.add(SPHERE, body, { pos: [0, 0.53 * s, 0.1 * s], scale: [0.02, 0.05, 0.04] });
  return b;
}

function mole() {
  const b = new Builder();
  const fur = 0x5d4c48;
  b.add(SPHERE, fur, { pos: [0, 0.2, 0], scale: [0.2, 0.17, 0.26] });
  b.add(SMOOTH_SPHERE, fur, { pos: [0, 0.27, 0.2], scale: [0.13, 0.12, 0.13] });
  b.add(SMOOTH_SPHERE, 0xf29bb0, { pos: [0, 0.25, 0.34], scale: [0.045, 0.04, 0.04] });
  b.pair(BOX, 0x2a2230, { pos: [0.045, 0.3, 0.3], scale: [0.03, 0.012, 0.01] });
  // Big digging paws with claws.
  b.pair(SPHERE, 0xf2b7a6, { pos: [0.15, 0.1, 0.2], scale: [0.07, 0.03, 0.07], rot: [0, 0.4, 0.3] });
  for (const dx of [-0.03, 0, 0.03]) b.pair(CONE, 0xf6efe6, { pos: [0.16 + dx, 0.09, 0.27], scale: [0.012, 0.05, 0.012], rot: [Math.PI / 2, 0, 0] });
  b.pair(SPHERE, fur, { pos: [0.1, 0.05, -0.15], scale: [0.05, 0.04, 0.06] });
  return b;
}

function penguin() {
  const b = new Builder();
  b.add(SPHERE, 0x2c2c38, { pos: [0, 0.3, 0], scale: [0.17, 0.27, 0.16] });
  b.add(SPHERE, WHITE, { pos: [0, 0.27, 0.06], scale: [0.13, 0.21, 0.12] });
  b.add(SMOOTH_SPHERE, 0x2c2c38, { pos: [0, 0.56, 0.02], scale: 0.12 });
  b.pair(SMOOTH_SPHERE, WHITE, { pos: [0.05, 0.57, 0.1], scale: 0.035 });
  eyes(b, { x: 0.05, y: 0.58, z: 0.12, r: 0.02 });
  b.add(CONE, 0xf08a24, { pos: [0, 0.53, 0.15], scale: [0.03, 0.07, 0.03], rot: [Math.PI / 2, 0, 0] });
  b.pair(SPHERE, 0x2c2c38, { pos: [0.17, 0.32, 0], scale: [0.03, 0.14, 0.06], rot: [0, 0, 0.3] });
  b.pair(BOX, 0xf08a24, { pos: [0.06, 0.02, 0.05], scale: [0.07, 0.03, 0.1] });
  return b;
}

function owl() {
  const b = new Builder();
  const feather = 0xc8a06a;
  b.add(SPHERE, feather, { pos: [0, 0.28, 0], scale: [0.2, 0.25, 0.18] });
  b.add(SPHERE, 0xf0dcb4, { pos: [0, 0.25, 0.08], scale: [0.14, 0.18, 0.12] });
  b.add(SMOOTH_SPHERE, feather, { pos: [0, 0.52, 0.02], scale: [0.17, 0.14, 0.14] });
  b.pair(SMOOTH_SPHERE, 0xf0dcb4, { pos: [0.07, 0.53, 0.11], scale: [0.065, 0.065, 0.03] });
  b.pair(SMOOTH_SPHERE, 0xffc83d, { pos: [0.07, 0.53, 0.13], scale: 0.04 });
  b.pair(SMOOTH_SPHERE, BLACK, { pos: [0.07, 0.53, 0.16], scale: 0.022 });
  b.add(CONE, 0xf08a24, { pos: [0, 0.47, 0.15], scale: [0.02, 0.05, 0.02], rot: [Math.PI, 0, 0] });
  b.pair(CONE, feather, { pos: [0.11, 0.66, 0], scale: [0.035, 0.08, 0.03], rot: [0, 0, -0.3] });
  b.pair(SPHERE, 0xa07c4a, { pos: [0.18, 0.28, -0.02], scale: [0.04, 0.16, 0.11] });
  b.pair(BOX, 0xf08a24, { pos: [0.06, 0.02, 0.06], scale: [0.06, 0.03, 0.07] });
  return b;
}

function rooster() {
  const b = bird({ body: 0xf8f4ea, beak: 0xf0b030, size: 1.05, crest: false });
  b.add(SPHERE, 0xe5383b, { pos: [0, 0.6, 0.13], scale: [0.025, 0.06, 0.07] });
  b.add(SPHERE, 0xe5383b, { pos: [0, 0.36, 0.25], scale: [0.025, 0.04, 0.025] });
  b.add(CONE, 0x2f6a4a, { pos: [0, 0.38, -0.27], scale: [0.08, 0.16, 0.05], rot: [-0.7, 0, 0] });
  return b;
}

const BUILDERS = {
  frog,
  mole,
  penguin,
  owl,
  rooster,
  duck: () => bird({ body: 0xffd54a, beak: 0xf08a24 }),
  chick: () => bird({ body: 0xffe36b, beak: 0xf08a24, size: 0.8, crest: true }),
};

const geometryCache = new Map();

export function animalGeometry(kind) {
  if (!geometryCache.has(kind)) {
    const make = BUILDERS[kind] ?? (() => quadruped(ANIMALS[kind]));
    geometryCache.set(kind, make().geometry().scale(1.25, 1.25, 1.25));
  }
  return geometryCache.get(kind);
}

// Album looks: 0 is the usual colouring; 1 and 2 blend the coat towards gold or lavender.
// Eyes, noses and outlines (dark colours) keep their colour.
export const VARIANT_TINTS = [null, 0xffc83d, 0x9a7bff];
const variantCache = new Map();

export function animalVariantGeometry(kind, variant = 0) {
  if (!variant) return animalGeometry(kind);
  const key = `${kind}|${variant}`;
  if (!variantCache.has(key)) {
    const g = animalGeometry(kind).clone();
    const col = g.attributes.color;
    const tint = new Color(VARIANT_TINTS[variant]);
    const c = new Color();
    const hsl = {};
    for (let i = 0; i < col.count; i++) {
      c.setRGB(col.getX(i), col.getY(i), col.getZ(i));
      c.getHSL(hsl);
      if (hsl.l < 0.22) continue;
      c.lerp(tint, 0.42);
      col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
    variantCache.set(key, g);
  }
  return variantCache.get(key);
}

export function buildAnimal(kind, variant = 0) {
  const mesh = new Mesh(animalVariantGeometry(kind, variant), flatMaterial);
  mesh.userData.kind = kind;
  mesh.userData.variant = variant;
  return mesh;
}

const headCache = new Map();

/** Where a hat sits on an animal: the centre of the topmost vertices. */
export function animalHatSpot(kind) {
  if (!headCache.has(kind)) {
    const pos = animalGeometry(kind).attributes.position;
    let top = -Infinity;
    for (let i = 0; i < pos.count; i++) top = Math.max(top, pos.getY(i));
    let x = 0;
    let z = 0;
    let n = 0;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > top - 0.12) {
        x += pos.getX(i);
        z += pos.getZ(i);
        n++;
      }
    }
    headCache.set(kind, { x: x / n, y: top - 0.06, z: z / n });
  }
  return headCache.get(kind);
}

export function buildRescuer() {
  const b = new Builder();
  const skin = 0xf7c99c;
  b.pair(CYL, 0x3b4a7a, { pos: [0.07, 0.09, 0], scale: [0.055, 0.18, 0.055] });
  b.pair(BOX, 0x40302a, { pos: [0.07, 0.02, 0.03], scale: [0.09, 0.05, 0.14] });
  b.add(CYL, 0x2fa7a0, { pos: [0, 0.3, 0], scale: [0.15, 0.24, 0.13] });
  b.pair(CYL, 0x2fa7a0, { pos: [0.18, 0.31, 0], scale: [0.045, 0.2, 0.045], rot: [0, 0, 0.35] });
  b.pair(SMOOTH_SPHERE, skin, { pos: [0.22, 0.2, 0], scale: 0.045 });
  b.add(BOX, 0xf2b33d, { pos: [0, 0.32, -0.14], scale: [0.2, 0.22, 0.09] });
  b.add(SMOOTH_SPHERE, skin, { pos: [0, 0.58, 0], scale: 0.17 });
  b.add(SPHERE, 0xe5474b, { pos: [0, 0.65, -0.01], scale: [0.18, 0.11, 0.18] });
  b.add(CYL, 0xe5474b, { pos: [0, 0.64, 0.13], scale: [0.12, 0.02, 0.1] });
  eyes(b, { x: 0.06, y: 0.58, z: 0.14, r: 0.025 });
  b.add(SMOOTH_SPHERE, 0xf29a8a, { pos: [0, 0.53, 0.165], scale: [0.03, 0.015, 0.01] });
  const mesh = b.mesh();
  mesh.geometry.scale(1.2, 1.2, 1.2);
  return mesh;
}

export function treeGeometry(variant = 0) {
  const b = new Builder();
  b.add(CYL, 0x8a5a36, { pos: [0, 0.22, 0], scale: [0.08, 0.44, 0.08] });
  if (variant % 2 === 0) {
    b.add(ICO, 0x4f9e4a, { pos: [0, 0.62, 0], scale: [0.36, 0.34, 0.36] });
    b.add(ICO, 0x5fb655, { pos: [0.05, 0.86, 0.03], scale: [0.24, 0.22, 0.24] });
  } else {
    b.add(CONE, 0x3f8f52, { pos: [0, 0.6, 0], scale: [0.36, 0.5, 0.36] });
    b.add(CONE, 0x4fa862, { pos: [0, 0.92, 0], scale: [0.26, 0.4, 0.26] });
  }
  return b.geometry();
}

// Low obstacles for inner and front tiles, so they never hide characters behind them.
export function shrubGeometry(variant = 0) {
  const b = new Builder();
  if (variant % 2 === 0) {
    b.add(ICO1, 0x4a9a48, { pos: [0, 0.2, 0], scale: [0.34, 0.24, 0.34] });
    b.add(ICO1, 0x5cb257, { pos: [0.14, 0.32, 0.08], scale: [0.2, 0.16, 0.2] });
    b.add(ICO1, 0x56a852, { pos: [-0.16, 0.28, -0.06], scale: [0.18, 0.15, 0.18] });
  } else {
    b.add(ICO, 0x8f8f9c, { pos: [0, 0.16, 0], scale: [0.34, 0.24, 0.3] });
    b.add(ICO, 0xa6a6b2, { pos: [0.18, 0.12, 0.14], scale: [0.18, 0.14, 0.16] });
    b.add(ICO1, 0x5cb257, { pos: [-0.2, 0.1, 0.16], scale: [0.14, 0.1, 0.14] });
  }
  return b.geometry();
}

export function buildHedge() {
  const b = new Builder();
  const c1 = 0x3c8a3f;
  const c2 = 0x4ea24c;
  b.add(BOX, c1, { pos: [0, 0.22, 0], scale: [0.86, 0.44, 0.86] });
  for (const [x, z] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25], [0, 0]]) {
    b.add(ICO1, c2, { pos: [x, 0.45, z], scale: [0.24, 0.16, 0.24] });
  }
  // Small berries make the hedge readable without relying on colour alone.
  for (const [x, z] of [[-0.3, 0.42], [0.2, 0.43], [0.43, -0.1], [-0.43, 0.05]]) {
    b.add(SMOOTH_SPHERE, 0xe8506a, { pos: [x, 0.3, z], scale: 0.04 });
  }
  return b.mesh();
}

export function boulderGeometry() {
  const b = new Builder();
  b.add(ICO1, 0x9a9aa6, { scale: [0.36, 0.33, 0.36] });
  b.add(ICO, 0xb4b4c0, { pos: [0.08, 0.14, 0.06], scale: 0.16 });
  return b.geometry();
}

export function buildCage() {
  const b = new Builder();
  const wood = 0xa86a3c;
  const dark = 0x7a4a28;
  b.add(BOX, dark, { pos: [0, 0.04, 0], scale: [0.86, 0.08, 0.86] });
  b.add(BOX, wood, { pos: [0, 0.82, 0], scale: [0.9, 0.08, 0.9] });
  for (const [x, z] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]]) {
    b.add(BOX, dark, { pos: [x, 0.43, z], scale: [0.08, 0.78, 0.08] });
  }
  for (const t of [-0.2, 0, 0.2]) {
    b.add(CYL, 0x8f9aa8, { pos: [t, 0.43, 0.4], scale: [0.02, 0.76, 0.02] });
    b.add(CYL, 0x8f9aa8, { pos: [t, 0.43, -0.4], scale: [0.02, 0.76, 0.02] });
    b.add(CYL, 0x8f9aa8, { pos: [0.4, 0.43, t], scale: [0.02, 0.76, 0.02] });
    b.add(CYL, 0x8f9aa8, { pos: [-0.4, 0.43, t], scale: [0.02, 0.76, 0.02] });
  }
  // Padlock on the front.
  b.add(BOX, 0xf2c14e, { pos: [0, 0.4, 0.45], scale: [0.14, 0.12, 0.05] });
  b.add(CYL, 0xf2c14e, { pos: [0, 0.49, 0.45], scale: [0.04, 0.06, 0.02], rot: [Math.PI / 2, 0, 0] });
  return b.mesh();
}

export function buildHouse() {
  const b = new Builder();
  b.add(BOX, 0xfbe9cf, { pos: [0, 0.3, 0], scale: [0.74, 0.6, 0.66] });
  b.add(CONE, 0xe0534d, { pos: [0, 0.82, 0], scale: [0.62, 0.46, 0.62], rot: [0, Math.PI / 4, 0] });
  b.add(BOX, 0x9a5b34, { pos: [0, 0.2, 0.335], scale: [0.2, 0.36, 0.02] });
  b.add(SMOOTH_SPHERE, 0xf2c14e, { pos: [0.06, 0.2, 0.35], scale: 0.018 });
  b.pair(BOX, 0x8fd3f0, { pos: [0.22, 0.38, 0.335], scale: [0.13, 0.13, 0.02] });
  b.add(BOX, 0xb85a4a, { pos: [0.2, 0.98, -0.1], scale: [0.09, 0.22, 0.09] });
  // Heart above the door: home is where the pets go.
  b.add(SMOOTH_SPHERE, 0xe8506a, { pos: [-0.025, 0.47, 0.34], scale: [0.03, 0.03, 0.015] });
  b.add(SMOOTH_SPHERE, 0xe8506a, { pos: [0.025, 0.47, 0.34], scale: [0.03, 0.03, 0.015] });
  b.add(CONE, 0xe8506a, { pos: [0, 0.44, 0.34], scale: [0.045, 0.04, 0.015], rot: [Math.PI, 0, 0] });
  return b.mesh();
}

export function buildPin() {
  const b = new Builder();
  b.add(CONE, 0xffc83d, { pos: [0, 0.18, 0], scale: [0.14, 0.32, 0.14], rot: [Math.PI, 0, 0] });
  b.add(SMOOTH_SPHERE, 0xffc83d, { pos: [0, 0.4, 0], scale: 0.15 });
  b.add(SMOOTH_SPHERE, WHITE, { pos: [0, 0.4, 0.1], scale: 0.07 });
  return b.mesh(smoothMaterial);
}

export function buildDirt() {
  const b = new Builder();
  for (const [x, z, s] of [[-0.25, 0.2, 0.12], [0.22, -0.18, 0.1], [0.28, 0.26, 0.08], [-0.2, -0.28, 0.09]]) {
    b.add(ICO, 0x8a5a36, { pos: [x, 0.02, z], scale: [s, s * 0.5, s] });
  }
  return b.mesh();
}

export function buildBee() {
  const b = new Builder();
  b.add(SMOOTH_SPHERE, 0xffc83d, { pos: [0, 0, 0], scale: [0.13, 0.11, 0.16] });
  for (const z of [-0.06, 0.04]) b.add(CYL, BLACK, { pos: [0, 0, z], scale: [0.115, 0.03, 0.115], rot: [Math.PI / 2, 0, 0] });
  b.add(SMOOTH_SPHERE, BLACK, { pos: [0, 0.01, 0.15], scale: 0.07 });
  b.pair(SMOOTH_SPHERE, WHITE, { pos: [0.03, 0.04, 0.2], scale: 0.022 });
  b.add(CONE, BLACK, { pos: [0, 0, -0.19], scale: [0.03, 0.06, 0.03], rot: [-Math.PI / 2, 0, 0] });
  const body = b.mesh();
  const wing = new Builder().add(SMOOTH_SPHERE, 0xdff4ff, { scale: [0.1, 0.015, 0.06] }).geometry();
  const left = new Mesh(wing, new MeshLambertMaterial({ color: 0xeaf8ff, transparent: true, opacity: 0.8 }));
  const right = left.clone();
  left.position.set(0.09, 0.1, 0);
  right.position.set(-0.09, 0.1, 0);
  body.add(left, right);
  body.userData.wings = [left, right];
  return body;
}

// Hats: worn by the rescuer (and garden pets). Star hats can also be chosen with a rewarded ad;
// streak hats are earned only by daily streaks.
export const HATS = [
  'party', 'crown', 'flowers', 'beanie', 'cowboy', 'tophat', 'chef', 'pirate', 'wizard',
  'bow', 'viking', 'propeller', 'sunhat', 'antlers', 'astronaut', 'unicorn',
];

export function buildHat(kind) {
  const b = new Builder();
  switch (kind) {
    case 'party':
      b.add(CONE, 0x6c8cff, { pos: [0, 0.14, 0], scale: [0.11, 0.26, 0.11] });
      b.add(SMOOTH_SPHERE, 0xffd84a, { pos: [0, 0.28, 0], scale: 0.04 });
      for (const y of [0.06, 0.13]) b.add(CYL, 0xff7aa8, { pos: [0, y, 0], scale: [0.1 - y * 0.35, 0.015, 0.1 - y * 0.35] });
      break;
    case 'crown':
      b.add(CYL, 0xffc83d, { pos: [0, 0.05, 0], scale: [0.13, 0.08, 0.13] });
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        b.add(CONE, 0xffc83d, { pos: [Math.cos(a) * 0.11, 0.13, Math.sin(a) * 0.11], scale: [0.03, 0.08, 0.03] });
      }
      b.add(SMOOTH_SPHERE, 0xe5383b, { pos: [0, 0.05, 0.13], scale: 0.025 });
      break;
    case 'flowers':
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2;
        b.add(SMOOTH_SPHERE, [0xff8fab, 0xffe066, 0xffffff, 0xb9a6ff][k % 4], { pos: [Math.cos(a) * 0.14, 0.02, Math.sin(a) * 0.14], scale: 0.04 });
      }
      break;
    case 'beanie':
      b.add(SPHERE, 0x3fa7d6, { pos: [0, 0.02, 0], scale: [0.18, 0.13, 0.18] });
      b.add(CYL, 0x2a7fa8, { pos: [0, -0.02, 0], scale: [0.185, 0.05, 0.185] });
      b.add(ICO1, WHITE, { pos: [0, 0.16, 0], scale: 0.05 });
      break;
    case 'cowboy':
      b.add(CYL, 0x9a6234, { pos: [0, 0, 0], scale: [0.28, 0.02, 0.28] });
      b.add(CYL, 0x9a6234, { pos: [0, 0.08, 0], scale: [0.14, 0.14, 0.14] });
      b.add(CYL, 0x4a2c1a, { pos: [0, 0.03, 0], scale: [0.145, 0.03, 0.145] });
      break;
    case 'tophat':
      b.add(CYL, 0x2a2230, { pos: [0, 0, 0], scale: [0.22, 0.02, 0.22] });
      b.add(CYL, 0x2a2230, { pos: [0, 0.13, 0], scale: [0.13, 0.25, 0.13] });
      b.add(CYL, 0xe5383b, { pos: [0, 0.04, 0], scale: [0.135, 0.04, 0.135] });
      break;
    case 'chef':
      b.add(CYL, WHITE, { pos: [0, 0.05, 0], scale: [0.15, 0.1, 0.15] });
      for (const [x, z] of [[0.06, 0], [-0.06, 0], [0, 0.06], [0, -0.06], [0, 0]]) b.add(SMOOTH_SPHERE, WHITE, { pos: [x, 0.16, z], scale: 0.09 });
      break;
    case 'pirate':
      b.add(SPHERE, 0x2a2230, { pos: [0, 0.04, 0], scale: [0.26, 0.09, 0.15] });
      b.add(SMOOTH_SPHERE, WHITE, { pos: [0, 0.06, 0.14], scale: [0.035, 0.035, 0.01] });
      break;
    case 'wizard':
      b.add(CYL, 0x6a3fc8, { pos: [0, 0, 0], scale: [0.24, 0.02, 0.24] });
      b.add(CONE, 0x6a3fc8, { pos: [0, 0.2, 0], scale: [0.14, 0.38, 0.14], rot: [0.15, 0, 0] });
      b.add(SMOOTH_SPHERE, 0xffd84a, { pos: [0.06, 0.15, 0.1], scale: 0.025 });
      break;
    case 'bow':
      b.pair(CONE, 0xff5a8a, { pos: [0.07, 0.04, 0.05], scale: [0.06, 0.1, 0.04], rot: [0, 0, Math.PI / 2] });
      b.add(SMOOTH_SPHERE, 0xe0406e, { pos: [0, 0.04, 0.05], scale: 0.035 });
      break;
    case 'viking':
      b.add(SPHERE, 0xa8b0bc, { pos: [0, 0.02, 0], scale: [0.18, 0.13, 0.18] });
      b.pair(CONE, 0xf6efe6, { pos: [0.18, 0.1, 0], scale: [0.04, 0.16, 0.04], rot: [0, 0, -0.9] });
      break;
    case 'sunhat':
      b.add(CYL, 0xf2d27a, { pos: [0, 0, 0], scale: [0.3, 0.02, 0.3] });
      b.add(SPHERE, 0xf2d27a, { pos: [0, 0.05, 0], scale: [0.15, 0.1, 0.15] });
      b.add(CYL, 0xff7aa8, { pos: [0, 0.03, 0], scale: [0.155, 0.03, 0.155] });
      b.add(SMOOTH_SPHERE, 0xffffff, { pos: [0.12, 0.05, 0.08], scale: 0.035 });
      break;
    case 'antlers':
      for (const side of [1, -1]) {
        b.add(CYL, 0x9a6234, { pos: [0.09 * side, 0.1, 0], scale: [0.018, 0.2, 0.018], rot: [0, 0, -0.35 * side] });
        b.add(CYL, 0x9a6234, { pos: [0.14 * side, 0.15, 0.02], scale: [0.015, 0.1, 0.015], rot: [0.4, 0, -1.1 * side] });
        b.add(CYL, 0x9a6234, { pos: [0.1 * side, 0.17, -0.02], scale: [0.015, 0.08, 0.015], rot: [-0.5, 0, -0.2 * side] });
      }
      b.add(SMOOTH_SPHERE, 0xe5383b, { pos: [0, 0.02, 0.1], scale: 0.03 });
      break;
    case 'astronaut':
      b.add(SMOOTH_SPHERE, 0xf4f6fa, { pos: [0, 0.03, 0], scale: [0.21, 0.17, 0.21] });
      b.add(SMOOTH_SPHERE, 0x4a8fd6, { pos: [0, 0.03, 0.12], scale: [0.13, 0.09, 0.08] });
      b.add(CYL, 0xe5383b, { pos: [0, 0.2, 0], scale: [0.012, 0.08, 0.012] });
      b.add(SMOOTH_SPHERE, 0xffd84a, { pos: [0, 0.25, 0], scale: 0.025 });
      break;
    case 'unicorn':
      b.add(CONE, 0xffe066, { pos: [0, 0.12, 0.06], scale: [0.04, 0.24, 0.04], rot: [0.35, 0, 0] });
      for (const [y, c] of [[0.04, 0xff8fab], [0.1, 0xb9a6ff], [0.16, 0x7fd6ff]]) b.add(CYL, c, { pos: [0, y, 0.06 + (y - 0.04) * 0.35], scale: [0.045 - y * 0.12, 0.012, 0.045 - y * 0.12] });
      b.pair(CONE, 0xff8fab, { pos: [0.09, 0.03, -0.03], scale: [0.03, 0.07, 0.03], rot: [0, 0, -0.3] });
      break;
    case 'propeller':
      b.add(SPHERE, 0xffc83d, { pos: [0, 0.02, 0], scale: [0.17, 0.11, 0.17] });
      b.add(CYL, 0xe5383b, { pos: [0, 0.13, 0], scale: [0.015, 0.08, 0.015] });
      b.add(BOX, 0x3fa7d6, { pos: [0, 0.18, 0], scale: [0.3, 0.01, 0.05] });
      break;
  }
  const mesh = b.mesh();
  mesh.userData.hat = kind;
  return mesh;
}

// ---------- mechanic props ----------

export function buildPlate() {
  const b = new Builder();
  b.add(BOX, 0x8a8a96, { pos: [0, 0.03, 0], scale: [0.74, 0.06, 0.74] });
  b.add(CYL, 0xffc83d, { pos: [0, 0.065, 0], scale: [0.2, 0.015, 0.2] });
  b.add(CYL, 0x8a8a96, { pos: [0, 0.07, 0], scale: [0.12, 0.015, 0.12] });
  return b.mesh();
}

/** Gate: fixed posts plus a bar group that drops into the ground when open. */
export function buildGate() {
  const posts = new Builder();
  posts.pair(BOX, 0x8a5a36, { pos: [0.42, 0.45, 0], scale: [0.16, 0.9, 0.22] });
  // Yellow caps match the plate's yellow ring, linking gate and plate by colour and shape.
  posts.pair(CYL, 0xffc83d, { pos: [0.42, 0.93, 0], scale: [0.12, 0.06, 0.12] });
  const mesh = posts.mesh();
  const bars = new Builder();
  for (const x of [-0.24, -0.08, 0.08, 0.24]) bars.add(BOX, 0xc0843c, { pos: [x, 0.38, 0], scale: [0.1, 0.7, 0.16] });
  bars.add(BOX, 0xa86a3c, { pos: [0, 0.62, 0], scale: [0.8, 0.12, 0.2] });
  bars.add(BOX, 0xa86a3c, { pos: [0, 0.18, 0], scale: [0.8, 0.12, 0.2] });
  bars.add(CYL, 0xffc83d, { pos: [0, 0.62, 0.11], scale: [0.09, 0.02, 0.09], rot: [Math.PI / 2, 0, 0] });
  const barMesh = bars.mesh();
  mesh.add(barMesh);
  mesh.userData.bars = barMesh;
  return mesh;
}

export function buildPlank() {
  const b = new Builder();
  for (const z of [-0.3, -0.1, 0.1, 0.3]) b.add(BOX, z === 0.1 ? 0x9a6234 : 0xb07a44, { pos: [0, -0.03, z], scale: [0.96, 0.06, 0.17], rot: [0, z * 0.1, 0] });
  b.pair(BOX, 0x6e4a2c, { pos: [0.44, -0.08, 0], scale: [0.06, 0.06, 0.98] });
  // Cracks: dark notches so the bridge reads as fragile.
  b.add(BOX, 0x4a2c1a, { pos: [0.1, 0.002, -0.1], scale: [0.25, 0.01, 0.02], rot: [0, 0.6, 0] });
  b.add(BOX, 0x4a2c1a, { pos: [-0.2, 0.002, 0.3], scale: [0.2, 0.01, 0.02], rot: [0, -0.5, 0] });
  return b.mesh();
}

export function buildBurrow(pair) {
  const b = new Builder();
  b.add(CYL, 0x8a5a36, { pos: [0, 0.03, 0], scale: [0.36, 0.06, 0.36] });
  b.add(CYL, 0x2a1a12, { pos: [0, 0.065, 0], scale: [0.22, 0.01, 0.22] });
  // Matching markers by shape (stones round or square), not only by colour.
  const color = pair === 0 ? 0xffa64d : 0xb07cff;
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    b.add(pair === 0 ? SMOOTH_SPHERE : BOX, color, { pos: [Math.cos(a) * 0.36, 0.06, Math.sin(a) * 0.36], scale: pair === 0 ? 0.055 : [0.09, 0.09, 0.09] });
  }
  return b.mesh();
}

// ---------- biome props (instanced) ----------

export function propGeometry(kind) {
  const b = new Builder();
  switch (kind) {
    case 'willow':
      b.add(CYL, 0x7a5a3a, { pos: [0, 0.25, 0], scale: [0.08, 0.5, 0.08] });
      b.add(ICO1, 0x7fbf6a, { pos: [0, 0.72, 0], scale: [0.4, 0.3, 0.4] });
      b.add(CYL, 0x8fcf78, { pos: [0, 0.5, 0], scale: [0.38, 0.35, 0.38] });
      break;
    case 'reeds':
      for (const [x, z, h] of [[-0.12, 0.05, 0.45], [0.05, -0.1, 0.55], [0.15, 0.12, 0.4], [-0.02, 0.15, 0.5]]) {
        b.add(CYL, 0x6aa84f, { pos: [x, h / 2, z], scale: [0.02, h, 0.02] });
        b.add(CYL, 0x8a5a36, { pos: [x, h, z], scale: [0.035, 0.1, 0.035] });
      }
      b.add(ICO, 0x9a9aa6, { pos: [0.1, 0.06, -0.15], scale: [0.14, 0.08, 0.12] });
      break;
    case 'snowpine':
      b.add(CYL, 0x7a5a3a, { pos: [0, 0.15, 0], scale: [0.07, 0.3, 0.07] });
      b.add(CONE, 0x2f7a5a, { pos: [0, 0.5, 0], scale: [0.38, 0.55, 0.38] });
      b.add(CONE, WHITE, { pos: [0, 0.62, 0], scale: [0.3, 0.3, 0.3] });
      b.add(CONE, 0x2f7a5a, { pos: [0, 0.85, 0], scale: [0.26, 0.4, 0.26] });
      b.add(CONE, WHITE, { pos: [0, 0.96, 0], scale: [0.17, 0.2, 0.17] });
      break;
    case 'snowmound':
      b.add(ICO1, 0xf4f8ff, { pos: [0, 0.12, 0], scale: [0.34, 0.2, 0.32] });
      b.add(ICO, 0xbcd4ec, { pos: [0.16, 0.12, 0.1], scale: [0.14, 0.16, 0.12] });
      break;
    case 'apple':
      b.add(CYL, 0x8a5a36, { pos: [0, 0.22, 0], scale: [0.08, 0.44, 0.08] });
      b.add(ICO1, 0x5cae4c, { pos: [0, 0.66, 0], scale: [0.38, 0.32, 0.38] });
      for (const [x, y, z] of [[0.25, 0.66, 0.2], [-0.2, 0.75, 0.22], [0.1, 0.55, -0.3], [-0.28, 0.6, -0.1]]) b.add(SMOOTH_SPHERE, 0xe5383b, { pos: [x, y, z], scale: 0.05 });
      break;
    case 'hay':
      b.add(CYL, 0xe8c45a, { pos: [0, 0.2, 0], scale: [0.3, 0.4, 0.3], rot: [Math.PI / 2, 0, 0] });
      b.add(CYL, 0xd4a83a, { pos: [0, 0.2, 0], scale: [0.31, 0.06, 0.31], rot: [Math.PI / 2, 0, 0] });
      break;
    case 'fence':
      b.pair(BOX, 0xc8a070, { pos: [0.35, 0.25, 0], scale: [0.08, 0.5, 0.08] });
      b.add(BOX, 0xd8b080, { pos: [0, 0.35, 0], scale: [0.9, 0.07, 0.05] });
      b.add(BOX, 0xd8b080, { pos: [0, 0.18, 0], scale: [0.9, 0.07, 0.05] });
      break;
    case 'cactus':
      b.add(CYL, 0x4f9a5a, { pos: [0, 0.38, 0], scale: [0.12, 0.76, 0.12] });
      b.add(SMOOTH_SPHERE, 0x4f9a5a, { pos: [0, 0.76, 0], scale: 0.12 });
      b.add(CYL, 0x4f9a5a, { pos: [0.18, 0.42, 0], scale: [0.07, 0.3, 0.07] });
      b.add(BOX, 0x4f9a5a, { pos: [0.11, 0.3, 0], scale: [0.16, 0.08, 0.08] });
      b.add(SMOOTH_SPHERE, 0xff7aa8, { pos: [0, 0.88, 0], scale: 0.05 });
      break;
    case 'redrock':
      b.add(ICO, 0xc0703f, { pos: [0, 0.2, 0], scale: [0.36, 0.3, 0.32] });
      b.add(ICO, 0xd8925a, { pos: [0.18, 0.12, 0.16], scale: [0.16, 0.14, 0.15] });
      break;
    case 'darkpine':
      b.add(CYL, 0x5a3e28, { pos: [0, 0.2, 0], scale: [0.08, 0.4, 0.08] });
      b.add(CONE, 0x2f6a44, { pos: [0, 0.6, 0], scale: [0.4, 0.6, 0.4] });
      b.add(CONE, 0x3a7a50, { pos: [0, 0.95, 0], scale: [0.3, 0.5, 0.3] });
      break;
    case 'mushroom':
      b.add(CYL, 0xf6efe6, { pos: [0, 0.12, 0], scale: [0.07, 0.24, 0.07] });
      b.add(SPHERE, 0xe5383b, { pos: [0, 0.25, 0], scale: [0.22, 0.12, 0.22] });
      for (const [x, z] of [[0.08, 0.05], [-0.06, -0.08], [-0.08, 0.1]]) b.add(SMOOTH_SPHERE, WHITE, { pos: [x, 0.33, z], scale: 0.03 });
      b.add(CYL, 0xf6efe6, { pos: [0.22, 0.07, 0.15], scale: [0.04, 0.14, 0.04] });
      b.add(SPHERE, 0xf2a03d, { pos: [0.22, 0.15, 0.15], scale: [0.12, 0.07, 0.12] });
      break;
    case 'fountain':
      b.add(CYL, 0xb8b8c4, { pos: [0, 0.12, 0], scale: [0.42, 0.24, 0.42] });
      b.add(CYL, 0x5bbfe9, { pos: [0, 0.22, 0], scale: [0.36, 0.06, 0.36] });
      b.add(CYL, 0xb8b8c4, { pos: [0, 0.4, 0], scale: [0.08, 0.4, 0.08] });
      b.add(SMOOTH_SPHERE, 0x9fe0ff, { pos: [0, 0.65, 0], scale: 0.1 });
      break;
    case 'bench':
      b.add(BOX, 0xb07a44, { pos: [0, 0.22, 0], scale: [0.8, 0.06, 0.3] });
      b.add(BOX, 0xb07a44, { pos: [0, 0.4, -0.13], scale: [0.8, 0.2, 0.05] });
      b.pair(BOX, 0x5a3e28, { pos: [0.34, 0.1, 0], scale: [0.06, 0.2, 0.26] });
      break;
    case 'lamp':
      b.add(CYL, 0x3a3a46, { pos: [0, 0.4, 0], scale: [0.04, 0.8, 0.04] });
      b.add(SMOOTH_SPHERE, 0xfff2a8, { pos: [0, 0.84, 0], scale: 0.09 });
      break;
    case 'flowerbed':
      b.add(BOX, 0x8a5a36, { pos: [0, 0.05, 0], scale: [0.8, 0.1, 0.5] });
      for (let k = 0; k < 8; k++) b.add(SMOOTH_SPHERE, [0xff8fab, 0xffe066, 0xffffff, 0xb9a6ff][k % 4], { pos: [-0.3 + (k % 4) * 0.2, 0.14, k < 4 ? -0.1 : 0.1], scale: 0.06 });
      break;
    case 'swing':
      b.pair(CYL, 0x8a5a36, { pos: [0.4, 0.5, 0], scale: [0.04, 1, 0.04], rot: [0, 0, 0.1] });
      b.add(CYL, 0x8a5a36, { pos: [0, 0.98, 0], scale: [0.04, 0.84, 0.04], rot: [0, 0, Math.PI / 2] });
      b.pair(CYL, 0xd8d8e0, { pos: [0.12, 0.62, 0], scale: [0.01, 0.7, 0.01] });
      b.add(BOX, 0xe5383b, { pos: [0, 0.27, 0], scale: [0.3, 0.04, 0.14] });
      break;
    case 'windmill':
      b.add(CYL, 0xf2e6d2, { pos: [0, 0.5, 0], scale: [0.22, 1, 0.22] });
      b.add(CONE, 0xe0534d, { pos: [0, 1.12, 0], scale: [0.26, 0.26, 0.26] });
      for (let k = 0; k < 4; k++) b.add(BOX, 0xffffff, { pos: [Math.cos((k * Math.PI) / 2) * 0.22, 0.85 + Math.sin((k * Math.PI) / 2) * 0.22, 0.25], scale: [0.4, 0.07, 0.02], rot: [0, 0, (k * Math.PI) / 2] });
      break;
    case 'pond':
      b.add(CYL, 0x9a9aa6, { pos: [0, 0.02, 0], scale: [0.62, 0.05, 0.42] });
      b.add(CYL, 0x5bbfe9, { pos: [0, 0.05, 0], scale: [0.55, 0.02, 0.36] });
      b.add(CYL, 0x63c24c, { pos: [0.2, 0.065, 0.1], scale: [0.1, 0.01, 0.1] });
      break;
  }
  return b.geometry();
}

export { Builder };
