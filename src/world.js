// three.js scene: board diorama, characters, animation and effects.
import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Plane,
  Raycaster,
  RepeatWrapping,
  RingGeometry,
  Scene,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import {
  boulderGeometry,
  buildAnimal,
  buildBee,
  buildBurrow,
  buildCage,
  buildDirt,
  buildGate,
  buildHat,
  buildHedge,
  buildHouse,
  buildPin,
  buildPlank,
  buildPlate,
  buildRescuer,
  flatMaterial,
  propGeometry,
  shrubGeometry,
  treeGeometry,
} from './models.js';
import { COMPANIONS, beePositions, currentDir, gatesOpen, isWater } from './logic.js';
import { THEMES } from './themes.js';

const STEP_TIME = 0.15;
const SLIDE_TIME = 0.085;
const SWIM_Y = -0.16;
const CURRENT_TURN = { up: 0, right: -Math.PI / 2, down: Math.PI, left: Math.PI / 2 };

export const ease = {
  linear: (k) => k,
  out: (k) => 1 - (1 - k) * (1 - k),
  inOut: (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2),
  back: (k) => {
    const c = 1.7;
    return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2;
  },
};

function canvasTexture(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function radial(g, s, inner, outer) {
  const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  r.addColorStop(0, inner);
  r.addColorStop(1, outer);
  g.fillStyle = r;
  g.fillRect(0, 0, s, s);
}

function makeTextures() {
  const soft = canvasTexture(64, (g, s) => radial(g, s, 'rgba(255,255,255,1)', 'rgba(255,255,255,0)'));
  const heart = canvasTexture(64, (g) => {
    g.fillStyle = '#ff5a7a';
    g.beginPath();
    g.moveTo(32, 54);
    g.bezierCurveTo(4, 36, 6, 10, 22, 10);
    g.bezierCurveTo(28, 10, 32, 16, 32, 20);
    g.bezierCurveTo(32, 16, 36, 10, 42, 10);
    g.bezierCurveTo(58, 10, 60, 36, 32, 54);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.7)';
    g.beginPath();
    g.ellipse(21, 21, 5, 3.5, -0.6, 0, Math.PI * 2);
    g.fill();
  });
  const star = canvasTexture(64, (g) => {
    g.fillStyle = '#ffd84a';
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 11 : 28;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r);
    }
    g.fill();
  });
  const shadow = canvasTexture(64, (g, s) => radial(g, s, 'rgba(20,30,20,0.45)', 'rgba(20,30,20,0)'));
  const water = canvasTexture(64, (g, s) => {
    g.fillStyle = '#5bbfe9';
    g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(255,255,255,0.45)';
    g.lineWidth = 3;
    for (let y = 8; y < s; y += 21) {
      g.beginPath();
      for (let x = 0; x <= s; x += 4) g.lineTo(x, y + Math.sin((x / s) * Math.PI * 2) * 3);
      g.stroke();
    }
  });
  water.wrapS = water.wrapT = RepeatWrapping;
  // Chevrons pointing "up" in texture space; planes are turned to the current's direction.
  const current = canvasTexture(64, (g, s) => {
    g.clearRect(0, 0, s, s);
    g.strokeStyle = 'rgba(255,255,255,0.85)';
    g.lineWidth = 6;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const y of [14, 46]) {
      g.beginPath();
      g.moveTo(16, y + 12);
      g.lineTo(32, y);
      g.lineTo(48, y + 12);
      g.stroke();
    }
  });
  current.wrapS = current.wrapT = RepeatWrapping;
  const rim = canvasTexture(64, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s / 2);
    r.addColorStop(0, 'rgba(0,0,0,0.9)');
    r.addColorStop(0.7, 'rgba(40,25,20,0.4)');
    r.addColorStop(1, 'rgba(90,60,40,0.0)');
    g.fillStyle = r;
    g.fillRect(0, 0, s, s);
  });
  const ice = canvasTexture(64, (g, s) => {
    g.fillStyle = '#d6efff';
    g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(255,255,255,0.9)';
    g.lineWidth = 3;
    for (const [x1, y1, x2, y2] of [[8, 50, 30, 30], [36, 58, 56, 40], [12, 18, 22, 10]]) {
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.stroke();
    }
    g.strokeStyle = 'rgba(120,170,210,0.6)';
    g.lineWidth = 2;
    g.strokeRect(1, 1, s - 2, s - 2);
  });
  return { soft, heart, star, shadow, water, rim, current, ice };
}

export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.scene = new Scene();
    this.scene.background = new Color(THEMES.meadow.sky);
    this.camera = new PerspectiveCamera(32, 1, 0.1, 200);
    this.insets = { top: 0, right: 0, bottom: 0, left: 0 };
    this.tex = makeTextures();
    this.tweens = [];
    this.particles = [];
    this.time = 0;
    this.frameTimes = [];
    this.followers = [];
    this.bees = [];
    this.mode = 'level';
    // Bumped whenever the board is re-synced, so stale animation continuations stop.
    this.gen = 0;

    this.hemi = new HemisphereLight(0xffffff, 0x7a9a6a, 1.6);
    this.sun = new DirectionalLight(0xfff2dc, 1.7);
    this.sun.position.set(-4, 10, 6);
    this.scene.add(this.hemi, this.sun);

    this.board = new Group();
    this.scene.add(this.board);
    this.dynamic = new Group();
    this.scene.add(this.dynamic);
    this.fx = new Group();
    this.scene.add(this.fx);

    this.shared = {
      tile: new BoxGeometry(1, 1.6, 1).translate(0, -0.8, 0),
      boulder: boulderGeometry(),
      ring: new RingGeometry(0.34, 0.44, 28).rotateX(-Math.PI / 2),
      plane: new PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
      dot: new CircleGeometry(0.07, 10).rotateX(-Math.PI / 2),
      groundTop: new MeshLambertMaterial({ color: 0x8fd36a }),
      groundSide: new MeshLambertMaterial({ color: 0xa8774c }),
      groundBottom: new MeshLambertMaterial({ color: 0x6e4a2c }),
      iceTop: new MeshLambertMaterial({ map: this.tex.ice }),
      iceSide: new MeshLambertMaterial({ color: 0x9fc8e8 }),
      pit: new MeshBasicMaterial({ color: 0x1a110e }),
      rim: new MeshBasicMaterial({ map: this.tex.rim, transparent: true, depthWrite: false }),
      pool: new MeshLambertMaterial({ color: 0x3f8fbf }),
      water: new MeshLambertMaterial({ map: this.tex.water, transparent: true, opacity: 0.88 }),
      current: new MeshBasicMaterial({ map: this.tex.current, transparent: true, depthWrite: false }),
      shadow: new MeshBasicMaterial({ map: this.tex.shadow, transparent: true, depthWrite: false }),
      ringMat: new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false }),
      tapMat: new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0, depthWrite: false }),
      beeDot: new MeshBasicMaterial({ color: 0x2a2230, transparent: true, opacity: 0.35, depthWrite: false }),
      routeDot: new CircleGeometry(0.11, 12).rotateX(-Math.PI / 2),
      routeMat: new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false }),
      hintMat: new MeshBasicMaterial({ color: 0xffd84a, transparent: true, opacity: 0.95, depthWrite: false }),
    };
    this.props = new Map();

    this.player = buildRescuer();
    this.playerShadow = this.blobShadow(0.62);
    this.dynamic.add(this.player, this.playerShadow);
    this.companionMeshes = new Map();
    this.pin = buildPin();
    this.dynamic.add(this.pin);
    this.tapRing = new Mesh(this.shared.ring, this.shared.tapMat);
    this.tapRing.renderOrder = 2;
    this.dynamic.add(this.tapRing);
    this.targetRings = [];
    this.routeMarks = [];
    // Animation speed: raised while the player taps ahead, so long slides can be skipped.
    this.speed = 1;
    // Which look (see VARIANT_TINTS) the caged pet has in this level.
    this.petVariant = 0;

    this.raycaster = new Raycaster();
    this.groundPlane = new Plane(new Vector3(0, 1, 0), 0);
    this.setTheme('meadow');
    this.resize();
  }

  // ---------- theme and props ----------

  setTheme(key) {
    const th = THEMES[key] ?? THEMES.meadow;
    this.theme = th;
    this.themeKey = key;
    this.scene.background.set(th.sky);
    this.shared.groundTop.color.set(th.top);
    this.shared.groundSide.color.set(th.side);
    this.shared.groundBottom.color.set(th.bottom);
    this.hemi.color.set(th.hemi[0]);
    this.hemi.groundColor.set(th.hemi[1]);
    this.hemi.intensity = th.hemi[2];
    this.sun.intensity = th.sun;
  }

  prop(kind) {
    if (!this.props.has(kind)) {
      const g = { tree0: () => treeGeometry(0), tree1: () => treeGeometry(1), shrub0: () => shrubGeometry(0), shrub1: () => shrubGeometry(1) }[kind];
      this.props.set(kind, g ? g() : propGeometry(kind));
    }
    return this.props.get(kind);
  }

  setHat(kind) {
    if (this.hat) this.player.remove(this.hat);
    this.hat = null;
    if (!kind) return;
    this.hat = buildHat(kind);
    this.hat.position.set(0, 0.86, -0.01);
    this.player.add(this.hat);
  }

  // ---------- layout ----------

  setInsets(insets) {
    this.insets = insets;
    this.fit();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Android can report a 0×0 viewport before the first layout; wait for a real size.
    if (w < 2 || h < 2) return;
    this.sizeW = w;
    this.sizeH = h;
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.fit();
  }

  fit() {
    if (!this.level) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    if (W < 2 || H < 2) return;
    const { top, right, bottom, left } = this.insets;
    const availW = Math.max(80, W - left - right);
    const availH = Math.max(80, H - top - bottom);
    const cam = this.camera;
    cam.aspect = W / H;
    cam.clearViewOffset();
    const el = MathUtils.degToRad(52);
    const dir = new Vector3(0, Math.sin(el), Math.cos(el));
    const hw = this.level.w / 2;
    const hh = this.level.h / 2;
    const corners = [];
    for (const x of [-hw, hw]) for (const z of [-hh, hh]) for (const y of [-0.4, 1.1]) corners.push(new Vector3(x, y, z));
    const v = new Vector3();
    const measure = (d) => {
      cam.position.copy(dir).multiplyScalar(d);
      cam.lookAt(0, 0, 0);
      cam.updateMatrixWorld();
      cam.updateProjectionMatrix();
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const c of corners) {
        v.copy(c).project(cam);
        minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
        minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
      }
      return { minX, maxX, minY, maxY };
    };
    const margin = 0.94;
    let lo = 2, hi = 80;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      const m = measure(mid);
      const fits = (m.maxX - m.minX) / 2 <= (availW / W) * margin && (m.maxY - m.minY) / 2 <= (availH / H) * margin;
      if (fits) hi = mid; else lo = mid;
    }
    const m = measure(hi);
    // Shift the projection so the board's centre lands in the middle of the free area.
    const bx = ((m.minX + m.maxX) / 2 + 1) * 0.5 * W;
    const by = (1 - ((m.minY + m.maxY) / 2 + 1) * 0.5) * H;
    const cx = left + availW / 2;
    const cy = top + availH / 2;
    cam.setViewOffset(W, H, bx - cx, by - cy, W, H);
    cam.updateProjectionMatrix();
  }

  // ---------- coordinates ----------

  pos(i, y = 0) {
    const x = i % this.level.w;
    const z = Math.floor(i / this.level.w);
    return new Vector3(x - (this.level.w - 1) / 2, y, z - (this.level.h - 1) / 2);
  }

  groundHit(clientX, clientY) {
    const ndc = new Vector2((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = new Vector3();
    return this.raycaster.ray.intersectPlane(this.groundPlane, hit) ? hit : null;
  }

  tileAt(clientX, clientY) {
    if (!this.level) return -1;
    const hit = this.groundHit(clientX, clientY);
    if (!hit) return -1;
    const x = Math.round(hit.x + (this.level.w - 1) / 2);
    const y = Math.round(hit.z + (this.level.h - 1) / 2);
    if (x < 0 || y < 0 || x >= this.level.w || y >= this.level.h) return -1;
    return y * this.level.w + x;
  }

  toScreen(v) {
    const p = v.clone().project(this.camera);
    return { x: (p.x + 1) * 0.5 * window.innerWidth, y: (1 - (p.y + 1) * 0.5) * window.innerHeight };
  }

  tileScreen(i, y = 0.4) {
    return this.toScreen(this.pos(i, y));
  }

  // ---------- building ----------

  blobShadow(size) {
    const m = new Mesh(this.shared.plane, this.shared.shadow);
    m.scale.setScalar(size);
    m.renderOrder = 1;
    return m;
  }

  clearGroup(g) {
    for (const child of [...g.children]) {
      g.remove(child);
      if (child.isInstancedMesh) child.dispose();
    }
  }

  /** Instanced ground blocks with per-tile shade variation. */
  groundBlocks(list, mats, tint = true) {
    if (!list.length) return;
    const { w } = this.level;
    const ground = new InstancedMesh(this.shared.tile, mats, list.length);
    const m = new Matrix4();
    const c = new Color();
    list.forEach((i, k) => {
      const p = this.pos(i);
      m.makeTranslation(p.x, 0, p.z);
      ground.setMatrixAt(k, m);
      const checker = tint && ((i % w) + Math.floor(i / w)) % 2 ? 1 : 0.93;
      const edge = this.level.terrain[i] === '#' ? 0.88 : 1;
      c.setRGB(checker * edge, checker * edge, checker * edge);
      ground.setColorAt(k, c);
    });
    this.board.add(ground);
  }

  scatter(kind, list, jitter = true) {
    if (!list.length) return;
    const im = new InstancedMesh(this.prop(kind), flatMaterial, list.length);
    const o = new Object3D();
    list.forEach((i, k) => {
      const p = this.pos(i);
      const r = ((i * 9301 + 49297) % 233280) / 233280;
      o.position.set(p.x + (jitter ? (r - 0.5) * 0.12 : 0), 0, p.z + (jitter ? (r - 0.5) * 0.1 : 0));
      o.rotation.set(0, jitter ? r * Math.PI * 2 : 0, 0);
      o.scale.setScalar(jitter ? 0.85 + r * 0.3 : 1);
      o.updateMatrix();
      im.setMatrixAt(k, o.matrix);
    });
    this.board.add(im);
  }

  loadLevel(level, state, themeKey = this.themeKey) {
    this.mode = 'level';
    this.level = level;
    this.setTheme(themeKey);
    this.clearGroup(this.board);
    this.finishTweens();
    const { w, h } = level;
    const t = level.terrain;
    const th = this.theme;
    const solid = [];
    const ice = [];
    const water = [];
    const gaps = [];
    const tall = th.tall.map(() => []);
    const low = th.low.map(() => []);
    for (let i = 0; i < w * h; i++) {
      const ch = t[i];
      if (isWater(ch)) water.push(i);
      else if (ch === '_' || ch === '%') gaps.push(i);
      else if (ch === '*') ice.push(i);
      else solid.push(i);
      if (ch === '#') {
        // Tall props only along the back and sides; low ones elsewhere never hide anything.
        const x = i % w;
        const y = Math.floor(i / w);
        const isTall = y === 0 || ((x === 0 || x === w - 1) && y < h - 1);
        const list = isTall ? tall : low;
        list[(i * 7 + x + y) % list.length].push(i);
      }
    }
    const s = this.shared;
    this.groundBlocks(solid, [s.groundSide, s.groundSide, s.groundTop, s.groundBottom, s.groundSide, s.groundSide]);
    this.groundBlocks(ice, [s.iceSide, s.iceSide, s.iceTop, s.groundBottom, s.iceSide, s.iceSide], false);

    // Water: a sunken pool bed with a scrolling surface; currents add moving chevrons.
    for (const i of water) {
      const p = this.pos(i);
      const bed = new Mesh(s.tile, s.pool);
      bed.position.set(p.x, -0.42, p.z);
      const surf = new Mesh(s.plane, s.water);
      surf.position.set(p.x, -0.1, p.z);
      this.board.add(bed, surf);
      const dir = currentDir(t[i]);
      if (dir) {
        const arrows = new Mesh(s.plane, s.current);
        arrows.position.set(p.x, -0.08, p.z);
        arrows.rotation.y = CURRENT_TURN[dir];
        arrows.scale.setScalar(0.9);
        arrows.renderOrder = 2;
        this.board.add(arrows);
      }
    }
    // Gaps: a dark pit with a shadowed rim, clearly a hole and not a path.
    for (const i of gaps) {
      const p = this.pos(i);
      const pit = new Mesh(s.tile, s.pit);
      pit.position.set(p.x, -0.28, p.z);
      pit.scale.set(0.999, 1, 0.999);
      const rim = new Mesh(s.plane, s.rim);
      rim.position.set(p.x, -0.27, p.z);
      rim.renderOrder = 1;
      this.board.add(pit, rim);
    }
    th.tall.forEach((kind, k) => this.scatter(kind, tall[k]));
    th.low.forEach((kind, k) => this.scatter(kind, low[k], kind !== 'fence'));
    // Burrows are fixed; their pair is shown by marker shape.
    for (let i = 0; i < t.length; i++) {
      if ('()[]'.includes(t[i])) {
        const b = buildBurrow('()'.includes(t[i]) ? 0 : 1);
        b.position.copy(this.pos(i));
        this.board.add(b);
      }
    }
    // Bee patrol routes: dotted marks on the ground so the danger zone is visible.
    const route = new Set(level.bees.flat());
    for (const i of route) {
      for (const [dx, dz] of [[-0.2, -0.2], [0.2, 0.2], [0.2, -0.2], [-0.2, 0.2]]) {
        const d = new Mesh(s.dot, s.beeDot);
        d.position.copy(this.pos(i, this.surfaceY(t[i]) + 0.02)).add(new Vector3(dx, 0, dz));
        d.renderOrder = 1;
        this.board.add(d);
      }
    }
    // Flowers on open grass so the board feels alive.
    const flowers = th.flowers.length ? solid.filter((i) => t[i] === '.' && (i * 13) % 5 === 0) : [];
    if (flowers.length) {
      const fm = new InstancedMesh(new BoxGeometry(0.06, 0.06, 0.06).translate(0, 0.03, 0), new MeshLambertMaterial(), flowers.length * 2);
      const o = new Object3D();
      const c = new Color();
      flowers.forEach((i, k) => {
        const p = this.pos(i);
        for (let j = 0; j < 2; j++) {
          o.position.set(p.x + (j ? 0.32 : -0.3), 0, p.z + (j ? -0.3 : 0.28));
          o.updateMatrix();
          fm.setMatrixAt(k * 2 + j, o.matrix);
          fm.setColorAt(k * 2 + j, c.set(th.flowers[(i + j) % th.flowers.length]));
        }
      });
      this.board.add(fm);
    }
    this.house = buildHouse();
    this.house.position.copy(this.pos(level.exit));
    this.board.add(this.house);

    this.fit();
    this.sync(state);
  }

  surfaceY(ch) {
    return isWater(ch) ? -0.1 : ch === '_' ? -0.27 : 0;
  }

  /** Snap every dynamic object to the given state without animation. */
  sync(state) {
    this.gen++;
    this.finishTweens();
    this.state = state;
    this.clearGroup(this.dynamic);
    this.dynamic.add(this.player, this.playerShadow, this.pin, this.tapRing);
    this.tapRing.userData.t = 1;
    this.shared.tapMat.opacity = 0;
    this.targetRings = [];
    this.routeMarks = [];
    this.followers = [];

    this.terrainObjs = new Map();
    this.plates = [];
    this.gates = [];
    for (let i = 0; i < state.t.length; i++) this.syncTerrain(state, i);

    this.boulders = new Map();
    for (const i of state.b) this.addBoulder(i);

    this.cage = null;
    if (!state.rescued) {
      const cage = buildCage();
      cage.position.copy(this.pos(state.cage));
      const pet = buildAnimal(state.pet, this.petVariant);
      pet.scale.setScalar(0.95);
      pet.position.set(0, 0.08, 0);
      cage.add(pet);
      cage.userData.pet = pet;
      this.dynamic.add(cage);
      this.cage = cage;
    }

    this.bees = state.bees.map(() => {
      const bee = buildBee();
      this.dynamic.add(bee);
      return bee;
    });
    this.placeBees(state);

    this.trail = [state.p, state.p, state.p];
    this.placeOnTile(this.player, state.p, state);
    this.player.rotation.set(0, 0, 0);
    this.player.scale.setScalar(1);
    this.player.visible = true;
    this.rebuildFollowers(state);
    this.syncMechanics(state, false);
    this.updateShadows();
  }

  syncTerrain(state, i) {
    const ch = state.t[i];
    if (ch === 'o') {
      const plate = buildPlate();
      plate.position.copy(this.pos(i));
      plate.userData.i = i;
      this.dynamic.add(plate);
      this.plates.push(plate);
      return;
    }
    if (ch === 'g') {
      const gate = buildGate();
      gate.position.copy(this.pos(i));
      // Face the gate across the way it blocks.
      const w = state.w;
      const open = (j) => j >= 0 && j < state.t.length && state.t[j] !== '#';
      if (open(i - w) || open(i + w)) gate.rotation.y = 0;
      if (!(open(i - w) && open(i + w)) && (open(i - 1) || open(i + 1))) gate.rotation.y = Math.PI / 2;
      this.dynamic.add(gate);
      this.gates.push(gate);
      return;
    }
    const existing = this.terrainObjs.get(i);
    if (existing && existing.userData.ch === ch) return;
    if (existing) this.dynamic.remove(existing);
    let obj = null;
    const p = this.pos(i);
    if (ch === 'H') {
      obj = buildHedge();
    } else if (ch === ',') {
      obj = buildDirt();
    } else if (ch === '%') {
      obj = buildPlank();
    } else if (ch === '=') {
      obj = new Mesh(this.shared.boulder, flatMaterial);
      obj.scale.set(1.15, 0.7, 1.15);
      p.y = -0.12;
    } else if (ch === '+') {
      obj = new Mesh(this.shared.boulder, flatMaterial);
      obj.scale.set(1.35, 0.9, 1.35);
      p.y = -0.12;
    }
    if (obj) {
      obj.position.copy(p);
      obj.userData.ch = ch;
      this.dynamic.add(obj);
      this.terrainObjs.set(i, obj);
    } else {
      this.terrainObjs.delete(i);
    }
  }

  /** Plates sink while pressed; gate bars drop into the ground while open. */
  syncMechanics(state, animate = true) {
    const open = gatesOpen(state);
    for (const plate of this.plates) {
      const pressed = state.p === plate.userData.i || state.b.includes(plate.userData.i);
      plate.position.y = pressed ? -0.04 : 0;
    }
    for (const gate of this.gates) {
      const bars = gate.userData.bars;
      const target = open ? -0.82 : 0;
      if (Math.abs(bars.position.y - target) < 0.001) continue;
      if (!animate) {
        bars.position.y = target;
        continue;
      }
      const from = bars.position.y;
      this.tween(0.22, (k) => (bars.position.y = MathUtils.lerp(from, target, k)), ease.inOut);
    }
  }

  placeBees(state) {
    const at = beePositions(state);
    this.bees.forEach((bee, k) => bee.position.copy(this.pos(at[k], 0.85)));
  }

  moveBees(state) {
    if (!this.bees.length) return Promise.resolve();
    const at = beePositions(state);
    return Promise.all(
      this.bees.map((bee, k) => {
        const to = this.pos(at[k], 0.85);
        return this.moveObj(bee, bee.position.clone(), to, { duration: 0.16, arc: 0.12 });
      }),
    );
  }

  addBoulder(i) {
    const b = new Mesh(this.shared.boulder, flatMaterial);
    b.position.copy(this.pos(i, 0.33));
    b.rotation.set(i * 0.7, i * 1.3, 0);
    const sh = this.blobShadow(0.85);
    b.userData.shadow = sh;
    this.dynamic.add(b, sh);
    this.boulders.set(i, b);
    return b;
  }

  companionMesh(kind) {
    if (!this.companionMeshes.has(kind)) this.companionMeshes.set(kind, buildAnimal(kind));
    return this.companionMeshes.get(kind);
  }

  rebuildFollowers(state) {
    for (const f of this.followers) {
      this.dynamic.remove(f.mesh, f.shadow);
    }
    this.followers = [];
    const kinds = [];
    if (state.active) kinds.push(state.active);
    if (state.rescued && !COMPANIONS.includes(state.pet)) kinds.push(state.pet);
    kinds.forEach((kind, k) => {
      const mesh = kind === state.active ? this.companionMesh(kind) : buildAnimal(kind, kind === state.pet ? this.petVariant : 0);
      mesh.visible = true;
      mesh.scale.setScalar(1);
      const shadow = this.blobShadow(0.5);
      this.dynamic.add(mesh, shadow);
      const f = { kind, mesh, shadow, slot: k + 1 };
      this.followers.push(f);
      const i = this.trail[Math.min(f.slot, this.trail.length - 1)];
      this.placeOnTile(mesh, i, state, f.slot);
      mesh.rotation.y = this.player.rotation.y;
    });
  }

  tileY(state, i) {
    return isWater(state.t[i]) ? SWIM_Y : 0;
  }

  placeOnTile(obj, i, state, slot = 0) {
    const p = this.pos(i, this.tileY(state, i));
    if (slot && i === state.p) {
      // Stack followers just behind the player when they share a tile.
      p.z += 0.28 * slot;
      p.x += slot === 2 ? 0.18 : -0.12;
    }
    obj.position.copy(p);
  }

  updateShadows() {
    const set = (sh, obj, surface) => {
      sh.position.set(obj.position.x, surface + 0.01, obj.position.z);
    };
    const st = this.state;
    const surfaceAt = (obj) => {
      if (!this.level || !st) return 0;
      const x = Math.round(obj.position.x + (this.level.w - 1) / 2);
      const z = Math.round(obj.position.z + (this.level.h - 1) / 2);
      return this.surfaceY(st.t[z * this.level.w + x]);
    };
    set(this.playerShadow, this.player, surfaceAt(this.player));
    for (const f of this.followers) set(f.shadow, f.mesh, surfaceAt(f.mesh));
    for (const b of this.boulders?.values() ?? []) set(b.userData.shadow, b, surfaceAt(b));
  }

  // ---------- markers ----------

  setTargets(list) {
    for (const r of this.targetRings) this.dynamic.remove(r);
    this.targetRings = list.map((i, k) => {
      const ring = new Mesh(this.shared.ring, this.shared.ringMat);
      ring.position.copy(this.pos(i, this.tileY(this.state, i) + 0.03));
      if (this.state.t[i] === '_') ring.position.y = 0.03;
      ring.userData.phase = k * 0.4;
      ring.renderOrder = 2;
      this.dynamic.add(ring);
      return ring;
    });
  }

  /** Hint marks: dots along a route, and an optional golden ring on the key tile. */
  showRoute(tiles, key = -1) {
    this.clearRoute();
    tiles.forEach((i, k) => {
      const dot = new Mesh(this.shared.routeDot, this.shared.routeMat);
      dot.position.copy(this.pos(i, this.tileY(this.state, i) + 0.05));
      if (this.state.t[i] === '_') dot.position.y = 0.05;
      dot.userData.phase = k * 0.35;
      dot.renderOrder = 3;
      this.dynamic.add(dot);
      this.routeMarks.push(dot);
    });
    if (key >= 0) {
      const ring = new Mesh(this.shared.ring, this.shared.hintMat);
      ring.position.copy(this.pos(key, this.tileY(this.state, key) + 0.06));
      if (this.state.t[key] === '_') ring.position.y = 0.06;
      ring.userData.key = true;
      ring.renderOrder = 3;
      this.dynamic.add(ring);
      this.routeMarks.push(ring);
    }
  }

  newSelectionRing() {
    const ring = new Mesh(this.shared.ring, this.shared.hintMat);
    ring.renderOrder = 3;
    return ring;
  }

  clearRoute() {
    for (const m of this.routeMarks) this.dynamic.remove(m);
    this.routeMarks = [];
  }

  tapAt(i) {
    this.tapRing.position.copy(this.pos(i, this.tileY(this.state, i) + 0.04));
    this.tapRing.userData.t = 0;
  }

  // ---------- animation ----------

  tween(duration, fn, easing = ease.linear) {
    return new Promise((resolve) => {
      this.tweens.push({ t: 0, duration, fn, easing, resolve });
    });
  }

  finishTweens() {
    const list = this.tweens;
    this.tweens = [];
    for (const tw of list) {
      tw.fn(1);
      tw.resolve();
    }
  }

  moveObj(obj, from, to, { duration = STEP_TIME, arc = 0.08, face = true } = {}) {
    const a = from.clone();
    const b = to.clone();
    if (face && b.distanceToSquared(a) > 0.0001) {
      obj.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
    }
    return this.tween(duration, (k) => {
      obj.position.lerpVectors(a, b, k);
      obj.position.y += Math.sin(k * Math.PI) * arc;
    });
  }

  advanceFollowers(state, duration, hopArc) {
    const moves = [];
    for (const f of this.followers) {
      const i = this.trail[Math.min(f.slot, this.trail.length - 1)];
      const target = this.pos(i, this.tileY(state, i));
      if (i === state.p) {
        target.z += 0.28 * f.slot;
      }
      const dist = target.distanceTo(f.mesh.position);
      if (dist < 0.01) continue;
      moves.push(this.moveObj(f.mesh, f.mesh.position, target, { duration, arc: dist > 1.3 ? hopArc : 0.1 }));
    }
    return Promise.all(moves);
  }

  /** Play the visual result of a successful logic step. */
  async animate(r, prev, next) {
    const gen = this.gen;
    this.state = next;

    if (r.kind === 'open') {
      await this.openCage(next);
      if (gen !== this.gen) return;
    }
    if (r.kind === 'dig') {
      const hedge = this.terrainObjs.get(r.at);
      this.burst(this.pos(r.at, 0.3), { tex: this.tex.soft, color: 0x9a6a40, count: 14, speed: 2.2, size: 0.28 });
      this.wiggle(this.followers[0]?.mesh);
      if (hedge) await this.tween(0.22, (k) => hedge.scale.setScalar(1 - k * 0.9), ease.inOut);
      if (gen !== this.gen) return;
      this.syncTerrain(next, r.at);
    }

    const bees = this.moveBees(next);
    if (r.kind === 'wait') {
      const base = this.player.position.y;
      await Promise.all([bees, this.tween(0.2, (k) => (this.player.position.y = base + Math.sin(k * Math.PI) * 0.08))]);
      return;
    }

    const boulder = r.kind === 'push' ? this.animateBoulder(r, next, gen) : Promise.resolve();
    let prevTile = r.from;
    for (let k = 0; k < r.path.length; k++) {
      const tile = r.path[k];
      if (gen !== this.gen) return;
      if (r.teleport && tile === r.teleport.to && prevTile === r.teleport.from) {
        await this.burrowJump(r.teleport, next);
        prevTile = tile;
        continue;
      }
      if (r.caught && k === r.path.length - 1) {
        await this.caughtAnim(r, next);
        prevTile = tile;
        continue;
      }
      const hop = r.kind === 'hop' && k === 0;
      const duration = k === 0 ? (hop ? 0.34 : STEP_TIME) : SLIDE_TIME;
      const a = this.pos(prevTile, this.tileY(next, prevTile));
      const b = this.pos(tile, this.tileY(next, tile));
      this.trail.unshift(tile);
      this.trail.length = Math.min(this.trail.length, 6);
      const moves = [this.moveObj(this.player, a, b, { duration, arc: hop ? 0.7 : k === 0 ? 0.1 : 0 }), this.advanceFollowers(next, duration, hop ? 0.7 : 0.1)];
      if (k === 0 && r.collapsed?.includes(r.from)) this.collapse(r.from, next);
      if (k > 0 && next.t[tile] === '*') this.burst(b.clone().setY(0.05), { tex: this.tex.soft, color: 0xffffff, count: 3, speed: 0.8, size: 0.14, up: 0.8 });
      if (isWater(next.t[tile]) && (k > 0 || r.kind === 'swim')) {
        this.burst(b.clone().setY(-0.05), { tex: this.tex.soft, color: 0xe6f7ff, count: 4, speed: 1, size: 0.14, up: 1.2 });
      }
      if (hop) this.burst(a.clone(), { tex: this.tex.soft, color: 0xffffff, count: 6, speed: 1.2, size: 0.18 });
      await Promise.all(moves);
      prevTile = tile;
    }
    await Promise.all([boulder, bees]);
    if (gen !== this.gen) return;
    this.syncMechanics(next);
    this.updateShadows();
    if (next.won) await this.celebrate(next);
  }

  async animateBoulder(r, next, gen) {
    const b = this.boulders.get(r.at);
    if (!b) return;
    this.boulders.delete(r.at);
    let from = b.position.clone();
    for (let k = 0; k < r.boulderPath.length; k++) {
      const tile = r.boulderPath[k];
      const to = this.pos(tile, 0.33);
      const axis = new Vector3(to.z - from.z, 0, -(to.x - from.x)).normalize();
      const startQ = b.quaternion.clone();
      const a = from.clone();
      await this.tween(k === 0 ? STEP_TIME : SLIDE_TIME, (t) => {
        b.position.lerpVectors(a, to, t);
        b.quaternion.copy(startQ);
        b.rotateOnWorldAxis(axis, t * 1.6);
        b.userData.shadow.position.set(b.position.x, 0.01, b.position.z);
      });
      if (gen !== this.gen) return;
      from = to;
    }
    if (r.result === 'roll') {
      this.boulders.set(r.boulderTo, b);
      return;
    }
    this.dynamic.remove(b.userData.shadow);
    const plank = this.terrainObjs.get(r.boulderTo);
    if (plank && plank.userData.ch === '%') this.collapse(r.boulderTo, next);
    await this.tween(0.18, (k) => {
      b.position.y = MathUtils.lerp(0.33, -0.12, k);
    }, ease.inOut);
    if (gen !== this.gen) return;
    if (r.result === 'sink') {
      this.burst(this.pos(r.boulderTo, 0), { tex: this.tex.soft, color: 0xd8f3ff, count: 18, speed: 2.6, size: 0.24, up: 3 });
    } else {
      this.burst(this.pos(r.boulderTo, 0), { tex: this.tex.soft, color: 0xb08860, count: 12, speed: 1.8, size: 0.3 });
    }
    this.dynamic.remove(b);
    this.syncTerrain(next, r.boulderTo);
  }

  /** A crumbling bridge breaks and falls into its gap. */
  collapse(i, next) {
    const plank = this.terrainObjs.get(i);
    if (!plank) return;
    this.terrainObjs.delete(i);
    this.burst(this.pos(i, 0.05), { tex: this.tex.soft, color: 0xb08860, count: 10, speed: 1.6, size: 0.22 });
    this.tween(0.45, (k) => {
      plank.position.y = -k * k * 1.6;
      plank.rotation.z = k * 0.6;
    }).then(() => {
      this.dynamic.remove(plank);
      if (next.t[i] === '+') this.syncTerrain(next, i);
    });
  }

  async burrowJump({ from, to }, next) {
    const a = this.pos(from);
    const b = this.pos(to);
    const actors = [this.player, ...this.followers.map((f) => f.mesh)];
    this.burst(a.clone().setY(0.1), { tex: this.tex.soft, color: 0x8a5a36, count: 10, speed: 1.6, size: 0.22 });
    await this.tween(0.16, (k) => actors.forEach((o) => o.scale.setScalar(1 - k * 0.95)));
    this.trail = [to, to, to];
    this.player.position.copy(b);
    this.followers.forEach((f) => this.placeOnTile(f.mesh, to, next, f.slot));
    this.burst(b.clone().setY(0.1), { tex: this.tex.soft, color: 0x8a5a36, count: 10, speed: 1.6, size: 0.22 });
    await this.tween(0.2, (k) => actors.forEach((o) => o.scale.setScalar(0.05 + 0.95 * ease.back(k))));
  }

  async caughtAnim(r, next) {
    const at = this.pos(r.caught.at, 0.6);
    this.burst(at, { tex: this.tex.star, count: 12, speed: 2.5, size: 0.28 });
    const actors = [this.player, ...this.followers.map((f) => f.mesh)];
    await this.tween(0.32, (k) => {
      this.player.rotation.y += 0.5;
      actors.forEach((o) => o.scale.setScalar(Math.max(0.05, 1 - k)));
    });
    this.trail = [next.start, next.start, next.start];
    this.placeOnTile(this.player, next.start, next);
    this.followers.forEach((f) => this.placeOnTile(f.mesh, next.start, next, f.slot));
    this.burst(this.pos(next.start, 0.4), { tex: this.tex.soft, color: 0xffffff, count: 10, speed: 1.4, size: 0.24 });
    await this.tween(0.25, (k) => actors.forEach((o) => o.scale.setScalar(0.05 + 0.95 * ease.back(k))));
  }

  async openCage(next) {
    const cage = this.cage;
    if (!cage) return;
    const pet = cage.userData.pet;
    const at = cage.position.clone();
    this.burst(at.clone().setY(0.5), { tex: this.tex.star, count: 16, speed: 3, size: 0.32 });
    this.burst(at.clone().setY(0.6), { tex: this.tex.heart, count: 8, speed: 1.6, size: 0.34, up: 2.5, gravity: -1 });
    cage.remove(pet);
    pet.position.copy(at);
    this.dynamic.add(pet);
    await this.tween(0.28, (k) => {
      cage.scale.set(1 + k * 0.3, 1 - k, 1 + k * 0.3);
      pet.position.y = Math.sin(k * Math.PI) * 0.8;
      pet.rotation.y = k * Math.PI * 2;
    }, ease.out);
    this.dynamic.remove(cage);
    this.cage = null;
    this.dynamic.remove(pet);
    // The pet joins the party as a follower.
    this.rebuildFollowers(next);
    for (const f of this.followers) {
      if (f.kind === next.pet) {
        f.mesh.position.copy(at);
        f.mesh.scale.setScalar(1);
      } else {
        const tile = this.trail[Math.min(f.slot - 1, this.trail.length - 1)];
        this.placeOnTile(f.mesh, tile, next);
      }
    }
  }

  /** Swap the lead companion with a little puff. */
  switchCompanion(state) {
    this.state = state;
    this.rebuildFollowers(state);
    const lead = this.followers[0];
    if (lead) {
      this.burst(lead.mesh.position.clone().setY(0.3), { tex: this.tex.star, count: 8, speed: 1.8, size: 0.2 });
      const mesh = lead.mesh;
      this.tween(0.25, (k) => mesh.scale.setScalar(0.4 + 0.6 * ease.back(k)));
    }
    this.updateShadows();
  }

  wiggle(obj) {
    if (!obj) return;
    const base = obj.rotation.y;
    this.tween(0.3, (k) => {
      obj.rotation.y = base + Math.sin(k * Math.PI * 4) * 0.25 * (1 - k);
    });
  }

  /** Visual "no": head shake towards the blocked tile and a bump. */
  blocked(state, at) {
    const from = this.player.position.clone();
    const target = at >= 0 ? this.pos(at, from.y) : from.clone();
    const dir = target.clone().sub(from).normalize();
    if (dir.lengthSq() > 0) this.player.rotation.y = Math.atan2(dir.x, dir.z);
    const base = this.player.rotation.y;
    this.tween(0.32, (k) => {
      this.player.position.copy(from).addScaledVector(dir, Math.sin(k * Math.PI) * 0.12);
      this.player.rotation.y = base + Math.sin(k * Math.PI * 4) * 0.35 * (1 - k);
    });
  }

  async celebrate(state) {
    const home = this.pos(state.exit, 0.9);
    for (let n = 0; n < 3; n++) {
      setTimeout(() => {
        this.burst(home, { tex: this.tex.heart, count: 10, speed: 2.2, size: 0.38, up: 3, gravity: -2 });
        this.burst(home, { tex: this.tex.star, count: 12, speed: 3.2, size: 0.26, up: 3 });
      }, n * 260);
    }
    const actors = [this.player, ...this.followers.map((f) => f.mesh)];
    const bases = actors.map((a) => a.position.y);
    await this.tween(1.1, (k) => {
      actors.forEach((a, j) => {
        a.position.y = bases[j] + Math.abs(Math.sin((k * 3 + j * 0.3) * Math.PI)) * 0.35;
        a.rotation.y += 0.02;
      });
    });
  }

  burst(at, { tex, color = 0xffffff, count = 10, speed = 2, size = 0.25, up = 2, gravity = -6 }) {
    for (let n = 0; n < count; n++) {
      const mat = new SpriteMaterial({ map: tex, color, transparent: true, depthWrite: false });
      if (tex === this.tex.star) mat.blending = AdditiveBlending;
      const s = new Sprite(mat);
      s.position.copy(at);
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.6);
      s.userData = {
        vel: new Vector3(Math.cos(a) * v * 0.6, up * (0.5 + Math.random() * 0.5), Math.sin(a) * v * 0.6),
        life: 0.7 + Math.random() * 0.4,
        age: 0,
        size: size * (0.7 + Math.random() * 0.6),
        gravity,
      };
      s.scale.setScalar(s.userData.size);
      this.fx.add(s);
      this.particles.push(s);
    }
  }

  // ---------- frame ----------

  update(dt) {
    this.time += dt;
    if (this.tweens.length) {
      const active = this.tweens;
      this.tweens = [];
      const keep = [];
      for (const tw of active) {
        tw.t += dt * this.speed;
        const k = Math.min(1, tw.t / tw.duration);
        tw.fn(tw.easing(k));
        if (k >= 1) tw.resolve();
        else keep.push(tw);
      }
      this.tweens.push(...keep);
    }
    for (let n = this.particles.length - 1; n >= 0; n--) {
      const p = this.particles[n];
      const u = p.userData;
      u.age += dt;
      u.vel.y += u.gravity * dt;
      p.position.addScaledVector(u.vel, dt);
      const k = u.age / u.life;
      p.material.opacity = 1 - k * k;
      p.scale.setScalar(u.size * (1 - k * 0.4));
      if (k >= 1) {
        this.fx.remove(p);
        p.material.dispose();
        this.particles.splice(n, 1);
      }
    }
    this.shared.water.map.offset.set(this.time * 0.05, this.time * 0.03);
    this.shared.current.map.offset.y = -this.time * 0.9;
    if (this.mode === 'garden') {
      this.garden?.update(dt, this.time);
    } else if (this.level && this.state) {
      const goal = this.state.rescued ? this.state.exit : this.state.cage;
      const gp = this.pos(goal, (this.state.rescued ? 1.35 : 1.15) + Math.sin(this.time * 3) * 0.08);
      this.pin.position.copy(gp);
      this.pin.rotation.y = this.time * 1.5;
      this.pin.visible = !this.state.won;
      const pulse = 0.5 + 0.5 * Math.sin(this.time * 4);
      this.shared.ringMat.opacity = 0.45 + 0.45 * pulse;
      for (const r of this.targetRings) r.scale.setScalar(0.9 + 0.12 * Math.sin(this.time * 4 + r.userData.phase));
      for (const m of this.routeMarks) m.scale.setScalar(m.userData.key ? 1.15 + 0.2 * pulse : 0.85 + 0.25 * Math.max(0, Math.sin(this.time * 5 - m.userData.phase)));
      const tr = this.tapRing.userData;
      if (tr.t !== undefined && tr.t < 1) {
        tr.t += dt * 2.5;
        this.shared.tapMat.opacity = 0.9 * (1 - tr.t);
        this.tapRing.scale.setScalar(0.6 + tr.t * 0.6);
      }
      // Idle breathing so characters feel alive.
      const breathe = 1 + Math.sin(this.time * 5) * 0.02;
      if (Math.abs(this.player.scale.x - 1) < 0.001) this.player.scale.y = breathe;
      for (const f of this.followers) f.mesh.scale.y = f.mesh.scale.x * (1 + Math.sin(this.time * 5 + f.slot) * 0.03);
      if (this.cage?.userData.pet) this.cage.userData.pet.rotation.y = Math.sin(this.time * 1.4) * 0.6;
      for (const bee of this.bees) {
        const [l, r] = bee.userData.wings;
        l.rotation.z = Math.sin(this.time * 60) * 0.6;
        r.rotation.z = -l.rotation.z;
      }
      this.updateShadows();
    }
    this.renderer.render(this.scene, this.camera);
    this.adaptQuality(dt);
  }

  // Lower the resolution on slow devices to keep the frame rate smooth.
  adaptQuality(dt) {
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 120) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes = [];
    if (avg > 1 / 45 && this.pixelRatio > 1) {
      this.pixelRatio = Math.max(1, this.pixelRatio - 0.25);
      this.renderer.setPixelRatio(this.pixelRatio);
      this.resize();
    }
  }
}
