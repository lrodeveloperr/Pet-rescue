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
    b.add(SPHERE, spec.body, { pos: [0, 0.24, 0], scale: [0.19 * chubby, 0.16 * chubby, 0.24] });
    b.add(SPHERE, spec.belly, { pos: [0, 0.2, 0.06], scale: [0.14 * chubby, 0.11, 0.16] });
  }
  if (spec.patches) b.add(SPHERE, BLACK, { pos: [0, 0.27, 0.02], scale: [0.2, 0.09, 0.12] });
  // Legs.
  for (const z of [0.12, -0.12]) b.pair(CYL, legColor, { pos: [0.1, 0.06, z], scale: [0.05, 0.12, 0.05] });
  // Head.
  const hy = 0.43;
  const hz = 0.2;
  const headColor = spec.face ?? spec.body;
  b.add(SPHERE, headColor, { pos: [0, hy, hz], scale: [0.17 * chubby, 0.15 * chubby, 0.15] });
  if (spec.wool) b.add(ICO1, spec.body, { pos: [0, hy + 0.12, hz - 0.03], scale: [0.12, 0.07, 0.1] });
  if (!spec.face) b.add(SPHERE, spec.belly, { pos: [0, hy - 0.05, hz + 0.09], scale: [0.09, 0.06, 0.06] });
  if (spec.snoutLong) b.add(CONE, spec.belly, { pos: [0, hy - 0.04, hz + 0.16], scale: [0.07, 0.12, 0.06], rot: [Math.PI / 2, 0, 0] });
  if (spec.snout) b.add(CYL, spec.nose, { pos: [0, hy - 0.03, hz + 0.15], scale: [0.06, 0.04, 0.05], rot: [Math.PI / 2, 0, 0] });
  else b.add(SMOOTH_SPHERE, spec.nose, { pos: [0, hy - 0.02, hz + (spec.snoutLong ? 0.22 : 0.15)], scale: 0.026 });
  if (spec.patches) b.pair(SPHERE, BLACK, { pos: [0.06, hy + 0.02, hz + 0.11], scale: [0.045, 0.055, 0.03], rot: [0, 0, 0.4] });
  eyes(b, { x: 0.065, y: hy + 0.03, z: hz + 0.125, color: spec.patches || spec.face ? 0x111111 : BLACK });
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
      b.add(SPHERE, WHITE, { pos: [0, 0.37, -0.45], scale: [0.05, 0.05, 0.06], rot: [-0.5, 0, 0] });
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

const BUILDERS = {
  frog,
  mole,
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

export function buildAnimal(kind) {
  const mesh = new Mesh(animalGeometry(kind), flatMaterial);
  mesh.userData.kind = kind;
  return mesh;
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

export { Builder };
