// The pet garden: every rescued species lives here, wandering about. Decorations appear as
// the player earns stars. Rendered by the World in 'garden' mode.
import { Mesh, Vector3 } from 'three';
import { buildAnimal, buildHouse, flatMaterial } from './models.js';

// Square, so it fills portrait and landscape screens equally well.
const W = 9;
const H = 9;

// Decorations unlock at these star totals, in order. Each has a fixed spot in the garden.
export const DECORATIONS = [
  { kind: 'flowerbed', stars: 5, at: [2, 6] },
  { kind: 'bench', stars: 20, at: [6, 6] },
  { kind: 'lamp', stars: 40, at: [1, 3] },
  { kind: 'pond', stars: 70, at: [6, 3] },
  { kind: 'swing', stars: 110, at: [2, 2] },
  { kind: 'fountain', stars: 160, at: [4, 4] },
  { kind: 'hay', stars: 220, at: [7, 5] },
  { kind: 'windmill', stars: 300, at: [7, 1] },
  { kind: 'flowerbed', stars: 400, at: [4, 7] },
  { kind: 'lamp', stars: 500, at: [7, 7] },
  { kind: 'mushroom', stars: 650, at: [1, 7] },
  { kind: 'bench', stars: 800, at: [1, 5] },
];

export function unlockedDecorations(stars) {
  return DECORATIONS.filter((d) => stars >= d.stars);
}

export function nextDecoration(stars) {
  return DECORATIONS.find((d) => stars < d.stars) ?? null;
}

export class Garden {
  constructor(world, { animals, stars }) {
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
    const s = world.shared;
    const solid = level.terrain.map((_, i) => i);
    world.groundBlocks(solid, [s.groundSide, s.groundSide, s.groundTop, s.groundBottom, s.groundSide, s.groundSide]);
    const border = solid.filter((i) => level.terrain[i] === '#');
    world.scatter('tree0', border.filter((i) => i % 3 === 0));
    world.scatter('tree1', border.filter((i) => i % 3 === 1));
    world.scatter('shrub0', border.filter((i) => i % 3 === 2));

    const house = buildHouse();
    house.position.copy(world.pos(1 * W + 4));
    world.board.add(house);
    this.blocked = new Set([1 * W + 4]);
    for (const d of unlockedDecorations(stars)) {
      const m = new Mesh(world.prop(d.kind), flatMaterial);
      const i = d.at[1] * W + d.at[0];
      m.position.copy(world.pos(i));
      world.board.add(m);
      this.blocked.add(i);
    }

    world.player.position.copy(world.pos(2 * W + 4));
    world.player.rotation.set(0, 0, 0);
    world.player.scale.setScalar(1);
    world.player.visible = true;
    world.dynamic.add(world.player);

    // One wandering animal per rescued species.
    const open = [];
    for (let i = 0; i < W * H; i++) if (level.terrain[i] === '.' && !this.blocked.has(i) && i !== 2 * W + 4) open.push(i);
    this.open = open;
    this.pets = animals.map((kind, k) => {
      const mesh = buildAnimal(kind);
      const start = open[(k * 7) % open.length];
      mesh.position.copy(world.pos(start));
      mesh.rotation.y = (k * 1.7) % (Math.PI * 2);
      world.dynamic.add(mesh);
      return { kind, mesh, target: null, wait: 0.5 + (k % 5) * 0.4, hop: 0 };
    });
    world.fit();
  }

  update(dt, time) {
    for (const p of this.pets) {
      if (p.hop > 0) {
        p.hop = Math.max(0, p.hop - dt);
        p.mesh.position.y = Math.sin((1 - p.hop / 0.5) * Math.PI) * 0.5;
        continue;
      }
      if (!p.target) {
        p.wait -= dt;
        p.mesh.position.y = 0;
        if (p.wait <= 0) {
          const i = this.open[Math.floor(Math.random() * this.open.length)];
          p.target = this.world.pos(i);
        }
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
