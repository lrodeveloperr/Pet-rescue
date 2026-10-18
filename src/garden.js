// The pet garden: every rescued species lives here, wandering about. Decorations appear as
// the player earns stars, and each completed album set adds a souvenir from its world.
// Players can move decorations and give pets hats. Rendered by the World in 'garden' mode.
import { Mesh, Vector3 } from 'three';
import { animalHatSpot, buildAnimal, buildHat, buildHouse, flatMaterial } from './models.js';

// Square, so it fills portrait and landscape screens equally well.
const W = 9;
const H = 9;
const HOUSE = 1 * W + 4;
const PLAYER = 2 * W + 4;

// Decorations unlock at these star totals, in order; all are reachable with mostly 2-star play.
// Each has a default spot; players can move them.
export const DECORATIONS = [
  { key: 'd0', kind: 'flowerbed', stars: 5, at: [2, 6] },
  { key: 'd1', kind: 'bench', stars: 20, at: [6, 6] },
  { key: 'd2', kind: 'lamp', stars: 40, at: [1, 3] },
  { key: 'd3', kind: 'pond', stars: 70, at: [6, 3] },
  { key: 'd4', kind: 'swing', stars: 110, at: [2, 2] },
  { key: 'd5', kind: 'fountain', stars: 160, at: [4, 4] },
  { key: 'd6', kind: 'hay', stars: 220, at: [7, 5] },
  { key: 'd7', kind: 'windmill', stars: 290, at: [7, 1] },
  { key: 'd8', kind: 'flowerbed', stars: 360, at: [4, 7] },
  { key: 'd9', kind: 'lamp', stars: 430, at: [7, 7] },
  { key: 'd10', kind: 'mushroom', stars: 510, at: [1, 7] },
  { key: 'd11', kind: 'bench', stars: 600, at: [1, 5] },
];

// A permanent souvenir for each world whose album set is complete.
export const SOUVENIRS = {
  meadow: { key: 's-meadow', kind: 'apple', at: [1, 1] },
  river: { key: 's-river', kind: 'reeds', at: [5, 7] },
  snow: { key: 's-snow', kind: 'snowmound', at: [6, 1] },
  farm: { key: 's-farm', kind: 'fence', at: [3, 5] },
  canyon: { key: 's-canyon', kind: 'cactus', at: [5, 5] },
  woods: { key: 's-woods', kind: 'darkpine', at: [2, 1] },
};

export function unlockedDecorations(stars) {
  return DECORATIONS.filter((d) => stars >= d.stars);
}

export function nextDecoration(stars) {
  return DECORATIONS.find((d) => stars < d.stars) ?? null;
}

const inside = (i) => {
  const x = i % W;
  const y = Math.floor(i / W);
  return x > 0 && y > 0 && x < W - 1 && y < H - 1;
};

export class Garden {
  /**
   * @param animals [{ kind, variant, hat }]
   * @param souvenirs world keys with a completed album set
   * @param layout saved decoration spots { key: tile }
   */
  constructor(world, { animals, stars, souvenirs = [], layout = {} }) {
    this.world = world;
    const level = { w: W, h: H, terrain: [], bees: [], exit: 4 };
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) level.terrain.push(x === 0 || y === 0 || x === W - 1 || y === H - 1 ? '#' : '.');
    }
    world.mode = 'garden';
    world.level = level;
    world.setTheme('meadow');
    world.clearGroup(world.board);
    world.clearGroup(world.dynamic);
    world.finishTweens();
    world.state = null;
    world.bees = [];
    world.followers = [];
    world.routeMarks = [];
    const s = world.shared;
    const solid = level.terrain.map((_, i) => i);
    world.groundBlocks(solid, [s.groundSide, s.groundSide, s.groundTop, s.groundBottom, s.groundSide, s.groundSide]);
    const border = solid.filter((i) => level.terrain[i] === '#');
    world.scatter('tree0', border.filter((i) => i % 3 === 0));
    world.scatter('tree1', border.filter((i) => i % 3 === 1));
    world.scatter('shrub0', border.filter((i) => i % 3 === 2));

    const house = buildHouse();
    house.position.copy(world.pos(HOUSE));
    world.board.add(house);

    // Decorations and souvenirs, at saved spots when those are still free.
    const items = [...unlockedDecorations(stars), ...souvenirs.map((k) => SOUVENIRS[k]).filter(Boolean)];
    this.decorations = new Map();
    const taken = new Set([HOUSE, PLAYER]);
    const place = (item, tile) => {
      const m = new Mesh(world.prop(item.kind), flatMaterial);
      m.position.copy(world.pos(tile));
      world.dynamic.add(m);
      this.decorations.set(item.key, { ...item, mesh: m, tile });
      taken.add(tile);
    };
    const later = [];
    for (const item of items) {
      const saved = layout[item.key];
      if (Number.isInteger(saved) && inside(saved) && !taken.has(saved)) place(item, saved);
      else later.push(item);
    }
    for (const item of later) {
      let tile = item.at[1] * W + item.at[0];
      if (taken.has(tile)) tile = [...Array(W * H).keys()].find((i) => inside(i) && !taken.has(i)) ?? tile;
      place(item, tile);
    }

    world.player.position.copy(world.pos(PLAYER));
    world.player.rotation.set(0, 0, 0);
    world.player.scale.setScalar(1);
    world.player.visible = true;
    world.dynamic.add(world.player);

    this.selection = world.newSelectionRing();
    this.selection.visible = false;
    world.dynamic.add(this.selection);
    this.editing = false;
    this.selected = null;

    // One wandering animal per rescued species, in its newest look and chosen hat.
    this.pets = animals.map((a, k) => {
      const mesh = buildAnimal(a.kind, a.variant ?? 0);
      const open = this.openTiles();
      const start = open[(k * 7) % open.length];
      mesh.position.copy(world.pos(start));
      mesh.rotation.y = (k * 1.7) % (Math.PI * 2);
      world.dynamic.add(mesh);
      const pet = { kind: a.kind, mesh, target: null, wait: 0.5 + (k % 5) * 0.4, hop: 0, hat: null };
      this.setPetHat(pet, a.hat ?? null);
      return pet;
    });
    world.fit();
  }

  openTiles() {
    const blocked = new Set([HOUSE, PLAYER, ...[...this.decorations.values()].map((d) => d.tile)]);
    const open = [];
    for (let i = 0; i < W * H; i++) if (inside(i) && !blocked.has(i)) open.push(i);
    return open;
  }

  setPetHat(pet, hat) {
    if (pet.hatMesh) pet.mesh.remove(pet.hatMesh);
    pet.hatMesh = null;
    pet.hat = hat;
    if (!hat) return;
    const spot = animalHatSpot(pet.kind);
    const m = buildHat(hat);
    m.scale.setScalar(0.85);
    m.position.set(spot.x, spot.y, spot.z);
    pet.mesh.add(m);
    pet.hatMesh = m;
  }

  setEditing(on) {
    this.editing = on;
    this.select(null);
  }

  select(key) {
    this.selected = key;
    const d = key ? this.decorations.get(key) : null;
    this.selection.visible = Boolean(d);
    if (d) this.selection.position.copy(this.world.pos(d.tile, 0.04));
  }

  tileAt(clientX, clientY) {
    const hit = this.world.groundHit(clientX, clientY);
    if (!hit) return -1;
    const x = Math.round(hit.x + (W - 1) / 2);
    const y = Math.round(hit.z + (H - 1) / 2);
    if (x < 0 || y < 0 || x >= W || y >= H) return -1;
    return y * W + x;
  }

  decorationAt(tile) {
    for (const [key, d] of this.decorations) if (d.tile === tile) return key;
    return null;
  }

  /** Moves the selected decoration to a free tile; returns the new spot or -1. */
  moveSelected(tile) {
    const d = this.selected && this.decorations.get(this.selected);
    if (!d || !inside(tile) || tile === HOUSE || tile === PLAYER || this.decorationAt(tile)) return -1;
    d.tile = tile;
    d.mesh.position.copy(this.world.pos(tile));
    this.world.burst(this.world.pos(tile, 0.2), { tex: this.world.tex.soft, color: 0xffffff, count: 8, speed: 1.4, size: 0.2 });
    this.select(null);
    this.open = null;
    // Pets standing there walk away.
    const at = this.world.pos(tile);
    const open = (this.open = this.openTiles());
    for (const p of this.pets) {
      if (Math.hypot(p.mesh.position.x - at.x, p.mesh.position.z - at.z) < 0.8) {
        p.target = this.world.pos(open[Math.floor(Math.random() * open.length)]);
        p.wait = 0;
      }
    }
    return tile;
  }

  update(dt, time) {
    if (this.selected) this.selection.scale.setScalar(1 + Math.sin(time * 6) * 0.08);
    const open = (this.open ??= this.openTiles());
    for (const p of this.pets) {
      if (p.hop > 0) {
        p.hop = Math.max(0, p.hop - dt);
        p.mesh.position.y = Math.sin((1 - p.hop / 0.5) * Math.PI) * 0.5;
        continue;
      }
      if (!p.target) {
        p.wait -= dt;
        p.mesh.position.y = 0;
        if (p.wait <= 0) p.target = this.world.pos(open[Math.floor(Math.random() * open.length)]);
        continue;
      }
      const d = new Vector3().subVectors(p.target, p.mesh.position);
      d.y = 0;
      const dist = d.length();
      if (dist < 0.05) {
        p.target = null;
        p.wait = 1 + Math.random() * 3;
        continue;
      }
      p.mesh.rotation.y = Math.atan2(d.x, d.z);
      p.mesh.position.addScaledVector(d.normalize(), Math.min(dist, dt * 1.1));
      p.mesh.position.y = Math.abs(Math.sin(time * 12)) * 0.05;
    }
    this.world.player.rotation.y = Math.sin(time * 0.6) * 0.5;
  }

  /** The pet nearest a screen point, if any, made to hop. */
  petAt(clientX, clientY) {
    const hit = this.world.groundHit(clientX, clientY);
    if (!hit) return null;
    let best = null;
    let bestD = 0.7;
    for (const p of this.pets) {
      const d = Math.hypot(p.mesh.position.x - hit.x, p.mesh.position.z - hit.z);
      if (d < bestD) {
        best = p;
        bestD = d;
      }
    }
    if (best) {
      best.hop = 0.5;
      this.world.burst(best.mesh.position.clone().setY(0.7), { tex: this.world.tex.heart, count: 5, speed: 1.2, size: 0.3, up: 2, gravity: -1 });
    }
    return best;
  }
}
