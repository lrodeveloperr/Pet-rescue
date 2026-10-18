// Visual themes per world: ground, sky, light and which props stand in for trees.
// `tall` props line the back and sides; `low` props fill the rest so nothing hides a character.
export const THEMES = {
  meadow: {
    sky: 0xbfe6f5, top: 0x8fd36a, side: 0xa8774c, bottom: 0x6e4a2c, ice: 0xdff3ff,
    tall: ['tree0', 'tree1'], low: ['shrub0', 'shrub1'], flowers: [0xffffff, 0xffe066, 0xff8fab, 0xb9a6ff],
    hemi: [0xffffff, 0x7a9a6a, 1.6], sun: 1.7,
  },
  river: {
    sky: 0xb8e4f2, top: 0x9edb6e, side: 0x9a7048, bottom: 0x6a4a2c, ice: 0xdff3ff,
    tall: ['willow', 'tree0'], low: ['reeds', 'shrub0'], flowers: [0xffffff, 0x9fd8ff, 0xffe066],
    hemi: [0xffffff, 0x6a9a8a, 1.6], sun: 1.7,
  },
  snow: {
    sky: 0xd6e8f6, top: 0xf2f6fb, side: 0x9fb3c8, bottom: 0x6f8296, ice: 0xbfe6ff,
    tall: ['snowpine'], low: ['snowmound', 'shrub1'], flowers: [],
    hemi: [0xffffff, 0x9fb3c8, 1.5], sun: 1.5,
  },
  farm: {
    sky: 0xcfe9f5, top: 0xa9d36a, side: 0xa8774c, bottom: 0x6e4a2c, ice: 0xdff3ff,
    tall: ['apple', 'tree0'], low: ['hay', 'fence'], flowers: [0xffffff, 0xffe066, 0xff8fab],
    hemi: [0xffffff, 0x8a9a6a, 1.6], sun: 1.8,
  },
  canyon: {
    sky: 0xf6dcc0, top: 0xe7b779, side: 0xc0703f, bottom: 0x8a4a2a, ice: 0xdff3ff,
    tall: ['cactus'], low: ['redrock', 'cactus'], flowers: [0xff7aa8, 0xffe066],
    hemi: [0xfff4e6, 0xc08a5a, 1.6], sun: 1.9,
  },
  woods: {
    sky: 0xa9cbe0, top: 0x6fae5a, side: 0x7a5236, bottom: 0x4a3220, ice: 0xdff3ff,
    tall: ['darkpine', 'tree1'], low: ['mushroom', 'shrub0'], flowers: [0xffe066, 0xb9a6ff],
    hemi: [0xe8f0ff, 0x5a7a5a, 1.45], sun: 1.5,
  },
};

export const WORLD_KEYS = Object.keys(THEMES);
